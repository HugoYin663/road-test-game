// ============================================================
// green-left.js — 项目：绿灯左转（进入路口等候 → 看对面直行车的空档、右转车、行人、自行车 → 安全再转）
// ============================================================
// 路口：主路有左转专用道（页面里 IXO={ltl:1,hwM:13}）。主路每边：隔离带 0–1、左转道 1–4.5（中心 2.75）、直行道 6.25 和 9.75、自行车道 12.25
// 路线：左转专用道（x=2.75）向北；过了停车线做一个小 S 形（S-shift）向左移到 x=1.6，车正轮正停在路口里等候；再左转进西边道路的内侧车道（z=2.75）
const cub=(P,t)=>{const u=1-t;return[0,1].map(k=>u*u*u*P[0][k]+3*u*u*t*P[1][k]+3*u*t*t*P[2][k]+t*t*t*P[3][k])};
// S-shift：车头一过停车线就往左打方向、再往右回正，车正轮正停在对面直行车道线（x=-4.5）旁边、不压线；然后顺着自然的弧线左转（不是直角弯）
const SDZ=-3,SDS=-(hwX+7.75)-2.35-.4,XL=2.25,XW=.75,SL=-(hwX+7.75),OSZ=-SL+2.35;      // SL：本方停车线（横路加宽后约 -20.75）      // 在左转专用道里靠左（靠隔离带的黄线）开；出白线后 S-shift 向左约 1.5 米（一次调整，不要太多），停在对面待转车的左边（两车错开，对面车不挡你看对面直行车道）；起步时边往前开边左打方向
// 两条路线：S＝出白线后做 S-shift（按“S-停车”）；N＝直着开进路口（按“直行停车”）。停车线以前两条路线完全一样
// 左转路线（参考现实）：先直着开进路口，开始转后打方向盘约 75°（半径约 8 米），然后斜着穿过对面车道，
// 借着中间隔离带末端的弧形尖头斜着进入目标车道（内侧车道 z=2.75），进去以后再慢慢回正（车身在隔离带尖头之后才完全摆正）
const TURN={R:8,L1:2.5,TH:70*Math.PI/180,L3:10,Z0:-10.6,END:-(hwM+13.5),W:1.2};
function turnShape(D,TH){const T=TURN,ds=.05,out=[[0,0]];let x=0,z=0,h=0,n=0;const go=k=>{h+=k*ds;x-=Math.sin(h)*ds;z+=Math.cos(h)*ds;if(++n%8===0)out.push([x,z])};
 const La=T.R*(TH-T.L1/T.R);for(let s=0;s<T.L1;s+=ds)go(s/T.L1/T.R);for(let s=0;s<La;s+=ds)go(1/T.R);for(let s=0;s<T.L1;s+=ds)go((T.L1-s)/T.L1/T.R);
 for(let s=0;s<D;s+=ds)go(0);const dh=Math.PI/2-h,km=2*dh/T.L3;for(let s=0;s<T.L3;s+=ds)go(km*(s<T.L3/2?s/(T.L3/2):(T.L3-s)/(T.L3/2)));out.push([x,z]);return out}
// 开始转弯的位置固定（Z0），斜着进车道后约在 END 摆正；两者之间的斜穿角度按路线自动选（约 65°–80°）
function turnPts(x0){let best=null;for(let d=60;d<=82;d+=.5){const TH=d*Math.PI/180,a=turnShape(0,TH);let D=(2.75-TURN.Z0-a[a.length-1][1])/Math.cos(TH);if(D<0)continue;let b=turnShape(D,TH);D+=(2.75-TURN.Z0-b[b.length-1][1])/Math.cos(TH);b=turnShape(D,TH);const e=Math.abs(x0+b[b.length-1][0]-TURN.END);if(!best||e<best.e)best={e,b}}
 return best.b.map(q=>[x0+q[0],TURN.Z0+q[1]])}
function mkPath(xw){const TR=turnPts(xw),z0=TR[0][1],zW=z0-TURN.W,SP=[[XL,SL-2.05],[XL,SL+1.4],[xw,zW-2.2],[xw,zW]];      // S-shift 做完停在等候点；起步后先直走一小段再转
 const pre=[[XL,-120],...Array.from({length:21},(_,i)=>cub(SP,i/20))],pts=[...pre,...TR,[-90,2.75]],p=path(pts);
 let L=0,cs=0,ce=0;for(let i=1;i<pts.length;i++){L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(i===pre.length)cs=L;if(i===pts.length-2)ce=L}
 const at=zz=>{for(let u=0;u<L;u+=.05)if(p(u)[1]>=zz)return u;return L};
 const ZC={};[-2.75,-6.25,-9.75,-12.25].forEach(Ln=>{for(let u=cs;u<L;u+=.05){const q=p(u);if(q[0]<=Ln){ZC[Ln]=q[1];break}}});
 return{pts,len:L,p,cs,ce,uW:at(zW-.05),ZC}}
const PK={S:mkPath(XW),N:mkPath(XL)};
let myPts,myLen,myPath,cs,ce,UEND,uW,ZC;
function usePath(k){const P=PK[k];myPts=P.pts;myLen=P.len;myPath=P.p;cs=P.cs;ce=P.ce;uW=P.uW;ZC=P.ZC;UEND=ce+16}
usePath('N');
const ZC0=PK.S.ZC,AB=4;      // 排车流时间表用的位置
const uAt=zz=>{for(let u=0;u<myLen;u+=.05)if(myPath(u)[1]>=zz)return u;return myLen};
const uS=uAt(SL-2.7),      // 停车线后的停车位置（车头离停车线约 0.6 米）
      uDiv=uAt(SL-2.05);     // 两条路线从这里分开
