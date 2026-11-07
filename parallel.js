// ============================================================
// parallel.js — 项目：平行停车（停在参考车旁边约 1 米、后保险杠对齐 → R、回头看 → 慢慢倒、往右打到底 → 车身 45° 时回正 → 车头过了参考车后保险杠，往左打到底 → 和路缘平行时停 → D、停在车位中间 → P）
// ============================================================
const HOOD=buildHood({g:0,curbR:true,curbL:true,quiet:[[-30,12]]});
// 路边停着的车：参考车 A（你要停在它后面），后面的车 B，车位约 8.5 米长；两辆车离路缘约 35 厘米
const PX=HRW-.35-LW.HW,PA=0,SPACE=8.5,PB=PA-LW.HL*2-SPACE;
const PARKS=[[PX,PA],[PX,PB]];      // 路边只停两辆：参考车 A 和后面的车 B
const PK_TXT={
 noSigR:["停车前没有打右转灯","平行停车之前：看后视镜、打右转灯（告诉后面的车你要停车）、看右边盲点。"],
 noMirror:["没有看后视镜","开到参考车旁边停车之前，要先看后视镜，确认后面没有车紧跟着。"],
 noShoulderR:["倒车前没有看右边盲点","平行停车倒进去之前，要回头看右边盲点：右后方可能有自行车、行人。"],
 posGap:["停在参考车旁边的位置不对","起始位置：和参考车平行、相隔约 1 米，你的后保险杠和它的后保险杠对齐（或者你的后轮对准它的车尾）。"],
 notIn:["没有停进车位","车要停进两辆车之间的车位里，车身全在路边，不能停在车道上。"],
 farCurb:["停好后离路缘太远","平行停车最后要离路缘 30 厘米以内（前后轮都在 40 厘米以内不算错）。"],
 notPar:["不平行于路缘","停好后车身要和路缘平行：前轮、后轮离路缘差不多远。差得多，就再往前或往后调整一下。"],
 notCentre:["没有停在车位中间","停好后前后都要留出空间：挂 D 往前一点，停在两辆车中间（能看到前车的后轮落地处）。"],
 manyMoves:["调整超过两次","倒进去以后，往前、再往后算一次调整，最多两次（最后往前停到中间不另算）。调整太多次，说明打方向的时机不对。"],
 sigOn:["停好后没有关转向灯","停好车后要关掉转向灯。"],
 no360:["倒车前没有做 360° 观察","每次开始倒车之前，都要把四周看一遍（360° 观察：左后盲点、左镜、中镜、右镜、右后盲点、正后面），确认没有车、自行车、行人再倒。"],
 few360:["倒车过程中 360° 观察不够","平行停车要一直观察四周：倒车前做一次 360° 观察，车身斜着回正时再做一次，往左打方向前再做一次（至少 3 次）。"],
 noYieldBike:["有自行车过来时没有停车让行","倒车、打方向时车头会摆到车道上。发现后面有自行车过来，要停车让它先过去，再继续。"],
 noSeeBike:["没有发现后面过来的自行车","这次你的车正好停着，自行车过去了，但它过来之前你没有观察（360° 观察、左镜）。倒车时要一直观察四周。"],
 noP:["没有挂 P 停好","停好车的最后一步要挂 P（再熄火、拉手刹）。"]};
