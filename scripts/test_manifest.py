"""在独立临时仓库验证清单更新、忽略规则与来源记录。"""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from update_manifest import update_manifest


class ManifestTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='baidong-manifest-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.manifest_path = self.root / 'PACKAGE-MANIFEST.json'
        self.manifest_path.write_text(json.dumps({
            'version': 'test-original', 'files': [],
            'reference_episode_commit': 'reference-origin',
        }), encoding='utf-8')
        (self.root / '.gitignore').write_text('cache/\n', encoding='utf-8')
        subprocess.run(['git', '-C', str(self.root), 'init', '-q'], check=True)
        subprocess.run(['git', '-C', str(self.root), 'add', '.'], check=True)
        subprocess.run(['git', '-C', str(self.root), '-c', 'user.name=Manifest Test',
                        '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'], check=True)

    def read(self):
        return json.loads(self.manifest_path.read_text(encoding='utf-8'))

    def test_includes_new_binary_but_excludes_ignored_cache(self):
        content = bytes(range(256))
        (self.root / 'sample.bin').write_bytes(content)
        (self.root / 'cache').mkdir()
        (self.root / 'cache' / 'temporary.bin').write_bytes(b'ignored')
        changed, _ = update_manifest(self.root)
        self.assertTrue(changed)
        files = {item['path']: item for item in self.read()['files']}
        self.assertEqual(files['sample.bin']['sha256'], hashlib.sha256(content).hexdigest())
        self.assertEqual(files['sample.bin']['bytes'], len(content))
        self.assertNotIn('cache/temporary.bin', files)
        self.assertNotIn('PACKAGE-MANIFEST.json', files)
        self.assertTrue(self.read()['skill_dirty'])

    def test_repeated_update_preserves_manifest_bytes(self):
        update_manifest(self.root)
        before = self.manifest_path.read_bytes()
        self.assertFalse(update_manifest(self.root)[0])
        self.assertEqual(self.manifest_path.read_bytes(), before)

    def test_changed_content_refreshes_digest_and_preserves_reference_origin(self):
        path = self.root / 'notes.md'
        path.write_bytes(b'first')
        update_manifest(self.root)
        path.write_bytes(b'second')
        self.assertTrue(update_manifest(self.root, 'test-next')[0])
        manifest = self.read()
        self.assertEqual(manifest['version'], 'test-next')
        self.assertEqual(manifest['reference_episode_commit'], 'reference-origin')
        head = subprocess.check_output(['git', '-C', str(self.root), 'rev-parse', 'HEAD']).decode().strip()
        self.assertEqual(manifest['skill_commit'], head)
        item = next(item for item in manifest['files'] if item['path'] == 'notes.md')
        self.assertEqual(item['sha256'], hashlib.sha256(b'second').hexdigest())

    def test_subdirectory_cannot_update_parent_repository(self):
        child = self.root / 'child'
        child.mkdir()
        before = self.manifest_path.read_bytes()
        with self.assertRaisesRegex(ValueError, '仓库根目录'):
            update_manifest(child)
        self.assertEqual(self.manifest_path.read_bytes(), before)


if __name__ == '__main__':
    unittest.main(verbosity=2)
