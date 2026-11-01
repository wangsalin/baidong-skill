"""按正式人物处理声音并生成时长、口型数据。

voices/raw/<id>.wav (core/tts/tts_zh.py) → voices/<id>.wav (48 kHz)
每个 A1–D2 都有独立的后处理方向；旧期 LAOBAI/XIAOWEN 保留兼容。
Usage: python voice.py
"""
import json, os, runpy, numpy as np, soundfile as sf, soxr
from pathlib import Path
from scipy.signal import lfilter
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
L = json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))
checks = runpy.run_path(os.path.join(HERE, 'check-characters.py'))
checks['validate'](json.loads(Path(HERE, 'characters.json').read_text(encoding='utf-8')), L, *checks['load_config'](Path(HERE)))
gate=runpy.run_path(os.path.join(HERE,'check-production.py'))
gate['validate'](Path(HERE))
provenance={}
dur, lips = {}, {}

# 这是音色后处理的固定表。TTS voice、语速和音调由 characters.json 校验；这里再做
# 轻微的材质区分，避免把“方言方向”误当成同一条普通话音色。
PROFILES = {
    'A1': {'sat': .28, 'peq': [(180, 2.5, .8), (2800, -1.2, 1.0)]},
    'A2': {'sat': .04, 'peq': [(3200, 2.8, .9), (700, -.4, 1.0)]},
    'B1': {'sat': .12, 'peq': [(220, 1.5, .9), (3000, .6, 1.0)]},
    'B2': {'sat': .02, 'peq': [(2400, -1.1, 1.0), (3600, 1.0, .9)]},
    'C1': {'sat': .22, 'peq': [(180, 1.8, .8), (2800, -.8, 1.0)]},
    'C2': {'sat': .01, 'peq': [(1600, -1.3, 1.0), (3600, .8, .9)]},
    'D1': {'sat': .06, 'peq': [(1200, 1.0, 1.0), (3200, 2.8, .9)]},
    'D2': {'sat': .02, 'peq': [(500, -.8, 1.0), (2800, 1.5, 1.0)]},
    'LAOBAI': {'sat': .28, 'peq': [(180, 2.5, .8), (2800, -1.2, 1.0)]},
    'XIAOWEN': {'sat': .02, 'peq': [(3200, 2.0, .9)]},
}
def peq(x, f, gain_db, q=1.0):   # peaking EQ (RBJ biquad)
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]; a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return lfilter(np.array(b) / a[0], np.array(a) / a[0], x)
for l in L:
    who = l.get('who')
    if who not in PROFILES:
        raise SystemExit(f"voice.py: line '{l.get('id', '<unknown>')}' uses an unregistered character: {who!r}")
    y, sr = sf.read(os.path.join(HERE, 'voices/raw', l['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = soxr.resample(y, sr, SR)
    y = y / (np.abs(y).max() + 1e-9) * .9
    profile = PROFILES[who]
    sat = np.tanh(y * 2.4) / np.tanh(2.4)
    amount = profile['sat']
    y = (1 - amount) * y + amount * sat
    for f, gain_db, q in profile['peq']:
        y = peq(y, f, gain_db, q)
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
    wav=Path(HERE,'voices',l['id']+'.wav')
    provenance[l['id']]={'key':gate['audio_key'](l,gate['digest'](Path(__file__))), 'wav_sha256':gate['digest'](wav)}
    print(l['id'], dur[l['id']])
json.dump(dur, open(os.path.join(HERE, 'voices/dur.json'), 'w'), indent=0)
json.dump(lips, open(os.path.join(HERE, 'voices/lips.json'), 'w'))

Path(HERE,'voices/source.json').write_text(json.dumps(provenance,indent=2)+'\n',encoding='utf-8')
