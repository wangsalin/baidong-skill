"""制作前校验固定资产、声音确认状态；渲染前另核对真实音频来源。"""
import argparse
import hashlib
import json
import re
import runpy
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def audio_key(line, profile):
    values = {k: line.get(k) for k in ('id', 'who', 'voice', 'rate', 'pitch')}
    values['say'] = line.get('say', line['text'])
    values['profile_sha256'] = profile
    return hashlib.sha256(json.dumps(values, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def visual_key(root):
    files = list(root.glob('*.js')) + [root / 'index.html', root / 'episode.json', root / 'lines.json']
    files += list((root / 'fonts').glob('*.woff2')) + [root / 'fonts/fonts.css']
    files += [root / 'voices/dur.json', root / 'voices/lips.json']
    return hashlib.sha256(json.dumps({p.relative_to(root).as_posix(): digest(p) for p in sorted(files)}, sort_keys=True).encode()).hexdigest()


def validate(root, phase='draft'):
    config = read(root / 'episode.json')
    stage = config.get('stage', 'preview')
    aspect = config.get('aspect', 'landscape')
    if stage not in ('preview', 'final') or aspect not in ('landscape', 'portrait'):
        raise ValueError('stage/aspect 无效，禁止静默回退。')
    if 'preview_watermark' in config and type(config['preview_watermark']) is not bool:
        raise ValueError('preview_watermark 必须为布尔值；它只控制画面水印，不改变声音认可状态。')
    contract = read(root / 'production-contract.json')
    source = root / '.baidong.json'
    canonical = None
    if source.is_file():
        skill = Path(read(source)['skill_root'])
        # Windows 创建的工程会同时保存 native/WSL 路径。
        if not skill.is_dir() and read(source).get('native_skill_root'):
            skill = Path(read(source)['native_skill_root'])
        canonical = skill / 'assets/episode-template'
        if not (canonical / 'production-contract.json').is_file():
            raise ValueError('源 Skill 不可用，不能核实制作约束；恢复 .baidong.json 对应路径，或从当前安装的 Skill 新建工程。')
        if contract != read(canonical / 'production-contract.json'):
            raise ValueError('工程制作约束与源 Skill 不一致；不能在单期中重建约束以绕过检查。')
    for name, expected in contract['locked_files'].items():
        path = root / name
        if not path.is_file() or digest(path) != expected:
            raise ValueError(f'固定资产被修改或缺失：{name}；仅编辑 scenes.js / portrait.js / story.js / lines.json 等本期内容。')
    for name in ('scenes.js', 'portrait.js', 'story.js', 'lines.json'):
        if not (root / name).is_file():
            raise ValueError(f'缺少本期内容：{name}')
    refs = read((canonical or root) / 'voice-reference.json')
    lines = read(root / 'lines.json')
    if stage == 'final':
        pending = []
        for who in sorted({line['who'] for line in lines}):
            spec = refs.get(config['language'], {}).get(who, {})
            if spec.get('status') != 'approved' or not spec.get('approval_evidence'):
                pending.append(who)
                continue
            sample = (canonical or root) / spec['sample']
            if not sample.is_file() or digest(sample) != spec.get('sample_sha256') or spec.get('profile_sha256') != contract['locked_files']['voice.py']:
                raise ValueError(f'{who} 认可样音或后处理版本不匹配。')
            expected = spec.get('config', {})
            if any(any(line.get(k) != expected.get(k) for k in ('voice', 'rate', 'pitch')) for line in lines if line['who'] == who):
                raise ValueError(f'{who} 声音参数与认可样音不一致。')
        if pending:
            raise ValueError('声音尚无最终认可记录：' + ', '.join(pending) + '；只允许 stage=preview 的带标记样片，不得冒充正式交付。')
    if phase == 'render':
        provenance = read(root / 'voices/source.json')
        profile = digest(root / 'voice.py')
        durs, lips = read(root / 'voices/dur.json'), read(root / 'voices/lips.json')
        css = root / 'fonts/fonts.css'
        if not css.is_file():
            raise ValueError('缺少本期字体；先运行 fonts/fetch_fonts.py，不能用系统回退字体交付。')
        for name in re.findall(r'url\([\'"]?([^\'"\)]+)', css.read_text(encoding='utf-8')):
            if not (css.parent / name).is_file():
                raise ValueError('字体文件缺失：' + name)
        font = runpy.run_path(str(root / 'fonts/fetch_fonts.py'))
        if read(root / 'fonts/coverage.json').get('chars_sha256') != hashlib.sha256(font['chars']().encode()).hexdigest():
            raise ValueError('字体覆盖已过期；画面文字或台词改变后重新运行 fonts/fetch_fonts.py。')
        for line in lines:
            item = provenance.get(line['id'], {})
            wav = root / 'voices' / (line['id'] + '.wav')
            if item.get('key') != audio_key(line, profile) or not wav.is_file() or item.get('wav_sha256') != digest(wav):
                raise ValueError('配音与当前角色/台词/后处理不一致：' + line['id'] + '；重新执行 tts、voice、asr，不能复用旧音频。')
            with wave.open(str(wav), 'rb') as audio:
                duration = audio.getnframes() / audio.getframerate()
            if abs(durs.get(line['id'], -1) - duration) > .003 or not lips.get(line['id'], {}).get('o'):
                raise ValueError('真实配音时长或口型数据缺失/过期：' + line['id'])
        stamp = read(root / 'voices/asr-current.json')
        if stamp.get('source_sha256') != digest(root / 'voices/source.json'):
            raise ValueError('ASR 未通过当前配音版本，重新运行配音听写校验。')
    return {'passed': True, 'stage': stage, 'aspect': aspect, 'phase': phase,
            'voice_status': 'approved' if stage == 'final' else 'candidate-preview-only'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--phase', choices=('draft', 'render'), default='draft')
    parser.add_argument('--record-asr-success', action='store_true', help='仅由构建脚本在 ASR 命令成功退出后调用')
    parser.add_argument('--record-video-success', action='store_true')
    parser.add_argument('--verify-video', action='store_true')
    args = parser.parse_args()
    try:
        if args.record_asr_success:
            path = HERE / 'voices/asr-current.json'
            path.write_text(json.dumps({'source_sha256': digest(HERE / 'voices/source.json')}), encoding='utf-8')
            print('Recorded successful ASR for current voice sources.')
        elif args.record_video_success:
            (HERE / 'out/video-source.json').write_text(json.dumps({'source_sha256': visual_key(HERE), 'video_sha256': digest(HERE / 'out/video.mp4')}), encoding='utf-8')
        elif args.verify_video:
            stamp=read(HERE / 'out/video-source.json')
            if stamp.get('source_sha256')!=visual_key(HERE) or stamp.get('video_sha256')!=digest(HERE / 'out/video.mp4'):
                raise ValueError('旧画面与当前镜头/字幕/声音时码不匹配，必须重新渲染。')
        else:
            print(json.dumps(validate(HERE, args.phase), ensure_ascii=False))
    except (ValueError, KeyError, OSError, TypeError, wave.Error) as exc:
        raise SystemExit('production check failed: ' + str(exc))
