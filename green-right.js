// ============================================================
// green-right.js — 项目：绿灯右转（路线、关卡、判定、渲染循环）
// ============================================================
// 右转路线：一条平滑的曲线（三次贝塞尔）：从最右车道出发，经虚线段切入，直接进入横向路的最右车道
const bz=t=>{const u=1-t,P=[[6.25,-30],[6.25,-14],[8,-6.25],[16,-6.25]];return[0,1].map(k=>u*u*u*P[0][k]+3*u*u*t*P[1][k]+3*u*t*t*P[2][k]+t*t*t*P[3][k])};
const myPts=[[6.25,-110],[6.25,-30],...Array.from({length:40},(_,i)=>bz((i+1)/40)),[70,-6.25]];
const myLen=myPts.reduce((a,p,i)=>i?a+Math.hypot(p[0]-myPts[i-1][0],p[1]-myPts[i-1][1]):0,0);
const pathN=path(myPts);
// 让自行车时的路线：停车线以前完全不碰自行车道虚线，过了停车线再转（转弯半径稍大）
const bzK=t=>{const u=1-t,P=[[6.25,-16.5],[6.25,-8],[9,-6.25],[17,-6.25]];return[0,1].map(k=>u*u*u*P[0][k]+3*u*u*t*P[1][k]+3*u*t*t*P[2][k]+t*t*t*P[3][k])};
const pathK=path([[6.25,-110],[6.25,-16.5],...Array.from({length:40},(_,i)=>bzK((i+1)/40)),[70,-6.25]]);let MP=pathN;
const myPath=u=>MP(u);      // 平时走原路线（在虚线末端借用一点虚线转弯）；事先发现了右后方的自行车，就换成不碰虚线的路线
let cs=0,ce=0;for(let i=1;i<=41;i++){ce+=Math.hypot(myPts[i][0]-myPts[i-1][0],myPts[i][1]-myPts[i-1][1]);if(i===1)cs=ce}
const vOf=u=>7-2.8*ss(cs-18,cs+6,u)+2.8*ss(ce-6,ce+14,u);
// ================= 游戏逻辑（第一步）=================
const AB=5,U0=60,UEND=ce+14;      // U0：平时从停车线前约 30 米出发
const mine=car(C[0]);
let uS=0;for(let u=0;u<myLen;u+=.05){if(myPath(u)[1]>=-19.3){uS=u;break}}   // 停车位置（停车线前）
// 对面车流、同向车流、横向等红灯的车（只作场景，不参与判定）
const flows=[];const addFlow=(p,v,off,col)=>flows.push({c:car(col),p:path(p),v,off});
[0,90,190].forEach((o,i)=>addFlow([[-6.25,140],[-6.25,-140]],9,o,C[[2,5,1][i]]));
[0,150].forEach((o,i)=>addFlow([[2.75,-140],[2.75,140]],12,o,C[[3,4][i]]));
[[-19.5,-2.75],[-26,-2.75],[-33,-2.75]].forEach((a,i)=>addFlow([[a[0],a[1]],[a[0]+.001,a[1]]],0,0,[C[2],C[4],C[6]][i]));
[[19.5,2.75],[19.5,6.25],[26,6.25]].forEach((a,i)=>addFlow([[a[0],a[1]],[a[0]-.001,a[1]]],0,0,[C[1],C[3],C[5]][i]));
// 行人：A 从对面（路口前方）走来过街；B 从后方来、直行过街；C 从后方来、在路口右转走开
const PP={A:[[13.95,70],[13.95,-50]],B:[[12.55,-70],[12.55,50]],C:[[13.25,-70],[13.25,-13.25],[110,-13.25]],D:[[13.25,70],[13.25,13.25],[110,13.25]]},PE={A:59.5,B:59.5,C:56.75,D:56.75},PPATH={},PLEN={};
for(const k in PP){PPATH[k]=path(PP[k]);PLEN[k]=PP[k].reduce((a,p,i)=>i?a+Math.hypot(p[0]-PP[k][i-1][0],p[1]-PP[k][i-1][1]):0,0)}
// 自行车：S 在自行车道直行；R 沿路缘右转（半径 6.75，贴着路缘弧）
const BP={S:[[8.75,-130],[8.75,150]],R:[[8.75,-130],[8.75,-15.5],...Array.from({length:24},(_,i)=>{const a=Math.PI-(i+1)/24*Math.PI/2;return[15.5+6.75*Math.cos(a),-15.5+6.75*Math.sin(a)]}),[150,-8.75]]},BPATH={},BLEN={};
for(const k in BP){BPATH[k]=path(BP[k]);BLEN[k]=BP[k].reduce((a,p,i)=>i?a+Math.hypot(p[0]-BP[k][i-1][0],p[1]-BP[k][i-1][1]):0,0)}
// 行人/自行车的速度分段：sg=[{t,v,f}]，v<0 表示往回走，f=true 表示身体朝回走方向
const pedD=(p,t)=>{if(p.dd!=null)return p.dd;let d=0;const g=p.sg;for(let i=0;i<g.length;i++){const a=g[i].t,b=i+1<g.length?g[i+1].t:1e9;if(t<=a)break;d+=g[i].v*(Math.min(t,b)-a)}return d};
const pedSeg=(p,t)=>{let c=p.sg[0];for(const g of p.sg)if(t>=g.t)c=g;return c};
const pedPos=(p,t)=>p.path(Math.min(p.off+pedD(p,t),p.len-.06));
function pedZone(p,t){if(p.wait||p.blk)return 0;      // 被你的车挡在后面的自行车不算冲突
const q=pedPos(p,t),z=q[1];                       // 0 无冲突 1 即将进入 2 冲突
 if(p.k==='A')return GR.zone(z,'far');
 if(p.k==='B')return GR.zone(z,'near');
 if(p.k==='S')return z>-40&&z<-8?2:0;
 return 0}
// 对面左转车
const LP=40;   // 左转车先从对面车道驶来 40 米（越过它的停车线后停在路口里）
const EL=(ze)=>{const pts=[[-2.75,5+LP],[-2.75,5]];for(let i=1;i<=24;i++){const f=i/24*Math.PI/2;pts.push([-2.75+9*(1-Math.cos(f)),5-(5-ze)*Math.sin(f)])}pts.push([70,ze]);return pts};
let R=null,round=0,playing=false,gt=0,view=1,yawD=0,az=2.4,el=.85,drag=false,lx=0,ly=0;
const live=[];
let LASTF={},HIST=[],R0={},MODE='free',DIFF='easy',EX=null;
// 每个路口的情况：简单＝一种；困难＝2–3 种可同时出现的（后方行人／对面行人／自行车／左转车），或单独的黄灯、警车
function pickList(){for(let n=0;n<60;n++){const L=pick1(),sg=L.slice().sort().join('+');if(EX?!EX.used.includes(sg):!HIST.includes(sg)){if(EX)EX.used.push(sg);else{HIST.push(sg);if(HIST.length>4)HIST.shift()}return L}}return pick1()}   // 模拟考中 5 个路口不重复
// 每个路口抽一种：行人和自行车（合成一种，成员随机）／对面左转车待转（一半是不闪灯的警车）／黄灯／警车鸣笛
function pedSet(nbMax){const P=a=>a[Math.random()*a.length|0],L=[],q=Math.random(),nb=q<.15?0:q<.55?1:q<.85?2:3;      // 后方行人 0–3 个＋对面行人＋自行车，至少一样
 if(nb>0)L.push(P(['1a','1a','1c']));if(nb>1)L.push('1m');if(nb>2)L.push('1n');
 if(Math.random()<.45)L.push(P(['2a','2a','2c']));
 if(Math.random()<.35||!L.length)L.push('3a');return L}
