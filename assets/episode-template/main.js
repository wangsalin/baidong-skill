// main.js — 本期的镜头。时间线来自 story.js（timeline.js 自动排），包装来自 brand.js，角色来自 chars.js。
// ?mode=cover&size=16x9 出封面，?mode=clipframe 出竖版切片底图（见 cover.js）
import { lerp, seg, ss, eo, back, hash, clamp } from '/core/lib.js';
import { W, H, INK, init, frame, g, reset, screenRect } from './toon.js';
import { laobai, xiaowen, extra, POSES, ARMS, C } from './chars.js';
import * as Wd from './worlds.js';
import { cam, ringWipe, tag, subs, buildSubs, opener, endCard } from './brand.js';
import { buildTimeline } from './timeline.js';
import { NO, QUESTION, COMMENT_Q, NEXT, COVER, BEATS } from './story.js';
import { renderCover, renderClipFrame } from './cover.js';

const QS = new URLSearchParams(location.search), MODE = QS.get('mode') || 'film';
const cv = document.getElementById('c');
if (MODE !== 'film') { cv.width = innerWidth; cv.height = innerHeight; }
init(cv);
const J = async f => { try { const r = await fetch(f); if (r.ok) return await r.json(); } catch (e) { } return null; };
const LINES = (await J('lines.json')) || [], DURS = (await J('voices/dur.json')) || (await J('voices/raw/dur.json')) || {}, LIPS = (await J('voices/lips.json')) || {};
const LINE = Object.fromEntries(LINES.map(l => [l.id, l]));
const vdur = id => DURS[id] ?? (LINE[id] ? LINE[id].text.length * .2 : 1);
const TL = buildTimeline(BEATS, vdur);
const { DUR, VO, SHOTS, WIPES, TAGS, CUES, SEGS, T, FX, CUTS, shotAt } = TL;
const q = t => Math.floor(t * 12 + 1e-6) / 12;
const FLOOR = Wd.FLOOR;

// —— 口型（12 fps 换形）和自动眨眼 ——
function talk(who, t) {
  const tq = q(t);
  for (const [id, t0] of Object.entries(VO)) {
    const L = LINE[id]; if (!L || L.who !== who) continue;
    if (tq >= t0 && tq < t0 + vdur(id)) {
      const k = Math.floor((tq - t0) * 24), lp = LIPS[id];
      const o = lp ? (lp.o[k] ?? 0) : .25 + .3 * Math.abs(Math.sin(tq * 11)), b = lp ? (lp.b[k] ?? .5) : .5;
      return { o, w: .8 + .45 * b - .2 * o, talking: true };
    }
  }
  return { o: 0, w: 1, talking: false };
}
const autoBlink = (t, seed) => { const k = Math.floor(t * 12), c = Math.floor(k / 30); return hash(c * 7.1 + seed) > .35 && k % 30 < 2; };
// 两位主角的默认状态：呼吸、说话时轻微点头、自动眨眼。镜头里用 LB(t, {...}) / XW(t, {...}) 覆盖
const LB = (t, o = {}) => { const m = talk('LAOBAI', t), tq = q(t); return { x: 1230, y: FLOOR, s: 1, face: -1, talk: m, blink: autoBlink(t, 3), sq: 1 + .008 * Math.sin(tq * 2.3), headTilt: m.talking ? (m.o - .3) * .05 : 0, ...o }; };
const XW = (t, o = {}) => { const m = talk('XIAOWEN', t), tq = q(t); return { x: 690, y: FLOOR, s: 1, face: 1, t, talk: m, blink: autoBlink(t, 9), sq: 1 + .012 * Math.sin(tq * 3.1), headTilt: m.talking ? (m.o - .3) * .08 : 0, ...o }; };
const WORLD = { studio: Wd.studio, office: Wd.office, street: Wd.street, home: Wd.home, night: t => Wd.home(t, { night: true }) };
const world = (name, t, o) => (WORLD[name] || Wd.studio)(t, o);

