"""校验本期台词是否严格绑定白洞正式角色和固定声音。"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
registry = json.loads((HERE / 'characters.json').read_text(encoding='utf-8'))
lines = json.loads((HERE / 'lines.json').read_text(encoding='utf-8'))
formal = registry['formal']
legacy = registry['legacy']
expected_ids = {'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'}
if set(formal) != expected_ids:
    raise SystemExit(f'角色注册表必须正好包含 A1–D2：{sorted(formal)}')
names = [v['name'] for v in formal.values()]
if len(names) != len(set(names)):
    raise SystemExit('正式角色姓名重复。')
voices = [v['voice'] for v in formal.values()]
if len(voices) != len(set(voices)):
    raise SystemExit('正式角色的 Edge TTS voice 重复，禁止一人多名共用同一音色。')
seen = {}
for line in lines:
    who = line.get('who')
    if who not in formal and who not in legacy:
        raise SystemExit(f"台词 {line.get('id', '<unknown>')} 使用了未注册人物：{who!r}")
    if who in formal:
        spec = formal[who]
        for field in ('voice', 'rate', 'pitch'):
            if not line.get(field):
                raise SystemExit(f"台词 {line.get('id', '<unknown>')}（{who}·{spec['name']}）缺少 {field}。")
        if line['voice'] != spec['voice']:
            raise SystemExit(f"台词 {line.get('id', '<unknown>')}（{who}·{spec['name']}）声音不一致：{line['voice']} != {spec['voice']}")
        if line['rate'] != spec['rate'] or line['pitch'] != spec['pitch']:
            raise SystemExit(f"台词 {line.get('id', '<unknown>')}（{who}·{spec['name']}）语速/音调不一致。")
    previous = seen.setdefault(who, line.get('voice'))
    if previous != line.get('voice'):
        raise SystemExit(f"人物 {who} 在本期出现了多个 voice：{previous} / {line.get('voice')}")
print(f"character check passed: {len(formal)} formal characters, {len(lines)} lines, {len(seen)} speakers")
