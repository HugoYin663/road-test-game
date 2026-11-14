// ============================================================
// exit.js — 项目：出车位、出停车场、上大路左转
//  · 车尾朝里停在车位里（挂 P、拉着手刹）。考官：开出车位，左转
//  · 出车位（PROCEDURE FOR LEAVING）：挂 D、放手刹；看镜、打左转灯、看左边盲点；慢慢往前挪，
//    车头出到车道边先左右看车道；司机过了旁边那辆车，往左打，转进车道
//  · 进了车道以后系统帮你开（很慢）；看到行人过车道、有车倒车出来，点“停车”让，再点“行驶”
//  · 车道尽头右转（打右转灯），往出口开；考官：前面左转上大路
//  · 出口没有停牌，但大路是主路，你没有路权（让牌的走法）：车头停到大路边上（不然看不远），
//    左右看，两个方向都有安全的空档再左转上去
// ============================================================
// 路线坐标：x 向东（右）为正，z 向北为正。停车场的车道南北走向；车道南头是一条东西向的通道，往西通到出口和大路
const EX_TXT={
 noLookL:["起步前没有看左边","出车位前：看后视镜、打左转灯、转头看左边（按看左），确认没有车和行人再起步。"],
 noSigOut:["出车位没有打左转灯","起步之前就要打好转向灯（要往哪边转就打哪边）。"],
 noScanAisle:["车头出到车道前没有左右看","按住前移慢慢往前挪，车头出到车道边时停一下，看左、看右看清车道，确认没有车、没有人再点行驶。"],
 noYieldCar:["车道上有车过来时没有停下让它","出车位时车道上有车开过来，它有路权：先停住让它过去，再出来。"],
 noSeeCar:["没有发现车道上过来的车","那辆车过去时你正好停着，但它过来之前你没有左右看车道。出车位前一定要左右看。"],
 noYieldPed:["没有让过车道的行人","停车场里行人常常从车中间走出来横过车道：看到就停下让他走过去。"],
 noYieldBack:["有车倒车出来时没有停下","看到车尾的白色倒车灯亮了、车在往外倒，就要停下等它倒出来。它倒车时很难看到你。"],
 noSigL2:["上大路左转前没有打左转灯","往出口开的时候就要打好左转灯。"],
 noYieldEC:["车道尽头没有让通道上开过来的车","车道尽头接上横着的通道：左边（商铺前面）开过来的车在通道上直行，你要转进去，先停下让它过去。转弯前看左、看右。"],
 noPedE:["没有让人行道上的行人","出口要横过人行道：有行人在走，停在人行道前面让他先过。"],
 stopFar:["停得离大路太远，看不远","出口没有停牌，但你没有路权：车头要停到大路边上（靠近路边石的位置），两边才看得远。停得太靠后，要再往前挪一点、停住再看。"],
 noScan:["上大路前没有左右观察","车头停到大路边以后，看左、看右、再看左，确认两个方向都有足够的空档再转。"],
 cutOff:["大路上的车没有安全空档就开出去了","你没有路权：要等两个方向都有足够的空档。左边过来的车（你要横过它的车道）至少要 3 秒以上，右边过来的车（你要并进它的车道）要更远。"]};
{const g=billboard('exit-left');placeBB(g,XW-6,-100,Math.PI)}      // 上了大路往南开，右手边的广告牌
// 停着的车：右边一排 k＝-8～22（你在第 0 个），左边一排 k＝-7～22；右边第 -5 个可能是要倒车出来的车
const KB=-5;
function buildParks(withB){const P=[];
 for(let k=-8;k<=22;k++)[1,-1].forEach(s=>{if(s>0&&k===0)return;if(s<0&&k<-7)return;if(s>0&&(k===KB||k===KB+1)&&withB)return;      /* 倒车出来的车北边那个车位空着：它倒车往右打时车头会往北摆，不然会扫到旁边的车 */
  const near=s>0&&Math.abs(k)<=1;if(!near&&Math.random()<.14)return;
  const nose=Math.random()<.7,h=(s>0)===nose?Math.PI/2:-Math.PI/2;
  P.push([s*PCX,ZS(k)+(near?0:(Math.random()-.5)*.25),h+(near?0:(Math.random()-.5)*.05),PCOLS[Math.random()*PCOLS.length|0]])});return P}
