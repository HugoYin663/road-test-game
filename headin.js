const TURNIN=/[?&]var=turnin/.test(typeof location!=='undefined'?location.search:'');      // 模拟考试：只做“右转回考场”这一段
// ============================================================
// headin.js — 项目：从大路右转进停车场，左转进车道，车头朝里停进左边的空车位（头进）
//  · 大路上往北开（系统控制方向，玩家只管停车／行驶、打灯）。考官：前面右转进停车场
//    打右转灯；进口要横过人行道，有行人要停下让
//  · 进了通道往东开。考官：前面左转进车道。打左转灯；对面（商铺那边）开过来的车直行，你左转要让它
//  · 进了车道系统在车道右边开。考官：左边那个空车位，车头朝里停进去
//    看镜、打左转灯，快到车位时系统减到很慢，点“停车”停住；然后自己开：
//    看左边盲点，方向盘往左打到底，慢慢往前开进去；车身和车位平行时回正；和两边的车对齐；挂 P、拉手刹
// ============================================================
const KT=3,ZT=ZS(KT),LXA=1.8,ZE=ZB+1.8;      // 目标车位：左边一排第 3 个；车道里走东半边（右边）；通道里往东开走南半边
const HI_TXT={
 noSigIn:["进停车场前没有打右转灯","听到考官的指令后：看镜、打右转灯，再减速转进去，让后面的车早知道你要转。"],
 noYieldPedIn:["没有让人行道上的行人","进停车场要横过人行道：有行人在走，停在人行道前面让他先过去。"],
 noSigAisle:["左转进车道前没有打左转灯","在停车场里转弯也要打灯：快到车道口时打好左转灯。"],
 noYieldOnc:["左转进车道时没有让对面开过来的车","对面开过来的车在通道上直行，你左转要横过它的车道：先停下让它过去，再转。"],
 brkNoMir:["减速找车位前没有看后视镜","听到考官的指令后，减速之前先看后视镜（按住“左镜”看一眼后面有没有车跟着）。"],
 brkNoSig:["减速找车位前没有打左转灯","要往左边的车位里停：减速之前打好左转灯，让后面和对面的车知道你要停进去。"],
 noShoulderL:["转进车位前没有转头看左边","往左转进车位之前要转头看左边（按住“看左边”）：车中间常有行人走出来，左边车道也可能有车。"],
 backIn:["没有车头朝里停","这个项目要头进：车头朝里开进车位。"],
 notIn:["没有停进车位","车身要全部停在车位的两条线中间，不能压到旁边的车位，车尾也不能留在车道上。"],
 overLine:["压线了","停好后车身要在两条线中间，左右都要留出空间（旁边的车要能开门）。"],
 notCentre:["没有停在车位中间","停好后左右离两条线差不多远，旁边的车上下车才方便。"],
 crooked:["车身没有摆正","停好后车身要和旁边的车平行（和车位线平行）。开进去时看到车身和车位线平行了，就回正方向盘，再直着往前开。"],
 notAlign:["没有和两边的车对齐","前面离路缘多远不好看，用两边的车来定：开到你的外后视镜和旁边车的外后视镜对齐（镜子对镜子），或者你和旁边车的司机位置对齐，就停。"],
 notDeep:["车尾留在车道上","要开到底一点：车尾不要伸在车道上（车尾在车位线以内），车头也不要碰到前面的路缘。"],
 wheelNotStr:["停好后方向盘没有回正","和车位线平行时就要回正方向盘，停好时车轮是正的。"],
 manyMoves:["调整超过两次","开进去以后，往后倒、再往前算一次调整，最多两次。调整太多次，说明开始转的位置或打方向的时机不对。"],
 no360:["倒车前没有做 360° 观察","每次开始倒车之前，都要把四周看一遍（360° 观察），确认没有车、行人再倒。"],
 noYieldCar:["车道上有车开过来时没有停下让它","车道上对面开过来的车离你很近时，不要把车头摆进它的车道：先停住让它过去，再转进车位。"],
 noP:["没有挂 P 停好","停车的最后一步要挂 P，再拉手刹。"],
 noShRIn:["右转前没有看右后方","右转进考场之前要回头看右后方（右盲点）：右边可能有自行车或从后面上来的车。按“右后观察”。"],
 yieldLT:["不清楚路权：停下来让对面的左转车","你右转、对面的车左转，进的是同一个口：右转车的路权比左转车高（左转车要让直行和右转的车），哪怕它先到、先在那里等。没有行人的话，应该直接转进去，不要停下来让它——停下让会让对方不知道该不该走，还会挡住后面的车。只有行人比你路权高。"]};