// 简单：每个路口一种（行人和自行车／黄灯／警车）；困难：行人、警车、左转车、黄灯里 2–4 种叠在一起
function pick1(){const hard=MODE==='g'||(MODE==='free'&&DIFF==='hard'),r=Math.random(),P=a=>a[Math.random()*a.length|0];
 if(!hard){if(r<.08)return['6'];if(r<.38)return[P(['5a','5b','5c','5e'])];return pedSet()}
 const n=2+(Math.random()*3|0),K=['P','E','L','Y'].sort(()=>Math.random()-.5).slice(0,n);
 if(K.includes('E')&&K.includes('Y'))K.splice(K.indexOf(Math.random()<.5?'E':'Y'),1);   // 黄灯局不加警车（变红后就成了红灯右转）
 if(K.includes('E')&&!K.includes('P'))K.push('P');                       // 警车要在你停车等行人时出现
 const L=[];if(K.includes('P'))L.push(...pedSet());
 if(K.includes('Y'))L.push(K.includes('P')?P(['5a','5b']):P(['5a','5b','5e']));
 if(K.includes('L')&&!K.includes('Y'))L.push('4a');                                          // 黄灯本来就带一辆待转左转车
 if(K.includes('E'))L.push('E');
 return L}
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;const d=Math.min(1,Math.max(0,(round-1)/2));
 // 本局关卡：1a 后方直行 1b 后方右转 1c 后方突然跑 2a 对面直行 2b 对面左转 2c 对面突然跑
 const LIST=R0.forceCS?(R0.forceCS==='1d'?['1a','1m']:R0.forceCS.split('+')):pickList();if(!R0.forceCS&&'123'.includes(LIST[0][0])&&!LIST.some(c=>c==='4a'||c[0]==='5')&&Math.random()<.4)LIST.push('4a');   // 常有对面左转车在路口里等（不抢行）
 const CS=LIST.find(c=>'56'.includes(c[0]))||LIST[0],peds=[];
 if(LIST.includes('3a')){const k='S',o=cyclist(PCOL[Math.random()*5|0]);live.push(o);
  peds.push({k,o,sg:[{t:0,v:3.8},{t:2.5,v:k==='S'?5.5:4.2}],off:83,path:BPATH[k],len:BLEN[k],bike:true})}   // 开局在你前方约 3 米，你很快超过它，它之后在你右边追上来
 let TB=5.5+Math.random()*3.5,nB=0,spT=null;const allow=v=>!spT&&LASTF.sp!==v;      // 特殊动作（跑起来／中途回头）每局最多一个，也不和上一局相同
 LIST.filter(c=>'12'.includes(c[0])||c==='5e').forEach(CS=>{[-1].forEach(j=>{const k={'1a':'B','1b':'C','1c':'B','1m':'B','1n':'B','2a':'A','2b':'D','2c':'A','5e':'B'}[CS],sudden=CS==='1c'||CS==='2c',Ta=CS==='5e'?9.5+Math.random()*.4:k==='B'?(nB?(TB+=2+Math.random()*4):TB):k==='A'?3+Math.random()*5:(k==='D'?5+Math.random()*5:5.5+Math.random()*3.5);   // 时间设得一定会和你的转弯冲突；后面的行人隔 2–6 秒跟上
  // 随机变化：正常走 / 走着走着跑起来 / 走到一半回头
  const r=Math.random();let va=(j>=0||CS==='5e')?'walk':sudden?'run':(r<.62?'walk':r<.9?'run':'back');if(va!=='walk'){if(allow(va))spT=va;else va='walk'}let v0=j>=0?1.3:1.2+Math.random()*.3,sg;   // 1d：两个从后方来的行人，前一个快走过一半时，后一个正要过街
  if(va==='walk')sg=[{t:0,v:v0}];
  else if(va==='run'){const tc=Math.random()<.6?Math.max(.5,Ta-1.5-Math.random()*2):Ta+.6+Math.random()*2.5;v0=.8+Math.random()*.3;sg=[{t:0,v:v0},{t:tc,v:2.8+Math.random()*.8}]}
  else{const tb=(4+Math.random()*4)/v0,t1=Ta+tb,t2=t1+.5+Math.random()*.5,vb=v0*1.15,t3=t2+(v0*tb+4.5)/vb;
   sg=[{t:0,v:v0},{t:t1,v:0},{t:t2,v:-vb,f:true},{t:t3,v:0}]}      // 停一下→转身往回走→回到路边站住
  const o=ped(PCOL[Math.random()*5|0]);live.push(o);
  let pth=PPATH[k];if(k==='B'){const x=12.55+[0,.5,-.45][nB%3];pth=path([[x,-70],[x,50]]);nB++}      // 几个后方行人各走人行横道的一边，不会重叠
  const pp={k,o,sg,va,off:0,path:pth,len:PLEN[k]};pp.off=PE[k]-pedD(pp,Ta);peds.push(pp)})});
  if(CS==='5b'||CS==='5a'||CS==='5e')[[[-15.5,-13.8],[13.25,-13.8],[13.25,-60]]].forEach((pt,i)=>{const o=ped(PCOL[Math.random()*5|0]);live.push(o);
  o.visible=false;peds.push({k:'X',o,sg:[{t:0,v:0}],dd:0,vw:1.6,go:false,hide:true,off:0,path:path(pt),len:60})});      // 横向变绿灯时，从左边远处走来过马路的行人（之前不出现，免得玩家猜到要变灯）
 const r2=Math.random();let lc=null;
 if(LIST.includes('4a')||CS[0]==='5'){const type='wait';
  const ze=type==='cut'&&Math.random()<.25?-6.25:-2.75,pts=EL(ze);let La=0;for(let i=1;i<=25;i++)La+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  const isP=CS==='4a'&&!LASTF.cru&&Math.random()<.5,lcar=isP?car(0x101114):car(C[Math.random()*9|0]);if(isP){const L=polDeco(lcar);L.rd.visible=L.bu.visible=false}     // 迷惑项：待转的是警车，但没闪灯鸣笛
  lc={type,ze,path:path(pts),La,uStop:La+3,car:lcar,isP,u:LP,v:0,state:'idle',d0:.3+Math.random()*.7};
  if(CS[0]==='5')lc.l5=true;else if(type==='wait'){lc.u=0;lc.v=7;lc.state='app';lc.ta=tArr()-tApp()+(Math.random()-.5);while(lc.ta<0){lc.u+=vApp(lc.u)*.02;lc.ta+=.02}}live.push(lc.car);for(let u=La;u<La+30;u+=.05){if(lc.path(u)[0]>=9){lc.uStop=u;break}}
  }
 const U1=CS[0]==='5'&&'abc'.includes(CS[1])?U0-20:U0;      // 黄灯局多开 20 米，留出行人灯闪烁→红手→变黄的时间
 R={cs:CS,list:LIST,allR:2,yT:-1,yD:2+Math.random()*2,fl:false,emg:(LIST.includes('E')||(!LASTF.E&&'123'.includes(LIST[0][0])&&LIST.some(c=>c[0]==='1'||c[0]==='2')&&MODE==='free'&&DIFF==='easy'&&Math.random()<.22))?(LIST.includes('4a')||Math.random()<.5?'Lw':'O'):null,polsOld:[],scT:-1,pol:null,light:'green',t:0,u:U1,v:vOf(U1),mode:'turn',committed:false,over:false,peds,lc,ev:[],idle:0,dl:false,lookT:-1,yaw:0,stopT:0,stopA:AB,stopped:false,pit:0,sig:false,sigChk:false,chk:false,chkT:0};
 if(lc){const q=lc.path(0);place(lc.car,q[0],q[1],q[2])}
 if(CS==='5d'){const lcar=car(C[1+Math.random()*8|0]);live.push(lcar);lcar.userData.bl.forEach(m=>m.position.x=-m.position.x);R.ld={car:lcar,u:U0+12,v:vOf(U0+12),st:'go',sT:0}}   // 5d：你前面还有一辆右转车（打着右转灯）
 {const fc=car(C[Math.random()*9|0]);live.push(fc);R.fol={car:fc,u:R.u-16,v:R.v}}      // 后车：一直跟在你后面
 sirenOff();if(CS==='6')R.pol=makePolice('L');setPedSig('M','walk');setPedSig('X','hand');
 if(CS[0]==='5'&&CS!=='5e'){let uy=R.u;for(let u=R.u;u<myLen;u+=.05){const w=myPath(u);if(CS==='5a'?w[1]+2.35>=-17-R.yD:CS==='5b'?w[1]>=-17.8:w[1]>-8.5){uy=u;break}}R.uY=uy}   // 变黄的位置
 {const f=flows[1];if(!f.c0){f.c0=f.c;CRU=car(0x101114);const L=polDeco(CRU);L.rd.visible=L.bu.visible=false}const pc=CS!=='6'&&Math.random()<.5;f.c=pc?CRU:f.c0;(pc?f.c0:CRU).position.y=-50}
 MP=pathN;
 LASTF={sp:spT,E:!!R.emg,cru:!!(lc&&lc.isP),six:CS==='6'};
 gt=0;flows.forEach(f=>{f.s=null;f.cv=null});setLight('g');setCross('r');$('exl').textContent=EX?(MODE==='g'?'模拟考 G':'模拟考 G2')+' · 第 '+(EX.i+1)+'/'+EX.n+' 个路口':'';mk();$('sp').textContent='0'}