// ---------------- 系统开的路线 ----------------
function mkPath(fromStall){const P=[],seg=(a,b)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.5);for(let i=0;i<n;i++)P.push([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n])},
 arc=(cx,cz,r,a0,a1)=>{const n=Math.ceil(Math.abs(a1-a0)*r/.5);for(let i=0;i<n;i++){const a=a0+(a1-a0)*i/n;P.push([cx+r*Math.cos(a),cz+r*Math.sin(a)])}};
 const RT=4.5,zc=ZL+RT,RL=4.55,xl=SX+RL;let iS=0;
 // 路线是后轴走的线。出车位：先直着往西挪出来，司机过了旁边的车（车头出到车道约 3 米），往左转进车道，再并到车道右边
 if(fromStall){seg([PCX+LW.TX,0],[4.4,0]);arc(4.4,-4,4,Math.PI/2,Math.PI);seg([.4,-4],[LANE,-9]);iS=P.length;seg([LANE,-9],[LANE,zc])}else seg([LANE,40],[LANE,zc]);
 const i1=P.length;arc(LANE-RT,zc,RT,0,-Math.PI/2);const i2=P.length;      // 车道往南，尽头右转往西
 seg([LANE-RT,ZL],[xl,ZL]);const i3=P.length;arc(xl,ZL-RL,RL,Math.PI/2,Math.PI);const i4=P.length;      // 往西到大路，左转往南
 seg([SX,ZL-RL],[SX,-400]);P.push([SX,-400]);
 const L=[0];for(let i=1;i<P.length;i++)L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
 return{P,L,iS,i1,i2,i3,i4}}
const PATH=mkPath(true),PATHA=mkPath(false);      // 你的路线（从车位出来）；车道上那辆车的路线
function pathAt(s){const{P,L}=PATHA;let i=0;while(i<L.length-2&&L[i+1]<s)i++;const f=Math.min(1,Math.max(0,(s-L[i])/(L[i+1]-L[i]||1)));return[P[i][0]+(P[i+1][0]-P[i][0])*f,P[i][1]+(P[i+1][1]-P[i][1])*f,Math.atan2(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1])]}
function sNear(x,z){const{P,L}=PATHA;let b=0,bd=1e9;for(let i=0;i<P.length;i+=2){const d=Math.hypot(P[i][0]-x,P[i][1]-z);if(d<bd){bd=d;b=i}}return L[b]}
// ---------------- 工具 ----------------
const frontX=()=>Math.min(...corners().map(q=>q[0]));
function inPath(px,pz,r){const s=Math.sin(R.h),c=Math.cos(R.h),fw=(px-R.x)*s+(pz-R.z)*c,lt=(px-R.x)*c-(pz-R.z)*s;return fw>LW.HL-.3&&Math.abs(lt)<LW.HW+r+.35?fw-LW.HL-r:null}      // 在车头前面的通道里：返回离车头的距离
function sawScan(dt){return(R.oT.XL||-99)>R.t-dt&&(R.oT.XR||-99)>R.t-dt}
function walk(P,dt){P.ph+=dt*P.v*4.2;const sw=Math.sin(P.ph)*.5,u=P.o.userData;u.l.rotation.x=sw;u.r.rotation.x=-sw;u.al.rotation.x=-sw*.8;u.ar.rotation.x=sw*.8}
function revLights(c){const g=[];[-.55,.55].forEach(x=>{const m=mesh(new T.BoxGeometry(.22,.1,.05),BM(0xffffff),x,.74,-2.37);m.visible=false;c.add(m);g.push(m)});return g}
// ---------------- 大路上的车：一波一波地来（上游有红绿灯），每波之间有空档 ----------------
function trafPlan(hard){const C=hard?17:18,n=hard?4:3,hw=hard?2.4:2.9;const A={N:[],S:[]};
 ['N','S'].forEach((L,li)=>{const off=li?1.2:0;for(let k=-1;k<40;k++){const T0=k*C+off+Math.random()*.8;const m=n-(Math.random()<.35?1:0);for(let i=0;i<m;i++)A[L].push(T0+i*(hw+Math.random()*.6))}});return A}
