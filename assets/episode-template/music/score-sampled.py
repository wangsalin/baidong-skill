"""白洞的配乐：真实乐器采样 → music/score.wav（48 kHz 立体声，和全片一样长）。
气质：轻快、有推进感的知识类配乐，112 拍，D 大调。拨弦弦乐的律动 + 弹性钢琴 + 马林巴旋律 + 拍手沙锤大鼓。
音色库（都装在 $LIB/core/audio/instruments，需先下载）：
  sh tools/fetch.sh instruments salamander   钢琴，CC BY 3.0（片尾要署名）
  sh tools/fetch.sh instruments vsco2ce      弦乐、铜管断奏、定音鼓、大鼓、镲、铃鼓，CC0
  sh tools/fetch.sh instruments vcsl         马林巴、拍手、沙锤、踩镲，CC0
为了不抢对白：有人说话时去掉旋律，只留律动和和弦；空档里马林巴旋律出来。
段落（story.js 的 cue）：
  theme   主题：完整律动 + 空档里的旋律
  think   思考：律动减半（拨弦 + 沙锤 + 马林巴点缀），没有大鼓
  tension 紧张：低音弦乐十六分音符推进 + 定音鼓 + 军鼓滚奏渐强
  resolve 释然：重音（镲 + 定音鼓 + 铜管和弦）接上明亮的律动
  silence 静音：连混响一起切掉
  end     片尾：一两小节律动 + 收尾重音
不认识的名字按 theme 处理。用法：LIB=~/lemo-opuscar python music/score.py"""
import json, os, sys, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar')); sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR

E = json.load(open(os.path.join(ROOT, 'events.json'))); DUR = E['dur']
CUES = [e for e in E['ev'] if e['type'] == 'cue']
DURS = {}
for f in ('voices/dur.json', 'voices/raw/dur.json'):
    p = os.path.join(ROOT, f)
    if os.path.exists(p): DURS = json.load(open(p)); break
BUSY = [(e['t'] - .2, e['t'] + DURS.get(e['id'], 2.0) + .15) for e in E['ev'] if e['type'] == 'vo']
busy = lambda t, d=.3: any(a < t + d and t < b for a, b in BUSY)
BPM = 112; BEAT = 60 / BPM; BAR = 4 * BEAT
rng = np.random.default_rng(112); S.seed(112)
HAVE = {}
def have(inst):   # 某个音色库没下载时跳过那件乐器，不让整首失败
    if inst not in HAVE:
        try: S.load(inst); HAVE[inst] = True
        except Exception as e: HAVE[inst] = False; print('（跳过 %s：%s）' % (inst, str(e)[:60]))
    return HAVE[inst]
EV = []
def N(t, inst, pitch, dur, vel, pan=0., **kw):
    if t < 0 or t > DUR or not have(inst): return
    EV.append(dict(t=t + rng.uniform(-.006, .006), inst=inst, pitch=pitch, dur=dur, vel=float(np.clip(vel * rng.uniform(.93, 1.05), .05, 1)), pan=pan, **kw))
def Hh(t, inst, var, vel, pan=0.):   # 无音高的打击乐
    if t < 0 or t > DUR or not have(inst): return
    EV.append(dict(t=t + rng.uniform(-.004, .004), inst=inst, pitch=var, dur=None, vel=float(np.clip(vel * rng.uniform(.9, 1.05), .05, 1)), pan=pan))

CH = {'D': ['D3', 'A3', 'D4', 'F#4', 'A4'], 'A': ['A2', 'E3', 'A3', 'C#4', 'E4'], 'Bm': ['B2', 'F#3', 'B3', 'D4', 'F#4'], 'G': ['G2', 'D3', 'G3', 'B3', 'D4'],
      'Em': ['E3', 'B3', 'E4', 'G4', 'B4'], 'F#m': ['F#2', 'C#3', 'F#3', 'A3', 'C#4']}