function mk(){const md=R.mode==='slow'?'look':R.mode;document.querySelectorAll('.b').forEach(b=>b.classList.toggle('on',b.dataset.m==='sig'?!!R.sig:b.dataset.m===md))}
function flash(t){const f=$('fl');f.textContent=t;f.style.opacity=1;clearTimeout(flash.h);flash.h=setTimeout(()=>f.style.opacity=0,1800)}
function toast(t){const b=$('bn');b.textContent=t;setTimeout(()=>b.textContent={green:'绿灯右转',yellow:'黄灯！',red:'红灯'}[R.light],1500)}
// 违规／危险提示：当场闪现，游戏继续；结束后汇总成卡片
const TXT=Object.assign({
 cut:["对面左转车抢行","对面的左转车在你进入路口的同时启动了。它通常转入左侧车道，你转入右侧车道，两车会肩并肩同时进入路口，这是应避免的危险时刻。错在抢行的它，但你看到它启动后，只有确认能错开进入路口才可以继续，否则要先停车让它先转。"],
 delay:["延误交通","路口明确没有冲突，你停着不走，后方车辆鸣笛了。看清之后应马上行驶：等右转走开的行人要在 2 秒内走，其余情况 3 秒内。"],
 delayP:["延误交通","对面在路口里等着左转的是一辆警车，但它没有闪灯、没有鸣笛，不是在执行紧急任务，就按普通车对待：你有路权，直接转，不用让它。你停了超过 3 秒，后方鸣笛了。"],
 delayL:["延误交通","对面的左转车在等你，你有路权，不用让它。路口明确没有冲突，你停了超过 3 秒，后方鸣笛，对面的车也趁机转走了。"],
 hookA:["右转前没有观察自行车","你右边的自行车道里有一辆自行车在追上来，你转弯前没有看中镜、右镜和右后盲区，就向右切进了自行车道。这是右转车最典型的事故（right hook）。转弯前一定要观察，自行车直行时要先让它过。"],
 hookB:["没有让行自行车","你看到了右后方的自行车，但没有停下让它先过，就切进了自行车道。自行车在你右边直行时，右转车要让它先通过，再转。"],
 redR:["红灯时转弯","灯已经变红，你的车停在人行横道外，没有占用人行横道，就应该停着等下一个绿灯。这时再转就成了“红灯右转”，要让横向的直行车和左边过来的行人，本练习不涉及，路考中这里不要抢着转。"],
 red:["闯红灯","灯变黄时你还在停车线后，可以停下，你却继续开（或跟着前车转），变红灯后才越过停车线，这是闯红灯，路考直接不合格。黄灯亮时，能安全停下就要停在停车线后；前车过了线可以走，不代表你也可以跟着走。"],
 yel:["黄灯时能停却没停","灯变黄时你还没到停车线，及时刹车是可以停在线后的，你却继续开过了停车线。快到路口时要一直留意信号灯，黄灯的意思是“停车，除非已经无法安全停下”。"],
 yieldL2:["没有等左转车先转","灯变黄时你已经在路口里，对面等着的左转车会趁黄灯转弯。你应该继续停着，让它先转，然后马上跟着完成右转，两车不要同时进入路口。"],
 goX:["让过左转车后没有及时完成转弯","你已经在路口里，让过左转车后应马上跟着完成转弯、离开路口，不要一直停在路口里。"],
 yieldL:["黄灯时没有让行左转车","灯变黄时你已经越过停车线、但还没进入横向道路。对面在路口里等着的左转车会趁黄灯完成左转。你要先停车让它转过去，再尽快完成右转、离开路口。"],
 blockX:["占用人行横道，阻碍行人通行","灯变黄时你已经过了停车线，车头占用了人行横道。让过左转车后，虽然本方已经变红灯，也应该立刻完成转弯、离开人行横道。你一直停着，横向变绿灯后过马路的行人被你的车挡住了。"],
 blockX2:["占用人行横道，没有及时完成转弯","灯变黄后你的车头停在了人行横道上。让过对面左转车后，应该马上跟着完成转弯；你一直等到横向变绿灯、直行车开始走，这时已经走不了了，车还占着人行横道，挡住了横向过街的行人。"],
 inX:["已在路口里，应完成转弯","灯变黄时你已经进入横向道路，应该继续完成转弯、尽快离开路口，不要停在路口里。"],
 police:["没有给紧急车辆让路","听到警笛、看到闪灯的紧急车辆时，必须让路：安全的话靠边停车，未进入路口的车切勿进入路口，等它通过后再走。你在警车通过之前开进了路口，快到路口时听到警笛，要左右观察，找到它从哪里来。这是严重错误，路考直接不合格，警车已示意你靠边停车。"],
 noScanP:["警车过去后没有再观察路口","警车过去以后跟着转弯是可以的，但车头进入路口前要再按“观察路口”看一眼左边，确认后面没有别的紧急车辆。"],
 hitP:["撞到了行人","你的车撞到了正在过马路的行人。转弯时一定要先让行人，看不清就停车等。"],
 hitBA:["没有观察右后方，撞倒了自行车","右转前你没有做右后观察，没发现右边自行车道里的自行车，并入自行车道／转弯时把它撞倒了。转弯前一定要看中镜、右镜和右后盲区；发现自行车，就留在原车道，让它先过再转。"],
 hitBB:["没有让行自行车，撞倒了它","你看到了右后方的自行车，却没有停车让它先过，把它撞倒了。自行车在你右边直行时，要等它过去再转。"],
 sig:["转弯前没有打右转灯","右转前一定要打右转灯，让后车、自行车和行人知道你要转。一般在停车线前约 30 米就打开。"],
 sigL:["右转灯打得太晚","你打了右转灯，但离停车线已经不到 15 米，后车、自行车和行人来不及反应。要更早打灯，一般在停车线前约 30 米就打开。"]},GR.TXT);      // 让行人、占用人行横道、右后观察的提示和红灯右转共用（lib/rules.js）