const front=u=>{const a=myPath(u);return[a[0]+2.35*Math.sin(a[2]),a[1]+2.35*Math.cos(a[2])]};
const OLT=path(myPts.map(p=>[-p[0],-p[1]]));      // （对面车也做 S-shift 时用的路线，现在先不用）
// 对面左转车：不做 S-shift，进路口后把车头歪向它自己的左边等着（车头不进你这边的直行车道）——不对的做法，但生活中很常见
const BKP=path([[-2.25,120],...Array.from({length:41},(_,i)=>cub([[-2.25,15.5],[-2.25,1],[6,-2.75],[26,-2.75]],i/40)),[170,-2.75]]);
// 对面右转车：转进西边道路的外侧车道（z=6.25）
const ORT=path([[-9.75,150],...Array.from({length:31},(_,i)=>cub([[-9.75,33],[-9.75,20],[-12,9.75],[-23,9.75]],i/30)),[-90,9.75]]);      // 对面外侧直行道右转，转进西边道路的外侧车道
const mine=car(C[0]);
let DIFF='easy',R=null,round=0,playing=false,gt=0,view=1,yawD=0,az=2.4,el=.85,drag=false,lx=0,ly=0,STD='g2',LASTK=null;
const live=[];
const pedD=(p,t)=>{if(p.dd!=null)return p.dd;let d=0;const g=p.sg;for(let i=0;i<g.length;i++){const a=g[i].t,b=i+1<g.length?g[i+1].t:1e9;if(t<=a)break;d+=g[i].v*(Math.min(t,b)-a)}return d};
const pedSeg=(p,t)=>{let c=p.sg[0];for(const g of p.sg)if(t>=g.t)c=g;return c};
const pedPos=(p,t)=>{const q=p.path(Math.min(p.off+pedD(p,t),Math.min(p.len,p.path.len)-.06));return[q[0]+(p.ox||0),q[1]+(p.oz||0),q[2]]};
// ---------- 对面直行车流（两条车道，向 -z 开）：tc＝车身中心经过你路线的时间 ----------
// sc：这一局的情况。K＝L1 只有车流；RT 右转车；BK 视线被挡；PW 行人；BI 自行车；Y 等候时变黄；Y7 到路口前变黄；LC 你是第二辆
function makeOpp(sc){const L=[],v0=()=>Math.random()<.12?18.06:16.67,lane=()=>Math.random()<.5?-6.25:-9.75;let t=-1;const push=tt=>L.push({lane:lane(),tc:tt,v:v0()});
 const G={};
 if(sc.LC){G.a0=6.2+Math.random()*1.5;G.a1=G.a0+6.5}      /* 你是第二辆：前车在路口里等，等你开上来停下后，用这个空档转走 */
 const skipLC=tt=>sc.LC&&tt>G.a0-.6&&tt<G.a1;
 if(sc.Y){while(t<sc.Ty+16){t+=1.3+Math.random()*1.5;if(!skipLC(t))push(t)}      // 一直很密，等不到空档
  if(sc.rush){      /* 困难模式：1～2 辆车黄灯时加速抢灯。最后一辆：车头过白线时还是黄灯，车尾过白线时已经红灯 */
   const ln=-6.25,ln2=-6.25,/* 都走内侧车道：外侧车道有右转车减速会挡住 */add=(lane,dz)=>{const v=16.67,tc=sc.Ty+(OSZ+dz-ZC0[lane])/v;for(let i=L.length-1;i>=0;i--)if(L[i].lane===lane&&Math.abs(L[i].tc-tc)<1.3)L.splice(i,1);L.push({lane,tc,v,rush:1})};
   add(ln,34.3+Math.random()*.6);if(sc.rush>1)add(ln2,11+Math.random()*3);L.sort((a,b)=>a.tc-b.tc)}
  L.forEach(s=>{const z=ZC0[s.lane]+s.v*(s.tc-sc.Ty);if(s.rush||z>0&&z<OSZ+s.v*s.v/9+3)s.run=true});      // 黄灯时离停车线太近、停不下来的车照直开过去（等它们过去才能转）
  return{list:L,G}}
 const G1=sc.LC?G.a1+9+Math.random()*3:17+Math.random()*3;      /* 你慢慢溜进路口大约要 15 秒；第二辆：前车走后你还要开进路口 */while(t<G1){t+=1.3+Math.random()*1.5;if(skipLC(t)){t=G.a1;push(t)}else push(t)}
 t+=3.6+Math.random()*.8;push(t);t+=1.4+Math.random();push(t);      // 一个看起来像空档、其实不够的 4 秒间隔
 const len=(sc.RT||sc.PW||sc.BI)?13+Math.random()*2:8.5+Math.random()*1.5;G.s=t;G.e=t+len;t+=len;push(t);      // 足够的空档（有右转车、行人、自行车时更长）
 while(t<G.e+30){t+=1.4+Math.random()*1.5;push(t)}
 return{list:L,G}}
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;
 const hard=DIFF==='hard',P=a=>a[Math.random()*a.length|0];
 let sc={};
 if(hard){sc={BK:1,RT:1,PW:1,BI:Math.random()<.6,Y:Math.random()<.8,LC:Math.random()<.4,BKS:Math.random()<.5};      /* BKS：我们这边直行车一直很密，对面左转车一直走不了，一直挡着你的视线 */      /* 困难模式：约 80% 的局会变黄灯 */}
 else{const ks=['K','RT','BK','PW','BI','Y','Y7','LC','LC','LC'].filter(k=>k!==LASTK);const k=P(ks);LASTK=k;sc[k]=1}
 if(typeof FORCE!=='undefined'&&FORCE)sc=Object.assign({},FORCE);      // 测试用
 if(sc.Y){sc.Ty=23+Math.random()*3;sc.run=hard||Math.random()<.5;if(hard&&sc.rush==null)sc.rush=Math.random()<.5?2:1}
 const OP=makeOpp(sc),G=OP.G;
 const U0=uAt(sc.Y7?-105:-75);
 usePath('N');R={t:0,u:U0,v:11,mode:'go',PK:'N',over:false,sc,G,ev:[],light:'g',sig:false,sigChk:false,lookT:-1,scT:-1,yaw:0,pit:0,stT:0,hitT:null,lastScan:null,peds:[],OC:[],SD:[],XQ:[],honked:false,cmtArm:true};
 R.OC=OP.list.map(s=>{const c=car(C[1+Math.random()*8|0]);live.push(c);return Object.assign(s,{c,z:ZC0[s.lane]+s.v*s.tc,cv:s.v})});
 // 你前面的左转车（你是第二辆）
 if(sc.LC){const c=car(C[[3,5,7][Math.random()*3|0]]);live.push(c);R.LC={c,u:U0+38,v:11,st:'drive',goAt:G.a0+.3}}
 // 对面在路口里等左转的大车（挡住你看对面外侧车道）
 if(sc.BK){const c=car(0xd8d8d0);c.scale.set(1.15,1.7,1.12);live.push(c);let us=0,uw=0;for(let u=0;u<200;u+=.05){const q=BKP(u);if(!us&&q[1]<=OSZ+.3)us=u;if(!uw&&Math.abs(normA(q[2]-Math.PI))>=.55){uw=u;break}}R.BK={c,us,uw,u:us-50,v:11,go:false,goAt:sc.Y?sc.Ty+2.8:sc.BKS?1e9:G.s+.6}}      // 对面左转车：从它的左转专用道开过来，也做 S-shift，停在和你对称的位置
 // 我们这个方向的直行车（在你右边的两条直行车道）：对面左转车要等它们有空档才能转
 {const L=[],gap=sc.BKS?()=>1.3+Math.random()*1.3:()=>1.5+Math.random()*3.5,w=R.BK&&!sc.BKS&&!sc.Y?[R.BK.goAt-1.5,R.BK.goAt+7]:null;let t=-9;
  while(t<65){t+=gap();if(w&&t>w[0]&&t<w[1])t=w[1];L.push(t)}
  R.SD=L.map(tc=>{const c=car(C[1+Math.random()*8|0]);live.push(c);const v=Math.random()<.12?18.06:16.67;return{c,lane:Math.random()<.5?6.25:9.75,z:SDZ-16.67*tc,v,cv:16.67}})}
 // 对面右转车：在大空档开始时到达，打右转灯，慢下来转进西边道路
 if(sc.RT){const c=car(C[1+Math.random()*8|0]);live.push(c);c.userData.bl.forEach(m=>m.position.x=-m.position.x);const tA=sc.Y?sc.Ty-.5+Math.random()*3:G.s+.4;      /* 黄灯情况：右转车有时刚好赶上黄灯开过去，有时还没到停车线、停下来 */R.RT={c,u:Math.max(0,150-30-16*tA+8),v:16,gone:false,t0:tA-7.5}}      // 大约 tA 时开到停车线附近
 // 行人：西边人行横道（你要转入的那条路），本方绿灯，他们有路权
 if(sc.PW){const n=hard?2:P([1,1,2]);for(let i=0;i<n;i++){const S=Math.random()<.5,x=-16.75+(i?(S?.35:-.35):0),v=1.25+Math.random()*.3,o=ped(PCOL[Math.random()*5|0]);live.push(o);
   const tMeet=(sc.Y?sc.Ty-11:G.s-3.5)+i*1.2+Math.random()*1.5,pts=S?[[x,-hwX-1.7],[x,hwX+1.7],[x,150]]:[[x,hwX+1.7],[x,-hwX-1.7],[x,-150]];      // 大约 tMeet 时走到你的路线（z≈2.75）
   const pp={k:'W',dir:S?1:-1,o,path:path(pts),len:170,sg:[{t:0,v}],off:0},d0=S?hwX+1.7+2.75:hwX+1.7-2.75;pp.off=Math.max(0,d0-v*tMeet);
   if(d0-v*tMeet<0){pp.sg=[{t:0,v:0},{t:tMeet-d0/v,v}]}R.peds.push(pp)}}
 // 自行车：对面自行车道（x=-8.75）直行过来
 if(sc.BI){const o=cyclist(PCOL[Math.random()*5|0]);live.push(o);const v=5+Math.random(),tMeet=sc.Y?sc.Ty-6:G.s+1+Math.random()*2;
  R.peds.push({k:'K',o,bike:true,path:path([[-12.25,150],[-12.25,-150]]),len:300,sg:[{t:0,v}],off:Math.max(0,150-ZC0[-12.25]-v*tMeet)})}
 // 横向等红灯的车（两边各两条车道）：只有黄灯情况下横向变绿后才开
 [[-1,-6.25],[-1,-9.75],[1,6.25],[1,9.75]].forEach((a,i)=>{const c=car(C[[2,4,6,8][i]]);live.push(c);R.XQ.push({c,dir:-a[0],z:a[1],x:a[0]*(hwM+10.1),h:a[0]<0?Math.PI/2:-Math.PI/2,cv:0})});
 {const fc=car(C[Math.random()*9|0]);live.push(fc);R.fol={car:fc,u:R.u-16,v:R.v}}
 setHeads(HEADS,'g');setHeads(CHEADS,'r');setArrow('off');banner('绿灯左转','');setPedSig('M','walk');setPedSig('X','hand');
 gt=0;mk();$('sp').textContent='0'}
