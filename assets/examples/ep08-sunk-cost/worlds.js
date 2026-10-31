// worlds.js — 常用场景底稿。每期可调整这些色盘，让地点与情绪一眼可辨。
// 世界坐标：宽约 1920，地面在 FLOOR；背景画得比画面大，方便推拉摇移。
import { hash, TAU } from '/core/lib.js';
import { INK, push, pop, translate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, bands, dot, text } from './toon.js';
import { C } from './chars.js';
import { SERIF, ringsLogo } from './brand.js';
export const FLOOR = 900;
const { PAPER } = C;

// 白洞演播室：白底、一条地平线、身后同心圆。接线样例的布景；正式片按主题和 visual.md 设计地点、科幻道具与人物行动
export function studio(t, { rings = true } = {}) {
  fillOnly(rect(-3000, -3000, 8000, 8000), PAPER, { boil: 0 });
  if (rings) for (let k = 1; k <= 4; k++) stroke(ell(960, 480, 140 * k, 140 * k, 90), 3, { line: ['#12AEB5', '#FF6B52', '#F5C842', '#A85ADB'][k - 1], boil: .4 });
  shape(rect(-3000, FLOOR, 8000, 900), { fill: '#DDF6F0', lw: 4, shade: () => stroke([[-3000, FLOOR + 60], [5000, FLOOR + 60]], 3, { line: '#12AEB5' }) });
}
// 办公室：金黄百叶窗、珊瑚色隔板、青绿色地面
export function office(t) {
  bands(['#FFD166', '#F8B45C'], -1500, FLOOR);
  for (const x of [200, 900, 1600]) { shape(rr(x, 260, 360, 300, 6), { fill: '#FFF1C1', lw: 5 }); for (let k = 1; k < 8; k++) stroke([[x, 260 + k * 37], [x + 360, 260 + k * 37]], 3, { line: '#E88A42' }); }
  for (let i = 0; i < 4; i++) {
    const x = -100 + i * 600;
    shape(rr(x, 700, 460, 30, 4), { fill: '#F26B5B', lw: 5 });
    shape(rr(x + 150, 560, 170, 120, 8), { fill: '#25344A', lw: 5, shade: () => fillOnly(rr(x + 162, 572, 146, 96, 4), i % 2 ? '#30C6C2' : '#FF8B4D', { boil: .3 }) });
    shape(rect(x + 225, 680, 20, 22), { fill: '#25344A', lw: 4 });
  }
  shape(rect(-3000, FLOOR, 8000, 900), { fill: '#18A99A', lw: 5 });
}
// 街道：青蓝天空、珊瑚/紫/黄楼面、深青路面
export function street(t) {
  fillOnly(rect(-3000, -3000, 8000, 8000), '#3CC7D0', { boil: 0 });
  const fronts = [[-400, 380], [-120, 460], [180, 340], [470, 500], [780, 380], [1080, 440], [1380, 360], [1680, 470], [1980, 400]];
  const facades = ['#FF6B5F', '#F4C542', '#8A5AE6', '#F58AC5'];
  fronts.forEach(([x, h], i) => shape(rect(x, 760 - h - 200, 280, h + 220), { fill: facades[i % facades.length], lw: 5, shade: () => { for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) fillOnly(rr(x + 30 + c * 80, 760 - h - 160 + r * 90, 44, 56, 4), '#FFF4C9', { boil: .2 }); } }));
  shape(rect(-3000, 760, 8000, 140), { fill: '#F18B48', lw: 5 });
  shape(rect(-3000, FLOOR, 8000, 900), { fill: '#176D83', lw: 5, shade: () => { for (let k = -10; k < 20; k++) fillOnly(rect(k * 220, FLOOR + 120, 120, 16), '#48CFC5', { boil: .2 }); } });
}
// 家：日间用暖黄墙面和珊瑚沙发；夜间切到亮青窗和玫红沙发
export function home(t, { night = false } = {}) {
  bands(night ? ['#6754C8', '#8672E8'] : ['#FFD34E', '#FFE88A'], -1500, FLOOR);
  shape(rr(1180, 220, 420, 380, 8), { fill: night ? '#18C6D0' : '#35C7C2', lw: 6 });
  stroke([[1390, 220], [1390, 600]], 5, { line: night ? '#F04F91' : '#F26B55' }); stroke([[1180, 410], [1600, 410]], 5, { line: night ? '#F04F91' : '#F26B55' });
  if (night) for (let i = 0; i < 6; i++) dot(1200 + hash(i) * 380, 240 + hash(i + 5) * 160, 5, '#FFE45C');
  const sofa = night ? '#ED4F91' : '#F15B45';
  shape(rr(200, 600, 620, 200, 30), { fill: sofa, lw: 6, shade: () => fillOnly(rect(200, 700, 620, 100), night ? '#B93C83' : '#CB493A', { boil: .3 }) });
  shape(rr(170, 560, 90, 260, 30), { fill: sofa, lw: 6 }); shape(rr(760, 560, 90, 260, 30), { fill: sofa, lw: 6 });
  stroke([[980, 880], [980, 420]], 6, { line: '#70469A' }); shape([[920, 420], [1040, 420], [1010, 340], [950, 340]], { fill: night ? '#FFE45C' : '#F5A342', lw: 5 });
  shape(rect(-3000, FLOOR, 8000, 900), { fill: night ? '#68548F' : '#EA9A44', lw: 5 });
}
// 一块“黑板”式的说明牌：讲机制时把关键词、公式或简图放上去
export function board(x, y, w, h, lines = [], { title = '' } = {}) {
  shape(rr(x, y, w, h, 14), { fill: PAPER, lw: 6 });
  if (title) text(title, x + 36, y + 56, { font: `900 44px ${SERIF}`, align: 'left' });
  lines.forEach((l, i) => text(l, x + 36, y + (title ? 130 : 70) + i * 64, { font: `400 38px ${SERIF}`, align: 'left', fill: '#222222' }));
}