function snap(){const c=document.createElement('canvas');c.width=280;c.height=200;const x=c.getContext('2d'),X=a=>(a+20)*4.5,Y=a=>(18-a)*4.5;
 x.fillStyle='#7bbf52';x.fillRect(0,0,280,200);x.fillStyle='#6c6c75';x.fillRect(X(-9.5),0,85.5,200);x.fillRect(0,Y(9.5),280,85.5);
 x.fillStyle='#f3f3f3';for(let i=0;i<19;i++){x.fillRect(X(11.5),Y(-9.5+i+.5),15.75,2.25);x.fillRect(X(-9.5+i),Y(-11.5),2.25,15.75)}
 R.peds.forEach(p=>{const a=pedPos(p,R.t);x.fillStyle='#ff8a1f';x.beginPath();x.arc(X(a[0]),Y(a[1]),4,0,7);x.fill()});
 const cr=(q,col)=>{x.save();x.translate(X(q[0]),Y(q[1]));x.rotate(q[2]);x.fillStyle=col;x.fillRect(-4.3,-10,8.6,20);x.restore()};
 if(R.lc)cr(R.lc.path(R.lc.u),'#eceff1');cr(myPath(R.u),'#2e6fd6');return c.toDataURL()}
const LATE=['noRR','noLastLook','noLook2','noLook','noLook1'];      // 右后观察类的提示晚 2.5 秒再闪，不打扰正在转弯的玩家
function ev(key,tk){if(R.ev.some(e=>e.key===key))return;const t=TXT[tk||key];R.ev.push({key,tk:tk||key,title:t[0],text:t[1],img:snap()});if(!EX){if(LATE.includes(tk||key))(R.flQ=R.flQ||[]).push({t:R.t+2.5,s:t[0]});else flash(t[0])}if(tk==='delay'||tk==='delayL'||tk==='delayP')honk()}
const SER=['hitP','hitBA','hitBB','xwalk','pedA','pedB','hookA','hookB','red','redR','police','blockX','blockX2'];      // 严重错误：路考直接不合格
const lcAct=()=>R.lc&&(R.lc.type==='cut'||R.lc.l5)&&R.lc.state==='run'&&R.lc.path(R.lc.u)[0]<(R.lc.l5?12:20);   // 黄灯局：左转车开过人行横道一带就算转过去了
const behind=()=>myPath(R.u)[1]<-19.6;
const occ=()=>{const w=myPath(R.u);return w[1]+2.35*Math.cos(w[2])>=-15};   // 车头压到（或越过）本方人行横道     // 车还在停车线后（车头未压线）     // 车还在停车线后
const canGo=()=>!R.peds.some(p=>pedZone(p,R.t)>=1)&&!lcAct()&&!(R.light!=='green'&&!R.pastY)&&!polHold();   // 本方黄灯/红灯时停在停车线附近等，是正确的，不算延误
function startLC(){R.lc.state='run'}
// 行人灯开始闪：已经在人行横道上的行人加快走完，还没踏上的就在路边停下等
function hurryPeds(){const t=R.t;R.peds.forEach(p=>{if((p.k!=='A'&&p.k!=='B')||p.dd!=null)return;const g=pedSeg(p,t);if(!(g.v>0))return;
 const uu=p.off+pedD(p,t),D=pedD(p,t);p.sg=p.sg.filter(s=>s.t<=t);
 if(uu>=PE[p.k]-.2)p.sg.push({t,v:Math.max(g.v*1.6,2)});
 else{p.sg.push({t,v:g.v});p.sg.push({t:t+Math.max(0,PE[p.k]-1-uu)/g.v,v:0});p.wait=true}})}      // 在路边等下一个绿灯，不再算冲突
// 本方向（和对面）信号灯变色：g 绿 / y 黄 / r 红
// 横向等红灯的车：横向变绿后起步直行；跟前车、遇到前方的你会减速
function crossCar(f,dt){if(f.x0==null){const q=f.p(0);f.x0=q[0];f.z0=q[1];f.dir=Math.sin(q[2])>0?1:-1;f.h=q[2]}
 if(!R||!R.xg){f.s2=0;f.cv2=0;f.c.visible=true;place(f.c,f.x0,f.z0,f.h);return}
 const x=f.x0+f.dir*f.s2;let vt=R.t-R.xgT<(Math.abs(f.x0)>22?2.6:1.3)||(polHold()&&f.dir*x<-12)?0:16.5;      // 绿灯后约 1.3 秒才起步；警车过来时不进路口
 flows.forEach(o=>{if(o===f||o.v!==0||o.dir!==f.dir||Math.abs(o.z0-f.z0)>.5||o.s2==null)return;const g=(o.x0+o.dir*o.s2-x)*f.dir;if(g>0)vt=Math.min(vt,Math.max(0,1.5*(g-7)))});
 [myPath(R.u),R.lc&&R.lc.state!=='idle'?R.lc.path(R.lc.u):null].forEach(a=>{if(!a)return;const g=(a[0]-x)*f.dir;if(Math.abs(a[1]-f.z0)<3.6&&g>0&&g<25)vt=Math.min(vt,Math.max(0,1.5*(g-7)))});   // 前方有你的车或左转车：减速跟车
 f.cv2=f.cv2>vt?Math.max(vt,f.cv2-7*dt):Math.min(vt,f.cv2+1.8*dt);f.s2+=f.cv2*dt;const nx=f.x0+f.dir*f.s2;f.c.visible=Math.abs(nx)<170;place(f.c,nx,f.z0,f.h)}
function setCross(c){CHEADS.forEach(lm=>{for(const k of ["r","y","g"])lm[k].m.material=k===c?lm[k].on:lm[k].off})}      // 横向道路的信号灯
function setLight(c){R.light={g:'green',y:'yellow',r:'red'}[c];HEADS.forEach(lm=>{for(const k of ["r","y","g"])lm[k].m.material=k===c?lm[k].on:lm[k].off});
 const b=$('bn');b.textContent={g:'绿灯右转',y:'黄灯！',r:'红灯'}[c];b.style.color={g:'',y:'#ffc21a',r:'#ff5a5a'}[c];const d=$('lt'),k={g:'#2ee66b',y:'#ffc21a',r:'#ff3b3b'}[c];d.style.background=k;d.style.boxShadow='0 0 8px '+k}
const vApp=u=>Math.min(7,Math.sqrt(2*2.2*Math.max(0,LP-u)));
function tApp(){let u=0,t=0;while(u<LP-.05&&t<30){u+=Math.max(.3,vApp(u))*.02;t+=.02}return t}       // 左转车驶到停车点要多久
function tArr(){let u=U0,t=0;while(u<uS-5&&t<30){u+=vOf(u)*.02;t+=.02}return t}                    // 你（不按按钮）到停车线前约 5 米要多久
function cmd(m){if(!playing||R.over||R.u>=ce+1||R.po)return;
 if(m==='scan'){if(R.lookT>=0){R.lookT=-1;R.pit=0;R.tgt=null;R.seen=0;R.back=0;R.lkOn=false}R.scT=0;yawD=0;R.lastScan=R.t;R.scQ=R.u>=uS-3;return}      // 随时可以看路口（会打断右后观察）      // 离停车线还远：左-右-左；已到停车线附近或过线：只看一眼左边
 if(m==='sig'){R.sig=!R.sig;if(R.sig&&R.sigU==null)R.sigU=R.u;$('sg').style.display=R.sig?'block':'none';if(R.sig)tick(true);mk();return}
 if(m==='look'){if(R.lookT>=0)return;R.scT=-1;yawD=0;const slow=R.mode!=='stop';R.lookT=0;if(slow)R.mode='slow';mk();return}
 if(m===R.mode)return;
 if(m==='stop'){const dA=uS-1.7-R.u;if(dA>R.v*R.v/(2*AB)+.2){R.stopT=uS-1.7;R.stopA=Math.max(AB,R.v*R.v/(2*Math.max(.1,dA)))}else{R.stopA=7;R.stopT=R.u+R.v*R.v/14}}
 if(m==='stop')R.stopAt=R.t;
   // 警车鸣笛开过来时还起步
 if(m==='turn'&&R.mode==='stop'&&R.light==='green'&&R.peds.some(p=>(p.k==='B'||p.bike)&&!p.hit)&&!(R.lastLook>R.stopAt))ev('noLook2');   // 让行停车后再起步：还是绿灯就要再看一次右后方；已经红灯可以不强调      // 停车让行后起步前没有再看右后方
 R.mode=m;mk()}
