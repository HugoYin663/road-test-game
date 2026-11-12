// ============================================================
// lowspeed.js — 低速操作项目（上下坡停车、三点调头、平行停车）共用：开车（方向盘、油门、挡位）、观察、碰路缘、分屏画面、总结
// ============================================================
// 每个项目自己写一个 SCN 对象（setup、step、文字），最后调用 LS.start(SCN)
// 你的车：中心 (x,z)，车头方向 h（0＝往北，正＝往右转），车速 v（倒车为负），方向盘 w（-1 打死到左 … 1 打死到右）
const WLOCK=540;      // 方向盘打到底＝540°（一圈半；一般轿车从左打到底到右打到底约 3 圈）
const LW={L:2.7,HL:2.3,HW:.95,MAXD:.6,TX:1.35,TY:.8,TR:.12};      // 轴距、半车长、半车宽、前轮最大转角、轮子离车中心（前后、左右）、轮胎半宽
const mine=car(C[0]);
let R=null,SCN=null,round=0,playing=false,gt=0,view=1,yawD=0,az=2.4,el=.85,drag=false,lx=0,ly=0,DIFF='easy';
const live=[];
const LSTXT={
 dryS:["原地打方向盘（dry steering）","车没动的时候不要转方向盘：伤轮胎和转向系统，路考会扣分。要先让车慢慢动起来，再一边走一边打方向。"],
 gearMove:["车没停稳就换挡","换挡（D、R、P）之前要先把车完全停住。"],
 noPB:["停好后没有拉手刹","停车的最后一步：挂 P 以后，还要拉上手刹（点 P 档左边的手刹键）。"],
 noLookBack:["倒车时没有回头看后面","倒车时要回头从后窗看后面（按住“回头看”），不能只看后视镜。"],
 hitCurb:["车轮撞到了路缘","靠近路缘时要很慢，车轮最多轻轻碰到路缘，不能撞上去。"],
 mountCurb:["车轮开上了路缘","车轮压上路缘、人行道，在路考里是严重错误。"],
 crash:["碰到了别的车","倒车、转弯时车身四个角都要留意，随时准备停车。"],
 brkNoMir:["减速前没有看后视镜","听到考官的指令后，在减速之前先看后视镜（后面有没有车、离多近），再打转向灯。"],
 brkNoSig:["减速前没有打转向灯","要靠边停车：先看后视镜、打右转灯，再减速，让后面的车早点知道你要停。"],
 hardBrake:["刹车太急，后车差点追尾","听到指令后要提早、平稳地减速。刹得太急，后面的车来不及反应。"],
 missed:["错过了停车的位置","听到考官指令后要提早减速，在指定的位置停下来。开过头了在路考里就是没有完成这个项目。"],
 blockDrive:["停车挡住了车道口","靠边停车不能挡住别人家的车道（车道口那一段路缘是平的）。要停在两个车道口中间的路边。"],
 offRoad:["车轮开出了路面","没有路缘的路边，车轮不要开出路边白线、开到砂石路肩外面去。"]};
const LSSER=['mountCurb','crash','missed'];
// 考试模式：开局车在路上行驶（系统保持车道、约 35 km/h），考官马上发指令；快到的时候系统自动减速到很慢（约 6 km/h），你点“停车”停在想停的地方，然后这个键变成“油门”，换成低速操作
let EXAM=/[?&]ex=1/.test(typeof location!=='undefined'?location.search:'');const VCR=35/3.6,VCRAWL=1.8;let HARD=/[?&]hard=1/.test(typeof location!=='undefined'?location.search:'');      // HARD：困难模式（项目里会多出自行车等）
// 轮子在地上的位置（前轮跟着方向盘转）：[x,z,左右(-1左/1右),前后(1前/-1后)]
function tires(){const s=Math.sin(R.h),c=Math.cos(R.h);return[[1,1],[1,-1],[-1,1],[-1,-1]].map(([fb,lr])=>[R.x+s*LW.TX*fb+c*LW.TY*lr,R.z+c*LW.TX*fb-s*LW.TY*lr,lr,fb])}
// 车身四个角
function corners(){const s=Math.sin(R.h),c=Math.cos(R.h);return[[1,1],[1,-1],[-1,1],[-1,-1]].map(([fb,lr])=>[R.x+s*LW.HL*fb+c*LW.HW*lr,R.z+c*LW.HL*fb-s*LW.HW*lr])}
// 右边路缘到右边轮胎的距离（米）：front＝前轮、rear＝后轮
// 停着的车有没有挡住右边的车道口（车身和车道口重叠超过 30 厘米）
// 车头或车尾伸进车道口超过 50 厘米才算挡住；返回挡住的是车头还是车尾、伸进去多少（截图里把那个车道口标红）
function blocksDrive(side){side=side||1;const ds=(HOOD.drives||[]).filter(d=>d.side===side),a=R.z-LW.HL,b=R.z+LW.HL;let w=null;
 ds.forEach(d=>{const ov=Math.min(b,d.z1)-Math.max(a,d.z0);if(ov>.5&&(!w||ov>w.ov))w={ov,end:d.z0>R.z?'车头':d.z1<R.z?'车尾':'车身',d}});
 if(!w)return null;return{txt:'（'+w.end+'伸进车道口约 '+Math.round(w.ov*100)+' 厘米。车道口两边的标杆就是车道口的边，车头、车尾都要在标杆外面；车尾可以用右镜看后面的标杆）',mark:{x0:side>0?HRW-.4:-HRW-1.2,x1:side>0?HRW+1.2:-HRW+.4,z0:w.d.z0,z1:w.d.z1}}}
