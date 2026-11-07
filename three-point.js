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
 noScan:["开始调头前没有两边观察","三点调头之前要两边都看（360° 观察）：路上两个方向的车、自行车、行人都要确认没有。"],
 noSigR2:["倒车前没有打右转灯","第二步倒车之前，按 M.S.B.：看后视镜、打右转灯、回头看。"],
 noSigL3:["最后往前开之前没有打左转灯","最后一步往前开之前，看后视镜、打左转灯、看盲点，再开走。"],
 touchCurb:["车轮碰到了路缘","往前、倒车都要在碰到路缘之前停住。"],
 tooMany:["超过三步才调过来","三点调头要在三步（前、后、前）内完成。每一步方向盘要打得够快、够多，到路中间开始回方向盘，停在路缘前。"],
 unsafe:["有车开过来还在调头","调头之前和调头过程中要一直观察两边：有车开过来，要停下来让它先过。"],
 wrongLane:["调头后没有开在正确的车道","调过头以后要开在新方向的右边车道（原来的对面车道）。"]};
const SCENE={g:0,Y:()=>0,TXT:TP_TXT,SER:['unsafe'],vmax:2.0,noSplit:true,
 curbs:[{side:1,x:HRW,gaps:HOOD.drives.filter(d=>d.side>0)},{side:-1,x:-HRW,gaps:HOOD.drives.filter(d=>d.side<0)}],
 exam:{laneX:2.1,startZ:-130,crawlZ:-25,missZ:40,side:'R',insText:'考官：在右边靠边停车，然后用三点调头往回开'},
 onHandover(R){R.trT=R.t+6+Math.random()*10},      // 考试模式：慢下来以后路上才开始有车
 okText:'靠边停在 30 厘米内，每一步之前都做了 M.S.B.，倒车回头看，没有原地打方向、没有碰路缘，三步完成调头，做得很好。',
 setup(R){Object.assign(R,{x:2.1,z:-20,h:0,gear:'D',ph:0,tr:null,trT:3+Math.random()*12});banner('考官：在右边靠边停车，然后用三点调头往回开','#ffe27a',1);if(EXAM)R.trT=1e9;
  // 路上偶尔有车开过：从前面开过来（对面车道）或者从后面开过来
  const c=car(C[1+Math.random()*8|0]);live.push(c);c.visible=false;R.trc=c},
 onTouch(){if(R.ph>=1)ev('touchCurb')},
 onSeg(dir,n){if(R.ph<1)return;
  if(R.ph===1&&dir>0){R.ph=2;msb('L');if(!sawSh('R',15))ev('noScan');banner('第一步：往前，方向盘往左打到底，过了路中间开始回方向盘，停在左边路缘前','')}
  else if(R.ph===2&&dir<0){R.ph=3;if(R.sig!=='R')ev('noSigR2');if(!sawMir(12))ev('noMirror');banner('第二步：倒车，方向盘往右打到底，回头看后面，停在路缘前','')}
  else if(R.ph===3&&dir>0){R.ph=4;if(R.sig!=='L')ev('noSigL3');banner('第三步：往前开，回到右边车道','')}
  else if(R.ph>=4&&dir<0)ev('tooMany')},
 step(R,dt){const t=R.t;
  if(R.ph===0&&R.x>2.45&&!R.c0){R.c0=1;msb('R')}
  if(R.ph===0&&R.v===0&&R.x>2.6&&Math.abs(R.h)<.2){const g=curbGap(1);if(g&&Math.min(g.front,g.rear)<.8){R.ph=1;R.lastDir=0;R.z0=R.z;if(blocksDrive(1))ev('blockDrive');if(g.rear>.35)ev('farCurb','（后轮离路缘 '+g.rear.toFixed(2)+' 米）');banner('停好了。准备调头：打左转灯、看后视镜、两边看（左右盲点），没有车再开始','#ffe27a')}}
  // 路上开过的车：到时间出现，开过去就没了；你在路中间挡着它的车道时它停下来等
  if(!R.tr&&t>R.trT&&R.ph<5){const fromAhead=Math.random()<.5;R.tr={x:fromAhead?-2.1:2.1,z:fromAhead?R.z+140:R.z-140,dir:fromAhead?-1:1,v:11};R.trc.visible=true}
  if(R.tr){const c=R.tr;let vt=11;const ahead=(R.z-c.z)*c.dir,lat=Math.abs(R.x-c.x);if(ahead>0&&ahead<35&&(lat<2.4||Math.abs(Math.sin(R.h))>.3)&&R.ph>=1&&R.ph<5)vt=Math.max(0,Math.sqrt(2*5*Math.max(0,ahead-9)));
   c.v=c.v>vt?Math.max(vt,c.v-6*dt):Math.min(vt,c.v+2*dt);c.z+=c.dir*c.v*dt;place(R.trc,c.x,c.z,c.dir>0?0:Math.PI,0);
   if(R.ph>=1&&R.ph<5&&Math.abs(R.v)>.1&&ahead>0&&ahead<35&&c.v>3)ev('unsafe');
   if(Math.abs(c.z-R.z)>170){R.tr=null;R.trc.visible=false;R.trT=t+15+Math.random()*25}}
  // 调过来了：车头朝南、往前开了一段
  if(R.ph===4&&Math.cos(R.h)<-.95&&R.v>.5){R.d4=(R.d4||0)+R.v*dt;if(R.d4>8){if(R.x>-.4)ev('wrongLane');finish();return}}
  if(t>180)finish()},
 topCam(R){return R.ph>=1?[-3,(R.z+(R.z0||R.z))/2,28]:[R.x-3,R.z+2,22]}};
LS.start(SCENE);
