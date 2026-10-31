"""复制白洞模板；支持 Linux/WSL/Git Bash，不覆盖已有项目。"""
import argparse
import json
import os
from pathlib import Path
import re
import shlex
import shutil

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('number', type=int)
parser.add_argument('slug')
parser.add_argument('output_root', nargs='?')
args = parser.parse_args()
if not 0 <= args.number <= 9999 or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', args.slug):
    parser.error('期号应为0–9999，英文短名仅使用小写字母、数字与连字符。')
skill = Path(__file__).resolve().parent.parent
default_root = 'G:/vibe/baidong' if os.name == 'nt' and Path('G:/vibe').is_dir() else '/mnt/g/vibe/baidong' if Path('/mnt/g/vibe').is_dir() else '/g/vibe/baidong' if Path('/g/vibe').is_dir() else str(Path.cwd() / 'baidong-films')
root = Path(args.output_root or os.environ.get('BAIDONG_PROJECT_ROOT', default_root)).resolve()
dest = root / f'ep{args.number:02d}-{args.slug}'
if dest.exists():
    parser.error(f'已存在：{dest}（不会覆盖）')
root.mkdir(parents=True, exist_ok=True)
shutil.copytree(skill / 'assets/episode-template', dest, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', 'out', 'voices'))
for name in ('out', 'voices'):
    (dest / name).mkdir()
story = dest / 'story.js'
story.write_text(re.sub(r'export const NO\s*=\s*\d+;', f'export const NO = {args.number};', story.read_text(encoding='utf-8'), count=1), encoding='utf-8')
runtime_skill = '/mnt/' + skill.drive[0].lower() + skill.as_posix()[2:] if os.name == 'nt' and re.fullmatch('[A-Za-z]:', skill.drive) else str(skill)
(dest / '.baidong.json').write_text(json.dumps({'skill_root': runtime_skill}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(dest / '.baidong-runtime.sh').write_text('BAIDONG_SKILL_ROOT=${BAIDONG_SKILL_ROOT:-' + shlex.quote(runtime_skill) + '}\nexport BAIDONG_SKILL_ROOT\n. "$BAIDONG_SKILL_ROOT/scripts/runtime.sh"\n', encoding='utf-8', newline='\n')
print(f'新建好了：{dest}\n下一步：写本期对白与镜头，运行 python3 "{dest}/fonts/fetch_fonts.py"，再运行 sh "{dest}/build.sh"。')
