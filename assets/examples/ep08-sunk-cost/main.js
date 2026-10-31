import {clamp,lerp,seg,ss,hash} from '/core/lib.js';
import {W,H,INK,g,init,frame,reset,push,pop,translate,rotate,scale,shape,fillOnly,stroke,ell,arc,spline,rr,rect,dot,text,screenRect} from './toon.js';
import {laobai,xiaowen,extra,POSES,ARMS,C,hand} from './chars.js';
import {cam,ringWipe,subs,buildSubs,opener,endCard} from './brand.js';
import {buildTimeline} from './timeline.js';
import {NO,QUESTION,COMMENT_Q,NEXT,COVER,BEATS} from './story.js';
import {renderCover,renderClipFrame} from './cover.js';
const QS=new URLSearchParams(location.search), MODE=QS.get('mode')||'film';
const cv=document.getElementById('c');
if(MODE!=='film'){cv.width=innerWidth;cv.height=innerHeight;} init(cv);
const J=async f=>{const r=await fetch(f);if(!r.ok)throw Error(`Missing ${f}`);return r.json();};
const LINES=await J('lines.json'),DURS=await J('voices/dur.json'),LIPS=await J('voices/lips.json');
const LINE=Object.fromEntries(LINES.map(l=>[l.id,l]));
const vdur=id=>{if(!(DURS[id]>0))throw Error(`No voice duration: ${id}`);return DURS[id];};
const TL=buildTimeline(BEATS,vdur),{DUR,VO,SHOTS,WIPES,TAGS,CUES,SEGS,T,FX,CUTS,shotAt}=TL;
const q=t=>Math.floor(t*12+1e-6)/12;
const pal={purple:'#56388F',dark:'#241B40',red:'#FF594E',yellow:'#FFD83E',mint:'#54D9BC',paper:'#FFF5D8',blue:'#273F9C',grey:'#A9A8B2'};
const label=(s,x,y,size=34,fill=INK,align='center')=>text(s,x,y,{font:`900 ${size}px "Noto Sans SC"`,fill,align});
const box=(x,y,w,h,c,r=18,lw=6)=>shape(rr(x,y,w,h,r),{fill:c,lw});
const ease=(t,a,b)=>ss(seg(t,a,b));
function talk(who,t){const tq=q(t);for(const [id,t0] of Object.entries(VO)){if(LINE[id].who!==who)continue;if(tq>=t0&&tq<t0+vdur(id)){const k=Math.floor((tq-t0)*24),lp=LIPS[id],o=lp?.o[k]??0,b=lp?.b[k]??.5;return{o,w:.8+.45*b-.2*o,talking:true};}}return{o:0,w:1,talking:false};}
const blink=(t,seed)=>{const k=Math.floor(t*12),c=Math.floor(k/36);return hash(c*7.1+seed)>.3&&k%36<2;};
const LB=(t,o={})=>({x:1220,y:945,s:.94,face:-1,t,talk:talk('LAOBAI',t),blink:blink(t,3),expr:'calm',headTilt:0,...o});
const XW=(t,o={})=>({x:760,y:945,s:1.42,face:1,t,talk:talk('XIAOWEN',t),blink:blink(t,9),expr:'calm',headTilt:0,...o});
const active=t=>Object.entries(VO).find(([id,t0])=>t>=t0&&t<t0+vdur(id));
function gesture(t,who,kind='explain'){
 const a=active(q(t)),base=who==='LAOBAI'?ARMS.laobai.rest:ARMS.xiaowen.rest;
 if(!a||LINE[a[0]].who!==who)return base;
 const d=vdur(a[0]),u=q(t)-a[1],v=ss(seg(u,0,.28))*(1-ss(seg(u,d-.35,d)));
 const target=who==='LAOBAI'?ARMS.laobai[kind]||ARMS.laobai.explain:ARMS.xiaowen[kind]||ARMS.xiaowen.open;
 return{h:base.h.map((x,i)=>lerp(x,target.h[i],v)),bend:lerp(base.bend,target.bend,v)};
}
function heldPoint(P,who,arm='armF'){
 const a=P[arm]||(who==='L'?ARMS.laobai.rest:ARMS.xiaowen.rest),sh=who==='L'?(arm==='armF'?[60,-452]:[-62,-452]):(arm==='armF'?[58,-236]:[-58,-236]);
 let x=sh[0]+a.h[0],y=sh[1]+a.h[1];const angle=P.lean||0;
 [x,y]=[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
 return[P.x+x*P.s*P.face,P.y+(P.bob||0)+y*P.s*(P.sq||1)];
}
function ticket(x,y,s=1,a=0,used=true){push();translate(x,y);rotate(a);scale(s);box(-105,-58,210,116,pal.yellow,7,5);stroke([[40,-56],[40,56]],3);label('电影票',-25,-25,23);label('¥100',-26,16,40);label(used?'已使用':'入场券',73,0,17);if(used)stroke([[-90,43],[22,43]],4,{line:pal.red});pop();}
function receipt(P,who='L',s=.48,a=-.1,arm='armF'){const[x,y]=heldPoint(P,who,arm);ticket(x,y,s,a);dot(x-8,y+8,who==='L'?11:13,C.SK);}
function bolt(x,y){dot(x,y,6,pal.grey);stroke([[x-3,y-3],[x+3,y+3]],2);}
function cinema(t,{empty=false}={}){
 fillOnly(rect(-2200,-1600,6400,3600),pal.purple,{boil:0});fillOnly(rect(-2200,690,6400,2000),pal.dark,{boil:0});
 box(220,80,1410,425,'#15172C',12,9);box(250,105,1350,370,'#B5C3DF',4,4);
 fillOnly([[255,465],[520,250],[760,430],[1060,200],[1595,465]],'#8691BD');
 const ux=940+Math.sin(t*.35)*80,uy=240+Math.sin(t*.7)*14;
 shape(ell(ux,uy,110,28),{fill:pal.mint,lw:5});shape(ell(ux,uy-25,48,32),{fill:'#D3ECE5',lw:5});label('《宇宙里的石头 Ⅷ》',925,410,31,'#38416A');
 for(const side of[0,1]){const x=side?1640:-80;box(x,-200,350,930,pal.red,0,6);for(let k=0;k<5;k++)stroke([[x+40+k*60,-100],[x+30+k*62,700]],5,{line:'#B82D4B'});}
 box(18,350,185,280,'#233E3C',7,5);box(33,360,155,48,pal.mint,0,3);label('出口 ←',112,385,26);stroke([[55,440],[155,440],[155,585],[55,585],[55,440]],5,{line:'#AAD9C7'});dot(139,520,7,pal.yellow);
 for(let i=0;i<8;i++){const x=240+i*200;box(x,570,145,200,'#B42D4C',28,5);box(x+9,593,127,25,'#D23F5A',12,3);}
 fillOnly(rect(-100,780,2150,210),pal.dark,{boil:0});
 if(!empty)for(const x of[340,1580]){shape(ell(x,603,43,51),{fill:'#46355E',lw:5});box(x-60,650,120,120,'#46355E',25,4);}
 for(let k=0;k<5;k++)fillOnly(rect(180+k*330,895,130,12),pal.yellow,{boil:0});
}
function two(t,{l={},x={},lticket=true}={}){const xp=XW(t,{armF:gesture(t,'XIAOWEN'),...x}),lp=LB(t,{armF:gesture(t,'LAOBAI'),...l});xiaowen(xp);laobai(lp);if(lticket)receipt(lp);return{lp,xp};}
function appliance(x,y,t,s=1){
 push();translate(x,y);scale(s);box(-190,-180,380,350,pal.yellow,24,8);fillOnly([[-190,-180],[190,-180],[165,-145],[-190,-145]],'#F5AB2A');
 box(-157,-144,314,205,'#1C4F4F',12,5);label('选择模拟器',0,-105,31,pal.mint);label('旧账不重算',0,-39,27,'#EFF8D9');
 for(let i=0;i<5;i++)stroke([[-127,-1+i*8],[80+(i%2)*35,-1+i*8]],3,{line:'#559B85'});
 box(-150,86,145,44,pal.mint,7,4);box(12,86,135,44,pal.red,7,4);label('现在走',-78,108,23);label('继续看',80,108,23);
 for(const p of[[-170,-160],[170,-160],[-170,146],[170,146]])bolt(...p);
 stroke([[190,8],[222,25],[210,80],[244,105]],7);dot(245,106,10,pal.mint);
 fillOnly([[72,-180],[120,-180],[133,-154],[84,-151]],'#E7DEB0');stroke([[88,-176],[118,-157]],3,{line:'#8E875E'});pop();
}
function terminalBg(t){fillOnly(rect(-2000,-1200,6000,3600),'#174C53',{boil:0});for(let i=-2;i<13;i++){stroke([[i*200,0],[i*200,1100]],2,{line:'#2C6568',boil:0});stroke([[0,i*160],[1920,i*160]],2,{line:'#2C6568',boil:0});}box(80,140,1760,735,pal.paper,24,8);label('选择模拟器',165,100,34,pal.mint,'left');label('情景演绎 / 假设对比',1740,100,26,'#D0EBDE','right');}
function clock(x,y,r,t,col=pal.yellow){shape(ell(x,y,r,r),{fill:col,lw:6});stroke([[x,y-r*.55],[x,y],[x+r*.48,y+r*.15]],7);const a=q(t)*.7;stroke([[x,y],[x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65]],3,{line:'#73574E'});for(let k=0;k<4;k++)dot(x+Math.cos(k*Math.PI/2)*r*.8,y+Math.sin(k*Math.PI/2)*r*.8,4);}
function pathCard(x,y,{left=true,t}){
 const w=790;box(x,y,w,530,left?'#D1F2DE':'#FFD6BC',18,5);box(x+20,y+20,w-40,68,left?pal.mint:pal.red,10,4);label(left?'现在走':'继续看',x+w/2,y+54,48);
 ticket(x+120,y+178,.74);label('已花 ¥100',x+460,y+156,45);label('不能退 · 不能转卖',x+455,y+210,29,'#63564E');stroke([[x+35,y+268],[x+w-35,y+268]],3,{line:'#9A9C8E'});
 clock(x+115,y+356,51,t,left?pal.mint:pal.yellow);label('接下来 1 小时',x+430,y+323,34);label(left?'去吃饭 / 做别的':'继续看这部电影',x+430,y+390,42);label(left?'时间改用在哪里？':'还想看？还是只舍不得钱？',x+w/2,y+482,27);
}
function food(t,{called=false}={}){
 fillOnly(rect(-2000,-1500,6000,3700),pal.paper,{boil:0});fillOnly(rect(-2000,700,6000,1800),'#E6D3A9',{boil:0});
 box(1070,85,910,610,pal.mint,6,7);box(1090,110,780,135,pal.red,0,5);label('宇宙小吃 · 热乎出锅',1480,177,43,pal.paper);
 for(let i=0;i<8;i++)box(1080+i*110,250,110,85,i%2?pal.paper:pal.red,0,4);
 box(1140,365,510,210,'#243F3E',16,6);label(called?'请 A018 取餐':'预计还需',1395,418,36,pal.paper);label(called?'到你啦！':'5 分钟',1395,499,60,pal.yellow);
 box(1070,665,900,92,'#C55C43',6,6);for(let i=0;i<4;i++)shape(ell(1175+i*170,649,55,22),{fill:pal.yellow,lw:4});
 box(105,140,690,110,pal.yellow,0,5);label('再等一下，马上就好',450,195,46);
 for(let i=0;i<4;i++){const px=80+i*140,py=620+i*30;extra({x:px,y:py,s:.59,face:1,coat:i%2?pal.purple:'#A16F57',coatS:'#78556A',expr:'calm',t});}
 for(const x of[245,560,950]){stroke([[x,715],[x,905]],8);shape(ell(x,706,18,18),{fill:pal.red,lw:5});shape(ell(x,906,47,12),{fill:'#806D59',lw:4});}stroke(spline([[245,720],[400,750],[560,720],[760,750],[950,720]],false),12,{line:pal.red});
}
function queueTwo(t,o={}){return two(t,{lticket:false,l:{x:850,y:975,s:.86,...o.l},x:{x:1230,y:975,s:1.36,face:-1,...o.x}});}
const SH={};
SH.grab=(t,tq)=>{cam(990,540,1.06);cinema(t);const reach=ease(t,0,.6),recoil=ease(t,VO.n02+.1,VO.n02+.6);const xp=XW(t,{x:760-34*reach+16*recoil,lean:-.08,expr:'defiant',headTilt:-.08+recoil*.16,armF:ARMS.xiaowen.fist,armB:{h:[-6,50],bend:-15}});xiaowen(xp);const lp=LB(t,{expr:'seeThrough',E:{bl:-.7,br:-.4,look:[.65,.2]},armF:{h:[lerp(40,390,reach),lerp(170,96,reach)],bend:-12},armB:{h:[-20,-20],bend:-30}});laobai(lp);receipt(lp,'L',.5,-.18,'armB');};
SH.xchallenge=(t,tq)=>{cam(800,506,1.63);cinema(t);xiaowen(XW(t,{expr:'defiant',E:{look:[.7,-.2]},armF:gesture(t,'XIAOWEN','open'),lean:-.025,headTilt:-.04}));};
SH.lreaction=(t,tq)=>{cam(1205,425,1.95);cinema(t);const a=ease(t,T.stuck,T.stuck+.65);const lp=LB(t,{expr:'speechless',E:{look:[-.5,lerp(0,.7,a)],lid:.6,m:{w:.6,sm:-.4}},headTilt:lerp(0,.08,a),armF:{h:[80,-40],bend:30}});laobai(lp);receipt(lp);reset();label('退不了。',1500,715,50,pal.yellow);};
SH.ticket=(t,tq)=>{cam(960,540,1);cinema(t);const lp=LB(t,{x:1420,y:1050,s:1.2,expr:'think',armF:{h:[300,-90],bend:38}});laobai(lp);ticket(650,450,3,-.035);dot(988,400,15,C.SK);label('你想“看回来”的钱',650,180,52,pal.paper);box(340,705,620,88,pal.red,12,5);label('走或留，钱都不退',650,750,42);};
SH.definition=(t,tq)=>{cam(960,540,1);cinema(t);const lp=LB(t,{x:1470,expr:'explain',armF:gesture(t,'LAOBAI','point')});laobai(lp);receipt(lp);xiaowen(XW(t,{x:420,s:1.15,y:960,expr:'ask',armF:gesture(t,'XIAOWEN')}));reset();box(560,170,740,590,pal.yellow,22,7);label('沉没成本',930,271,87);stroke([[620,344],[1240,344]],4);label('已经付出',930,424,58);label('现在怎么选',930,510,49);label('都收不回来',930,605,65,pal.blue);label('不是“继续投”的动作，是那笔旧代价',930,704,25);};
SH.scan=(t,tq)=>{cam(960,540,1);cinema(t);const u=ease(t,T.scan+.1,T.scan+.85);appliance(960,580,t,.92);const lp=LB(t,{x:1430,expr:'think',armF:{h:[lerp(20,275,u),lerp(150,-30,u)],bend:20}});laobai(lp);receipt(lp,'L',.48,0);xiaowen(XW(t,{x:430,y:950,s:1.3,expr:'ask',armF:{h:[lerp(15,294,u),lerp(96,28,u)],bend:-20}}));reset();box(600,135,715,94,pal.paper,12,4);label('扫描票据：不能退、不能转卖',960,181,35);const scan=ease(t,T.scan+1,T.scan+2);stroke([[790,lerp(440,620,scan)],[1120,lerp(440,620,scan)]],4,{line:pal.red});};
SH.paths=(t,tq)=>{cam(960,540,1);terminalBg(t);pathCard(140,245,{left:true,t});pathCard(990,245,{left:false,t});label('相同的旧花费',960,198,41);if(t>T.paths+.25){stroke([[820,415],[1100,415]],5,{line:pal.blue});box(875,377,170,75,pal.blue,10,4);label('相同',960,415,34,pal.paper);}const x=lerp(350,450,ease(t,T.paths,T.paths+1.2));xiaowen(XW(t,{x,y:869,s:.47,face:-1,walk:tq,armF:ARMS.xiaowen.rest}));};
SH.lconfess=(t,tq)=>{cam(1215,430,1.8);cinema(t);const u=ease(t,T.confess,T.confess+1.1);const lp=LB(t,{expr:'speechless',E:{look:[lerp(.4,-.65,u),.65],lid:.7,bl:.4,br:.5},headTilt:.08,armF:{h:[85,-40],bend:55}});laobai(lp);receipt(lp);reset();label(t>=VO.n21?'不想认。':'……',1510,675,51,pal.yellow);};
SH.release=(t,tq)=>{cam(1080,530,1.19);cinema(t);const u=ease(t,T.release+.1,T.release+.9);const lp=LB(t,{x:1250,expr:'think',armF:{h:[lerp(85,25,u),lerp(-40,172,u)],bend:lerp(55,10,u)},E:{look:[.3,.3]}});laobai(lp);receipt(lp,'L',.49,lerp(-.1,.2,u));xiaowen(XW(t,{x:720,expr:'ask',armF:gesture(t,'XIAOWEN')}));reset();label('之前的花费',570,225,43,pal.yellow);label('后面的时间',1370,225,43,pal.mint);};
SH.trap=(t,tq)=>{cam(960,540,1);terminalBg(t);label('为了不心疼这一笔……',960,208,45);ticket(480,420,1.55,-.05);box(220,565,520,126,'#E7E2D0',14,5);label('已花 ¥100',480,609,48);label('现在无法收回',480,656,28);stroke([[770,430],[1010,430]],9,{line:pal.red});fillOnly([[1010,430],[965,401],[965,459]],pal.red);clock(1325,420,105,t,pal.red);label('再搭 1 小时？',1325,610,60);label('这是接下来新增的代价',1325,685,31);box(190,750,1540,72,pal.yellow,10,4);label('旧投入收不回来，不等于新投入就值得',960,788,39);};
SH.future=(t,tq)=>{cam(960,540,1);terminalBg(t);label('有沉没成本 ≠ 必须放弃',960,207,53);box(165,285,720,420,'#FFD6BC',16,5);box(1030,285,720,420,'#D1F2DE',16,5);clock(525,393,63,t,pal.yellow);label('还要付出什么？',525,534,52);label('时间、钱、精力……',525,625,33);shape(ell(1390,396,74,68),{fill:pal.mint,lw:6});stroke([[1355,394],[1380,419],[1430,365]],10);label('继续能得到什么？',1390,534,50);label('是否还想看，是否值得等',1390,625,30);label('只比较从现在开始的新增投入和收获',960,784,41);};
SH.choice=(t,tq)=>{cam(980,535,1.02);cinema(t);two(t,{l:{expr:'explain',armF:gesture(t,'LAOBAI')},x:{expr:'aha',armF:gesture(t,'XIAOWEN','raise')}});reset();box(530,150,865,127,pal.yellow,14,5);label(t>=VO.n37?'如果只剩“钱都花了”……':'留下，因为接下来还想看',960,215,45);};
SH.exit=(t,tq)=>{cam(780,540,1);cinema(t,{empty:true});const u=ease(t,T.exit+.1,T.exit+vdur('n38')+.5);xiaowen(XW(t,{x:lerp(740,40,u),face:-1,walk:tq,armF:ARMS.xiaowen.rest,expr:'happy',lean:.04}));laobai(LB(t,{x:lerp(1210,520,u),face:-1,walk:tq,expr:'smile',armF:ARMS.laobai.rest}));};
SH.queue=(t,tq)=>{cam(980,540,1);food(t);queueTwo(t,{x:{expr:'sad',headTilt:.1,armF:ARMS.xiaowen.droop},l:{expr:'think',armF:gesture(t,'LAOBAI')}});reset();box(110,310,475,95,pal.paper,12,5);label('已经排了 30 分钟',347,357,36);};
SH.xqueue=(t,tq)=>{cam(1220,535,1.7);food(t);const u=ease(t,T.insist,T.insist+.3);xiaowen(XW(t,{x:1230,y:975,s:1.36,face:-1,expr:'defiant',lean:lerp(0,-.08,u),armF:ARMS.xiaowen.fist,armB:ARMS.xiaowen.fistB,headTilt:-.08}));reset();box(120,210,640,145,pal.red,10,5);label('都排半小时了！',440,283,62,pal.paper);};
SH.qreaction=(t,tq)=>{cam(1110,545,1.27);food(t);const u=ease(t,T.qreaction+.2,T.qreaction+.9);queueTwo(t,{x:{expr:'shocked',E:{lid:lerp(0,.4,u),look:[.9,0],m:{w:.55,sm:-.4}},armF:{h:[lerp(40,14,u),lerp(-30,96,u)],bend:10},headTilt:.06},l:{expr:'seeThrough',armF:ARMS.laobai.crossF,armB:ARMS.laobai.crossB,headTilt:-.07}});reset();label('这句耳熟吗？',525,265,50,pal.blue);};
SH.queueExplain=(t,tq)=>{cam(1040,545,1.03);food(t);queueTwo(t,{x:{expr:'ask',armF:gesture(t,'XIAOWEN')},l:{expr:'explain',armF:gesture(t,'LAOBAI','explain')}});reset();box(100,290,525,245,pal.yellow,16,5);clock(190,407,49,t);label('已经排掉 30 分钟',425,377,30);label('走不走，都回不来',425,451,28);};
SH.readwait=(t,tq)=>{cam(1360,485,1.26);food(t);const u=ease(t,T.readwait,T.readwait+.65);xiaowen(XW(t,{x:1015,y:930,s:1.2,face:1,expr:'ask',E:{look:[.8,-.5]},armF:{h:[lerp(14,180,u),lerp(96,-90,u)],bend:-15},headTilt:-.07}));reset();box(200,155,1300,110,pal.yellow,14,5);label('现在要看的：还需多久 + 我还想不想吃',850,210,41);};
SH.decide=(t,tq)=>{cam(1060,550,1.03);food(t);queueTwo(t,{x:{expr:'happy',armF:gesture(t,'XIAOWEN','open')},l:{expr:'smile',armF:gesture(t,'LAOBAI')}});reset();box(100,300,540,270,pal.yellow,14,6);label('再等 5 分钟，我接受',370,382,37);label('而且我确实想吃',370,476,40,pal.blue);};
SH.takeaway=(t,tq)=>{cam(1050,550,1);food(t);queueTwo(t,{x:{expr:'aha',armF:gesture(t,'XIAOWEN','open')},l:{expr:'explain',armF:gesture(t,'LAOBAI')}});reset();box(100,280,540,300,pal.yellow,18,6);label('继续可以',370,354,58);label('放弃也可以',370,445,58);label('理由：接下来值不值得',370,530,31,pal.blue);};
SH.pickup=(t,tq)=>{cam(1130,550,1.08);food(t,{called:true});const u=ease(t,T.pickup+.2,T.pickup+1);const xp=XW(t,{x:1225,y:975,s:1.36,face:-1,expr:'happy',armF:{h:[lerp(14,75,u),lerp(96,-25,u)],bend:20}});xiaowen(xp);const[hx,hy]=heldPoint(xp,'X');box(hx-95,hy-68,150,95,pal.paper,4,4);label('A018',hx-20,hy-22,32);dot(hx+25,hy+6,15,C.SK);laobai(LB(t,{x:950,y:975,s:.86,face:1,expr:'smile',armF:gesture(t,'LAOBAI')}));reset();box(90,300,540,300,pal.yellow,15,5);label('从现在开始',360,374,55);label('继续做，还值得吗？',360,478,39,pal.blue);};
SH.finaltwo=(t,tq)=>{cam(1010,545,1.04);food(t,{called:true});queueTwo(t,{x:{expr:'happy',face:1,view:'front',armF:gesture(t,'XIAOWEN','open')},l:{expr:'smile',face:1,view:'front',armF:gesture(t,'LAOBAI','explain')}});reset();box(90,285,560,195,pal.yellow,18,6);label('你也有过这种时候吗？',370,350,38);label('评论区，说说那一笔',370,422,33,pal.blue);};
const SUBS=buildSubs(VO,LINE,vdur,CUTS);
for(let i=0;i<SUBS.length;i++){const s=SUBS[i],next=SUBS[i+1];if(next)s.t1=Math.min(s.t1,next.t0-.015);s.t1=Math.min(s.t1,s.t0+vdur(s.id)+.2);const cut=CUTS.find(c=>c>s.t0);if(cut)s.t1=Math.min(s.t1,cut-.01);}
function slug(t){const[,,,world]=shotAt(t);reset();box(58,43,world==='simulation'?440:390,55,pal.paper,9,3);label(`白洞 08 / ${world==='food'?'宇宙小吃':world==='simulation'?'选择模拟器':'宇宙影院'}`,82,71,25,INK,'left');label(world==='simulation'?'情景演绎 · 假设对比':'情景演绎',1835,70,23,world==='food'?INK:pal.paper,'right');}
function render(t){frame(t);reset();screenRect(pal.paper);const[,,name]=shotAt(t);if(name==='opener')opener(t,T.opener,1.6,NO,'沉没成本，到底是什么？');else if(name==='end')endCard(t,T.end,3,{COMMENT_Q:'哪一次，你因为“都花了”继续硬撑？',NEXT:''});else{if(!SH[name])throw Error(`Unknown shot ${name}`);SH[name](t,q(t));slug(t);}ringWipe(t,WIPES);if(QS.get('subs')!=='0')subs(t,SUBS);}
function events(){const ev=[],add=(type,t,o={})=>ev.push({type,t:+t.toFixed(3),...o});for(const[id,t0]of Object.entries(VO))add('vo',t0,{id,who:LINE[id].who});for(const c of CUES)add('cue',c.t0,{name:c.name,t0:c.t0,t1:c.t1});for(const s of SEGS)add('seg',s.t,{k:s.k,title:s.title});let cur=null;for(const[a,b,,w]of SHOTS){if(cur&&cur.w===w)cur.b=b;else{if(cur)add('amb',cur.a,{w:cur.w,d:+(cur.b-cur.a).toFixed(3)});cur={a,b,w};}}if(cur)add('amb',cur.a,{w:cur.w,d:+(cur.b-cur.a).toFixed(3)});for(const tc of WIPES)add('wipe',tc-.16);for(const f of FX)add(f.name,f.t);return ev.sort((a,b)=>a.t-b.t);}
if(MODE==='cover'){window.render=()=>renderCover(cv.width,cv.height,{...COVER,size:QS.get('size')||'16x9',no:NO});window.DUR=1;}else if(MODE==='clipframe'){window.render=()=>renderClipFrame(cv.width,cv.height,{question:QS.get('question')||QUESTION,no:NO,bg:COVER.bg,pop:COVER.pop});window.DUR=1;}else{window.render=render;window.DUR=DUR;window.EV=events();window.SUBS=SUBS;window.SEGS=SEGS;window.TL=TL;}
await document.fonts.ready;for(const f of['900 52px "Noto Sans SC"','900 60px "Noto Serif SC"','400 30px "Noto Serif SC"'])await document.fonts.load(f);window.render(parseFloat(QS.get('t')??'1'));window.READY=true;
