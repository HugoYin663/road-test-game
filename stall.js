// ============================================================
// stall.js — 项目：停车场倒车入位（尾进，90° 车位）
// 步骤（教材 PROCEDURE FOR 90 DEGREE PARKING – BACKING IN）：
//  1 Safety Scan 看清要停的车位安全、空着、可以停  2 M.S.B. 看镜、打右转灯、看右边盲点
//  3 Position 停在离参考车至少 2 米，司机对着参考车的第 4 个角（远端的车头角）  4 Gear 挂 R，360° 观察
//  5 Aim 往后看着要走的路线  6 Roll 慢慢倒（走路的速度）  7 Steering 方向盘往右打到底  8 Straighten 和旁边的车平行时回正
//  9 Shut-down 挂 P、拉手刹
// ============================================================
// 路线坐标：x 向东（右）为正，z 向北为正；你沿车道往北开，车位在右边（东边），车位里的车头朝东或朝西
const HOOD={drives:[]};      // 停车场没有车道口（lowspeed 里有用到）
const AW=3.6,SD=5.5,SWD=2.75,XC=AW+SD;      // 车道半宽 3.6（车道 7.2 米宽）；车位深 5.5 米、宽 2.75 米；车位尽头的路缘在 x＝9.1
const ZS=k=>k*SWD;      // 第 k 个车位的中心；空车位是第 0 个，参考车（绿车）在第 1 个
const PCX=XC-.55-LW.HL;      // 停着的车的中心离路缘：车头（或车尾）离路缘约 55 厘米
const ST_TXT={
 frontIn:["没有倒车入位","这个项目要尾进：车尾朝里倒进车位，车头朝着车道。"],
 notIn:["没有停进车位","车身要全部停在车位的两条线中间，不能压到旁边的车位，车头也不能伸到车道上。"],
 overLine:["压线了","停好后车身要在两条线中间，左右都要留出空间（旁边的车要能开门）。"],
 notCentre:["没有停在车位中间","停好后左右离两条线差不多远，旁边的车上下车才方便。"],
 crooked:["车身没有摆正","停好后车身要和旁边的车平行（和车位线平行）。倒车时看到车身和旁边的车平行了，就把方向盘回正，再直着往后倒。"],
notAlign:["没有和两边的车对齐","后面离路缘多远不好看，要用两边的车来定：倒到你的外后视镜和旁边车的外后视镜对齐（镜子对镜子），或者你和旁边车的司机位置对齐，就停。"],
 notDeep:["车头伸出了车位","要倒到底一点：车头不要伸到车道上（车头在车位线以内），车尾也不要碰到后面的路缘。"],
 wheelNotStr:["停好后方向盘没有回正","和旁边的车平行时就要回正方向盘（Straighten），停好时车轮是正的。"],
 manyMoves:["调整超过两次","倒进去以后，往前、再往后算一次调整，最多两次。调整太多次，说明起始位置或打方向的时机不对。"],
 no360:["倒车前没有做 360° 观察","每次开始倒车之前，都要把四周看一遍（360° 观察：左后盲点、左镜、中镜、右镜、右后盲点、正后面），确认没有车、行人再倒。"],
 noYieldCar:["车道上有车过来时没有停下让它先过","停车场的车道上有车开过来时，先停住让它过去，再倒车。你一动，车头就会摆到车道上挡住它。"],
 noSeeCar:["没有发现车道上过来的车","这次你正好停着，那辆车过去了，但它过来之前你没有观察（360° 观察、左镜）。倒车前和倒车时要一直观察四周。"],
 noP:["没有挂 P 停好","停好车的最后一步要挂 P，再拉手刹。"]};
// ---------------- 场景 ----------------
const LOT={ASF:M(0xffffff,{map:noise('#6f7176',40,70)}),CAP:M(0xf2efe8),AWN:M(0x2f7d6d),S1:M(0x2f6fe0),S2:M(0xd9483b),S3:M(0x3a9a5b),S4:M(0xf0b429),PAT:M(0x707277),YEL:M(0xd9b23c),CRB:M(0xc9cbcf),SWK:M(0xd5d3cc),GRS:M(0xffffff,{map:noise('#79a95a',50,40)}),
 BRK:M(0xc49a72),BRK2:M(0xc9ad8c),TAN:M(0xc8b79a),GLS:M(0x6f93ad),FRM:M(0xd9dcdf),SGN:M(0xf3efe6),DK:M(0x3a3d42)};
