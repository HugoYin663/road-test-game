// ============================================================
// three-point.js — 项目：三点调头（先靠右停在 30 厘米内 → 左转灯、看镜子、看盲点、两边观察 → 往前左打死 → 停在左路缘前 → R、右转灯、回头看 → 往后右打死 → 停在右路缘前 → D、左转灯 → 往回开）
// ============================================================
const HOOD=buildHood({g:0,curbR:true,curbL:true});      // 每栋房子都有车道：靠边时不能挡住车道口
const TP_TXT={
 noSigR:["靠边前没有打右转灯","先要靠右边停车：看后视镜、打右转灯、回头看右边盲点，再慢慢靠过去。"],
 noMirror:["没有看后视镜","每次起步、换方向之前都要先看后视镜。"],
 noShoulderR:["靠边前没有看右边盲点","靠右边停车前，要回头看右边盲点。"],
 farCurb:["开始调头前离路缘太远","三点调头要先停在离右边路缘 30 厘米以内，路面才够用。"],
 noSigL:["往前左转前没有打左转灯","第一步往前左转之前，要打左转灯、看后视镜、回头看左边盲点。"],
 noShoulderL:["往前左转前没有看左边盲点","第一步往前左转之前，一定要回头看左边盲点：后面可能有车正开过来。"],
 noScan:["开始调头前没有做 360° 观察","三点调头之前要做 360° 观察：路上两个方向的车、自行车、行人都要确认没有。"],
 no360:["倒车前没有做 360° 观察","倒车之前要做 360° 观察（四周看一遍，包括正后面），确认没有车、自行车、行人再倒。"],
 noSigR2:["倒车前没有打右转灯","第二步倒车之前，按 M.S.B.：看后视镜、打右转灯、回头看。"],
 noSigL3:["最后往前开之前没有打左转灯","最后一步往前开之前，看后视镜、打左转灯、看盲点，再开走。"],
 touchCurb:["车轮碰到了路缘","往前、倒车都要在碰到路缘之前停住。"],
 tooMany:["超过三步才调过来","三点调头要在三步（前、后、前）内完成。每一步方向盘要打得够快、够多，到路中间开始回方向盘，停在路缘前。"],
 unsafe:["有车开过来还在调头","调头之前和调头过程中要一直观察两边：有车开过来，要停下来让它先过。"],
 wrongLane:["调头后没有开在正确的车道","调过头以后要开在新方向的右边车道（原来的对面车道）。"]};
