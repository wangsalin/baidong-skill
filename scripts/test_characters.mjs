// 实际浏览器回归：声画绑定、转场边界、八角色转面/坐姿，以及用户确认造型独立像素对照。
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scanCast } from '../assets/episode-template/cast-check.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = path.join(root, 'assets/episode-template');
const lib = process.env.LIB || path.join(os.homedir(), 'lemo-opuscar');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(lib, 'core/render/page.mjs')));
const out = process.argv[2];
let browser;
const digestQ = async () => {
  const toon = await import(new URL('toon.js', location.href));
  const chars = await import(new URL('chars.js', location.href));
  const hashes = {};
  for (const id of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2']) {
    toon.g.clearRect(0, 0, 1920, 1080); toon.frame(0);
    chars.character(id, { x: 960, y: 950, s: 1, face: 1 });
    const hash = await crypto.subtle.digest('SHA-256', toon.g.getImageData(0, 0, 1920, 1080).data);
    hashes[id] = Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('');
  }
  return hashes;
};
try {
  const opened = await openDemo(template, { w: 1920, h: 1080 }); browser = opened.browser;
  const page = opened.page;
  const cast = await page.evaluate(scanCast); assert.equal(cast.passed, true, JSON.stringify(cast.failures));
  const portraitBoards = await page.evaluate(async () => {
    const {createPortraitScenes} = await import(new URL('portrait.js', location.href));
    const {FORMAL_POSES} = await import(new URL('chars.js', location.href));
    const boards = [];
    createPortraitScenes({drawRole(){}, FORMAL_POSES, Wd:{board:(x,y,w,h)=>boards.push({x,y,w,h})}}).ex(0);
    return boards;
  });
  assert.ok(portraitBoards.length, '竖版说明牌回归未覆盖实际镜头');
  for (const rect of portraitBoards) assert.ok(rect.x>=60 && rect.x+rect.w<=1020 && rect.y>=300 && rect.y+rect.h<=1400, '竖版说明牌越出安全区：'+JSON.stringify(rect));
  const subtitleRows = await page.evaluate(async () => {
    const toon = await import(new URL('toon.js', location.href));
    const {subs} = await import(new URL('brand.js', location.href));
    const canvas = document.querySelector('canvas'), width=canvas.width, height=canvas.height;
    canvas.width=1080;canvas.height=1920;toon.init(canvas);
    const labels=[], original=toon.g.fillText;
    toon.g.fillText=function(str,...args){labels.push({text:String(str),width:this.measureText(str).width});return original.call(this,str,...args);};
    try {subs(.5,[{id:'subtitle-wrap-test',who:'B2',t0:0,t1:1,text:'晚上那两个小时，是你唯一说了算的时间。'}]);}
    finally {toon.g.fillText=original;canvas.width=width;canvas.height=height;toon.init(canvas);}
    return labels.filter(label=>label.text!=='小算盘');
  });
  assert.equal(subtitleRows.length,2);
  for(const row of subtitleRows)assert.ok(row.text.length>=5 && row.width<=900 && !/^[，。！？、；：]/.test(row.text),'字幕孤立标点或越界：'+JSON.stringify(subtitleRows));
  const before = await page.evaluate(digestQ);
  const motion = await page.evaluate(async () => {
    const toon = await import(new URL('toon.js', location.href)), chars = await import(new URL('chars.js', location.href));
    const results = [];
    for (const id of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2']) {
      const draw = options => { toon.g.clearRect(0, 0, 1920, 1080); toon.frame(0); chars.character(id, { x: 960, y: 950, s: 1, face: 1, ...options, allowUnapprovedMotion:true }); return toon.g.getImageData(0, 0, 1920, 1080).data; };
      const q = draw({});
      const changes = {};
      for (const [name, options] of Object.entries({ front: { view: 'front' }, side: { view: 'side' }, back: { view: 'back' }, sit: chars.FORMAL_POSES[id].sit, walk: { walk: .25 } })) {
        const next = draw(options); let different = 0;
        for (let i = 0; i < q.length; i += 4) if (q[i] !== next[i] || q[i+1] !== next[i+1] || q[i+2] !== next[i+2] || q[i+3] !== next[i+3]) different++;
        changes[name] = different;
      }
      toon.frame(0); chars.resetCharacterFrame(); chars.character(id, { x: -5000, y: 950, s: 1 });
      if (chars.FRAME_CHARACTERS.has(id)) throw new Error(id + ' 镜外人物错误记为出镜');
      results.push({ id, changes });
    }
    return results;
  });
  for (const result of motion) for (const [pose, count] of Object.entries(result.changes)) assert.ok(count > 100, `${result.id} ${pose} 仍没有实际变化`);
  const identity=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/test_identity.mjs')],{encoding:'utf8',env:process.env}));
  assert.equal(identity.passed,true);
  await page.route('**/scenes.js', async route => { const response = await route.fetch(); const text = await response.text(); assert.ok(text.includes("drawRole('B1'")); await route.fulfill({ response, body: text.replace("drawRole('B1'", "drawRole('A1'") }); });
  await page.reload(); await page.waitForFunction(() => window.READY === true);
  const missing = await page.evaluate(scanCast); assert.equal(missing.passed, false); assert.ok(missing.failures.some(f => f.who === 'B1'));
  await page.unroute('**/scenes.js');
  await page.route('**/scenes.js', async route => {
    const response=await route.fetch();const source=await response.text();
    await route.fulfill({response,body:"import {g} from './toon.js';\n"+source.replace('return SH;',"for(const k of Object.keys(SH)){const draw=SH[k];SH[k]=(t,q)=>{draw(t,q);g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,1920,1080);g.restore();};} return SH;")});
  });
  await page.reload();await page.waitForFunction(()=>window.READY===true);
  const occluded=await page.evaluate(scanCast);assert.equal(occluded.passed,false,'最终画面遮住人物仍被放行');
  await page.unroute('**/scenes.js');
  await page.route('**/story.js', async route => { const response = await route.fetch(); const text = await response.text(); assert.ok(text.includes("{ line: 'b1' }")); await route.fulfill({ response, body: text.replace("{ line: 'b1' }", "{ line: 'b1', gap: -.1 }") }); });
  await page.reload(); await page.waitForFunction(() => window.READY === true);
  const overlap = await page.evaluate(scanCast); assert.equal(overlap.passed, false); assert.ok(overlap.failures.some(f => f.transition));
  await page.unroute('**/story.js');
  await page.reload(); await page.waitForFunction(() => window.READY === true);
  if (out) {
    fs.mkdirSync(out, { recursive: true });
    await page.evaluate(async () => {
      const toon = await import(new URL('toon.js', location.href)), chars = await import(new URL('chars.js', location.href));
      const canvas = document.querySelector('canvas'); canvas.width = 1920; canvas.height = 2770; canvas.style.width = '1920px'; canvas.style.height = '2770px';
      const g = toon.g; g.fillStyle = '#f4f0e8'; g.fillRect(0, 0, canvas.width, canvas.height);
      ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'].forEach((id, row) => ['q', 'front', 'side', 'back', 'sit', 'walk'].forEach((pose, col) => {
        toon.frame(0); chars.character(id, { x: 160 + col * 320, y: 325 + row * 340, s: .44, face: 1, allowUnapprovedMotion:true, ...(pose === 'sit' ? chars.FORMAL_POSES[id].sit : pose === 'walk' ? { walk: .25 } : { view: pose }) });
        g.font = 'bold 22px sans-serif'; g.fillStyle = '#1b1422'; g.fillText(id + ' / ' + pose, 95 + col * 320, 40 + row * 340);
      }));
    });
    await page.locator('canvas').screenshot({ path: path.join(out, 'characters-contact-sheet.png'), timeout: 30000 });
  }
  const report = { passed: true, cast, motion, approvedIdentityPixelMatch: true, portraitBoardSafeBounds: true, balancedChineseSubtitles:true, missingSpeakerRejected: true, finalCanvasOcclusionRejected:true, transitionOverlapRejected: true, derivedMotionStatus:'preview-only-not-approved' };
  if (out) fs.writeFileSync(path.join(out, 'character-qa.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { if (browser) await browser.close(); closeServer(); }
