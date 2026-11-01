// timeline.js — 按 story.js 的 BEATS 和真实配音时长，自动排出整期时间线。
// 每个 beat 是一个对象，可以组合这些键（按出现顺序处理）：
//   shot: '镜头名', world: '场景名'   从当前时刻开始一个新镜头（scenes.js / portrait.js 的镜头函数）
//   wipe: true                        在当前时刻做白洞转场（默认留出 0.48 秒，新镜头在遮罩中心切入）
//   tag: '凌晨两点 · 卧室'            左上角场景标签，到下一个 tag 或片尾为止
//   seg: 's2', segTitle: '……'         六段结构的分段点（用于章节和自查）
//   cue: 'theme'                      音乐段落从这里开始（music/score.py 认的名字）
//   mark: '名字'                      记下当前时刻，镜头里用 T.名字 对动作
//   fx: 'pop' 或 ['pop', 0.1]         在当前时刻（或稍后几秒）放一个音效
//   line: 'l3', gap: 0.08             一句台词，默认句间隔 0.08 秒；关键定义和因果须完整可听
//                                     当前声画校验禁止配音重叠；抢话感用短 gap、反应和动作完成
//   pause: 0.8                        为动作、犹豫或反应留白，时长按表演决定，不设统一半秒上限
//   opener: 2.0                       片头（白洞 No.xx + 本期问题）
//   end: 4.0                          片尾卡
export function buildTimeline(BEATS, vdur, { wipeDuration = .48 } = {}) {
  if (!(wipeDuration > 0)) throw new Error('wipeDuration 必须为正数');
  const WIPE_HALF = wipeDuration / 2;
  let t = 0, cur = null;
  const VO = {}, SHOTS = [], WIPES = [], TAGS = [], CUES = [], SEGS = [], T = {}, FX = [];
  const startShot = (name, world, at = t) => { if (cur) cur[1] = at; cur = [at, null, name, world || (cur && cur[3]) || 'studio']; SHOTS.push(cur); };
  const closeTag = () => { const last = TAGS[TAGS.length - 1]; if (last && last.t1 == null) last.t1 = t; };
  const closeCue = () => { const last = CUES[CUES.length - 1]; if (last && last.t1 == null) last.t1 = t; };
  for (const b of BEATS) {
    const cut = b.wipe ? t + WIPE_HALF : t;
    if (b.wipe) { WIPES.push(cut); t += wipeDuration; }
    if (b.opener) { closeTag(); startShot('opener', 'opener', cut); T.opener = t; t += b.opener; }
    if (b.end) { closeTag(); closeCue(); CUES.push({ t0: t, t1: null, name: b.cue || 'end' }); startShot('end', 'end', cut); T.end = t; t += b.end; continue; }
    if (b.shot) startShot(b.shot, b.world, cut);
    if (b.tag) { closeTag(); TAGS.push({ t0: t + .1, t1: null, text: b.tag }); }
    if (b.seg) SEGS.push({ t, k: b.seg, title: b.segTitle || '' });
    if (b.cue) { closeCue(); CUES.push({ t0: t, t1: null, name: b.cue }); }
    if (b.mark) T[b.mark] = t;
    if (b.fx) { const [name, dt] = Array.isArray(b.fx) ? b.fx : [b.fx, 0]; FX.push({ t: t + dt, name }); }
    if (b.line) {
      if (Object.hasOwn(VO, b.line)) throw new Error(`重复引用台词 ID：${b.line}；重播请使用新的台词 ID，避免覆盖配音事件`);
      const duration = vdur(b.line);
      if (!Number.isFinite(duration) || duration <= 0) throw new Error(`台词 ${b.line} 时长无效：${duration}`);
      VO[b.line] = t; t += Math.max(.2, duration + (b.gap ?? .08));
    }
    if (b.pause) t += b.pause;
  }
  if (cur) cur[1] = t;
  closeTag(); closeCue();
  const DUR = +t.toFixed(3);
  const shotAt = x => SHOTS.find(s => x >= s[0] && x < s[1]) || SHOTS[SHOTS.length - 1];
  // 字幕在转场开始前和换场景时清掉
  const CUTS = [...WIPES.map(w => w - WIPE_HALF), ...SHOTS.filter((s, i) => i > 0 && s[3] !== SHOTS[i - 1][3]).map(s => s[0])].sort((a, b) => a - b);
  return { DUR, VO, SHOTS, WIPES, WIPE_HALF, TAGS, CUES, SEGS, T, FX, CUTS, shotAt };
}
