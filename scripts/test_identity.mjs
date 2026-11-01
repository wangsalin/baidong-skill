// 与随包冻结的用户确认设计比较，不依赖 Git 历史，也不以当前实现自证。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ref=path.join(root,'assets/identity-reference');
const manifest=JSON.parse(fs.readFileSync(path.join(ref,'manifest.json')));
for(const [name,hash]of Object.entries(manifest.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ref,name))).digest('hex'),hash,'确认稿被改动：'+name);
const lib=process.env.LIB||path.join(process.env.HOME,'lemo-opuscar');
const {openDemo,closeServer}=await import(pathToFileURL(path.join(lib,'core/render/page.mjs')));
let browser;
try{
  const opened=await openDemo(path.join(root,'assets/episode-template'));browser=opened.browser;
  await opened.page.route('**/identity-reference/*',route=>{
    const name=new URL(route.request().url()).pathname.split('/').pop();
    if(!['cast.js','chars.js','toon.js','math.js'].includes(name))return route.abort();
    return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(ref,name),'utf8')});
  });
  const report=await opened.page.evaluate(async()=>{
    const live=await import(new URL('chars.js',location.href)),toon=await import(new URL('toon.js',location.href));
    const original=await import('/identity-reference/cast.js'),origToon=await import('/identity-reference/toon.js');
    const cv=document.createElement('canvas');cv.width=1920;cv.height=1080;origToon.init(cv);
    const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
    const results=[];
    for(const id of ['A1','A2','B1','B2','C1','C2','D1','D2']){
      const P={x:960,y:950,s:1,face:1};
      origToon.g.clearRect(0,0,1920,1080);origToon.frame(0);
      original.actor({id:id[0],kind:id[1]==='1'?'bai':'wen',...P});
      const expected=await digest(origToon.g.getImageData(0,0,1920,1080).data);
      toon.g.clearRect(0,0,1920,1080);toon.frame(0);live.character(id,P);
      const actual=await digest(toon.g.getImageData(0,0,1920,1080).data);
      results.push({id,match:expected===actual,expected,actual});
    }
    return results;
  });
  for(const role of report)assert.equal(role.match,true,'人物偏离确认稿：'+role.id+' '+JSON.stringify(role));
  console.log(JSON.stringify({passed:true,reference:manifest.version,characters:report}));
}finally{if(browser)await browser.close();closeServer();}