hSlab(0,-300,300,-300,300,-.05,LOT.GRS);
sun.intensity=.75;sun.color.set(0xfff1d6);      // 晴天：阳光更足
hSlab(0,-XC-.3,XC+.3,-160,160,.0,LOT.ASF);      // 停车场路面（老旧的沥青）
// 补过的沥青（深色补丁），看着像图里那种旧停车场
for(let i=0;i<26;i++){const x=(Math.random()*2-1)*(XC-.5),z=(Math.random()*2-1)*120,w=.6+Math.random()*2.2,d=.5+Math.random()*3;const p=mesh(new T.PlaneGeometry(w,d),LOT.PAT,-x,.006,z);p.rotation.x=-Math.PI/2;p.rotation.z=Math.random()*.6;scene.add(p)}
// 车位线（黄色），两边各一排
const SLINE=new T.PlaneGeometry(SD-.1,.1);
for(let k=-30;k<=30;k++)[-1,1].forEach(s=>{const p=mesh(SLINE,LOT.YEL,-(s*(AW+SD/2+.05)),.012,ZS(k)+SWD/2);p.rotation.x=-Math.PI/2;scene.add(p)});
// 右边：车位尽头的路缘、人行道、一排低矮的商铺（砖墙、玻璃门、招牌）
[-1,1].forEach(s=>{box(.2,.15,320,LOT.CRB,s*(XC+.1),.075,0);box(2.6,.14,320,LOT.SWK,s*(XC+1.5),.07,0)});
{const X0=XC+4.2,X1=X0+14;box(X1-X0,4.2,150,LOT.BRK,(X0+X1)/2,2.1,0);box(X1-X0+.6,.35,150.6,LOT.CAP,(X0+X1)/2,4.3,0);      // 一层的浅色商铺（浅砖墙＋白色压檐），往后退一些，不压抑
 box(1.4,.04,150,LOT.SWK,XC+3.3,.15,0);      // 人行道再宽一点
 const SC=[LOT.S1,LOT.S2,LOT.S3,LOT.S4];let si=0;
 for(let z=-70;z<70;z+=8){box(.06,2.7,6.2,LOT.FRM,X0-.03,1.6,z+4);box(.07,2.5,5.8,LOT.GLS,X0-.04,1.55,z+4);box(.08,2.8,.08,LOT.FRM,X0-.05,1.6,z+4);      // 大玻璃橱窗
  box(.1,.7,5.2,SC[si++%4],X0-.06,3.4,z+4);box(.12,.18,6.4,LOT.AWN,X0-.5,2.95,z+4)}      // 彩色招牌、雨棚
 for(let z=-66;z<70;z+=24){const lp=new T.Group();lp.add(mesh(new T.CylinderGeometry(.07,.09,8,8),LOT.DK,0,4,0));lp.add(mesh(new T.BoxGeometry(.9,.18,.4),LOT.DK,.4,8,0));lp.position.set(-(XC+.9),0,z);scene.add(lp)}}      // 路灯杆
// 左边：路缘外面是草地和光秃秃的行道树（图里是早春），再远是一条路和对面的厂房
{for(let z=-150;z<150;z+=9+Math.random()*3)hTree(-(XC+4+Math.random()*1.5),z,0);
 hSlab(0,-XC-16,-XC-8,-300,300,-.02,LOT.ASF);box(30,6,160,LOT.BRK2,-(XC+40),3,0);box(30.4,.5,160.4,LOT.TAN,-(XC+40),6.2,0)}
// 停着的车：右边一排、左边一排；空车位是第 0 个；参考车（白车）在第 1 个
const PCOLS=[0xf4f6f8,0x1f2328,0x1f2328,0xb9bec4,0x7b8794,0x23324f,0x4a4f57,0x5c6b7a,0xeceff1];
const PARKS=[],LX=PCX-LW.HL-2.2-LW.HW;      // 开过来时离参考车的车头（车道边）约 2.2 米
for(let k=-22;k<=22;k++)[1,-1].forEach(s=>{
 if(s>0&&k===0)return;      // 空车位
 const near=s>0&&Math.abs(k)<=1;      // 除了指定的车位，其他车位都停满（不留空车位，免得停错）
 const nose=near?false:Math.random()<.75,h=(s>0)===nose?Math.PI/2:-Math.PI/2;      /* 空车位两边的两辆车都是尾进（车头朝车道），能看到它们的外后视镜 */      // 大多数车头朝里停（尾朝车道）
 const NCOL=[0x2e9d4f,0xe8802a,0xc8352c],col=s>0&&Math.abs(k)<=3?NCOL[Math.abs(k)-1]:PCOLS[Math.random()*PCOLS.length|0];      /* 空车位两边各三辆：绿、橙、红（两边对称），数车位时不会数错；参考车是前面那辆绿车 */
 const jz=near?0:(Math.random()-.5)*.25,jh=near?0:(Math.random()-.5)*.05;
 PARKS.push([s*PCX,ZS(k)+jz,h+jh,col])});