const SCENE={g:0,Y:()=>0,TXT:TP_TXT,SER:['unsafe'],vmax:2.0,noSplit:true,noBackCheck:true,      /* 倒车前做 360° 观察（里面包括看正后面），不用按住回头看 */
 curbs:[{side:1,x:HRW,gaps:HOOD.drives.filter(d=>d.side>0)},{side:-1,x:-HRW,gaps:HOOD.drives.filter(d=>d.side<0)}],
 exam:{laneX:2.1,startZ:-130,crawlZ:-25,missZ:60,noMiss:true,side:'R',noAutoSlow:true,twoStage:true,crawlV:1.2,autoCrawl:6,pullX:HRW-.2-LW.TY-LW.TR,insText:'考官：在右边靠边停车，然后用三点调头往回开'},
 onHandover(R){R.trT=R.t+6+Math.random()*10},
 onStopReq(R){if(!R.c0){R.c0=1;msb('R')}},
 stpLabel:'刹车<small>点一下<br>减速靠边</small>',      // 考试模式：慢下来以后路上才开始有车
 okText:'靠边停在 30 厘米内，每一步之前都做了 M.S.B.，倒车回头看，没有原地打方向、没有碰路缘，三步完成调头，做得很好。',
 onGo(R){banner('调头完成：系统回正方向盘，开到右边车道加速开走','#7ee787')},
 setup(R){SCN.vmax=2.0;Object.assign(R,{x:2.1,z:-20,h:0,gear:'D',ph:0,tr:null,trT:3+Math.random()*12});banner('考官：在右边靠边停车，然后用三点调头往回开','#ffe27a',1);if(EXAM)R.trT=1e9;
  // 路上偶尔有车开过：从前面开过来（对面车道）或者从后面开过来
  const c=car(C[1+Math.random()*8|0]);live.push(c);c.visible=false;R.trc=c},
 onTouch(){if(R.ph>=1)ev('touchCurb')},
 onSeg(dir,n){if(R.ph<1)return;if(dir<0&&R.ph>=2&&(R.oT.A==null||R.t-R.oT.A>15))ev('no360');
  if(R.ph===1&&dir>0)return;      /* 停好后往前（不打方向）：只是在调整位置 */
  if(R.ph===2&&dir<0){R.ph=3;if(R.sig!=='R')ev('noSigR2');if(!sawMir(12))ev('noMirror');banner('第二步：倒车，方向盘往右打到底，一直观察，停在路缘前','')}
  else if(R.ph===3&&dir>0){R.ph=4;if(R.sig!=='L')ev('noSigL3');banner('第三步：往前开，回到右边车道','')}
  else if(R.ph>=4&&dir<0)ev('tooMany')},
 step(R,dt){const t=R.t;
  if(R.ph===0&&R.x>2.45&&!R.c0){R.c0=1;msb('R')}
  if(R.ph===0&&R.v===0&&R.x>2.6&&Math.abs(R.h)<.2){const g=curbGap(1);if(g&&Math.min(g.front,g.rear)<.8){R.ph=1;R.lastDir=0;R.z0=R.z;banner('停好了。准备调头：打左转灯、看后视镜、两边看（左右盲点），没有车再开始','#ffe27a')}}
  // 往前、方向盘往左打：这时才算开始调头，停车位置也在这时候判（停下后还可以前后调整）
  if(R.ph===1&&R.gear==='D'&&R.v>.05&&R.w<-.35){R.ph=2;R.z0=R.z;{const g=curbGap(1);if(g&&g.rear>.35)ev('farCurb','（后轮离路缘 '+g.rear.toFixed(2)+' 米）')}{const bd=blocksDrive(1);if(bd)ev('blockDrive',bd.txt,bd.mark)}msb('L');if(R.oT.A==null||R.t-R.oT.A>15)ev('noScan');banner('第一步：往前，方向盘往左打到底，过了路中间开始回方向盘，停在左边路缘前','')}
  // 路上开过的车：到时间出现，开过去就没了；你在路中间挡着它的车道时它停下来等
  if(!R.tr&&t>R.trT&&R.ph<5){const fromAhead=Math.random()<.5;R.tr={x:fromAhead?-2.1:2.1,lx:fromAhead?-2.1:2.1,z:fromAhead?R.z+140:R.z-140,dir:fromAhead?-1:1,v:11,wait:0};R.trc.visible=true}
  if(R.tr)trafficStep(R,dt);
  // 调过来了：车头朝南、往前开了一段
  // 车头调过来了（和原来方向差不到 20°）：油门键变成“行驶”；按了以后系统回正方向盘、开进车道、加速走，项目结束
  // 车头调过来了（倒过车以后，和原来方向差不到 20°）：
  //  · 正在往前开（第三步左打轮往前）→ 系统直接接手：回正方向盘、开到道路右侧、正常加速，结束
  //  · 停着 → 油门键变成“行驶”，按一下系统接手
  if(!R.autoGo&&!R.over&&Math.cos(R.h)<-.94&&R.revDist>.5){if(R.v>.1&&R.gear==='D'){R.autoGo=true;R.wl=R.wr=false;SCN.onGo(R);gasMode('go');mk()}else if(!R.goShown&&R.gear==='D'){R.goShown=1;R.gas=false;gasMode('go');banner('车头调过来了：按右下角“行驶”，系统开走','#7ee787')}}
  if(R.autoGo){R.gear='D';SCN.vmax=4.5;R.gas=true;R.v=Math.min(4.5,R.v+1.5*dt);const hd=Math.atan2(-2.1-R.x,-6);let e=hd-R.h;while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;
   R.w+=Math.max(-dt/.6,Math.min(dt/.6,Math.max(-1,Math.min(1,e*1.8))-R.w));R.goT=(R.goT||0)+dt;if(R.goT>3.5){finish();return}}
  if(t>180)finish()},
 topCam(R){return R.ph>=1?[-3,(R.z+(R.z0||R.z))/2,28]:[R.x-3,R.z+2,22]}};