function setHeads(L,c){L.forEach(lm=>{for(const k of ["r","y","g"])lm[k].m.material=k===c?lm[k].on:lm[k].off})}
function banner(t,col){const b=$('bn');b.textContent=t;b.style.color=col}
function setLight(c){R.light=c;setHeads(HEADS,c);banner({g:'绿灯左转',y:'黄灯！',r:'红灯'}[c],{g:'',y:'#ffc21a',r:'#ff5a5a'}[c])}
function mk(){const on={sig:!!R.sig,turn:R.mode==='go',stopN:R.mode==='stop',stopS:R.mode==='enter'};document.querySelectorAll('.b').forEach(b=>b.classList.toggle('on',!!on[b.dataset.m]))}
function flash(t){const f=$('fl');f.textContent=t;f.style.opacity=1;clearTimeout(flash.h);flash.h=setTimeout(()=>f.style.opacity=0,1800)}
// ---------- 提示 ----------
const TXT={
 sig:["转弯前没有打左转灯","左转前一定要打左转灯，一般在停车线前约 30 米就打开。"],
 sigL:["左转灯打得太晚","离停车线不到 15 米才打左转灯，后车和对面的车来不及反应。"],
 wheels:["待转时没有车正轮正","在路口里等候左转时，车身要摆正、车轮朝正前方。你停下来时车头已经往左歪了（车轮已经打了方向），如果被后车追尾，会被推进对面的车流。不要提前开始转弯，停在路口里车正轮正地等。"],
 noEnter:["延误交通：没有进入路口等候","你是第一辆左转车，绿灯时应该开过停车线，进入路口里等候（车头大约在路口中间前面，车轮朝正前方）。停在停车线后面等，会延误后面的车，也更难找到空档。"],
 enter2:["前车还在路口里等，你也跟着开进了路口","一次只能有一辆左转车在路口里等候。前面已经有车在路口里等左转时，你要停在停车线后面，等它转走了再开进路口。"],
 noScanL:["转弯前没有观察路口","左转前要按“观察路口”看一眼左边——你要转入那条路的人行横道上有没有行人，再确认对面车流的空档。"],
 yieldO:["没有让行对面直行车","对面直行车的空档不够你就转了。左转要让对面直行车：两条车道都要看，要等到两条车道都有足够的空档（你能在对面车到达之前完全转过去）再转。"],
 sameLT:["对面左转车先转了，你也同时起步","对面在路口里等的左转车已经先开始转了，它的路线会从你车头前经过。要等它转过你的车头再走，否则两车会撞上。"],
 yieldRT:["没有让行对面右转车","对面有车打着右转灯，要转进你要去的同一条路。对面右转车比你优先，要等它转完（或者确认它停下来让行人），两车不要同时转进同一条路。"],
 yieldBk:["没有让行对面直行的自行车","对面自行车道里有自行车直行过来。自行车和对面直行车一样有路权，要等它过去再转。"],
 yieldPL:["有行人还开始转弯","你要转入那条路的人行横道上有行人正在过（或者正要从你这一侧走过来）。左转要先确认能让行人、同时对面直行车有空档，两样都满足才转；有行人就在路口里原地等。"],
 stuckO:["转到一半停下，挡在对面直行车道上","你已经开始转弯，却停在了对面的车道上，挡住了对面直行车，非常危险，也会堵塞交通。开始转之前就要确认行人和对面车流都允许你一次转过去。"],
 stuckRed:["变红后还停在路口里","你已经在路口里等候，灯变黄、变红后，对面的车停下来了，你应该尽快完成左转、离开路口。停在路口里不走，会挡住横向的车。"],
 yelIn:["黄灯时开进了路口","灯变黄时你离停车线还有足够的距离，能安全停下，就应该停在停车线后面，不要再开进路口。"],
 redIn:["闯红灯","红灯时越过了停车线。"],
 crash:["发生碰撞","你的车和其他车辆撞上了。没有让行、抢着转弯，就会造成碰撞，路考立即结束。"],
 hitP:["撞到了行人","你的车撞到了正在过马路的行人。"],
 hitB:["撞到了自行车","你的车撞到了对面骑过来的自行车。"]};