// 指定车位上方的蓝色箭头
{const a=new T.Mesh(new T.ConeGeometry(.6,1.4,4),BM(0x1f6feb));a.rotation.x=Math.PI;a.position.set(PCX,3.2,ZT);scene.add(a)}      // 左边一排：x＝-PCX（画到场景里是 +PCX）
// 停着的车：空车位两边的车都是头进（车头朝里），能对齐外后视镜；右边第 -8 个空着（转进车道时车头会扫过去）
function buildParks(){const P=[];
 for(let k=-8;k<=22;k++)[1,-1].forEach(s=>{if(s<0&&k<-7)return;if(s>0&&k===-8)return;if(s<0&&k===KT)return;
  const near=s<0&&Math.abs(k-KT)<=1;      // 除了指定的车位，其他车位都停满（不留空车位，免得停错）
  const nose=near?true:Math.random()<.7,h=(s>0)===nose?Math.PI/2:-Math.PI/2;
  P.push([s*PCX,ZS(k)+(near?0:(Math.random()-.5)*.25),h+(near?0:(Math.random()-.5)*.05),PCOLS[Math.random()*PCOLS.length|0]])});return P}
// ---------------- 系统开的路线（后轴走的线） ----------------
const mkPts=()=>{const P=[],seg=(a,b)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.5);for(let i=0;i<n;i++)P.push([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n])},
 arc=(cx,cz,r,a0,a1)=>{const n=Math.ceil(Math.abs(a1-a0)*r/.5);for(let i=0;i<n;i++){const a=a0+(a1-a0)*i/n;P.push([cx+r*Math.cos(a),cz+r*Math.sin(a)])}};return{P,seg,arc}};
const PATH=(()=>{const{P,seg,arc}=mkPts(),R1=5,R2=5;
 seg([NX,ZC-140],[NX,ZE-R1]);const i1=P.length;arc(NX+R1,ZE-R1,R1,Math.PI,Math.PI/2);const i2=P.length;      // 大路往北，右转进停车场
 seg([NX+R1,ZE],[LXA-R2,ZE]);const i3=P.length;arc(LXA-R2,ZE+R2,R2,-Math.PI/2,0);const i4=P.length;      // 通道往东，左转进车道
 seg([LXA,ZE+R2],[LXA,80]);P.push([LXA,80]);
 const L=[0];for(let i=1;i<P.length;i++)L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));return{P,L,i1,i2,i3,i4}})();
// 车道上从北边开过来的车：走西半边往南，到车道尽头左转，往东从商铺前面开走
const ACP=(()=>{const{P,seg,arc}=mkPts(),r=4;seg([LANE,80],[LANE,ZE+r]);arc(LANE+r,ZE+r,r,Math.PI,Math.PI*1.5);seg([LANE+r,ZE],[XC+75,ZE]);P.push([XC+75,ZE]);
 const L=[0];for(let i=1;i<P.length;i++)L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));return{P,L}})();
// 商铺那边开过来的车：走通道北半边往西，到出口停在大路边，等近处车道有空档就右转上大路
const ECP=(()=>{const{P,seg}=mkPts(),Rr=3.6,cx=NX+Rr,cz=ZL+Rr;seg([XC+40,ZL],[cx,ZL]);const iH=P.length;for(let i=0;i<12;i++){const a=-Math.PI/2-Math.PI/2*i/12;P.push([cx+Rr*Math.cos(a),cz+Rr*Math.sin(a)])}seg([NX,cz],[NX,400]);P.push([NX,400]);
 const L=[0];for(let i=1;i<P.length;i++)L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));return{P,L,sH:L[iH]-((XR+.3+LW.HL)-cx)}})();
// 对面往南开、在进口处左转进考场的车（模拟考试“右转回考场”）：比你先到、停在对面等你先转（右转车路权高），你转进去以后它跟在你后面进来
const LTR=7,LTP=TURNIN?(()=>{const{P,seg,arc}=mkPts();seg([SX,ZE+LTR+150],[SX,ZE+LTR]);const iA=P.length;arc(SX+LTR,ZE+LTR,LTR,Math.PI,Math.PI*1.5);seg([SX+LTR,ZE],[NX+5,ZE]);for(let i=PATH.i2;i<PATH.P.length;i++)P.push(PATH.P[i]);
 const L=[0];for(let i=1;i<P.length;i++)L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));return{P,L,sW:L[iA]-LW.HL-.6}})():null;
