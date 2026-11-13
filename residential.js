// ============================================================
// residential.js — 小区路段连考：坡道停车 → 起步 → 三点调头 → 系统开走 → 路边平行停车（同一条街，像真路考一样一项接一项）
// ============================================================
// 一条南北向的街：南边一段是坡（上坡或下坡，有路缘），往北接平路。你往北开：先坡道停车；起步以后往北开到平路，三点调头；
// 调过头往南开，路西边停着两辆车，在白车后面平行停车
// 错误的 key 都带前缀：hp_ 坡道停车、tp_ 三点调头、pk_ 平行停车（成绩单按三个小项分别填）
const RM=[{k:'upC',up:1,name:'上坡、有路缘',en:'uphill, with curb'},{k:'downC',up:0,name:'下坡、有路缘',en:'downhill, with curb'}];
const RQ=((typeof location!=='undefined'?location.search:'').match(/mode=(\w+)/)||[])[1];
const HP=RM.find(m=>m.k===RQ)||RM[Math.random()<.5?0:1];HP.curb=1;
const HPG=HP.up?.06:-.06,ZH0=-20,ZH1=10;      // 坡度 6%（缓一些，坡道可以长一些）      // 坡道在 z<-20；-20～10 慢慢变平；10 以北是平路
const YF=z=>z>=ZH1?0:z>=ZH0?-HPG*(ZH1-z)*(ZH1-z)/60:-HPG*15+HPG*(z-ZH0);
const GF=z=>z>=ZH1?0:z>=ZH0?HPG*(ZH1-z)/30:HPG;
// 平行停车：路西边（你往南开时的右边）停着参考白车 A（z=PZA）和后面的车 B（更北）
const PX=HRW-.35-LW.HW,PZA=30,PSPACE=8.5,PZB=PZA+LW.HL*2+PSPACE;
const HOOD=buildHood({g:YF,z0:-300,z1:270,curbR:true,curbL:true,quiet:[[PZA-7,PZB+7]]});
const HP_INSTXT='考官：安全的时候靠右停车（pull over），做'+HP.name+'的坡道停车（'+HP.en+'）';
const TP_INSTXT='考官：在右边靠边停车，然后用三点调头往回开';
const PK_INSTXT='考官：用前面那辆白车做参考，在它后面平行停车';
const pre=(p,o)=>Object.fromEntries(Object.entries(o).map(([k,v])=>[p+'_'+k,v]));
const RS_TXT=Object.assign({},pre('hp',{
 noSigR:["靠边前没有打右转灯","听到指令后，先打右转灯、做右侧观察，再踩刹车靠边。"],
 noMirror:["没有看后视镜","靠边、离开之前都要先看后视镜（左侧观察、右侧观察里都有）。"],
 noShoulderR:["靠边前没有看右边盲点","踩刹车靠边之前，要做右侧观察：中镜、右镜、右盲点。"],
 noSigL:["离开前没有打左转灯","从路边开出来之前，要打左转灯、做左侧观察，确认安全再走。"],
 noShoulderL:["离开前没有做左侧观察","从路边开出来之前，要做左侧观察（中镜、左镜、左盲点）：后面可能有车正要开过来。"],
 farCurb:["停车离路边太远","要停在离路缘（或路边）30 厘米以内（45 厘米内不算错），车身和路边平行。"],
 notPar:["车身没有和路边平行","停车时车身要和路边平行，车头不要歪着。"],
 wrongWheels:["车轮方向转错了","上坡有路缘：方向盘往左打（车轮朝外），松刹车后车往后溜，前轮抵住路缘；下坡有路缘、没有路缘：方向盘往右打（车轮朝路边）。"],
 weakWheels:["车轮没有打够","停坡道时方向盘要打到底（或接近打到底），车万一滑动才能被路缘挡住、或者往路边走。"],
 noRest:["车轮没有抵住路缘","有路缘：方向打好、挂 N，点一下松刹车，让车轻轻溜到车轮抵住路缘，停稳后再挂 P。"],
 rollAway:["车往路中间溜了","车轮方向不对，松开刹车后车往路中间溜。坡道停车要先把车轮转对方向，再松刹车。"],
 noP:["没有挂 P 停好","停车的最后一步要挂 P（再熄火、拉手刹）。"]}),pre('tp',{
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
 wrongLane:["调头后没有开在正确的车道","调过头以后要开在新方向的右边车道（原来的对面车道）。"]}),pre('pk',{
 noSigR:["停车前没有打右转灯","平行停车之前：看后视镜、打右转灯（告诉后面的车你要停车）、看右边盲点。"],
 noMirror:["没有看后视镜","开到参考车旁边停车之前，要先看后视镜，确认后面没有车紧跟着。"],
 noShoulderR:["倒车前没有看右边盲点","平行停车倒进去之前，要回头看右边盲点：右后方可能有自行车、行人。"],
 posGap:["停在参考车旁边的位置不对","起始位置：和参考车平行、相隔约 1 米，你的后保险杠和它的后保险杠对齐（或者你的后轮对准它的车尾）。"],
 notIn:["没有停进车位","车要停进两辆车之间的车位里，车身全在路边，不能停在车道上。"],
 farCurb:["停好后离路缘太远","平行停车最后要离路缘 30 厘米以内（前后轮都在 45 厘米内不算错）。"],
 farCurb2:["停好后离路缘稍远","平行停车最后要离路缘 30 厘米以内，这次稍远了一点（前后轮都在 45 厘米内不算错）。"],
 notPar:["不平行于路缘","停好后车身要和路缘平行：前轮、后轮离路缘差不多远。差得多，就再往前或往后调整一下。"],
 notCentre:["没有停在车位中间","停好后前后都要留出空间：挂 D 往前一点，停在两辆车中间（能看到前车的后轮落地处）。"],
 manyMoves:["调整超过两次","倒进去以后，往前、再往后算一次调整，最多两次（最后往前停到中间不另算）。调整太多次，说明打方向的时机不对。"],
 no360:["倒车前没有做 360° 观察","每次开始倒车之前，都要把四周看一遍（360° 观察：左后盲点、左镜、中镜、右镜、右后盲点、正后面），确认没有车、自行车、行人再倒。"],
 few360:["倒车过程中 360° 观察不够","平行停车要一直观察四周：倒车前做一次 360° 观察，车身斜着回正时再做一次，往左打方向前再做一次（至少 3 次）。"],
 noYieldBike:["有自行车过来时没有停车让行","倒车、打方向时车头会摆到车道上。发现后面有自行车过来，要停车让它先过去，再继续。"],
 noSeeBike:["没有发现后面过来的自行车","这次你的车正好停着，自行车过去了，但它过来之前你没有观察（360° 观察、左镜）。倒车时要一直观察四周。"],
 noP:["没有挂 P 停好","停好车的最后一步要挂 P（再熄火、拉手刹）。"]}));