const SER=['sameLT','yieldO','yieldRT','yieldBk','yieldPL','stuckO','stuckRed','redIn','crash','hitP','hitB'];
function snap(){const c=document.createElement('canvas');c.width=280;c.height=200;const x=c.getContext('2d'),X=a=>(a+31)*4.5,Y=a=>(22-a)*4.5;
 x.fillStyle='#7bbf52';x.fillRect(0,0,280,200);x.fillStyle='#6c6c75';x.fillRect(X(-hwM),0,hwM*9,200);x.fillRect(0,Y(hwX),280,hwX*9);
 x.fillStyle='#f3f3f3';for(let i=0;i<2*hwX;i++)x.fillRect(X(-hwM-5.5),Y(-hwX+i+.5),15.75,2.25);for(let i=0;i<26;i++)x.fillRect(X(-13+i),Y(-hwX-2),2.25,15.75);
 x.fillStyle='#9b9da3';x.fillRect(X(-1),Y(-hwX-6),9,200)
 const cr=(q,col,l,w)=>{x.save();x.translate(X(q[0]),Y(q[1]));x.rotate(q[2]);x.fillStyle=col;x.fillRect(-(w||4.3),-(l||10),2*(w||4.3),2*(l||10));x.restore()};
 R.peds.forEach(p=>{const a=pedPos(p,R.t);x.fillStyle='#ff8a1f';x.beginPath();x.arc(X(a[0]),Y(a[1]),4,0,7);x.fill()});
 R.OC.forEach(s=>{if(!s.gone&&Math.abs(s.z)<45)cr([s.lane,s.z,Math.PI],'#eceff1')});
 if(R.BK){const q=BKP(R.BK.u);cr(q,'#d8d8d0',12,5)}if(R.RT&&!R.RT.gone)cr(ORT(R.RT.u),'#ffd28a');if(R.LC)cr(PK.S.p(R.LC.u),'#9aa4b5');
 cr(myPath(R.u),'#2e6fd6');return c.toDataURL()}
function ev(key,tk){if(R.ev.some(e=>e.key===key))return;const t=TXT[tk||key];R.ev.push({key,tk:tk||key,title:t[0],text:t[1],img:snap3D()||snap()});flash(t[0])}
// ---------- 冲突判断 ----------
// 你从现在开始一直开，车尾离开某条对面车道要多久
function tClear(L){let u=R.u,v=R.v,t=0;while(t<12){const a=myPath(u);if(a[0]-2.35*Math.sin(a[2])<L-1.9)return t;const vt=vGo(u);v=Math.min(vt,v+2.5*.05);u+=v*.05;t+=.05}return t}
function oppConf(){const tc={};let n=0;
 R.OC.forEach(s=>{if(s.gone||s.stop)return;const zc=ZC[s.lane];if(s.z+2.35<zc-1.3)return;      // 已经开过去了，或者黄灯红灯时正在停车线前停下
  if(tc[s.lane]==null)tc[s.lane]=tClear(s.lane);const tA=(s.z-2.35-(zc+1.3))/Math.max(.5,s.cv);if(tA<tc[s.lane]+.8)n++});return n}
function sdClear(){return R.SD.every(s=>s.gone||s.z>SDZ+3.5||(s.stop&&s.z<SDS+.5)||(SDZ-3.5-s.z)/Math.max(.5,s.cv)>4.5)}      // 对面左转车穿过我们这边两条直行车道：要有约 4.5 秒的空档
const rtAct=()=>R.RT&&!R.RT.gone&&!R.RT.stop&&ORT(R.RT.u)[0]>-22&&ORT(R.RT.u)[1]<45;
function bikeConf(){return R.peds.some(p=>{if(!p.bike||p.hit)return false;const c=pedPos(p,R.t),zc=ZC[-12.25];if(c[1]<zc-1.5)return false;return (c[1]-(zc+1.2))/p.sg[0].v<tClear(-12.25)+.8})}
const walking=p=>p.dd!=null||pedSeg(p,R.t).v>0;
const pedConf=p=>{if(p.bike||p.hit||!walking(p))return false;const c=pedPos(p,R.t);if(c[0]<-19.8||c[0]>-13.7)return false;if(c[1]>hwX-.2||c[1]<-hwX+.2)return false;return p.dir>0||c[1]>0};      // 已经走上人行道（路边 z=±9.5）的不算      /* 和绿灯右转一样：从对面（北边）走来的行人过了路中线就可以转；从你这一侧（南边）走过去的行人要走到对面人行道上 */
// ---------- 操作 ----------
function cmd(m){if(!playing||R.over||R.crash||R.u>=ce+1)return;if(m==='look')return;
 if(m==='sig'){R.sig=!R.sig;$('sg').style.display=R.sig?'block':'none';if(R.sig){tick(true);if(R.sigU==null)R.sigU=R.u}mk();return}
 if(m==='scan'){R.scT=0;R.scRel=null;yawD=0;R.scQ=R.u>=uS-3;R.scHold=true;return}
 // 和绿灯右转一样：不按停车，车就一直开进路口、转弯；玩家决定什么时候停、停在哪里。玩家不能打方向盘，所以 S-shift 单独一个键：出白线前按，系统做 S-shift 并停在等候点
 if(m==='stopN')m='stop';
 if(m==='stopS'){if(R.u<uDiv-.3&&R.mode!=='enter'){usePath('S');R.PK='S';m='enter'}else return}
 if(m==='turn')m='go';      // 行驶
 if(m===R.mode)return;
 if(m==='stop'){R.stopA=Math.max(3.5,Math.min(7,R.v*R.v/12));R.stopT=R.u+R.v*R.v/(2*R.stopA)}      // 从现在的位置正常刹车停下
 R.mode=m;mk()}
function cmdUp(m){if(m!=='scan'||!R||!R.scHold)return;R.scHold=false}
// 开进路口等候：到停车线前减到很慢，出白线后极慢地溜出去做 S-shift，到等候点停住（约 6 km/h）
// 默认（不按停车）的车速：快到路口时慢下来，顺着弧线转
const vGo=u=>u<uS-20?11:u<cs?Math.max(5.2,11-(u-(uS-20))*.3):5.2+4.3*ss(cs+.4*(ce-cs),ce+6,u);      // 转弯时约 19 km/h，后半段（斜进目标车道后）边回正边加速
const crawl=(u,uw)=>{uw=uw||uW;      // enter：开到停车线再慢慢溜进路口等候点
 return u<uS?Math.min(11,Math.sqrt(2*2.2*Math.max(0,uS-u))+1.7):u<uw?Math.min(1.7,Math.sqrt(2*1.2*Math.max(0,uw-u))+.05):0};