function pickTgt(q){let b=null,bd=1e9;R.peds.forEach(p=>{if(p.k==='A'||p.k==='D'||!p.o.visible)return;const a=pedPos(p,R.t),dx=a[0]-q[0],dz=a[1]-q[1],d=Math.hypot(dx,dz),y=normA(Math.atan2(dx,dz)-q[2]);if(d<70&&y>1.1&&y<3.1&&d<bd){bd=d;b=p}});return b}
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;let v=R.v,u=R.u,m=R.mode;
 if(R.flQ&&R.flQ.length&&R.t>=R.flQ[0].t)flash(R.flQ.shift().s);
 if(!R.committed&&u>=uS-1.2){R.committed=true;if(m==='slow'){R.mode=m='turn';mk()}}
 if(m==='stop'){const dS=R.stopT-u;if(dS>.1)v=Math.min(v,Math.sqrt(2*R.stopA*dS));else v=0}
 else{const t=vOf(u);v=v>t?Math.max(t,v-5*dt):Math.min(t,v+2.5*dt)}
 if(m==='stop'&&v<.05){v=0;R.stopped=true;
  if(canGo()){R.idle+=dt;const cj=R.peds.some(p=>{if(p.k!=='C')return false;const x=pedPos(p,R.t)[0];return x>14&&x<26});
   if(R.idle>(cj?2:3)&&!R.dl&&!R.pastY){R.dl=true;const w=R.lc&&R.lc.type==='wait'&&R.lc.state==='idle';ev('delay',w?(R.lc.isP?'delayP':'delayL'):'delay');if(w)startLC()}}
  else{R.idle=0;R.dl=false}}
 else{R.idle=0;R.dl=false}
 R.sT=(m==='stop'&&v<.05)?(R.sT||0)+dt:0;
 const L=R.ld;if(L){if(L.st==='go'){const t=vOf(L.u);L.v=L.v>t?Math.max(t,L.v-5*dt):Math.min(t,L.v+2.5*dt)}
  else{L.v=Math.max(0,L.v-7*dt);if(L.v===0){L.sT+=dt;if(L.sT>1.5&&R.lc&&R.lc.state==='run'&&!lcAct())L.st='go'}}
  L.u+=L.v*dt;v=Math.min(v,Math.sqrt(2*6*Math.max(0,L.u-6.8-u)))}       // 跟车：不会撞上前车
 u+=v*dt;R.v=v;R.u=u;
 {const w=myPath(u);R.onE=false;if(m==='stop'&&v<.05){const onS=GR.onS(w),onE=GR.onE(w);R.onE=onE;if(R.hitT==null&&(onS&&R.light==='red'&&!R.pastY&&!(R.yT>=0&&!behind())||R.hitT==null&&onE))ev('xwalk'+(onE?'E':'S'),'xwalk')}}
 const lc=R.lc;
 if(lc){if(lc.state==='app'&&R.t>=lc.ta){lc.v=Math.max(.3,vApp(lc.u));lc.u+=lc.v*dt;if(lc.u>=LP-.05){lc.u=LP;lc.v=0;lc.state='idle'}}
  if(lc.state==='idle'){if(lc.type==='cut'&&u>=uS-10){lc.d0-=dt;if(lc.d0<0)startLC()}else if(lc.type==='wait'&&!lc.l5&&u>=ce+8)startLC()}
  if(lc.state==='run'){const yl=R.peds.some(p=>{if((p.k!=='A'&&p.k!=='B')||p.wait)return false;const z=pedPos(p,R.t)[1],e=lc.ze;return p.k==='A'?(z>e-2&&z<e+4):(z<e+2&&z>e-4)});   // 只让已经在人行横道上、正走向它车道的行人
   let vt=lc.type==='cut'||lc.l5?8:5;if(yl&&lc.u<lc.uStop)vt=Math.min(vt,Math.sqrt(8*Math.max(0,lc.uStop-lc.u)));
   lc.v=lc.v>vt?Math.max(vt,lc.v-6*dt):Math.min(vt,lc.v+3*dt);lc.u+=lc.v*dt}
  const q=lc.path(lc.u);place(lc.car,q[0],q[1],q[2]);
  if(lc.type==='cut'&&lc.state==='run'){const a=myPath(u),inZ=p=>p[0]>-10&&p[0]<22&&p[1]>-12&&p[1]<10;if(inZ(a)&&inZ(q)&&Math.hypot(a[0]-q[0],a[1]-q[1])<7)ev('cut')}}
 const q=myPath(u);
 if(R.committed&&GR.inBand(q))R.peds.forEach(p=>{if((p.k==='A'||p.k==='B')&&pedZone(p,R.t)===2)ev('ped'+p.k)});
 R.peds.forEach(p=>{if(p.k==='S'&&!p.hit&&!R.ev.some(e=>e.key==='hitB')){const c=pedPos(p,R.t);if(q[0]>7.1&&q[1]<-7&&Math.abs(q[1]-c[1])<4.5)ev('hook',R.chk?'hookB':'hookA')}});   // 右转切进了自行车道
 if(R.cs[0]==='5'){const w=myPath(u);R.stT=(v<.05)?(R.stT||0)+dt:0;
  if(R.yT<0&&!R.fl&&(R.cs==='5e'?R.peds.some(p=>p.k==='B'&&pedPos(p,R.t)[1]>-9):R.cs==='5d'?myPath(R.ld.u)[1]>=-30:(v>.5&&R.uY-u<=3.5*v))){R.fl=true;R.flT=R.t;setPedSig('M','flash');hurryPeds()}   // 变黄前约 4 秒：行人灯白色人形开始闪，1.5 秒后变红手，再过 2–3 秒绿灯变黄
  if(R.fl&&!R.hand&&R.t-R.flT>=1.5){R.hand=true;setPedSig('M','hand')}
  if(R.yT<0){const go=R.fl&&R.t-R.flT>=3.5&&((R.cs==='5e'?R.peds.some(p=>p.k==='B'&&pedPos(p,R.t)[1]>0):u>=R.uY)||R.t-R.flT>=10);      // 车开到预定位置时变黄；车一直停着的话，人形闪 8 秒后也会变黄
   if(go){R.yT=R.t;R.pastY=occ();setLight('y');if(R.ld)R.ld.st='stop'}}
  else{if(R.light==='yellow'&&R.t-R.yT>=2)setLight('r');
   if(R.lc&&R.lc.state==='run'&&!lcAct()&&R.lcClr==null)R.lcClr=R.t;
   if(R.light==='red'&&!R.xg&&R.t-R.yT>=2+R.allR){R.xg=true;R.xgT=R.t;setCross('g');setPedSig('X','walk')}      // 本方红灯 2 秒后，横向变绿灯
   if(R.lc&&R.lc.state==='idle'){const ok=c=>c.x>16||c.stopT>.2||c.brk;          // 右转车已停稳（或已转走），左转车才转，两车不同时进入路口
    const me={x:w[0],stopT:R.stT,brk:m==='stop'&&v<2.2},ld=R.ld?{x:myPath(R.ld.u)[0],stopT:R.ld.sT}:null;
    if(((ok(me)&&(!ld||ok(ld)))||R.lc.w5>0)&&!polHold()){R.lc.w5=(R.lc.w5||0)+dt;if(R.lc.w5>.15){startLC();R.lc.v=4.5}}}
   if(R.wasB&&!behind()){if(m!=='stop'&&R.light==='red')ev('redrun','red');else if(m!=='stop')R.yPend=true}
   if(R.yPend&&w[1]+2.35*Math.cos(w[2])>-9.5){R.yPend=false;ev('redrun','yel')}      // 黄灯过线后一直没停、直接开进横向道路   // 黄灯时按了停车但已刹不住过线：可以，停在横向道路前让左转车即可
   if('abe'.includes(R.cs[1])&&!R.pastY&&occ()&&v<.05){R.pastY=true;R.yPend=false}      // 停车时车头压着人行横道：让过左转车后应马上转
   if(v<.05){R.yPend=false;R.stopY=true}
   if(R.stopY&&!R.pastY&&R.light==='red'&&!behind()&&w[1]+2.35*Math.cos(w[2])>-9.5)ev('redrun','redR');   // 没压人行横道、红灯了还转                     // 黄/红灯时越过停车线
   if(R.cs==='5c'&&m==='stop'&&v<.05)ev('inX');
   if(R.lc&&R.lc.state==='run'&&lcAct()&&v>.5&&!behind()){const b=R.lc.path(R.lc.u);if(Math.hypot(w[0]-b[0],w[1]-b[1])<7)ev('yieldL','yieldL2')}   // 和左转车同时进入路口
   if(R.cs==='5e'&&R.pastY&&R.lcClr!=null&&v<.05&&R.t-R.lcClr>3)ev('goX');
   if(((R.cs!=='5d'&&!R.pastY&&!occ())||(R.cs==='5d'&&R.ld.st==='go'&&myPath(R.ld.u)[0]>16))&&R.light==='red'&&v<.05){R.rw=(R.rw||0)+dt;if(R.rw>.8){finish();return}}}   // 黄灯后停在了正确位置（没压人行横道），变红后这一关结束
  R.peds.forEach(p=>{if(p.k!=='X')return;if(!p.go&&R.xg){p.go=true;p.hide=false}/* 左转车转走 2.5 秒后，横向行人开始过街 */if(!p.go)return;
   const np0=p.path(p.dd+p.vw*dt),la=p.path(p.dd+2.2),oz=p.oz||0,np=[la[0],la[1]+oz],c=myPath(R.u),dx=np[0]-c[0],dz=np[1]-c[1],sn=Math.sin(c[2]),co=Math.cos(c[2]),blk=Math.abs(dx*sn+dz*co)<2.85&&Math.abs(dx*co-dz*sn)<1.55;
   if(p.det){const D=p.det,x=np0[0],uu=(x-D.xs)/(2*(D.xc-D.xs));p.dd+=p.vw*dt;p.sg[0].v=p.vw;      // 走一个大弧线绕过车头
    if(uu>=1){p.oz=0;p.ohd=0;p.passed=true;p.det.done=true}else if(!D.done){p.oz=D.A*(.5-.5*Math.cos(2*Math.PI*uu));const dz=D.A*Math.PI*Math.sin(2*Math.PI*uu)/(2*(D.xc-D.xs));p.ohd=-Math.atan(dz*Math.sign(D.xc-D.xs))}}
   else if(blk){p.bt=(p.bt||0)+dt;p.sg[0].v=0;if(p.bt>1)ev('blockX');
    if(p.bt>1.6){const fz=c[1]+2.35*Math.cos(c[2]);p.det={xs:np0[0],xc:c[0],A:(fz+1.5-np0[1])*1.15}}}   // 被挡住：先停下等一会儿，再绕
   else{p.dd+=p.vw*dt;p.sg[0].v=p.vw}});
  if(R.pastY&&R.xg&&R.t-R.xgT>2&&v<.05){if(R.cs==='5e')ev('goX');else ev('blockX','blockX2');R.xw=(R.xw||0)+dt;if(R.xw>1){finish();return}}   // 横向已经放行、直行车开始走，你走不了了：结束
  {const X=R.peds.filter(p=>p.k==='X');const B=X.filter(p=>p.det);if(R.pastY&&v<.05&&B.length&&B.every(p=>p.passed)){R.xd=(R.xd||0)+dt;if(R.xd>1.5){finish();return}}}   // 被挡的行人绕过你的车之后，结束
  R.wasB=behind()}
 if(R.emg&&!R.pol&&R.sT>1.2&&R.yT<0&&!R.fl&&R.peds.every(p=>pedZone(p,R.t+3)===0)){R.pol=makePolice(R.emg);R.emgOn=true}      // 你停车等行人时，警车鸣笛开过来
 R.polsOld.forEach(P=>{P.u=Math.min(P.u+P.vmax*dt,300)});
 if(R.pol&&R.polPassT==null&&polPassed(R.pol)){R.polPassT=R.t}
 if(R.pol){const P=R.pol,pq=P.pp(P.u),a=myPath(u),dx=a[0]-pq[0],dz=a[1]-pq[1],fw=dx*Math.sin(pq[2])+dz*Math.cos(pq[2]),lat=dx*Math.cos(pq[2])-dz*Math.sin(pq[2]);
  let vt=P.vmax;if(fw>0&&fw<24&&Math.abs(lat)<2.6)vt=Math.min(vt,Math.max(0,(fw-9)*1.6));
  if(P.chase&&a[0]<18)vt=Math.min(vt,Math.sqrt(2*7*Math.max(0,Math.hypot(dx,dz)-10)));       // 你没让路：警车刹车避让，然后跟在你后面        // 前面有你的车：减速跟在后面
  P.v=P.v>vt?Math.max(vt,P.v-8*dt):Math.min(vt,P.v+4*dt);P.u=Math.min(P.u+P.v*dt,300);
  const fz=a[1]+2.35*Math.cos(a[2]);if(!R.polE&&!polPassed(P)&&fz>-9.5&&a[0]<16&&v>.3){R.polE=true;P.chase=true;ev('police')}      // 警车没过去，车头就进了路口
  if(!R.polE&&R.polPassT!=null&&!R.nsc&&fz>-9.5&&a[0]<16){R.nsc=true;if(!(R.lastScan>=R.pol.t0))ev('noScanP')}   // 警车过去后跟着走可以，但车头进路口前要再看一眼左边       // 警车通过路口时你还在开 → 严重错误
  if(P.chase){if(a[0]>16&&!R.po){R.po=true;R.mode=m='stop';R.stopA=3;R.stopT=Math.min(UEND-2,u+v*v/6+.5);mk();flash('警车示意你靠边停车')}
   if(v<.05){R.poT=(R.poT||0)+dt;if(R.poT>(R.po?2.5:3.5)){finish();return}}else R.poT=0}}
 if(R.scT>=0){R.scT+=dt;const sT=R.scT,tg=R.scQ?(sT<.75?-1.3:0):(sT<.55?-1.25:sT<1.25?1.05:sT<1.8?-1.25:0);R.yaw+=(tg-R.yaw)*Math.min(1,dt*10);if(sT>(R.scQ?1.1:2.2)){R.scT=-1;R.yaw=0}}   // 观察路口：左-右-左
 R.peds.forEach(p=>{if(!p.bike||p.hit)return;const c=pedPos(p,R.t),a=myPath(u),ahead=a[1]-c[1],blk=c[1]<-9&&ahead>0&&ahead<3.7&&Math.abs(a[0]-c[0])<1.4;   // 你的车挡在自行车道里：自行车刹车停在后面
  if(blk||p.dd!=null){if(p.dd==null)p.dd=pedD(p,R.t);const vb=blk?0:Math.min(5,(p.vb||0)+3*dt);p.vb=vb;p.blk=blk;p.dd+=vb*dt;p.sg=[{t:0,v:vb}]}});
 R.peds.forEach(p=>{if(p.hit||!p.o.visible||p.hide)return;const c=pedPos(p,R.t),a=myPath(u),dx=c[0]-a[0],dz=c[1]+(p.oz||0)-a[1],fw=dx*Math.sin(a[2])+dz*Math.cos(a[2]),lat=dx*Math.cos(a[2])-dz*Math.sin(a[2]);
  if(Math.abs(fw)<2.45&&Math.abs(lat)<(p.bike?1.1:1.0)&&v>.4){p.hit=true;p.dd=pedD(p,R.t);p.sg=[{t:0,v:0}];if(p.bike){const h=R.ev.findIndex(e=>e.key==='hook'),tk=(h>=0?R.ev[h].tk==='hookB':R.chk)?'hitBB':'hitBA';if(h>=0)R.ev.splice(h,1);ev('hitB',tk)}else ev('hitP');R.mode=m='stop';R.stopA=7;R.stopT=u+v*v/14;R.hitT=R.t;mk()}});   // 撞到行人或自行车：倒地，你的车急停
 if(R.hitT!=null&&R.t-R.hitT>3){finish();return}
 if(R.lane==null&&pathN(u)[1]>=-36){const bike=R.peds.some(p=>p.bike&&!p.hit);R.lane=bike&&(R.lookT>=0||(R.lastLook!=null&&R.t-R.lastLook<5))?'K':'N';MP=R.lane==='K'?pathK:pathN;R.laneT=R.t}
 {const a=myPath(u),fx=a[0]+2.35*Math.sin(a[2]);if(R.lane&&!R.llc&&fx>=11.5&&a[1]>-12){R.llc=true;if(R.light==='green'&&!(R.lastLook>=R.laneT)&&!R.ev.some(e=>e.key==='noLook2'))ev('noLastLook')}}   // 车头进入右侧人行横道前，要做过最后一次右后观察
 if(!R.sigChk&&u>=cs+6){R.sigChk=true;if(!R.sig)ev('sig');else if(R.sigU>uS-15)ev('sig','sigL')}
 if(R.sig&&u>ce+2){R.sig=false;$('sg').style.display='none';mk()}
 if(R.lookT>=0){R.lookT+=dt*1.4;const lt=R.lookT,qq=myPath(u),k9=Math.min(1,dt*12);
  if(lt<.5){R.yaw+=(.45-R.yaw)*k9;R.pit+=(.22-R.pit)*k9}              // 1 看中镜
  else if(lt<1){R.yaw+=(1-R.yaw)*k9;R.pit+=(-.15-R.pit)*k9}           // 2 看右镜
  else{const l3=lt-1;if(!R.chk){R.chk=true;R.chkT=R.t}if(!R.lkOn){R.lkOn=true;R.lastLook=R.t}R.pit+=(0-R.pit)*k9;                // 3 回头看右后盲区
   if(!R.tgt||!R.tgt.o.visible)R.tgt=pickTgt(qq);
   let want=1.9;R.lookD=14;if(R.tgt){const a=pedPos(R.tgt,R.t),dx=a[0]-qq[0],dz=a[1]-qq[1];want=Math.max(1.5,Math.min(2.1,normA(Math.atan2(dx,dz)-qq[2])));R.lookD=Math.max(3,Math.hypot(dx,dz))}
   if(R.tgt&&Math.abs(want-R.yaw)<.35)R.seen=(R.seen||0)+dt;
   const hold=R.tgt?(R.seen>=.8||l3>2.2):l3>=.95;
   if(!hold)R.yaw+=(want-R.yaw)*Math.min(1,dt*12);
   else{if(!R.back){R.back=lt}R.yaw+=(0-R.yaw)*Math.min(1,dt*14);if(lt-R.back>.4){R.lookT=-1;R.yaw=0;R.pit=0;R.tgt=null;R.seen=0;R.back=0;R.lkOn=false}}}}
 // 后车跟车：保持车距，你停它也停
 {const f=R.fol;if(f){const gap=u-f.u-4.6;let vt=Math.max(0,Math.min(R.v+3,2.2*(gap-2.5)));
  if(R.yT>=0&&f.bY==null)f.bY=myPath(f.u)[1]<-19.6;if(R.light!=='green'&&f.bY)vt=Math.min(vt,Math.sqrt(2*4*Math.max(0,uS-1.7-f.u)));   /* 黄灯时后车还在停车线后：停在线后，不跟着你转 */f.v=f.v>vt?Math.max(vt,f.v-6*dt):Math.min(vt,f.v+3*dt);f.u=Math.min(f.u+f.v*dt,u-4.6)}}
 if(u>=UEND||R.t>80)finish()}