const RS_SER=[];['hp','tp','pk'].forEach(p=>LSSER.concat(p==='hp'?['wrongWheels','rollAway']:p==='tp'?['unsafe']:['notIn','noYieldBike']).forEach(k=>RS_SER.push(p+'_'+k)));
const E=k=>ev(R.task+'_'+k);      // 记错误（带前缀）
// 这一小项做完：通用的错误（碰路缘、换挡等）也加上这一小项的前缀，下一小项还能再记
function tagEv(){R.ev.forEach(e=>{if(!/^(hp|tp|pk)_/.test(e.key))e.key=R.task+'_'+e.key})}
// 按键：每个小项用和单项练习一样的按键
const BTN={
 hp:{bsigL:['sigL','左转灯<small>Signal</small>',''],bsigR:['sigR','右转灯<small>Signal</small>',''],bshL:['obsL','左侧观察<small>中镜＋左镜＋左盲点</small>','#7b5bd6'],bshR:['obsR','右侧观察<small>中镜＋右镜＋右盲点</small>','#7b5bd6'],bback:null,bmir:null,gN:1,gPB:1},
 tp:{bsigL:['sigL','左转灯<small>Signal</small>',''],bsigR:['sigR','右转灯<small>Signal</small>',''],bshL:['obsL','左侧观察<small>中镜＋左镜＋左盲点</small>','#7b5bd6'],bshR:['obsR','右侧观察<small>中镜＋右镜＋右盲点</small>','#7b5bd6'],bback:['obs360','360°观察<small>四周看一遍</small>','#d98a1f'],bmir:null,gN:0,gPB:0},
 pk:{bsigL:['sigR','右转灯<small>Signal</small>',''],bsigR:['obsR','右侧观察<small>两面镜＋右盲点</small>','#7b5bd6'],bshL:['mL','左镜<small>按住看左外后视镜</small>','#3a7d8c'],bshR:['mR','右镜<small>按住看右外后视镜</small>','#3a7d8c'],bback:null,bmir:['obs360','360°观察<small>四周看一遍</small>','#d98a1f'],gN:0,gPB:1}};