const SCENE={g:0,Y:()=>0,TXT:ST_TXT,SER:['notIn','frontIn','noYieldCar'],vmax:2.0,noSplit:true,noBackCheck:true,      // 倒车时只有右镜往下翻，左镜保持原位（地平线在中间）
 curbs:[{side:1,x:XC},{side:-1,x:-XC}],
 // 考试模式：在停车场的车道里约 15 km/h 开过来，一开始考官就发指令；开过空车位时系统减到很慢，你在合适的地方点“停车”
 exam:{laneX:LX,startZ:-32,crawlZ:-7,missZ:11,side:'R',vcr:15/3.6,insText:'考官：右边那个空车位（上方有蓝色箭头），倒车停进去（back into the parking spot on your right）'},
 okText:'起始位置准确，倒车前做了 360° 观察，往右打到底、和旁边的车平行时回正，车停在车位正中间、车身摆正，挂 P、拉手刹，做得很好。',
 setup(R){Object.assign(R,{x:LX,z:5.3,h:0,gear:'D',ph:EXAM?0:1});R.ac=null;R.n360b=0;
  PARKS.forEach(p=>{const c=car(p[3]);live.push(c);place(c,p[0],p[1],p[2],0)});
  SCN.obst=PARKS.map(p=>[p[0],p[1],p[2]]);
  if(!EXAM)banner('挂 R，做 360° 观察，慢慢往后倒，方向盘往右打到底','#ffe27a',1)},
 onGear(g){R.gT=R.t;if(R.ph===2&&g==='P'){R.ph=3;R.pT=R.t}else if(R.ph===3&&g!=='P')R.ph=2},      /* 挂 P 又马上换回 R/D：当作误操作，继续 */
 onHandover(R){R.ph=1;R.n360b=R.n360||0;      // 停下的位置不算对错：停早了、停晚了，下一步还可以往前或往后调位置
  tip('挂 R，做 360° 观察，慢慢往后倒，方向盘往右打到底')},
 // 困难模式：停下以后第一次 360° 观察时，车道上有一辆车从后面开过来
 on360Start(R){if(HARD&&!R.ac&&R.ph>=1)acSpawn(R,30,true)},
 onSeg(dir,n){if(HARD&&!R.ac&&R.ph>=1&&(R.oT.A==null||R.t-R.oT.A>15))acSpawn(R,16,false);
  if(dir<0&&R.ph>=1&&(R.oT.A==null||R.t-R.oT.A>15))ev('no360');
  if(R.ph>=2){if((R.segD||0)>.3)R.moves=(R.moves||0)+1;R.segD=0}},
 step(R,dt){const t=R.t;
  if(R.ph===1&&R.v<-.05){R.ph=2;R.moves=0;R.segD=0}
  if(R.ph===2)R.segD=(R.segD||0)+Math.abs(R.v)*dt;
  acStep(R,dt);
  if(R.ph===3&&!R.over){const lo=Math.max(R.pT,R.pbT||0,R.gT||0);if(R.pb&&t-lo>1.5){parkDone();finish()}else if(!R.pb&&t-R.pT>5&&t-lo>1.5){parkDone();ev('noPB');finish()}}      /* 挂 P、拉手刹以后，停 1.5 秒没有别的操作才算做完；挂 P 后 5 秒还没拉手刹，判错再结束 */
  if(t>240&&!R.over){if(R.ph<3)ev('noP');finish()}},
 draw(R){},
 topCam(R){return R.ph>=1?[3.5,2,24]:[R.x+1.5,R.z+4,26]}};
