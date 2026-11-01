"""复制白洞模板；支持 Linux/WSL/Git Bash，不覆盖已有项目。"""
import argparse
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('number', type=int)
parser.add_argument('slug')
parser.add_argument('output_root', nargs='?')
parser.add_argument('--language', choices=('zh', 'en'), default='zh')
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
(dest / 'episode.json').write_text(json.dumps({'language': args.language, 'character_mode': 'formal'}, indent=2) + '\n', encoding='utf-8', newline='\n')
if args.language == 'en':
    registry = json.loads((dest / 'characters.json').read_text(encoding='utf-8'))
    lines = json.loads((dest / 'lines.json').read_text(encoding='utf-8'))
    sample = {
        'a1': "Why do I keep putting off sleep when I am exhausted?",
        'a2': "Because the daytime does not feel like yours.",
        'b1': "What about the evening?",
        'b2': "Those last two hours feel like the only time you control.",
        'c1': "So am I staying up for a little freedom?",
    }
    for line in lines:
        line['text'] = sample[line['id']]
        line.pop('say', None)
        line.pop('asr', None)
        voice = registry['languages']['en'][line['who']]
        line.update({k: voice[k] for k in ('voice', 'rate', 'pitch')})
    (dest / 'lines.json').write_text(json.dumps(lines, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    translations = {
        '样片：为什么半夜不想睡？': 'Sample: Why do I put off sleep?',
        '你一般几点睡？': 'What time do you usually go to bed?',
        '吃饱穿暖了，为什么更累了？': 'Why am I tired when life looks comfortable?',
        '明明很困 / 为什么不想睡？': 'Exhausted / Still up?', '不想睡': 'Still up',
        '明明很困，为什么不想睡': 'Exhausted, but still up',
        '凌晨两点 · 卧室': '2 AM · Bedroom', '那点时间是你自己的': 'A little time of your own',
        '白天的时间不属于你': 'Whose time is it?', '下午三点 · 工位': '3 PM · Office',
        '9:00–18:00  老板的': '9–6: Work', '18:00–24:00  通勤、家务': '6–12: Commute and chores',
        '24:00–02:00  我的': '12–2: My time', '时间归谁': 'Whose time?',
    }
    for name in ('story.js', 'main.js'):
        target = dest / name
        text = target.read_text(encoding='utf-8')
        for zh, en in sorted(translations.items(), key=lambda item: -len(item[0])):
            text = text.replace(zh, en)
        target.write_text(text, encoding='utf-8', newline='\n')

runtime_skill = '/mnt/' + skill.drive[0].lower() + skill.as_posix()[2:] if os.name == 'nt' and re.fullmatch('[A-Za-z]:', skill.drive) else str(skill)
(dest / '.baidong.json').write_text(json.dumps({'skill_root': runtime_skill}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(dest / '.baidong-runtime.sh').write_text('BAIDONG_SKILL_ROOT=${BAIDONG_SKILL_ROOT:-' + shlex.quote(runtime_skill) + '}\nexport BAIDONG_SKILL_ROOT\n. "$BAIDONG_SKILL_ROOT/scripts/runtime.sh"\n', encoding='utf-8', newline='\n')
print(f'新建好了：{dest}\n下一步：写本期对白与镜头，运行 python3 "{dest}/fonts/fetch_fonts.py"，再运行 sh "{dest}/build.sh"。')