function at(Q,s){const{P,L}=Q;let i=0;while(i<L.length-2&&L[i+1]<s)i++;const f=Math.min(1,Math.max(0,(s-L[i])/(L[i+1]-L[i]||1)));return[P[i][0]+(P[i+1][0]-P[i][0])*f,P[i][1]+(P[i+1][1]-P[i][1])*f,Math.atan2(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1])]}
// ---------------- 工具 ----------------
function inPath(px,pz,r){const s=Math.sin(R.h),c=Math.cos(R.h),fw=(px-R.x)*s+(pz-R.z)*c,lt=(px-R.x)*c-(pz-R.z)*s;return fw>LW.HL-.3&&Math.abs(lt)<LW.HW+r+.35?fw-LW.HL-r:null}      // 在车头前面的通道里：返回离车头的距离
function walk(P,dt){P.ph+=dt*P.v*4.2;const sw=Math.sin(P.ph)*.5,u=P.o.userData;u.l.rotation.x=sw;u.r.rotation.x=-sw;u.al.rotation.x=-sw*.8;u.ar.rotation.x=sw*.8}
const boxHaz=b=>{const ds=boxCorners([b[0],b[1],b[2],LW.HL,LW.HW]).map(q=>inPath(q[0],q[1],.1)).filter(d=>d!=null);return ds.length?Math.min(...ds):null};
// 会动的车：往前开的方向上离最近的人、车多远
function npcClear(x,z,h,self,mg){const M=mg==null?.35:mg;const s=Math.sin(h),c=Math.cos(h);let best=99;
 const chk=(px,pz,r)=>{const fw=(px-x)*s+(pz-z)*c,lt=(px-x)*c-(pz-z)*s;if(fw>LW.HL-.3&&Math.abs(lt)<LW.HW+r+M)best=Math.min(best,fw-LW.HL-r)};
 const boxes=[[R.x,R.z,R.h]];[['AC',R.AC],['EC',R.EC]].forEach(([k,o])=>{if(o&&!o.gone&&k!==self)boxes.push([o.x,o.z,o.h])});
 boxes.forEach(b=>{const q=boxCorners([b[0],b[1],b[2],LW.HL,LW.HW]);q.concat([[b[0],b[1]]],q.map((p,i)=>{const r=q[[1,3,0,2][i]];return[(p[0]+r[0])/2,(p[1]+r[1])/2]})).forEach(p=>chk(p[0],p[1],.05))});
 if(R.PE&&!R.PE.gone)chk(R.PE.x,R.PE.z,.6);return best}
// ---------------- 大路上的车（一波一波地来） ----------------
function trafPlan(hard){const C=hard?17:18,n=hard?4:3,hw=hard?2.4:2.9;const A={N:[],S:[]};
 ['N','S'].forEach((L,li)=>{const off=li?1.2:0;for(let k=-1;k<40;k++){const T0=k*C+off+Math.random()*.8;const m=n-(Math.random()<.35?1:0);for(let i=0;i<m;i++)A[L].push(T0+i*(hw+Math.random()*.6))}});return A}
