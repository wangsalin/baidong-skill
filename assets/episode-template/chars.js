// chars.js — A1–D2 八位正式角色；老白/小问仅作历史兼容。人物配饰按注册表保留，场景配色见 worlds.js。
// 本地坐标：原点在脚底，y 向下；face = 1 朝右，-1 镜像。设定见 G:\vibe\baidong-brand\CHARACTERS.md
// view：'q'（3/4 侧面，默认）| 'front' 正面 | 'side' 正侧面（朝右，用 face:-1 朝左）| 'back' 背面
// 动作：POSES 里是现成的整套姿势，用法 laobai({ x, y, ...POSES.laobai.explain, talk, t })
import { hash } from '/core/lib.js';
import { g, tx, INK, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot } from './toon.js';
import { CHARACTER_IDS, CHARACTERS, getCharacter } from './characters.js';

export const C = { BLUE: '#002FA7', GREY: '#8A8A8A', LIGHT: '#E6E6E6', PAPER: '#FFFFFF', RING: '#C3C3C3', SK: '#F3F1EE', SKS: '#DCD8D2', MOUTH: '#3A1420', TONGUE: '#B8B8B8' };
const { BLUE, GREY, LIGHT, PAPER, SK, SKS, MOUTH, TONGUE } = C;
const HD = '#2A2A2A', HDS = '#161616', HDF = '#3A3A3A', LEGF = '#6E6E6E', SEAT = '#D9D9D9';

// —— 表情预设（和 CHARACTERS.md 一致）。E 的键：lid 眼皮 0–1、look [x,y]、bl/br 眉毛倾斜（>0 内端上扬=担心，<0=生气）、blDy/brDy 眉毛抬高、eS 眼睛缩放、pupil 瞳孔、m 嘴 {o 张开, w 宽, sm 嘴角, skew 歪}、sweat 冒汗
export const EXPR = {
  laobai: {
    calm: {}, seeThrough: { lid: .3, brDy: 12, m: { sm: .5, skew: .4 } }, speechless: { lid: .78, look: [.6, 0], m: { sm: -.6, w: .6 } },
    explain: { lid: .4, m: { sm: .1 } }, smile: { lid: .45, m: { sm: .6 } }, surprised: { lid: 0, bl: .6, br: .6, blDy: 8, brDy: 8, m: { o: .4 } },
    think: { lid: .55, look: [.5, -.6], bl: .3, br: -.2, m: { sm: -.1, w: .7 } },
  },
  xiaowen: {
    ask: { m: { o: .25 }, look: [.3, -.4] }, shocked: { eS: 1.2, pupil: 2.6, bl: 1.5, br: 1.5, m: { o: .9, w: 1.2 }, sweat: true }, defiant: { bl: -1, br: -1, m: { sm: -.8, skew: .5 }, look: [-.3, .2] },
    calm: { bl: .4, br: .4, m: { sm: 0 } }, aha: { eS: 1.1, bl: -.2, br: -.2, blDy: 10, brDy: 10, m: { o: .5, sm: .5 } }, sad: { bl: 1.8, br: 1.8, lid: .25, m: { sm: -.9, w: .6 }, look: [0, .5] },
    happy: { bl: .2, br: .2, m: { o: .35, sm: .9 } },
  },
};
// —— 手臂：h = 手相对肩膀的位置，bend = 弯曲方向和幅度。armF 是靠近镜头的手，armB 是远处的手
export const ARMS = {
  laobai: { rest: { h: [24, 172], bend: 10 }, restB: { h: [-20, 182], bend: -8 }, point: { h: [128, -30], bend: -34 }, explain: { h: [92, 50], bend: 40 }, up: { h: [60, -120], bend: -20 },
    chin: { h: [-22, -66], bend: 70 }, shrugF: { h: [118, 6], bend: 40 }, shrugB: { h: [-112, 6], bend: -40 }, crossF: { h: [-74, 92], bend: 30 }, crossB: { h: [76, 86], bend: -26 }, knee: { h: [70, 160], bend: 30 } },
  xiaowen: { rest: { h: [14, 96], bend: 12 }, restB: { h: [-16, 98], bend: -8 }, raise: { h: [60, -104], bend: -16 }, fist: { h: [40, -30], bend: -34 }, fistB: { h: [-40, -26], bend: 30 },
    headF: { h: [40, -110], bend: 42 }, headB: { h: [-42, -108], bend: -42 }, open: { h: [80, 10], bend: 20 }, up: { h: [50, -130], bend: -10 }, droop: { h: [8, 104], bend: 4 }, lap: { h: [50, 70], bend: 20 } },
};
// —— 常用动作（整套姿势）
export const POSES = {
  laobai: {
    stand: { expr: 'calm' },
    explain: { expr: 'explain', armF: ARMS.laobai.explain, headTilt: .04 },
    point: { expr: 'seeThrough', armF: ARMS.laobai.point, lean: .03 },
    think: { expr: 'think', armF: ARMS.laobai.chin, headTilt: -.06 },
    shrug: { expr: 'speechless', armF: ARMS.laobai.shrugF, armB: ARMS.laobai.shrugB, headTilt: .1 },
    cross: { expr: 'seeThrough', armF: ARMS.laobai.crossF, armB: ARMS.laobai.crossB, lean: -.03 },
    walk: { expr: 'calm', walk: .131, armF: { h: [44, 164], bend: 14 }, armB: { h: [-44, 168], bend: -10 } },
    sit: { expr: 'calm', sit: true, armF: ARMS.laobai.knee, armB: { h: [50, 170], bend: 20 } },
  },
  xiaowen: {
    stand: { expr: 'calm' },
    raise: { expr: 'ask', armF: ARMS.xiaowen.raise },
    shocked: { expr: 'shocked', armF: ARMS.xiaowen.headF, armB: ARMS.xiaowen.headB, nerv: 1 },
    defiant: { expr: 'defiant', armF: ARMS.xiaowen.fist, armB: ARMS.xiaowen.fistB, lean: -.04 },
    sad: { expr: 'sad', armF: ARMS.xiaowen.droop, armB: ARMS.xiaowen.restB, headTilt: .14, lean: .04 },
    aha: { expr: 'aha', armF: ARMS.xiaowen.up, bob: -24 },
    walk: { expr: 'calm', walk: .131, armF: { h: [32, 90], bend: 14 }, armB: { h: [-32, 92], bend: -10 } },
    sit: { expr: 'calm', sit: true, armF: ARMS.xiaowen.lap, armB: { h: [40, 76], bend: 16 } },
  },
};

