"""校验完整ZIP或解压后的baidong目录；不运行安装或媒体制作。"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile
import subprocess

ap = argparse.ArgumentParser(description=__doc__)
ap.add_argument('package', type=Path)
ap.add_argument('--source-tree', action='store_true', help='校验 Git 开发目录，仅排除 Git 已忽略文件和仓库元数据；发布 ZIP 不使用此选项')
args = ap.parse_args()
if args.package.is_dir():
    if args.source_tree:
        names = subprocess.check_output(['git','-C',str(args.package),'ls-files','-c','-o','--exclude-standard','-z'], encoding='utf-8').split('\0')
        entries = {name: (args.package / name).read_bytes() for name in set(filter(None,names))}
    else:
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
required += ['assets/identity-reference/identity-lineup.png','assets/identity-reference/manifest.json','assets/episode-template/production-contract.json','assets/episode-template/voice-reference.json','assets/episode-template/portrait.js','assets/episode-template/check-production.py','scripts/test_identity.mjs','scripts/test_production.py']
for name in required:
    if name not in entries:
        raise SystemExit(f'缺少必需文件：{name}')
for name in entries:
    parts = PurePosixPath(name).parts
    if any(p in {'.git', '.venv', 'node_modules', '__pycache__', '.env'} for p in parts):
        raise SystemExit(f'混入不应分发的文件：{name}')
identity=json.loads(entries['assets/identity-reference/manifest.json'])
for name,expected in identity['files'].items():
    if hashlib.sha256(entries['assets/identity-reference/'+name]).hexdigest()!=expected:
        raise SystemExit('确认稿指纹不符：'+name)
contract=json.loads(entries['assets/episode-template/production-contract.json'])
for name,expected in contract['locked_files'].items():
    if hashlib.sha256(entries['assets/episode-template/'+name]).hexdigest()!=expected:
        raise SystemExit('固定制作资产指纹不符：'+name)
print(json.dumps({'passed': True, 'files': len(entries), 'all_sha256_match': True, 'shell_lf': True, 'required_assets': True,'frozen_identity':True,'production_contract':True}, ensure_ascii=False))