function trafStep(dt){const TF=R.tf;['N','S'].forEach(L=>{const dir=L==='N'?1:-1,x=L==='N'?NX:SX;
  while(TF.q[L].length&&TF.q[L][0]-R.t<12){const ta=TF.q[L].shift();const c=car(PCOLS[Math.random()*PCOLS.length|0]);live.push(c);TF.cars.push({c,L,dir,x,z:ZC-dir*VR*(ta-R.t),v:VR})}});
 TF.cars.forEach(o=>{if(o.gone)return;
  // 你的车开进了它的车道：它刹车停在你前面 4 米（按喇叭）
  let vt=VR;{let gap=1e9,lv=0;TF.cars.forEach(p=>{if(p===o||p.gone||p.L!==o.L)return;const g=(p.z-o.z)*o.dir-2*LW.HL;if(g>-1&&g<gap){gap=g;lv=p.v}});
   if(o.L==='N'&&R.EC&&R.EC.road&&!R.EC.gone){const g=R.EC.z-o.z-2*LW.HL;if(g>-1&&g<gap){gap=g;lv=R.EC.v}}      /* 从商场开出来、右转上了大路的车：当作前车 */if(gap<60)vt=Math.min(vt,Math.max(0,lv+(gap-7)*.9))}      /* 跟前车：至少留 7 米，不会穿过前车 */
  const cs=corners(),inL=Math.min(...cs.map(q=>q[0]))<o.x+1.3&&Math.max(...cs.map(q=>q[0]))>o.x-1.3;if(inL){const zs=cs.map(q=>q[1]),d=o.dir>0?Math.min(...zs)-(o.z+LW.HL):(o.z-LW.HL)-Math.max(...zs);if(d>-1&&d<60&&Math.cos(R.h)*o.dir>.9)vt=Math.min(vt,Math.max(0,R.v+(d-7)*.9));
   if(d>-1&&d<50){const need=o.v*o.v/(2*Math.max(.5,d-4));if(need>1.5){vt=Math.max(0,o.v-need*dt);if(!o.honk&&need>3){o.honk=1;honk()}}}}
  o.v=vt<o.v?Math.max(0,vt):Math.min(VR,o.v+2*dt);o.z+=o.dir*o.v*dt;
  TF.cars.forEach(p=>{if(p===o||p.gone||p.L!==o.L)return;const g=(p.z-o.z)*o.dir;if(g>-.01&&g<5.6){o.z=p.z-o.dir*5.6;o.v=Math.min(o.v,p.v)}});      /* 不会开进前车里 */
  if(inL){const zs=cs.map(q=>q[1]),z0=Math.min(...zs),z1=Math.max(...zs);if(o.dir>0&&o.z+LW.HL>z0-.4&&o.z<z1){o.z=Math.min(o.z,z0-.4-LW.HL);o.v=0}if(o.dir<0&&o.z-LW.HL<z1+.4&&o.z>z0){o.z=Math.max(o.z,z1+.4+LW.HL);o.v=0}}      /* 无论如何不会开进你的车里 */place(o.c,o.x,o.z,o.dir>0?0:Math.PI,0);if(Math.abs(o.z-ZC)>220){o.c.visible=false;o.gone=1}})}