// ---------- 每一帧 ----------
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;let v=R.v,u=R.u,m=R.mode;const sc=R.sc;
 lights();
 // 你的车：drive＝开到路口里等候点停住；go＝转弯；stop＝停车
 let vt=11;
 if(m==='enter')vt=crawl(u);
 else if(m==='go')vt=vGo(u);
 if(R.LC&&m!=='stop'){const g=R.LC.u-u-7;vt=Math.min(vt,Math.max(0,g*1.5));}
 /* 你是第二辆：前车在路口里等时不再自动停车，由玩家自己决定停在哪里（正确：白线后） */
 if(m==='stop'){const dS=R.stopT-u;v=dS>.05?Math.min(v,Math.sqrt(2*R.stopA*dS)):0;if(R.LC)v=Math.min(v,Math.max(0,(R.LC.u-u-6.5)*1.5))}
 else v=v>vt?Math.max(vt,v-4*dt):Math.min(vt,v+2.5*dt);
 if(v<.02)v=0;
 u+=v*dt;R.v=v;R.u=u;
 const a=myPath(u),f=front(u);
 if(v===0&&(m==='enter'&&u>=uW-.3||m==='stop'&&front(u)[1]>SL)&&u<cs&&R.atW==null)R.atW=R.t;      // 停在路口里等候
 // 过停车线：黄灯、红灯
 if(!R.lineX&&f[1]>SL){R.lineX=R.t;if(R.light==='y'&&R.yD>13)ev('yelIn');if(R.light==='r')ev('redIn');
  if(R.LC&&R.LC.st!=='go')ev('enter2')}
 if(R.lineT==null&&u>=uS-3)R.lineT=R.t;
 // 第一辆左转车：绿灯时停在停车线后面不进路口
 const firstCar=!R.LC||R.LC.st==='go';
 if(v===0&&f[1]<SL&&R.light==='g'&&firstCar){R.neT=(R.neT||0)+dt;if(R.neT>3.5){ev('noEnter');if(!R.hkT||R.t-R.hkT>4){R.hkT=R.t;honk()}}}else R.neT=0;      // 后车按喇叭催
 // 开始转弯的那一刻：检查对面车、右转车、自行车、行人、有没有观察
 if(m==='go'&&f[0]<-3.4&&v>.05&&R.cmtArm){      // 车头开始伸向对面车道：真正开始转弯的那一刻
 R.cmtArm=false;R.cmt=true;
if(oppConf())ev('yieldO');if(rtAct())ev('yieldRT');if(bikeConf())ev('yieldBk');if(R.peds.some(pedConf))ev('yieldPL');
  if(!(R.lastScan!=null&&R.lastScan>=(R.lineT==null?R.t:R.lineT)-.5))ev('noScanL')}
 if(R.cmt&&v===0)R.cmtArm=true;
 // 在路口里停下等候时车身已经歪了（车轮已经往左打）：没有车正轮正
 if(v===0&&m==='stop'&&f[1]>SL&&f[0]>-3.4&&!R.cmt&&R.light==='g'&&Math.abs(a[2])>.1){R.wsT=(R.wsT||0)+dt;if(R.wsT>1)ev('wheels')}else R.wsT=0;
 // 转到一半停在对面车道上
 if(R.cmt&&v===0&&a[0]<-4&&a[0]>-13&&!R.crash&&R.hitT==null){R.stO=(R.stO||0)+dt;if(R.stO>.6)ev('stuckO')}else R.stO=0;
 // 转弯时车头压进人行横道，前面有行人
 if(v>.3&&f[0]<-14.8&&a[0]>-20.5)R.peds.forEach(p=>{if(!pedConf(p))return;const c=pedPos(p,R.t);if(Math.abs(c[1]-a[1])<3.4)ev('yieldPL')});      // 转弯时车头进了人行横道：只算还没让完的行人（对面来的过了中线、你这侧的上了人行道都不算）
 // 变红后还停在路口里
 if(R.light==='r'&&f[1]>SL&&u<ce&&v===0&&!R.crash){const mov=R.OC.some(s=>!s.gone&&!s.stop&&s.cv>.5&&s.z+2.35>ZC[s.lane]-1.3&&s.z<40)||rtAct()||bikeConf()||R.peds.some(pedConf);      /* 还有车、自行车或行人要让，就不算 */R.srT=mov?0:(R.srT||0)+dt;if(R.srT>2.5)ev('stuckRed')}
 // 撞到行人或自行车
 R.peds.forEach(p=>{if(p.hit)return;const c=pedPos(p,R.t),dx=c[0]-a[0],dz=c[1]-a[1],fw=dx*Math.sin(a[2])+dz*Math.cos(a[2]),lat=dx*Math.cos(a[2])-dz*Math.sin(a[2]);
  if(Math.abs(fw)<2.45&&Math.abs(lat)<1.05&&v>.4){p.hit=true;p.dd=pedD(p,R.t);p.sg=[{t:0,v:0}];ev(p.bike?'hitB':'hitP');R.mode=m='stop';R.stopA=7;R.stopT=u+v*v/14;R.hitT=R.t;mk()}});
 if(R.hitT!=null&&R.t-R.hitT>3){finish();return}
 if(R.crash&&R.t-R.crash.t>3){finish();return}
 // 还在路口角上等着要过街的行人：你的车正在穿过人行横道时，他们先不走
 {const busy=R.cmt&&u<ce+6&&a[0]>-23;      // 你已经开始转弯
 R.peds.forEach(p=>{if(p.bike||p.hit)return;
  if(p.dd==null&&p.sg.length>1&&p.sg[0].v===0&&R.t<p.sg[1].t+.2){const s1=p.sg[1];if(busy&&R.t>=s1.t-.3)s1.t+=dt;return}
  const c=pedPos(p,R.t),toward=p.dir*c[1]<0;      // 还在人行道上、正要走上人行横道
  if(busy&&Math.abs(c[1])>hwX-.2&&Math.abs(c[1])<hwX+1.9&&toward&&walking(p)){if(p.dd==null){p.dd=pedD(p,R.t);p.wv=pedSeg(p,R.t).v}p.hold=true}else p.hold=false})}
 // 行人：被你的车挡住就停下等一会儿，再绕过去
 R.peds.forEach(p=>{if(p.bike||p.hit)return;const n=p.path(p.off+pedD(p,R.t)+1.6),dx=n[0]-a[0],dz=n[1]-a[1],blk=Math.abs(dx*Math.sin(a[2])+dz*Math.cos(a[2]))<2.6&&Math.abs(dx*Math.cos(a[2])-dz*Math.sin(a[2]))<1.3;
  if(p.dd==null&&!(pedSeg(p,R.t).v>0&&blk))return;if(p.dd==null){p.dd=pedD(p,R.t);p.wv=pedSeg(p,R.t).v}
  if(p.det){const D=p.det,z=p.path(p.off+p.dd)[1],uu=(z-D.zs)/(2*(D.zc-D.zs));p.dd+=p.wv*dt;if(uu>=1){p.ox=0;p.det=null}else p.ox=D.A*(.5-.5*Math.cos(2*Math.PI*Math.max(0,uu)));return}
  if(blk&&!p.free){p.bt=(p.bt||0)+dt;if(p.bt>1.6){const z0=p.path(p.off+p.dd)[1];let zc=a[1];if((zc-z0)*p.dir<1.5)zc=z0+1.5*p.dir;
    const px=p.path(p.off+p.dd)[0],A1=Math.min(-1.2,f[0]-1.3-px),A2=a[0]-2.35*Math.sin(a[2])+1.3-px;p.det={zs:z0,zc,A:Math.abs(A1)<=Math.abs(A2)?A1:A2};p.free=true}}
  else if(!p.hold)p.dd+=p.wv*dt});
 // 对面直行车：按时间表开；跟前车；黄灯能停的停；你的车开进它的车道，约 0.7 秒后才刹车
 
 R.OC.forEach(s=>{if(s.gone)return;if(s.crash){s.cv=0;return}let vt=s.v;
  R.OC.forEach(o=>{if(o!==s&&!o.gone&&o.lane===s.lane&&o.z<s.z&&s.z-o.z<16)vt=Math.min(vt,Math.max(0,(s.z-o.z-7)*1.5))});
  if(s.lane===-9.75&&R.RT&&!R.RT.gone){const q=ORT(R.RT.u);if(q[0]>-11.3&&q[1]<s.z&&s.z-q[1]<24)vt=Math.min(vt,Math.max(0,(s.z-q[1]-7)*1.5))}
  if(s.rush&&R.Ty!=null)vt=19.5;      /* 抢黄灯：加速到约 70 km/h */
  if(s.stop)vt=Math.min(vt,Math.sqrt(7*Math.max(0,s.z-OSZ)));
  const g=s.z-a[1];if(Math.abs(a[0]-s.lane)<2.6&&g>0&&g<45){if(s.seeT==null)s.seeT=R.t;if(R.t-s.seeT>.7)vt=Math.min(vt,Math.max(0,(g-5.5)*1.3));if(g<22&&!R.honked){R.honked=true;honk()}}
  s.cv=s.cv>vt?Math.max(vt,s.cv-7*dt):Math.min(vt,s.cv+2.5*dt);s.z-=s.cv*dt;if(s.z<-170)s.gone=true});
 // 对面右转车：慢下来转弯，让人行横道上的行人
 if(R.RT&&!R.RT.gone&&R.t>=R.RT.t0){const T=R.RT,q=ORT(T.u);if(T.crash)T.v=0;else{let vt=q[1]>45?16:q[1]>16?Math.max(4.5,16-(45-q[1])*.45):4.5;if(q[0]<-23)vt=Math.min(11,4.5+(-23-q[0])*.4);if(T.stop)vt=Math.min(vt,Math.sqrt(14*Math.max(0,q[1]-OSZ)));
   const pb=R.peds.some(p=>{if(p.bike||p.hit||!walking(p))return false;const c=pedPos(p,R.t);return c[0]>-19.8&&c[0]<-13.7&&(c[1]>6&&c[1]<hwX+1||(p.dir>0&&c[1]>-hwX&&c[1]<=6))});
   if(pb&&q[0]>-12.3)vt=Math.min(vt,Math.sqrt(7*Math.max(0,q[0]+12.3)));      // 车头停在人行横道前
   T.v=T.v>vt?Math.max(vt,T.v-(T.stop?7:5)*dt):Math.min(vt,T.v+2.2*dt);T.u+=T.v*dt;if(q[0]<-85)T.gone=true}}
 // 对面在路口里等的大车：时机到了就左转
 // 我们这边的直行车：跟车；黄灯能停的停在停车线后；对面左转车挡在车道上时减速
 R.SD.forEach(s=>{if(s.gone)return;if(s.crash){s.cv=0;return}let vt=s.v;
  R.SD.forEach(o=>{if(o!==s&&!o.gone&&o.lane===s.lane&&o.z>s.z&&o.z-s.z<45)vt=Math.min(vt,Math.sqrt(o.cv*o.cv+2*5*Math.max(0,o.z-s.z-6.8)))});      /* 跟车：留够刹车距离，排队时车距约 2 米 */
  if(R.BK){const q=BKP(R.BK.u);if(Math.abs(q[0]-s.lane)<2.6&&q[1]>s.z&&q[1]-s.z<35)vt=Math.min(vt,Math.max(0,(q[1]-s.z-6)*1.3))}
  if(s.stop)vt=Math.min(vt,Math.sqrt(7*Math.max(0,SDS-s.z)));
  s.cv=s.cv>vt?Math.max(vt,s.cv-7*dt):Math.min(vt,s.cv+2.5*dt);s.z+=s.cv*dt;if(s.z>170)s.gone=true});
 if(R.BK&&!R.BK.crash){const B=R.BK;if(!B.go&&R.t>=B.goAt&&B.u>=B.uw-.5&&sdClear())B.go=true;      /* 对面左转车也要等我们这边直行车有足够空档才转 */      // 两车各自顺着弧线转，路线不交叉，可以同时转
  let vt=B.go?(BKP(B.u)[0]<14?7:9):B.u<B.us?Math.min(11,Math.sqrt(2*2.2*Math.max(0,B.us-B.u))+1.7):Math.min(3,Math.sqrt(2*1.5*Math.max(0,B.uw-B.u))+.05);B.v=B.v>vt?Math.max(vt,B.v-4*dt):Math.min(vt,B.v+2*dt);B.u+=B.v*dt}
 // 你前面的左转车
 if(R.LC){const L=R.LC,P=PK.S;let vt=11;if(L.st==='drive'){const us=uAt(SL-2.7);vt=L.u<us?11:Math.min(2.6,Math.sqrt(2*1.2*Math.max(0,P.uW-L.u))+.05);if(L.u>=P.uW-.3&&L.v<.1)L.st='wait'}
  if(R.v===0)R.stopAt=R.stopAt==null?R.t:R.stopAt;else R.stopAt=null;
  if(L.st==='wait'&&R.t>=L.goAt&&R.t<R.G.a1-3.5&&(R.stopAt!=null&&R.t-R.stopAt>.8||R.t>=L.goAt+2.5))L.st='go';      /* 前车等你开上来停下（或最多等 2.5 秒），趁空档转走 */
  if(L.st==="wait"&&R.t>=R.G.s+.3)L.st="go";      /* 万一错过了空档，就用后面那个大空档 */if(L.st==='wait')vt=0;if(L.st==='go')vt=L.u<P.cs-6?11:5.5+3*ss(P.ce-6,P.ce+14,L.u);
  L.v=L.v>vt?Math.max(vt,L.v-4*dt):Math.min(vt,L.v+2.2*dt);L.u+=L.v*dt;if(L.u>myLen-2)L.u=myLen-2}
 // 横向车：横向变绿后起步；你挡在它的车道上就不走
 const inBox=Math.abs(a[0])<hwM&&f[1]>-(hwX+7.75)&&a[1]<hwX+2&&u<ce;      // 你过了停车线、还在路口里      // 你还在路口里：横向的车看到了，先不走
 R.XQ.forEach(q=>{if(R.xgT==null||R.t<R.xgT+1.3||q.crash){q.cv=0;return}let vt=inBox&&q.dir*q.x<-(hwM+4)?0:16;const g=(a[0]-q.x)*q.dir;if(Math.abs(a[1]-q.z)<2.6&&g>0&&g<40)vt=Math.min(vt,Math.max(0,(g-6)*1.3));
  q.cv=q.cv>vt?Math.max(vt,q.cv-7*dt):Math.min(vt,q.cv+2*dt);q.x+=q.dir*q.cv*dt});
 // 转向灯
 if(!R.sigChk&&f[1]>SL){R.sigChk=true;if(!R.sig)ev('sig');else if(R.sigU>uS-12)ev('sig','sigL')}
 if(R.sig&&u>ce+2){R.sig=false;$('sg').style.display='none';mk()}
 // 观察路口：离路口远时左-右-左；到了停车线附近或在路口里，点一下看一眼左边，按住一直看
 if(R.scT>=0){R.scT+=dt;const sT=R.scT;
  if(R.scQ){if(R.scRel==null&&!R.scHold&&sT>.8)R.scRel=sT;const tg=R.scRel==null?-1.35:0;R.yaw+=(tg-R.yaw)*Math.min(1,dt*10);if(R.scRel!=null&&sT-R.scRel>.4){R.scT=-1;R.scRel=null;R.yaw=0}}
  else{const tg=sT<.55?-1.25:sT<1.25?1.05:sT<1.8?-1.25:0;R.yaw+=(tg-R.yaw)*Math.min(1,dt*10);if(sT>2.2){R.scT=-1;R.yaw=0}}
  if(sT>.3&&R.scT>=0)R.lastScan=R.t}
 // 在路口里等候时，司机会稍微偏头、身体往左探，看对面远处的直行车
 {const w=R.atW!=null&&v===0&&m!=='go'&&R.scT<0&&u<cs;R.lean=(R.lean||0)+((w?1:0)-(R.lean||0))*Math.min(1,dt*2.5)}
 // 和其他车相撞
 if(!R.crash){const me=[a[0],a[1],a[2],2.3,.95],O=[];
  R.OC.forEach(s=>{if(!s.gone)O.push([[s.lane,s.z,Math.PI,2.3,.95],s])});
  if(R.RT&&!R.RT.gone){const q=ORT(R.RT.u);O.push([[q[0],q[1],q[2],2.3,.95],R.RT])}
  if(R.BK){const q=BKP(R.BK.u);O.push([[q[0],q[1],q[2],2.6,1.1],R.BK])}
  if(R.LC){const q=PK.S.p(R.LC.u);O.push([[q[0],q[1],q[2],2.3,.95],R.LC])}
  R.XQ.forEach(q=>O.push([[q.x,q.z,q.h,2.3,.95],q]));R.SD.forEach(s=>{if(!s.gone)O.push([[s.lane,s.z,0,2.3,.95],s])});
  const H=O.find(o=>obbHit(me,o[0]));
  if(H){const o=H[1],b=H[0],side=Math.sign((a[0]-b[0])*Math.cos(b[2])-(a[1]-b[1])*Math.sin(b[2]))||1;o.crash=true;o.spin0=R.t;o.spinD=-side*(.25+Math.min(.25,(o.cv||o.v||0)*.02));o.spin=0;
   R.crash={t:R.t,o,v0:v};R.v=0;R.mode='stop';R.stopT=R.u;R.stopA=7;mk();crashSnd();ev('crash')}}
 if(R.crash){const o=R.crash.o;o.spin=o.spinD*Math.min(1,(R.t-o.spin0)/.35)}
 // 后车：你开进路口后，它停在停车线后面
 {const fo=R.fol;const gap=u-fo.u-4.6;let vt=Math.max(0,Math.min(11,2.2*(gap-2.5)));if(u<ce)vt=Math.min(vt,Math.sqrt(2*3*Math.max(0,uS-fo.u)));fo.v=fo.v>vt?Math.max(vt,fo.v-6*dt):Math.min(vt,fo.v+3*dt);fo.u=Math.min(fo.u+fo.v*dt,u-4.6)}
 // 结束
 if(sc.Y7&&R.light==='r'&&f[1]<SL&&R.t>R.Ty+5){finish();return}
 if(u>=UEND||R.t>90)finish()}
