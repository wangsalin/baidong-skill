"""按原检查器相同标准校验，给识别器提供节目专名词表，保留逐词时间。"""
import os
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import soxr
from faster_whisper import WhisperModel

sys.path.insert(0, os.path.join(os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar')), 'core/tts'))
from asr_check import compare

lines=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
voices=Path(sys.argv[2]);model=WhisperModel('small',device='cpu',compute_type='int8')
words={};bad=0;checks={}
for line in lines:
    y,sr=sf.read(voices/(line['id']+'.wav'))
    if y.ndim>1:y=y.mean(axis=1)
    y=soxr.resample(y,sr,16000,quality='HQ');pad=np.zeros(9600)
    segments,_=model.transcribe(np.concatenate([pad,y,pad]).astype(np.float32),language='zh',beam_size=5,
        word_timestamps=True,initial_prompt='这是老白和小问的普通话动画对话。话题词：沉没成本，电影票，一百块，散场，排队，等，时间。节目名称：白洞。')
    tail=(len(y)+len(pad))/16000-.5
    segments=[s for s in segments if not(s.no_speech_prob>.5 and s.start>tail)]
    got=' '.join(s.text.strip() for s in segments)
    want=line.get('asr',line['text'])
    candidates=list(dict.fromkeys([line['text'],want]))
    matched,ratio=max(((candidate,compare(candidate,got,'zh',.92)[1]) for candidate in candidates),key=lambda item:item[1])
    ok=ratio>=.92;bad+=not ok
    checks[line['id']]={'expected':want,'matchedReference':matched,'transcript':got,'passed':ok,'similarity':round(ratio,4)}
    words[line['id']]=[(w.word.strip(),round(w.start-.6,3),round(w.end-.6,3)) for s in segments for w in s.words]
    print(('OK  ' if ok else 'DIFF'),line['id'],'|',want,'→',got,f'({ratio:.3f})',flush=True)
(voices/'words.json').write_text(json.dumps(words,ensure_ascii=False),encoding='utf-8')
(voices/'asr-details.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'mismatches: {bad} (lang=zh, model=small, threshold=.92, proper-name vocabulary)',flush=True)
raise SystemExit(1 if bad else 0)