// ---------------- 场景 ----------------
const SCENE={g:0,Y:()=>0,TXT:EX_TXT,SER:['noYieldCar','noYieldPed','noYieldBack','noPedE','cutOff','noYieldEC'],vmax:2.0,noSplit:true,noBackCheck:true,
 curbs:[{side:1,x:XC},{side:-1,x:-XC,z0:ZA,z1:200}],
 goLabel:'行驶<small>系统继续<br>慢慢开</small>',stpLabel:'停车<small>点一下<br>就停住</small>',
 okText:'出车位前看了左边、打了灯，慢慢挪到车道边先左右看；车道里让了行人和车；车头停到大路边，左右看清楚，等到安全的空档才左转上大路，做得很好。',
 setup(R){const ev0=HARD?{ac:1,aisle:['ped','back'],pe:1,ec:1}:{ac:Math.random()<.5,aisle:[Math.random()<.5?'ped':'back'],pe:Math.random()<.4,ec:Math.random()<.5};
  Object.assign(R,{x:PCX,z:0,h:-Math.PI/2,gear:'D',ph:0,EV:ev0,haz:[],auto:{pts:PATH.P,i:0},stopReq:true});      /* 一开始就由系统控制方向：玩家只管停车、前移、行驶 */
  const PK=buildParks(ev0.aisle.includes('back'));PK.forEach(p=>{const c=car(p[3]);live.push(c);place(c,p[0],p[1],p[2],0)});SCN.obst=PK.map(p=>[p[0],p[1],p[2]]);
  if(ev0.aisle.includes('back')){const c=car(0x7b8794);live.push(c);const B={c,x:PCX,z:ZS(KB),h:Math.PI/2,v:0,st:0,rl:revLights(c)};place(c,B.x,B.z,B.h,0);R.B=B;SCN.obst.push([B.x,B.z,B.h])}else R.B=null;
  R.tf={q:trafPlan(HARD),cars:[]};R.AC=null;R.P1=null;R.PE=null;R.EC=null;R.ecChk=0;
  banner('考官：开出车位，左转（pull out of the spot and turn left）','#ffe27a',1)},
 onGear(g){},
 autoV(R,dt){const A=R.auto,i=A.i,fx=frontX();let v=2.2;A.brk=2.5;
  if(i<PATH.iS)v=1.4;      // 出车位：走路的速度
  if(i>=PATH.i1-12&&i<PATH.i2)v=1.6;      // 车道尽头右转：慢
  else if(i>=PATH.i2&&i<PATH.i3){v=4.5;if(fx<XR+12)v=Math.max(.9,Math.min(4.5,.9+(fx-(XR+1.2))*.35))}      // 往出口开：约 16 km/h，快到大路时减到很慢（挪到路边）
  A.acc=1.3;if(i>=PATH.i2&&i<PATH.i3&&fx>=XR+12)A.acc=1.8;if(i>=PATH.i3-6||fx<XR-.2||R.ph===3&&fx<XR+7&&R.lastStopD!=null&&R.lastStopD<6){v=i>=PATH.i4?13:5.5;A.acc=2.8}      /* 已经在路边停下、看好空档再走：一起步就果断开出去，不再慢慢挪 */      // 开出去了：看准空档就果断左转（约 23 km/h），然后加速
  // 前面有人、有车：系统先帮你急刹（但你没让，已经算错了）
  const hz=R.haz.map(f=>f()).filter(d=>d!=null);R.tf.cars.forEach(o=>{if(o.gone)return;const ds=boxCorners([o.x,o.z,o.dir>0?0:Math.PI,LW.HL,LW.HW]).map(q=>inPath(q[0],q[1],.1)).filter(d=>d!=null);if(ds.length)hz.push(Math.min(...ds))});      /* 大路上的车挡在前面：系统也会刹车，不会开进别的车里 */if(hz.length){const d=Math.min(...hz);if(d<1.6){v=0;A.brk=9}else if(d<4)v=Math.min(v,.6)}
  return v},
 onAutoBtn(R,m){if(m==='stp')R.stopT=R.t},
 step(R,dt){const t=R.t;
  // ---------- 出车位（系统控制方向，玩家控制走、停、前移） ----------
  if(R.ph===0&&R.v>.1){R.ph=1;R.ox=R.x;R.oz=R.z;if(R.EV.ac&&!R.AC)acSpawn()}
  // 起步时漏了打灯、观察：车刚挪一点就停下补上，不算错（车头还没出去、没有影响）；车往外开了 1.5 米还没打灯／没看左边才算
  if(R.ph>=1&&!R.outChk&&Math.hypot(R.x-R.ox,R.z-R.oz)>1.5){R.outChk=1;if(!((R.oT.XL||-99)>t-15))ev('noLookL');if(R.sig!=='L')ev('noSigOut')}
  if(R.ph===1){const fx=frontX();
   if(!R.scanChk&&fx<AW-1.5){R.scanChk=1;if(!sawScan(10))ev('noScanAisle')}
   if(R.auto.i>=PATH.iS-4){R.ph=2;if(R.sig==='L')setSig(null);tip('进了车道：系统继续慢慢开。看到行人、倒车出来的车，点“停车”让；可以走了点“行驶”')}}
  acStep(dt);
  // ---------- 车道里（系统开） ----------
  if(R.ph===2){
   if(!R.p1T&&R.EV.aisle.includes('ped')&&R.z<ZS(-6)+SWD/2+12){R.p1T=1;const o=ped(PCOL[Math.random()*5|0]);live.push(o);R.P1={o,x:-4.6,z:ZS(-6)+SWD/2,v:1.25,ph:0,t0:t};
    R.haz.push(()=>R.P1&&!R.P1.gone?inPath(R.P1.x,R.P1.z,.35):null)}
   if(R.B&&!R.B.st&&R.z<ZS(KB)+12.5&&!(R.AC&&!R.AC.gone&&Math.abs(R.AC.z-ZS(KB))<14)&&!(R.P1&&!R.P1.gone&&Math.abs(R.P1.z-ZS(KB))<5&&R.P1.x<XC)){R.B.st=1;R.B.t0=t;R.B.rl.forEach(m=>m.visible=true);R.haz.push(()=>{const B=R.B;if(B.gone)return null;const ds=boxCorners([B.x,B.z,B.h,LW.HL,LW.HW]).map(q=>inPath(q[0],q[1],.1)).filter(d=>d!=null);return ds.length?Math.min(...ds):null})}
   if(R.z<-12&&!R.insR){R.insR=1;banner('考官：前面右转（turn right at the end）','#ffe27a',1);R.insRT=t}
   if(R.insRT&&!R.sigRon&&t-R.insRT>1.2){R.sigRon=1;setSig('R')}      /* 右转灯由系统来打（考官说完约 1 秒） */
   if(R.EV.ec&&!R.EC&&R.z<ZA+16)ecSpawn();
   if(R.EC&&!R.ecChk&&Math.min(...corners().map(q=>q[1]))<ZA-.3){R.ecChk=1;const E=R.EC,xs=corners().map(q=>q[0]);if(!E.gone&&E.x+LW.HL>Math.min(...xs)-1&&E.x-LW.HL<Math.max(...xs)+12)ev('noYieldEC')}      /* 你转进通道时，左边开过来的车还没过去、离你又不远 */
   if(R.EV.pe&&!R.PE&&R.z<-15.5){const o=ped(PCOL[Math.random()*5|0]);live.push(o);R.PE={o,x:-(XC+1.3),z:ZB-3.5,v:1.3,ph:0,t0:t};R.haz.push(()=>R.PE&&!R.PE.gone?inPath(R.PE.x,R.PE.z,.35):null)}
   if(R.auto.i>=PATH.i2){R.ph=3;if(R.sig==='R')setSig(null);      /* 转完右转灯自己灭 */banner('考官：前面左转，上大路（turn left onto the road）','#ffe27a',1)}}
  pedStep(dt);backStep(dt);ecStep(dt);
  // ---------- 往出口、上大路 ----------
  if(R.ph===3){const fx=frontX();
   if(!R.sigLchk&&fx<XR+6){R.sigLchk=1;if(R.sig!=='L')ev('noSigL2')}
   if(R.v===0&&R.stopReq){const d=fx-XR;if(R.minStop==null||d<R.minStop)R.minStop=d}
   if(fx<XR-.3){R.ph=4;      // 车头进了大路：这时判断
    if(!sawScan(8))ev('noScan');
    if(R.minStop!=null&&R.minStop>5&&R.lastStopD>5)ev('stopFar','（你最后停在离大路边 '+R.minStop.toFixed(1)+' 米的地方）');
    let bad=null;R.tf.cars.forEach(o=>{if(o.gone)return;let tta;if(o.dir>0){if(o.z-LW.HL>ZA+.5)return;tta=((ZB-.5)-(o.z+LW.HL))/o.v}else{if(o.z+LW.HL<ZB-.5)return;tta=((o.z-LW.HL)-(ZA+.5))/o.v}
     const need=o.dir>0?2:3.2;      /* 车头刚进大路时：左边来的车至少还要 2 秒才到，右边来的车 3.2 秒（相当于起步时约 3.3 秒和 4.5 秒） */if(tta<need&&(bad==null||tta<bad.t))bad={t:tta,o}});
    if(bad)ev('cutOff','（'+(bad.o.dir>0?'左边':'右边')+'那辆车离你只有约 '+Math.max(0,bad.t).toFixed(1)+' 秒）')}}
  if(R.ph===3&&R.v===0)R.lastStopD=frontX()-XR;
  trafStep(dt);
  if(R.ph===4){if(R.sig==='L'&&Math.abs(normA(R.h-Math.PI))<.12)setSig(null);if(R.z<-62&&!R.endT)R.endT=t;if(R.endT&&t-R.endT>.5)finish()      /* 上了大路，广告牌还在前面约 35 米时结束（最后 2～3 秒看得到） */}
  if(t>300&&!R.over)finish()},
 draw(R){},
 topCam(R){return[R.x,R.z-4,30]}};
