// 浏览器内执行；读取实际渲染记录，供制作校验与回归测试共用。
export function scanCast(expected = null) {
  if (!Array.isArray(window.CAST_CUES) || !window.CAST_CUES.length) throw new Error('未接入 CAST_CUES 实际声画检查，禁止跳过。');
  if (!Array.isArray(window.CAST_BOUNDARIES) || window.CAST_BOUNDARIES.some(t=>!Number.isFinite(t))) throw new Error('缺少有效的切镜/转场边界。');
  const ids = window.CAST_CUES.map(c=>c.id);
  if(new Set(ids).size!==ids.length)throw new Error('声画台词 ID 重复。');
  if(!Array.isArray(window.EV))throw new Error('缺少实际声音事件。');
  const events=window.EV.filter(e=>e.type==='vo');
  if(events.length!==ids.length||new Set(events.map(e=>e.id)).size!==ids.length)throw new Error('声音事件未完整对应台词。');
  for(const cue of window.CAST_CUES){const event=events.find(e=>e.id===cue.id);if(!event||event.who!==cue.who||Math.abs(event.t-cue.t0)>.002)throw new Error('混音事件与画面时间线不一致：'+cue.id);}
  if(expected){
    if(expected.length!==ids.length)throw new Error('声画检查未覆盖全部台词。');
    for(const line of expected){
      const cue=window.CAST_CUES.find(c=>c.id===line.id);
      if(!cue||cue.who!==line.who||Math.abs((cue.t1-cue.t0)-line.duration)>.002)throw new Error('声画时间线与真实配音不一致：'+line.id);
    }
  }
  const ordered=[...window.CAST_CUES].sort((a,b)=>a.t0-b.t0);
  for(let i=1;i<ordered.length;i++)if(ordered[i].t0<ordered[i-1].t1-.001)throw new Error('人物配音发生重叠：'+ordered[i].id);
  const failures = []; let frames = 0, failureCount = 0, cutawayFrames = 0, establishedSpeaker = null, previousSpeaker = null;
  for (const cue of ordered) {
    if (cue.who !== previousSpeaker) establishedSpeaker = null;
    previousSpeaker = cue.who;
    if (!Number.isFinite(cue.t0) || !Number.isFinite(cue.t1) || cue.t1 <= cue.t0 || cue.t1 > window.DUR + .001) throw new Error(`台词 ${cue.id} 发声区间无效或超出成片时长`);
    const times = new Set([cue.t0 + .0001, cue.t1 - .0001]);
    for (let i = Math.ceil(cue.t0 * 24); i < cue.t1 * 24; i++) times.add(i / 24);
    for (const b of window.CAST_BOUNDARIES || []) for (const delta of [-.0001, .0001]) {
      if (b + delta >= cue.t0 && b + delta < cue.t1) times.add(b + delta);
    }
    for (const t of [...times].sort((a, b) => a - b)) {
      delete window.FRAME_CAST; delete window.FRAME_SPEAKING; delete window.FRAME_OCCLUDED; delete window.FRAME_PRESENTATION;
      window.render(t); frames++;
      if(!Array.isArray(window.FRAME_CAST)||!Array.isArray(window.FRAME_SPEAKING)||typeof window.FRAME_OCCLUDED!=='boolean')throw new Error('本帧缺少出镜、口型或遮挡记录。');
      const visible = window.FRAME_CAST.includes(cue.who) && window.FRAME_SPEAKING.includes(cue.who);
      const declaration = window.FRAME_PRESENTATION;
      const declared = ['insert','broll'].includes(declaration?.mode);
      const wrongMouth = window.FRAME_SPEAKING.some(id => id !== cue.who);
      const validCutaway = declared && declaration.speaker === cue.who && typeof declaration.subject === 'string' && declaration.subject.trim().length > 0 && establishedSpeaker === cue.who;
      if (visible && !window.FRAME_OCCLUDED && !wrongMouth) establishedSpeaker = cue.who;
      if (validCutaway) cutawayFrames++;
      if (window.FRAME_OCCLUDED || wrongMouth || (declared ? !validCutaway : !visible) || (declaration && !['onscreen','insert','broll'].includes(declaration.mode))) {
        failureCount++;
        if (failures.length < 20) failures.push({ line: cue.id, who: cue.who, t: +t.toFixed(4), cast: window.FRAME_CAST, transition: window.FRAME_OCCLUDED, presentation: declaration, establishedSpeaker });
      }
    }
  }
  return { passed: failureCount === 0, lines: window.CAST_CUES.length, frames, cutawayFrames, failureCount, failures };
}