let BG1=null;
function setBtns(t){const B=BTN[t];if(!BG1){BG1={};['bsigL','bsigR'].forEach(id=>{const e=$(id);if(e)BG1[id]=e.style.background})}
 ['bsigL','bsigR','bshL','bshR','bback','bmir'].forEach(id=>{const e=$(id);if(!e)return;const c=B[id];if(!c){e.style.display='none';return}e.style.display='';e.dataset.m=c[0];e.innerHTML=c[1];e.style.background=c[2]||BG1[id]||''});
 {const n=$('gN');if(n)n.style.display=B.gN?'':'none';const p=$('gPB');if(p)p.style.display=B.gPB?'':'none'}
 mk()}
const EX_HP={laneX:2.1,startZ:-240,missZ:-40,noMiss:true,side:'R',noAutoSlow:true,twoStage:true,crawlV:.85,pullX:HRW-.2-LW.TY-LW.TR,insText:HP_INSTXT};
const SCENE={Y:YF,TXT:RS_TXT,SER:RS_SER,vmax:2.2,noSplit:true,alwaysExam:true,keepIns:true,noBackCheck:true,
 curbs:[{side:1,x:HRW,gaps:HOOD.drives.filter(d=>d.side>0)},{side:-1,x:-HRW,gaps:HOOD.drives.filter(d=>d.side<0)}],
 obst:[[-PX,PZA,Math.PI],[-PX,PZB,Math.PI]],
 exam:EX_HP,stpLabel:'刹车<small>点一下<br>减速靠边</small>',
 okText:'坡道停车、三点调头、平行停车都做得很好：每一步之前都做了观察、打了灯，停车位置准确。',
 setup(R){if(typeof PKARW!=='undefined')PKARW.visible=false;SCN.exam=EX_HP;SCN.stpLabel='刹车<small>点一下<br>减速靠边</small>';SCN.vmax=2.2;R.task='hp';setBtns('hp');
  if(!R.trc){const c=car(C[1+Math.random()*8|0]);live.push(c);c.visible=false;R.trc=c}R.tr=null;R.trT=1e9;
  },
 onStopReq(R){if(R.task==='hp'){if(R.sig!=='R')E('noSigR');if(!sawMir(12))E('noMirror');if(!sawSh('R',10))E('noShoulderR')}},
 onHandover(R){if(R.task==='tp')R.trT=R.t+6+Math.random()*10},
 onGear(g){if(R.task==='hp')hpGear(g);else if(R.task==='pk')pkGear(g)},
 onTouch(){if(R.task==='tp'&&R.ph>=1)E('touchCurb')},
 onSeg(dir,n){if(R.task==='tp')tpSeg(dir,n);else if(R.task==='pk')pkSeg(dir,n)},
 onGo(R){if(R.task==='tp')banner('调头完成：系统回正方向盘，开到右边车道加速开走','#7ee787')},
 peekR:R=>R.task==='pk'&&R.ph>=1,
 on360Start(R){if(R.task==='pk'&&HARD&&!R.bk&&R.ph>=1&&(R.n360||0)-(R.n360b||0)+1>=R.bkK){bikeSpawn(R,26);R.bk.seen=true}},
 autoV(R,dt){return pkAutoV(R,dt)},
 step(R,dt){if(R.insAt!=null&&R.t>=R.insAt){banner(R.insTxt,'#ffe27a',1);R.insAt=null;if(R.task==='pk')PKARW.visible=true}
  if(R.task==='hp')hpStep(R,dt);else if(R.task==='tp')tpStep(R,dt);else if(R.task==='pk')pkStep(R,dt);
  if(R.t>420&&!R.over)finish()},
 topCam(R){return[R.x-3,R.z+2,22]}};