// 出车位时车道上过来的车（从北边往南，走西半边，从你车头前面经过）
// 停车场里会动的车（车道上开过来的车、倒车出来的车）：前进（dir=1）或倒车（dir=-1）方向上，离最近的人、车多远
function npcClear(x,z,h,dir,self){const s=Math.sin(h),c=Math.cos(h);let best=99;
 const chk=(px,pz,r)=>{const fw=((px-x)*s+(pz-z)*c)*dir,lt=(px-x)*c-(pz-z)*s;if(fw>LW.HL-.3&&Math.abs(lt)<LW.HW+r+.35)best=Math.min(best,fw-LW.HL-r)};
 const boxes=[[R.x,R.z,R.h]];if(R.AC&&!R.AC.gone&&self!=='AC')boxes.push([R.AC.x,R.AC.z,R.AC.h]);if(R.B&&!R.B.gone&&self!=='B')boxes.push([R.B.x,R.B.z,R.B.h]);if(R.EC&&!R.EC.gone&&self!=='EC')boxes.push([R.EC.x,R.EC.z,R.EC.h]);
 boxes.forEach(b=>{const q=boxCorners([b[0],b[1],b[2],LW.HL,LW.HW]);q.concat([[b[0],b[1]]],q.map((p,i)=>{const r=q[[1,3,0,2][i]];return[(p[0]+r[0])/2,(p[1]+r[1])/2]})).forEach(p=>chk(p[0],p[1],.05))});
 [R.P1,R.PE].forEach(P=>{if(P&&!P.gone)chk(P.x,P.z,.6)});return best}      // 行人留得宽一点（0.6 米）