function parkDone(){const cs=corners(),zs=cs.map(q=>q[1]),xs=cs.map(q=>q[0]),zl=-SWD/2,zr=SWD/2,over=Math.max(zl-Math.min(...zs),Math.max(...zs)-zr),fx=Math.min(...xs),da=normA(R.h+Math.PI/2);
 if(Math.abs(da)>Math.PI/2)ev('frontIn');
 else if(over>.35||fx<AW-1)ev('notIn');
 else{const deg=Math.abs(da)*180/Math.PI;
  if(over>0)ev('overLine','（车身压过线约 '+Math.round(over*100)+' 厘米）');else if(Math.abs(R.z)>.25)ev('notCentre','（离两边的线：'+(R.z-zl-LW.HW).toFixed(2)+' 米 和 '+(zr-R.z-LW.HW).toFixed(2)+' 米）');
  if(deg>5)ev('crooked','（斜了约 '+Math.round(deg)+'°）');
  const dd=R.x-PCX;if(fx<AW-.15)ev('notDeep','（车头伸出车位线约 '+Math.round((AW-fx)*100)+' 厘米）');;      /* 和两边的车对齐只是找位置的方法，不算硬指标：只要车头／车尾不伸到车道上就行 */
  if(Math.abs(R.w)>.1)ev('wheelNotStr','（方向盘还'+(R.w<0?'往左 ':'往右 ')+Math.round(Math.abs(R.w)*WLOCK)+'°）')}
 const nM=(R.moves||0)+((R.segD||0)>.3?1:0);const nAdj=Math.floor((nM-1)/2);if(nAdj>2)ev('manyMoves','（调整了 '+nAdj+' 次）');
}
// 指定车位上方的蓝色箭头
{const a=new T.Mesh(new T.ConeGeometry(.6,1.4,4),BM(0x1f6feb));a.rotation.x=Math.PI;a.position.set(-PCX,3.2,ZS(0));scene.add(a)}
// 困难模式：车道上一辆车从后面开过来，从你的左边过去
//  · 停下以后第一次 360° 观察时它出现：你会看到它，等它过去再倒就对了
//  · 没做观察就开始动车：它马上过来，你在动 → 没让行；你的车头已经摆到车道上，它就停下来等你（按喇叭）
function acSpawn(R,d,seen){const c=car([0x8e2b2b,0x23324f,0xb9bec4][Math.random()*3|0]);live.push(c);const zMin=Math.min(...corners().map(q=>q[1]));R.ac={c,x:-1.9,z:zMin-d,v:0,t0:R.t,seen,phase:0}}
function acStep(R,dt){const A=R.ac;if(!A||A.gone)return;const cs=corners(),xL=Math.min(...cs.map(q=>q[0])),zMax=Math.max(...cs.map(q=>q[1])),zMin=Math.min(...cs.map(q=>q[1]));
 const need=Math.min(-1.9,xL-.5-LW.HW),room=need>=-(AW-.35-LW.HW);      // 它要从你左边过去，左边那排车的车尾（车道边）是界
 const front=A.z+LW.HL,blocked=!room&&front>zMin-3&&A.z<zMax+LW.HL;      // 过不去：在你车后面 3 米停住等
 const vt=blocked||(!room&&front>zMin-4)?0:4.2;A.v+=Math.max(-5*dt,Math.min(2*dt,vt-A.v));if(!room&&front>zMin-3.2)A.v=Math.min(A.v,0);
 if(A.v===0&&!room&&!A.honk&&front>zMin-5){A.honk=1;honk()}
 if(room)A.x+=Math.max(-1.2*dt,Math.min(1.2*dt,need-A.x));A.z+=A.v*dt;place(A.c,A.x,A.z,0,0);
 if(!A.done&&front>zMin-12&&A.z-LW.HL<zMax){A.phase=1;if(Math.abs(R.v)>.1)ev('noYieldCar')}
 if(!A.done&&A.phase===1&&A.z-LW.HL>zMax){A.done=true;const seen=A.seen||Math.max(R.oT.A||-9,R.mT||-9,R.oT.L||-9)>A.t0+.5;
  if(!R.ev.some(e=>e.key==='noYieldCar')){if(seen)banner('看到车道上的车，停下让它先过去：正确','#7ee787');else ev('noSeeCar')}}
 if(A.z>R.z+120){A.c.visible=false;A.gone=1}}
LS.start(SCENE);
