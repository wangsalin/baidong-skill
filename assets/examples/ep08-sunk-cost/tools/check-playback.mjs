import fs from 'node:fs';import path from 'node:path';import{fileURLToPath,pathToFileURL}from'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const{openDemo,closeServer}=await import(pathToFileURL(path.join(process.env.LIB || path.join(process.env.HOME,'lemo-opuscar'),'core/render/page.mjs')));
const{browser,page}=await openDemo(root,{w:1920,h:1080});
try{
 const reports=[];
 for(const film of ['ep08-sunk-cost.mp4','clip-1.mp4']){
 const r=await page.evaluate(async film=>{
  const v=document.createElement('video');v.muted=true;v.controls=true;v.style='width:100vw;height:100vh;position:absolute;inset:0;background:#111';document.body.append(v);
  const loaded=new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=()=>reject(Error(v.error?.message));});
  const response=await fetch(new URL(film,location.href));if(!response.ok)throw Error(`video ${response.status}`);
  v.src=URL.createObjectURL(await response.blob());await loaded;await v.play();await new Promise(r=>setTimeout(r,800));v.pause();
  const report={film,width:v.videoWidth,height:v.videoHeight,duration:v.duration,playedTo:v.currentTime,seeks:[]};if(v.currentTime<.2)throw Error('Video did not play');
  for(const t of [v.duration*.15,v.duration*.5,v.duration-.15]){await new Promise((resolve,reject)=>{v.onseeked=resolve;v.onerror=()=>reject(Error('seek failed'));v.currentTime=t;});if(v.readyState<2)throw Error('No decoded frame');report.seeks.push(v.currentTime);}
  URL.revokeObjectURL(v.src);v.remove();return report;
 },film);reports.push(r);console.log(JSON.stringify(r));
 }
 fs.writeFileSync(path.join(root,'out/playback-check.json'),JSON.stringify(reports,null,2));
}finally{await browser.close();closeServer();}
