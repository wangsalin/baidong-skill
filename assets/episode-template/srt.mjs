// Export subtitles from the same window.SUBS the page burns in:  LIB=<library> node srt.mjs → ' + path.basename(dir) + '.srt
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
import { SPEAKER_NAMES } from './characters.js';
const LIB = process.env.LIB || path.join(process.env.HOME, 'lemo-opuscar');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(LIB, 'core/render/page.mjs')).href);
const dir = path.dirname(fileURLToPath(import.meta.url));
const config=JSON.parse(fs.readFileSync(path.join(dir,'episode.json'),'utf8'));
const portrait=config.aspect==='portrait',prefix=config.stage==='final'?'':'preview-';
const { browser, page } = await openDemo(dir, { w: portrait?1080:1920, h: portrait?1920:1080, q: portrait?'mode=portrait':'mode=film' });
const subs = await page.evaluate(() => window.SUBS);
const ts = t => { const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
fs.writeFileSync(path.join(dir, prefix + path.basename(dir) + '.srt'), subs.map((s, i) => `${i + 1}\n${ts(s.t0)} --> ${ts(s.t1)}\n${SPEAKER_NAMES[s.who] || s.who || '未命名角色'}：${s.text}\n`).join('\n'));
console.log('srt', subs.length); await browser.close(); closeServer();