// —— 五官 ——
export function eye(cx, cy, rx, ry, { lid = 0, look = [0, 0], pupil = 4.2, closed = false, happy = false, skin = SK, lw = 6 } = {}) {
  if (happy) { stroke(arc(cx, cy + ry * .3, rx * .8, ry * .55, Math.PI * 1.1, Math.PI * 1.9, 12), lw); return; }
  if (closed || lid >= .98) { stroke(arc(cx, cy, rx * .8, ry * .45, Math.PI * .1, Math.PI * .9, 12), lw); return; }
  shape(ell(cx, cy, rx, ry, 36), {
    fill: PAPER, lw, shade: () => {
      dot(cx + look[0] * rx * .5, cy + look[1] * ry * .5, pupil);
      if (lid > 0) { const yl = cy - ry + lid * 2 * ry; fillOnly([[cx - rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, cy - ry * 1.4], [cx + rx * 1.3, yl], [cx - rx * 1.3, yl]], skin, { boil: .5 }); stroke([[cx - rx * 1.2, yl], [cx + rx * 1.2, yl]], lw); }
    }
  });
}
export function brow(cx, cy, len, tilt = 0, side = -1, dy = 0, lw = 7, col = INK) {
  stroke([[cx - side * len / 2, cy - dy - tilt * 10], [cx + side * len / 2, cy - dy + tilt * 3]], lw, { line: col });
}
export function mouth(cx, cy, mw, { o = 0, w = 1, sm = 0, skew = 0, lw = 6, line = INK } = {}) {
  const hw = mw * w / 2, k = mw * .22, lc = [cx - hw, cy - sm * k + skew * k], rc = [cx + hw, cy - sm * k - skew * k];
  if (o < .07) { stroke(quad(lc, [cx, cy + sm * k * 1.2], rc, 12), lw, { line }); return; }
  const h = o * mw * .62;
  shape([...quad(lc, [cx, cy - h * .2 + sm * k * .4], rc, 12), ...quad(rc, [cx, cy + h + sm * k * .6], lc, 14)], {
    fill: MOUTH, lw, line, shade: () => { if (o > .3) fillOnly(rect(cx - hw * 1.2, cy - h, hw * 2.4, h * .3 + 6), PAPER, { boil: .3 }); fillOnly(ell(cx, cy + h * .95, hw * .55, h * .4, 18), TONGUE, { boil: .3 }); }
  });
}
export const sweat = (x, y, s = 1) => shape(spline([[x, y - 16 * s], [x + 9 * s, y + 4 * s], [x, y + 12 * s], [x - 9 * s, y + 4 * s]]), { fill: PAPER, lw: 5 });
export const hand = (x, y, r = 18, col = SK) => shape(ell(x, y, r, r), { fill: col });
export function shoe(x, y, col = INK, sole = null) { shape(spline([[x - 26, y], [x - 22, y - 26], [x + 12, y - 28], [x + 50, y - 12], [x + 46, y + 2]]), { fill: col }); if (sole) stroke([[x - 24, y - 6], [x + 48, y - 6]], 4, { line: sole }); }
const shoeFront = (x, y, col = INK, sole = null) => { shape(spline([[x - 24, y + 2], [x - 26, y - 14], [x - 12, y - 24], [x + 12, y - 24], [x + 26, y - 14], [x + 24, y + 2]]), { fill: col }); if (sole) stroke([[x - 24, y - 4], [x + 24, y - 4]], 4, { line: sole }); };
const legsWalk = (t, amp = 20) => [[Math.sin(t * 12) * amp, -Math.max(0, Math.cos(t * 12)) * 12], [-Math.sin(t * 12) * amp, -Math.max(0, -Math.cos(t * 12)) * 12]];
const mergeE = (preset, P) => { const E = { ...preset, ...(P.E || {}) }; if (P.talk && P.talk.talking) E.m = { ...(E.m || {}), o: Math.max(P.talk.o, .08), w: P.talk.w }; if (P.blink) E.lid = 1; return E; };
const armOf = (sh, a, w0, w1, fill, r = 18, handCol = SK) => { const hp = [sh[0] + a.h[0], sh[1] + a.h[1]]; shape(noodle(sh, hp, a.bend ?? 0, w0, w1), { fill }); hand(hp[0], hp[1], r, handCol); };
const begin = P => { const f = P.face ?? 1; push(); translate(P.x, P.y + (P.bob || 0)); scale((P.s ?? 1) * f, (P.s ?? 1) * (P.sq ?? 1)); };

