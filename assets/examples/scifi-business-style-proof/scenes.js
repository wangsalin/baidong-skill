// 风格修订样段：同一店内空间的问答、指账与物件特写。横竖使用独立机位。
import {W,H,g,INK,push,pop,translate,rotate,scale,shape,fillOnly,stroke,ell,spline,rr,rect,text,reset} from './toon.js';
import {adaptCaptions} from './captions.js';
import {CAPTION_TIMES} from './caption-times.js';
const C={wall:'#A6C1B1',shade:'#86A594',deep:'#35594F',cream:'#F5E6C2',wood:'#CC805B',woodDark:'#975E4C',teal:'#407E76',paper:'#FFF8E3',red:'#AA3F37',orange:'#F2B558'};
const box=(x,y,w,h,col,r=9,lw=5)=>shape(rr(x,y,w,h,r),{fill:col,lw});
const poly=(p,c,lw=5)=>shape(p,{fill:c,lw});
const line=(p,lw=4,c=INK)=>stroke(p,lw,{line:c});
const label=(s,x,y,size=26,col=INK,align='center')=>text(s,x,y,{font:`900 ${size}px "Noto Sans SC"`,fill:col,align});
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,u)=>a+(b-a)*u;
function mug(x,y,col){box(x,y,45,48,col,6,4);stroke(ell(x+49,y+23,12,15),4);line([[x+8,y+8],[x+33,y+8]],3,'#FFF8E3');}
function backShop(t){
 fillOnly(rect(-3000,-2000,7000,4500),C.wall,{boil:0});
 // 同一个墙角、吊灯和货架，在人物近景中继续保持空间关系。
 poly([[1570,-800],[3000,-800],[3000,1250],[1570,1010]],C.shade,0);
 for(let x=-1000;x<2600;x+=190)line([[x,-900],[x+3,900]],1.5,'#88A99A');
 fillOnly([[300,-100],[1350,-100],[1160,680],[450,680]],'#B8CDB8',{boil:0});
 box(765,206,505,205,C.deep,14,6);label('小店账本',1017,263,46,C.paper);
 line([[820,310],[1212,310]],3,'#9CB9A3');label('忙起来 ≠ 赚到了',1017,360,29,'#C7D8B5');
 // 复古终端与货架：物件有顶面、侧面与硬边阴影。
 box(215,410,300,268,'#C4C9BA',17);poly([[457,413],[515,413],[515,678],[457,678]],'#909C91',0);
 box(247,442,216,115,C.deep,12);label('READY',352,493,30,'#D5ED9F');
 for(const [x,c] of [[274,C.orange],[316,C.red],[358,C.wall]])shape(ell(x,592,12,12),{fill:c,lw:4});
 box(266,630,185,25,'#7E8D82',3,3);mug(329,570,C.cream);
 box(1450,414,405,22,C.wood,3,4);box(1450,607,405,22,C.wood,3,4);
 for(const [i,c] of [[0,C.orange],[1,C.teal],[2,C.paper],[3,C.red]]){
   box(1480+i*80,326-(i%2)*23,52,86+(i%2)*23,c,6,4);box(1485+i*80,313-(i%2)*23,42,15,C.deep,3,3);
 }
 for(let i=0;i<4;i++)mug(1485+i*80,548,i%2?C.cream:C.teal);
 line([[637,-400],[637,120]],7);poly([[565,161],[597,115],[679,115],[711,161]],C.orange);fillOnly(rect(572,162,132,15),'#9F6C3D',{boil:0});
 box(-300,681,2600,88,'#5D7566',0,5);line([[-300,706],[2300,706]],4,'#B5C9AB');
 fillOnly(rect(-2500,769,6000,1800),'#53796B',{boil:0});
}
function counter(){
 // 前景收银台遮住腿；人物、手和账单不再各占一个说明分区。
 poly([[-500,731],[2410,731],[2730,1090],[-800,1090]],C.wood,7);
 poly([[1500,732],[2410,732],[2730,1090],[1690,1090]],'#B16D51',0);
 line([[-300,808],[2400,808]],2,'#B96E50');line([[-400,1001],[2500,1001]],2,'#AD684E');
 box(-800,1090,3600,1000,C.teal,0,7);
 fillOnly(rect(-800,1095,3600,45),'#285C59',{boil:0});
 for(let x=-600;x<2400;x+=290)line([[x,1170],[x,1600]],3,'#2E655F');
 // 台面左侧的同一台核销机，在特写仍有局部入画。
 poly([[405,763],[619,763],[662,909],[391,909]],'#636B68');
 box(422,652,181,130,'#AAB7AA',13,6);box(443,672,140,75,C.deep,7,4);label('核销',513,710,24,'#D2E9A1');
 line([[449,805],[596,805]],6,C.deep);
 mug(1390,777,C.cream);
}
function receipt(t,T){
 push();translate(1015,865);rotate(-.045);
 poly([[-159,-121],[178,-121],[184,241],[-149,241]],'#965D49',0);
 const edge=[[-170,-135],[165,-135],[165,222]];
 for(let x=165;x>=-170;x-=17)edge.push([x,222+(Math.round((165-x)/17)%2?9:0)]);
 edge.push([-170,222]);poly(edge,C.paper,5);
 box(-48,-146,97,19,'#6D7770',4,3);
 label('教学假设',0,-103,24,C.red);line([[-143,-78],[139,-78]],2,'#A9A18B');
 label('每个团购新客',-137,-46,23,INK,'left');label('已扣随单成本',-137,-13,20,'#676658','left');
 if(t>=T.cost+4.8){label('首单',-137,39,25,INK,'left');label('−5 元',131,38,42,C.red,'right');}
 else line([[-137,42],[136,42]],3,'#C2B89A');
 line([[-141,76],[140,76]],2,'#C1B89D');
 if(t>=T.scale+.55)label('100人 × 5元',0,107,29);
 if(t>=T.scale+1.7)label('先亏 500 元',0,177,42,C.red);
 pop();
}
export const createScenes=ctx=>makeScenes(ctx,false);
export function makeScenes({cam,drawRole,T,present},portrait=false){
 const ax=portrait?820:735,cx=portrait?1160:1280;
 const sayEnd=T.settle;
 const rise=(t,a,b)=>ease((t-a)/(b-a));
 function actors(t,tq,{point=false}={}){
   const ask=rise(tq,.28,.65)*(1-rise(tq,2.15,2.65));
   const aim=point?rise(tq,T.answer+3.35,T.answer+3.9)*(1-rise(tq,sayEnd-.2,sayEnd+.35)):0;
   const think=t>=T.cost?1:rise(tq,T.answer+3.4,T.answer+3.85);
   drawRole('A2',t,{x:ax,y:1025,s:1.4,face:1,pose:'explain',celShade:true,headTilt:mix(-.08,.015,ask)-.04*think,
     armF:{h:[mix(28,111,ask),mix(125,6,ask)],bend:mix(8,35,ask)},
     E:{lid:t<T.answer?.1:.42,look:[mix(.8,.5,think),mix(-.1,.9,think)],m:{sm:t<T.answer?-.2:-.25}}});
   drawRole('C1',t,{x:cx,y:1050,s:1.3,face:-1,pose:'point',celShade:true,headTilt:mix(.015,-.07,aim),
     armF:{h:[mix(22,portrait?60:125,aim),mix(133,80,aim)],bend:mix(12,31,aim)},
     armB:{h:[-18,127],bend:-10},E:{lid:t<T.answer?.57:.22,look:[.75,mix(.05,.8,aim)],m:{sm:-.15}}});
 }
 function stamp(){
   reset();box(portrait?60:39,portrait?112:36,portrait?215:180,portrait?98:84,C.paper,9,3);
   text('白洞',portrait?82:60,portrait?143:65,{font:`900 ${portrait?30:27}px "Noto Sans SC"`,align:'left'});
   text('画面修订样段',portrait?82:60,portrait?182:101,{font:`900 ${portrait?23:20}px "Noto Sans SC"`,align:'left',fill:'#35594F'});
 }
 function stage(t,tq,view,point=false){
   adaptCaptions(CAPTION_TIMES,portrait);
   if(view==='two')cam(portrait?995:1005,portrait?630:565,portrait?1.7:1.47);
   if(view==='ask')cam(portrait?855:795,portrait?570:540,portrait?2.15:2.08);
   if(view==='answer')cam(portrait?1125:1235,portrait?560:493,portrait?2.15:2.08);
   if(view==='insert')cam(1015,portrait?900:935,portrait?2.35:2.4+rise(t,T.cost+1.15,T.scale+2)*.1);
   backShop(t);
   if(view!=='insert')actors(t,tq,{point});
   counter();receipt(t,T);
   if(view==='insert')present({mode:'insert',speaker:'C1',subject:'店内收银台上的首单教学假设账单'});
   stamp();
 }
 const cut1=1.23,cut2=T.answer+3.35,cut3=T.cost+1.15;
 let registered=false;
 const wrap=fn=>(t,tq)=>{
   if(!registered&&window.CAST_BOUNDARIES){window.CAST_BOUNDARIES.push(cut1,cut2,cut3);registered=true;}
   fn(t,tq);
 };
 return {
   question:wrap((t,tq)=>stage(t,tq,t<cut1?'two':'ask')),
   answer:wrap((t,tq)=>stage(t,tq,t<cut2?'answer':'two',true)),
   cost:wrap((t,tq)=>stage(t,tq,t<cut3?'two':'insert',true)),
   scale:wrap((t,tq)=>stage(t,tq,'insert')),
   settle:wrap((t,tq)=>stage(t,tq,'two',true))
 };
}
