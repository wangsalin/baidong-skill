"""离线行为回归：角色/语言校验、字体覆盖、新期隔离和时间线防覆盖。"""
import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / 'assets/episode-template'


def module(path):
    spec = importlib.util.spec_from_file_location(path.stem.replace('-', '_'), path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


CHECK = module(TEMPLATE / 'check-characters.py')
REGISTRY = json.loads((TEMPLATE / 'characters.json').read_text(encoding='utf-8'))
LINES = json.loads((TEMPLATE / 'lines.json').read_text(encoding='utf-8'))


class TemplateRegression(unittest.TestCase):
    def test_chinese_registered_voices(self):
        self.assertEqual(CHECK.validate(REGISTRY, LINES), (5, 5))

    def test_duplicate_id_rejected_before_tts(self):
        with self.assertRaisesRegex(ValueError, 'ID 重复'):
            CHECK.validate(REGISTRY, LINES + [dict(LINES[0], text='另一个内容')])

    def test_unsafe_id_rejected(self):
        for key in ('../outside', '', 'a/b'):
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, 'ID 无效'):
                CHECK.validate(REGISTRY, [dict(LINES[0], id=key)])

    def test_empty_text_rejected(self):
        with self.assertRaisesRegex(ValueError, 'text'):
            CHECK.validate(REGISTRY, [dict(LINES[0], text=' ')])

    def test_unknown_role_rejected(self):
        with self.assertRaisesRegex(ValueError, '未启用人物'):
            CHECK.validate(REGISTRY, [dict(LINES[0], who='nobody')])

    def test_legacy_is_explicit_and_validated(self):
        line = {'id': 'old1', 'who': 'LAOBAI', 'text': '历史兼容'}
        line.update({k: REGISTRY['legacy']['LAOBAI'][k] for k in ('voice', 'rate', 'pitch')})
        with self.assertRaisesRegex(ValueError, '未启用人物'):
            CHECK.validate(REGISTRY, [line])
        self.assertEqual(CHECK.validate(REGISTRY, [line], mode='legacy'), (1, 1))
        with self.assertRaisesRegex(ValueError, 'voice 不一致'):
            CHECK.validate(REGISTRY, [dict(line, voice='arbitrary')], mode='legacy')

    def test_english_uses_separate_fixed_voices(self):
        lines = [dict(line, **{k: REGISTRY['languages']['en'][line['who']][k] for k in ('voice', 'rate', 'pitch')}) for line in LINES]
        self.assertEqual(CHECK.validate(REGISTRY, lines, 'en'), (5, 5))
        with self.assertRaisesRegex(ValueError, 'voice 不一致'):
            CHECK.validate(REGISTRY, lines, 'zh')
        with self.assertRaisesRegex(ValueError, 'voice 不一致'):
            CHECK.validate(REGISTRY, LINES, 'en')

    def test_voice_rate_pitch_all_bound(self):
        for field, value in [('voice', 'wrong'), ('rate', '+99%'), ('pitch', '+99Hz')]:
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, field):
                CHECK.validate(REGISTRY, [dict(LINES[0], **{field: value})])

    def test_js_json_registry_same_names_and_voices(self):
        uri = (TEMPLATE / 'characters.js').as_uri()
        script = f"import {{CHARACTER_IDS,CHARACTERS,getVoice}} from {json.dumps(uri)}; console.log(JSON.stringify(CHARACTER_IDS.map(id=>({{id,name:CHARACTERS[id].name,zh:getVoice(id,'zh'),en:getVoice(id,'en')}}))));"
        result = subprocess.run(['node', '--input-type=module', '-e', script], check=True, capture_output=True, text=True, encoding='utf-8')
        for item in json.loads(result.stdout):
            self.assertEqual(item['name'], REGISTRY['formal'][item['id']]['name'])
            for lang in ('zh', 'en'):
                spec = REGISTRY['formal'][item['id']] if lang == 'zh' else REGISTRY['languages'][lang][item['id']]
                for field in ('voice', 'rate', 'pitch'):
                    self.assertEqual(item[lang][field], spec[field])

    def test_invalid_language_rejected(self):
        with tempfile.TemporaryDirectory(prefix='baidong-config-') as tmp:
            root = Path(tmp)
            (root / 'episode.json').write_text('{"language":"de"}', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, '不支持的配音语言'):
                CHECK.load_config(root)

    def test_duplicate_registry_voice_rejected(self):
        reg = copy.deepcopy(REGISTRY)
        reg['formal']['A2']['voice'] = reg['formal']['A1']['voice']
        with self.assertRaisesRegex(ValueError, 'voice 重复'):
            CHECK.validate(reg, LINES)

    def test_font_covers_all_names_and_portrait(self):
        fonts = module(TEMPLATE / 'fonts/fetch_fonts.py')
        with tempfile.TemporaryDirectory(prefix='baidong-fonts-') as tmp:
            root = Path(tmp)
            (root / 'characters.json').write_text(json.dumps(REGISTRY, ensure_ascii=False), encoding='utf-8')
            (root / 'portrait.js').write_text("const label = '犹豫、躲闪与释然';", encoding='utf-8')
            fonts.ROOT = tmp
            chars = set(fonts.chars())
            self.assertTrue(all(set(r['name']) <= chars for r in REGISTRY['formal'].values()))
            self.assertTrue(set('犹豫、躲闪与释然') <= chars)

    def test_create_zh_en_and_refuse_overwrite(self):
        with tempfile.TemporaryDirectory(prefix='baidong-episodes-') as tmp:
            for lang in ('zh', 'en'):
                result = subprocess.run([sys.executable, '-B', str(ROOT / 'scripts/new_episode.py'), '9998', 'test-' + lang, tmp, '--language', lang], capture_output=True, text=True, encoding='utf-8')
                self.assertEqual(result.returncode, 0, result.stderr)
                project = Path(tmp) / ('ep9998-test-' + lang)
                self.assertEqual(CHECK.load_config(project), (lang, 'formal'))
                lines = json.loads((project / 'lines.json').read_text(encoding='utf-8'))
                CHECK.validate(REGISTRY, lines, lang)
                self.assertTrue((project / 'check-cast.mjs').is_file())
                if lang == 'en':
                    self.assertIn('Whose time?', (project / 'main.js').read_text(encoding='utf-8'))
                    self.assertNotIn('为什么', (project / 'story.js').read_text(encoding='utf-8'))
                repeat = subprocess.run([sys.executable, '-B', str(ROOT / 'scripts/new_episode.py'), '9998', 'test-' + lang, tmp], capture_output=True)
                self.assertNotEqual(repeat.returncode, 0)

    def test_timeline_repeated_line_and_invalid_duration(self):
        uri = (TEMPLATE / 'timeline.js').as_uri()
        js = f"import {{buildTimeline}} from {json.dumps(uri)}; import assert from 'node:assert/strict'; assert.throws(()=>buildTimeline([{{line:'a1'}},{{line:'a1'}}],()=>1),/重复引用/); assert.throws(()=>buildTimeline([{{line:'a1'}}],()=>0),/时长无效/); assert.equal(buildTimeline([{{shot:'s'}},{{line:'a1'}},{{line:'b1'}}],()=>1).DUR,2.16);"
        result = subprocess.run(['node', '--input-type=module', '-e', js], capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(result.returncode, 0, result.stderr)

    @unittest.skipUnless(os.name == 'posix', '构建链运行于 Linux/WSL')
    def test_build_forwards_language_to_asr(self):
        with tempfile.TemporaryDirectory(prefix='baidong-build-') as tmp:
            root = Path(tmp)
            lib = root / 'fake-lib'
            (lib / '.venv/bin').mkdir(parents=True)
            (lib / 'core/tts').mkdir(parents=True)
            (lib / 'core/render').mkdir(parents=True)
            (lib / 'core/render/page.mjs').write_text('// 仅供隔离测试；不渲染视频。\n', encoding='utf-8')
            py = lib / '.venv/bin/python'
            py.write_text('#!/bin/sh\nexec "' + sys.executable + '" "$@"\n', encoding='utf-8')
            py.chmod(0o755)
            (lib / 'core/tts/asr_check.py').write_text("import sys; print('ASR_LANGUAGE=' + sys.argv[sys.argv.index('--lang')+1]); sys.exit(77)", encoding='utf-8')
            for lang in ('zh', 'en'):
                subprocess.run([sys.executable, '-B', str(ROOT / 'scripts/new_episode.py'), '9999', 'build-' + lang, str(root), '--language', lang], check=True, capture_output=True)
                project = root / ('ep9999-build-' + lang)
                result = subprocess.run(['sh', str(project / 'build.sh'), 'from=asr'], env={**os.environ, 'LIB': str(lib)}, capture_output=True, text=True, encoding='utf-8')
                self.assertEqual(result.returncode, 77, result.stderr)
                self.assertIn('ASR_LANGUAGE=' + lang, result.stdout)
                invalid = subprocess.run(['sh', str(project / 'build.sh'), 'from=typo'], env={**os.environ, 'LIB': str(lib)}, capture_output=True, text=True, encoding='utf-8')
                self.assertEqual(invalid.returncode, 2)
                self.assertNotIn('done:', invalid.stdout)


if __name__ == '__main__':
    unittest.main(verbosity=2)
