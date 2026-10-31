// brand.js — 白洞的包装：镜头、白洞圆环转场、场景标签、字幕、片头、片尾。配色和字体和头像、banner 一致。
import { clamp, lerp, seg, ss, back, hash } from '/core/lib.js';
import { W, H, INK, g, push, pop, translate, scale, shape, fillOnly, stroke, ell, rr, rect, text, screenRect, reset } from './toon.js';
import { C } from './chars.js';
import { CHARACTERS, CHARACTER_IDS } from './characters.js';
export const SERIF = '"Noto Serif SC"', SANS = '"Noto Sans SC"';
const { BLUE, GREY, LIGHT, PAPER, RING } = C;

// 镜头：世界坐标 (cx, cy) 放在画面中心，缩放 z
export function cam(cx, cy, z, shake = 0, t = 0) {
  reset(); translate(W / 2, H / 2);
  if (shake) { const f = Math.floor(t * 24); translate((hash(f) - .5) * shake * 2, (hash(f + 77) - .5) * shake * 2); }
  scale(z); translate(-cx, -cy);
}

// 白洞转场：一个黑点从画面中心扩散成满屏，带着三圈圆环，再收回去露出下一个场景
export function ringWipe(t, WIPES, hw = .24) {
  for (const tc of WIPES) {
    const d = Math.abs(t - tc); if (d > hw) continue;
    const u = 1 - d / hw, R = 1250 * Math.pow(u, .75);
    reset();
    for (const [k, a] of [[1.45, .35], [1.3, .55], [1.15, .8]]) stroke(ell(W / 2, H / 2, R * k + 20, R * k + 20, 90), 3, { line: `rgba(195,195,195,${a})`, boil: .3 });
    shape(ell(W / 2, H / 2, R + 2, R + 2, 90), { fill: INK, stroke: false, boil: .3 });
  }
}

// 场景标签：左上角一块白底小牌，“No.01 · 凌晨两点 · 卧室”。黑色小方块（克莱因蓝留给老白的围巾）
export function tag(t, TAGS, NO) {
  for (const tg of TAGS) {
    if (t < tg.t0 || t >= tg.t1) continue;
    const n = Math.floor((t - tg.t0) * 20), str = `No.${String(NO).padStart(2, '0')} · ${tg.text}`, s = [...str].slice(0, n).join('');
    reset(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = `400 30px ${SERIF}`;
    const w = g.measureText(str).width + 74;
    push(); translate(56, 50); scale(back(seg(t, tg.t0, tg.t0 + .18), 2));
    shape(rr(0, 0, w, 58, 8), { fill: PAPER, lw: 3 });
    fillOnly(rect(20, 22, 14, 14), INK, { boil: 0 });
    text(s, 48, 30, { font: `400 30px ${SERIF}`, fill: INK, align: 'left' });
    pop();
  }
}

// 字幕：粗黑体白字加黑描边；人物名牌由正式角色注册表生成。
// 旧期仍可用 LAOBAI/XIAOWEN，新期台词必须使用 A1–D2。
const WHO = {
  LAOBAI: ['老白', INK, PAPER],
  XIAOWEN: ['小问', PAPER, INK],
  ...Object.fromEntries(CHARACTER_IDS.map(id => {
    const c = CHARACTERS[id];
    return [id, [c.name, c.visual.accent || INK, PAPER]];
  })),
};
const SUBF = `900 52px ${SANS}`;
function wrap(str, max = 1300) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.font = SUBF;
  if (g.measureText(str).width < max) return [str];
  const cs = [...str], mid = cs.length / 2; let best = -1;
  cs.forEach((c, i) => { if ('，。：；？！、'.includes(c) && i < cs.length - 1 && (best < 0 || Math.abs(i + 1 - mid) < Math.abs(best - mid))) best = i + 1; });
  if (best < 0) best = Math.round(mid);
  return [cs.slice(0, best).join(''), cs.slice(best).join('')];
}
export function subs(t, SUBS) {
  const act = SUBS.filter(s => t >= s.t0 && t < s.t1).slice(-2);
  let y = H - 86;
  for (let i = act.length - 1; i >= 0; i--) {
    const s = act[i], a = i === act.length - 1 ? 1 : .7, lines = wrap(s.text), [name, bg, fg] = WHO[s.who] || [s.who || '未命名角色', INK, PAPER];
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = SUBF;
    const tw = Math.max(...lines.map(l => g.measureText(l).width)), nw = 96;
    const x0 = (W - (nw + 18 + tw)) / 2, y0 = y - (lines.length - 1) * 68;
    reset(); g.globalAlpha = a;
    push(); translate(x0 + nw / 2, y0); scale(back(seg(t, s.t0, s.t0 + .12), 2)); translate(-nw / 2, 0);
    shape(rr(0, -24, nw, 48, 14), { fill: bg, lw: 4 });
    text(name, nw / 2, 2, { font: `900 28px ${SANS}`, fill: fg });
    pop();
    lines.forEach((l, k) => text(l, x0 + nw + 18, y0 + k * 68, { font: SUBF, fill: PAPER, align: 'left', outlineW: 11 }));
    g.globalAlpha = 1;
    y = y0 - 88;
  }
}
// 由台词和时间线生成字幕区间：至少停留 max(语音 + 0.35, 0.9 + 字数/17)，不跨过下一句和转场
export function buildSubs(VO, LINE, vdur, cuts) {
  const starts = Object.values(VO).sort((a, b) => a - b);
  return Object.entries(VO).map(([id, t0]) => {
    const L = LINE[id], d = vdur(id);
    let t1 = t0 + Math.max(d + .35, .9 + L.text.length / 17);
    const next = starts.find(x => x > t0 + .05); if (next && t1 > next - .05) t1 = Math.max(next - .05, t0 + d + .1);
    const cut = cuts.find(c => c > t0 + .1); if (cut && t1 > cut) t1 = Math.max(cut - .02, t0 + d + .1);
    return { id, t0, t1, who: L.who, text: L.text };
  });
}