function curbGap(side){const t=tires(),cb=(SCN.curbs||[]).find(c=>c.side===side);if(!cb)return null;const g=k=>{const q=t.find(a=>a[2]===side&&a[3]===k);return side>0?cb.x-(q[0]+LW.TR):(q[0]-LW.TR)-cb.x};return{front:g(1),rear:g(-1)}}
function banner(t,col,big){const b=$('bn');b.textContent=t;b.style.color=col||'';if(big){const e=$('cf');e.textContent=t;e.classList.remove('go');void e.offsetWidth;e.classList.add('go')}}
// 小提示（不盖掉上面考官的指令）：在指令下面显示几秒
function tip(t){let e=$('tip');if(!e){e=document.createElement('div');e.id='tip';e.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:calc(74px + env(safe-area-inset-top,0px));max-width:60vw;text-align:center;color:#7ee787;background:rgba(0,0,0,.55);padding:5px 12px;border-radius:9px;font-size:13px;z-index:3;pointer-events:none;transition:opacity .3s';document.body.appendChild(e)}
 e.textContent=t;e.style.opacity=1;clearTimeout(tip.h);tip.h=setTimeout(()=>e.style.opacity=0,4500)}
function flash(t){const f=$('fl');f.textContent=t;f.style.opacity=1;clearTimeout(flash.h);flash.h=setTimeout(()=>f.style.opacity=0,2000)}
function setSig(s){R.sig=s;R.sigT=R.t;const e=$('sg');e.style.display=s?'block':'none';e.textContent=s==='L'?'⬅':'➡';if(s)tick(true);mk()}
function mk(){const on={sigL:R.sig==='L',sigR:R.sig==='R',mir:R.look&&R.look.k==='M',pb:R.pb,obsR:(R.look&&R.look.k==='RS')||R.peek,obsL:R.look&&R.look.k==='LS',mL:R.mh==='L',mR:R.mh==='R',obs360:R.look&&R.look.k==='A',scan:R.look&&R.look.k==='X',lookL:R.hold&&R.hold.k==='L',lookR:R.hold&&R.hold.k==='R',creep:R.creep,shL:R.look&&R.look.k==='L',shR:R.look&&R.look.k==='R',back:R.back,wl:R.wl,wr:R.wr,gas:R.gas,stp:R.stopReq};
 document.querySelectorAll('.b').forEach(b=>b.classList.toggle('on',!!on[b.dataset.m]));$('gear').textContent=R.gear;['P','R','N','D'].forEach(g=>{const e=$('g'+g);if(e)e.classList.toggle('cur',R.gear===g)})}
let SNC=null;
let SNMK=null;function snap(mk){try{const sz=ren.getSize(new T.Vector2());ren.setScissorTest(false);ren.setViewport(0,0,sz.x,sz.y);const cvs=ren.domElement,W=360,H=240;if(!cvs.width)return null;if(!SNC)SNC=new T.PerspectiveCamera(45,1,1,300);SNC.aspect=cvs.width/cvs.height;SNC.updateProjectionMatrix();
 const y=SCN.Y(R.z);SNC.position.set(-R.x,y+26,R.z);SNC.up.set(0,0,1);SNC.lookAt(-R.x,y,R.z);const vc=cockpit.visible,vm=mine.visible;cockpit.visible=false;mine.visible=true;placeMine();
 if(!SNMK){SNMK=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:.55,depthTest:false}));SNMK.rotation.x=-Math.PI/2;SNMK.renderOrder=9;scene.add(SNMK)}
 SNMK.visible=!!mk;if(mk){SNMK.scale.set(mk.x1-mk.x0,mk.z1-mk.z0,1);SNMK.position.set(-(mk.x0+mk.x1)/2,SCN.Y((mk.z0+mk.z1)/2)+.3,(mk.z0+mk.z1)/2)}      // 红色：挡住的车道口
 const lv=typeof H_LEAF!=='undefined'?H_LEAF:[];lv.forEach(m=>{m.transparent=true;m.opacity=.25});      // 俯视截图里树冠变透明，不挡车
 ren.render(scene,SNC);lv.forEach(m=>{m.transparent=false;m.opacity=1});SNMK.visible=false;cockpit.visible=vc;mine.visible=vm;
 const c2=document.createElement('canvas');c2.width=W;c2.height=H;const sw=Math.min(cvs.width,cvs.height*W/H),sh=sw*H/W;c2.getContext('2d').drawImage(cvs,(cvs.width-sw)/2,(cvs.height-sh)/2,sw,sh,0,0,W,H);return c2.toDataURL('image/jpeg',.82)}catch(e){return null}}
function ev(key,add,mk){if(R.ev.some(e=>e.key===key))return;const t=SCN.TXT[key]||LSTXT[key];R.ev.push({key,title:t[0],text:t[1]+(add||''),img:snap(mk)});flash(t[0])}
// 转向灯、看后视镜、看盲点（左／右）、回头看后面（按住）、挡位、方向盘（按住）、油门（按住；松开就刹车停住）
function cmd(m){if(!R||R.over||!playing)return;
 if(m==='sigL'||m==='sigR'){const s=m==='sigL'?'L':'R';setSig(R.sig===s?null:s);return}
 if(m==='mir'||m==='shL'||m==='shR'){if(!R.look){R.look={k:m==='mir'?'M':m==='shL'?'L':'R',t:0};mk()}return}
 if(m==='obsR'&&SCN.peekR&&SCN.peekR(R)){R.peek=true;R.look=null;mk();return}      // 停下以后：按住看右前方（A 柱、右镜）
 if(m==='obsR'||m==='obs360'||m==='obsL'||m==='scan'){if(!R.look){R.look={k:m==='obsR'?'RS':m==='obsL'?'LS':m==='scan'?'X':'A',t:0};mk();if(m==='obs360'&&SCN.on360Start)SCN.on360Start(R)}return}
 if(m==='back'){R.back=true;mk();return}
 if(m==='mL'||m==='mR'){R.mh=m[1];mk();return}      // 按住看左／右外后视镜（画面拉近到镜子）
 if(m==='gP'||m==='gR'||m==='gD'||m==='gN'){const g=m[1];if(g===R.gear)return;if(Math.abs(R.v)>.05){ev('gearMove');return}R.gear=g;R.gearT=R.t;mk();if(SCN.onGear)SCN.onGear(g);return}
 if(m==='pb'){R.pb=!R.pb;R.pbT=R.t;tick(true);mk();return}      // 手刹（Parking Brake）：点一下拉上，再点一下放下
 if(m==='hb'){R.hb=!R.hb;gasMode('hb');mk();if(SCN.onHb)SCN.onHb(R);return}      // 停住以后：点一下松刹车／再点一下踩刹车
 if(m==='lookL'||m==='lookR'){R.hold={k:m[4],t:0,up:false};R.look=null;mk();return}
 if(m==='creep'){if(R.auto){R.creep=true;mk()}return}      // 前移：按住慢慢往前，松开就停
 if(R.auto&&(m==='stp'||m==='go')){R.stopReq=m==='stp';gasMode(m==='stp'?'go':'stp');mk();if(SCN.onAutoBtn)SCN.onAutoBtn(R,m);return}      // 系统沿路线开时：停车／行驶
 if(m==='go'){if(SCN.onGo&&!R.autoGo){R.autoGo=true;R.gas=false;R.wl=R.wr=false;SCN.onGo(R);mk()}return}
 if(m==='stp'){if(R.cruise&&!R.stopReq){if(SCN.exam.twoStage&&!R.crawl){R.crawl=true;gasMode('stp');mk();if(SCN.onStopReq)SCN.onStopReq(R);return}      // 两段：先“刹车”减到很慢，再“停车”停住
   R.stopReq=true;mk();if(SCN.onStopReq&&!SCN.exam.twoStage)SCN.onStopReq(R)}return}      // 停车：像红灯停车一样，按一下就在很短的距离内停住
 if(m==='wl'||m==='wr'||m==='gas'){if(R.cruise||R.auto)return;R[m]=true;mk();return}}
