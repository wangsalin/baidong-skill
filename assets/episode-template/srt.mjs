// Export subtitles from the same window.SUBS the page burns in:  LIB=<library> node srt.mjs → ' + path.basename(dir) + '.srt
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const LIB = process.env.LIB || path.join(process.env.HOME, 'lemo-opuscar');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const dir = path.dirname(fileURLToPath(import.meta.url));
const { browser, page } = await openDemo(dir, { w: 1080, h: 1920 });
const subs = await page.evaluate(() => window.SUBS);
const ts = t => { const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const who = { LAOBAI: '老白', XIAOWEN: '小问' };
fs.writeFileSync(path.join(dir, '' + path.basename(dir) + '.srt'), subs.map((s, i) => `${i + 1}\n${ts(s.t0)} --> ${ts(s.t1)}\n${who[s.who]}：${s.text}\n`).join('\n'));
console.log('srt', subs.length); await browser.close(); closeServer();
