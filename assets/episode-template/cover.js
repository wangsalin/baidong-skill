// cover.js — 用片中的真实角色画封面和竖版切片底图。由 main.js 在 ?mode=cover / ?mode=clipframe 时调用。
// 主角继续黑白造型与蓝围巾；背景和撞色图形按本期主题选色。
import { INK, g, push, pop, translate, scale, stroke, ell, text, reset } from './toon.js';
import { laobai, xiaowen, C } from './chars.js';
import { SERIF } from './brand.js';
const { BLUE, PAPER } = C;
const spaced = s => [...s].join('  ');

function frameBase(w, h, no, { square = INK, bg = PAPER } = {}) {
  reset(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const m = Math.round(Math.min(w, h) * .035);
  g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(m, m, w - 2 * m, h - 2 * m);
  g.fillStyle = square; g.fillRect(w - m - 70, m + 40, 34, 34);
  text(spaced('BAIDONG'), m + 60, m + 54, { font: '400 24px sans-serif', fill: INK, align: 'left' });
  if (no != null) text(`No.${String(no).padStart(2, '0')}`, m + 60, m + 100, { font: `400 30px ${SERIF}`, fill: INK, align: 'left' });
  return m;
}
// 一行大字，hl 那个词用克莱因蓝
function titleLine(line, x, y, size, align, hl) {
  const font = `900 ${size}px ${SERIF}`;
  g.setTransform(1, 0, 0, 1, 0, 0); g.font = font;
  const parts = hl && line.includes(hl) ? [line.slice(0, line.indexOf(hl)), hl, line.slice(line.indexOf(hl) + hl.length)] : [line, '', ''];
  const total = parts.reduce((a, p) => a + g.measureText(p).width, 0);
  let cx = align === 'center' ? x - total / 2 : x;
  parts.forEach((p, i) => { if (!p) return; text(p, cx, y, { font, fill: i === 1 ? BLUE : INK, align: 'left' }); g.setTransform(1, 0, 0, 1, 0, 0); g.font = font; cx += g.measureText(p).width; });
}
function rings(cx, cy, r) { reset(); for (let k = 1; k <= 4; k++) stroke(ell(cx, cy, r * k, r * k, 90), 2.5, { line: `rgba(200,200,200,${1 - k * .18})`, boil: .3 }); }

function coverAccents(w, h, pop) {
  reset(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = pop;
  g.beginPath(); g.ellipse(w * .79, h * .81, Math.min(w * .17, h * .24), h * .23, -.12, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(w * .63, h * .59); g.lineTo(w * .9, h * .56); g.lineTo(w * .98, h * .72); g.lineTo(w * .7, h * .77); g.closePath(); g.fill();
  g.fillStyle = BLUE; g.beginPath(); g.arc(w * .92, h * .83, Math.max(12, Math.min(w, h) * .025), 0, Math.PI * 2); g.fill();
}

// size: '16x9' | '4x3' | '3x4' | '9x16'；title 用 / 分两行；hl 关键词；laobai / xiaowen 表情名
export function renderCover(w, h, { size = '16x9', title = '', hl = '', bg = '#FFD23F', pop = '#12B8A6', laobai: eL = 'seeThrough', xiaowen: eX = 'shocked', no = 0 } = {}) {
  const lines = title.split('/').map(s => s.trim()).filter(Boolean);
  const m = frameBase(w, h, no, { square: pop, bg });
  coverAccents(w, h, pop);
  if (size === '16x9') {
    rings(1460, 600, 130);
    lines.forEach((l, i) => titleLine(l, m + 80, 430 + i * 170, 124, 'left', hl));
    text('每期看懂一个机制。', m + 80, h - m - 60, { font: `400 30px ${SERIF}`, fill: INK, align: 'left' });
    reset(); laobai({ x: 1300, y: 1406, s: 1.55, face: -1, expr: eL, scarf: BLUE });
    reset(); xiaowen({ x: 1610, y: 1390, s: 2.3, face: -1, expr: eX, t: .3 });
  } else if (size === '4x3') {   // B 站封面：横版 16x9 的排法收窄
    rings(1020, 600, 120);
    lines.forEach((l, i) => titleLine(l, m + 70, 270 + i * 112, 88, 'left', hl));
    text('每期看懂一个机制。', m + 70, h - m - 60, { font: `400 30px ${SERIF}`, fill: INK, align: 'left' });
    reset(); laobai({ x: 880, y: 1666, s: 1.55, face: -1, expr: eL, scarf: BLUE });
    reset(); xiaowen({ x: 1170, y: 1650, s: 2.3, face: -1, expr: eX, t: .3 });
  } else {
    const tall = size === '9x16', ty = tall ? 470 : 300, fs = 108;
    rings(w / 2, tall ? 1180 : 920, 120);
    lines.forEach((l, i) => titleLine(l, w / 2, ty + i * 150, fs, 'center', hl));
    reset(); laobai({ x: 370, y: (tall ? 1150 : 830) + 604 * 1.5, s: 1.5, face: 1, expr: eL, scarf: BLUE });
    reset(); xiaowen({ x: 730, y: (tall ? 1300 : 970) + 334 * 2.0, s: 2.0, face: -1, expr: eX, t: .3 });
  }
}
// 竖版原理短片：紧凑标题、完整横版画面、逐期定制的因果链与结论。
export const CLIP_SLOT = { y: 430, h: 608 };
export function renderClipFrame(w, h, { question = '', flow = '', takeaway = '', closing = '', no = 0, bg = '#FFF9EC', pop = '#28D6C2', accent = '#FF6B35' } = {}) {
  const m = frameBase(w, h, no, { square: pop, bg });
  text('原理直讲', m + 18, 212, { font: `800 28px ${SERIF}`, fill: accent, align: 'left' });

  g.setTransform(1, 0, 0, 1, 0, 0); g.font = `900 68px ${SERIF}`;
  const cs = [...question]; let lines = [question];
  if (g.measureText(question).width > w - 160) { let best = Math.round(cs.length / 2); cs.forEach((c, i) => { if ('，。？！：'.includes(c) && i < cs.length - 1 && Math.abs(i + 1 - cs.length / 2) < Math.abs(best - cs.length / 2)) best = i + 1; }); lines = [cs.slice(0, best).join(''), cs.slice(best).join('')]; }
  lines.forEach((line, i) => text(line, w / 2, 310 + i * 78 - (lines.length - 1) * 39, { font: `900 68px ${SERIF}` }));
  g.fillStyle = accent; g.fillRect(w / 2 - 52, 382, 104, 9);

  g.fillStyle = '#FFF9EC'; g.fillRect(0, CLIP_SLOT.y, w, CLIP_SLOT.h);

  text('背后的运作方式', m + 18, 1100, { font: `800 36px ${SERIF}`, fill: INK, align: 'left' });
  const steps = flow.split('|').map(s => s.trim()).filter(Boolean);
  if (steps.length === 3) {
    const gap = 40, left = 64, top = 1160, boxH = 150;
    const boxW = (w - left * 2 - gap * 2) / 3;
    const colors = ['#FFE0D6', '#FFE37A', '#BFEFE4'];
    steps.forEach((step, i) => {
      const x = left + i * (boxW + gap);
      g.fillStyle = colors[i]; g.fillRect(x, top, boxW, boxH);
      g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(x, top, boxW, boxH);
      const size = Math.min(34, 920 / [...step].length);
      text(step, x + boxW / 2, top + boxH / 2, { font: `800 ${size}px "Noto Sans SC"`, fill: INK });
      if (i < 2) {
        const cx = x + boxW + gap / 2, cy = top + boxH / 2;
        g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(cx - 12, cy); g.lineTo(cx + 8, cy); g.stroke();
        g.fillStyle = INK; g.beginPath(); g.moveTo(cx + 2, cy - 10); g.lineTo(cx + 13, cy); g.lineTo(cx + 2, cy + 10); g.closePath(); g.fill();
      }
    });
  }

  g.fillStyle = INK; g.fillRect(m, 1405, w - 2 * m, 190);
  text('原理结论', w / 2, 1450, { font: `700 28px ${SERIF}`, fill: pop });
  if (takeaway) {
    const size = Math.max(32, Math.min(48, 900 / [...takeaway].length));
    text(takeaway, w / 2, 1535, { font: `900 ${size}px ${SERIF}`, fill: '#FFF9EC' });
  }
  if (closing) {
    const size = Math.max(30, Math.min(44, 920 / [...closing].length));
    text(closing, w / 2, 1780, { font: `900 ${size}px ${SERIF}`, fill: INK });
  }
}