Object.defineProperty(SCENE,'g',{get(){return GF(R?R.z:0)}});      // 坡度随位置变（坡道上才有）
// ---------------- 1. 坡道停车（和“上下坡停车”一样） ----------------
function hpGear(g){if(R.ph===0&&!R.cruise&&(g==='N'||g==='P')){const cg=curbGap(1);hpParked(cg||{front:9,rear:9})}
 R.gT=R.t;if(R.ph===2&&g==='P'){R.ph=2.5;R.pT=R.t;R.hb=false;$('bgas').style.visibility='hidden';mk()}else if(R.ph===2.5&&g!=='P'){R.ph=2;$('bgas').style.visibility='';mk()}}
function hpParked(g){R.ph=2;R.rollD=0;R.gas=false;if(Math.min(g.front,g.rear)>1)E('farCurb');else if(Math.max(g.front,g.rear)>.45)E('farCurb');if(Math.abs(R.h)>.1)E('notPar');{const bd=blocksDrive(1);if(bd)ev('blockDrive',bd.txt,bd.mark)}
 R.hb=true;gasMode('hb');tip('刹车踩着。方向盘打好以后，点一下“松刹车”让车溜到车轮抵住路缘，停稳后挂 P');mk()}
function hpStep(R,dt){const t=R.t;
 if(R.ph===2&&R.gear==='N'&&!R.hb){if(R.stuck)R.v=0;else R.rollD+=Math.abs(R.v)*dt;
  if(R.curbT!=null&&t-R.curbT<.2)R.rested=true;
  if(R.rollD>1.2&&!R.away){R.away=1;E('rollAway');R.hb=true;gasMode('hb')}}
 if(R.ph===2.5){const lo=Math.max(R.pT,R.pbT||0,R.gT||0);if(R.pb&&t-lo>1.5){hpDone();hpNext()}else if(!R.pb&&t-R.pT>5&&t-lo>1.5){hpDone();ev('noPB');hpNext()}}
 if(R.ph===3&&R.gas&&!R.autoGo){if(R.pb){R.gas=false;tip('先放下手刹（再点一下手刹键）');mk()}else if(R.gear!=='D'){R.gas=false;tip('先挂 D 档');mk()}
  else{R.autoGo=true;if(R.sig!=='L')E('noSigL');if(!sawMir(12))E('noMirror');if(!sawSh('L',10))E('noShoulderL');tip('开走了')}}
 if(R.autoGo){R.gear='D';SCN.vmax=4.5;R.gas=true;R.v=Math.min(4.5,R.v+1.2*dt);const hd=Math.atan2(2.1-R.x,6),e=hd-R.h;
  R.w+=Math.max(-dt/.6,Math.min(dt/.6,Math.max(-1,Math.min(1,e*1.8))-R.w));R.goT=(R.goT||0)+dt;if(R.goT>3)startTP()}}