// 路上开过来的车：不会穿过你的车。前面被你的车挡住就停下来等；你停着、旁边空间够（2.4 米以上），它就慢慢从旁边绕过去；空间不够就一直等
function trafficStep(R,dt){const c=R.tr,t=R.t;
 // 你的车身轮廓上的点（四个角、每条边上几个点）
 const cs=corners(),pts=[];for(let i=0;i<4;i++){const a=cs[[0,1,3,2][i]],b=cs[[1,3,2,0][i]];for(let k=0;k<4;k++)pts.push([a[0]+(b[0]-a[0])*k/4,a[1]+(b[1]-a[1])*k/4])}
 const near=pts.filter(p=>{const d=(p[1]-c.z)*c.dir;return d>-6&&d<45});      // 它前方（和旁边）的那一段路上，你的车占了哪里
 const xs=near.map(p=>p[0]),mn=Math.min(...xs),mx=Math.max(...xs),occ=near.length>0;
 const clear=x=>!occ||x+1.25<mn-.3||x-1.25>mx+.3;      // 车宽 1.9，两边各留 0.3 米
 // 可以走的空当：路左边到你的车、你的车到路右边
 let tx=c.lx;if(!clear(c.lx)){const L=[[-HRW+.15,mn-.3],[mx+.3,HRW-.15]].filter(q=>q[1]-q[0]>=2.4).sort((p,q)=>Math.abs((p[0]+p[1])/2-c.lx)-Math.abs((q[0]+q[1])/2-c.lx));
  if(L.length&&Math.abs(R.v)<.1&&c.wait>1){tx=(L[0][0]+L[0][1])/2}else tx=null}      // 你停着、它等了 1 秒以上、空当够：绕过去
 if(tx!=null)c.x+=Math.max(-1.2*dt,Math.min(1.2*dt,tx-c.x));
 // 前面最近的障碍（在它车身宽度范围里的你的车）
 let gap=99;near.forEach(p=>{if(Math.abs(p[0]-c.x)<1.25){const d=(p[1]-c.z)*c.dir-2.3;if(d>-1)gap=Math.min(gap,d)}});
 let vt=Math.abs(c.x-c.lx)>.3?4:11;if(gap<40)vt=Math.min(vt,Math.sqrt(2*4*Math.max(0,gap-3)));if(gap<3.2)vt=0;
 c.wait=c.v<.3?c.wait+dt:0;
 c.v=c.v>vt?Math.max(vt,c.v-7*dt):Math.min(vt,c.v+2*dt);c.z+=c.dir*c.v*dt;
 const hd=Math.max(-.25,Math.min(.25,(tx==null?0:tx-c.x)*.25))*c.dir;place(R.trc,c.x,c.z,(c.dir>0?0:Math.PI)+hd,0);
 // 它开过来（30 米以内、还在开）的时候你在动：没让车
 const ahead=(R.z-c.z)*c.dir;if(R.ph>=1&&R.ph<5&&Math.abs(R.v)>.1&&ahead>-2&&ahead<30&&c.v>2&&!R.autoGo)ev('unsafe');
 if(Math.abs(c.z-R.z)>170){R.tr=null;R.trc.visible=false;R.trT=t+15+Math.random()*25}}
LS.start(SCENE);
