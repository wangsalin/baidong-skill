"""回归：长稿字体请求必须保留 text，且浏览器按字符范围使用子集。"""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from urllib.parse import parse_qs, urlparse

PATH = Path(__file__).resolve().parent.parent / 'assets/episode-template/fonts/fetch_fonts.py'
spec = importlib.util.spec_from_file_location('episode_fonts', PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FontRequestTests(unittest.TestCase):
    def test_accented_latin_is_not_silently_dropped(self):
        import json
        old_root = module.ROOT
        with tempfile.TemporaryDirectory() as directory:
            try:
                module.ROOT = directory
                Path(directory, 'lines.json').write_text(json.dumps([{'text': 'café ¥20'}], ensure_ascii=False), encoding='utf-8')
                self.assertIn('é', module.chars())
                self.assertIn('¥', module.chars())
            finally:
                module.ROOT = old_root

    def test_long_text_preserved_with_bounded_requests(self):
        text = ''.join(chr(0x4E00 + i) for i in range(1200)) + 'ABC 123!'
        chunks = module.text_chunks(text)
        self.assertGreater(len(chunks), 1)
        self.assertEqual(''.join(chunks), text)
        for chunk in chunks:
            self.assertLessEqual(len(module.font_url('Noto Sans SC:wght@900', chunk)), 1900)

    def test_downloads_and_css_cover_every_requested_character(self):
        requested = ''.join(chr(0x4E00 + i) for i in range(600)) + ' ABC123'
        seen = []
        def get(url):
            if url.startswith('https://fonts.googleapis.com/'):
                seen.append(parse_qs(urlparse(url).query)['text'][0])
                return b'@font-face{src:url(https://fonts.gstatic.com/mock.woff2)}'
            return b'font-fixture'
        old_get, old_here = module.get, module.HERE
        with tempfile.TemporaryDirectory() as directory:
            try:
                module.get, module.HERE = get, directory
                css = module.fetch('Noto Sans SC:wght@900', 'test.woff2', requested)
                self.assertEqual(''.join(seen), requested)
                self.assertEqual(css.count('unicode-range:'), len(seen))
                self.assertEqual(len(list(Path(directory).glob('*.woff2'))), len(seen))
                self.assertIn('font-weight: 900', css)
            finally:
                module.get, module.HERE = old_get, old_here


if __name__ == '__main__':
    unittest.main()
