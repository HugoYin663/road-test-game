// ============================================================
// hill-park.js — 项目：上下坡停车（参考：上坡有路缘车轮朝外；下坡有路缘、没有路缘车轮朝路边）
// ============================================================
// 每次随机一种：上坡有路缘、下坡有路缘、上坡没有路缘、下坡没有路缘。你往北开，靠右边停车，再离开
const HP_MODES=[{k:'upC',up:1,curb:1,name:'上坡、有路缘'},{k:'downC',up:0,curb:1,name:'下坡、有路缘'},{k:'upN',up:1,curb:0,name:'上坡、没有路缘'},{k:'downN',up:0,curb:0,name:'下坡、没有路缘'}];
const HP_Q=(typeof HP_TEST!=='undefined'&&HP_TEST)||((typeof location!=='undefined'?location.search:'').match(/mode=(\w+)/)||[])[1];
// 场景只能建一次（坡度和路缘在建场景时定）：用网址参数或随机选一种；“再来一次”会换一种（重新加载页面）
// 随机：有路缘的为主（上坡有路缘、下坡有路缘各 40%），没有路缘的各 10%
const hpRand=()=>{const r=Math.random();return HP_MODES[r<.4?0:r<.8?1:r<.9?2:3]};
const HP=HP_MODES.find(m=>m.k===HP_Q)||hpRand();
// 考官的指令（英文原话＋中文）
const HP_INS={upC:['上坡、有路缘','uphill, with curb'],downC:['下坡、有路缘','downhill, with curb'],upN:['上坡、没有路缘','uphill, no curb'],downN:['下坡、没有路缘','downhill, no curb']}[HP.k];
const HP_INSTXT='考官：安全的时候靠右停车（pull over），做'+HP_INS[0]+'的坡道停车（'+HP_INS[1]+'）';      // 先用中文，关键词标英文
const HPG=HP.up?.09:-.09;      // 真的坡：每 100 米升（降）9 米
const HOOD=buildHood({g:HPG,curbR:!!HP.curb,curbL:true});      // 每栋房子都有车道：停车时不能挡住车道口
const HP_TXT={
 noSigR:["靠边前没有打右转灯","听到指令后，先打右转灯、做右侧观察，再踩刹车靠边。"],
 noMirror:["没有看后视镜","靠边、离开之前都要先看后视镜（左侧观察、右侧观察里都有）。"],
 noShoulderR:["靠边前没有看右边盲点","踩刹车靠边之前，要做右侧观察：中镜、右镜、右盲点。"],
 noSigL:["离开前没有打左转灯","从路边开出来之前，要打左转灯、做左侧观察，确认安全再走。"],
 noShoulderL:["离开前没有做左侧观察","从路边开出来之前，要做左侧观察（中镜、左镜、左盲点）：后面可能有车正要开过来。"],
 wrongWheels:["车轮方向转错了","上坡有路缘：方向盘往左打（车轮朝外），松刹车后车往后溜，前轮抵住路缘；下坡有路缘、没有路缘：方向盘往右打（车轮朝路边）。"],
 weakWheels:["车轮没有打够","停坡道时方向盘要打到底（或接近打到底），车万一滑动才能被路缘挡住、或者往路边走。"],
 noRest:["车轮没有抵住路缘","有路缘：方向打好、挂 N，点一下松刹车，让车轻轻溜到车轮抵住路缘，停稳后再挂 P。"],
 rollAway:["车往路中间溜了","车轮方向不对，松开刹车后车往路中间溜。坡道停车要先把车轮转对方向，再松刹车。"],
 sigOn:["停好后没有关转向灯","停好车后要关掉转向灯。"],
 noP:["没有挂 P 停好","停车的最后一步要挂 P（再熄火、拉手刹）。"]};
