"""将skill、指定Lemo源码、用户音源与认可工程打成一个可核验的完整包。"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import zipfile

ap = argparse.ArgumentParser(description=__doc__)
ap.add_argument('--lemo', type=Path, required=True)
ap.add_argument('--music', type=Path, required=True)
ap.add_argument('--example', type=Path, required=True)
ap.add_argument('--output', type=Path, required=True)
ap.add_argument('--version', default='scifi-camera-cutaways-20261105')
args = ap.parse_args()
skill = Path(__file__).resolve().parent.parent
archive = args.output.resolve()
stage = archive.with_suffix('') / 'baidong'
if archive.is_relative_to(skill) or stage.is_relative_to(skill):
    ap.error('输出必须放在 Skill 源目录之外，避免把新包再次打进自身。')
if archive.exists() or stage.parent.exists():
    ap.error('输出压缩包或暂存目录已存在；请指定新的输出文件名，保留旧包。')
stage.mkdir(parents=True)
text_extensions = {'.md', '.txt', '.js', '.mjs', '.py', '.sh', '.html', '.css', '.json', '.yaml', '.yml', '.srt'}

def copy(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix in text_extensions or src.name in {'SKILL.md', 'CREDITS', 'LICENSE', '.gitattributes', '.gitignore'}:
        dst.write_text(src.read_text(encoding='utf-8').replace('\r\n', '\n'), encoding='utf-8', newline='\n')
    else:
        shutil.copy2(src, dst)

def revision(root):
    result = subprocess.run(['git', '-C', str(root), 'rev-parse', '--show-toplevel'], capture_output=True, text=True, encoding='utf-8')
    if result.returncode or Path(result.stdout.strip()).resolve() != root.resolve():
        return None  # 随包参考工程没有独立 .git，不能冒用父目录的提交。
    return subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True, encoding='utf-8').strip()

def reference_revision(root):
    commit = revision(root)
    if commit:
        return commit
    for parent in root.resolve().parents:
        manifest = parent / 'PACKAGE-MANIFEST.json'
        if manifest.is_file() and root.resolve().relative_to(parent).as_posix() == 'assets/examples/ep08-sunk-cost':
            return json.loads(manifest.read_text(encoding='utf-8')).get('reference_episode_commit')
    return None

files = subprocess.check_output(['git', '-C', str(skill), 'ls-files', '-c', '-o', '--exclude-standard', '-z'], encoding='utf-8').split('\0')
for name in sorted(set(filter(None, files))):
    if name == 'PACKAGE-MANIFEST.json':
        continue  # 清单在所有复制和适配结束后生成，不能把旧清单纳入自身。
    copy(skill / name, stage / name)

# 轻量运行源码；不触发稀疏仓库的远程对象拉取，不复制环境、模型或采样。
runtime = stage / 'assets/lemo-runtime'
for name in ['AGENTS.md', 'DIRECTOR.md', 'TECHNIQUE.md', 'LICENSE', 'README.zh-CN.md', 'package.json', 'package-lock.json', 'requirements.txt', 'requirements-voice.txt', 'requirements-music.txt', 'styles/scifi-toon/STYLE.md', 'styles/README.md']:
    copy(args.lemo / name, runtime / name)
for directory in ('core', 'tools'):
    for src in (args.lemo / directory).rglob('*'):
        rel = src.relative_to(args.lemo)
        if src.is_file() and src.suffix in {'.py', '.js', '.mjs', '.sh', '.md', '.json'} and not any(p in {'__pycache__', 'assets', 'instruments', 'node_modules'} for p in rel.parts):
            copy(src, runtime / rel)
(runtime / 'BUNDLED-SOURCE.json').write_text(json.dumps({'upstream': 'https://github.com/lemomo-ai/lemo-opuscar', 'commit': '413a6bd6d78ebd3bdd5abaec9538a26867f890df', 'scope': '本期制作所需文本源码与风格文档；排除环境、模型、大型素材与其他风格demo。'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

music = stage / 'assets/music'
catalog = json.loads((args.music / 'catalog.json').read_text(encoding='utf-8'))
for track in catalog['tracks']:
    src = Path(track['audio_path'])
    if not src.is_absolute():
        src = args.music / src
    if not src.exists():
        src = args.music / 'audio' / src.name
    digest = hashlib.sha256(src.read_bytes()).hexdigest()
    if digest != track['audio_sha256']:
        raise ValueError(f'音源指纹不符：{src.name}')
    track['audio_path'] = 'audio/' + src.name
    copy(src, music / track['audio_path'])
music.mkdir(parents=True, exist_ok=True)
(music / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

example = stage / 'assets/examples/ep08-sunk-cost'
for src in args.example.iterdir():
    if src.is_file() and (src.suffix in {'.js', '.mjs', '.html', '.json', '.md', '.txt', '.srt', '.sh'} or src.name == 'CREDITS' or src.name in {'ep08-sunk-cost.mp4', 'cover-16x9.jpg'}):
        copy(src, example / src.name)
for directory, patterns in {'fonts': ['*.woff2', '*.css', '*.txt', '*.py'], 'voices': ['*.wav', 'dur.json', 'lips.json', 'words.json'], 'tools': ['asr-context.py', 'check-context.py', 'check-voices.py', 'check-fonts.py', 'check-playback.mjs', 'qa-film.py', 'inspect.mjs'], 'out': ['context-check.json', 'voice-checkpoints.json', 'timeline.json']}.items():
    for pattern in patterns:
        for src in (args.example / directory).glob(pattern):
            copy(src, example / directory / src.name)
copy(args.example / 'mix.py', example / 'mix.py')
copy(stage / 'assets/episode-template/music/score.py', example / 'music/score.py')
example_selection = args.example / 'music/selection.json'
copy(example_selection if example_selection.is_file() else stage / 'assets/episode-template/music/selection.json', example / 'music/selection.json')
for name in ('source.json', 'mix-levels.json', 'credits.txt'):
    copy(args.example / 'music' / name, example / 'music' / name)

# 仅在分发副本中把参考工程的本机路径改为LIB；原工程保持原样。
for name in ('asr-context.py', 'check-context.py'):
    p = example / 'tools' / name
    text = p.read_text(encoding='utf-8')
    if "'/home/salin/lemo-opuscar/core/tts'" in text:
        if 'import os' not in text:
            text = text.replace('import json', 'import os\nimport json', 1)
        text = text.replace("'/home/salin/lemo-opuscar/core/tts'", "os.path.join(os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar')), 'core/tts')")
    p.write_text(text, encoding='utf-8', newline='\n')
for name in ('inspect.mjs', 'check-playback.mjs'):
    p = example / 'tools' / name
    p.write_text(p.read_text(encoding='utf-8').replace("'/home/salin/lemo-opuscar/core/render/page.mjs'", "path.join(process.env.LIB || path.join(process.env.HOME,'lemo-opuscar'),'core/render/page.mjs')"), encoding='utf-8')
p = example / 'build.sh'
p.write_text(p.read_text(encoding='utf-8').replace('LIB=${LIB:-$HOME/lemo-opuscar}; export LIB', 'BAIDONG_SKILL_ROOT=$(cd "$(dirname "$0")/../../.." && pwd); export BAIDONG_SKILL_ROOT\n. "$BAIDONG_SKILL_ROOT/scripts/runtime.sh"'), encoding='utf-8', newline='\n')
(example / 'REFERENCE.md').write_text('''# 已认可参考工程：沉没成本

用户于2026-10-28认可，153.250秒、62句对白、29个镜头。只用于参考科幻卡通画法、配色、声音与制作技术；新期采用商业经济双角色直接问答，按2026-11-05规则从A1–D2八人库轮换或随机选择两位不同角色，问题后立即回答，不沿用该片故事与捧哏；服务解释的表情、反应镜头和动作按当前 visual.md 设计。

包内原成片、横版封面、处理后配音和原QA记录按原样保留。其余封面和竖版切片未放入参考附件，原DELIVERY.md中的本机路径属于当时交付记录。没有打入raw配音、mix.wav与大量抽帧缓存。

运行环境按references/installation.md配置，设BAIDONG_SKILL_ROOT和LIB。离线重建可使用sh build.sh from=events（配音与字体已带齐）。整条重做会联网重新配音和ASR核查；音频变了后缓存的SHA256不再匹配，孤立短句若有差异需重新生成相邻对白核查，不跳过ASR。

分发副本只适配了依赖和音乐路径；创作对白、镜头和成片未改动。qa.json、delivery-qa.json、voice-check.json均是原片的历史记录；生成新媒体后重新验证，不能把旧报告当作新验证。
''', encoding='utf-8')

payloads = []
for p in sorted(stage.rglob('*')):
    if p.is_file() and p.relative_to(stage).as_posix() != 'PACKAGE-MANIFEST.json':
        data = p.read_bytes()
        payloads.append({'path': p.relative_to(stage).as_posix(), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
dirty = bool(subprocess.check_output(['git', '-C', str(skill), 'status', '--porcelain'], encoding='utf-8').strip())
manifest = {'version': args.version, 'created_utc': datetime.now(timezone.utc).isoformat(), 'skill_commit': revision(skill), 'skill_dirty': dirty, 'reference_episode_commit': reference_revision(args.example), 'files': payloads, 'excluded': ['.git', '.venv', 'node_modules', 'Chromium', 'Whisper models', 'instrument sample libraries'], 'verification': '文件内容SHA256；清单本身不计入自校验。'}
(stage / 'PACKAGE-MANIFEST.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in sorted(stage.rglob('*')):
        if p.is_file():
            z.write(p, 'baidong/' + p.relative_to(stage).as_posix())
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256').write_text(digest + '  ' + archive.name + '\n', encoding='utf-8')
print(json.dumps({'zip': str(archive), 'skill_directory': str(stage), 'files': len(payloads) + 1, 'bytes': archive.stat().st_size, 'sha256': digest}, ensure_ascii=False, indent=2))
