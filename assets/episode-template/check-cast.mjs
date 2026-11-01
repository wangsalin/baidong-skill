// 按真实配音时长逐帧检查发声人物的实际绘制；必须在 events 生成后、渲染前运行。
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scanCast } from './cast-check.js';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), preview = args.includes('--preview');
const lib = process.env.LIB || path.join(os.homedir(), 'lemo-opuscar');
const { openDemo, closeServer, takeSize } = await import(pathToFileURL(path.join(lib, 'core/render/page.mjs')));
const { w, h } = takeSize(args);
const q = args.includes('--q') ? args[args.indexOf('--q') + 1] : '';
const durations = ['voices/dur.json', 'voices/raw/dur.json'].map(f => path.join(here, f));
const lines = JSON.parse(fs.readFileSync(path.join(here, 'lines.json'), 'utf8'));
const durationPath = durations.find(f => fs.existsSync(f));
const durs = durationPath ? JSON.parse(fs.readFileSync(durationPath, 'utf8')) : {};
if (!preview && lines.some(l => !Number.isFinite(durs[l.id]) || durs[l.id] <= 0)) {
  throw new Error('缺少真实配音时长；先完成 voice 步骤。模板案头检查可显式使用 --preview，不能当作成片验收。');
}
let browser;
try {
  const opened = await openDemo(here, { w, h, q });
  browser = opened.browser;
  const expected=lines.map(l=>({id:l.id,who:l.who,duration:preview?(durs[l.id]??l.text.length*.2):durs[l.id]}));
  const report = await opened.page.evaluate(scanCast, expected);
  console.log(JSON.stringify({ ...report, mode: preview ? 'preview-estimated-timing' : 'real-voice-timing' }, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  closeServer();
}
