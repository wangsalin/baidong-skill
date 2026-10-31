"""对孤立短句仍有差异的条目，使用相邻原音频核查，保留真实识别差异。"""
import os
import json,sys,hashlib
from pathlib import Path
import numpy as np,soundfile as sf,soxr
from faster_whisper import WhisperModel
sys.path.insert(0,os.path.join(os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar')), 'core/tts'))
from asr_check import compare
ROOT=Path(__file__).resolve().parent.parent
lines=json.loads((ROOT/'lines.json').read_text(encoding='utf-8'))
L={l['id']:l for l in lines};model=WhisperModel('small',device='cpu',compute_type='int8')
groups=[['n39','n40','n41','n42'],['n53','n54','n55','n56']]
records=[]
for ids in groups:
 audio=[]
 for ident in ids:
  a,sr=sf.read(ROOT/'voices'/f'{ident}.wav');audio.extend([soxr.resample(a,sr,16000),np.zeros(1600)])
 y=np.r_[np.zeros(9600),np.concatenate(audio),np.zeros(9600)].astype('float32')
 segs,_=model.transcribe(y,language='zh',beam_size=5,initial_prompt='这是一段普通话动画。主题词：沉没成本、排队、时间、花费。')
 got=''.join(s.text for s in segs);expected=''.join(L[i]['text'] for i in ids)
 passed,r=compare(expected,got,'zh',.95)
 record={'ids':ids,'expected':expected,'transcript':got,'similarity':r,'passed':passed,'sha256':{i:hashlib.sha256((ROOT/'voices'/f'{i}.wav').read_bytes()).hexdigest() for i in ids}}
 records.append(record);print(json.dumps(record,ensure_ascii=False),flush=True)
(ROOT/'out/context-check.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