// ---------- 信号灯：黄灯情况 ----------
function lights(){const sc=R.sc,t=R.t,f=front(R.u);
 if(sc.Y7&&R.Ty==null){if(!R.p1&&f[1]>=-98-3.5){R.p1=1;setPedSig('M','flash')}if(R.p1===1&&f[1]>=-74-3.5){R.p1=2;setPedSig('M','hand')}if(f[1]>=-48.5){R.Ty=t;R.yD=SL-f[1]}}      // 到停车线前约 28 米时变黄
 if(sc.Y&&R.Ty==null){if(!R.p1&&t>=sc.Ty-5){R.p1=1;setPedSig('M','flash')}if(R.p1===1&&t>=sc.Ty-3){R.p1=2;setPedSig('M','hand')}if(t>=sc.Ty){R.Ty=t;R.yD=SL-f[1]}}
 if(R.Ty==null)return;
 if(R.light==='g'){setLight('y');R.OC.forEach(s=>{if(s.z-OSZ<=s.cv*s.cv/9+1&&s.z>0)s.run=true})}      // 黄灯时已经离停车线很近、停不下来的车照直开过去
 if(R.light!=='g')R.SD.forEach(s=>{if(!s.run&&!s.stop){if(SDS-s.z>s.cv*s.cv/9+1)s.stop=true;else if(s.z<SDS+3)s.run=true}});      /* 我们这边的直行车：黄灯能停的停 */
 if(R.light!=='g'){R.OC.forEach(s=>{if(s.run&&!s.rush&&s.z-OSZ>s.cv*s.cv/9+.5){s.run=false}if(!s.run&&!s.stop&&s.z-OSZ>s.cv*s.cv/9+1)s.stop=true});      // 原来停不下的车被前车挡慢了、现在能停：也停      // 黄灯、红灯：还没到停车线、能安全停下的直行车和右转车都要停（后来才开到的车也一样）
  if(R.RT&&!R.RT.gone&&!R.RT.stop&&!R.RT.go){const q=ORT(R.RT.u);if(q[0]>-9.8&&q[1]-OSZ>R.RT.v*R.RT.v/14+.3)R.RT.stop=true;else R.RT.go=true}}      // 对面右转车车头还没过它的停车线：停（它转弯前车速很慢，基本都停得住）；已经过线、进了路口：正常转完
 if(R.light==='y'&&t>=R.Ty+2)setLight('r');
 if(R.xgT==null&&t>=R.Ty+4){R.xgT=t;setHeads(CHEADS,'g');setPedSig('X','walk')}}