function hpDone(){const wantLeft=HP.k==='upC',ok=wantLeft?R.w<-.05:R.w>.05;if(!ok)E('wrongWheels');else if(Math.abs(R.w)<.6)E('weakWheels');if(!R.rested&&!R.away)E('noRest')}
function hpNext(){R.ph=3;gasMode('gas');$('bgas').style.visibility='';mk();banner('考官：好。安全的话，请继续行驶（when safe, drive on）','#ffe27a',1)}
// 起步开走以后：系统接着往北开（约 35 km/h），2 秒后考官发三点调头的指令；到了平路才开始慢下来
function resumeCruise(){R.autoGo=false;R.goT=0;R.cruise=true;R.stopReq=false;R.crawl=false;R.slow=0;R.gear='D';R.gas=false;R.wl=R.wr=false;R.hb=false;R.pb=false;R.ph=0;R.revDist=0;R.revNoLook=0;R.lastDir=0;R.c0=0;R.touch={};
 SCN.vmax=2.0;SCN.stpLabel='停车<small>点一下<br>就停住</small>';cruiseUI(true);$('bgas').style.visibility=''}
function startTP(){tagEv();R.task='tp';resumeCruise();const cz=Math.max(100,R.z+95);SCN.exam={laneX:2.1,crawlZ:cz,missZ:cz+55,side:'R',vcr:45/3.6,insText:TP_INSTXT};      // 两项之间开快一点（约 45 km/h）setBtns('tp');
 R.insAt=R.t+2;R.insTxt=TP_INSTXT;R.tr=null;R.trT=1e9;R.z0=null;R.goShown=0}
// ---------------- 2. 三点调头（和“三点调头”一样） ----------------
function tpSeg(dir,n){if(R.ph<1)return;if(dir<0&&(R.oT.A==null||R.t-R.oT.A>15))E('no360');
 if(R.ph===1&&dir>0){R.ph=2;msb('L',{sig:'tp_noSigL',mir:'tp_noMirror',sh:'tp_noShoulderL'});if(R.oT.A==null||R.t-R.oT.A>15)E('noScan');tip('第一步：往前，方向盘往左打到底，过了路中间开始回方向盘，停在左边路缘前')}
 else if(R.ph===2&&dir<0){R.ph=3;if(R.sig!=='R')E('noSigR2');if(!sawMir(12))E('noMirror');tip('第二步：倒车，方向盘往右打到底，一直观察，停在路缘前')}
 else if(R.ph===3&&dir>0){R.ph=4;if(R.sig!=='L')E('noSigL3');tip('第三步：往前开，回到右边车道')}
 else if(R.ph>=4&&dir<0)E('tooMany')}
function tpStep(R,dt){const t=R.t;
 if(R.ph===0&&!R.cruise&&R.x>2.45&&!R.c0){R.c0=1;msb('R',{sig:'tp_noSigR',mir:'tp_noMirror',sh:'tp_noShoulderR'})}
 if(R.ph===0&&!R.cruise&&R.v===0&&R.x>2.6&&Math.abs(R.h)<.2){const g=curbGap(1);if(g&&Math.min(g.front,g.rear)<.8){R.ph=1;R.lastDir=0;R.z0=R.z;{const bd=blocksDrive(1);if(bd)ev('blockDrive',bd.txt,bd.mark)}if(g.rear>.35)E('farCurb');tip('停好了。准备调头：打左转灯、看后视镜、两边看（左右盲点），没有车再开始')}}
 if(!R.tr&&t>R.trT&&R.ph<5){const fromAhead=Math.random()<.5;R.tr={x:fromAhead?-2.1:2.1,lx:fromAhead?-2.1:2.1,z:fromAhead?R.z+140:R.z-140,dir:fromAhead?-1:1,v:11,wait:0};R.trc.visible=true}
 if(R.tr)trafficStep(R,dt);
 if(!R.autoGo&&!R.cruise&&Math.cos(R.h)<-.94&&R.revDist>.5){if(R.v>.1&&R.gear==='D'){R.autoGo=true;R.wl=R.wr=false;SCN.onGo(R);gasMode('go');mk()}else if(!R.goShown&&R.gear==='D'){R.goShown=1;R.gas=false;gasMode('go');tip('车头调过来了：按右下角“行驶”，系统开走')}}
 if(R.autoGo){R.gear='D';SCN.vmax=4.5;R.gas=true;R.v=Math.min(4.5,R.v+1.5*dt);const hd=Math.atan2(-2.1-R.x,-6);let e=hd-R.h;while(e>Math.PI)e-=2*Math.PI;while(e<-Math.PI)e+=2*Math.PI;
  R.w+=Math.max(-dt/.6,Math.min(dt/.6,Math.max(-1,Math.min(1,e*1.8))-R.w));R.goT=(R.goT||0)+dt;if(R.goT>3)startPK()}}