// ———————— 老白 · 头 ————————
export function headLaobai(E = {}) {   // 3/4
  shape(ell(-62, 8, 13, 20), { fill: SK });
  shape(spline([[0, -82], [44, -74], [66, -36], [68, 20], [56, 64], [20, 88], [-22, 86], [-56, 60], [-66, 12], [-58, -40], [-34, -72]]), { fill: SK, shade: () => fillOnly(spline([[54, -70], [90, -20], [84, 80], [52, 90], [62, 10]]), SKS, { boil: .4 }) });
  stroke(spline([[-4, -80], [-12, -112], [6, -132], [26, -122], [16, -104]], false), 6);
  const lid = E.lid ?? .5, look = E.look || [.2, 0];
  eye(-14, -12, 19, 23, { lid, look }); eye(36, -14, 16, 21, { lid, look });
  for (const [ex, rx] of [[-14, 14], [36, 11]]) stroke(arc(ex, 16, rx, 6, Math.PI * .2, Math.PI * .8, 10), 4);
  brow(-14, -48, 30, E.bl ?? 0, -1, E.blDy || 0); brow(38, -50, 26, E.br ?? 0, 1, E.brDy || 0);
  shape(spline([[14, 14], [28, 40], [20, 50], [6, 44]]), { fill: SK });
  mouth(16, 70, 40, { sm: -.2, ...E.m });
}
export function headLaobaiFront(E = {}) {
  shape(ell(-68, 6, 13, 20), { fill: SK }); shape(ell(68, 6, 13, 20), { fill: SK });
  shape(spline([[0, -84], [44, -74], [66, -34], [68, 20], [54, 64], [22, 88], [-22, 88], [-54, 64], [-68, 20], [-66, -34], [-44, -74]]), { fill: SK, shade: () => fillOnly(spline([[58, -60], [86, -10], [80, 70], [54, 84], [62, 10]]), SKS, { boil: .4 }) });
  stroke(spline([[0, -82], [-8, -112], [10, -132], [30, -122], [20, -104]], false), 6);
  const lid = E.lid ?? .5, look = E.look || [0, 0];
  eye(-24, -12, 19, 23, { lid, look }); eye(24, -12, 19, 23, { lid, look });
  for (const ex of [-24, 24]) stroke(arc(ex, 16, 14, 6, Math.PI * .2, Math.PI * .8, 10), 4);
  brow(-24, -48, 30, E.bl ?? 0, -1, E.blDy || 0); brow(24, -48, 30, E.br ?? 0, 1, E.brDy || 0);
  shape(spline([[0, 4], [12, 36], [0, 46], [-12, 36]]), { fill: SK });
  mouth(0, 70, 40, { sm: -.2, ...E.m });
}
export function headLaobaiSide(E = {}) {   // 正侧面，朝右
  shape(spline([[-6, -84], [32, -78], [56, -50], [64, -10], [64, 12], [88, 30], [74, 46], [62, 52], [60, 70], [40, 88], [0, 90], [-34, 76], [-58, 40], [-66, -4], [-54, -50], [-30, -76]]), { fill: SK, shade: () => fillOnly(spline([[-70, -40], [-40, -80], [-30, 0], [-40, 80], [-80, 60]]), SKS, { boil: .4 }) });
  shape(spline([[-26, -12], [-8, -18], [2, 0], [-2, 26], [-20, 32], [-14, 12]]), { fill: SK }); stroke(spline([[-16, -6], [-6, 2], [-10, 18]], false), 3);
  stroke(spline([[4, -84], [-4, -114], [14, -134], [34, -124], [24, -106]], false), 6);
  const lid = E.lid ?? .5;
  eye(40, -14, 12, 21, { lid, look: [.8, (E.look || [0, 0])[1]] });
  stroke(arc(40, 14, 10, 5, Math.PI * .2, Math.PI * .8, 8), 4);
  stroke([[28, -46 - (E.blDy || 0)], [54, -48 - (E.brDy || 0) - (E.br || 0) * 6]], 7);
  mouth(54, 68, 20, { sm: -.2, ...E.m });
}
export function headLaobaiBack() {
  shape(ell(-68, 6, 13, 20), { fill: SK }); shape(ell(68, 6, 13, 20), { fill: SK });
  shape(spline([[0, -84], [44, -74], [66, -34], [68, 20], [54, 64], [22, 88], [-22, 88], [-54, 64], [-68, 20], [-66, -34], [-44, -74]]), { fill: SK, shade: () => fillOnly(spline([[30, -84], [86, -30], [80, 80], [40, 92], [54, 10]]), SKS, { boil: .4 }) });
  stroke(spline([[0, -82], [-8, -112], [10, -132], [30, -122], [20, -104]], false), 6);
  stroke(arc(0, 70, 30, 10, Math.PI * .15, Math.PI * .85, 10), 3, { line: '#BDB7AE' });
}

