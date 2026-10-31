"""混音：合成音效（events.json）+ 配音（voices/）+ 配乐（music/score.wav，对白下压低约 7 dB）+ 每个场景的环境声 → mix.wav
用法：LIB=~/lemo-opuscar python mix.py（先跑 core/render/events.mjs、voice.py、music/score.py）
新音效：在 FX 里加一个函数，story.js 里用 fx: '名字' 触发。"""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar')), 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, norm, click, clack, whoosh, pop, ding, thump, compress, limit, add
from scipy.ndimage import maximum_filter1d, uniform_filter1d
from scipy.signal import fftconvolve
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(round(DUR * SR))
LINES = {l['id']: l for l in json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))}
rng = np.random.default_rng(5)
def nz(d): return rng.standard_normal(int(round(d * SR)))
def brown(d): w = np.cumsum(nz(d)); w -= np.linspace(w[0], w[-1], len(w)); return norm(hp(w, 20))
def fade(x, a=.005, r=.02):
    n = len(x); x = x.copy(); A, R = min(n, int(a * SR)), min(n, int(r * SR)); x[:A] *= np.linspace(0, 1, A); x[n - R:] *= np.linspace(1, 0, R); return x
def bpsweep(x, f0, f1, q=.35):
    out = np.zeros_like(x); n = len(x)
    for i in range(0, n, 480):
        f = f0 * (f1 / f0) ** (i / n); s = bp(x[max(0, i - 2400):i + 480], f * (1 - q), min(f * (1 + q), 20000)); out[i:i + 480] = s[-len(out[i:i + 480]):]
    return out
sfxb, vob, amb = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))

# —— 音效 ——
def impact(v=1.):   # 重击：低频冲击 + 一声脆响 + 短暂的尾巴
    d = 1.0; tt = t_(d)
    sub = np.sin(2 * np.pi * np.cumsum(38 + 110 * np.exp(-tt / .05)) / SR) * env_exp(d, .32)
    crack = bp(nz(d), 1200, 8000) * env_exp(d, .035)
    tail = lp(nz(d), 2500) * env_exp(d, .18) * .35
    return norm(sub + crack * .7 + tail) * v
def riser(d=1.1):   # 上扬：噪声和音高一起往上走，越来越响
    tt = t_(d); x = bpsweep(nz(d), 300, 7000, .3) * (tt / d) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(200 * (8 ** (tt / d))) / SR) * (tt / d) ** 3 * .35
    return norm(x + tone)
def wipe_sfx():   # 白洞转场：快速的呼啸 + 重击
    d = .45; s = np.sin(np.pi * t_(d) / d); x = bpsweep(nz(d), 600, 6000, .3) * s ** 1.5
    y = np.zeros(int(1.2 * SR)); y[:len(x)] += x * .8; hit = impact(.9); st = int(.16 * SR); y[st:st + len(hit)] += hit[:len(y) - st]
    return norm(y)
def opener_sfx():   # 片头：重击 + 明亮的闪光音（上扬在片头前 1.1 秒单独放）
    d = 1.4; tt = t_(d)
    shim = sum(np.sin(2 * np.pi * f * tt) for f in (1320, 1760, 2640)) / 3 * env_exp(d, .45) * .4
    y = impact(1.); y = np.pad(y, (0, max(0, len(shim) - len(y)))); y[:len(shim)] += shim
    return norm(y)
def end_sfx():   # 片尾：重击 + 明亮的钟
    d = 2.0; tt = t_(d)
    bell = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau) for f, a, tau in [(784, 1, .9), (1568, .4, .5), (2352, .2, .3)])
    y = impact(.8); y = np.pad(y, (0, len(bell) - len(y))); return norm(y + bell * .5)
def cut_sfx():   # 普通切镜头：一声很短的“嗖”
    d = .18; return norm(bp(nz(d), 2000, 9000) * np.sin(np.pi * t_(d) / d) ** 2)
def tagpop():   # 场景标签弹出：清脆的“哒”
    d = .09; tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(1800 - 900 * tt / d) / SR) * env_exp(d, .025) + hp(nz(d), 4000) * env_exp(d, .004) * .4)
