"""把本期用到的字取成字体子集（Google Fonts，SIL OFL 1.1），写 fonts.css。
在 Windows 的 Git Bash 里运行（要走代理才能访问 Google）：python fonts/fetch_fonts.py
改了台词或画面文字以后要重跑，否则新字会显示成别的字体。"""
import os, re, json, hashlib, urllib.request, urllib.parse
from pathlib import Path
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'}
FILES = ['lines.json', 'story.js', 'main.js', 'brand.js', 'cover.js', 'worlds.js', 'chars.js',
         'characters.js', 'characters.json', 'portrait.js', 'scenes.js']

def chars():
    s = set()
    for f in FILES:
        p = os.path.join(ROOT, f)
        if os.path.exists(p):
            with open(p, encoding='utf-8') as source:
                s |= set(source.read())
    keep = {c for c in s if ord(c) > 127 and not c.isspace()}
    keep |= set('0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:;!?-–·()/"\'%+')
    return ''.join(sorted(keep))

def get(url): return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()

def font_url(family, text):
    return 'https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(family) + '&text=' + urllib.parse.quote(text) + '&display=block'

def text_chunks(text, limit=1600):
    # 长 text 查询在服务端可能退回整套 unicode-range CSS（101个链接）。
    # 保持每次编码后的 text 较短，并在本地 CSS 以不重叠字符范围组合。
    result, chunk, length = [], '', 0
    for char in text:
        cost = len(urllib.parse.quote(char))
        if chunk and length + cost > limit:
            result.append(chunk)
            chunk, length = '', 0
        chunk += char
        length += cost
    if chunk:
        result.append(chunk)
    return result

def fetch(family, out, text):
    faces = []
    name, weight = family.split(':wght@')
    chunks = text_chunks(text)
    for index, chunk in enumerate(chunks):
        css = get(font_url(family, chunk)).decode()
        urls = re.findall(r'url\((https://[^)]+)\)', css)
        if len(urls) != 1:
            raise ValueError(f'{family}: subset {index + 1} expected one file, got {len(urls)}; no fallback fonts written')
        filename = out if len(chunks) == 1 else out.replace('.woff2', f'-{index + 1:02}.woff2')
        target = Path(HERE, filename)
        target.write_bytes(get(urls[0]))
        ranges = ','.join(f'U+{ord(c):04X}' for c in chunk)
        faces.append(f"@font-face {{ font-family: '{name}'; font-weight: {weight}; font-display: block; src: url({filename}) format('woff2'); unicode-range: {ranges}; }}\n")
        print(family, '->', filename, target.stat().st_size, 'bytes')
    return ''.join(faces)

if __name__ == '__main__':
    txt = chars(); print(len(txt), 'characters')
    css = ''.join(fetch(family, filename, txt) for family, filename in [
        ('Noto Sans SC:wght@900', 'notosanssc-900.woff2'),
        ('Noto Serif SC:wght@900', 'notoserifsc-900.woff2'),
        ('Noto Serif SC:wght@400', 'notoserifsc-400.woff2')])
    open(os.path.join(HERE, 'fonts.css'), 'w', encoding='utf-8', newline='\n').write(
        "/* Google Fonts, SIL Open Font License 1.1 — bounded per-character subsets (fetch_fonts.py) */\n" + css)
    with open(os.path.join(HERE, 'coverage.json'), 'w', encoding='utf-8') as f:
        json.dump({'chars_sha256': hashlib.sha256(txt.encode()).hexdigest()}, f)