function cardsHtml(list){return'<div class="cards">'+list.map(e=>`<div class="card"><img src="${e.img}"><b>${e.title}${SER.includes(e.tk)?'<span class="tag s">严重</span>':'<span class="tag">扣分项</span>'}</b><span>${e.text}</span></div>`).join('')+'</div>'}
function finish(){R.over=true;R.sig=false;$('sg').style.display='none';mk();const o=$('ov');let h;
 const turned=R.u>=ce;
 if(!R.ev.length)h=turned?'<h2>驾驶总结</h2><div class="st">★★★</div><p>进入路口等候，看清对面车流、右转车和行人，空档足够再转，绿灯左转处理得很好。</p>':R.sc.Y7&&R.light==='r'?'<h2>驾驶总结</h2><div class="st">★★★</div><p>灯变黄时你离停车线还有足够距离，停在了停车线后面，处理正确。</p>':'<h2>驾驶总结</h2><p>你一直没有完成左转。</p>';
 else h='<h2>驾驶总结</h2><p>这一趟有 '+R.ev.length+' 处需要注意：</p>'+cardsHtml(R.ev);
 o.innerHTML=`<div class="pn">${h}<br><button id="again">再来一次</button> <button id="home" style="background:#6b7280">回到首页</button></div>`;o.style.display='flex';
 $('again').onclick=()=>{o.style.display='none';newRun(true);playing=true};$('home').onclick=()=>{o.innerHTML=HOME;o.style.display='flex';bindHome()}}
