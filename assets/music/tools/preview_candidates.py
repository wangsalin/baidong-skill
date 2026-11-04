"""用同一段已制作的真实问答，生成等响度配乐候选试听。"""
import argparse
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf
from scipy.ndimage import maximum_filter1d, uniform_filter1d
from scipy.signal import fftconvolve

ap = argparse.ArgumentParser(description=__doc__)
ap.add_argument('--voice-project', type=Path, required=True)
ap.add_argument('--skill-root', type=Path, required=True)
args = ap.parse_args()
LIB = Path(__file__).resolve().parent.parent
OUT = LIB / 'previews/20261104'
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(args.skill_root / 'assets/lemo-runtime/core/audio'))
from sfx import SR, add, compress

catalog = json.loads((LIB / 'catalog.json').read_text(encoding='utf-8'))
tracks = [t for t in catalog['tracks'] if t.get('priority') in {'new_candidate_pending_user_listen', 'user_approved_library'}]
events_path = args.voice_project / 'events.json'
events = json.loads(events_path.read_text(encoding='utf-8'))
END = 22.446  # 本期第二段场景结束：完整问题、直接答案与供货机制解释。
N = round(END * SR)
VOICE_START = 8
TOTAL = VOICE_START + END
vob = np.zeros((N, 2))
voice_sources = []
for event in events['ev']:
    if event['type'] != 'vo' or event['t'] >= END:
        continue
    path = args.voice_project / 'voices' / (event['id'] + '.wav')
    y, sr = sf.read(path)
    if sr != SR or y.ndim != 1:
        raise ValueError(f'Expected {SR}Hz mono voice: {path}')
    y = compress(y / (np.abs(y).max() + 1e-9), .28, 3.2)
    y *= .12 / (np.sqrt((y ** 2).mean()) + 1e-9)
    add(vob, y, event['t'], .9, -.1)
    voice_sources.append({'id': event['id'], 'who': event['who'], 'start_seconds': event['t'], 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
er = np.zeros(round(.09 * SR))
er[0] = 1
for delay, gain in [(.011, .25), (.019, .18), (.031, .12), (.047, .08), (.067, .05)]:
    er[round(delay * SR)] += gain
vob = np.stack([fftconvolve(vob[:, k], er)[:N] for k in range(2)], 1)


def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True)


def loudness(path, target=-16):
    p = run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-vn', '-af', f'loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
    text = p.stderr.decode('utf-8', 'replace')
    # FFmpeg 8 在 JSON 后仍会输出封装统计，不能把日志尾部当成完整 JSON。
    return json.JSONDecoder().raw_decode(text[text.rfind('{'):])[0]


def normalize(array, target, folder, stem, static=False):
    source = folder / (stem + '-raw.wav')
    dest = folder / (stem + '-normalized.wav')
    sf.write(source, array, SR, subtype='FLOAT')
    m = loudness(source, target)
    if static:
        gain_db = target - float(m['input_i'])
        if float(m['input_tp']) + gain_db > -1.8:
            raise ValueError('Not enough peak headroom for a static loudness match: ' + stem)
        return array * 10 ** (gain_db / 20)
    f = (f'loudnorm=I={target}:TP=-1.5:LRA=11:measured_I={m["input_i"]}'
         f':measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}'
         f':measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true')
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-af', f, '-ar', str(SR), '-c:a', 'pcm_f32le', str(dest)])
    result, sr = sf.read(dest)
    return result[:len(array)]


def db(array):
    return float(20 * np.log10(np.sqrt(np.mean(array ** 2)) + 1e-12))


def encode(array, path, target_lufs=None):
    wav = path.with_suffix('.wav')
    sf.write(wav, array, SR, subtype='FLOAT')
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-c:a', 'libmp3lame', '-b:a', '192k', '-ar', str(SR), str(path)])
    run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(path), '-f', 'null', '-'])
    measurement = loudness(path)
    correction_db = 0
    if target_lufs is not None:
        correction_db = target_lufs - float(measurement['input_i'])
        factor = 10 ** (correction_db / 20)
        if float(measurement['input_tp']) + correction_db > -1.5 or np.abs(array).max() * factor >= .98:
            raise ValueError('Encoded loudness correction would exceed peak headroom: ' + str(path))
        # 以最终 MP3 的实测值校准，不能把编码前 PCM 的响度当作最终试听值。
        sf.write(wav, array * factor, SR, subtype='FLOAT')
        run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-c:a', 'libmp3lame', '-b:a', '192k', '-ar', str(SR), str(path)])
        run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(path), '-f', 'null', '-'])
        measurement = loudness(path)
    wav.unlink()
    return {'path': path.name, 'duration_seconds': len(array) / SR,
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'integrated_lufs': float(measurement['input_i']), 'true_peak_dbtp': float(measurement['input_tp']),
            'encoded_loudness_correction_db': correction_db,
            'full_audio_decode': 'passed'}