// ———————— 老白 · 全身 ————————
// P: {x, y, s, face, view, expr, E, talk:{o,w,talking}, blink, armF, armB, lean, headTilt, bob, sq, walk, sit, scarf}
export function laobai(P = {}) {
  recordLegacyHead('LAOBAI', P, -604 + (P.sit ? 100 : 0), 80, 100);
  const view = P.view || 'q';
  if (view === 'front') return laobaiFront(P);
  if (view === 'side') return laobaiSide(P);
  if (view === 'back') return laobaiBack(P);
  const E = mergeE(EXPR.laobai[P.expr || 'calm'] || {}, P), scarf = P.scarf ?? BLUE;
  const legs = P.walk != null ? legsWalk(P.walk, P.stride ?? 34) : [[0, 0], [0, 0]], sdy = P.sit ? 100 : 0;
  begin(P);
  if (P.sit) {
    shape(rr(-80, -150, 160, 150, 10), { fill: SEAT });
    [-1, 1].forEach(sx => { const kx = 168 + sx * 10, ky = -150 - (sx < 0 ? 8 : 0); shape(noodle([sx * 18, -150], [kx, ky], -6, 40, 36), { fill: sx < 0 ? LEGF : GREY }); shape(noodle([kx, ky], [kx + 6, -26], 0, 36, 32), { fill: sx < 0 ? LEGF : GREY }); shoe(kx + 6, 0); });
  } else [-1, 1].forEach((sx, i) => { const lg = legs[i]; shape(noodle([sx * 22, -250], [sx * 24 + lg[0], -26 + lg[1]], 0, 38, 32), { fill: GREY }); shoe(sx * 24 + lg[0], lg[1]); });
  push(); translate(0, sdy); rotate(P.lean ?? 0);
  armOf([-62, -452], P.armB || ARMS.laobai.restB, 44, 38, HD);
  shape(spline([[-50, -486], [0, -468], [50, -486], [40, -524], [-40, -524]]), { fill: HD });
  shape(spline([[-36, -480], [-82, -462], [-100, -350], [-104, -230], [0, -220], [104, -230], [100, -350], [82, -462], [36, -480]]), { fill: HD, shade: () => fillOnly(spline([[40, -500], [120, -460], [120, -220], [60, -220], [80, -340]]), HDS, { boil: .4 }) });
  shape(ell(-34, -372, 28, 28), { fill: PAPER }); stroke(ell(-34, -372, 17, 17), 3); dot(-34, -372, 7);
  stroke(spline([[-70, -290], [-60, -260], [60, -260], [70, -290]], false), 5, { line: '#555555' });
  shape(noodle([6, -488], [10, -522], 0, 26, 26), { fill: SK });
  shape(spline([[-46, -494], [46, -494], [52, -470], [0, -456], [-52, -470]]), { fill: scarf });
  shape(rr(16, -472, 24, 76, 8), { fill: scarf }); stroke([[18, -410], [38, -410]], 4, { line: PAPER });
  push(); translate(10, -604); rotate(P.headTilt ?? 0); headLaobai(E); pop();
  armOf([60, -452], P.armF || ARMS.laobai.rest, 44, 38, HD);
  pop(); pop();
}
function laobaiFront(P) {
  const E = mergeE(EXPR.laobai[P.expr || 'calm'] || {}, P), scarf = P.scarf ?? BLUE;
  begin(P);
  for (const sx of [-1, 1]) { shape(noodle([sx * 24, -250], [sx * 26, -26], 0, 38, 32), { fill: GREY }); shoeFront(sx * 28, 0); }
  push(); rotate(P.lean ?? 0);
  shape(spline([[-56, -486], [0, -470], [56, -486], [44, -526], [-44, -526]]), { fill: HD });
  shape(spline([[-40, -482], [-86, -462], [-102, -350], [-104, -230], [0, -220], [104, -230], [102, -350], [86, -462], [40, -482]]), { fill: HD, shade: () => fillOnly(spline([[60, -490], [130, -450], [130, -220], [74, -220], [88, -340]]), HDS, { boil: .4 }) });
  shape(ell(0, -372, 28, 28), { fill: PAPER }); stroke(ell(0, -372, 17, 17), 3); dot(0, -372, 7);
  stroke(spline([[-60, -290], [-52, -260], [52, -260], [60, -290]], false), 5, { line: '#555555' });
  stroke([[-14, -470], [-18, -420]], 4, { line: '#777777' }); stroke([[14, -470], [18, -420]], 4, { line: '#777777' });
  shape(noodle([0, -488], [0, -522], 0, 28, 28), { fill: SK });
  shape(spline([[-50, -496], [50, -496], [54, -470], [0, -456], [-54, -470]]), { fill: scarf });
  shape(rr(16, -472, 24, 80, 8), { fill: scarf }); stroke([[18, -406], [38, -406]], 4, { line: PAPER });
  push(); translate(0, -604); rotate(P.headTilt ?? 0); headLaobaiFront(E); pop();
  armOf([-80, -452], P.armB || { h: [-18, 180], bend: -8 }, 44, 38, HD);
  armOf([80, -452], P.armF || { h: [18, 180], bend: 8 }, 44, 38, HD);
  pop(); pop();
}
function laobaiSide(P) {
  const E = mergeE(EXPR.laobai[P.expr || 'calm'] || {}, P), scarf = P.scarf ?? BLUE;
  const legs = P.walk != null ? legsWalk(P.walk, 26) : [[-6, 0], [8, 0]];
  begin(P);
  shape(noodle([-4, -250], [-4 + legs[0][0], -26 + legs[0][1]], 0, 38, 32), { fill: LEGF }); shoe(-4 + legs[0][0], legs[0][1]);
  armOf([-6, -452], P.armB || { h: [-10, 180], bend: -6 }, 40, 34, HDS, 17, SKS);
  shape(noodle([6, -250], [6 + legs[1][0], -26 + legs[1][1]], 0, 38, 32), { fill: GREY }); shoe(6 + legs[1][0], legs[1][1]);
  push(); rotate(P.lean ?? 0);
  shape(spline([[-30, -482], [-62, -470], [-76, -380], [-68, -230], [0, -222], [62, -230], [68, -360], [54, -470], [14, -486]]), { fill: HD, shade: () => fillOnly(spline([[-90, -490], [-50, -480], [-60, -230], [-90, -230]]), HDS, { boil: .4 }) });
  shape(spline([[-30, -492], [-76, -480], [-84, -428], [-64, -414], [-48, -456]]), { fill: HD });
  stroke(spline([[60, -290], [40, -262], [10, -260]], false), 5, { line: '#555555' });
  shape(noodle([8, -488], [12, -522], 0, 26, 26), { fill: SK });
  shape(spline([[-36, -496], [40, -496], [46, -470], [-32, -460]]), { fill: scarf });
  shape(rr(32, -478, 20, 76, 8), { fill: scarf });
  push(); translate(6, -604); rotate(P.headTilt ?? 0); headLaobaiSide(E); pop();
  armOf([6, -452], P.armF || { h: [10, 180], bend: 6 }, 44, 38, HD);
  pop(); pop();
}
function laobaiBack(P) {
  const scarf = P.scarf ?? BLUE;
  begin(P);
  for (const sx of [-1, 1]) { shape(noodle([sx * 24, -250], [sx * 26, -26], 0, 38, 32), { fill: GREY }); shape(ell(sx * 28, -8, 26, 14), { fill: INK }); }
  push(); rotate(P.lean ?? 0);
  armOf([-80, -452], { h: [-18, 180], bend: -8 }, 44, 38, HD);
  armOf([80, -452], { h: [18, 180], bend: 8 }, 44, 38, HD);
  shape(spline([[-40, -482], [-86, -462], [-102, -350], [-104, -230], [0, -220], [104, -230], [102, -350], [86, -462], [40, -482]]), { fill: HD, shade: () => fillOnly(spline([[60, -490], [130, -450], [130, -220], [74, -220], [88, -340]]), HDS, { boil: .4 }) });
  shape(noodle([0, -488], [0, -522], 0, 28, 28), { fill: SK });
  shape(spline([[-52, -504], [52, -504], [54, -482], [-54, -482]]), { fill: scarf });
  shape(spline([[-62, -490], [62, -490], [66, -422], [0, -392], [-66, -422]]), { fill: HDF, shade: () => stroke(spline([[-40, -480], [0, -410], [40, -480]], false), 4, { line: HDS }) });
  push(); translate(0, -604); headLaobaiBack(); pop();
  pop(); pop();
}