function trafStep(dt){const TF=R.tf;['N','S'].forEach(L=>{const dir=L==='N'?1:-1,x=L==='N'?NX:SX;
  while(TF.q[L].length&&TF.q[L][0]-R.t<12){const ta=TF.q[L].shift(),z=ZC-dir*VR*(ta-R.t);
   if(L==='N'&&R.ph===0&&z>R.z-60&&z<R.z+40)continue;      // 你还在大路上：你前后附近不放车（后面的车会跟着你）
   if(TF.cars.some(p=>!p.gone&&p.L===L&&Math.abs(p.z-z)<9))continue;
   if(R.LT&&!R.LT.gone&&Math.abs(R.LT.x-x)<3&&Math.abs(R.LT.z-z)<14)continue;
   const c=car(PCOLS[Math.random()*PCOLS.length|0]);live.push(c);TF.cars.push({c,L,dir,x,z,v:VR})}});
 TF.cars.forEach(o=>{if(o.gone)return;
  let vt=VR;{let gap=1e9,lv=0;TF.cars.forEach(p=>{if(p===o||p.gone||p.L!==o.L)return;const g=(p.z-o.z)*o.dir-2*LW.HL;if(g>-1&&g<gap){gap=g;lv=p.v}});
   if(o.L==='N'&&R.EC&&R.EC.road&&!R.EC.gone){const g=R.EC.z-o.z-2*LW.HL;if(g>-1&&g<gap){gap=g;lv=R.EC.v}}if(gap<60)vt=Math.min(vt,Math.max(0,lv+(gap-7)*.9))}
  {const T=R.LT;if(T&&!T.gone){const q=boxCorners([T.x,T.z,T.h,LW.HL,LW.HW]);if(Math.min(...q.map(p=>p[0]))<o.x+1.3&&Math.max(...q.map(p=>p[0]))>o.x-1.3){const zs=q.map(p=>p[1]),d=o.dir>0?Math.min(...zs)-(o.z+LW.HL):(o.z-LW.HL)-Math.max(...zs);if(d>-1&&d<60){vt=Math.min(vt,Math.max(0,(d-6)*.9));if(d<1.5){o.v=0;vt=0}}}}}      /* 对面待转的左转车：大路上的车跟在它后面、等它，不会撞上 */
  const cs=corners(),inL=Math.min(...cs.map(q=>q[0]))<o.x+1.3&&Math.max(...cs.map(q=>q[0]))>o.x-1.3;if(inL){const zs=cs.map(q=>q[1]),d=o.dir>0?Math.min(...zs)-(o.z+LW.HL):(o.z-LW.HL)-Math.max(...zs);if(d>-1&&d<60)vt=Math.min(vt,Math.max(0,R.v*Math.max(0,Math.cos(R.h)*o.dir)+(d-7)*.9));
   if(d>-1&&d<50){const need=o.v*o.v/(2*Math.max(.5,d-4));if(need>1.5){vt=Math.max(0,o.v-need*dt);if(!o.honk&&need>3){o.honk=1;honk()}}}}
  o.v=vt<o.v?Math.max(0,vt):Math.min(VR,o.v+2*dt);o.z+=o.dir*o.v*dt;
  TF.cars.forEach(p=>{if(p===o||p.gone||p.L!==o.L)return;const g=(p.z-o.z)*o.dir;if(g>-.01&&g<5.6){o.z=p.z-o.dir*5.6;o.v=Math.min(o.v,p.v)}});
  if(o.L==='N'&&R.EC&&R.EC.road&&!R.EC.gone){const g=R.EC.z-o.z;if(g>-.01&&g<5.6){o.z=R.EC.z-5.6;o.v=Math.min(o.v,R.EC.v)}}
  if(inL){const zs=cs.map(q=>q[1]),z0=Math.min(...zs),z1=Math.max(...zs);if(o.dir>0&&o.z+LW.HL>z0-.4&&o.z<z1){o.z=Math.min(o.z,z0-.4-LW.HL);o.v=0}if(o.dir<0&&o.z-LW.HL<z1+.4&&o.z>z0){o.z=Math.max(o.z,z1+.4+LW.HL);o.v=0}}      /* 无论如何不会开进你的车里 */
  place(o.c,o.x,o.z,o.dir>0?0:Math.PI,0);if(Math.abs(o.z-ZC)>230){o.c.visible=false;o.gone=1}})}
// ---------------- 按键：大路和通道里（系统开）用右转灯；自己停车时换成看左边、360° 观察 ----------------
function keys(manual){const sh=(id,on)=>{const e=$(id);if(e)e.style.display=on?'':'none'};sh('bsigRR',!manual);sh('bsigR',manual);sh('bmir',manual);
 if(TURNIN){sh('bsigL',0);sh('bshL',0);sh('bshR',0);sh('bshRR',!manual)}else sh('bshRR',0)}      /* 右转回考场：只要右转灯和“右后观察”（不用左右镜） */