function cardsHtml(list){return'<div class="cards">'+list.map(e=>`<div class="card"><img src="${e.img}"><b>${e.n?'第 '+e.n+' 个路口 · ':''}${e.title}${EX||e.n?(SER.includes(e.tk)?'<span class="tag s">严重</span>':'<span class="tag">扣分项</span>'):''}</b><span>${e.text}</span></div>`).join('')+'</div>'}
function finish(){R.over=true;sirenOff();R.sig=false;$('sg').style.display='none';mk();const o=$('ov');let h,btn='<button id="again">再来一次</button> <button id="home" style="background:#6b7280">回到首页</button>';
 if(EX){R.ev.forEach(e=>EX.ev.push(Object.assign({n:EX.i+1},e)));EX.i++;
  if(EX.i<EX.n){h=`<h2>第 ${EX.i} 个路口完成</h2><p>考试中不提示对错，全部结束后统一给出结果。</p>`;btn='<button id="next">下一个路口</button>'}
  else{const ser=EX.ev.filter(e=>SER.includes(e.tk)),mi=EX.ev.length-ser.length;
   h=`<h2>${MODE==='g'?'模拟考 G':'模拟考 G2'} · 总结</h2><p>5 个路口：严重错误 <b>${ser.length}</b> 处 · 扣分项 <b>${mi}</b> 处</p>`+(EX.ev.length?cardsHtml(EX.ev):'<p>5 个路口全部处理正确，非常好！</p>');EX=null}}
 else if(!R.ev.length)h='<h2>驾驶总结</h2><div class="st">★★★</div><p>这一趟没有违规或危险驾驶，右转处理得很好。</p>';
 else h='<h2>驾驶总结</h2><p>这一趟有 '+R.ev.length+' 处需要注意：</p>'+cardsHtml(R.ev);
 o.innerHTML=`<div class="pn">${h}<br>${btn}</div>`;o.style.display='flex';
 const go=()=>{o.style.display='none';newRun(true);playing=true};
 if($('next'))$('next').onclick=go;if($('again'))$('again').onclick=()=>{if(MODE!=='free')EX={n:5,i:0,ev:[],used:[]};go()};if($('home'))$('home').onclick=()=>{o.innerHTML=HOME;o.style.display='flex';bindHome()}}