// 白洞标志：黑点 + 向外扩散的同心圆
export function ringsLogo(cx, cy, r, t, { spread = 1, alpha = 1 } = {}) {
  for (let k = 0; k < 3; k++) {
    const p = ((t * .35 + k / 3) % 1), R = r * (1.3 + p * 2.4 * spread);
    stroke(ell(cx, cy, R, R, 80), 2.5, { line: `rgba(170,170,170,${(1 - p) * .8 * alpha})`, boil: .3 });
  }
  shape(ell(cx, cy, r, r, 60), { fill: INK, stroke: false, boil: .3 });
}

function wrapQ(str, max, font) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.font = font;
  if (g.measureText(str).width <= max) return [str];
  const cs = [...str], mid = cs.length / 2; let best = -1;
  cs.forEach((c, i) => { if ('，。：；？！、'.includes(c) && i < cs.length - 1 && (best < 0 || Math.abs(i + 1 - mid) < Math.abs(best - mid))) best = i + 1; });
  if (best < 0) best = Math.round(mid);
  return [cs.slice(0, best).join(''), cs.slice(best).join('')];
}
const letterSpaced = s => [...s].join('  ');

// 片头（约 2 秒）：黑点弹出、圆环扩散，“白洞 No.xx”和本期问题
export function opener(t, t0, d, NO, QUESTION) {
  const u = t - t0;
  reset(); screenRect(PAPER);
  g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(40, 40, W - 80, H - 80);
  g.fillStyle = BLUE; g.fillRect(1776, 84, 26, 26);
  text(letterSpaced('BAIDONG'), 120, 98, { font: '400 24px sans-serif', fill: GREY, align: 'left' });
  reset(); ringsLogo(W / 2, 400, 70 * back(clamp(u / .35), 2.2), u);
  const a = ss(seg(u, .25, .6));
  g.globalAlpha = a;
  text(`白洞 No.${String(NO).padStart(2, '0')}`, W / 2, 610, { font: `400 34px ${SERIF}`, fill: GREY });
  const lines = wrapQ(QUESTION, 1500, `900 76px ${SERIF}`);
  lines.forEach((l, i) => text(l, W / 2, 720 + i * 96, { font: `900 76px ${SERIF}` }));
  g.globalAlpha = 1;
}
// 片尾（约 4 秒）：口号、评论区问题、下期预告、片尾固定语
export function endCard(t, t0, d, { COMMENT_Q = '', NEXT = '' } = {}) {
  const u = t - t0;
  reset(); screenRect(PAPER);
  g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(40, 40, W - 80, H - 80);
  g.fillStyle = BLUE; g.fillRect(1776, 84, 26, 26);
  text(letterSpaced('BAIDONG'), 120, 98, { font: '400 24px sans-serif', fill: GREY, align: 'left' });
  reset(); ringsLogo(W / 2, 250, 46, u, { spread: .7 });
  const f = k => ss(seg(u, .15 + k * .25, .5 + k * .25));
  g.globalAlpha = f(0); text('每期看懂一个机制。', W / 2, 450, { font: `900 84px ${SERIF}` });
  g.globalAlpha = f(1); if (COMMENT_Q) text(`评论区聊聊：${COMMENT_Q}`, W / 2, 590, { font: `400 40px ${SERIF}`, fill: '#333333' });
  g.globalAlpha = f(2); if (NEXT) text(`下期：${NEXT}`, W / 2, 690, { font: `400 36px ${SERIF}`, fill: '#333333' });
  g.globalAlpha = f(3); text('下一个为什么，白洞见。', W / 2, 850, { font: `400 34px ${SERIF}`, fill: GREY });
  g.globalAlpha = 1;
}
