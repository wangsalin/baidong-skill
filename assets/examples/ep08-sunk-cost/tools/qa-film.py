"""针对本期实际成片检查，不用静态成功提示替代解码或听写。"""
import json,re,sys,subprocess,hashlib,unicodedata,difflib
from pathlib import Path
from faster_whisper import WhisperModel
ROOT=Path(__file__).resolve().parent.parent
FILM=ROOT/'ep08-sunk-cost.mp4';OUT=ROOT/'out'
def run(args):return subprocess.run(args,check=True,capture_output=True,text=True,encoding='utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
events=json.loads((ROOT/'events.json').read_text());lines=json.loads((ROOT/'lines.json').read_text(encoding='utf-8'))
voices=json.loads((ROOT/'voice-check.json').read_text(encoding='utf-8'))
assert voices['count']==voices['passed']==len(lines)==62
assert all(voices['sha256'][l['id']]==sha(ROOT/'voices'/f"{l['id']}.wav") for l in lines)
meta=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(FILM)]).stdout)
video=next(s for s in meta['streams'] if s['codec_type']=='video');audio=next(s for s in meta['streams'] if s['codec_type']=='audio')
duration=float(meta['format']['duration'])
assert (video['codec_name'],video['width'],video['height'],video['pix_fmt'],video['r_frame_rate'])==('h264',1920,1080,'yuv420p','24/1')
assert audio['codec_name']=='aac' and abs(duration-events['dur'])<.15
decode=run(['ffmpeg','-v','error','-i',str(FILM),'-f','null','-']);assert not decode.stderr.strip(),decode.stderr
srt=(ROOT/'ep08-sunk-cost.srt').read_text(encoding='utf-8')
assert len(re.split(r'\n\s*\n',srt.strip()))==len(lines)
assert all(l['text'] in srt for l in lines)
timeline=json.loads((OUT/'timeline.json').read_text(encoding='utf-8'))
assert len(timeline['subs'])==62 and all(0<=s['t0']<s['t1']<=duration for s in timeline['subs'])
assert all(a['t1']<=b['t0'] for a,b in zip(timeline['subs'],timeline['subs'][1:]))
print(f'规格、完整解码、62条字幕通过。{duration:.3f}s',flush=True)
ld=run(['ffmpeg','-hide_banner','-nostats','-i',str(FILM),'-vf','blackdetect=d=0.08:pix_th=0.06','-af','ebur128=peak=true','-f','null','-']).stderr
(OUT/'film-levels-black.log').write_text(ld,encoding='utf-8')
summary=ld[ld.rfind('Summary:'):]
lufs=float(re.search(r'\bI:\s*([-\d.]+) LUFS',summary).group(1));peak=float(re.search(r'Peak:\s*([-\d.]+) dBFS',summary).group(1))
black=re.findall(r'black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)',ld)
assert -15<=lufs<=-13 and peak<=-1,(lufs,peak)
assert not black,black
print(f'响度 {lufs} LUFS，真峰值 {peak} dBFS；未检出黑帧。开始成片混音听写。',flush=True)

model=WhisperModel('small',device='cpu',compute_type='int8')
segments,_=model.transcribe(str(FILM),language='zh',beam_size=5,vad_filter=True,initial_prompt='这是老白和小问的普通话动画对话。主题词：沉没成本，电影票，排队，时间，花费。节目名称：白洞。')
segments=list(segments);got=''.join(s.text.strip() for s in segments);expected=''.join(l['text'] for l in lines)
(OUT/'final-asr.txt').write_text('\n'.join(f'{s.start:.2f}–{s.end:.2f} {s.text.strip()}' for s in segments)+'\n',encoding='utf-8')
digits={'零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9}
def number(m):
 s=m.group();n=0;current=0
 for c in s:
  if c in digits:current=digits[c]
  else:n+=(current or 1)*{'十':10,'百':100,'千':1000}[c];current=0
 return str(n+current)
def norm(s):
 s=unicodedata.normalize('NFKC',s).lower();s=re.sub('[零〇一二两三四五六七八九十百千]+',number,s)
 return ''.join(c for c in s if unicodedata.category(c)[0] in 'LN')
a,b=norm(expected),norm(got);similarity=difflib.SequenceMatcher(None,a,b,autojunk=False).ratio()
differences=[{'expected':a[i:j],'transcribed':b[k:l]} for op,i,j,k,l in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes() if op!='equal']
print(f'整片混音听写相似度：{similarity:.2%}',flush=True)
music=json.loads((ROOT/'music/source.json').read_text(encoding='utf-8'))
assert music['sourceSha256']==sha(Path(music['source'])) and abs(music['durationSeconds']-events['dur'])<.001
report={'passed':similarity>=.95,'film':FILM.name,'duration_seconds':duration,'video':{k:video[k] for k in ['codec_name','width','height','pix_fmt','r_frame_rate']},'audio':{'codec':audio['codec_name'],'loudness_lufs':lufs,'true_peak_dbfs':peak},'decode_errors':0,'black_events':black,'subtitle_lines':62,'voice':{'individual_passed':voices['individual_passed'],'context_verified':voices['context_verified'],'total_verified':voices['passed']},'mixed_audio_asr_similarity':round(similarity,5),'asr_differences':differences,'asr_normalization':'统一中阿数字和标点；字符序列匹配autojunk=False。原始听写保留在out/final-asr.txt。','music':music,'mix_levels':json.loads((ROOT/'music/mix-levels.json').read_text(encoding='utf-8')),'size_bytes':FILM.stat().st_size,'sha256':sha(FILM),'limits':'已检查实际关键帧与动作连续帧；自动完整解码、黑帧、响度和成片听写。未进行真人试听或真实受众测试；未发布，未云端同步工作台。'}
(ROOT/'qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'ffprobe.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
assert report['passed'],differences
print(json.dumps({k:report[k] for k in ['passed','duration_seconds','audio','mixed_audio_asr_similarity']},ensure_ascii=False,indent=2),flush=True)
