"""Voice post-processing: voices/raw/<id>.wav (core/tts/tts_zh.py) → voices/<id>.wav (48 kHz, per character)
+ voices/dur.json + voices/lips.json (mouth openness o and brightness b per 1/24 s)
LAOBAI: light saturation + a 180 Hz bump (gravel, deadpan); XIAOWEN: presence boost (bright, quick)
Usage: python voice.py"""
import json, os, numpy as np, soundfile as sf, soxr
from scipy.signal import lfilter
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
L = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
dur, lips = {}, {}
def peq(x, f, gain_db, q=1.0):   # peaking EQ (RBJ biquad)
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]; a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return lfilter(np.array(b) / a[0], np.array(a) / a[0], x)
for l in L:
    y, sr = sf.read(os.path.join(HERE, 'voices/raw', l['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = soxr.resample(y, sr, SR)
    y = y / (np.abs(y).max() + 1e-9) * .9
    if l['who'] == 'LAOBAI':
        sat = np.tanh(y * 2.4) / np.tanh(2.4); y = .72 * y + .28 * sat
        y = peq(y, 180, 2.5, .8); y = peq(y, 2800, -1.2, 1.0)
    else:
        y = peq(y, 3200, 2.0, .9)
    y = y / (np.abs(y).max() + 1e-9) * .9
    sf.write(os.path.join(HERE, 'voices', l['id'] + '.wav'), y.astype(np.float32), SR)
    dur[l['id']] = round(len(y) / SR, 3)
    hop = SR // 24; win = int(.05 * SR)
    yp = np.pad(y, (2048, 2048)); w = np.hanning(win); n = 1 + len(y) // hop
    S = np.stack([np.abs(np.fft.rfft(yp[i * hop + 2048 - win // 2: i * hop + 2048 - win // 2 + win] * w, 4096)) for i in range(n)], 1)
    freqs = np.fft.rfftfreq(4096, 1 / SR)
    rms = np.sqrt((S ** 2).mean(0)); p = np.percentile(rms, 95) + 1e-9
    cen = (S * freqs[:, None]).sum(0) / (S.sum(0) + 1e-9)
    lips[l['id']] = {'o': [round(float(np.clip((r / p - .1) / .8, 0, 1)), 2) for r in rms],
                     'b': [round(float(np.clip((c - 1200) / 2600, 0, 1)), 2) for c in cen]}
    print(l['id'], dur[l['id']])
json.dump(dur, open(os.path.join(HERE, 'voices/dur.json'), 'w'), indent=0)
json.dump(lips, open(os.path.join(HERE, 'voices/lips.json'), 'w'))
