import {INK,g,push,pop,translate,rotate,scale,shape,fillOnly,stroke,ell,rr,rect,text,reset,getM} from './toon.js';
import {laobai,xiaowen,ARMS,C} from './chars.js';
const paper='#FFF5D8',yellow='#FFD83E',red='#FF594E';
let bounds=[];
const tx=(s,x,y,n=46,col=INK,align='left',serif=false)=>{
 const font=`900 ${n}px "${serif?'Noto Serif SC':'Noto Sans SC'}"`;g.save();g.font=font;g.textAlign=align;g.textBaseline='middle';const m=g.measureText(s),M=getM();
 const x0=x-m.actualBoundingBoxLeft,x1=x+m.actualBoundingBoxRight,y0=y-m.actualBoundingBoxAscent,y1=y+m.actualBoundingBoxDescent;
 const pts=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([a,b])=>[M[0]*a+M[2]*b+M[4],M[1]*a+M[3]*b+M[5]]);
 bounds.push({text:s,x:Math.min(...pts.map(p=>p[0])),y:Math.min(...pts.map(p=>p[1])),right:Math.max(...pts.map(p=>p[0])),bottom:Math.max(...pts.map(p=>p[1]))});g.restore();
 text(s,x,y,{font,fill:col,align});
};
const box=(x,y,w,h,col,r=12,lw=6)=>shape(rr(x,y,w,h,r),{fill:col,lw});
function ticket(x,y,s,a){push();translate(x,y);rotate(a);scale(s);box(-155,-95,310,190,paper,10,6);stroke([[78,-92],[78,92]],4);tx('电影票',-125,-56,28);tx('¥100',-125,8,65);tx('已使用',92,-20,22);tx('不退 / 不转卖',-125,67,24,red);pop();}
function base(w,h){reset();g.setTransform(1,0,0,1,0,0);g.fillStyle=yellow;g.fillRect(0,0,w,h);fillOnly([[w*.61,-50],[w+80,100],[w+80,h+80],[w*.38,h+80],[w*.78,h*.53]],red,{boil:0});stroke([[36,36],[w-36,36],[w-36,h-36],[36,h-36],[36,36]],3);tx('BAIDONG / 白洞 08',78,88,26);}
export function renderCover(w,h,{size='16x9'}={}){
 bounds=[];base(w,h);const wide=w>h,ratio=w/h;
 if(wide){const big=ratio>1.6,fs=big?132:102,x=big?110:90,y=big?250:220;
 tx('钱都花了',x,y,fs,INK,'left',true);tx('还要硬撑？',x,y+fs*1.2,fs,C.BLUE,'left',true);
 tx('沉没成本',x,h-142,big?51:45);tx('走或留，钱都不退',x,h-84,31);
 const ls=big?1.55:1.3,lx=big?1330:1045,ly=big?1400:1410;
 laobai({x:lx,y:ly,s:ls,face:-1,expr:'speechless',E:{bl:.8,br:.8,look:[.6,.3]},armF:ARMS.laobai.up});
 xiaowen({x:big?1670:1265,y:big?1430:1420,s:big?2:1.75,face:-1,expr:'defiant',armF:ARMS.xiaowen.open,lean:-.04});
 ticket(big?1045:750,big?713:735,big?1.6:1.25,-.17);
 box(big?1490:1060,big?263:415,big?305:250,80,paper,16,5);tx('走不走？',big?1640:1185,big?305:455,big?45:37,INK,'center');
 }else{
 const tall=h/w>1.6,y=tall?310:230,fs=126;
 tx('钱都花了',90,y,fs,INK,'left',true);tx('还要硬撑？',90,y+158,fs,C.BLUE,'left',true);
 const ls=tall?1.7:1.45,ly=tall?2070:1740;
 laobai({x:415,y:ly,s:ls,face:1,expr:'speechless',E:{bl:.8,br:.8,look:[.6,.3]},armF:ARMS.laobai.up});
 xiaowen({x:815,y:tall?2050:1700,s:tall?2.15:1.8,face:-1,expr:'defiant',armF:ARMS.xiaowen.open});
 ticket(tall?315:330,tall?1370:1100,tall?1.15:1.05,-.18);
 box(72,tall?590:490,595,85,paper,13,5);tx('走或留，钱都不退',370,tall?633:533,38,INK,'center');
 box(60,h-171,440,113,paper,10,4);tx('沉没成本',82,h-129,45);tx('每期看懂一个机制',82,h-84,27);
 }
 window.COVER_INFO={w,h,text:bounds};
}
export function renderClipFrame(w,h,{question='都排半小时了，现在走多亏！'}={}){
 base(w,h);tx('都排半小时了',80,300,96,INK,'left',true);tx('现在走多亏？',80,426,96,C.BLUE,'left',true);
 box(70,515,w-140,80,paper,12,4);tx('沉没成本，也可以是时间',w/2,555,37,INK,'center');
 reset();g.fillStyle=INK;g.fillRect(0,645,w,630);
 box(70,1345,w-140,270,paper,18,5);tx('继续可以，放弃也可以',w/2,1410,49,INK,'center');tx('看接下来值不值得',w/2,1500,54,C.BLUE,'center');
 tx('每期看懂一个机制',w/2,1750,42,INK,'center');tx('白洞 / 完整版见本期横版',w/2,1825,30,INK,'center');
}