// ———————— 小问 · 头 ————————
export function headXiaowen(E = {}) {   // 正面
  shape(spline([[-88, 30], [-94, -40], [-60, -96], [0, -112], [60, -96], [94, -40], [88, 30], [64, 40], [-64, 40]]), { fill: INK });
  stroke(spline([[-8, -104], [-24, -146], [-2, -176], [30, -168], [36, -140], [14, -122], [10, -108]], false), 12);
  shape(ell(0, 8, 76, 78), { fill: SK, shade: () => fillOnly(ell(60, 26, 22, 56, 20), SKS, { boil: .3 }) });
  shape(spline([[-76, -8], [-66, -60], [-20, -84], [30, -82], [70, -56], [78, -10], [40, -40], [0, -28], [-40, -40]]), { fill: INK });
  const es = E.eS ?? 1, look = E.look || [0, -.1];
  eye(-28, 16, 24 * es, 28 * es, { lid: E.lid ?? 0, look, pupil: E.pupil ?? 3.8 }); eye(28, 16, 24 * es, 28 * es, { lid: E.lid ?? 0, look, pupil: E.pupil ?? 3.8 });
  brow(-28, -24, 30, E.bl ?? 1, -1, E.blDy || 0); brow(28, -24, 30, E.br ?? 1, 1, E.brDy || 0);
  mouth(0, 60, 30, { sm: -.3, ...E.m });
  if (E.sweat) { sweat(-96, -20, 1); sweat(98, 0, .8); }
}
export function headXiaowenQ(E = {}) {   // 3/4，朝右
  shape(spline([[-84, 30], [-92, -40], [-58, -96], [4, -112], [64, -94], [94, -36], [86, 30], [60, 40], [-62, 40]]), { fill: INK });
  stroke(spline([[-2, -104], [-18, -146], [4, -176], [36, -168], [42, -140], [20, -122], [16, -108]], false), 12);
  shape(ell(16, 8, 72, 78), { fill: SK, shade: () => fillOnly(ell(76, 26, 14, 54, 20), SKS, { boil: .3 }) });
  shape(spline([[-54, -10], [-48, -60], [-2, -84], [48, -82], [84, -54], [88, -8], [58, -40], [18, -28], [-20, -40]]), { fill: INK });
  const es = E.eS ?? 1, look = E.look || [.2, -.2], lid = E.lid ?? 0, pupil = E.pupil ?? 3.8;
  eye(-4, 16, 18 * es, 26 * es, { lid, look, pupil }); eye(48, 16, 25 * es, 29 * es, { lid, look, pupil });
  brow(-4, -24, 22, E.bl ?? 1, -1, E.blDy || 0); brow(48, -24, 30, E.br ?? 1, 1, E.brDy || 0);
  stroke(arc(74, 40, 6, 5, Math.PI * .1, Math.PI * .9, 6), 4);
  mouth(28, 60, 26, { sm: -.3, ...E.m });
  if (E.sweat) { sweat(-92, -20, 1); sweat(100, 0, .8); }
}
export function headXiaowenSide(E = {}) {   // 正侧面，朝右
  shape(spline([[-20, -82], [30, -86], [62, -58], [70, -16], [68, 8], [82, 24], [70, 36], [68, 52], [52, 74], [14, 86], [-26, 80], [-52, 50]]), { fill: SK });
  shape(spline([[-86, 44], [-94, -30], [-64, -94], [-4, -116], [48, -102], [74, -66], [56, -48], [22, -52], [-6, -38], [-16, 6], [-30, 48]]), { fill: INK });
  shape(spline([[26, -98], [64, -72], [74, -30], [52, -46], [28, -50]]), { fill: INK });
  stroke(spline([[-4, -112], [-22, -150], [0, -180], [32, -172], [38, -144], [16, -126], [12, -114]], false), 12);
  const es = E.eS ?? 1;
  eye(46, 16, 15 * es, 28 * es, { lid: E.lid ?? 0, look: [.8, (E.look || [0, -.2])[1]], pupil: E.pupil ?? 3.8 });
  stroke([[36, -22 - (E.blDy || 0)], [62, -26 - (E.brDy || 0) - (E.br ?? 1) * 4]], 7);
  mouth(58, 58, 18, { sm: -.3, ...E.m });
  if (E.sweat) sweat(-90, -10, 1);
}
export function headXiaowenBack() {
  shape(spline([[-88, 34], [-94, -40], [-60, -96], [0, -112], [60, -96], [94, -40], [88, 34], [60, 54], [-60, 54]]), { fill: INK, shade: () => stroke(arc(0, 10, 60, 70, Math.PI * 1.2, Math.PI * 1.5, 10), 4, { line: '#444444' }) });
  stroke(spline([[-8, -104], [-24, -146], [-2, -176], [30, -168], [36, -140], [14, -122], [10, -108]], false), 12);
}

// ———————— 小问 · 全身 ————————
// P: {x, y, s, face, t, view, expr, E, talk, blink, armF, armB, nerv, lean, headTilt, bob, sq, walk, sit}
export function xiaowen(P = {}) {
  recordLegacyHead('XIAOWEN', P, -334 + (P.sit ? 74 : 0), 84, 88);
  const view = P.view || 'q';
  if (view === 'side') return xiaowenSide(P);
  if (view === 'back') return xiaowenBack(P);
  const E = mergeE(EXPR.xiaowen[P.expr || 'ask'] || {}, P), ner = P.nerv ?? 0;
  const jit = ner ? (hash(Math.floor((P.t || 0) * 12) * 3.3) - .5) * 6 * ner : 0;
  const legs = P.walk != null ? legsWalk(P.walk, P.stride ?? 24) : [[0, 0], [0, 0]], sdy = P.sit ? 34 : 0;
  begin({ ...P, x: P.x + jit });
  if (P.sit) {
    shape(rr(-60, -78, 120, 78, 8), { fill: SEAT });
    [-1, 1].forEach(sx => { const kx = 104 + sx * 8, ky = -78 - (sx < 0 ? 5 : 0); shape(noodle([sx * 16, -80], [kx, ky], -4, 26, 24), { fill: SK }); shape(noodle([kx, ky], [kx + 4, -40], 0, 24, 22), { fill: SK }); shape(rr(kx - 10, -48, 28, 26, 6), { fill: PAPER }); shoe(kx + 4, 0, INK, PAPER); });
  } else [-1, 1].forEach((sx, i) => { const lg = legs[i]; shape(noodle([sx * 20, -112], [sx * 22 + lg[0], -40 + lg[1]], 0, 26, 24), { fill: SK }); shape(rr(sx * 22 - 14 + lg[0], -48 + lg[1], 28, 26, 6), { fill: PAPER }); (view === 'front' ? shoeFront : shoe)(sx * 22 + lg[0], lg[1], INK, PAPER); });
  push(); translate(0, sdy); rotate(P.lean ?? 0);
  armOf([-58, -236], P.armB || ARMS.xiaowen.restB, 26, 24, SK, 15);
  shape(spline([[0, -264], [56, -250], [80, -182], [76, -110], [0, -100], [-76, -110], [-80, -182], [-56, -250]]), { fill: PAPER, shade: () => { for (let k = 0; k < 5; k++) fillOnly(rect(-140, -244 + k * 30, 280, 13), INK, { boil: .3 }); } });
  shape(spline([[-72, -118], [72, -118], [76, -70], [8, -66], [0, -84], [-8, -66], [-76, -70]]), { fill: INK });
  push(); translate(0, -334); rotate(P.headTilt ?? 0); (view === 'front' ? headXiaowen : headXiaowenQ)(E); pop();
  armOf([58, -236], P.armF || ARMS.xiaowen.rest, 26, 24, SK, 15);
  pop(); pop();
}
function xiaowenSide(P) {
  const E = mergeE(EXPR.xiaowen[P.expr || 'ask'] || {}, P);
  const legs = P.walk != null ? legsWalk(P.walk, 20) : [[-6, 0], [8, 0]];
  begin(P);
  shape(noodle([-4, -112], [-4 + legs[0][0], -40 + legs[0][1]], 0, 26, 24), { fill: SKS }); shape(rr(-18 + legs[0][0], -48 + legs[0][1], 28, 26, 6), { fill: PAPER }); shoe(-4 + legs[0][0], legs[0][1], INK, PAPER);
  armOf([-4, -236], P.armB || { h: [-8, 98], bend: -6 }, 24, 22, SKS, 14, SKS);
  shape(noodle([6, -112], [6 + legs[1][0], -40 + legs[1][1]], 0, 26, 24), { fill: SK }); shape(rr(-8 + legs[1][0], -48 + legs[1][1], 28, 26, 6), { fill: PAPER }); shoe(6 + legs[1][0], legs[1][1], INK, PAPER);
  push(); rotate(P.lean ?? 0);
  shape(spline([[-34, -264], [30, -264], [54, -200], [52, -110], [0, -100], [-48, -110], [-56, -200]]), { fill: PAPER, shade: () => { for (let k = 0; k < 5; k++) fillOnly(rect(-140, -244 + k * 30, 280, 13), INK, { boil: .3 }); } });
  shape(spline([[-48, -118], [52, -118], [54, -70], [-50, -70]]), { fill: INK });
  push(); translate(4, -334); rotate(P.headTilt ?? 0); headXiaowenSide(E); pop();
  armOf([6, -236], P.armF || { h: [10, 98], bend: 6 }, 26, 24, SK, 15);
  pop(); pop();
}
function xiaowenBack(P) {
  begin(P);
  for (const sx of [-1, 1]) { shape(noodle([sx * 20, -112], [sx * 22, -40], 0, 26, 24), { fill: SK }); shape(rr(sx * 22 - 14, -48, 28, 26, 6), { fill: PAPER }); shape(ell(sx * 24, -8, 24, 12), { fill: INK }); }
  push(); rotate(P.lean ?? 0);
  armOf([-58, -236], { h: [-16, 98], bend: -8 }, 26, 24, SK, 15);
  armOf([58, -236], { h: [16, 98], bend: 8 }, 26, 24, SK, 15);
  shape(spline([[0, -264], [56, -250], [80, -182], [76, -110], [0, -100], [-76, -110], [-80, -182], [-56, -250]]), { fill: PAPER, shade: () => { for (let k = 0; k < 5; k++) fillOnly(rect(-140, -244 + k * 30, 280, 13), INK, { boil: .3 }); } });
  shape(spline([[-72, -118], [72, -118], [76, -70], [8, -66], [0, -84], [-8, -66], [-76, -70]]), { fill: INK });
  push(); translate(0, -334); headXiaowenBack(); pop();
  pop(); pop();
}