// ---------------- 场景 ----------------
const SCENE={g:0,Y:()=>0,TXT:HI_TXT,SER:['noYieldPedIn','noYieldOnc','notIn','backIn','noYieldCar'],vmax:2.0,noSplit:true,noBackCheck:true,tiltL:true,keepIns:true,pkYaw:-.35,
 curbs:[{side:1,x:XC,z0:ZA,z1:200},{side:-1,x:-XC,z0:ZA,z1:200}],
 goLabel:'行驶<small>系统继续<br>开</small>',stpLabel:'停车<small>点一下<br>就停住</small>',
 okText:'进停车场前打了右转灯、让了行人；左转进车道前打了灯、让了对面的车；找车位前看镜、打灯，看了左边盲点，一次开进车位正中间，车身摆正、和两边的车对齐，挂 P、拉手刹，做得很好。',
 setup(R){SCN.exam=null;const park=DIFF==='park';
  const ev0=HARD?{pe:1,ec:1,ac:1}:park?{pe:0,ec:0,ac:0}:{pe:Math.random()<.5,ec:Math.random()<.6,ac:Math.random()<.35};
  const PK=buildParks();PK.forEach(p=>{const c=car(p[3]);live.push(c);place(c,p[0],p[1],p[2],0)});SCN.obst=PK.map(p=>[p[0],p[1],p[2]]);
  if(TURNIN){ev0.pe=Math.random()<.7;ev0.ec=false;ev0.ac=false}
  R.LT=null;      /* 右转回考场：常有行人在人行道上走 */
  Object.assign(R,{EV:ev0,haz:[],tf:{q:trafPlan(HARD),cars:[]},AC:null,EC:null,PE:null,moves:0,segD:0});
  if(park){Object.assign(R,{x:LXA,z:ZT-9,h:0,gear:'D',ph:3,auto:null,cruise:false});keys(true);
   banner('考官：左边那个空车位（上方有蓝色箭头），车头朝里停进去（park front-in in the spot on your left）','#ffe27a',1);
   tip('打左转灯，按住油门往前开到合适的位置停住；转头看左边，方向盘往左打到底，慢慢开进去')}
  else{const p=PATH.P[0];Object.assign(R,{x:p[0],z:p[1]+LW.TX,h:0,v:30/3.6,gear:'D',ph:0,auto:{pts:PATH.P,i:0},stopReq:false});keys(false);
   banner(TURNIN?'考官：前面右转，回考场（turn right into the test centre）':'考官：前面右转，进停车场（turn right into the plaza）','#ffe27a',1);if(TURNIN)ltSpawn()}},
 onGear(g){R.gT=R.t;if(R.ph===4&&g==='P'){R.ph=5;R.pT=R.t}else if(R.ph===5&&g!=='P')R.ph=4},      /* 挂 P 又马上换回 R/D：当作误操作，继续 */
 autoV(R,dt){const A=R.auto,i=A.i,s=PATH.L[i],Lp=PATH.L;let v;A.brk=2.5;
  if(i<PATH.i1)v=Math.min(30/3.6,Math.sqrt(9+2*1.3*Math.max(0,Lp[PATH.i1]-s-3)));      // 大路上：快到进口时平稳地减速
  else if(i<PATH.i2)v=3;
  else if(i<PATH.i3)v=Math.min(3.6,Math.sqrt(2.5*2.5+2*1.2*Math.max(0,Lp[PATH.i3]-s)));
  else if(i<PATH.i4)v=2.5;else v=15/3.6;
  const hz=R.haz.map(f=>f()).filter(d=>d!=null);R.tf.cars.forEach(o=>{if(o.gone)return;const d=boxHaz([o.x,o.z,o.dir>0?0:Math.PI]);if(d!=null)hz.push(d)});
  if(hz.length){const d=Math.min(...hz);if(d<1.6){v=0;A.brk=9}else if(d<4)v=Math.min(v,.6);else if(d<12&&R.v>3)v=Math.min(v,3)}      // 前面有人、有车：系统先帮你刹车（你没让，已经算错了）
  return v},
 onAutoBtn(R,m){},
 onHandover(R){R.ph=3;keys(true);if(R.EV.ac&&!R.AC)acSpawn(40);      /* 停下准备停车时，车道远处对面有车开过来 */
  tip('转头看左边（按住“看左边”），方向盘往左打到底，按住油门慢慢开进车位；和车位线平行时回正')},
 on360Start(R){},
 onSeg(dir,n){if(dir<0&&R.ph>=3&&(R.oT.A==null||R.t-R.oT.A>15))ev('no360');
  if(R.ph>=4){if((R.segD||0)>.3)R.moves=(R.moves||0)+1;R.segD=0}},
 step(R,dt){if(R.auto&&!R.uiOn){R.uiOn=1;cruiseUI(true)}      /* 系统开：油门键变成“停车／行驶”，挡位和方向盘先藏起来 */
  const t=R.t,A=R.auto,i=A?A.i:0,s=A?PATH.L[i]:0;
  // ---------- 大路上：右转进停车场 ----------
  if(R.ph===0){
   if(!R.sigChk&&s>PATH.L[PATH.i1]-22){R.sigChk=1;if(R.sig!=='R')ev('noSigIn')}
   if(TURNIN&&!R.shChk&&i>=PATH.i1){R.shChk=1;if(!sawSh('R',10))ev('noShRIn')}      /* 开始转弯时：10 秒内回头看过右后方 */
   if(TURNIN)ltYieldChk(dt,s);
   if(R.EV.pe&&!R.PE&&s>PATH.L[PATH.i1]-28){const o=ped(PCOL[Math.random()*5|0]);live.push(o);R.PE={o,x:-(XC+1.3),z:ZB-10.5,v:1.3,ph:0};R.haz.push(()=>R.PE&&!R.PE.gone?inPath(R.PE.x,R.PE.z,.35):null)}
   if(R.EV.ec&&!R.EC&&i>=PATH.i1)ecSpawn();
   if(i>=PATH.i2){if(TURNIN){R.ph=9;R.endT=R.t+2.5;if(R.sig==='R')setSig(null)}else{R.ph=1;if(R.sig==='R')setSig(null);banner('考官：前面左转，进车道（turn left into the aisle）','#ffe27a',1)}}}      /* 转完右转灯自己灭 */
  if(R.ph===9&&R.t>R.endT&&!R.over){finish();return}      /* 模拟考试（var=turnin）：右转进了考场就结束，接倒车入位 */
  // ---------- 通道里：左转进车道 ----------
  if(R.ph===1){
   if(!R.sigChk2&&s>PATH.L[PATH.i3]-6){R.sigChk2=1;if(R.sig!=='L')ev('noSigAisle')}
   if(!R.oncChk&&Math.max(...corners().map(q=>q[1]))>ZC){R.oncChk=1;const E=R.EC;if(E&&!E.gone&&E.st==='drive'){const xs=corners().map(q=>q[0]),ef=E.x-LW.HL;if(ef>Math.min(...xs)-.5&&ef-Math.max(...xs)<13)ev('noYieldOnc')}}      /* 车头进了通道北半边（对面车的车道）时，对面的车还没过去、离你不到 13 米 */
   if(i>=PATH.i4){R.ph=2;if(R.sig==='L')setSig(null);banner('考官：左边那个空车位（上方有蓝色箭头），车头朝里停进去（park front-in in the spot on your left）','#ffe27a',1)}}
  // ---------- 车道里：系统开，快到车位时减到很慢，玩家点“停车” ----------
  if(R.ph===2&&R.auto&&!R.stopReq&&Math.abs(R.h)<.04&&Math.abs(R.x-LXA)<.15&&R.z>ZA+1){R.auto=null;R.cruise=true;R.stopReq=false;SCN.exam={laneX:LXA,crawlZ:ZT-7.5,vcr:15/3.6,side:'L'};cruiseUI(true)}
  if(R.ph===2&&R.cruise&&!R.stopReq&&R.z>ZT+3&&!R.over){ev('missed');finish();return}
  // ---------- 自己开进车位 ----------
  if(R.ph===3&&R.v>.05&&(R.w<-.3||R.h<-.12)){R.ph=4;      /* 开始往左转进车位（之前直着往前、往后挪位置不算） */
   R.moves=0;R.segD=0;if(!(R.oT.XL!=null&&R.t-R.oT.XL<10)&&!sawSh('L',10))ev('noShoulderL')}      /* 往左转之前 10 秒内转头看过左边 */
  if(R.ph>=4)R.segD=(R.segD||0)+Math.abs(R.v)*dt;
  if(R.ph===5&&!R.over){const lo=Math.max(R.pT,R.pbT||0,R.gT||0);if(R.pb&&t-lo>1.5){parkDone();finish()}else if(!R.pb&&t-R.pT>5&&t-lo>1.5){parkDone();ev('noPB');finish()}}      /* 挂 P、拉手刹以后，停 1.5 秒没有别的操作才算做完 */
  pedStep(dt);ecStep(dt);acStep(dt);ltStep(dt);trafStep(dt);
  if(t>300&&!R.over){if(R.ph<5)ev('noP');finish()}},
 draw(R){},
 topCam(R){return[R.x,R.z,26]}};