function cmdUp(m){if(!R)return;if((m==='lookL'||m==='lookR')&&R.hold&&R.hold.k===m[4]){R.hold.up=true;return}if(m==='creep'){R.creep=false;mk();return}if(m==='go'&&!R.autoGo){R.gas=false;mk();return}      /* 按着油门时键变成了“行驶”：松开就是松油门 */
 if(m==='obsR'&&R.peek){R.peek=false;mk();return}if(m==='wl'||m==='wr'){R.wHold=false;if(Math.abs(R.w)*WLOCK<12)R.w=0}      /* 松开时离正不到 12°：直接回正 */
 if((m==='mL'||m==='mR')&&R.mh===m[1]){R.mh=null;mk();return}if(m==='back'||m==='wl'||m==='wr'||m==='gas'){R[m]=false;mk()}}
addEventListener('keydown',e=>{if(e.repeat)return;const k={ArrowLeft:'wl',ArrowRight:'wr',ArrowUp:'gas',ArrowDown:'stp',b:'back',m:'mir',p:'gP',r:'gR',d:'gD',q:'sigL',e:'sigR'}[e.key];if(k)cmd(k)});
addEventListener('keyup',e=>{const k={ArrowLeft:'wl',ArrowRight:'wr',ArrowUp:'gas',b:'back'}[e.key];if(k)cmdUp(k)});
// 看过的时间：R.mT 后视镜，R.oT.L / R.oT.R 盲点；R.bT 最近一次回头看后面
// 观察的顺序：[yaw, pitch, 秒, 看完这一步算看过了什么]
const LSEQ={RS:[[.42,.2,.6],[.83,-.27,.6,['M']],[2.05,-.03,.9,['R']],[0,0,.35]],
 LS:[[.42,.2,.6],[-.46,-.34,.6,['M']],[-2.05,-.03,.9,['L']],[0,0,.35]],      // 左侧观察：中镜、左镜、左盲点
 X:[[-1.3,-.03,.75,['XL']],[1.3,-.03,.85,['XR']],[-1.3,-.03,.6,['XL']],[0,0,.35]],      // 观察路口：左—右—左（转头看路的两头）
 A:[[-2.05,-.03,.8,['L']],[-.46,-.34,.55],[.42,.2,.55],[.83,-.27,.55,['M']],[2.05,-.03,.8,['R']],[Math.PI*.92,-.08,.9,['B']],[0,0,.45,['A']]]};      // 360°：左后盲点、左镜、中镜、右镜、右后盲点、正后面
const sawMir=s=>R.mT!=null&&R.t-R.mT<(s||10),sawSh=(side,s)=>R.oT[side]!=null&&R.t-R.oT[side]<(s||6);
// MSB 检查（往 side 那边动之前）：转向灯、后视镜、盲点。返回缺了哪些
function msb(side,keys){const k=keys||{};if(R.sig!==side)ev(k.sig||'noSig'+side);if(!sawMir(12))ev(k.mir||'noMirror');if(!sawSh(side,8))ev(k.sh||'noShoulder'+side)}
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;
 R={t:0,x:0,z:0,h:0,v:0,w:0,gear:'D',sig:null,sigT:-9,mT:null,oT:{},look:null,back:false,bT:-9,yaw:0,pit:0,ev:[],over:false,wl:false,wr:false,gas:false,dry:0,segs:0,lastDir:0,revDist:0,revNoLook:0,touch:{},ph:0};
 $('bn').style.visibility='';SCN.setup(R);mine.visible=false;$('sg').style.display='none';
 const E=SCN.exam;if(EXAM&&E){Object.assign(R,{x:E.laneX,z:E.startZ,h:0,v:E.vcr||VCR,cruise:true,stopReq:false,gear:'D'});
  R.fol=null;      // 不再安排后面跟车（超车时总会在你停车前后从旁边经过）
  banner(E.insText,'#ffe27a',1)}
 cruiseUI(!!R.cruise);mk()}
// 行驶中：只有刹车键；慢下来以后换成油门、方向盘、挡位
let BG0=null;
// 右下角的大按键：油门（gas）／停车（stp，行驶中）／行驶（go，三点调头调过来以后，系统接手开走）
function gasMode(md){const g=$('bgas');if(!g)return;
 if(!BG0){BG0={bg:g.style.background};g.innerHTML='<span class="gl">'+g.innerHTML+'</span><span class="sl" style="display:none">停车<small>点一下<br>就停住</small></span><span class="go" style="display:none">行驶<small>系统回正<br>开走</small></span><span class="hb" style="display:none"></span>'}
 if(SCN.goLabel)g.querySelector('.go').innerHTML=SCN.goLabel;
 if(SCN.stpLabel)g.querySelector('.sl').innerHTML=R&&R.crawl?'停车<small>点一下<br>就停住</small>':SCN.stpLabel;
 g.querySelector('.hb').innerHTML=R&&R.hb?'松刹车<small>现在踩着刹车<br>点一下松开</small>':'踩刹车<small>刹车已松开<br>点一下踩住</small>';g.querySelector('.hb').style.display=md==='hb'?'':'none';
 g.querySelector('.gl').style.display=md==='gas'?'':'none';g.querySelector('.sl').style.display=md==='stp'?'':'none';g.querySelector('.go').style.display=md==='go'?'':'none';
 g.dataset.m=md;g.style.background=md==='stp'||(md==='hb'&&R&&R.hb)?'#c0392b':md==='hb'?'#7a3b3b':md==='go'?'#1f7a3a':BG0.bg}