// 一个灰色的临时人物（老同学、店员、路人……），和主角区分开
export function extra(P = {}) {
  begin(P);
  const coat = P.coat || '#B5B5B5', coatS = P.coatS || '#9A9A9A';
  for (const sx of [-1, 1]) { shape(noodle([sx * 26, -200], [sx * 30, -24], 0, 44, 38), { fill: LEGF }); shoe(sx * 30, 0); }
  shape(noodle([-76, -380], [-92, -230], -8, 46, 40), { fill: coat });
  shape(spline([[-40, -410], [-96, -384], [-110, -290], [-104, -196], [0, -186], [104, -196], [110, -290], [96, -384], [40, -410]]), { fill: coat, shade: () => fillOnly(spline([[40, -420], [130, -380], [130, -190], [70, -190], [86, -300]]), coatS, { boil: .4 }) });
  stroke([[0, -404], [0, -192]], 5);
  push(); translate(0, -470);
  shape(ell(0, 0, 66, 64), { fill: SK });
  shape(spline([[-62, -20], [-56, -56], [-30, -76], [10, -82], [44, -70], [64, -40], [62, -18], [0, -40]]), { fill: P.hair || '#555555' });
  eye(-22, 6, 14, 16, { lid: .3 }); eye(22, 6, 14, 16, { lid: .3 });
  mouth(0, 34, 28, { sm: .4, ...(P.talk && P.talk.talking ? { o: P.talk.o } : {}) });
  pop();
  shape(noodle([76, -380], [92, -230], 8, 46, 40), { fill: coat });
  pop();
}

// ———————— A1–D2 正式角色 ————————
// 八位角色共用白洞的粗线条、平涂和硬边阴影，但通过体块、脸型、服装和配饰区分。
// 生产镜头用 character('A1', P)；不要把某个角色重新映射成老白/小问或临时叙事身份。
const FORMAL_STYLE = {
  A1: { variant: 'tall', bodyW: 104, bodyH: 340, headW: 74, headH: 88, legW: 38, legH: 250 },
  A2: { variant: 'slim', bodyW: 88, bodyH: 292, headW: 82, headH: 82, legW: 29, legH: 198 },
  B1: { variant: 'broad', bodyW: 132, bodyH: 318, headW: 96, headH: 84, legW: 44, legH: 230 },
  B2: { variant: 'broad', bodyW: 118, bodyH: 306, headW: 86, headH: 80, legW: 40, legH: 220 },
  C1: { variant: 'long', bodyW: 96, bodyH: 376, headW: 78, headH: 92, legW: 36, legH: 270 },
  C2: { variant: 'long', bodyW: 92, bodyH: 358, headW: 74, headH: 86, legW: 34, legH: 254 },
  D1: { variant: 'angular', bodyW: 124, bodyH: 318, headW: 98, headH: 92, legW: 42, legH: 232 },
  D2: { variant: 'diamond', bodyW: 112, bodyH: 304, headW: 88, headH: 86, legW: 38, legH: 218 },
};

const formalBase = id => ['A2', 'B2', 'C2', 'D2'].includes(id) ? EXPR.xiaowen : EXPR.laobai;
const formalArm = id => ['A2', 'B2', 'C2', 'D2'].includes(id) ? ARMS.xiaowen : ARMS.laobai;

export const FORMAL_POSES = Object.freeze(Object.fromEntries(CHARACTER_IDS.map(id => {
  const a = formalArm(id);
  const light = ['A2', 'B2', 'C2', 'D2'].includes(id);
  return [id, {
    stand: { expr: light ? 'calm' : 'calm' },
    explain: { expr: light ? 'happy' : 'explain', armF: a.explain || a.open || a.rest },
    point: { expr: light ? 'defiant' : 'seeThrough', armF: a.point || a.open || a.rest },
    think: { expr: light ? 'calm' : 'think', armF: a.chin || a.headF || a.rest },
    shrug: { expr: light ? 'sad' : 'speechless', armF: a.shrugF || a.droop || a.rest, armB: a.shrugB || a.restB },
    cross: { expr: light ? 'defiant' : 'seeThrough', armF: a.crossF || a.fist || a.rest, armB: a.crossB || a.fistB || a.restB },
    walk: { expr: 'calm', walk: .131, armF: { h: [36, 126], bend: 14 }, armB: { h: [-36, 130], bend: -10 } },
    sit: { expr: 'calm', sit: true, armF: { h: [46, 85], bend: 18 }, armB: { h: [-12, 88], bend: -8 } },
    front: { expr: 'calm', view: 'front' },
    side: { expr: 'calm', view: 'side' },
    back: { expr: 'calm', view: 'back' },
  }];
})));

