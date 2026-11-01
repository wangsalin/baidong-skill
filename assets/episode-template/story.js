// story.js — 本期的设定和时间线顺序。改这里，不用手算秒数（timeline.js 会按真实配音时长排）。
export const NO = 0;
export const QUESTION = '样片：为什么半夜不想睡？';
export const COMMENT_Q = '你一般几点睡？';
export const NEXT = '吃饱穿暖了，为什么更累了？';
// 封面：以下只是接线示例；正式封面的冲突文案、颜色、场景与四比例排版按 references/covers.md V5 实现。
export const COVER = { title: '明明很困 / 为什么不想睡？', hl: '不想睡', bg: '#FFD23F', pop: '#12B8A6', characterA: 'A1', characterB: 'A2', poseA: 'point', poseB: 'point' };

// 下面是一个 20 秒左右的样片，用来验证模板能跑通。做正式一期时整段替换。
export const BEATS = [
  { shot: 'hook', world: 'home', seg: 's1', segTitle: '明明很困，为什么不想睡', cue: 'tension', tag: '凌晨两点 · 卧室' },
  { line: 'a1' },
  { opener: 2.0, fx: 'opener' },
  { shot: 'two', world: 'studio', seg: 's2', segTitle: '那点时间是你自己的', cue: 'theme' },
  { line: 'a2' }, { line: 'b1' },
  { wipe: true, shot: 'ex', world: 'office', seg: 's4', segTitle: '白天的时间不属于你', cue: 'think', tag: '下午三点 · 工位' },
  { line: 'b2' },
  { shot: 'aha', world: 'office', cue: 'resolve', mark: 'aha' }, { line: 'c1', gap: .3 },
  { end: 4.0, fx: 'end' },
];
