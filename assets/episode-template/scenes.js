// 本期可编辑镜头；人物与包装入口由固定主程序注入。
export function createScenes({cam,world,drawRole,FORMAL_POSES,T,lerp,seg,ss,Wd}){
// ———————— 接线样例。正式一期按分镜和 references/visual.md 重写：人物行动、物件特写、反应近景和机制画面 ————————
const SH = {};
SH.hook = (t, tq) => {
  cam(700, 520, lerp(1.7, 1.8, seg(t, 0, 3)));
  world('night', t);
  drawRole('A1', t, { x: 700, face: 1, ...FORMAL_POSES.A1.cross, E: { lid: .8, look: [.5, 0], m: { sm: -.6, w: .6 } } });
};
SH.two = (t, tq) => {
  cam(960, 560, lerp(1.0, 1.05, ss(seg(t, T.opener + 2, T.opener + 8))));
  world('studio', t);
  drawRole('A2', t, { x: 690, face: 1, ...FORMAL_POSES.A2.point });
  drawRole('B1', t, { x: 1230, face: -1, ...FORMAL_POSES.B1.explain });
};
SH.ex = (t, tq) => {
  cam(960, 560, 1.0);
  world('office', t);
  Wd.board(1260, 200, 560, 330, ['9:00–18:00  老板的', '18:00–24:00  通勤、家务', '24:00–02:00  我的'], { title: '时间归谁' });
  drawRole('B2', t, { x: 860, face: 1, ...FORMAL_POSES.B2.point });
};
SH.aha = (t, tq) => {
  cam(700, 575, 1.8);   // 近景：镜头中心对准脸（小问的脸在 y - 334*s ≈ 566）
  world('office', t);
  drawRole('C1', t, { x: 700, face: 1, ...FORMAL_POSES.C1.think, bob: -20 * Math.sin(seg(tq, T.aha + .2, T.aha + .6) * Math.PI) });
};


return SH;
}