// ================= 渲染循环 =================
let last=0,fovH=110;
function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;step(dt);const t=R.t;
 const fdt=Math.max(0,t-(loop.pt||0));loop.pt=t;
 flows.forEach(f=>{if(f.v===0){crossCar(f,fdt);return}if(f.s==null||t<.001)f.s=f.off+f.v*t;let vt=f.v;if(f.v>0&&(R.light!=='green'||polHold())){const q0=f.p(f.s),ds=q0[0]<0?q0[1]-20:-20-q0[1];if(ds>0&&ds<40)vt=Math.min(f.v,Math.sqrt(2*3*Math.max(0,ds-.5)))}
  f.cv=f.cv==null?f.v:(f.cv>vt?Math.max(vt,f.cv-6*dt):Math.min(vt,f.cv+3*dt));f.s+=f.cv*fdt;const q=f.p(f.s);place(f.c,q[0],q[1],q[2])});
 R.peds.forEach(p=>{const D=pedD(p,t),uu=p.off+D;p.o.visible=!p.hide&&uu<p.len-.05;const q=p.path(Math.min(uu,p.len-.06)),mc=myPath(R.u),ox=R.onE?Math.max(0,mc[0]+3.2-q[0])*Math.max(0,1-Math.abs(q[1]-mc[1])/3.5):0,G=pedSeg(p,t);place(p.o,q[0]+(p.hit?0:ox),q[1]+(p.oz||0),q[2]+(G.f?Math.PI:0)+(p.ohd||0),.1);
  if(p.hit){p.o.rotation.order='YXZ';if(p.bike){p.o.rotation.z=Math.min(1.45,(p.o.rotation.z||0)+.12);p.o.position.y=.15}else{p.o.rotation.x=Math.max(-1.45,(p.o.rotation.x||0)-.12);p.o.position.y=.2}return}   // 倒地
  const sp=Math.abs(G.v),run=sp>2.2,s=sp<.05?0:Math.sin(t*(run?12:sp*5+2))*(run?.95:.45+sp*.1),u=p.o.userData,k=run?1.1:.8;
  if(p.bike){u.wh.forEach(w=>w.rotation.x=-t*sp/.36);u.l.rotation.x=-.3;u.r.rotation.x=-.3;if(p.k==='R'){if(q[0]<15.5)u.al.rotation.set(0,0,-1.5);else u.al.rotation.set(0,0,0)}}      // 右转的自行车伸出右手示意
  else{u.l.rotation.x=s;u.r.rotation.x=-s;u.al.rotation.x=-s*k;u.ar.rotation.x=s*k}});
 if(R.ld){const lq=myPath(R.ld.u),b=Math.sin(ts/1000*9.4)>0;place(R.ld.car,lq[0],lq[1],lq[2]);R.ld.car.visible=R.ld.u<myLen-1;R.ld.car.userData.bl.forEach(m=>m.visible=b&&R.ld.u<ce)}
 pedSigTick(ts);
 R.polsOld.forEach(P=>{const q=P.pp(P.u),b=Math.sin(ts/1000*14)>0;place(P.car,q[0],q[1],q[2]);P.car.visible=q[0]<160;P.rd.visible=b;P.bu.visible=!b});
 if(R.pol){const P=R.pol,pq=P.pp(P.u),b=Math.sin(ts/1000*14)>0;place(P.car,pq[0],pq[1],pq[2]);P.car.visible=pq[0]<160;P.rd.visible=b;P.bu.visible=!b;{const tq=P.pp(Math.max(0,P.u-P.gap)),T2=P.tail;place(T2.car,tq[0],tq[1],tq[2]);T2.car.visible=tq[0]<160&&P.u>P.gap;T2.rd.visible=!b;T2.bu.visible=b}
  if(playing&&!R.over){if(!SIR)sirenOn();if(SIR){const a=myPath(R.u),d=Math.hypot(a[0]-pq[0],a[1]-pq[1]);SIR.o.frequency.value=950+380*Math.sin(ts/1000*2*Math.PI/3.2);SIR.g.gain.value=Math.min(.16,5/(d+25))}}else sirenOff()}
 if(R.fol){const fq=myPath(R.fol.u);place(R.fol.car,fq[0],fq[1],fq[2])}
 if(R.sig&&playing&&!R.over){const on=Math.sin(ts/1000*9.4)>0;$('sg').style.opacity=on?1:.15;if(on!==loop.sgOn){loop.sgOn=on;tick(on)}}
 const q=myPath(R.u);place(mine,q[0],q[1],q[2]);
 if(R.lc){const on=R.lc.u<R.lc.La+1.5,b=Math.sin(ts/1000*15)>0;R.lc.car.userData.bl.forEach(m=>m.visible=on&&b)}
 if(view===1){const h=q[2]+R.yaw+yawD,lk=R.lookT>=0&&R.tgt,L=lk?R.lookD:(R.lookT>=0?14:10);fovH+=((lk?98:110)-fovH)*.15;cam.fov=Math.min(105,2*Math.atan(Math.tan(fovH*Math.PI/360)/cam.aspect)*180/Math.PI);cam.updateProjectionMatrix();const ox=.38*Math.cos(q[2]),oz=.38*Math.sin(q[2]),bx0=-q[0]+Math.sin(q[2])*.2,bz0=q[1]-Math.cos(q[2])*.2;cam.position.set(bx0+ox,1.25,bz0+oz);cam.lookAt(-q[0]-Math.sin(h)*L+ox,(lk?1.2:1.25+L*.05)+R.pit*L,q[1]+Math.cos(h)*L+oz);
  cockpit.visible=true;cockpit.position.set(bx0,1.25,bz0);cockpit.rotation.y=-q[2];
  const dh=normA(q[2]-lastH)/Math.max(dt,.001);lastH=q[2];wheel.rotation.z+=((Math.max(-2.6,Math.min(2.6,dh*2.4)))-wheel.rotation.z)*Math.min(1,dt*10)}
 else{cockpit.visible=false;if(cam.fov!==62){cam.fov=62;cam.updateProjectionMatrix()}if(!drag)az+=dt*.05;const r=95;cam.position.set(Math.sin(az)*Math.cos(el)*r,Math.sin(el)*r,Math.cos(az)*Math.cos(el)*r);cam.lookAt(0,0,0)}
 $('sp').textContent=Math.round(R.v*3.6);if(cluster)cluster(Math.round(R.v*3.6));
 // 后视镜：把后方场景渲染到小贴图（三个镜子轮流、隔帧刷新）
 if(view===1&&((loop.fc=(loop.fc||0)+1)&1)===0){const m=MR[(loop.fc>>1)%MR.length],sa=ren.shadowMap.autoUpdate;cockpit.updateMatrixWorld(true);
  m.c.position.copy(cockpit.localToWorld(m.pos.clone()));m.c.lookAt(m.c.position.clone().add(m.dir.clone().transformDirection(cockpit.matrixWorld)));
  cockpit.visible=false;ren.shadowMap.autoUpdate=false;ren.setRenderTarget(m.rt);ren.render(scene,m.c);ren.setRenderTarget(null);ren.shadowMap.autoUpdate=sa;cockpit.visible=true}
 ren.render(scene,cam);
 requestAnimationFrame(loop)}

rs();newRun(false);setView(1);requestAnimationFrame(loop);
const HOME=$('ov').innerHTML;
function bindHome(){document.querySelectorAll('.md').forEach(b=>b.onclick=()=>{MODE=b.dataset.mode;const r=document.querySelector('input[name=df]:checked');DIFF=r?r.value:'easy';
 EX=MODE==='free'?null:{n:5,i:0,ev:[],used:[]};$('ov').style.display='none';newRun(true);playing=true})}
bindHome();
// 中途退出：回到首页（模拟考也一并取消）
$('hm').onclick=()=>{if(R)R.over=true;playing=false;sirenOff();EX=null;const o=$('ov');o.innerHTML=HOME;o.style.display='flex';bindHome()};