def thud(): return norm(thump(1, 70) + np.pad(lp(nz(.15), 1200) * env_exp(.15, .03), (0, int(.2 * SR))))
def paper(): d = .35; tt = t_(d); return norm(hp(nz(d), 2000) * (rng.random(len(tt)) > .55) * np.sin(np.pi * tt / d))
def whip(): d = .2; return norm(bp(nz(d), 1500, 7000) * np.sin(np.pi * t_(d) / d) ** 2)
def beep(): d = .18; tt = t_(d); return norm(np.sign(np.sin(2 * np.pi * 1320 * tt)) * (tt < .07) * .5 + np.sign(np.sin(2 * np.pi * 1760 * tt)) * (tt >= .09) * (tt < .16) * .5)
def boing(): d = .7; tt = t_(d); f = 180 * (1 + .35 * np.sin(2 * np.pi * 16 * tt) * np.exp(-tt / .25)) * (1 + .6 * np.exp(-tt / .04)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .22))
def step_(): d = .15; return norm(thump(.6, 110)[:int(d * SR)] + bp(nz(d), 300, 1800)[:int(d * SR)] * env_exp(d, .02) * .5)
def sniff(): d = .45; tt = t_(d); return norm(bp(nz(d), 1500, 6000) * ((np.sin(2 * np.pi * 6.5 * tt) > 0) * np.sin(np.pi * tt / d)))
def kazoo():
    d = .9; tt = t_(d); f = 330 * np.where(tt < .2, 1, np.where(tt < .4, 1.12, .84 - .1 * (tt - .4)))
    ph = np.cumsum(f * (1 + .02 * np.sin(2 * np.pi * 6 * tt))) / SR; x = 2 * (ph % 1) - 1
    return fade(norm(bp(x, 500, 900) + bp(x, 1100, 1800) * .6) * np.minimum(1, (d - tt) / .3), .01, .05)
def typing(d=1.5):
    x = np.zeros(int(round(d * SR)))
    for k in range(int(d * 11)):
        c = click(1.6 + rng.random() * .4, .5); s = int((k / 11 + rng.random() * .03) * SR)
        if s + len(c) < len(x): x[s:s + len(c)] += c
    return x
FX = {'wipe': (wipe_sfx, .55), 'opener': (opener_sfx, .65), 'end': (end_sfx, .5), 'cut': (cut_sfx, .22), 'tagpop': (tagpop, .3), 'hit': (impact, .55), 'pop': (lambda: pop(1), .4), 'thud': (thud, .5), 'paper': (paper, .4),
      'whip': (whip, .3), 'beep': (beep, .18), 'boing': (boing, .35), 'step': (step_, .25), 'sniff': (sniff, .25), 'kazoo': (kazoo, .4), 'ding': (lambda: ding(1), .3),
      'click': (lambda: click(1, 1), .3), 'typing': (typing, .25), 'whoosh': (lambda: whoosh(.4), .35)}
for key in ('wipe', 'opener', 'end', 'beep'):
    function, gain = FX[key]
    FX[key] = (function, gain * .28)
for e in E['ev']:
    if e['type'] in FX: f, g = FX[e['type']]; add(sfxb, f() * e.get('v', 1.0), e['t'], g, float(rng.uniform(-.15, .15)))
    if e['type'] in ('opener', 'riser'): add(sfxb, riser(1.1) * e.get('v', 1.0), max(0, e['t'] - 1.1), .035)

# —— 环境声：每个场景一条底噪 ——
def walla(d, n=6, lvl=.03, busy=.9995):
    tt = t_(d); x = np.zeros_like(tt)
    for k in range(n):
        am = uniform_filter1d((rng.random(len(tt)) > busy).astype(float), int(.25 * SR)) * 60
        x += bp(nz(d), 300 + k * 90, 900 + k * 150) * np.clip(am, 0, 1)
    return norm(x) * lvl
def bed(w, d):
    tt = t_(d)
    if w in ('opener', 'end'): return np.zeros_like(tt)
    if w == 'office': return (np.sin(2 * np.pi * 120 * tt) * .004 + lp(brown(d), 400) * .018) + typing(d) * .02
    if w == 'street': return lp(brown(d), 500) * .04 + walla(d, 6, .02)
    if w == 'home': return (np.sin(2 * np.pi * 100 * tt) + .4 * np.sin(2 * np.pi * 200 * tt)) * .006 + lp(brown(d), 250) * .015
    if w == 'night':
        cr = np.sin(2 * np.pi * 4200 * tt) * (np.sin(2 * np.pi * 18 * tt) > .6) * (np.sin(2 * np.pi * .5 * tt) > 0) * .006
        return lp(brown(d), 250) * .012 + cr
    return lp(brown(d), 300) * .01   # studio 和其他：很轻的房间底噪
for e in E['ev']:
    if e['type'] == 'amb': add(amb, fade(bed(e['w'], e['d']), .03, .05), e['t'], 1.0)