PROGS = [['D', 'A', 'Bm', 'G'], ['G', 'A', 'F#m', 'Bm'], ['D', 'G', 'Em', 'A'], ['Bm', 'G', 'D', 'A']]
SCALE = [S.midi(n) for n in ['A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'D6']]
TONES = {k: [S.midi(n) % 12 for n in v] for k, v in CH.items()}
def mel(prev, ch):
    c = [m for m in SCALE if m % 12 in TONES[ch]] or SCALE
    c.sort(key=lambda m: abs(m - prev) + rng.uniform(0, 4)); return c[0]
up = lambda n, k=12: S.midi(n) + k

def groove(tb, t1, ch, full=True, melody=True, state={'prev': S.midi('F#5')}):
    n = CH[ch]
    for k in range(4):   # 一小节四拍
        t = tb + k * BEAT
        if t >= t1: break
        if full and k in (0, 2): Hh(t, 'bass_drum', None, .55)
        if full and k == 2: Hh(t + BEAT / 2, 'bass_drum', None, .35)
        if k in (1, 3): Hh(t, 'claps', None, .5 if full else .3, .1)
        N(t + BEAT / 2, 'piano', n[2], .14, .42, -.1); N(t + BEAT / 2 + .005, 'piano', n[3], .14, .38, -.1)   # 反拍的短和弦
    for s in range(16):   # 沙锤十六分音符
        t = tb + s * BEAT / 4
        if t < t1: Hh(t, 'shaker', None, (.32 if s % 4 == 2 else .2) * (1 if full else .8), .35)
    for s, idx in enumerate([0, 2, 3, 2, 1, 3, 4, 3]):   # 小提琴拨弦，八分音符跳动
        t = tb + s * BEAT / 2
        if t < t1: N(t, 'violins_pizz', up(n[idx]), .3, .42, .3)
    for b, d in [(0, .7), (1.5, .4), (2, .7), (3.5, .3)]:   # 低音拨弦
        t = tb + b * BEAT
        if t < t1: N(t, 'contrabass_pizz', n[0], d, .62, -.2)
    if melody and not busy(tb, BAR):   # 空档里才放马林巴旋律
        rh = [(0, 1), (1, .5), (1.5, .5), (2, 1.5), (3.5, .5)] if rng.random() < .5 else [(0, .5), (.5, .5), (1, 1), (2.5, .5), (3, 1)]
        for b, d in rh:
            t = tb + b * BEAT
            if t < t1 - .1: state['prev'] = mel(state['prev'], ch); N(t, 'marimba', state['prev'], d * BEAT, .6, .15)

def theme(t0, t1, j=0):
    for i in range(int((t1 - t0) / BAR) + 1):
        tb = t0 + i * BAR
        if tb >= t1 - .1: break
        ch = PROGS[(j + i // 4) % 4][i % 4]
        if i == 0: Hh(tb, 'crash', None, .35)
        groove(tb, t1, ch, full=True)
        if i % 4 == 3 and tb + 3 * BEAT < t1: [Hh(tb + 3 * BEAT + k * BEAT / 4, 'snare', None, .25 + k * .08) for k in range(4)]   # 每四小节一个小过门
def think(t0, t1, j=0):
    for i in range(int((t1 - t0) / BAR) + 1):
        tb = t0 + i * BAR
        if tb >= t1 - .1: break
        ch = ['Em', 'G', 'D', 'A'][i % 4]
        groove(tb, t1, ch, full=False, melody=False)
        if not busy(tb + BEAT, BEAT): N(tb + BEAT, 'marimba', up(CH[ch][3]), BEAT, .45, .2)
def tension(t0, t1, j=0):
    d = t1 - t0
    for s in range(int(d / (BEAT / 4))):   # 低音弦乐十六分音符推进
        t = t0 + s * BEAT / 4; N(t, 'cellos_spic', 'B2' if (s // 8) % 2 == 0 else 'C3', .12, .45 + .25 * s / max(1, d / (BEAT / 4)), -.2)
    for k in range(int(d / BEAT)):
        t = t0 + k * BEAT
        if k % 2 == 0: N(t, 'timpani', 'B1', BEAT, .5, 0)
        Hh(t, 'bass_drum', None, .4)
    N(t0, 'violins', 'F#4', d, .25, .3, attack=d * .8); N(t0, 'violas', 'B3', d, .22, .2, attack=d * .8)
    roll = max(BEAT, min(2 * BEAT, d / 2))
    for k in range(int(roll / (BEAT / 6))): Hh(t1 - roll + k * BEAT / 6, 'snare', None, .2 + .5 * k / max(1, roll / (BEAT / 6)))
def resolve(t0, t1, j=0):
    Hh(t0, 'crash', None, .6); N(t0, 'timpani', 'D2', 1.5, .7); Hh(t0, 'bass_drum', None, .8)
    for m in ['D4', 'F#4', 'A4']: N(t0, 'horn_stac', m, .4, .6, 0)
    for m in ['D3', 'A3']: N(t0, 'cellos', m, 2.5, .4, -.2, attack=.2)
    N(t0, 'violins', 'F#5', 2.5, .38, .3, attack=.3)
    for i in range(int((t1 - t0 - BEAT) / BAR) + 1):
        tb = t0 + BEAT + i * BAR
        if tb >= t1 - .1: break
        groove(tb, t1, ['D', 'G', 'A', 'D'][i % 4], full=True)
def end(t0, t1, j=0):
    hit = max(t0, t1 - 2.2)
    for i in range(int((hit - t0) / BAR) + 1):
        tb = t0 + i * BAR
        if tb >= hit: break
        groove(tb, hit, ['G', 'A', 'D', 'D'][i % 4], full=True, melody=False)
    Hh(hit, 'crash', None, .65); Hh(hit, 'bass_drum', None, .85); N(hit, 'timpani', 'D2', 2.0, .65)
    for m in CH['D']: N(hit, 'piano', m, 2.0, .55, -.1)
    for m in ['D4', 'F#4', 'A4']: N(hit, 'horn_stac', m, .5, .55)
    N(hit, 'contrabass_pizz', 'D2', 1.0, .7); N(hit, 'violins', 'D5', 2.0, .35, .3, attack=.05)

FN = {'think': think, 'tension': tension, 'resolve': resolve, 'end': end}
CUTS = []
for j, c in enumerate(CUES):
    t0, t1 = c['t0'], c['t1'] if c.get('t1') is not None else DUR
    if c['name'] == 'silence': CUTS.append((t0, t1)); continue
    FN.get(c['name'], theme)(t0, t1, j)
used = sorted({e['inst'] for e in EV})
mix = S.render(EV, dur=DUR + 3) if EV else np.zeros((int((DUR + 3) * SR), 2), np.float32)
mix = S.room(mix, size=.35, mix=.14)
Nn = int(DUR * SR); mix = mix[:Nn]
for a0, a1 in CUTS:   # 静音段连混响尾音一起切掉
    a, b = int(a0 * SR), int(min(a1, DUR) * SR); f = int(.05 * SR)
    if b > a: mix[a:b] = 0; mix[max(0, a - f):a] *= np.linspace(1, 0, min(f, a))[:, None]
f = int(min(.8, DUR / 6) * SR); mix[-f:] *= np.linspace(1, 0, f)[:, None]
pk = np.abs(mix).max() or 1; mix = mix / pk * .89
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR)
cr = S.credits(used) if used else ''
open(os.path.join(HERE, 'credits.txt'), 'w', encoding='utf-8').write('\n'.join(cr) if isinstance(cr, (list, tuple)) else str(cr))
print('score.wav', round(DUR, 2), 's,', BPM, 'BPM,', len(CUES), 'cues,', len(EV), 'notes; instruments:', ', '.join(used))