function formalHead(spec, E, view = 'q') {
  const { headW: w, headH: h, variant } = spec;
  const angular = variant === 'angular' || variant === 'diamond';
  if (view === 'side') {
    const profile = [[-w * .52, -h * .7], [0, -h], [w * .48, -h * .76], [w * .53, -h * .1], [w * .96, h * .12], [w * .55, h * .25], [w * .52, h * .75], [w * .12, h], [-w * .5, h * .58]];
    shape(angular ? profile : spline(profile), { fill: SK, shade: () => fillOnly(spline([[-w * .5, -h * .6], [-w * .12, -h * .7], [-w * .06, h * .9], [-w * .5, h * .5]]), SKS, { boil: .35 }) });
    shape(ell(-w * .37, h * .1, w * .17, h * .22), { fill: SK, lw: 4 });
    if (variant === 'tall' || variant === 'long') stroke(spline([[-10, -h * .94], [-20, -h * 1.3], [0, -h * 1.46], [18, -h * 1.25]], false), 7);
    if (variant === 'slim' || variant === 'broad' || variant === 'long') shape(spline([[-w * .57, h * .4], [-w * .6, -h * .7], [0, -h * 1.03], [w * .46, -h * .78], [w * .46, -h * .43], [-w * .17, -h * .45], [-w * .23, h * .33]]), { fill: variant === 'broad' ? '#343434' : INK });
    eye(w * .3, -h * .1, w * .17 * (E.eS ?? 1), h * .25 * (E.eS ?? 1), { lid: E.lid ?? 0, look: E.look || [.7, 0], pupil: E.pupil ?? 4 });
    brow(w * .29, -h * .48, w * .33, E.br ?? 0, 1, E.brDy || 0, 6);
    if (variant === 'broad') stroke(arc(w * .3, -h * .1, w * .23, h * .3, 0, Math.PI * 2, 20), 4);
    mouth(w * .57, h * .63, w * .3, { sm: -.15, ...E.m });
    if (E.sweat) sweat(-w * .63, -h * .1, .8);
    return;
  }
  const outline = angular
    ? [[0, -h], [w * .72, -h * .72], [w * .84, h * .12], [w * .45, h * .78], [0, h], [-w * .45, h * .78], [-w * .84, h * .12], [-w * .72, -h * .72]]
    : spline([[-w * .72, h * .2], [-w * .82, -h * .45], [-w * .42, -h * .92], [0, -h], [w * .48, -h * .84], [w * .82, -h * .35], [w * .74, h * .38], [w * .35, h], [-w * .34, h]]);
  shape(outline, { fill: SK, shade: () => fillOnly(spline([[w * .42, -h * .72], [w * .95, -h * .12], [w * .65, h * .78], [w * .25, h * .9], [w * .48, h * .05]]), SKS, { boil: .35 }) });
  if (variant === 'tall' || variant === 'long') stroke(spline([[-8, -h * .92], [-18, -h * 1.3], [2, -h * 1.48], [22, -h * 1.3], [14, -h * .98]], false), 7);
  if (variant === 'slim') { shape(spline([[-w * .8, -h * .45], [-w * .35, -h * .95], [w * .12, -h * .88], [w * .7, -h * .44], [w * .45, -h * .2], [-w * .65, -h * .2]]), { fill: INK }); stroke([[w * .55, -h * .32], [w * .7, -h * .2]], 7, { line: CHARACTERS.A2.visual.accent }); }
  if (variant === 'broad') shape(spline([[-w * .88, -h * .25], [-w * .74, -h * .85], [0, -h * 1.02], [w * .74, -h * .82], [w * .88, -h * .18], [w * .55, -h * .42], [-w * .55, -h * .42]]), { fill: '#343434' });
  if (variant === 'long') shape(spline([[-w * .78, -h * .3], [-w * .72, -h * .86], [-w * .1, -h * 1.04], [w * .72, -h * .76], [w * .78, h * .1], [w * .62, h * .46], [w * .55, -h * .24]]), { fill: INK });
  if (angular) stroke([[0, -h], [w * .72, -h * .72], [w * .84, h * .12]], 5, { line: INK });
  if (view === 'back') {
    // 后脑保留脸型、发型与配饰识别，不画眼睛、眉毛或嘴。
    if (variant === 'slim' || variant === 'broad' || variant === 'long') shape(spline([[-w * .76, h * .3], [-w * .79, -h * .58], [0, -h * 1.02], [w * .78, -h * .55], [w * .76, h * .38], [w * .4, h * .75], [-w * .4, h * .75]]), { fill: variant === 'broad' ? '#343434' : INK });
    stroke(arc(0, h * .74, w * .38, h * .1, .12 * Math.PI, .88 * Math.PI, 12), 3, { line: '#BDB7AE' });
    return;
  }
  if (view === 'front') {
    E = { ...E, look: E.look || [0, 0] };
    stroke([[0, h * .05], [-w * .08, h * .28], [w * .06, h * .28]], 4);
  }
  const lid = E.lid ?? 0, look = E.look || [.15, 0], es = E.eS ?? 1;
  eye(-w * .31, -h * .08, w * .22 * es, h * .26 * es, { lid, look, pupil: E.pupil ?? 4 });
  eye(w * .3, -h * .08, w * .2 * es, h * .25 * es, { lid, look, pupil: E.pupil ?? 4 });
  brow(-w * .3, -h * .48, w * .34, E.bl ?? 0, -1, E.blDy || 0, 6);
  brow(w * .3, -h * .5, w * .32, E.br ?? 0, 1, E.brDy || 0, 6);
  if (variant === 'broad') { stroke(arc(-w * .31, -h * .08, w * .28, h * .3, 0, Math.PI * 2, 20), 4); stroke(arc(w * .3, -h * .08, w * .26, h * .29, 0, Math.PI * 2, 20), 4); stroke([[-w * .04, -h * .08], [w * .04, -h * .08]], 4); }
  mouth(0, h * .64, w * .52, { sm: -.15, ...E.m });
  if (E.sweat) { sweat(-w * .98, -h * .1, .8); sweat(w * .98, h * .1, .65); }
}