// 出车位时车道上过来的车：从你的左边（南边）往北开，走车道的东半边，从你车头前面经过，一直开到停车场北头
const AX=1.8;
function acSpawn(){const c=car([0x8e2b2b,0x5a3e36,0xb9bec4][Math.random()*3|0]);live.push(c);R.AC={c,x:AX,z:R.z-24,h:0,v:0,t0:R.t,seen:false,backD:0};R.haz.push(()=>{const A=R.AC;if(!A||A.gone)return null;const ds=boxCorners([A.x,A.z,A.h,LW.HL,LW.HW]).map(q=>inPath(q[0],q[1],.1)).filter(d=>d!=null);return ds.length?Math.min(...ds):null})}
function acStep(dt){const A=R.AC;if(!A||A.gone)return;if(sawScan(1.5)||((R.oT.XL||-99)>A.t0+.3))A.seen=true;
 const fx=frontX(),zs=corners().map(q=>q[1]);
 // 你的车头稍微伸到车道上：它往左边让一让，从你车头前面绕过去（车道够宽）；你挡得太多才停下来等
 const ahead=Math.max(...zs)>A.z-LW.HL&&Math.min(...zs)<A.z+LW.HL+14;const xsM=Math.max(...corners().map(q=>q[0])),turned=Math.abs(normA(R.h-Math.PI))<1.2,tx=!ahead?AX:turned?Math.min(2.65,Math.max(AX,xsM+.6+LW.HW)):Math.max(-2.3,Math.min(AX,fx-.6-LW.HW));      /* 你还车头朝西伸在车道上：它从你车头前（西边）绕；你已经转向南开进车道：它靠东边从你左边过去 */
 const cl=npcClear(tx,A.z,0,1,'AC'),vt=cl<2.5?0:Math.min(3.2,(cl-2.5)*1.2);A.v=vt<A.v?Math.max(vt,A.v-6*dt):Math.min(vt,A.v+1.5*dt);      // 前面有人、有车就停住等（离 2.5 米）
 if(A.v>.3){const m=.3*A.v*dt,dx=Math.max(-m,Math.min(m,tx-A.x));A.x+=dx;A.h+=(Math.atan2(dx,A.v*dt)-A.h)*Math.min(1,dt*6)}else A.h*=.9;      /* 往旁边挪时车头最多偏约 17°，不会横过来 */
 if(A.v<.1&&cl<3&&!A.honk&&R.ph<=1&&R.v>.05){A.honk=1;honk()}      /* 只有你在往外开、挡住它的时候才按喇叭 */
 // 你停着让它、它也停着（你的车挡住了）：它不会一直不动——等 2 秒，慢慢从你车头前面绕过去
 if(A.v<.05&&R.v<.05&&ahead){A.waitT=(A.waitT||0)+dt;if(A.waitT>1.5&&turned&&A.backD<4){const d=.5*dt;A.z-=d;A.backD=(A.backD||0)+d;A.x+=Math.max(-.3*dt,Math.min(.3*dt,2.65-A.x))}      /* 你已经转进车道、它挡在你前面：它往后倒一点、靠到东边，给你让出来 */
  else if(A.waitT>2&&fx-LW.HW-.4>-2.3&&!turned){const dx=Math.max(-.18*dt,Math.min(0,fx-.6-LW.HW-A.x));A.x+=dx;A.z+=.6*dt;A.h=Math.atan2(dx,.6*dt)}}else A.waitT=0;
 A.z+=A.v*dt;place(A.c,A.x,A.z,A.h,0);
 if(R.ph<=1){const near=A.z+LW.HL>Math.min(...zs)-8&&A.z-LW.HL<Math.max(...zs)+1,inWay=fx<AX+LW.HW+.6;if(near&&inWay&&R.v>.1)ev('noYieldCar');      /* 车头稍微挪出来看两边不算错；它离你不到 8 米、你的车头已经伸到它要走的地方还在往外开，才算没让 */
  if(!A.done&&A.z-LW.HL>Math.max(...zs)+1){A.done=true;if(!R.ev.some(e=>e.key==='noYieldCar')){if(A.seen)banner('看到车道上的车，停下让它先过去：正确','#7ee787');else ev('noSeeCar')}}}
 if(A.z>78){A.c.visible=false;A.gone=1}}      // 开到停车场北头
