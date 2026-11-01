// 浏览器内执行；读取实际渲染记录，供制作校验与回归测试共用。
export function scanCast() {
  if (!Array.isArray(window.CAST_CUES) || !window.CAST_CUES.length) throw new Error('未接入 CAST_CUES 实际声画检查，禁止跳过。');
  const failures = []; let frames = 0, failureCount = 0;
  for (const cue of window.CAST_CUES) {
    if (!Number.isFinite(cue.t0) || !Number.isFinite(cue.t1) || cue.t1 <= cue.t0 || cue.t1 > window.DUR + .001) throw new Error(`台词 ${cue.id} 发声区间无效或超出成片时长`);
    const times = new Set([cue.t0 + .0001, cue.t1 - .0001]);
    for (let i = Math.ceil(cue.t0 * 24); i < cue.t1 * 24; i++) times.add(i / 24);
    for (const b of window.CAST_BOUNDARIES || []) for (const delta of [-.0001, .0001]) {
      if (b + delta >= cue.t0 && b + delta < cue.t1) times.add(b + delta);
    }
    for (const t of [...times].sort((a, b) => a - b)) {
      window.render(t); frames++;
      if (!window.FRAME_CAST?.includes(cue.who) || window.FRAME_OCCLUDED) {
        failureCount++;
        if (failures.length < 20) failures.push({ line: cue.id, who: cue.who, t: +t.toFixed(4), cast: window.FRAME_CAST, transition: window.FRAME_OCCLUDED });
      }
    }
  }
  return { passed: failureCount === 0, lines: window.CAST_CUES.length, frames, failureCount, failures };
}