cards = []
records = []
with tempfile.TemporaryDirectory(prefix='baidong-bgm-') as temp:
    temp = Path(temp)
    voice = normalize(vob, -16, temp, 'dialogue')
    activity = np.max(np.abs(voice), axis=1) > .01
    report_voice = {'path': str(args.voice_project), 'events_sha256': hashlib.sha256(events_path.read_bytes()).hexdigest(),
                    'from_seconds': 0, 'to_seconds': END, 'source': '原始逐句WAV按原时间线和处理重建；没有读取含旧BGM的mix.wav。',
                    'voices': voice_sources}
    for number, track in enumerate(tracks, 1):
        source = LIB / track['audio_path']
        if hashlib.sha256(source.read_bytes()).hexdigest() != track['audio_sha256']:
            raise ValueError('Source digest mismatch: ' + str(source))
        raw = run(['ffmpeg', '-v', 'error', '-ss', str(track['preview_start_seconds']), '-i', str(source), '-t', str(TOTAL), '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-']).stdout
        music = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
        if len(music) != round(TOTAL * SR):
            raise ValueError('Preview source is shorter than required: ' + track['title'])
        music[:round(.25 * SR)] *= np.linspace(0, 1, round(.25 * SR))[:, None]
        music = normalize(music, -20, temp, 'music-' + str(number))
        bed = music[VOICE_START * SR:].copy()
        talk = uniform_filter1d(maximum_filter1d(activity.astype(float), round(.35 * SR)), round(.2 * SR))
        duck = 1 - .6 * talk
        bed *= duck[:, None]
        gain = 10 ** ((db(voice[activity]) - 16 - db(bed[activity])) / 20)
        bed *= gain
        combined = music.copy()
        ramp = round(.3 * SR)
        a = VOICE_START * SR - ramp
        combined[a:VOICE_START * SR] *= np.linspace(1, gain * duck[0], ramp)[:, None]
        combined[VOICE_START * SR:] = voice + bed
        fade = round(.5 * SR)
        combined[-fade:] *= np.linspace(1, 0, fade)[:, None]
        pure = music[:25 * SR].copy()
        pure[-fade:] *= np.linspace(1, 0, fade)[:, None]
        pure = normalize(pure, -20, temp, 'pure-' + str(number), static=True)
        dialogue = voice + bed
        dialogue[-fade:] *= np.linspace(1, 0, fade)[:, None]
        slug = track['id'].removeprefix('kevin-macleod-')
        stem = f'{number:02d}-{slug}'
        products = [encode(data, OUT / (stem + suffix + '.mp3'), -20 if suffix == '-pure' else None) for suffix, data in
                    [('-pure', pure), ('-dialogue', dialogue), ('-demo', combined)]]
        if abs(products[0]['integrated_lufs'] + 20) > .5:
            raise ValueError('Music-only preview loudness is outside target: ' + repr(products[0]))
        if any(p['true_peak_dbtp'] > -1.5 for p in products):
            raise ValueError('Encoded preview true peak exceeds ceiling: ' + repr(products))
        gap = db(voice[activity]) - db(bed[activity])
        assert abs(gap - 16) < .01
        assert max(abs(combined).max(), abs(pure).max(), abs(dialogue).max()) < 1
        records.append({'track_id': track['id'], 'source_start_seconds': track['preview_start_seconds'],
                        'voice_music_gap_db_during_speech': round(gap, 3), 'human_listening': 'pending', 'files': products})
        cards.append(f'''<article><h2>{number:02d} · {html.escape(track['title'])}</h2>
<p>{html.escape(track['label'])} · 官网标注 {track['bpm']:g} BPM</p>
<p>适合试配：{html.escape(track['suggested_use'])}</p>
<label>先8秒纯音乐，再接同一段问答（30秒）<audio controls preload="none" src="{stem}-demo.mp3"></audio></label>
<details><summary>分别比较纯音乐与问答</summary><label>纯音乐25秒<audio controls preload="none" src="{stem}-pure.mp3"></audio></label>
<label>双角色问答22秒<audio controls preload="none" src="{stem}-dialogue.mp3"></audio></label></details>
<p><a href="{html.escape(track['source_url'], quote=True)}">作者官网原曲</a> · Kevin MacLeod · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p></article>''')
        print(f'{track["title"]}: 3 previews, pure {products[0]["integrated_lufs"]:.2f} LUFS, voice/music gap {gap:.1f}dB', flush=True)

report = {'created_utc': datetime.now(timezone.utc).isoformat(), 'voice': report_voice,
          'music_only_target_lufs': -20, 'voice_only_target_lufs': -16,
          'preview_rule': '先8秒纯音乐，再接22.446秒相同双角色问答；不是正式成片。',
          'subjective_status': '未进行真人听感确认；技术检测不代表用户已认可曲目。', 'tracks': records}
(OUT / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>白洞 · 六首新配乐试听</title><style>
body{font:16px/1.65 system-ui,sans-serif;margin:0;background:#f7f5ef;color:#25322c}main{max-width:850px;margin:auto;padding:32px 20px}h1{font-size:29px;line-height:1.3}h2{font-size:21px;margin:0}p{margin:8px 0}article{padding:24px 0;border-top:1px solid #cbd3ca}a{color:#246541}label{display:block;margin:14px 0}audio{display:block;width:100%;margin-top:7px}summary{cursor:pointer;color:#345f48}footer{font-size:14px;color:#53645a}
</style><main><h1>白洞 · 六首新配乐试听</h1><p>每段先听8秒音乐，再听同一段有戏问、小算盘答。比较旋律、节奏，以及是否影响听清解说。下面也可单独播放纯音乐和对白。</p>
<p>六首已确认全部入库，后续按题材和对白节奏选择并轮换。Cold Funk 是模板起始配置；这里保留六首的纯音乐和同段问答试听。</p>'''
page += '\n'.join(cards)
page += '''<footer><p>音乐：Kevin MacLeod（incompetech.com），CC BY 4.0。已截取、淡入淡出、调整响度并与对白混音。正式发布须保留曲名、作者、来源、许可链接及改动说明；授权证据和原音指纹见音乐库。</p></footer></main><script>document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')document.querySelectorAll('audio').forEach(a=>{if(a!==e.target)a.pause()})},true)</script></html>'''
(OUT / 'index.html').write_text(page, encoding='utf-8', newline='\n')
print('Preview page: ' + str(OUT / 'index.html'))
