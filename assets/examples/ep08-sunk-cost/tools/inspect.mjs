import fs from 'node:fs';import path from 'node:path';import{fileURLToPath,pathToFileURL}from'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const{openDemo,closeServer}=await import(pathToFileURL(path.join(process.env.LIB || path.join(process.env.HOME,'lemo-opuscar'),'core/render/page.mjs')));
const{browser,page}=await openDemo(root,{w:1920,h:1080,warnings:true});
try{
 const timeline=await page.evaluate(()=>({dur:window.DUR,shots:window.TL.SHOTS,marks:window.TL.T,vo:window.TL.VO,subs:window.SUBS}));
 fs.writeFileSync(path.join(root,'out/timeline.json'),JSON.stringify(timeline,null,2));
 fs.mkdirSync(path.join(root,'out/review'),{recursive:true});
 for(let t=0;t<timeline.dur;t+=2){await page.evaluate(t=>window.render(t),t);await page.screenshot({path:path.join(root,'out/review',`t_${t.toFixed(2)}.jpg`),type:'jpeg',quality:92});}
 fs.mkdirSync(path.join(root,'out/actions'),{recursive:true});
 for(const key of ['grab','scan','release','qreaction','readwait','pickup'])for(let i=0;i<=5;i++){const t=timeline.marks[key]+i*.2;await page.evaluate(t=>window.render(t),t);await page.screenshot({path:path.join(root,'out/actions',`${key}-${i}.jpg`),type:'jpeg',quality:92});}
 console.log(JSON.stringify({duration:timeline.dur,shots:timeline.shots.length,voiceLines:Object.keys(timeline.vo).length,marks:timeline.marks}));
}finally{await browser.close();closeServer();}