const SCENE={g:0,Y:()=>0,TXT:PK_TXT,SER:['notIn','noYieldBike'],vmax:2.0,noSplit:true,noBackCheck:true,      /* 倒车不再要求按住回头看：倒车前做 360° 观察（里面包括看正后面） */
 curbs:[{side:1,x:HRW},{side:-1,x:-HRW}],
 // 考试模式：从后面 140 米开过来（听到指令后有 10 秒左右看镜子、打灯，系统才开始减速），一开始考官就发指令；离参考车约 14 米时系统已经减到很慢，你点“停车”停在参考车旁边；开过参考车 8 米还没停就算错过
 exam:{laneX:PX-2*LW.HW-1,startZ:PA-140,crawlZ:PA-14,missZ:PA+8,side:'R',insText:'考官：用前面那辆白车做参考，在它后面平行停车'},
 okText:'停在参考车旁边的位置准确，倒车时一直做 360° 观察，打方向的时机准确，没有碰车、没有碰路缘，停在车位中间、离路缘 30 厘米内，做得很好。',
 setup(R){Object.assign(R,{x:.35,z:PB-26,h:0,gear:'D',ph:0});R.obst=[];
  PARKS.forEach((p,i)=>{const c=car(i===0?0xf4f6f8:[0x7b8794,0x1f2328,0x4a4f57,0x8e2b2b][Math.random()*4|0]);live.push(c);place(c,p[0],p[1],0,0)});      // 参考车固定是白车
  SCN.obst=PARKS.map(p=>[p[0],p[1],0]);obsLbl(0);R.bk=null;banner('考官：用前面那辆白车（车顶上方有蓝色箭头）做参考，在它后面平行停车','#ffe27a',1)},
 onGear(g){if(R.ph===2&&g==='P')parkDone()},
 peekR:R=>R.ph>=1,
 // 困难模式：停下后的第 bkK 次 360° 观察开始时，自行车出现在后面约 26 米（观察到“正后面”时正好看得到）
 on360Start(R){if(HARD&&!R.bk&&R.ph>=1&&(R.n360||0)-(R.n360b||0)+1>=R.bkK){bikeSpawn(R,26);R.bk.seen=true}},      // 停到参考车旁边以后，“右侧观察”变成按住看右前方（找 A 柱参考点）
 onSeg(dir,n){if(HARD&&!R.bk&&R.ph>=1&&(R.oT.A==null||R.t-R.oT.A>15))bikeSpawn(R,14);      // 困难模式：没做观察就开始动车，自行车马上从后面过来
 if(dir<0&&R.ph>=1&&(R.oT.A==null||R.t-R.oT.A>15))ev('no360');      /* 每次开始倒车前 15 秒内要做过 360° 观察 */
  if(R.ph>=2){if((R.segD||0)>.3)R.moves=(R.moves||0)+1;R.segD=0}},      /* 每换一次方向，结算上一段：走了 30 厘米以上才算一次 */
 step(R,dt){const t=R.t;
  // 0：开到参考车旁边停下（第一次停在参考车附近）：检查 M.S.B. 和起始位置
  if(R.ph===0&&R.v===0&&R.z>PA-6&&R.z<PA+4){R.ph=1;R.n360b=R.n360||0;R.bkK=1+(Math.random()*2|0);obsLbl(1);if(!EXAM)msb('R',{sh:'noShoulderR'});      /* 考试模式里减速前已经检查过镜子和转向灯 */const gap=(PX-LW.HW)-(R.x+LW.HW),al=(R.z-LW.HL)-(PA-LW.HL);banner('挂 R，做 360° 观察，慢慢倒进车位（倒车时一直观察）','#ffe27a')}
  if(R.ph===1&&R.v<-.05){R.ph=2;R.moves=0;R.segD=0}
  if(HARD)bikeStep(R,dt);
  if(R.ph===2)R.segD=(R.segD||0)+Math.abs(R.v)*dt;
  if(t>200&&!R.over){if(R.ph<3)ev('noP');finish()}},
 draw(R){},
 topCam(R){return R.ph>=1?[.5,(PA+PB)/2,26]:[R.x-1.5,R.z+4,26]}};