// 系统沿着一条路线开（停车场的车道、出口转弯）：方向用“追点”的办法，速度由 SCN.autoV 给；玩家只管停车／行驶
function autoStep(dt){const A=R.auto,P=A.pts,rx=R.x-Math.sin(R.h)*LW.TX,rz=R.z-Math.cos(R.h)*LW.TX,dq=q=>Math.hypot(q[0]-rx,q[1]-rz);
 while(A.i<P.length-1&&dq(P[A.i+1])<=dq(P[A.i]))A.i++;
 const Ld=Math.max(3,R.v*1.2);let j=A.i;while(j<P.length-1&&dq(P[j])<Ld)j++;
 const tx=P[j][0]-rx,tz=P[j][1]-rz,al=normA(Math.atan2(tx,tz)-R.h),d=Math.atan(2*LW.L*Math.sin(al)/Math.max(1,Math.hypot(tx,tz)));
 R.w+=(Math.max(-1,Math.min(1,d/LW.MAXD))-R.w)*Math.min(1,dt*5);
 const hold=R.stopReq&&!R.creep,vt=hold?0:R.creep&&R.stopReq?Math.min(.8,SCN.autoV(R,dt)):SCN.autoV(R,dt);R.v+=hold?-Math.min(R.v,3.5*dt):Math.max(-(A.brk||2.5)*dt,Math.min(1.3*dt,vt-R.v));if(R.v<0)R.v=0;
 const dd=R.w*LW.MAXD,nx=rx+Math.sin(R.h)*R.v*dt,nz=rz+Math.cos(R.h)*R.v*dt;R.h+=R.v*Math.tan(dd)/LW.L*dt;R.x=nx+Math.sin(R.h)*LW.TX;R.z=nz+Math.cos(R.h)*LW.TX}
function cruiseUI(on){gasMode(on?'stp':'gas');['gears','wind','bwl','bwr'].forEach(id=>{const e=$(id);if(e)e.style.visibility=on?'hidden':''})}
function cruiseStep(dt){const E=SCN.exam,VC=E.vcr||VCR;      /* 停车场里开得慢（约 15 km/h） */
 // 速度：快到的时候系统自动减速到很慢；点了“停车”就很快停住
 let vt=E.noAutoSlow?(R.crawl?(E.crawlV||VCRAWL):VC):Math.min(VC,Math.sqrt(VCRAWL*VCRAWL+2*1.6*Math.max(0,E.crawlZ-R.z)));
 if(!E.noAutoSlow&&!R.slow&&vt<VC-.3){R.slow=1;if(!sawMir(12))ev('brkNoMir');if(R.sig!==(E.side||'R'))ev('brkNoSig')}      // 系统开始减速时：应该已经看过镜子、打好灯
 if(R.stopReq)R.v=Math.max(0,R.v-(R.v>4?4.5:3.5)*dt);else R.v+=Math.max(-2*dt,Math.min(1.2*dt,vt-R.v));
 // 方向：系统保持在车道上
 const pull=(R.stopReq||R.crawl)&&E.pullX!=null,tx=pull?E.pullX:E.laneX,hd=Math.atan2(tx-R.x,pull?Math.max(2.5,R.v*.8):14);      /* 踩了刹车：系统一边减速一边靠到右边路缘 */      /* 踩了刹车：系统靠到右边路缘 */const dh=Math.max(-.35*dt,Math.min(.35*dt,hd-R.h));R.h+=dh;{const wt=R.v>.3?Math.max(-.1,Math.min(.1,Math.atan(dh/dt*LW.L/R.v)/LW.MAXD)):0;R.w+=(wt-R.w)*Math.min(1,dt*4)}      /* 系统帮着打方向：方向盘也跟着轻轻往右（往左）转一点 */
 R.x+=Math.sin(R.h)*R.v*dt;R.z+=Math.cos(R.h)*R.v*dt;
 // 停住了：换成低速操作（“停车”键变成“油门”）
 if(R.stopReq&&R.v===0&&SCN.onStopped){R.cruise=false;R.w=0;R.h*=.2;cruiseUI(false);R.gas=false;SCN.onStopped(R);mk()}
 else if(R.stopReq&&R.v===0){R.cruise=false;R.w=0;cruiseUI(false);R.gas=false;mk();(SCN.keepIns?tip:banner)('停住了，现在自己开：按住油门慢慢走，用 ⟲ ⟳ 打方向，P R D 换挡','#7ee787');      /* keepIns：考官的指令一直留在屏幕上方 */if(SCN.onHandover)SCN.onHandover(R)}}
// 后面跟着的车：跟车；你慢下来、打了灯（或停住）以后，从左边超过去
function folStep(dt){const F=R.fol;if(!F)return;const gap=R.z-F.z-2*LW.HL;
 if(!F.pass&&R.t>1)F.pass=true;      /* 开局一秒后它就从左边超过去，等你减速、停下时它早就走远了（你停下时旁边不会有车经过） */
 let vt;if(F.pass){vt=14;F.x+=Math.max(-1.6*dt,Math.min(1.6*dt,(-2.7)-F.x))}else{vt=Math.max(0,Math.min(VCR,R.v+(gap-12)*.45));if(gap<3.5&&!F.honk){F.honk=1;honk();ev('hardBrake')}}
 F.v+=Math.max(-4.5*dt,Math.min((F.pass?2.5:1.5)*dt,vt-F.v));F.z+=F.v*dt;
 place(F.c,F.x,F.z,F.pass&&F.x>-2.65?-.15:0,SCN.Y(F.z));if(F.z>R.z+120){F.c.visible=false;R.fol=null}}