// 路上开过来的车（和“三点调头”一样）
function trafficStep(R,dt){const c=R.tr,t=R.t;
 const cs=corners(),pts=[];for(let i=0;i<4;i++){const a=cs[[0,1,3,2][i]],b=cs[[1,3,2,0][i]];for(let k=0;k<4;k++)pts.push([a[0]+(b[0]-a[0])*k/4,a[1]+(b[1]-a[1])*k/4])}
 const near=pts.filter(p=>{const d=(p[1]-c.z)*c.dir;return d>-6&&d<45});
 const xs=near.map(p=>p[0]),mn=Math.min(...xs),mx=Math.max(...xs),occ=near.length>0;
 const clear=x=>!occ||x+1.25<mn-.3||x-1.25>mx+.3;
 let tx=c.lx;if(!clear(c.lx)){const L=[[-HRW+.15,mn-.3],[mx+.3,HRW-.15]].filter(q=>q[1]-q[0]>=2.4).sort((p,q)=>Math.abs((p[0]+p[1])/2-c.lx)-Math.abs((q[0]+q[1])/2-c.lx));
  if(L.length&&Math.abs(R.v)<.1&&c.wait>1){tx=(L[0][0]+L[0][1])/2}else tx=null}
 if(tx!=null)c.x+=Math.max(-1.2*dt,Math.min(1.2*dt,tx-c.x));
 let gap=99;near.forEach(p=>{if(Math.abs(p[0]-c.x)<1.25){const d=(p[1]-c.z)*c.dir-2.3;if(d>-1)gap=Math.min(gap,d)}});
 let vt=Math.abs(c.x-c.lx)>.3?4:11;if(gap<40)vt=Math.min(vt,Math.sqrt(2*4*Math.max(0,gap-3)));if(gap<3.2)vt=0;
 c.wait=c.v<.3?c.wait+dt:0;c.v=c.v>vt?Math.max(vt,c.v-7*dt):Math.min(vt,c.v+2*dt);c.z+=c.dir*c.v*dt;
 const hd=Math.max(-.25,Math.min(.25,(tx==null?0:tx-c.x)*.25))*c.dir;place(R.trc,c.x,c.z,(c.dir>0?0:Math.PI)+hd,YF(c.z));
 const ahead=(R.z-c.z)*c.dir;if(R.ph>=1&&R.ph<5&&Math.abs(R.v)>.1&&ahead>-2&&ahead<30&&c.v>2&&!R.autoGo)E('unsafe');
 if(Math.abs(c.z-R.z)>170){R.tr=null;R.trc.visible=false;R.trT=t+15+Math.random()*25}}
