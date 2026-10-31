"""从 events.json 的分段点生成 B 站 / YouTube 的章节时间戳：python chapters.py <项目目录>
规则：第一章从 00:00 开始（钩子并进第二段）；每章至少 10 秒，太短的并进下一章；少于 3 章时提示（YouTube 要求至少 3 章）。
结果写进项目的 chapters.txt，同时打印出来。"""
import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')
p = sys.argv[1] if len(sys.argv) > 1 else '.'
E = json.load(open(os.path.join(p, 'events.json'), encoding='utf-8'))
segs = [e for e in E['ev'] if e['type'] == 'seg']
NAMES = {'s1': '钩子', 's2': '代入', 's3': '推翻', 's4': '机制', 's5': '落回你', 's6': '小动作'}
chs = []
for s in segs:
    title = s.get('title') or NAMES.get(s['k'], s['k'])
    if s['k'] == 's1': continue
    chs.append([s['t'], title])
if not chs and segs: chs = [[0, segs[0].get('title') or '开始']]
if chs: chs[0][0] = 0.0
merged = []
for i, (t, title) in enumerate(chs):
    nxt = chs[i + 1][0] if i + 1 < len(chs) else E['dur']
    if merged and nxt - t < 10: continue   # 太短：并进上一章
    merged.append((t, title))
fmt = lambda t: f'{int(t // 60):02d}:{int(t % 60):02d}'
lines = [f'{fmt(t)} {title}' for t, title in merged]
open(os.path.join(p, 'chapters.txt'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('\n'.join(lines))
if len(merged) < 3: print('（注意：少于 3 章，YouTube 不会显示章节）')