// ---------- 每一帧 ----------
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;const t=R.t;
 // 方向盘：按住往一边转（打死约 1.3 秒）；车没动时转方向盘＝原地打方向
 const w0=R.w,wH=R.wHold&&R.t<R.wHold;if(R.wl&&!wH)R.w=Math.max(-1,R.w-dt/1.3);if(R.wr&&!wH)R.w=Math.min(1,R.w+dt/1.3);
 if(w0!==0&&(R.w===0||Math.sign(R.w)!==Math.sign(w0))){R.w=0;R.wHold=R.t+.45;tick(true)}      /* 回正时在“正”的位置停顿约半秒（像真方向盘回正时手上有感觉）；手指没松开就接着往那边打 */
       /* 原地打方向不再检查：手机上打方向和油门都用右手，和真车不一样 */
 // 车速：D 往前最多约 7 km/h，R 往后最多约 4 km/h；松开油门就刹车停住
 if(R.cruise)cruiseStep(dt);else if(R.auto)autoStep(dt);else{
 const gas=R.gas,vmax=R.gear==='D'?(SCN.vmax||2.0):R.gear==='R'?-.75:0,vt=gas?vmax:0,a=gas&&vt!==0?1.0:2.6;
 if(R.gear!=='N')R.v=R.v<vt?Math.min(vt,R.v+a*dt):Math.max(vt,R.v-a*dt);if(R.gear==='P')R.v=0;
 if(R.gear==='N'&&!R.hb&&SCN.g){const a=-9.8*SCN.g*Math.cos(R.h)*.25;R.v=Math.max(-.6,Math.min(.6,R.v+a*dt))}      // 空档松开刹车：顺着坡往下溜
 if(R.hb)R.v=0;
 // 走一步（自行车模型）；碰到路缘、别的车就停住
 const px=R.x,pz=R.z,ph=R.h;const d=R.w*LW.MAXD;{const rx=R.x-Math.sin(R.h)*LW.TX+Math.sin(R.h)*R.v*dt,rz=R.z-Math.cos(R.h)*LW.TX+Math.cos(R.h)*R.v*dt;R.h+=R.v*Math.tan(d)/LW.L*dt;R.x=rx+Math.sin(R.h)*LW.TX;R.z=rz+Math.cos(R.h)*LW.TX}      /* 后轴走直线、前轮转向：车绕后轴延长线上的点转（真车就是这样，后轮走在前轮里面） */
 let block=null;
 tires().forEach((q,i)=>{(SCN.curbs||[]).forEach(cb=>{if(cb.z0!=null&&(q[1]<cb.z0||q[1]>cb.z1))return;if(cb.gaps&&cb.gaps.some(d=>q[1]>d.z0&&q[1]<d.z1))return;      /* 车道口：路缘是平的 */const p=cb.side>0?q[0]+LW.TR-cb.x:cb.x-(q[0]-LW.TR);
  if(p>0){if(cb.soft){if(p>.3&&!R.off){R.off=1;ev('offRoad')}return}
   if(Math.abs(R.v)>1.4){ev('mountCurb');block='curb'}else{if(!R.touch[i]){R.touch[i]=1;if(Math.abs(R.v)>.75)ev('hitCurb');if(SCN.onTouch)SCN.onTouch(q,cb)}block='curb';R.curbT=R.t}}})});
 if(!block){const me=[R.x,R.z,R.h,LW.HL,LW.HW];if((SCN.obst||[]).some(o=>Math.abs(o[0]-R.x)<7&&Math.abs(o[1]-R.z)<7&&obbHit(me,[o[0],o[1],o[2],LW.HL,LW.HW]))){block='car';ev('crash');crashSnd()}}
 if(block){R.x=px;R.z=pz;R.h=ph;R.v=0}else if(Math.abs(R.v)>.02){R.touch={}}}
 folStep(dt);
 if(EXAM&&SCN.exam&&R.ph===0&&R.z>SCN.exam.missZ){ev('missed');finish();return}
 // 方向变化（前进／倒车）算一段
 const dir=R.v>.1?1:R.v<-.1?-1:0;if(dir&&dir!==R.lastDir){R.segs++;R.lastDir=dir;if(SCN.onSeg)SCN.onSeg(dir,R.segs)}
 // 倒车要回头看
 if(R.v<-.05){R.revDist+=-R.v*dt;if(!R.back&&!SCN.noBackCheck)R.revNoLook+=-R.v*dt;if(R.revNoLook>.45)ev('noLookBack')}else if(R.v>.05)R.revNoLook=0;
 if(R.back)R.bT=t;if(R.mh)R.mT=t;
 // 看后视镜（中间→左→右）、看盲点
 if(R.hold){const H=R.hold,k9=Math.min(1,dt*10);H.t+=dt;R.yaw+=((H.k==='L'?-1.35:1.35)-R.yaw)*k9;R.pit+=(-.03-R.pit)*k9;if(H.t>.35)R.oT['X'+H.k]=t;if(H.up&&H.t>.9){R.hold=null;mk()}}      // 看左／看右：按住一直看，点一下看一眼
 else if(R.look){const L=R.look,k9=Math.min(1,dt*12);L.t+=dt;
  if(LSEQ[L.k]){const q=LSEQ[L.k];let s=0,i=0;while(i<q.length&&L.t>s+q[i][2]){if(q[i][3])q[i][3].forEach(m=>{if(m==='M')R.mT=t;else R.oT[m]=t;if(m==='A'){R.n360=(R.n360||0)+1;if(SCN.on360)SCN.on360(R)}});s+=q[i][2];i++}
   if(i>=q.length){R.look=null;R.yaw=0;R.pit=0;mk()}else{const kk=Math.min(1,dt*(Math.abs(q[i][0])>1.5?10:12));R.yaw+=(q[i][0]-R.yaw)*kk;R.pit+=(q[i][1]-R.pit)*kk}}
  else if(L.k==='M'){const tg=L.t<.6?[.42,.2]:L.t<1.2?[-.46,-.34]:L.t<1.8?[.83,-.27]:[0,0];R.yaw+=(tg[0]-R.yaw)*k9;R.pit+=(tg[1]-R.pit)*k9;if(L.t>1.6)R.mT=t;if(L.t>2.1){R.look=null;R.yaw=0;R.pit=0;mk()}}
  else{const sd=L.k==='L'?-1:1;if(L.t<.95){R.yaw+=(sd*2.05-R.yaw)*Math.min(1,dt*10);R.pit+=(-.03-R.pit)*k9;if(L.t>.6)R.oT[L.k]=t}else{R.yaw+=(0-R.yaw)*k9;R.pit+=(0-R.pit)*k9;if(L.t>1.3){R.oT[L.k]=t;R.look=null;R.yaw=0;R.pit=0;mk()}}}}
 else{const pk=R.cruise&&(R.crawl||R.slow||R.stopReq)&&!R.autoGo;      // 行驶中开始减速找停车位置：视线自动往右前方转一点，看清路边标杆和车头的位置；停下后转回来
  const yt=R.peek?1.25:R.back?Math.PI*.92:pk?(SCN.pkYaw||.35):0;      /* 往右转约 20° */R.yaw+=(yt-R.yaw)*Math.min(1,dt*6);R.pit+=((R.peek?-.06:R.back?-.08:pk?-.06:0)-R.pit)*Math.min(1,dt*6);if(R.peek)R.oT.P=t}      /* peek：头转向右前方约 70°，右 A 柱和右镜在画面偏左 */
 SCN.step(R,dt);
 // 屏幕上的提示：挡位、方向盘、离路缘
 const wv=$('whl');if(wv){wv.style.transform=`rotate(${R.w*540}deg)`;const dg=Math.round(Math.abs(R.w)*WLOCK/10)*10;$('wtx').textContent=dg<10?'正':(R.w<0?'左 ':'右 ')+dg+'°'+(Math.abs(R.w)>.995?' 到底':'')}
 const cg=null,e=$('cgap'),pd=R.cruise||R.auto?null:parkDist();if(e){if(cg||pd){      /* 行驶中不显示离路缘 */
 let h='';if(cg){const m=Math.min(cg.front,cg.rear);h='<span style="color:'+(m<=.3&&m>=-.01?'#7ee787':'#fff')+'">右轮离路缘：前 '+Math.max(0,cg.front).toFixed(2)+' 米 · 后 '+Math.max(0,cg.rear).toFixed(2)+' 米</span>'}
  if(h){e.style.display='';e.innerHTML=h}else e.style.display='none'}else e.style.display='none'}
 sensorDraw(pd)}