// ———————— 接线样例。正式一期按分镜和 references/visual.md 重写：人物行动、物件特写、反应近景和机制画面 ————————
const SH = {};
SH.hook = (t, tq) => {
  cam(700, 520, lerp(1.7, 1.8, seg(t, 0, 3)));
  world('night', t);
  xiaowen(XW(t, { ...POSES.xiaowen.shocked, nerv: .4 }));
};
SH.two = (t, tq) => {
  cam(960, 560, lerp(1.0, 1.05, ss(seg(t, T.opener + 2, T.opener + 8))));
  world('studio', t);
  xiaowen(XW(t, POSES.xiaowen.raise));
  laobai(LB(t, POSES.laobai.explain));
};
SH.ex = (t, tq) => {
  cam(960, 560, 1.0);
  world('office', t);
  Wd.board(1260, 200, 560, 330, ['9:00–18:00  老板的', '18:00–24:00  通勤、家务', '24:00–02:00  我的'], { title: '时间归谁' });
  laobai(LB(t, { ...POSES.laobai.point, x: 860, face: 1 }));
};
SH.aha = (t, tq) => {
  cam(700, 575, 1.8);   // 近景：镜头中心对准脸（小问的脸在 y - 334*s ≈ 566）
  world('office', t);
  xiaowen(XW(t, { ...POSES.xiaowen.aha, bob: -20 * Math.sin(seg(tq, T.aha + .2, T.aha + .6) * Math.PI) }));
};

// —— 渲染 ——
const SUBS = buildSubs(VO, LINE, vdur, CUTS);
function render(t) {
  frame(t); reset(); screenRect(C.PAPER);
  const [, , name] = shotAt(t), tq = q(t);
  if (name === 'opener') opener(t, T.opener, 2, NO, QUESTION);
  else if (name === 'end') endCard(t, T.end, 4, { COMMENT_Q, NEXT });
  else (SH[name] || SH.two)(t, tq);
  ringWipe(t, WIPES);
  if (name !== 'opener' && name !== 'end') tag(t, TAGS, NO);
  subs(t, SUBS);
}
// —— 声音事件（music/score.py 和 mix.py 读 events.json）——
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  for (const [id, t0] of Object.entries(VO)) add('vo', t0, { id, who: LINE[id] && LINE[id].who });
  for (const c of CUES) add('cue', c.t0, { name: c.name, t0: c.t0, t1: c.t1 });
  for (const s of SEGS) add('seg', s.t, { k: s.k, title: s.title });
  let cur = null;
  for (const [a, b, , w] of SHOTS) { if (cur && cur.w === w) cur.b = b; else { if (cur) add('amb', cur.a, { w: cur.w, d: +(cur.b - cur.a).toFixed(3) }); cur = { a, b, w }; } }
  if (cur) add('amb', cur.a, { w: cur.w, d: +(cur.b - cur.a).toFixed(3) });
  for (const tc of WIPES) add('wipe', tc - .16);
  for (let i = 1; i < SHOTS.length; i++) {   // 普通切镜头加一声短促的“嗖”（转场、片头、片尾自己有音效）
    const [a, , name] = SHOTS[i];
    if (name !== 'opener' && name !== 'end' && !WIPES.some(w => Math.abs(w - a) < .4)) add('cut', a - .04);
  }
  for (const tg of TAGS) add('tagpop', tg.t0);
  for (const f of FX) add(f.name, f.t);
  return ev.sort((a, b) => a.t - b.t);
}

if (MODE === 'cover') {
  const P = { ...COVER, no: NO, size: QS.get('size') || '16x9' };
  for (const k of ['title', 'hl', 'laobai', 'xiaowen']) if (QS.get(k)) P[k] = QS.get(k);
  window.render = () => renderCover(cv.width, cv.height, P); window.DUR = 1;
} else if (MODE === 'clipframe') {
  window.render = () => renderClipFrame(cv.width, cv.height, { question: QS.get('question') || QUESTION, flow: QS.get('flow') || '', takeaway: QS.get('takeaway') || '', closing: QS.get('closing') || '', no: NO, bg: '#FFF9EC', pop: COVER.pop, accent: COVER.bg }); window.DUR = 1;
} else {
  window.render = render; window.DUR = DUR; window.EV = events(); window.SUBS = SUBS; window.SEGS = SEGS;
}
for (const f of ['900 52px "Noto Sans SC"', '900 60px "Noto Serif SC"', '400 30px "Noto Serif SC"']) { try { await document.fonts.load(f); } catch (e) { } }
window.render(parseFloat(QS.get('t') ?? '1'));
window.READY = true;