// 行人：车道里横过去的（从西边的车中间走出来，走向东边的商铺）；出口人行道上走的
function pedStep(dt){const P1=R.P1;if(P1&&!P1.gone){P1.x+=P1.v*dt;walk(P1,dt);place(P1.o,P1.x,P1.z,Math.PI/2,0);
  const sh=Math.sin(R.h),ch=Math.cos(R.h),fw=(P1.x-R.x)*sh+(P1.z-R.z)*ch-LW.HL,lt=(P1.x-R.x)*ch-(P1.z-R.z)*sh;      /* 用车的方向算：行人在车头前 2.5 米以内、还在你的车道上或正要走进来（从你右边走过来，走过你车的左边才算过去） */
  if(R.v>.3&&fw>-.3&&fw<2.5&&lt>-(LW.HW+.5)&&lt<LW.HW+1.4)ev('noYieldPed');      /* 开着车离行人不到 2.5 米 */
  if(P1.x>XC+3){P1.o.visible=false;P1.gone=1}}
 const PE=R.PE;if(PE&&!PE.gone){PE.z+=PE.v*dt;walk(PE,dt);place(PE.o,PE.x,PE.z,0,0);
  const fx=frontX();if(PE.z>R.z-LW.HW-1.6&&PE.z<R.z+LW.HW+.5&&R.v>.3&&fx<PE.x+2.5&&fx>PE.x-.5&&R.ph>=3)ev('noPedE');      /* 行人在你要走的地方（往北走，走过你车的右边就算过去了） */
  if(PE.z>ZA+30){PE.o.visible=false;PE.gone=1}}}
// 倒车出来的车：车头朝里停着，倒出来（往右打），车头朝北，然后往北开走（走东半边）
function backStep(dt){const B=R.B;if(!B||!B.st||B.gone)return;const t=R.t-B.t0;
 if(B.st===1&&npcClear(B.x,B.z,B.h,-1,'B')<1.2){B.v=0;B.rl.forEach(m=>m.visible=true)}      /* 倒车时后面有人、有车：停住等 */
 else if(B.st===1){B.v=-.9;const d=.6;const rx=B.x-Math.sin(B.h)*LW.TX+Math.sin(B.h)*B.v*dt,rz=B.z-Math.cos(B.h)*LW.TX+Math.cos(B.h)*B.v*dt;B.h+=B.v*Math.tan(d)/LW.L*dt;B.x=rx+Math.sin(B.h)*LW.TX;B.z=rz+Math.cos(B.h)*LW.TX;
  if(B.h<=.02){B.h=0;B.st=2;B.v=0;B.t2=R.t;B.rl.forEach(m=>m.visible=false)}
  // 它在倒的时候你还在往前开、离它很近
  const ds=boxCorners([B.x,B.z,B.h,LW.HL,LW.HW]).map(q=>Math.hypot(q[0]-R.x,q[1]-R.z)),dmin=Math.min(...ds);if(t>1.3&&R.v>.3&&dmin<9&&B.z<R.z+2)ev('noYieldBack')}
 else if(B.st===2){if(R.t-B.t2>.8){const cl=npcClear(B.x,B.z,B.h,1,'B'),vt=cl<2.5?0:Math.min(3,(cl-2.5)*1.2);B.v=vt<B.v?Math.max(vt,B.v-6*dt):Math.min(vt,B.v+1.5*dt);B.x+=(1.6-B.x)*Math.min(1,dt*.8);B.z+=B.v*dt}}
 SCN.obst[SCN.obst.length-1]=[B.x,B.z,B.h];place(B.c,B.x,B.z,B.h,0);if(B.z>60){B.c.visible=false;B.gone=1}}
