// 独立造型探索。正式角色文件与 skill 均不受此文件影响。
import {push,pop,translate,rotate,scale,shape,fillOnly,stroke,ell,arc,spline,rr,rect,noodle,dot,INK,S} from './toon.js';
import {eye,mouth,shoe} from './chars.js';
const SK='#F3F1EE', SHADE='#DAD6CF', WHITE='#FFFFFF', BLUE='#002FA7', BLACK='#25242A', GREY='#97979B';
const p=(pts,fill=SK,lw=6)=>shape(spline(pts),{fill,lw});
const box=(x,y,w,h,r,fill=WHITE,lw=6)=>shape(rr(x,y,w,h,r),{fill,lw});
const ln=(pts,lw=5,col=INK)=>stroke(pts,lw,{line:col});
function logo(x,y,r=15){shape(ell(x,y,r,r),{fill:WHITE,lw:3});stroke(ell(x,y,r*.62,r*.62),2.5);dot(x,y,r*.23);}
function scarf(x,y,w=92,long=84){box(x-w/2,y,w,29,9,BLUE,5);p([[x+14,y+24],[x+41,y+24],[x+35,y+long],[x+9,y+long]],BLUE,5);ln([[x+12,y+long-12],[x+35,y+long-12]],3,WHITE);}
function shortScarf(x,y){
  const blue='#53657D';box(x-48,y,96,34,10,blue,5);
  p([[x-18,y+25],[x+17,y+23],[x+31,y+58],[x-7,y+62]],blue,4);
  ln([[x-31,y+4],[x-31,y+30]],3,'#C2C8D0');ln([[x-7,y+4],[x-7,y+30]],3,'#C2C8D0');
  ln([[x+20,y+4],[x+20,y+30]],3,'#C2C8D0');ln([[x-44,y+16],[x+43,y+16]],3,'#C2C8D0');
  ln([[x-7,y+41],[x+23,y+39]],3,'#C2C8D0');
}
function headphones(x,y){
  ln(spline([[x-39,y],[x-43,y+36],[x,y+53],[x+43,y+36],[x+39,y]],false),13,'#595D66');
  box(x-50,y+17,25,43,9,BLUE,4);box(x+25,y+17,25,43,9,BLUE,4);
  ln([[x-41,y+25],[x-41,y+49]],3,WHITE);ln([[x+34,y+25],[x+34,y+49]],3,WHITE);
}
function neckerchief(x,y){
  p([[x-46,y],[x+48,y],[x+23,y+32],[x-1,y+65],[x-29,y+32]],'#315C9E',5);
  ln([[x-32,y+11],[x,y+47],[x+32,y+11]],3,WHITE);
  box(x-10,y+7,22,16,5,BLACK,3);
}
function tuft(x,y,question=false){
  ln(spline(question?[[x,y],[x-6,y-26],[x+3,y-42],[x+23,y-40],[x+29,y-22],[x+15,y-11],[x+12,y-2]]:[[x,y],[x-8,y-24],[x+2,y-36],[x+15,y-29],[x+10,y-18]],false),question?9:6);
}
export const MOODS=[
  {id:'roast',label:'冷眼'}, {id:'talk',label:'开口吐槽'}, {id:'speechless',label:'无语'}, {id:'caught',label:'震惊'},
  {id:'think',label:'思考'}, {id:'laugh',label:'大笑'}, {id:'angry',label:'不服'}, {id:'sad',label:'委屈'},
];
export const POSES=[
  {id:'stand',label:'站立'}, {id:'explain',label:'摊手接话'}, {id:'point',label:'指向吐槽'}, {id:'shrug',label:'耸肩'},
  {id:'cross',label:'抱臂'}, {id:'think',label:'托腮'}, {id:'facepalm',label:'扶额'}, {id:'stop',label:'摆手制止'},
];
function features({kind='bai',mood='roast',w=1,glasses=false,style='soft'}={}) {
  const bai=kind==='bai';
  const presets={
    roast:{lid:bai?.58:.29,look:bai?[.45,0]:[-.5,.1],b:[-33,-34,-28,-39],sm:.05,skew:bai?-.25:.55,o:0},
    talk:{lid:.23,look:[-.4,0],b:[-38,-30,-27,-42],sm:.25,skew:.3,o:.65},
    speechless:{lid:.68,look:[.8,.9],b:[-30,-30,-30,-30],sm:0,skew:0,o:0,mw:.6},
    caught:{lid:0,look:[0,0],b:[-48,-51,-51,-48],sm:-.1,skew:0,o:1,mw:.6},
    think:{lid:.18,look:[.7,-.8],b:[-40,-45,-27,-30],sm:-.15,skew:-.4,o:0,mw:.7},
    laugh:{lid:0,look:[0,0],b:[-42,-35,-35,-42],sm:1,skew:0,o:1.05,mw:1.18,happy:true},
    angry:{lid:.13,look:[-.3,.2],b:[-43,-23,-23,-43],sm:-.65,skew:.1,o:.18},
    sad:{lid:.4,look:[0,.75],b:[-23,-42,-42,-23],sm:-.95,skew:0,o:0,mw:.72},
  };
  const e=presets[mood]||presets.roast;
  if(style==='geo'&&!e.happy){
    for(const x of [-23,24]){
      const ry=mood==='caught'?20:15;
      shape(rr(x-15,-ry,30,ry*2,6),{fill:WHITE,lw:4,shade:()=>{
        dot(x+e.look[0]*8,Math.max(e.look[1]*8,-ry+e.lid*ry*2+4),3.5);
        if(e.lid){fillOnly(rect(x-20,-ry-3,40,e.lid*ry*2+3),SK);ln([[x-18,-ry+e.lid*ry*2],[x+18,-ry+e.lid*ry*2]],4);}
      }});
    }
  }else{
    const size=mood==='caught'?1.13:1;
    for(const [x,y,rx,ry] of [[-23,-1,17*w,bai?19:21],[24,-3,18*w,bai?20:22]])
      eye(x,y,rx*size,ry*size,{lid:e.lid,look:[e.look[0],Math.max(e.look[1],4*e.lid-1.55)],happy:e.happy,pupil:3.5,lw:4,skin:SK});
  }
  ln([[-38,e.b[0]],[-12,e.b[1]]],6);ln([[10,e.b[2]],[39,e.b[3]]],6);
  if(bai){p([[0,6],[10,26],[2,31],[-6,25]],SK,4);ln([[-35,22],[-16,26]],3,'#89868A');ln([[16,24],[34,21]],3,'#89868A');}
  else ln([[38,25],[43,22]],3);
  mouth(bai?1:4,bai?49:47,bai?32:38,{sm:e.sm,skew:e.skew,o:e.o,w:e.mw||1,lw:4});
  if(mood==='caught')p([[56,-35],[65,-19],[60,-11],[52,-17]],'#B6C5D8',3);
  if(mood==='sad'){ln([[-41,26],[-48,35]],3,'#9297A3');ln([[41,26],[48,35]],3,'#9297A3');}
  if(glasses){box(-43,-22,40,35,7,'transparent',4);box(5,-22,40,35,7,'transparent',4);ln([[-3,-6],[5,-6]],4);ln([[-48,-10],[-43,-8]],4);}
}
function headA(kind,mood){
  const b=kind==='bai';
  if(b){shape(ell(-60,5,10,17),{fill:SK,lw:5});p([[-40,-69],[17,-78],[52,-50],[58,29],[29,72],[-18,75],[-52,44],[-56,-26]],SK);tuft(-6,-74);}
  else{
    p([[-62,47],[-75,-21],[-49,-76],[10,-91],[62,-55],[68,27],[48,54]],INK);
    p([[-40,-50],[19,-61],[56,-31],[54,34],[16,70],[-28,62],[-52,22]],SK);
    p([[-58,-10],[-45,-60],[6,-76],[52,-56],[60,-20],[15,-41],[-3,-23],[-16,-45]],INK,4);
    tuft(-8,-86,true);ln([[30,-55],[52,-46]],9,BLUE);
  }
  features({kind,mood,w:b?.93:.96});
}
function headB(kind,mood){
  const b=kind==='bai';
  if(b){
    shape(ell(-68,5,13,18),{fill:SK,lw:5});shape(ell(68,5,13,18),{fill:SK,lw:5});
    p([[-56,-61],[8,-77],[61,-43],[67,26],[45,66],[-29,72],[-62,40]],SK);
    p([[-56,-34],[-65,-53],[-43,-79],[10,-85],[53,-65],[64,-41],[35,-56],[2,-59],[-30,-44]],'#7D7C81',4);
    ln([[-39,-56],[-25,-62]],3,WHITE);ln([[41,-52],[51,-45]],3,WHITE);
  }else{
    p([[-75,38],[-79,-30],[-44,-78],[13,-91],[67,-60],[77,17],[58,60],[-56,61]],INK);
    p([[-52,-37],[-8,-63],[44,-53],[61,-12],[50,45],[10,74],[-37,61],[-57,17]],SK);
    p([[-58,-8],[-55,-47],[-19,-72],[41,-66],[65,-30],[28,-35],[9,-49],[-12,-25]],INK,4);
    shape(ell(68,-48,26,31),{fill:INK,lw:5});tuft(46,-70,true);
  }
  features({kind,mood,w:b?.88:1,glasses:b});
}
function headC(kind,mood){
  const b=kind==='bai';
  if(b){
    shape(ell(-57,3,11,16),{fill:SK,lw:4});
    p([[-47,-57],[-9,-77],[37,-64],[58,-27],[51,36],[15,77],[-21,67],[-49,26]],SK);
    p([[-52,-6],[-60,-47],[-30,-85],[25,-86],[61,-55],[50,-27],[9,-56],[-20,-35]],INK,4);
    ln([[3,-71],[28,-64]],3,'#67636C');
  }else{
    p([[-65,54],[-69,-25],[-40,-78],[14,-86],[57,-58],[70,5],[44,55]],INK);
    shape(ell(65,-22,29,50),{fill:INK,lw:5});
    p([[-48,-39],[-13,-64],[41,-55],[56,-9],[40,49],[8,70],[-33,56],[-54,14]],SK);
    p([[-54,-12],[-46,-56],[-8,-77],[45,-64],[61,-30],[12,-48],[-21,-16]],INK,4);
    tuft(7,-78,true);
  }
  features({kind,mood,w:b?.9:.93});
}
function headD(kind,mood){
  const b=kind==='bai';
  if(b){
    box(-55,-75,112,156,28,SK,7);shape(ell(-61,8,9,15),{fill:SK,lw:4});
    ln([[-14,-78],[-18,-103],[-2,-116],[13,-107]],7);
    fillOnly(rect(40,-55,13,105),SHADE,{boil:0});
  }else{
    p([[-79,42],[-88,-22],[-58,-78],[24,-86],[82,-44],[86,40],[41,63],[-49,62]],INK,7);
    p([[-48,-38],[27,-49],[65,-9],[53,49],[13,77],[-40,60],[-61,14]],SK,7);
    p([[-66,-3],[-48,-61],[-9,-75],[61,-47],[55,-18],[6,-38],[-22,-20]],INK,4);
    ln(spline([[-5,-85],[-18,-113],[-1,-133],[23,-130],[31,-110],[10,-94]],false),11);
  }
  features({kind,mood,w:1,style:'geo'});
}
const HEADS={A:headA,B:headB,C:headC,D:headD};
function legs(height,width,col=BLACK,wide=false){
  for(const side of [-1,1]){
    const x=side*(width*.25);
    if(wide)p([[x-width*.22,-height],[x+width*.2,-height],[x+width*.23,-26],[x-width*.22,-26]],col,5);
    else shape(noodle([x,-height],[x+side*4,-26],side*3,width*.34,width*.26),{fill:col,lw:5});
    push();translate(x-6,0);scale(.67);shoe(0,0,col,col===INK?WHITE:null);pop();
  }
}
function bodyA(kind){
  const b=kind==='bai';
  if(b){
    legs(216,112,GREY);
    p([[-41,-376],[-76,-345],[-81,-177],[76,-177],[73,-345],[36,-376]],BLACK);
    p([[-38,-381],[38,-381],[50,-346],[-49,-346]],BLACK,5);scarf(0,-374,91,92);logo(-25,-278,18);
    ln([[-53,-220],[-46,-197],[44,-197],[50,-220]],4,'#646168');
  }else{
    legs(177,120,BLACK);
    p([[-40,-300],[-69,-277],[-76,-167],[71,-167],[65,-277],[34,-300]],WHITE);
    // 裁剪条纹，避免横线穿出上衣。
    shape(spline([[-40,-300],[-69,-277],[-76,-167],[71,-167],[65,-277],[34,-300]]),{fill:null,lw:0,stroke:false,shade:()=>{for(let y=-279;y<-170;y+=29)fillOnly(rect(-90,y,190,10),INK);}});
    box(-21,-196,42,8,2,INK,2);
  }
}
function bodyB(kind){
  const b=kind==='bai';
  if(b){
    legs(163,137,BLACK,true);
    p([[-56,-328],[-89,-292],[-96,-140],[94,-140],[87,-292],[50,-328]],GREY);
    p([[-31,-324],[-8,-258],[6,-158],[35,-324]],BLACK,4);ln([[0,-256],[0,-145]],4);
    for(const y of [-219,-181])dot(10,y,3.5);box(-65,-208,43,43,6,'#B8B7BA',4);
    shortScarf(0,-325);
  }else{
    legs(151,137,BLACK,true);
    p([[-45,-305],[-80,-270],[-85,-138],[80,-138],[77,-270],[40,-305]],WHITE);
    p([[-24,-302],[-7,-245],[18,-302]],BLACK,4);ln([[0,-247],[0,-143]],4);for(const y of [-223,-191,-158])dot(9,y,3);
    box(-67,-214,45,37,3,'#D0CED2',4);
  }
}
function bodyC(kind){
  const b=kind==='bai';
  if(b){
    legs(233,103,BLACK);
    p([[-38,-388],[-73,-354],[-72,-186],[69,-186],[69,-354],[35,-388]],BLACK);
    p([[-26,-381],[-2,-312],[26,-381]],GREY,3);ln([[-34,-370],[-43,-328],[-17,-296],[-34,-187]],4,'#706C75');
    ln([[35,-369],[44,-328],[20,-302],[38,-189]],4,'#706C75');headphones(0,-379);
  }else{
    legs(208,128,GREY,true);
    p([[-39,-344],[-74,-314],[-74,-193],[73,-193],[72,-315],[39,-344]],WHITE);
    p([[-29,-345],[-47,-305],[-5,-279],[44,-307],[26,-345]],WHITE,4);ln([[-5,-279],[-4,-194]],4);
    // 斜挎带与卡片让职场身份在远景仍能读到。
    ln([[-39,-330],[58,-201]],11,BLACK);box(24,-227,56,53,7,BLACK,5);logo(50,-201,12);
    ln([[-44,-334],[-27,-250],[-9,-330]],5,BLUE);box(-43,-255,34,46,3,WHITE,3);fillOnly(rect(-40,-251,28,9),BLUE);ln([[-36,-232],[-17,-232]],3,GREY);
  }
}
function bodyD(kind){
  const b=kind==='bai';
  if(b){
    legs(207,96,INK);
    box(-65,-353,131,193,18,BLACK,7);box(-21,-375,42,34,8,SK,5);neckerchief(0,-358);logo(-22,-255,19);
  }else{
    legs(113,135,INK,true);
    p([[-47,-292],[-86,-249],[-102,-119],[101,-119],[86,-249],[44,-292]],WHITE,7);
    shape(spline([[-47,-292],[-86,-249],[-102,-119],[101,-119],[86,-249],[44,-292]]),{stroke:false,shade:()=>{for(const y of [-251,-207,-163])fillOnly(rect(-115,y,230,21),INK);}});
    push();translate(-48,-268);rotate(-.3);box(-10,-14,20,28,3,BLUE,4);ln([[-3,-7],[-3,5]],3,WHITE);pop();
  }
}
const BODY={A:bodyA,B:bodyB,C:bodyC,D:bodyD};
const CENTERS={A:{bai:-473,wen:-385},B:{bai:-421,wen:-390},C:{bai:-475,wen:-431},D:{bai:-454,wen:-378}};
const RIG={
  A:{bai:{sh:[-345,-338],width:59,sleeve:BLACK,arm:33},wen:{sh:[-277,-270],width:55,sleeve:SK,arm:27}},
  B:{bai:{sh:[-294,-289],width:77,sleeve:GREY,arm:40},wen:{sh:[-269,-263],width:65,sleeve:WHITE,arm:31}},
  C:{bai:{sh:[-351,-347],width:59,sleeve:BLACK,arm:31},wen:{sh:[-313,-306],width:60,sleeve:WHITE,arm:30}},
  D:{bai:{sh:[-326,-323],width:52,sleeve:BLACK,arm:28},wen:{sh:[-261,-247],width:75,sleeve:SK,arm:30}},
};
function gestureHand(x,y,gesture,size=1){
  push();translate(x,y);scale(size);
  shape(ell(0,0,13,13),{fill:SK,lw:4});
  if(gesture==='point'){ln([[3,-4],[31,-13]],8,SK);ln([[3,-8],[30,-17],[36,-12]],4);ln([[-5,5],[8,8],[14,3]],3);}
  if(gesture==='palm'){
    p([[-12,2],[-17,-8],[-13,-15],[-6,-11],[-5,-31],[2,-34],[6,-11],[9,-30],[16,-29],[16,-8],[21,-22],[27,-19],[24,6],[11,17],[-6,15]],SK,4);
    ln([[1,-7],[1,9]],2.5,'#A5A1A4');
  }
  if(gesture==='up'){ln([[-11,-2],[-26,-6]],7,SK);ln([[-24,-10],[-7,-4],[12,-3],[24,-9]],4);}
  if(gesture==='fist'){ln([[-8,-6],[9,-6]],3);ln([[-7,0],[9,0]],3);}
  pop();
}
function armPlan(id,kind,pose){
  const rig=RIG[id][kind],hy=CENTERS[id][kind],l=[-rig.width,rig.sh[0]],r=[rig.width,rig.sh[1]];
  const a={from:l,to:[l[0]-22,l[1]+133],bend:-12,hand:'rest'},b={from:r,to:[r[0]+22,r[1]+133],bend:12,hand:'rest'};
  if(pose==='explain'){b.to=[r[0]+91,r[1]+30];b.bend=35;b.hand='up';}
  if(pose==='point'){b.to=[r[0]+127,r[1]-65];b.bend=-38;b.hand='point';}
  if(pose==='shrug'){a.to=[l[0]-88,l[1]-8];a.bend=-35;a.hand='up';b.to=[r[0]+88,r[1]-8];b.bend=35;b.hand='up';}
  if(pose==='cross'){a.to=[42,l[1]+75];a.bend=58;a.hand='fist';b.to=[-42,r[1]+90];b.bend=-48;b.hand='fist';}
  if(pose==='think'){b.to=[16,hy+72];b.bend=72;b.hand='fist';}
  if(pose==='facepalm'){b.to=[5,hy-19];b.bend=86;b.hand='palm';}
  if(pose==='stop'){b.to=[r[0]+100,r[1]-76];b.bend=18;b.hand='palm';}
  return [a,b];
}
function drawArm(id,kind,part){
  const rig=RIG[id][kind];shape(noodle(part.from,part.to,part.bend,rig.arm,rig.arm*.83),{fill:rig.sleeve,lw:5});
  sleeveMark(id,kind,part);
  gestureHand(...part.to,part.hand,rig.arm/32);
}
function sleeveMark(id,kind,part){
  if(id!=='B'||kind!=='wen')return;
  const rig=RIG[id][kind],a=part.from,b=part.to,t=.34,u=1-t;
  const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
  const c=[(a[0]+b[0])/2-dy/len*part.bend,(a[1]+b[1])/2+dx/len*part.bend];
  const x=u*u*a[0]+2*u*t*c[0]+t*t*b[0],y=u*u*a[1]+2*u*t*c[1]+t*t*b[1];
  const angle=Math.atan2(u*(c[1]-a[1])+t*(b[1]-c[1]),u*(c[0]-a[0])+t*(b[0]-c[0]));
  push();translate(x,y);rotate(angle);box(-7,-rig.arm*.46,14,rig.arm*.92,3,'#53657D',3);pop();
}
function props(id,kind,pose,plan){
  if(kind!=='bai'||pose!=='explain')return;
  const [x,y]=plan[1].to;
  if(id==='B'){box(x-18,y-30,37,38,6,WHITE,4);stroke(ell(x+24,y-12,9,10),4);ln([[x-12,y-23],[x+12,y-23]],3,'#B2B0B5');}
  if(id==='C'){box(x-14,y-33,30,48,5,INK,4);ln([[x-7,y-26],[x+9,y-26]],3,WHITE);}
}
export const STYLES=[
  {id:'A',title:'街头快嘴',tag:'长围巾 × 蓝发夹',note:'A1 长围巾配卫衣；A2 蓝发夹配细条纹。',detail:'窄长脸与斜刘海；适合快节奏互怼。'},
  {id:'B',title:'市井搭档',tag:'格纹短围脖 × 挽袖蓝边',note:'B1 方框眼镜与格纹短围脖；B2 挽袖蓝边与衬衫。',detail:'更宽的脸与身形；适合日常观察和人情世故。'},
  {id:'C',title:'都市打工人',tag:'挂颈耳机 × 蓝绳工牌',note:'C1 挂颈耳机与外套；C2 蓝绳工牌与斜挎包。',detail:'剪裁与长腿比例更克制；适合职场和生活压力话题。'},
  {id:'D',title:'几何怪咖',tag:'三角领巾 × 斜方胸针',note:'D1 三角领巾与长方脸；D2 斜方胸针与宽条纹。',detail:'加粗轮廓、减少细节；适合夸张表演与表情包。'},
];
export function actor({id,kind,x,y,s=1,face=1,mood='roast',pose='explain'}){
  const plan=armPlan(id,kind,pose),late=pose==='facepalm'||pose==='think';
  push();translate(x,y);scale(s*face,s);
  if(pose==='shrug')rotate(kind==='bai'?-.035:.035);
  // 垂下的手臂在躯干之后，表演手势在躯干之前；扶额和托腮最后画，接触面部。
  for(const part of plan)if(part.hand==='rest')drawArm(id,kind,part);
  BODY[id](kind);
  // 垂手袖口仍需出现在躯干轮廓前，便于远景识别。
  for(const part of plan)if(part.hand==='rest')sleeveMark(id,kind,part);
  for(const part of plan)if(part.hand!=='rest'&&!late)drawArm(id,kind,part);
  push();translate(0,CENTERS[id][kind]);rotate(pose==='think'?-.1:pose==='facepalm'?.09:kind==='bai'?.025:-.045);HEADS[id](kind,mood);pop();
  if(late)for(const part of plan)if(part.hand!=='rest')drawArm(id,kind,part);
  props(id,kind,pose,plan);pop();
}
export function portrait({id,kind,x,y,s=1,mood='roast'}){push();translate(x,y);scale(s);HEADS[id](kind,mood);pop();}