// 离前后停着的车多远（像倒车雷达，2.5 米以内才显示）：两个长方形的最近距离
function boxPtDist(b,p){const s=Math.sin(b[2]),c=Math.cos(b[2]),dx=p[0]-b[0],dz=p[1]-b[1],u=dx*s+dz*c,w=dx*c-dz*s;return Math.hypot(Math.max(0,Math.abs(u)-b[3]),Math.max(0,Math.abs(w)-b[4]))}
function boxCorners(b){const s=Math.sin(b[2]),c=Math.cos(b[2]);return[[1,1],[1,-1],[-1,1],[-1,-1]].map(([f,l])=>[b[0]+s*b[3]*f+c*b[4]*l,b[1]+c*b[3]*f-s*b[4]*l])}
// 倒车雷达那样的显示：车的俯视小图，前后左右八个方向，旁边有车时画一道弧线：离得远弧线在外圈、长，越近越贴着车、越短；颜色从黄（小心）变到红（危险）
const SZ={F:[-90,16],FL:[-128,22],FR:[-52,22],B:[90,16],BL:[128,22],BR:[52,22],L:[180,20],R:[0,20]};      // 每个方向：弧线中间的角度、半个张角
let SCV=null;
function sensorDraw(pd){if(!SCV){SCV=document.createElement('canvas');SCV.width=200;SCV.height=260;[['position','fixed'],['left','auto'],['bottom','auto'],['inset','auto'],['right','calc(12px + env(safe-area-inset-right,0px))'],['top','calc(56px + env(safe-area-inset-top,0px))'],['width','100px'],['height','130px'],['z-index','2'],['pointer-events','none'],['background','rgba(0,0,0,.35)'],['border-radius','14px']].forEach(q=>SCV.style.setProperty(q[0],q[1],'important'));SCV.style.display='none';document.body.appendChild(SCV)}
 const z=pd&&pd.z;if(!z||!Object.keys(z).length){SCV.style.display='none';return}SCV.style.display='';
 const x=SCV.getContext('2d');x.setTransform(2,0,0,2,0,0);x.clearRect(0,0,100,130);const cx=50,cy=65,HLp=27,HWp=14;
 // 小车：前面朝上
 x.fillStyle='#e9edf2';x.beginPath();x.roundRect?x.roundRect(cx-HWp,cy-HLp,HWp*2,HLp*2,7):x.rect(cx-HWp,cy-HLp,HWp*2,HLp*2);x.fill();
 x.fillStyle='#5b6b80';x.fillRect(cx-HWp+3,cy-HLp+11,HWp*2-6,9);x.fillRect(cx-HWp+3,cy+HLp-15,HWp*2-6,7);
 const lv=(k,d)=>{const t=k==='F'||k==='B'?[.3,.6,1.1]:[.2,.4,.7];      /* 正前、正后：1.1 米以内开始变色；角上和两边：0.7 米 */return d<t[0]?0:d<t[1]?1:d<t[2]?2:3};
 const col=['#ff2b2b','#ff6a2b','#ffa733','#ffd84a'];
 Object.keys(SZ).forEach(k=>{const[m,sp]=SZ[k],side=k==='L'||k==='R',r0=side?HWp+5:HLp+5,a0=(m-sp)*Math.PI/180,a1=(m+sp)*Math.PI/180;
  const R0=side?r0:r0;
  for(let i=0;i<4;i++){const rr=R0+i*6;x.beginPath();x.ellipse(cx,cy,side?rr:rr*.82,side?rr*1.25:rr,0,a0,a1);x.lineWidth=3;x.strokeStyle='rgba(255,255,255,.13)';x.stroke()}
  if(z[k]!=null){const i=lv(k,z[k]),rr=R0+i*6;x.beginPath();x.ellipse(cx,cy,side?rr:rr*.82,side?rr*1.25:rr,0,a0,a1);x.lineWidth=5;x.lineCap='round';x.strokeStyle=col[i];x.stroke()}})}
