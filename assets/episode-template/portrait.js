// 原生竖屏镜头示例。按本期改写场景，不重写角色、字幕或品牌包装。
import { screenRect, text } from './toon.js';
import { QUESTION } from './story.js';
export function createPortraitScenes({drawRole,FORMAL_POSES,Wd}) {
  const stage=(color)=>{screenRect(color);text(QUESTION,540,260,{font:'900 42px "Noto Serif SC"'});};
  return {
    hook(t){stage('#D8E8F2');drawRole('A1',t,{x:540,y:1290,s:1.45,...FORMAL_POSES.A1.cross});},
    two(t){stage('#F8D7BC');drawRole('A2',t,{x:320,y:1300,s:1.16,...FORMAL_POSES.A2.point});drawRole('B1',t,{x:760,y:1300,s:1.12,face:-1,...FORMAL_POSES.B1.explain});},
    ex(t){stage('#C8E9E3');Wd.board(90,400,900,350,['9:00–18:00  老板的','18:00–24:00  通勤、家务','24:00–02:00  我的'],{title:'时间归谁'});drawRole('B2',t,{x:540,y:1340,s:1.2,...FORMAL_POSES.B2.point});},
    aha(t){stage('#F1C6CF');drawRole('C1',t,{x:540,y:1330,s:1.4,...FORMAL_POSES.C1.think});}
  };
}