function parkDone(){const cs=corners(),zs=cs.map(q=>q[1]),xs=cs.map(q=>q[0]),zl=ZT-SWD/2,zr=ZT+SWD/2,over=Math.max(zl-Math.min(...zs),Math.max(...zs)-zr),rx=Math.max(...xs),da=normA(R.h+Math.PI/2);
 if(Math.abs(da)>Math.PI/2)ev('backIn');
 else if(over>.35||rx>-AW+1)ev('notIn');
 else{const deg=Math.abs(da)*180/Math.PI;
  if(over>0)ev('overLine','（车身压过线约 '+Math.round(over*100)+' 厘米）');else if(Math.abs(R.z-ZT)>.3)ev('notCentre','（离两边的线：'+(R.z-zl-LW.HW).toFixed(2)+' 米 和 '+(zr-R.z-LW.HW).toFixed(2)+' 米）');
  if(deg>5)ev('crooked','（斜了约 '+Math.round(deg)+'°）');
  const dd=-PCX-R.x;if(rx>-AW+.15)ev('notDeep','（车尾伸出车位线约 '+Math.round((rx+AW)*100)+' 厘米）');;      /* 和两边的车对齐只是找位置的方法，不算硬指标：只要车头／车尾不伸到车道上就行 */
  if(Math.abs(R.w)>.1)ev('wheelNotStr','（方向盘还'+(R.w<0?'往左 ':'往右 ')+Math.round(Math.abs(R.w)*WLOCK)+'°）')}
 const nM=(R.moves||0)+((R.segD||0)>.3?1:0),nAdj=Math.floor((nM-1)/2);if(nAdj>2)ev('manyMoves','（调整了 '+nAdj+' 次）')}
