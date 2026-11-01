"""配音前校验台词 ID、语言、正式人物和固定音色；旧角色需显式启用。"""
import json
from pathlib import Path
import re
import sys

HERE = Path(__file__).resolve().parent
EXPECTED_IDS = {'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'}
EXPECTED_NAMES = dict(zip(('A1','A2','B1','B2','C1','C2','D1','D2'),('阿津','跳跳','丁叔','小算盘','流程哥','小账本','有戏','反问姐')))


def load_config(root):
    path = root / 'episode.json'
    config = json.loads(path.read_text(encoding='utf-8')) if path.is_file() else {}
    language = config.get('language', 'zh')
    mode = config.get('character_mode', 'formal')
    if language not in ('zh', 'en'):
        raise ValueError(f'不支持的配音语言：{language!r}；应为 zh 或 en。')
    if mode not in ('formal', 'legacy'):
        raise ValueError(f'不支持的角色模式：{mode!r}')
    if mode == 'legacy' and language != 'zh':
        raise ValueError('历史双人模板只提供中文注册音色；英文新期使用正式角色。')
    return language, mode


def validate(registry, lines, language='zh', mode='formal'):
    formal = registry['formal']
    if set(formal) != EXPECTED_IDS:
        raise ValueError(f'角色注册表必须正好包含 A1–D2：{sorted(formal)}')
    names = [v['name'] for v in formal.values()]
    if len(names) != len(set(names)):
        raise ValueError('正式角色姓名重复。')
    if any(formal[k]['name'] != EXPECTED_NAMES[k] for k in EXPECTED_IDS):
        raise ValueError('正式角色姓名与确认名单不一致。')
    if language not in ('zh', 'en') or mode not in ('formal', 'legacy'):
        raise ValueError('语言或角色模式无效。')
    voices = formal if language == 'zh' else registry.get('languages', {}).get(language, {})
    if set(voices) != EXPECTED_IDS:
        raise ValueError(f'{language} 音色注册表必须包含全部八位角色。')
    if len({v['voice'] for v in voices.values()}) != len(EXPECTED_IDS):
        raise ValueError(f'{language} 正式角色 voice 重复。')
    allowed = dict(voices)
    if mode == 'legacy':
        if language != 'zh':
            raise ValueError('历史双人模式不提供英语音色。')
        allowed.update(registry.get('legacy', {}))
    if not isinstance(lines, list) or not lines:
        raise ValueError('lines.json 必须是非空台词数组。')
    ids, speakers = set(), set()
    for line in lines:
        if not isinstance(line, dict):
            raise ValueError('每条台词必须为对象。')
        key, who = line.get('id'), line.get('who')
        if not isinstance(key, str) or not re.fullmatch(r'[A-Za-z0-9_-]+', key):
            raise ValueError(f'台词 ID 无效：{key!r}；只用字母、数字、下划线或连字符。')
        if key in ids:
            raise ValueError(f'台词 ID 重复：{key}；会覆盖配音文件和时间线，必须改成唯一 ID。')
        ids.add(key)
        for field in ('text', 'say', 'asr'):
            if field == 'text' or field in line:
                if not isinstance(line.get(field), str) or not line[field].strip():
                    raise ValueError(f'台词 {key} 的 {field} 必须是非空文字。')
        if who not in allowed:
            raise ValueError(f'台词 {key} 使用未启用人物：{who!r}；新期仅使用 A1–D2，历史工程需显式设 character_mode=legacy。')
        spec = allowed[who]
        for field in ('voice', 'rate', 'pitch'):
            if line.get(field) != spec[field]:
                raise ValueError(f'台词 {key}（{who}）{field} 不一致：{line.get(field)!r} != {spec[field]!r}（{language}）')
        speakers.add(who)
    return len(lines), len(speakers)


def main():
    language, mode = load_config(HERE)
    registry = json.loads((HERE / 'characters.json').read_text(encoding='utf-8'))
    lines = json.loads((HERE / 'lines.json').read_text(encoding='utf-8'))
    count, speakers = validate(registry, lines, language, mode)
    if '--language' in sys.argv:
        print(language)
    else:
        print(f'character check passed: {language}, {mode}, {count} lines, {speakers} speakers')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, TypeError) as exc:
        raise SystemExit(str(exc))