function parkDist(){const ob=SCN.obst;if(!ob||!ob.length)return null;const me=[R.x,R.z,R.h,LW.HL,LW.HW],mc=corners(),Z={};let f=null,b=null,l=null,r=null;
 ob.forEach(o=>{if(Math.abs(o[0]-R.x)>8||Math.abs(o[1]-R.z)>8)return;const ob2=[o[0],o[1],o[2],LW.HL,LW.HW];
  // 两边都取几个点（四个角＋每条边中点）到对方长方形的距离
  const pts=(cs)=>cs.concat(cs.map((q,i)=>{const r=cs[[1,3,0,2][i]];return[(q[0]+r[0])/2,(q[1]+r[1])/2]}));
  let d=Math.min(...pts(mc).map(p=>boxPtDist(ob2,p)),...pts(boxCorners(ob2)).map(p=>boxPtDist(me,p)));if(d>2.5)return;
  const fw=(o[0]-R.x)*Math.sin(R.h)+(o[1]-R.z)*Math.cos(R.h),lt=(o[0]-R.x)*Math.cos(R.h)-(o[1]-R.z)*Math.sin(R.h);      /* 旁边停着的车（停车场的车位）算左边、右边 */
  if(Math.abs(lt)>Math.abs(fw)){if(lt>0)r=r==null?d:Math.min(r,d);else l=l==null?d:Math.min(l,d)}else if(fw>0)f=f==null?d:Math.min(f,d);else b=b==null?d:Math.min(b,d);
  // 分到八个方向：用对方车身上的点，找它离我的车身哪一处最近
  const s=Math.sin(R.h),c=Math.cos(R.h),zn=(u,w)=>u>LW.HL-.7?(w<-LW.HW*.45?'FL':w>LW.HW*.45?'FR':'F'):u<-LW.HL+.7?(w<-LW.HW*.45?'BL':w>LW.HW*.45?'BR':'B'):(w<0?'L':'R');
  const oc=boxCorners(ob2),dense=[];for(let i=0;i<4;i++){const p=oc[i],q=oc[[1,3,0,2][i]];for(let k=0;k<10;k++)dense.push([p[0]+(q[0]-p[0])*k/10,p[1]+(q[1]-p[1])*k/10])}
  dense.forEach(p=>{const dd=boxPtDist(me,p);if(dd>2.5)return;const dx=p[0]-R.x,dz=p[1]-R.z,u=Math.max(-LW.HL,Math.min(LW.HL,dx*s+dz*c)),w=Math.max(-LW.HW,Math.min(LW.HW,dx*c-dz*s)),k=zn(u,w);
   if((k==='L'||k==='R')&&dd>1.2)return;if(Z[k]==null||dd<Z[k])Z[k]=dd});});
 return f==null&&b==null&&l==null&&r==null?null:{f,b,l,r,z:Z}}
function finish(okText){if(R.over)return;R.over=true;$('bn').style.visibility='hidden';{const tp=$('tip');if(tp)tp.style.opacity=0}      // 总结卡片上面不要盖着考官的指令
 R.sig=null;$('sg').style.display='none';const o=$('ov');let h;const SER=LSSER.concat(SCN.SER||[]);
 if(!R.ev.length)h='<h2>驾驶总结</h2><div class="st">★★★</div><p>'+(okText||SCN.okText)+'</p>';
 else h='<h2>驾驶总结</h2><p>这一趟有 '+R.ev.length+' 处需要注意：</p><div class="cards">'+R.ev.map(e=>`<div class="card">${e.img?`<img src="${e.img}">`:''}<b>${e.title}${SER.includes(e.key)?'<span class="tag s">严重</span>':'<span class="tag">扣分项</span>'}</b><span>${e.text}</span></div>`).join('')+'</div>';
 if(typeof ADS!=='undefined')h+=ADS.credit();
 o.innerHTML=`<div class="pn">${h}<br><button id="again">再来一次</button> <button id="home" style="background:#6b7280">回到首页</button></div>`;o.style.display='flex';
 $('again').onclick=()=>{if(SCN.again&&SCN.again())return;o.style.display='none';newRun(true);playing=true};$('home').onclick=()=>{o.innerHTML=HOME;o.style.display='flex';bindHome()}}
