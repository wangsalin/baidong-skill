"""针对本次事故的行为回归：固定包装、待确认声音、旧音频及不完整声画记录。"""
import copy
import json
from pathlib import Path
import runpy
import shutil
import subprocess
import tempfile
import unittest
import wave

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / 'assets/episode-template'
GATE = runpy.run_path(str(TEMPLATE / 'check-production.py'))
CHECK = runpy.run_path(str(TEMPLATE / 'check-characters.py'))


class ProductionRegression(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='baidong-safety-')
        self.root = Path(self.tmp.name) / 'episode'
        shutil.copytree(TEMPLATE, self.root, ignore=shutil.ignore_patterns('voices', 'out', '__pycache__'))

    def tearDown(self):
        self.tmp.cleanup()

    def test_preview_explicitly_identified(self):
        self.assertEqual(GATE['validate'](self.root)['voice_status'], 'candidate-preview-only')

    def test_unapproved_final_rejected_in_both_languages(self):
        for lang in ('zh', 'en'):
            config = {'language': lang, 'stage': 'final', 'aspect': 'portrait'}
            (self.root / 'episode.json').write_text(json.dumps(config), encoding='utf-8')
            with self.subTest(lang=lang), self.assertRaisesRegex(ValueError, '尚无最终认可'):
                GATE['validate'](self.root)

    def test_brand_or_character_replacement_rejected(self):
        for name in ('main.js', 'brand.js', 'formal-art.js', 'voice.py', 'check-cast.mjs'):
            target = self.root / name
            original = target.read_bytes()
            target.write_bytes(original + b'\n// unexpected replacement\n')
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, '固定资产'):
                GATE['validate'](self.root)
            target.write_bytes(original)

    def test_exact_approved_sample_allowed_but_profile_change_rejected(self):
        # 仅隔离测试夹具：此记录不会写回实际声音库，不代表真实用户确认。
        refs = json.loads((self.root / 'voice-reference.json').read_text(encoding='utf-8'))
        profile = GATE['digest'](self.root / 'voice.py')
        for spec in refs['zh'].values():
            spec.update(status='approved', approval_evidence='isolated-test-fixture', profile_sha256=profile)
        (self.root / 'voice-reference.json').write_text(json.dumps(refs), encoding='utf-8')
        (self.root / 'episode.json').write_text(json.dumps({'language':'zh','stage':'final','aspect':'landscape'}), encoding='utf-8')
        self.assertTrue(GATE['validate'](self.root)['passed'])
        refs['zh']['A1']['profile_sha256'] = 'outdated-profile'
        (self.root / 'voice-reference.json').write_text(json.dumps(refs), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, '后处理版本'):
            GATE['validate'](self.root)

    def test_episode_scene_edit_allowed(self):
        with (self.root / 'scenes.js').open('a', encoding='utf-8') as f:
            f.write('\n// 本期镜头调整\n')
        self.assertTrue(GATE['validate'](self.root)['passed'])

    def test_missing_source_skill_rejected(self):
        source = {'skill_root': str(self.root / 'missing-skill')}
        (self.root / '.baidong.json').write_text(json.dumps(source), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, '源 Skill'):
            GATE['validate'](self.root)

    def test_subtitle_change_invalidates_cached_video(self):
        # 改字幕但保留 say 和字符集合时，声音、字库都不变，画面仍必须重渲染。
        voices = self.root / 'voices'
        voices.mkdir()
        for name in ('dur.json', 'lips.json'):
            (voices / name).write_text('{}', encoding='utf-8')
        lines = [{'id': 'one', 'who': 'A1', 'text': '先说再想', 'say': '先说再想'}]
        target = self.root / 'lines.json'
        target.write_text(json.dumps(lines), encoding='utf-8')
        before = GATE['visual_key'](self.root)
        lines[0]['text'] = '先想再说'
        target.write_text(json.dumps(lines), encoding='utf-8')
        self.assertNotEqual(before, GATE['visual_key'](self.root))

    def test_unique_but_wrong_name_rejected(self):
        registry = json.loads((TEMPLATE / 'characters.json').read_text(encoding='utf-8'))
        registry['formal']['A1']['name'] = '另一个名字'
        lines = json.loads((TEMPLATE / 'lines.json').read_text(encoding='utf-8'))
        with self.assertRaisesRegex(ValueError, '确认名单'):
            CHECK['validate'](registry, lines)

    def test_audio_replaced_or_text_changed_rejected(self):
        lines = json.loads((self.root / 'lines.json').read_text(encoding='utf-8'))
        voices = self.root / 'voices'
        voices.mkdir()
        fonts = self.root / 'fonts'
        (fonts / 'fonts.css').write_text('/* isolated test font fixture */', encoding='utf-8')
        font = runpy.run_path(str(fonts / 'fetch_fonts.py'))
        import hashlib
        (fonts / 'coverage.json').write_text(json.dumps({'chars_sha256': hashlib.sha256(font['chars']().encode()).hexdigest()}), encoding='utf-8')
        profile = GATE['digest'](self.root / 'voice.py')
        provenance = {}
        for line in lines:
            wav = voices / (line['id'] + '.wav')
            with wave.open(str(wav), 'wb') as f:
                f.setparams((1, 2, 48000, 0, 'NONE', 'not compressed'))
                f.writeframes(b'\0\0' * 4800)
            provenance[line['id']] = {'key': GATE['audio_key'](line, profile), 'wav_sha256': GATE['digest'](wav)}
        (voices / 'source.json').write_text(json.dumps(provenance), encoding='utf-8')
        (voices / 'dur.json').write_text(json.dumps({l['id']: .1 for l in lines}), encoding='utf-8')
        (voices / 'lips.json').write_text(json.dumps({l['id']: {'o': [.2, .3]} for l in lines}), encoding='utf-8')
        (voices / 'asr-current.json').write_text(json.dumps({'source_sha256': GATE['digest'](voices / 'source.json')}), encoding='utf-8')
        self.assertTrue(GATE['validate'](self.root, 'render')['passed'])
        changed = copy.deepcopy(lines)
        changed[0]['text'] += '新的台词'
        (self.root / 'lines.json').write_text(json.dumps(changed), encoding='utf-8')
        (fonts / 'coverage.json').write_text(json.dumps({'chars_sha256': hashlib.sha256(font['chars']().encode()).hexdigest()}), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, '重新执行'):
            GATE['validate'](self.root, 'render')
        (self.root / 'lines.json').write_text(json.dumps(lines), encoding='utf-8')
        (fonts / 'coverage.json').write_text(json.dumps({'chars_sha256': hashlib.sha256(font['chars']().encode()).hexdigest()}), encoding='utf-8')
        (voices / (lines[0]['id'] + '.wav')).write_bytes(b'audio-from-another-speaker')
        with self.assertRaisesRegex(ValueError, '重新执行'):
            GATE['validate'](self.root, 'render')

    def test_cast_missing_records_duplicates_and_omissions_rejected(self):
        script = r'''
import assert from 'node:assert/strict';
import {scanCast} from SCANNER;
const cue={id:'one',who:'A1',t0:0,t1:1};
const expected=[{id:'one',who:'A1',duration:1}];
const healthy=()=>{window.FRAME_CAST=['A1'];window.FRAME_SPEAKING=['A1'];window.FRAME_OCCLUDED=false;};
globalThis.window={DUR:2,CAST_CUES:[cue],EV:[{type:'vo',id:'one',who:'A1',t:0}],CAST_BOUNDARIES:[0,1],render:healthy};
assert.equal(scanCast(expected).passed,true);
window.render=()=>{window.FRAME_CAST=['A1'];window.FRAME_SPEAKING=['A1'];};
assert.throws(()=>scanCast(expected),/缺少/);
window.render=healthy;window.CAST_CUES=[cue,cue];assert.throws(()=>scanCast(expected),/重复/);
window.CAST_CUES=[cue];assert.throws(()=>scanCast([...expected,{id:'two',who:'B2',duration:1}]),/覆盖/);
window.render=()=>{healthy();window.FRAME_SPEAKING=[];};assert.equal(scanCast(expected).passed,false);
'''.replace('SCANNER', json.dumps((TEMPLATE / 'cast-check.js').as_uri()))
        result = subprocess.run(['node', '--input-type=module', '-e', script], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == '__main__':
    unittest.main(verbosity=2)