// 进口人行道上走的行人（往北走，横过进口）
function pedStep(dt){const PE=R.PE;if(!PE||PE.gone)return;
 PE.v=npcPedClear(PE)?1.3:0;PE.z+=PE.v*dt;walk(PE,dt);place(PE.o,PE.x,PE.z,0,0);
 const sh=Math.sin(R.h),ch=Math.cos(R.h),fw=(PE.x-R.x)*sh+(PE.z-R.z)*ch-LW.HL,lt=(PE.x-R.x)*ch-(PE.z-R.z)*sh;      /* 用车的方向算：行人在车头前 2.5 米以内、还在你要走的地方或正要走进来（从你右边走过来，走过你车的左边才算过去） */
 if(R.ph<=1&&R.v>.5&&fw>-.3&&fw<1.8&&lt>-(LW.HW+.5)&&lt<LW.HW+1.4)ev('noYieldPedIn');      /* 车头离行人不到 1.8 米还在开 */
 if(PE.z>ZA+30){PE.o.visible=false;PE.gone=1}}
function npcPedClear(PE){const pts=[[R.x,R.z,R.h]];if(R.EC&&!R.EC.gone)pts.push([R.EC.x,R.EC.z,R.EC.h]);return!pts.some(b=>inBox(b,PE.x,PE.z+.6))}      // 车挡在前面：行人停下等
function inBox(b,px,pz){const s=Math.sin(b[2]),c=Math.cos(b[2]),dx=px-b[0],dz=pz-b[1];return Math.abs(dx*s+dz*c)<LW.HL+.3&&Math.abs(dx*c-dz*s)<LW.HW+.3}
// 对面（商铺那边）开过来的车
function ecSpawn(){const c=car([0xb9bec4,0x2f6fe0,0x4a4f57][Math.random()*3|0]);live.push(c);const s0=(XC+40)-24,p=at(ECP,s0);R.EC={c,s:s0,v:3.4,x:p[0],z:p[1],h:p[2],st:'drive'};
 R.haz.push(()=>{const E=R.EC;return!E||E.gone?null:boxHaz([E.x,E.z,E.h])})}
function ecStep(dt){const E=R.EC;if(!E||E.gone)return;let vt=E.st==='go'?(E.road?VR:6):3.5;
 if(E.st==='drive'){vt=Math.min(vt,Math.sqrt(2*1.5*Math.max(0,ECP.sH-E.s)));if(E.s>=ECP.sH-.05&&E.v<.1)E.st='wait'}
 if(E.st==='wait'){vt=0;const ok=R.tf.cars.every(o=>{if(o.gone||o.L!=='N')return true;if(o.z-LW.HL>ZA+.5)return true;return((ZB-.5)-(o.z+LW.HL))/o.v>5.5});if(ok)E.st='go'}      /* 近处车道有 5.5 秒以上的空档再右转 */
 const cl=npcClear(E.x,E.z,E.h,'EC');if(cl<2.5)vt=0;else vt=Math.min(vt,(cl-2.5)*1.2+.1);      // 让行人、让你的车
 E.v=vt<E.v?Math.max(vt,E.v-6*dt):Math.min(vt,E.v+(E.road?2.5:1.5)*dt);E.s+=E.v*dt;const p=at(ECP,E.s);E.x=p[0];E.z=p[1];E.h=p[2];if(E.x<XR-.5&&E.h>-.2)E.road=true;
 place(E.c,E.x,E.z,E.h,0);if(E.z>ZC+220){E.c.visible=false;E.gone=1}}
// 车道上对面开过来的车（困难模式／有时候）：你停下准备停车时从北边开过来，走车道西半边
function acSpawn(d){const c=car([0x8e2b2b,0x23324f,0xb9bec4][Math.random()*3|0]);live.push(c);const s0=Math.max(0,80-(R.z+d)),p=at(ACP,s0);R.AC={c,s:s0,v:3,x:p[0],z:p[1],h:p[2],off:0};
 SCN.obst.push([p[0],p[1],p[2]]);R.AC.oi=SCN.obst.length-1}