function parkDone(){const g=curbGap(1),fA=(PA-LW.HL)-(R.z+LW.HL),rB=(R.z-LW.HL)-(PB+LW.HL),inS=R.x>HRW-2.2&&fA>-.2&&rB>-.2;
 if(!inS)ev('notIn');
 else{const gt='（右轮离路缘 前 '+Math.round(g.front*100)+' 厘米、后 '+Math.round(g.rear*100)+' 厘米）';      // 宽容度：前后都在 40 厘米内、前后相差不到 25 厘米都不算错
  if(g&&Math.abs(g.front-g.rear)>.25)ev('notPar',gt);else if(g&&Math.max(g.front,g.rear)>.4)ev('farCurb',gt);
 if(fA<.5||rB<.5)ev('notCentre','（前面留了 '+fA.toFixed(1)+' 米，后面留了 '+rB.toFixed(1)+' 米）')}
 const nM=(R.moves||0)+((R.segD||0)>.3?1:0);const nAdj=Math.floor((nM-1)/2);if(nAdj>2)ev('manyMoves','（调整了 '+nAdj+' 次）');      /* 倒进去以后：往前＋往后＝一次调整；最后单独往前停到中间不算。最多 2 次 */
 if((R.n360||0)-(R.n360b||0)<3)ev('few360','（停下以后一共做了 '+((R.n360||0)-(R.n360b||0))+' 次，要 3 次：倒车前、车身斜着回正时、往左打方向前）');
 if(R.sig)ev('sigOn');
 R.ph=3;setTimeout(()=>{if(!R.over)finish()},1200)}
// 参考车上方的箭头（俯视里看得清是哪辆）
{const a=new T.Mesh(new T.ConeGeometry(.6,1.4,4),BM(0x1f6feb));a.rotation.x=Math.PI;a.position.set(-PX,3.2,PA);scene.add(a)}
// “右侧观察”按钮：停车前＝中镜、右镜、右盲点；停下以后＝按住看右前方
function obsLbl(p){const b=document.querySelector('[data-m="obsR"]');if(b)b.innerHTML=p?'看右前方<small>按住看 A 柱和右镜</small>':'右侧观察<small>两面镜＋右盲点</small>'}
// 困难模式：一辆自行车从后面沿着马路骑过来，从你车的左边骑过去（不停）
//  · 停下以后的第 1 或第 2 次 360° 观察时它出现在后面：你会看到它，等它过去再动就对了
//  · 你没做观察就开始动车：它马上从后面过来，你正在动 → 没让行
function bikeSpawn(R,d){const c=cyclist(0x2e86de);live.push(c);const zMin=Math.min(...corners().map(q=>q[1]));R.bk={c,x:-1.6,z:zMin-d,v:5,t0:R.t,phase:0}}
function bikeStep(R,dt){const B=R.bk;if(!B)return;
 const cs=corners(),xL=Math.min(...cs.map(q=>q[0])),xt=Math.max(-3.4,Math.min(-1.6,xL-1.1));B.x+=Math.max(-1.5*dt,Math.min(1.5*dt,xt-B.x));      // 你的车头摆出来了，它就往左边让一点
 B.z+=B.v*dt;place(B.c,B.x,B.z,0,0);B.c.userData.wh.forEach(w=>w.rotation.x-=B.v*dt/.36);
 const zMax=Math.max(...cs.map(q=>q[1])),zMin=Math.min(...cs.map(q=>q[1]));
 // 它从你车后面 12 米到骑过你的车头：你的车要停着
 if(!B.done&&B.z>zMin-12&&B.z<zMax+1){B.phase=1;if(Math.abs(R.v)>.1)ev('noYieldBike')}
 if(!B.done&&B.phase===1&&B.z>zMax+1){B.done=true;const seen=B.seen||Math.max(R.oT.A||-9,R.mT||-9,R.oT.L||-9)>B.t0+.5;
  if(!R.ev.some(e=>e.key==='noYieldBike')){if(seen)banner('看到自行车，停车让它先过去：正确','#7ee787');else ev('noSeeBike')}}
 if(!B.hit&&obbHit([R.x,R.z,R.h,LW.HL,LW.HW],[B.x,B.z,0,.9,.35])){B.hit=1;ev('crash');crashSnd();B.done=true}
 if(B.z>R.z+150){B.c.visible=false;R.bk.gone=1}}      // 一直骑远，走远了才消失
LS.start(SCENE);