# —— 配音：压缩、按响度对齐、加一点房间感 ——
for e in E['ev']:
    if e['type'] != 'vo': continue
    p = os.path.join(HERE, 'voices', e['id'] + '.wav')
    if not os.path.exists(p): continue
    y, sr = sf.read(p); y = compress(y / (np.abs(y).max() + 1e-9), .28, 3.2); y = y / (np.sqrt((y ** 2).mean()) + 1e-9) * .12
    who = LINES.get(e['id'], {}).get('who', 'LAOBAI')
    add(vob, y, e['t'], 1.0 if who == 'LAOBAI' else .9, .1 if who == 'LAOBAI' else -.1)
er = np.zeros(int(.09 * SR)); er[0] = 1
for dly, g in [(.011, .25), (.019, .18), (.031, .12), (.047, .08), (.067, .05)]: er[int(dly * SR)] += g
vob = np.stack([fftconvolve(vob[:, k], er)[:N] for k in range(2)], 1)

# —— 配乐，对白时压低约 7 dB ——
mus, _ = sf.read(os.path.join(HERE, 'music', 'score.wav'))
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
act = (np.abs(vob).max(1) > .01).astype(float)
duck = 1 - .6 * np.clip(uniform_filter1d(maximum_filter1d(act, int(.35 * SR)), int(.2 * SR)), 0, 1)   # 对白时再压低约 8 dB
selection_path = os.path.join(HERE, 'music/selection.json')
selection = json.load(open(selection_path, encoding='utf-8')) if os.path.isfile(selection_path) else {}
BGM_GAIN_DB = float(os.environ.get('BAIDONG_BGM_GAIN_DB', selection.get('gain_db', 9)))
key_reduction_db = float(selection.get('key_reduction_db', -3))
key_duck = np.ones(N)
for e in E['ev']:
    if e['type'] == 'vo' and LINES.get(e['id'], {}).get('music_key'):
        a = max(0, round((e['t'] - .1) * SR))
        b = min(N, round((e['t'] + sf.info(os.path.join(HERE, 'voices', e['id'] + '.wav')).duration + .15) * SR))
        ramp = min(round(.1 * SR), (b - a) // 2)
        level = 10 ** (key_reduction_db / 20)
        key_duck[a:b] = np.minimum(key_duck[a:b], np.r_[np.linspace(1, level, ramp), np.full(b - a - 2 * ramp, level), np.linspace(level, 1, ramp)])
    if e['type'] == 'cue' and e['name'] == 'silence':
        a, b = round(e['t0'] * SR), min(N, round(e['t1'] * SR))
        ramp = min(round(.15 * SR), (b - a) // 2)
        key_duck[a:b] = np.minimum(key_duck[a:b], np.r_[np.linspace(1, .2, ramp), np.full(b - a - 2 * ramp, .2), np.linspace(.2, 1, ramp)])
musd = mus * .62 * 10 ** (BGM_GAIN_DB / 20) * (duck * key_duck)[:, None]
mix = musd + sfxb * 1.2 + vob + amb * .9
for k in range(2): mix[:, k] = limit(mix[:, k], .95)
sf.write(os.path.join(HERE, 'mix.wav'), mix.astype(np.float32), SR)
def db(x): return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
print('mix peak %.3f  rms %.1f dB | voice %.1f  music %.1f  sfx %.1f  amb %.1f' % (np.abs(mix).max(), db(mix), db(vob), db(musd), db(sfxb * .8), db(amb)))
talking = act > 0
if talking.any():
    levels = {'bgm_gain_db': BGM_GAIN_DB, 'key_dialogue_music_reduction_db': key_reduction_db,
              'voice_rms_dbfs_during_speech': float(db(vob[talking])), 'music_rms_dbfs_during_speech': float(db(musd[talking])),
              'voice_music_gap_db': float(db(vob[talking]) - db(musd[talking]))}
    json.dump(levels, open(os.path.join(HERE, 'music/mix-levels.json'), 'w'), ensure_ascii=False, indent=2)
    print('说话时：人声 %.1f dB，音乐 %.1f dB，音乐比人声低 %.1f dB' % (db(vob[talking]), db(musd[talking]), levels['voice_music_gap_db']))
print(' t   voice music  sfx   amb   (每 10 秒一行，含无人说话的空档)')
for s in range(0, int(DUR), 10):
    a, b = s * SR, min(N, (s + 10) * SR)
    print(f'{s:3d} ' + ' '.join(f'{db(x[a:b]):5.0f}' for x in (vob, musd, sfxb * .8, amb)))