function acStep(dt){const A=R.AC;if(!A||A.gone)return;const cs=corners(),zs=cs.map(q=>q[1]),xs=cs.map(q=>q[0]);
 // 你的车基本开进车位了、只有车尾还留在车道边上：它往东边（它的左边）让一点从旁边过去；你的车头还摆在它的车道上：它停下等你
 const near=Math.min(...zs)<A.z+1&&Math.max(...zs)>A.z-LW.HL-14,inStall=R.x<-AW+.6&&Math.abs(normA(R.h+Math.PI/2))<.7;
 const off=near&&inStall?Math.max(0,Math.min(2,Math.max(...xs)+.45+LW.HW-LANE)):0;if(A.v>.2)A.off+=Math.max(-.4*dt,Math.min(.4*dt,off-A.off));
 const p0=at(ACP,A.s),ox=p0[1]>ZE+4?A.off:0;
 const cl=npcClear(p0[0]+ox,p0[1],p0[2],'AC',.2),vt=cl<2.5?0:Math.min(A.z-R.z<16?3:4.2,(cl-2.5)*1.2);A.v=vt<A.v?Math.max(vt,A.v-6*dt):Math.min(vt,A.v+1.5*dt);
 if(A.v<.1&&cl<3&&!A.honk&&R.v>.05&&R.ph<5){A.honk=1;honk()}
 A.s+=A.v*dt;const p=at(ACP,A.s);A.x=p[0]+(p[1]>ZE+4?A.off:0);A.z=p[1];A.h=p[2];place(A.c,A.x,A.z,A.h,0);SCN.obst[A.oi]=[A.x,A.z,A.h];
 if(!A.done&&A.z>ZA){const front=A.z-LW.HL,mz=Math.max(...zs),inWay=Math.min(...xs)<A.x+LW.HW+.5;
  if(!A.inW&&inWay&&R.v>.05&&front>Math.min(...zs)-1){A.inW=1;if((front-mz)/Math.max(1,A.v)<3.5)ev('noYieldCar')}      /* 你的车头摆进它的车道的时候，它不到 3.5 秒就到了 */
  if(A.z+LW.HL<Math.min(...zs)){A.done=true;if(!R.ev.some(e=>e.key==='noYieldCar')&&R.ph===3)banner('看到车道上对面开过来的车，等它过去再转：正确','#7ee787')}}
 if(A.s>ACP.L[ACP.L.length-1]-2){A.c.visible=false;A.gone=1;SCN.obst[A.oi]=[0,-999,0]}}
function ltSpawn(){const c=car([0x8e2b2b,0xe8e8e8,0x23324f,0x4a4f57][Math.random()*4|0]);live.push(c);const s0=LTP.sW-95,p=at(LTP,s0);
 R.LT={c,s:s0,v:11,x:p[0],z:p[1],h:p[2],go:false,yT:0};R.tf.cars.forEach(o=>{if(!o.gone&&o.L==='S'&&Math.abs(o.z-p[1])<20){o.c.visible=false;o.gone=1}});
 R.haz.push(()=>{const T=R.LT;return!T||T.gone||T.s<LTP.sW+.5?null:boxHaz([T.x,T.z,T.h])})}      /* 它开始转了：挡在你前面时系统帮你刹车 */
// 你在进口前停下来（不是为了行人）：它在等你、你在等它——等一会儿它先转进去，你这一步算“不清楚路权”
function ltYieldChk(dt,s){const T=R.LT;if(!T||T.go||T.gone)return;
 const nearIn=s>PATH.L[PATH.i1]-25&&R.auto&&R.auto.i<PATH.i2,ped=R.haz.some(f=>{const d=f();return d!=null&&d<15})||(R.PE&&!R.PE.gone&&Math.abs(R.PE.z-ZC)<9);
 if(nearIn&&R.v<.3&&T.s>=LTP.sW-1.5&&!ped){T.yT+=dt;if(T.yT>1.5&&!R.ev.some(e=>e.key==='yieldLT'))ev('yieldLT');if(T.yT>3.5)T.go=true}else if(R.v>.5)T.yT=0}
function ltStep(dt){const T=R.LT;if(!T||T.gone)return;
 if(!T.go){const xs=corners().map(q=>q[0]);if(R.ph===9||Math.min(...xs)>SX+LTR+.8)T.go=true}      /* 你的车尾进了考场口：它跟着转进来 */
 let vt=T.go?(T.s<LTP.sW+14?4.5:3.2):Math.min(11,Math.sqrt(2*2.2*Math.max(0,LTP.sW-T.s)));
 const cl=npcClear(T.x,T.z,T.h,'LT');if(cl<2.5)vt=0;else vt=Math.min(vt,(cl-2.5)*1.2+.1);
 T.v=vt<T.v?Math.max(vt,T.v-6*dt):Math.min(vt,T.v+1.8*dt);T.s+=T.v*dt;if(!T.go)T.s=Math.min(T.s,LTP.sW);
 const p=at(LTP,T.s);T.x=p[0];T.z=p[1];T.h=p[2];place(T.c,T.x,T.z,T.h,0);
 {const on=T.s<LTP.sW+11&&Math.sin(R.t*9.4)>0;T.c.userData.bl.forEach(m=>m.visible=on)}      /* 左转灯：开过来、等着、转弯时一直闪，转进去以后关掉 */
 if(T.s>LTP.L[LTP.L.length-1]-3){T.c.visible=false;T.gone=1}}
LS.start(SCENE);
