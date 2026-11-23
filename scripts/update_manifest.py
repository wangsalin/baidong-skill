"""刷新 Git 开发目录的分发清单；不改动冻结资产或制作约束。"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args]).decode('utf-8')


def update_manifest(root, version=None):
    root = Path(root).resolve()
    if Path(git(root, 'rev-parse', '--show-toplevel').strip()).resolve() != root:
        raise ValueError('必须在白洞独立 Git 仓库根目录更新清单。')
    target = root / 'PACKAGE-MANIFEST.json'
    manifest = json.loads(target.read_text(encoding='utf-8'))
    names = git(root, 'ls-files', '-c', '-o', '--exclude-standard', '-z').split('\0')
    files = []
    for name in sorted(set(filter(None, names)) - {target.name}):
        path = root / name
        if path.is_symlink():
            raise ValueError(f'分发清单不接受符号链接：{name}')
        with path.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        files.append({'path': name, 'bytes': path.stat().st_size, 'sha256': digest})
    if files == manifest['files'] and (version is None or version == manifest['version']):
        return False, len(files)
    manifest.update(
        created_utc=datetime.now(timezone.utc).isoformat(),
        skill_commit=git(root, 'rev-parse', 'HEAD').strip(),
        skill_dirty=bool(git(root, 'status', '--porcelain').strip()),
        files=files,
    )
    if version is not None:
        manifest['version'] = version
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    return True, len(files)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', help='可选的新版本名称；默认保留原值')
    args = parser.parse_args()
    try:
        changed, count = update_manifest(Path(__file__).resolve().parent.parent, args.version)
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'更新失败：{error}\n')
    print(json.dumps({'updated': changed, 'files': count + 1}, ensure_ascii=False))


if __name__ == '__main__':
    main()
