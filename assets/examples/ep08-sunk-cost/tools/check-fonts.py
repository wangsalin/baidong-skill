"""用本机已有fontTools核对本期字体子集，无需给WSL再装一份。"""
import json,hashlib,sys
from pathlib import Path
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'fonts'))
from fetch_fonts import chars
needed=set(chars());records=[]
for name in ['notosanssc-900.woff2','notoserifsc-900.woff2','notoserifsc-400.woff2']:
 p=ROOT/'fonts'/name;cmap=TTFont(p).getBestCmap();missing=[c for c in needed if ord(c) not in cmap]
 record={'file':name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'missing':missing}
 records.append(record);print(name,'missing:',missing)
(ROOT/'out/font-check.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
assert not any(r['missing'] for r in records)