const SCENE={g:HPG,Y:z=>HPG*z,TXT:HP_TXT,SER:['wrongWheels','rollAway'],vmax:2.2,noSplit:true,
 curbs:[{side:1,x:HRW,soft:!HP.curb,gaps:HOOD.drives.filter(d=>d.side>0)},{side:-1,x:-HRW,gaps:HOOD.drives.filter(d=>d.side<0)}],
 alwaysExam:true,keepIns:true,noBackCheck:true,      // 总是从行驶中开始，考官的指令一直留在上方
 stpLabel:'刹车<small>点一下<br>靠边停车</small>',
 // 行驶中不会自动减速：你点“刹车”，系统才减速并靠到右边路缘（离路缘约 15 厘米）停住；停在哪里由你点刹车的时机决定（不要挡住车道口）
 exam:{laneX:2.1,startZ:-140,missZ:70,side:'R',noAutoSlow:true,pullX:HRW-.12-LW.TY-LW.TR,insText:HP_INSTXT},
 okText:'打灯、右侧观察后靠边，没有挡住车道口；车轮方向正确，松刹车让车轮抵住路缘后挂 P；离开前打左灯、左侧观察，做得很好。',
 setup(R){SCN.vmax=2.2;Object.assign(R,{x:2.1,z:-28,h:0,gear:'D',ph:0,hb:false});banner(HP_INSTXT,'#ffe27a',1)},
 // 点“刹车”：这时应该已经打了右转灯、做了右侧观察
 onStopReq(R){if(R.sig!=='R')ev('noSigR');if(!sawMir(12))ev('noMirror');if(!sawSh('R',10))ev('noShoulderR')},
 // 停住了：刹车踩着；打方向、挂 N、松刹车，车溜到位后挂 P
 onStopped(R){R.ph=2;R.hb=true;R.rollD=0;gasMode('hb');if(blocksDrive(1))ev('blockDrive');
  tip('停住了：把方向盘打到正确的方向，挂 N，点一下“松刹车”让车溜到位，停稳后挂 P')},
 onGear(g){if(R.ph===2&&g==='P')parkDone()},
 step(R,dt){const t=R.t;
  // 2：空档松开刹车，车顺着坡溜
  if(R.ph===2&&R.gear==='N'&&!R.hb){
   if(R.stuck)R.v=0;else R.rollD+=Math.abs(R.v)*dt;
   if(HP.curb&&R.curbT!=null&&t-R.curbT<.2){R.rested=true}      // 车轮抵住了路缘，车停住
   if(!HP.curb&&R.rollD>.35&&!R.stuck){const ok=HP.up?R.w>.05:R.w>.05;if(ok){R.stuck=1;R.rested=true;R.v=0}}      // 没有路缘：往路边溜一点就停（车轮压到路边松软的地方）
   if(R.rollD>1.2&&!R.away){R.away=1;ev('rollAway');R.hb=true;gasMode('hb')}}
  // 3：考官说继续行驶：挂 D、打左灯、左侧观察，点油门，系统开走
  if(R.ph===3&&R.gas&&!R.autoGo){if(R.gear!=='D'){R.gas=false;tip('先挂 D 档');mk()}
   else{R.autoGo=true;if(R.sig!=='L')ev('noSigL');if(!sawMir(12))ev('noMirror');if(!sawSh('L',10))ev('noShoulderL');tip('开走了')}}
  if(R.autoGo){R.gear='D';SCN.vmax=4.5;R.gas=true;R.v=Math.min(4.5,R.v+1.2*dt);const hd=Math.atan2(2.1-R.x,6);let e=hd-R.h;
   R.w+=Math.max(-dt/.6,Math.min(dt/.6,Math.max(-1,Math.min(1,e*1.8))-R.w));R.goT=(R.goT||0)+dt;if(R.goT>3.5){finish();return}}
  if(t>180&&!R.over){if(R.ph<3)ev('noP');finish()}},
 topCam(R){return[R.x-3,R.z+2,22]},
 // 选了另一种坡（或“再来一次”换一种）：重新加载页面（坡度在建场景时就定了）
 pick(d){if(d==='rand'||d===HP.k)return false;const k=d;location.search='?mode='+k+'&go=1';return true},
 again(){let k=hpRand().k;if(k===HP.k)k=hpRand().k;location.search='?mode='+k+'&go=1';return true}};
function parkDone(){const wantLeft=HP.k==='upC',ok=wantLeft?R.w<-.05:R.w>.05;
 if(!ok)ev('wrongWheels');else if(Math.abs(R.w)<.6)ev('weakWheels');
 if(HP.curb&&!R.rested&&!R.away)ev('noRest');
 if(R.sig)ev('sigOn');
 R.ph=3;R.hb=false;R.px=R.x;gasMode('gas');mk();setTimeout(()=>{if(!R.over)banner('考官：好。安全的话，请继续行驶（when safe, drive on）','#ffe27a',1)},800)}
LS.start(SCENE);
