"""把本期用到的字取成字体子集（Google Fonts，SIL OFL 1.1），写 fonts.css。
在 Windows 的 Git Bash 里运行（要走代理才能访问 Google）：python fonts/fetch_fonts.py
改了台词或画面文字以后要重跑，否则新字会显示成别的字体。"""
import os, re, json, hashlib, urllib.request, urllib.parse
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
    keep = {c for c in s if ord(c) > 0x2000}
    keep |= set('0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:;!?-–·()/"\'%+')
    return ''.join(sorted(keep))

def get(url): return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
def fetch(family, out, text):
    css = get('https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(family) + '&text=' + urllib.parse.quote(text) + '&display=block').decode()
    urls = re.findall(r'url\((https://[^)]+)\)', css); assert len(urls) == 1, f'{family}: expected one file, got {len(urls)}'
    open(os.path.join(HERE, out), 'wb').write(get(urls[0])); print(family, '->', out, os.path.getsize(os.path.join(HERE, out)), 'bytes')

if __name__ == '__main__':
    txt = chars(); print(len(txt), 'characters')
    fetch('Noto Sans SC:wght@900', 'notosanssc-900.woff2', txt)
    fetch('Noto Serif SC:wght@900', 'notoserifsc-900.woff2', txt)
    fetch('Noto Serif SC:wght@400', 'notoserifsc-400.woff2', txt)
    open(os.path.join(HERE, 'fonts.css'), 'w', encoding='utf-8', newline='\n').write(
        "/* Google Fonts, SIL Open Font License 1.1 — subset to the characters this episode shows (fetch_fonts.py) */\n"
        "@font-face { font-family: 'Noto Sans SC'; font-weight: 900; font-display: block; src: url(notosanssc-900.woff2) format('woff2'); }\n"
        "@font-face { font-family: 'Noto Serif SC'; font-weight: 900; font-display: block; src: url(notoserifsc-900.woff2) format('woff2'); }\n"
        "@font-face { font-family: 'Noto Serif SC'; font-weight: 400; font-display: block; src: url(notoserifsc-400.woff2) format('woff2'); }\n")
    with open(os.path.join(HERE, 'coverage.json'), 'w', encoding='utf-8') as f:
        json.dump({'chars_sha256': hashlib.sha256(txt.encode()).hexdigest()}, f)