// ---------------- 3. 平行停车（往南开，停在路西边；和“平行停车”一样，用“往南看”的坐标来算） ----------------
// 本地坐标：lx＝-x、lz＝-z（往南开就像往北开，右边是路缘）
const PAl=-PZA,PBl=-PZB,LANEW=-(PX-2*LW.HW-1);
function startPK(){tagEv();R.task='pk';R.autoGo=false;R.goT=0;R.gear='D';R.gas=false;R.wl=R.wr=false;R.ph=0;R.revDist=0;R.revNoLook=0;R.lastDir=0;R.touch={};R.slow=0;R.stopReq=false;
 if(R.tr){R.tr=null;R.trc.visible=false}R.trT=1e9;SCN.vmax=2.0;SCN.stpLabel='停车<small>点一下<br>就停住</small>';
 const pts=[];for(let z=R.z;z>PZA-60;z-=2)pts.push([LANEW,z]);R.auto={pts,i:0,brk:3};R.cruise=false;cruiseUI(true);gasMode('stp');$('bgas').style.visibility='';setBtns('pk');obsLbl(0);
 R.insAt=R.t+1.5;R.insTxt=PK_INSTXT;R.bk=null}
function pkAutoV(R,dt){const VC=35/3.6,d=R.z-(PZA+14),vt=Math.min(VC,Math.sqrt(1.8*1.8+2*1.6*Math.max(0,d)));
 if(!R.slow&&vt<VC-.3){R.slow=1;if(!sawMir(12))ev('brkNoMir');if(R.sig!=='R')ev('brkNoSig')}return vt}
function pkGear(g){R.gT=R.t;if(R.ph===2&&g==='P'){R.ph=3;R.pT=R.t}else if(R.ph===3&&g!=='P')R.ph=2}
function pkSeg(dir,n){if(HARD&&!R.bk&&R.ph>=1&&(R.oT.A==null||R.t-R.oT.A>15))bikeSpawn(R,14);
 if(dir<0&&R.ph>=1&&(R.oT.A==null||R.t-R.oT.A>15))E('no360');
 if(R.ph>=2){if((R.segD||0)>.3)R.moves=(R.moves||0)+1;R.segD=0}}
function pkStep(R,dt){const t=R.t;
 // 系统沿车道往南开；你点“停车”停在参考车旁边，然后自己倒车
 if(R.auto&&R.stopReq&&R.v===0){R.auto=null;R.w=0;cruiseUI(false);R.gas=false;mk();tip('停住了，现在自己开：按住油门慢慢走，用 ⟲ ⟳ 打方向，P R D 换挡')}
 if(R.auto&&R.ph===0&&R.z<PZA-8){ev('missed');finish();return}
 if(R.ph===0&&!R.auto&&R.v===0&&R.z>PZA-4&&R.z<PZA+6){R.ph=1;R.n360b=R.n360||0;R.bkK=1;obsLbl(1);tip('挂 R，做 360° 观察，慢慢倒进车位（倒车时一直观察）')}
 if(R.ph===1&&R.v<-.05){R.ph=2;R.moves=0;R.segD=0}
 if(HARD)bikeStep(R,dt);
 if(R.ph===2)R.segD=(R.segD||0)+Math.abs(R.v)*dt;
 if(R.ph===3&&!R.over){const lo=Math.max(R.pT,R.pbT||0,R.gT||0);if(R.pb&&t-lo>1.5){pkDone();tagEv();finish()}else if(!R.pb&&t-R.pT>5&&t-lo>1.5){pkDone();ev('noPB');tagEv();finish()}}}