// ================= 渲染循环（左边俯视、右边驾驶视角） =================
let last=0,TOPC=null,HOME='';
MRL.rt.setSize(512,256);MRR.rt.setSize(512,256);
{const vf=h=>2*Math.atan(Math.tan(h/2*Math.PI/180)/2)*180/Math.PI;MRL.c.fov=vf(26);MRL.dir.set(Math.sin(17*Math.PI/180),-.03,-1).normalize();MRR.c.fov=vf(30);MRR.dir.set(-Math.sin(17*Math.PI/180),-.05,-1).normalize();MRR.d0=MRR.dir.clone();MRR.dR=new T.Vector3(-.02,-.3,-1).normalize();MRL.d0=MRL.dir.clone();MRL.dR=new T.Vector3(.02,-.3,-1).normalize();[MRL,MRR].forEach(m=>m.c.updateProjectionMatrix())}
function placeMine(){place(mine,R.x,R.z,R.h,SCN.Y(R.z));mine.userData.bl.forEach(m=>{m.position.x=R.sig==='R'?-.88:.88})}
function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;step(dt);const bl=Math.sin(ts/1000*15)>0;
 if(SCN.draw)SCN.draw(R,dt);
 placeMine();mine.userData.bl.forEach(m=>m.visible=!!R.sig&&bl);
 sun.target.position.set(-R.x,SCN.Y(R.z),R.z);sun.position.set(-R.x+60,SCN.Y(R.z)+90,R.z-40);if(!sun.target.parent)scene.add(sun.target);
 if(R.sig&&playing&&!R.over){const on=Math.sin(ts/1000*9.4)>0;$('sg').style.opacity=on?1:.15;if(on!==loop.sgOn){loop.sgOn=on;tick(on)}}
 const sz=ren.getSize(new T.Vector2()),W=sz.x,HH=sz.y,w2=SCN.noSplit?W:Math.floor(W/2),      /* noSplit：只有驾驶视角，不分屏 */Y=SCN.Y(R.z),gr=Math.atan(SCN.g||0);
 {const h=R.h+R.yaw,L=10,fovH=92;cam.aspect=w2/HH;cam.fov=Math.min(105,2*Math.atan(Math.tan(fovH*Math.PI/360)/cam.aspect)*180/Math.PI);cam.updateProjectionMatrix();
  const ox=.38*Math.cos(R.h),oz=.38*Math.sin(R.h),bx0=-R.x+Math.sin(R.h)*.2,bz0=R.z-Math.cos(R.h)*.2;const pitchG=Math.cos(R.h)*(SCN.g||0);
  cam.position.set(bx0+ox,Y+1.25,bz0+oz);cam.lookAt(-R.x-Math.sin(h)*L+ox,Y+1.25+L*.03+R.pit*L+pitchG*L*Math.cos(R.yaw),R.z+Math.cos(h)*L+oz);
  cockpit.visible=true;cockpit.position.set(bx0,Y+1.25,bz0);cockpit.rotation.order='YXZ';cockpit.rotation.y=-R.h;cockpit.rotation.x=-Math.atan(pitchG);wheel.rotation.z=R.w*WLOCK*Math.PI/180}      /* 往左打，方向盘看起来也往左转（原来方向反了） */
 $('sp').textContent=(Math.abs(R.v)*3.6).toFixed(0);if(cluster)cluster(Math.round(Math.abs(R.v)*3.6));
 MRR.tilt=(MRR.tilt||0)+(((R.gear==='R')?1:0)-(MRR.tilt||0))*Math.min(1,dt*4);MRR.dir.copy(MRR.d0).lerp(MRR.dR,MRR.tilt).normalize();if(SCN.tiltL){MRL.tilt=(MRL.tilt||0)+(((R.gear==='R')?1:0)-(MRL.tilt||0))*Math.min(1,dt*4);MRL.dir.copy(MRL.d0).lerp(MRL.dR,MRL.tilt).normalize()}      /* 停车场倒车：两边外后视镜都往下翻，看得到两边的车位线和自己的车身（看车正不正） */      // 挂 R 时右镜自动往下翻，看得到右后轮和路缘（有些车有这个功能）
 if(((loop.fc=(loop.fc||0)+1)&1)===0||R.mh){const m=R.mh?(R.mh==='L'?MRL:MRR):MR[(loop.fc>>1)%MR.length],sa=ren.shadowMap.autoUpdate;cockpit.updateMatrixWorld(true);
  m.c.position.copy(cockpit.localToWorld(m.pos.clone()));m.c.lookAt(m.c.position.clone().add(m.dir.clone().transformDirection(cockpit.matrixWorld)));
  cockpit.visible=false;mine.visible=(m===MRL||m===MRR);ren.shadowMap.autoUpdate=false;      /* 只有左右外后视镜里看得到自己的车；车内中间后视镜不画（否则下半部被车身挡成黑色） */
  ren.setRenderTarget(m.rt);ren.render(scene,m.c);mine.visible=false;ren.setRenderTarget(null);ren.shadowMap.autoUpdate=sa;cockpit.visible=true}
 if(R.mh){const m=R.mh==='L'?MRL:MRR;cockpit.updateMatrixWorld(true);const tp=cockpit.localToWorld(m.pos.clone()),d=cam.position.distanceTo(tp);cam.lookAt(tp);cam.fov=2*Math.atan(.13/d)*180/Math.PI;cam.updateProjectionMatrix()}      /* 按住镜子按钮：看外后视镜 */
 ren.setScissorTest(true);ren.setViewport(W-w2,0,w2,HH);ren.setScissor(W-w2,0,w2,HH);mine.visible=false;ren.render(scene,cam);
 if(!SCN.noSplit){if(!TOPC)TOPC=new T.PerspectiveCamera(40,1,1,300);TOPC.aspect=(W-w2)/HH;TOPC.updateProjectionMatrix();
 const tc=SCN.topCam?SCN.topCam(R):[R.x,R.z,20];TOPC.position.set(-tc[0],SCN.Y(tc[1])+tc[2],tc[1]);TOPC.up.set(0,0,1);TOPC.lookAt(-tc[0],SCN.Y(tc[1]),tc[1]);
 mine.visible=true;cockpit.visible=false;ren.setViewport(0,0,W-w2,HH);ren.setScissor(0,0,W-w2,HH);ren.render(scene,TOPC);mine.visible=false;cockpit.visible=true}ren.setScissorTest(false);ren.setViewport(0,0,W,HH);
 requestAnimationFrame(loop)}
function bindHome(){const cb=$('exam');if(cb){cb.checked=EXAM;cb.onchange=()=>{EXAM=cb.checked}}
 document.querySelectorAll('.md').forEach(b=>b.onclick=()=>{DIFF=b.dataset.diff||'easy';EXAM=!!SCN.alwaysExam||DIFF==='exam'||DIFF==='hard'||!!(cb&&cb.checked);HARD=DIFF==='hard';if(SCN.pick&&SCN.pick(DIFF))return;$('ov').style.display='none';newRun(true);playing=true})}
{const st=document.createElement('style');st.textContent='.b *{pointer-events:none}';document.head.appendChild(st)}      // 按钮里的字不接收触摸：换字时手指按着的元素不会被删掉（删掉了就收不到松开的事件，按键会失灵）
const LS={start(s){SCN=s;if(s.alwaysExam)EXAM=true;rs();newRun(false);setView(1);requestAnimationFrame(loop);HOME=$('ov').innerHTML;bindHome();
 if(/[?&]go=1/.test(typeof location!=='undefined'?location.search:'')){$('ov').style.display='none';newRun(true);playing=true}      // 换了场景重新加载页面后直接开始
 $('hm').onclick=()=>{if(R)R.over=true;playing=false;const o=$('ov');o.innerHTML=HOME;o.style.display='flex';bindHome()}}};