function formalAccessory(spec, character, bodyTop, view = 'q') {
  const { accessory, accent } = character.visual;
  const w = spec.bodyW;
  if (view === 'back' && accessory === 'geo-brooch') return;
  if (accessory === 'long-scarf') {
    shape(spline([[-w * .45, bodyTop + 2], [w * .45, bodyTop + 2], [w * .38, bodyTop + 38], [-w * .38, bodyTop + 38]]), { fill: accent });
    shape(spline([[w * .18, bodyTop + 24], [w * .42, bodyTop + 28], [w * .42, bodyTop + 210], [w * .16, bodyTop + 188]]), { fill: accent });
  } else if (accessory === 'hair-clip') {
    shape(rr(w * .42, bodyTop - 128, 28, 14, 5), { fill: accent, lw: 4 });
  } else if (accessory === 'check-neckerchief') {
    shape(spline([[-w * .44, bodyTop + 2], [w * .44, bodyTop + 2], [w * .3, bodyTop + 54], [-w * .3, bodyTop + 54]]), { fill: accent, lw: 4 });
    for (let k = -2; k <= 2; k++) stroke([[k * 20, bodyTop + 6], [k * 20, bodyTop + 48]], 3, { line: '#F4D8C2' });
  } else if (accessory === 'blue-cuff') {
    shape(rr(-w * .72, bodyTop + 112, 34, 46, 6), { fill: accent, lw: 4 }); shape(rr(w * .48, bodyTop + 112, 34, 46, 6), { fill: accent, lw: 4 });
  } else if (accessory === 'headphones') {
    stroke(arc(0, bodyTop - 86, spec.headW * 1.16, spec.headH * 1.1, Math.PI * 1.08, Math.PI * 1.92, 18), 8, { line: accent });
    shape(rr(-spec.headW * 1.08, bodyTop - 58, 18, 42, 6), { fill: accent, lw: 4 }); shape(rr(spec.headW * .9, bodyTop - 58, 18, 42, 6), { fill: accent, lw: 4 });
  } else if (accessory === 'badge-bag') {
    if (view === 'back') { stroke([[-w * .35, bodyTop + 6], [w * .7, bodyTop + 270]], 7, { line: accent }); return; }
    stroke([[w * .35, bodyTop + 6], [w * .7, bodyTop + 270]], 7, { line: accent }); shape(rr(w * .45, bodyTop + 132, 56, 70, 5), { fill: PAPER, lw: 4 }); fillOnly(rect(w * .45 + 12, bodyTop + 151, 32, 9), accent, { boil: 0 });
  } else if (accessory === 'triangle-scarf') {
    shape([[0, bodyTop + 2], [w * .46, bodyTop + 42], [0, bodyTop + 154], [-w * .46, bodyTop + 42]], { fill: accent, lw: 5 });
  } else if (accessory === 'geo-brooch') {
    shape([[w * .2, bodyTop + 22], [w * .34, bodyTop + 42], [w * .2, bodyTop + 62], [w * .06, bodyTop + 42]], { fill: accent, lw: 4 });
  }
}

export const FRAME_CHARACTERS = new Map();
export function resetCharacterFrame() { FRAME_CHARACTERS.clear(); }
function recordHead(id, w, h) {
  const corners = [[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => tx(x, y));
  const xs = corners.map(p => p[0]), ys = corners.map(p => p[1]);
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
  const visible = Math.max(0, Math.min(right, g.canvas.width) - Math.max(left, 0)) * Math.max(0, Math.min(bottom, g.canvas.height) - Math.max(top, 0));
  const area = (right - left) * (bottom - top);
  if (area > 1 && visible >= area * .25) FRAME_CHARACTERS.set(id, true);
}
function recordLegacyHead(id, P, y, w, h) {
  begin(P); translate(0, y); rotate(P.headTilt ?? 0); recordHead(id, w, h); pop();
}

function drawFormal(id, P = {}) {
  const character = getCharacter(id), original = FORMAL_STYLE[id], view = P.view || 'q';
  if (!character || !original) throw new Error(`Unknown formal character: ${id}`);
  if (!['q', 'front', 'side', 'back'].includes(view)) throw new Error(`Unknown view: ${view}`);
  const spec = view === 'side' ? { ...original, bodyW: original.bodyW * .72 } : original;
  const base = formalBase(id), E = mergeE(base[P.expr || 'calm'] || {}, P), legs = P.walk != null ? legsWalk(P.walk, P.stride ?? 28) : [[0, 0], [0, 0]];
  const bodyTop = -spec.bodyH + (P.sit ? spec.legH * .2 : 0), bodyBottom = P.sit ? -spec.legH * .55 - 12 : -56;
  begin(P);
  if (P.sit) {
    const seat = -spec.legH * .55;
    shape(rr(-spec.bodyW * .72, seat, spec.bodyW * 1.6, 26, 8), { fill: SEAT });
    for (const sx of [-1, 1]) {
      stroke([[sx * spec.bodyW * .58, seat + 24], [sx * spec.bodyW * .66, -4]], 8);
      const knee = [spec.bodyW * .94 + sx * 12, seat - (sx < 0 ? 8 : 0)];
      shape(noodle([sx * spec.bodyW * .17, seat], knee, -5, spec.legW, spec.legW * .86), { fill: sx < 0 ? LEGF : GREY });
      shape(noodle(knee, [knee[0] + 8, -26], 0, spec.legW * .86, spec.legW * .78), { fill: sx < 0 ? LEGF : GREY });
      shoe(knee[0] + 8, 0, INK, PAPER);
    }
  } else {
  for (const [sx, i] of [[-1, 0], [1, 1]]) {
    const lg = legs[i];
    shape(noodle([sx * spec.bodyW * .18, -spec.legH], [sx * spec.bodyW * .2 + lg[0], -26 + lg[1]], 0, spec.legW, spec.legW * .82), { fill: i ? GREY : LEGF });
    shoe(sx * spec.bodyW * .2 + lg[0], lg[1], INK, PAPER);
  }
  }
  push(); rotate(P.lean ?? 0);
  armOf([-spec.bodyW * .48, bodyTop + 34], P.armB || formalArm(id).restB, spec.variant === 'broad' ? 45 : 34, 30, character.visual.coat);
  shape(spline([[-spec.bodyW * .5, bodyTop + 18], [-spec.bodyW * .38, bodyTop - 24], [spec.bodyW * .38, bodyTop - 24], [spec.bodyW * .5, bodyTop + 18], [spec.bodyW * .42, bodyBottom], [-spec.bodyW * .42, bodyBottom]]), { fill: character.visual.coat, shade: () => fillOnly(spline([[spec.bodyW * .34, bodyTop], [spec.bodyW * .6, bodyTop + 30], [spec.bodyW * .54, bodyBottom - 6], [spec.bodyW * .25, bodyBottom - 6]]), character.visual.shade, { boil: .35 }) });
  if (id === 'A2' || id === 'D2') for (let k = 0; k < 4; k++) stroke([[-spec.bodyW * .42, bodyTop + 50 + k * 36], [spec.bodyW * .42, bodyTop + 50 + k * 36]], 6, { line: INK });
  formalAccessory(spec, character, bodyTop, view);
  armOf([spec.bodyW * .48, bodyTop + 34], P.armF || formalArm(id).rest, spec.variant === 'broad' ? 45 : 34, 30, character.visual.coat);
  push(); translate(0, bodyTop - 100); rotate(P.headTilt ?? 0); recordHead(id, spec.headW, spec.headH); formalHead(spec, E, view); pop();
  pop(); pop();
}

export function character(id, P = {}) { return drawFormal(id, P); }
export const drawCharacter = character;