// 右边（西边）路缘到右轮的距离：前轮、后轮
function pkGap(){const T=tires().map(q=>[-q[0],-q[1]]).sort((a,b)=>b[0]-a[0]).slice(0,2).sort((a,b)=>b[1]-a[1]);return{front:HRW-(T[0][0]+LW.TR),rear:HRW-(T[1][0]+LW.TR)}}
function pkDone(){const g=pkGap(),lz=-R.z,fA=(PAl-LW.HL)-(lz+LW.HL),rB=(lz-LW.HL)-(PBl+LW.HL),inS=-R.x>HRW-2.2&&fA>-.2&&rB>-.2;
 if(!inS)E('notIn');
 else{const gt='（右轮离路缘 前 '+Math.round(g.front*100)+' 厘米、后 '+Math.round(g.rear*100)+' 厘米）';
  if(Math.abs(g.front-g.rear)>.25)ev('pk_notPar',gt);else if(Math.max(g.front,g.rear)>.6)ev('pk_farCurb',gt);else if(Math.max(g.front,g.rear)>.45)ev('pk_farCurb2',gt);
  if(fA<.5||rB<.5)ev('pk_notCentre','（前面留了 '+fA.toFixed(1)+' 米，后面留了 '+rB.toFixed(1)+' 米）')}
 const nM=(R.moves||0)+((R.segD||0)>.3?1:0);const nAdj=Math.floor((nM-1)/2);if(nAdj>2)ev('pk_manyMoves','（调整了 '+nAdj+' 次）');
 if((R.n360||0)-(R.n360b||0)<3)ev('pk_few360','（停下以后一共做了 '+((R.n360||0)-(R.n360b||0))+' 次，要 3 次：倒车前、车身斜着回正时、往左打方向前）')}
// 路边停着的两辆车、参考车上方的箭头
const PARKC=[];[[PZA,0xf4f6f8],[PZB,[0x7b8794,0x1f2328,0x4a4f57,0x8e2b2b][Math.random()*4|0]]].forEach(([z,col])=>{const c=car(col);place(c,-PX,z,Math.PI,YF(z));scene.add(c);PARKC.push(c)});
const PKARW=new T.Mesh(new T.ConeGeometry(.6,1.4,4),BM(0x1f6feb));PKARW.rotation.x=Math.PI;PKARW.position.set(PX,3.2+YF(PZA),PZA);PKARW.visible=false;scene.add(PKARW);      // 考官发平行停车指令时才出现
function obsLbl(p){const b=document.querySelector('[data-m="obsR"]');if(b&&R.task==='pk')b.innerHTML=p?'看右前方<small>按住看 A 柱和右镜</small>':'右侧观察<small>两面镜＋右盲点</small>'}
// 困难模式：自行车从后面（北边）骑过来，从你车的左边（东边）骑过去
function bikeSpawn(R,d){const c=cyclist(0x2e86de);live.push(c);const zMax=Math.max(...corners().map(q=>q[1]));R.bk={c,x:1.6,z:zMax+d,v:5,t0:R.t,phase:0}}
function bikeStep(R,dt){const B=R.bk;if(!B)return;
 const cs=corners(),xR=Math.max(...cs.map(q=>q[0])),xt=Math.min(3.4,Math.max(1.6,xR+1.1));B.x+=Math.max(-1.5*dt,Math.min(1.5*dt,xt-B.x));
 B.z-=B.v*dt;place(B.c,B.x,B.z,Math.PI,YF(B.z));B.c.userData.wh.forEach(w=>w.rotation.x-=B.v*dt/.36);
 const zMax=Math.max(...cs.map(q=>q[1])),zMin=Math.min(...cs.map(q=>q[1]));
 if(!B.done&&B.z<zMax+12&&B.z>zMin-1){B.phase=1;if(Math.abs(R.v)>.1)E('noYieldBike')}
 if(!B.done&&B.phase===1&&B.z<zMin-1){B.done=true;const seen=B.seen||Math.max(R.oT.A||-9,R.mT||-9,R.oT.L||-9)>B.t0+.5;
  if(!R.ev.some(e=>e.key==='pk_noYieldBike')){if(seen)tip('看到自行车，停车让它先过去：正确');else E('noSeeBike')}}
 if(!B.hit&&obbHit([R.x,R.z,R.h,LW.HL,LW.HW],[B.x,B.z,Math.PI,.9,.35])){B.hit=1;ev('crash');crashSnd();B.done=true}
 if(B.z<R.z-150){B.c.visible=false;R.bk.gone=1}}
LS.start(SCENE);
