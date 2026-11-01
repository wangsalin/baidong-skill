// 按真实配音时长逐帧检查发声人物的实际绘制；必须在 events 生成后、渲染前运行。
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), preview = args.includes('--preview');
const lib = process.env.LIB || path.join(os.homedir(), 'lemo-opuscar');
const { openDemo, closeServer } = await import(pathToFileURL(path.join(lib, 'core/render/page.mjs')));
const durations = ['voices/dur.json', 'voices/raw/dur.json'].map(f => path.join(here, f));
const lines = JSON.parse(fs.readFileSync(path.join(here, 'lines.json'), 'utf8'));
const durationPath = durations.find(f => fs.existsSync(f));
const durs = durationPath ? JSON.parse(fs.readFileSync(durationPath, 'utf8')) : {};
if (!preview && lines.some(l => !Number.isFinite(durs[l.id]) || durs[l.id] <= 0)) {
  throw new Error('缺少真实配音时长；先完成 voice 步骤。模板案头检查可显式使用 --preview，不能当作成片验收。');
}
let browser;
try {
  const opened = await openDemo(here, { w: 1920, h: 1080 });
  browser = opened.browser;
  const report = await opened.page.evaluate(() => {
    if (!Array.isArray(window.CAST_CUES)) throw new Error('未接入 CAST_CUES 实际声画检查，禁止跳过。');
    const failures = []; let frames = 0;
    for (const cue of window.CAST_CUES) {
      const times = new Set([cue.t0 + .0001, cue.t1 - .0001]);
      for (let i = Math.ceil(cue.t0 * 24); i < cue.t1 * 24; i++) times.add(i / 24);
      for (const b of window.CAST_BOUNDARIES || []) for (const delta of [-.0001, .0001]) {
        if (b + delta >= cue.t0 && b + delta < cue.t1) times.add(b + delta);
      }
      for (const t of [...times].sort((a, b) => a - b)) {
        window.render(t); frames++;
        if (!window.FRAME_CAST?.includes(cue.who) || window.FRAME_OCCLUDED) {
          if (failures.length < 20) failures.push({ line: cue.id, who: cue.who, t: +t.toFixed(4), cast: window.FRAME_CAST, transition: window.FRAME_OCCLUDED });
        }
      }
    }
    return { passed: failures.length === 0, lines: window.CAST_CUES.length, frames, failures };
  });
  console.log(JSON.stringify({ ...report, mode: preview ? 'preview-estimated-timing' : 'real-voice-timing' }, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  closeServer();
}
