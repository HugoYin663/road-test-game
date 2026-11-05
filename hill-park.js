// ============================================================
// hill-park.js — 项目：上下坡停车（参考：上坡有路缘车轮朝外；下坡有路缘、没有路缘车轮朝路边）
// ============================================================
// 每次随机一种：上坡有路缘、下坡有路缘、上坡没有路缘、下坡没有路缘。你往北开，靠右边停车，再离开
const HP_MODES=[{k:'upC',up:1,curb:1,name:'上坡、有路缘'},{k:'downC',up:0,curb:1,name:'下坡、有路缘'},{k:'upN',up:1,curb:0,name:'上坡、没有路缘'},{k:'downN',up:0,curb:0,name:'下坡、没有路缘'}];
const HP_Q=((typeof location!=='undefined'?location.search:'').match(/mode=(\w+)/)||[])[1];
// 场景只能建一次（坡度和路缘在建场景时定）：用网址参数或随机选一种；“再来一次”会换一种（重新加载页面）
const HP=HP_MODES.find(m=>m.k===HP_Q)||HP_MODES[Math.random()*4|0];
const HPG=HP.up?.07:-.07;
const HOOD=buildHood({g:HPG,curbR:!!HP.curb,curbL:true,quiet:[[-15,25]]});
const HP_TXT={
 noSigR:["靠边前没有打右转灯","靠右边停车前，要先看后视镜、打右转灯、回头看右边盲点（M.S.B.），再慢慢靠过去。"],
 noMirror:["没有看后视镜","靠边、离开之前都要先看后视镜，确认后面没有车紧跟着。"],
 noShoulderR:["靠边前没有看右边盲点","靠右边停车前要回头看右边盲点：右边可能有自行车、行人。"],
 noSigL:["离开前没有打左转灯","从路边开出来之前，要看后视镜、打左转灯、回头看左边盲点，确认安全再走。"],
 noShoulderL:["离开前没有看左边盲点","从路边开出来之前，一定要回头看左边盲点：后面可能有车正要开过来。"],
 farCurb:["停车离路边太远","要停在离路缘（或路边）30 厘米以内，车身和路边平行。"],
 notPar:["车身没有和路边平行","停车时车身要和路边平行，车头不要歪着。"],
 wrongWheels:["车轮方向转错了","上坡有路缘：车轮朝外（往左打），往后溜一点让前轮轻靠路缘；下坡有路缘、或者没有路缘：车轮朝路边（往右打）。车轮方向错了，车滑动时会溜到路中间。"],
 weakWheels:["车轮没有打够","停坡道时方向盘要打到底（或接近打到底），车万一滑动才能被路缘挡住、或者往路边走。"],
 noRest:["前轮没有轻靠在路缘上","上坡有路缘：车轮朝外打好后，挂 R 慢慢往后溜一点点，让右前轮轻轻靠在路缘上再挂 P。"],
 rollFar:["调整车轮时车走得太多","调整车轮方向时只要往前或往后走半米左右，不要走太多。"],
 sigOn:["停好后没有关转向灯","停好车后要关掉转向灯。"],
 noP:["没有挂 P 停好","停车的最后一步要挂 P（再熄火、拉手刹）。"]};
const SCENE={g:HPG,Y:z=>HPG*z,TXT:HP_TXT,SER:['wrongWheels'],vmax:2.2,
 curbs:[{side:1,x:HRW,soft:!HP.curb},{side:-1,x:-HRW}],
 exam:{laneX:2.1,startZ:-120,insZ:-70,missZ:30,side:'R',insText:'考官：在前面右边靠边停车（停在房子前面）'},
 okText:'看后视镜、打灯、看盲点后靠边，停在离路边 30 厘米以内，车轮方向正确，离开时也做了 M.S.B.，做得很好。',
 setup(R){Object.assign(R,{x:2.1,z:-28,h:0,gear:'D',ph:0});banner('考官：在前面右边靠边停车（停在房子前面）','#ffe27a',1)},
 onGear(g){const R2=R;if(R2.ph===2&&g==='P')parkDone()},
 step(R,dt){const t=R.t;
  // 0：靠边。开始往右靠时检查 M.S.B.
  if(R.ph===0&&R.x>2.45&&!R.c0){R.c0=1;msb('R')}
  if(R.ph===0&&R.v===0&&R.x>2.6&&Math.abs(R.h)<.2&&R.z>-20){const g=curbGap(1);if(g&&Math.min(g.front,g.rear)<.7){R.ph=2;R.pz=R.z;R.dF=0;R.dB=0;if(Math.max(g.front,g.rear)>.3)ev('farCurb','（前轮离路边 '+g.front.toFixed(2)+' 米、后轮 '+g.rear.toFixed(2)+' 米）');if(Math.abs(R.h)>.1)ev('notPar');banner(HP.curb?'停好了：把车轮转到正确的方向，然后挂 P':'停好了：把车轮转到正确的方向，然后挂 P','#ffe27a')}}
  if(R.ph===2){if(R.v>0)R.dF+=R.v*dt;else R.dB-=R.v*dt}
  // 3：离开。往左开出来时检查 M.S.B.
  if(R.ph===3&&R.gear!=='P'&&Math.abs(R.v)>.05&&!R.c3){R.c3=1}
  if(R.ph===3&&R.x<R.px-.4&&!R.c4){R.c4=1;msb('L')}
  if(R.ph===3&&R.z>R.pz+12&&R.x<2.9){finish();return}
  if(t>150&&!R.over){if(R.ph<3)ev('noP');finish()}},
 topCam(R){return[R.x-3,R.z+2,22]},
 // 选了另一种坡（或“再来一次”换一种）：重新加载页面（坡度在建场景时就定了）
 pick(d){if(d==='rand'||d===HP.k)return false;const k=d;location.search='?mode='+k+'&go=1'+(EXAM?'&ex=1':'');return true},
 again(){location.search='?mode='+HP_MODES.filter(m=>m.k!==HP.k)[Math.random()*3|0].k+'&go=1'+(EXAM?'&ex=1':'');return true}};
function parkDone(){const g=curbGap(1),wantLeft=HP.k==='upC',ok=wantLeft?R.w<-.05:R.w>.05;
 if(!ok)ev('wrongWheels');else if(Math.abs(R.w)<.6)ev('weakWheels');
 if(wantLeft&&g&&g.front>.06)ev('noRest');
 if(R.dF>.8||R.dB>1.3)ev('rollFar');
 if(R.sig)ev('sigOn');
 R.ph=3;R.px=R.x;setTimeout(()=>{if(!R.over)banner('考官：好，现在离开停车位，继续往前开','#ffe27a',1)},800)}
LS.start(SCENE);
