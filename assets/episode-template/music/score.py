"""按目录选曲与起点，原速原调，保留原音指纹、许可和实际剪裁记录。"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
config = ROOT / '.baidong.json'
skill = Path(os.environ.get('BAIDONG_SKILL_ROOT') or (json.loads(config.read_text(encoding='utf-8'))['skill_root'] if config.exists() else ROOT))
bundled = skill / 'assets/music'
library = Path(os.environ.get('BAIDONG_MUSIC_LIBRARY', str(bundled if bundled.is_dir() else ROOT.parent / 'music-library')))
catalog = json.loads((library / 'catalog.json').read_text(encoding='utf-8'))
selection = json.loads((ROOT / 'music/selection.json').read_text(encoding='utf-8'))
track_id = selection['track_id']
track = next((t for t in catalog['tracks'] if t['id'] == track_id), None)
if track is None:
    raise SystemExit(f'音乐目录中没有这个track_id：{track_id}')
SOURCE = Path(track['audio_path'])
if not SOURCE.is_absolute():
    SOURCE = library / SOURCE
if not SOURCE.is_file():
    SOURCE = library / 'audio' / Path(track['audio_path']).name
digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
if track.get('audio_sha256') and digest != track['audio_sha256']:
    raise SystemExit('所选音源指纹与目录不符，请核对文件。')
events = json.loads((ROOT / 'events.json').read_text(encoding='utf-8'))
SR = 48000
duration = events['dur']
n = round(duration * SR)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(SOURCE), '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
music = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()
source_seconds = len(music) / SR
start_seconds = float(selection.get('start_seconds', track.get('recommended_selection', {}).get('start_seconds', 0)))
if not np.isfinite(start_seconds) or start_seconds < 0 or start_seconds >= source_seconds:
    raise SystemExit('start_seconds 必须在音源时长范围内且非负。')
music = music[round(start_seconds * SR):]
overlap = 3 * SR
if len(music) <= overlap:
    raise SystemExit('音源需长于3秒，以便交叉衔接。')
result = music.copy()
seams = []
while len(result) < n:
    start = len(result) - overlap
    seams.append(round(start / SR, 3))
    u = np.linspace(0, np.pi / 2, overlap)[:, None]
    result[-overlap:] = result[-overlap:] * np.cos(u) + music[:overlap] * np.sin(u)
    result = np.concatenate([result, music[overlap:]])
result = result[:n]
result *= .12 / (np.sqrt((result ** 2).mean()) + 1e-9)
fadein, fadeout = min(SR, n), min(2 * SR, n)
result[:fadein] *= np.linspace(0, 1, fadein)[:, None]
result[-fadeout:] *= np.linspace(1, 0, fadeout)[:, None]
sf.write(ROOT / 'music/score.wav', result, SR, subtype='PCM_16')
record = {'source': str(SOURCE), 'sourceSha256': digest, 'trackId': track_id,
          'title': track.get('title') or '未核实曲名：用户提供的Vibe知识大赏视频音轨',
          'author': track.get('artist') or '未核实', 'sourceSeconds': source_seconds,
          'sourceStartSeconds': start_seconds, 'excerptSeconds': len(music) / SR,
          'durationSeconds': duration, 'crossfadeSeconds': 3, 'loopSeams': seams,
          'speed': 1, 'pitchChange': False,
          'sourceUrl': track.get('source_url'), 'licenseId': track.get('license_id'),
          'licenseUrl': track.get('license_url'), 'attribution': track.get('attribution'),
          'license': track.get('credit_status', '用户提供的音源；未另行核实传播授权')}
(ROOT / 'music/source.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
credit = record['attribution'] or f'配乐：{record["title"]}；作者：{record["author"]}。'
credit += f'\n来源：{record["sourceUrl"] or "用户提供音源，详见 music/source.json"}。'
credit += f'\n本期处理：从 {start_seconds:g} 秒截取，按需循环与交叉淡化、淡入淡出、调整电平并与对白混音；原速原调。\n'
(ROOT / 'music/credits.txt').write_text(credit, encoding='utf-8')
print(f'Music: {duration:.3f}s; track: {track_id}; loop seams: {seams}')