// ================= 渲染循环 =================
let last=0,fovH=110;
function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;step(dt);const t=R.t,bl=Math.sin(ts/1000*15)>0;
 R.OC.forEach(s=>{place(s.c,s.lane,s.z,Math.PI+(s.spin||0));s.c.visible=!s.gone&&s.z<170});
 if(R.RT){const q=ORT(R.RT.u);place(R.RT.c,q[0],q[1],q[2]+(R.RT.spin||0));R.RT.c.visible=!R.RT.gone;R.RT.c.userData.bl.forEach(m=>m.visible=bl&&q[0]>-20)}
 if(R.BK){const q=BKP(R.BK.u);place(R.BK.c,q[0],q[1],q[2]+(R.BK.spin||0));R.BK.c.userData.bl.forEach(m=>m.visible=bl&&q[0]<19)}
 if(R.LC){const q=PK.S.p(R.LC.u);place(R.LC.c,q[0],q[1],q[2]+(R.LC.spin||0));R.LC.c.userData.bl.forEach(m=>m.visible=bl&&q[0]>-19)}
 R.XQ.forEach(q=>{place(q.c,q.x,q.z,q.h+(q.spin||0));q.c.visible=Math.abs(q.x)<170});
 R.SD.forEach(s=>{place(s.c,s.lane,s.z,s.spin||0);s.c.visible=!s.gone&&s.z>-170});
 R.peds.forEach(p=>{const q=p.path(Math.min(p.off+pedD(p,t),Math.min(p.len,p.path.len)-.06));p.o.visible=true;place(p.o,q[0]+(p.ox||0),q[1]+(p.oz||0),q[2],.1);
  if(p.hit){p.o.rotation.order='YXZ';if(p.bike){p.o.rotation.z=Math.min(1.45,(p.o.rotation.z||0)+.12);p.o.position.y=.15}else{p.o.rotation.x=Math.max(-1.45,(p.o.rotation.x||0)-.12);p.o.position.y=.2}return}
  const sp=p.bike?p.sg[0].v:(p.dd!=null&&p.dd===p.ldd?0:pedSeg(p,t).v),s=sp?Math.sin(t*(sp*5+2))*(.45+sp*.1):0,u=p.o.userData;p.ldd=p.dd;
  if(p.bike){u.wh.forEach(w=>w.rotation.x=-t*sp/.36);u.l.rotation.x=-.3;u.r.rotation.x=-.3}else{u.l.rotation.x=s;u.r.rotation.x=-s;u.al.rotation.x=-s*.8;u.ar.rotation.x=s*.8}});
 pedSigTick(ts);
 if(R.fol){const fq=myPath(R.fol.u);place(R.fol.car,fq[0],fq[1],fq[2])}
 if(R.sig&&playing&&!R.over){const on=Math.sin(ts/1000*9.4)>0;$('sg').style.opacity=on?1:.15;if(on!==loop.sgOn){loop.sgOn=on;tick(on)}}
 const q=myPath(R.u);place(mine,q[0],q[1],q[2]);mine.userData.bl.forEach(m=>m.visible=!!R.sig&&bl);
 if(view===1){const ln=R.lean||0,h=q[2]+R.yaw+yawD-.2*ln,L=R.scT>=0?14:10;cam.fov=Math.min(105,2*Math.atan(Math.tan(fovH*Math.PI/360)/cam.aspect)*180/Math.PI);cam.updateProjectionMatrix();const ox=(.38+.14*ln)*Math.cos(q[2]),oz=(.38+.14*ln)*Math.sin(q[2]),bx0=-q[0]+Math.sin(q[2])*.2,bz0=q[1]-Math.cos(q[2])*.2;const sk=R.crash&&R.t-R.crash.t<.7?(1-(R.t-R.crash.t)/.7)*.12:0;cam.position.set(bx0+ox+(Math.random()-.5)*sk,1.25+(Math.random()-.5)*sk,bz0+oz+(Math.random()-.5)*sk);
  cam.lookAt(-q[0]-Math.sin(h)*L+ox,1.25+L*.05+R.pit*L,q[1]+Math.cos(h)*L+oz);
  cockpit.visible=true;cockpit.position.set(bx0,1.25,bz0);cockpit.rotation.y=-q[2];
  const dh=normA(q[2]-lastH)/Math.max(dt,.001);lastH=q[2];wheel.rotation.z+=((Math.max(-2.6,Math.min(2.6,dh*2.4)))-wheel.rotation.z)*Math.min(1,dt*10)}
 else{cockpit.visible=false;if(cam.fov!==62){cam.fov=62;cam.updateProjectionMatrix()}cam.position.set(0,90,-12);cam.lookAt(0,0,0)}      /* 俯视：固定从本方向（南边）往前看，不能转 */
 $('sp').textContent=Math.round(R.v*3.6);if(cluster)cluster(Math.round(R.v*3.6));
 if(view===1&&((loop.fc=(loop.fc||0)+1)&1)===0){const m=MR[(loop.fc>>1)%MR.length],sa=ren.shadowMap.autoUpdate;cockpit.updateMatrixWorld(true);
  m.c.position.copy(cockpit.localToWorld(m.pos.clone()));m.c.lookAt(m.c.position.clone().add(m.dir.clone().transformDirection(cockpit.matrixWorld)));
  cockpit.visible=false;ren.shadowMap.autoUpdate=false;ren.setRenderTarget(m.rt);ren.render(scene,m.c);ren.setRenderTarget(null);ren.shadowMap.autoUpdate=sa;cockpit.visible=true}
 ren.render(scene,cam);requestAnimationFrame(loop)}
rs();newRun(false);setView(1);requestAnimationFrame(loop);
const HOME=$('ov').innerHTML;
function bindHome(){document.querySelectorAll('.md').forEach(b=>b.onclick=()=>{DIFF=b.dataset.diff||'easy';LASTK=null;$('ov').style.display='none';newRun(true);playing=true})}
bindHome();
$('hm').onclick=()=>{if(R)R.over=true;playing=false;const o=$('ov');o.innerHTML=HOME;o.style.display='flex';bindHome()};
