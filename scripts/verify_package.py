"""校验完整ZIP或解压后的baidong目录；不运行安装或媒体制作。"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

ap = argparse.ArgumentParser(description=__doc__)
ap.add_argument('package', type=Path)
args = ap.parse_args()
if args.package.is_dir():
    entries = {p.relative_to(args.package).as_posix(): p.read_bytes() for p in args.package.rglob('*') if p.is_file()}
else:
    with zipfile.ZipFile(args.package) as z:
        if z.testzip() is not None:
            raise SystemExit('ZIP校验失败。')
        names = z.namelist()
        if len(names) != len(set(names)):
            raise SystemExit('ZIP含重复路径。')
        entries = {}
        for name in names:
            p = PurePosixPath(name)
            if not name.startswith('baidong/') or '..' in p.parts or p.is_absolute():
                raise SystemExit('ZIP含不合法路径。')
            entries[name[len('baidong/'):]] = z.read(name)
manifest = json.loads(entries['PACKAGE-MANIFEST.json'])
expected = {f['path'] for f in manifest['files']}
if expected != set(entries) - {'PACKAGE-MANIFEST.json'}:
    raise SystemExit('文件清单不匹配。')
for item in manifest['files']:
    data = entries[item['path']]
    if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
        raise SystemExit(f'文件指纹不符：{item["path"]}')
    if item['path'].endswith('.sh') and b'\r' in data:
        raise SystemExit(f'Shell脚本不是LF换行：{item["path"]}')
required = ['SKILL.md', 'references/installation.md', 'references/vertical.md', 'assets/examples/vertical-layout-demo/README.md', 'assets/examples/vertical-layout-demo/contact-sheet.jpg', 'assets/examples/vertical-layout-demo/preview.mp4', 'assets/episode-template/main.js', 'assets/episode-template/chars.js', 'assets/lemo-runtime/LICENSE', 'assets/lemo-runtime/styles/scifi-toon/STYLE.md', 'assets/music/audio/vibe-bgm-reference-20261027.m4a', 'assets/music/audio/we-never-hi-noise.mp3', 'assets/examples/ep08-sunk-cost/ep08-sunk-cost.mp4']
for name in required:
    if name not in entries:
        raise SystemExit(f'缺少必需文件：{name}')
for name in entries:
    parts = PurePosixPath(name).parts
    if any(p in {'.git', '.venv', 'node_modules', '__pycache__', '.env'} for p in parts):
        raise SystemExit(f'混入不应分发的文件：{name}')
print(json.dumps({'passed': True, 'files': len(entries), 'all_sha256_match': True, 'shell_lf': True, 'required_assets': True}, ensure_ascii=False))
