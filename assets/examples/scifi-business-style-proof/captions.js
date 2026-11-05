import {g} from './toon.js';
await document.fonts.ready;await Promise.all([...document.fonts].map(f=>f.load()));
const norm=s=>[...s].filter(c=>/[\p{L}\p{N}]/u.test(c)).length;
export function adaptCaptions(times,portrait){
  const source=window.SUBS;if(!source||window.SINGLE_LINE_CAPTIONS)return;
  const max=portrait?870:1270;g.save();g.font=`900 ${portrait?48:52}px "Noto Sans SC"`;
  const out=[];
  for(const sub of source){
    const en=/[a-z]{2}/i.test(sub.text),tokens=en?sub.text.match(/\S+\s*/g):[...sub.text];
    let current='';const pages=[];
    for(const token of tokens){if(current&&g.measureText((current+token).trim()).width>max){pages.push(current);current=token;}else current+=token;}
    if(current)pages.push(current);
    if(!en)for(let i=0;i<pages.length-1;i++){
      const hit=[...pages[i].matchAll(/[，、；。？！]/g)].filter(m=>m.index>pages[i].length*.33).at(-1);
      if(hit){const tail=pages[i].slice(hit.index+1);if(g.measureText(tail+pages[i+1]).width<=max){pages[i]=pages[i].slice(0,hit.index+1);pages[i+1]=tail+pages[i+1];}}
      while(/^[，。？！、；：]/.test(pages[i+1])){const mark=pages[i+1][0];if(g.measureText(pages[i]+mark).width<=max){pages[i]+=mark;pages[i+1]=pages[i+1].slice(1);}else{pages[i+1]=pages[i].slice(-2)+pages[i+1];pages[i]=pages[i].slice(0,-2);break;}}
    }
    let count=0;
    pages.filter(Boolean).forEach((text,i,a)=>{const t0=i?sub.t0+times[sub.id][count]:sub.t0;count+=norm(text);const t1=i===a.length-1?sub.t1:sub.t0+times[sub.id][count];if(!(t1>t0))throw new Error('无效字幕时间 '+sub.id);out.push({...sub,id:sub.id+'_s'+(i+1),source_id:sub.id,text,t0,t1});});
  }
  for(let i=0;i<out.length-1;i++)out[i].t1=Math.min(out[i].t1,out[i+1].t0);
  source.splice(0,source.length,...out);window.SINGLE_LINE_CAPTIONS=true;g.restore();
}
