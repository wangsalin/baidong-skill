export const NO=8;
export const QUESTION='都花这么多了，现在放弃多亏啊！';
export const COMMENT_Q='你为哪笔回不来的投入，继续过一件不想做的事？';
export const NEXT='';
export const COVER={title:'钱都花了 / 还要硬撑？',hl:'硬撑',bg:'#FFD83E',pop:'#FF594E',laobai:'speechless',xiaowen:'defiant'};
const say=(...ids)=>ids.map(i=>({line:`n${String(i).padStart(2,'0')}`}));
export const BEATS=[
 {shot:'grab',world:'cinema',seg:'s1',segTitle:'一百块，你说走就走？',cue:'tension',mark:'grab',tag:'影院中途 · 情景演绎',fx:['paper',.35]},
 ...say(1,2,3),
 {shot:'xchallenge'},...say(4),
 {shot:'lreaction',mark:'stuck',cue:'silence'},{pause:.35},...say(5),{pause:.45},
 {shot:'xchallenge'},...say(6),
 {opener:1.6,fx:'opener'},
 {shot:'ticket',world:'cinema',seg:'s2',segTitle:'走或留，票钱都拿不回来',cue:'think',tag:'票已使用 · 不能退转',mark:'ticket'},...say(7,8,9),
 {shot:'definition',mark:'definition',fx:'beep'},...say(10,11,12,13),
 {shot:'scan',mark:'scan',cue:'theme',fx:['click',.6]},...say(14,15),
 {shot:'paths',world:'simulation',seg:'s3',segTitle:'两种选择，一笔共同的旧花费',cue:'theme',tag:'选择模拟器 · 假设对比',mark:'paths',fx:'beep'},...say(16,17),
 {shot:'xchallenge',world:'cinema',tag:'影院中途 · 情景演绎'},...say(18),
 {shot:'lconfess',mark:'confess',cue:'silence'},{pause:.5},...say(19),
 {shot:'xchallenge'},...say(20),
 {shot:'lconfess'},...say(21),{pause:.7},
 {shot:'release',mark:'release',cue:'think',fx:['paper',.45]},...say(22,23,24),
 {shot:'trap',world:'simulation',seg:'s4',segTitle:'别让旧花费，再扣一小时',cue:'tension',tag:'继续投入 · 假设对比',mark:'trap'},...say(25,26,27,28,29),
 {shot:'xchallenge',world:'cinema',tag:'影院中途 · 情景演绎'},...say(30),
 {shot:'future',world:'simulation',cue:'resolve',tag:'现在能选的 · 未来成本与收获',mark:'future',fx:'click'},...say(31,32,33,34),
 {shot:'choice',world:'cinema',tag:'影院中途 · 情景演绎',mark:'choice'},...say(35,36,37),
 {shot:'exit',mark:'exit',fx:['step',.3]},...say(38),{pause:.5},
 {wipe:true,shot:'queue',world:'food',seg:'s5',segTitle:'轮到小问：都排半小时了！',cue:'theme',tag:'小吃店门口 · 情景演绎',mark:'queue'},...say(39,40),
 {shot:'xqueue',mark:'insist',fx:'thud'},...say(41),
 {shot:'qreaction',cue:'silence',mark:'qreaction'},{pause:.7},...say(42),
 {shot:'queueExplain',cue:'think'},...say(43,44,45),
 {shot:'readwait',mark:'readwait',fx:['beep',.45]},...say(46,47,48),
 {shot:'decide',cue:'resolve',mark:'decide'},...say(49,50,51),
 {shot:'takeaway',seg:'s6',segTitle:'继续或放弃，看接下来值不值得',mark:'takeaway',fx:'ding'},...say(52,53,54,55,56),
 {shot:'pickup',mark:'pickup',fx:['beep',.35]},...say(57,58,59),
 {shot:'finaltwo',mark:'finaltwo'},...say(60,61,62),
 {end:3,cue:'end',fx:'end'}
];