// 商铺前面那条通道上开过来的车：往西开，横过车道尽头，到出口停在大路边，等近处车道有空档就右转上大路
const ECP=(()=>{const P=[],seg=(a,b)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.5);for(let i=0;i<n;i++)P.push([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n])};
 const Rr=3.6,cx=NX+Rr,cz=ZL+Rr;seg([XC+40,ZL],[cx,ZL]);const iH=P.length;for(let i=0;i<12;i++){const a=-Math.PI/2-Math.PI/2*i/12;P.push([cx+Rr*Math.cos(a),cz+Rr*Math.sin(a)])}seg([NX,cz],[NX,400]);P.push([NX,400]);
 const L=[0];for(let i=1;i<P.length;i++)L.push(L[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));return{P,L,sH:L[iH]-((XR+.3+LW.HL)-cx),s0:(XC+40)-(XC+18)}})();      // s0：从商铺南头附近出现      // sH：车头停在大路边的位置
function ecAt(s){const{P,L}=ECP;let i=0;while(i<L.length-2&&L[i+1]<s)i++;const f=Math.min(1,Math.max(0,(s-L[i])/(L[i+1]-L[i]||1)));return[P[i][0]+(P[i+1][0]-P[i][0])*f,P[i][1]+(P[i+1][1]-P[i][1])*f,Math.atan2(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1])]}
function ecSpawn(){const c=car([0xb9bec4,0x2f6fe0,0x4a4f57][Math.random()*3|0]);live.push(c);const p=ecAt(ECP.s0);R.EC={c,s:ECP.s0,v:3.2,x:p[0],z:p[1],h:p[2],st:'drive'};
 R.haz.push(()=>{const E=R.EC;if(!E||E.gone)return null;const ds=boxCorners([E.x,E.z,E.h,LW.HL,LW.HW]).map(q=>inPath(q[0],q[1],.1)).filter(d=>d!=null);return ds.length?Math.min(...ds):null})}
function ecStep(dt){const E=R.EC;if(!E||E.gone)return;let vt=E.st==='go'?(E.road?VR:6):3.5;
 if(E.st==='drive'){vt=Math.min(vt,Math.sqrt(2*1.5*Math.max(0,ECP.sH-E.s)));if(E.s>=ECP.sH-.05&&E.v<.1)E.st='wait'}
 if(E.st==='wait'){vt=0;const ok=R.tf.cars.every(o=>{if(o.gone||o.L!=='N')return true;if(o.z-LW.HL>ZA+.5)return true;return((ZB-.5)-(o.z+LW.HL))/o.v>5.5});if(ok)E.st='go'}      /* 近处车道（从左边来的车）有 5.5 秒以上的空档再右转 */
 const cl=npcClear(E.x,E.z,E.h,1,'EC');if(cl<2.5)vt=0;else vt=Math.min(vt,(cl-2.5)*1.2+.1);      // 让行人、让你的车
 E.v=vt<E.v?Math.max(vt,E.v-6*dt):Math.min(vt,E.v+(E.road?2.5:1.5)*dt);E.s+=E.v*dt;const p=ecAt(E.s);E.x=p[0];E.z=p[1];E.h=p[2];if(E.x<XR-.5&&E.h>-.2)E.road=true;
 if(R.ph===2&&R.v>.5){const ds=boxCorners([E.x,E.z,E.h,LW.HL,LW.HW]).map(q=>inPath(q[0],q[1],.1)).filter(d=>d!=null);if(ds.length&&Math.min(...ds)<4)ev('noYieldEC')}      /* 它在你前面横过、离你不到 4 米你还在开（系统要帮你急刹） */
 place(E.c,E.x,E.z,E.h,0);if(E.z>ZC+200){E.c.visible=false;E.gone=1}}
LS.start(SCENE);
