"""逐句实际听写；缓存仅复用音频和参考文本均一致的通过记录。"""
import hashlib,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
lines=json.loads((ROOT/'lines.json').read_text(encoding='utf-8'))
hashes={l['id']:hashlib.sha256((ROOT/'voices'/(l['id']+'.wav')).read_bytes()).hexdigest() for l in lines}
cache_path=ROOT/'out/voice-checkpoints.json'
cache=json.loads(cache_path.read_text()) if cache_path.exists() else {}
context_path=ROOT/'out/context-check.json'
context=json.loads(context_path.read_text(encoding='utf-8')) if context_path.exists() else []
by_id={l['id']:l for l in lines};context_valid=set()
for group in context:
    if group['passed'] and group['similarity']>=.95 and group['expected']==''.join(by_id[i]['text'] for i in group['ids']) and all(group['sha256'][i]==hashes[i] for i in group['ids']):context_valid.update(group['ids'])
keep={l['id'] for l in lines if (cache.get(l['id'],{}).get('passed') and cache[l['id']].get('sha256')==hashes[l['id']] and cache[l['id']]['expected']==l.get('asr',l['text'])) or l['id'] in context_valid}
subset=[l for l in lines if l['id'] not in keep]
subset_file=ROOT/'out/revised-lines.json'
subset_file.write_text(json.dumps(subset,ensure_ascii=False),encoding='utf-8')
words_file=ROOT/'voices/words.json'
words=json.loads(words_file.read_text(encoding='utf-8')) if words_file.exists() else {}
if subset:
    process=subprocess.Popen([sys.executable,str(ROOT/'tools/asr-context.py'),str(subset_file),str(ROOT/'voices')],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
    output=[]
    for row in process.stdout:
        output.append(row);print(row,end='',flush=True)
    returncode=process.wait()
    (ROOT/'out/revised-asr.log').write_text(''.join(output),encoding='utf-8')
    details=json.loads((ROOT/'voices/asr-details.json').read_text(encoding='utf-8'))
    for ident,entry in details.items():cache[ident]={**entry,'sha256':hashes[ident]}
    words.update(json.loads(words_file.read_text(encoding='utf-8')))
    words_file.write_text(json.dumps(words,ensure_ascii=False),encoding='utf-8')
    cache_path.write_text(json.dumps(cache,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    unresolved=[i for i in details if not details[i]['passed'] and i not in context_valid]
    if returncode and unresolved:raise SystemExit(returncode)
individual={l['id'] for l in lines if cache.get(l['id'],{}).get('passed') and cache[l['id']].get('sha256')==hashes[l['id']]}
assert individual|context_valid==set(hashes)
report={'count':len(lines),'passed':len(lines),'individual_passed':len(individual),'context_verified':sorted(set(hashes)-individual),'model':'small','threshold':.92,
 'method':'逐句Whisper；孤立短句不通过时使用同一原音频的相邻对白核查（门槛.95），保留原差异，不将上下文通过写成逐句通过。音频SHA256一致才复用。',
 'sha256':hashes,'checks':{l['id']:{**cache[l['id']],'validation':'individual' if l['id'] in individual else 'context'} for l in lines},'context':context}
(ROOT/'voice-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'配音核查：{len(individual)}句单句通过，{len(set(hashes)-individual)}句经相邻原音频核查通过，共{len(lines)}句。',flush=True)
