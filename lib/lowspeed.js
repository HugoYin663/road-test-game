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
 noLookBack:["倒车时没有回头看后面","倒车时要回头从后窗看后面（按住“回头看”），不能只看后视镜。"],
 hitCurb:["车轮撞到了路缘","靠近路缘时要很慢，车轮最多轻轻碰到路缘，不能撞上去。"],
 mountCurb:["车轮开上了路缘","车轮压上路缘、人行道，在路考里是严重错误。"],
 crash:["碰到了别的车","倒车、转弯时车身四个角都要留意，随时准备停车。"],
 offRoad:["车轮开出了路面","没有路缘的路边，车轮不要开出路边白线、开到砂石路肩外面去。"]};
const LSSER=['mountCurb','crash'];
// 轮子在地上的位置（前轮跟着方向盘转）：[x,z,左右(-1左/1右),前后(1前/-1后)]
function tires(){const s=Math.sin(R.h),c=Math.cos(R.h);return[[1,1],[1,-1],[-1,1],[-1,-1]].map(([fb,lr])=>[R.x+s*LW.TX*fb+c*LW.TY*lr,R.z+c*LW.TX*fb-s*LW.TY*lr,lr,fb])}
// 车身四个角
function corners(){const s=Math.sin(R.h),c=Math.cos(R.h);return[[1,1],[1,-1],[-1,1],[-1,-1]].map(([fb,lr])=>[R.x+s*LW.HL*fb+c*LW.HW*lr,R.z+c*LW.HL*fb-s*LW.HW*lr])}
// 右边路缘到右边轮胎的距离（米）：front＝前轮、rear＝后轮
function curbGap(side){const t=tires(),cb=(SCN.curbs||[]).find(c=>c.side===side);if(!cb)return null;const g=k=>{const q=t.find(a=>a[2]===side&&a[3]===k);return side>0?cb.x-(q[0]+LW.TR):(q[0]-LW.TR)-cb.x};return{front:g(1),rear:g(-1)}}
function banner(t,col,big){const b=$('bn');b.textContent=t;b.style.color=col||'';if(big){const e=$('cf');e.textContent=t;e.classList.remove('go');void e.offsetWidth;e.classList.add('go')}}
function flash(t){const f=$('fl');f.textContent=t;f.style.opacity=1;clearTimeout(flash.h);flash.h=setTimeout(()=>f.style.opacity=0,2000)}
function setSig(s){R.sig=s;R.sigT=R.t;const e=$('sg');e.style.display=s?'block':'none';e.textContent=s==='L'?'⬅':'➡';if(s)tick(true);mk()}
function mk(){const on={sigL:R.sig==='L',sigR:R.sig==='R',mir:R.look&&R.look.k==='M',obsR:R.look&&R.look.k==='RS',obs360:R.look&&R.look.k==='A',shL:R.look&&R.look.k==='L',shR:R.look&&R.look.k==='R',back:R.back,wl:R.wl,wr:R.wr,gas:R.gas};
 document.querySelectorAll('.b').forEach(b=>b.classList.toggle('on',!!on[b.dataset.m]));$('gear').textContent=R.gear;['P','R','D'].forEach(g=>{const e=$('g'+g);if(e)e.classList.toggle('cur',R.gear===g)})}
let SNC=null;
function snap(){try{const sz=ren.getSize(new T.Vector2());ren.setScissorTest(false);ren.setViewport(0,0,sz.x,sz.y);const cvs=ren.domElement,W=360,H=240;if(!cvs.width)return null;if(!SNC)SNC=new T.PerspectiveCamera(45,1,1,300);SNC.aspect=cvs.width/cvs.height;SNC.updateProjectionMatrix();
 const y=SCN.Y(R.z);SNC.position.set(-R.x,y+26,R.z);SNC.up.set(0,0,1);SNC.lookAt(-R.x,y,R.z);const vc=cockpit.visible,vm=mine.visible;cockpit.visible=false;mine.visible=true;placeMine();ren.render(scene,SNC);cockpit.visible=vc;mine.visible=vm;
 const c2=document.createElement('canvas');c2.width=W;c2.height=H;const sw=Math.min(cvs.width,cvs.height*W/H),sh=sw*H/W;c2.getContext('2d').drawImage(cvs,(cvs.width-sw)/2,(cvs.height-sh)/2,sw,sh,0,0,W,H);return c2.toDataURL('image/jpeg',.82)}catch(e){return null}}
function ev(key,add){if(R.ev.some(e=>e.key===key))return;const t=SCN.TXT[key]||LSTXT[key];R.ev.push({key,title:t[0],text:t[1]+(add||''),img:snap()});flash(t[0])}
// 转向灯、看后视镜、看盲点（左／右）、回头看后面（按住）、挡位、方向盘（按住）、油门（按住；松开就刹车停住）
function cmd(m){if(!R||R.over||!playing)return;
 if(m==='sigL'||m==='sigR'){const s=m==='sigL'?'L':'R';setSig(R.sig===s?null:s);return}
 if(m==='mir'||m==='shL'||m==='shR'){if(!R.look){R.look={k:m==='mir'?'M':m==='shL'?'L':'R',t:0};mk()}return}
 if(m==='obsR'||m==='obs360'){if(!R.look){R.look={k:m==='obsR'?'RS':'A',t:0};mk()}return}
 if(m==='back'){R.back=true;mk();return}
 if(m==='gP'||m==='gR'||m==='gD'){const g=m[1];if(g===R.gear)return;if(Math.abs(R.v)>.05){ev('gearMove');return}R.gear=g;R.gearT=R.t;mk();if(SCN.onGear)SCN.onGear(g);return}
 if(m==='wl'||m==='wr'||m==='gas'){R[m]=true;mk();return}}
function cmdUp(m){if(!R)return;if(m==='back'||m==='wl'||m==='wr'||m==='gas'){R[m]=false;mk()}}
addEventListener('keydown',e=>{if(e.repeat)return;const k={ArrowLeft:'wl',ArrowRight:'wr',ArrowUp:'gas',b:'back',m:'mir',p:'gP',r:'gR',d:'gD',q:'sigL',e:'sigR'}[e.key];if(k)cmd(k)});
addEventListener('keyup',e=>{const k={ArrowLeft:'wl',ArrowRight:'wr',ArrowUp:'gas',b:'back'}[e.key];if(k)cmdUp(k)});
// 看过的时间：R.mT 后视镜，R.oT.L / R.oT.R 盲点；R.bT 最近一次回头看后面
// 观察的顺序：[yaw, pitch, 秒, 看完这一步算看过了什么]
const LSEQ={RS:[[.42,.2,.6],[.83,-.27,.6,['M']],[2.05,-.03,.9,['R']],[0,0,.35]],
 A:[[-1.2,0,.5],[-.46,-.34,.55],[-2.05,-.03,.8,['L']],[.42,.2,.55],[.83,-.27,.55,['M']],[2.05,-.03,.8,['R']],[0,0,.35,['A']]]};
const sawMir=s=>R.mT!=null&&R.t-R.mT<(s||10),sawSh=(side,s)=>R.oT[side]!=null&&R.t-R.oT[side]<(s||6);
// MSB 检查（往 side 那边动之前）：转向灯、后视镜、盲点。返回缺了哪些
function msb(side,keys){const k=keys||{};if(R.sig!==side)ev(k.sig||'noSig'+side);if(!sawMir(12))ev(k.mir||'noMirror');if(!sawSh(side,8))ev(k.sh||'noShoulder'+side)}
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;
 R={t:0,x:0,z:0,h:0,v:0,w:0,gear:'D',sig:null,sigT:-9,mT:null,oT:{},look:null,back:false,bT:-9,yaw:0,pit:0,ev:[],over:false,wl:false,wr:false,gas:false,dry:0,segs:0,lastDir:0,revDist:0,revNoLook:0,touch:{},ph:0};
 SCN.setup(R);mine.visible=false;$('sg').style.display='none';mk()}
// ---------- 每一帧 ----------
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;const t=R.t;
 // 方向盘：按住往一边转（打死约 1.3 秒）；车没动时转方向盘＝原地打方向
 const w0=R.w;if(R.wl)R.w=Math.max(-1,R.w-dt/1.3);if(R.wr)R.w=Math.min(1,R.w+dt/1.3);
       /* 原地打方向不再检查：手机上打方向和油门都用右手，和真车不一样 */
 // 车速：D 往前最多约 7 km/h，R 往后最多约 4 km/h；松开油门就刹车停住
 const vmax=R.gear==='D'?(SCN.vmax||2.0):R.gear==='R'?-.75:0,vt=R.gas?vmax:0,a=R.gas&&vt!==0?1.0:2.6;
 R.v=R.v<vt?Math.min(vt,R.v+a*dt):Math.max(vt,R.v-a*dt);if(R.gear==='P')R.v=0;
 // 走一步（自行车模型）；碰到路缘、别的车就停住
 const px=R.x,pz=R.z,ph=R.h;const d=R.w*LW.MAXD;R.h+=R.v*Math.tan(d)/LW.L*dt;R.x+=Math.sin(R.h)*R.v*dt;R.z+=Math.cos(R.h)*R.v*dt;
 let block=null;
 tires().forEach((q,i)=>{(SCN.curbs||[]).forEach(cb=>{if(cb.z0!=null&&(q[1]<cb.z0||q[1]>cb.z1))return;const p=cb.side>0?q[0]+LW.TR-cb.x:cb.x-(q[0]-LW.TR);
  if(p>0){if(cb.soft){if(p>.3&&!R.off){R.off=1;ev('offRoad')}return}
   if(Math.abs(R.v)>1.4){ev('mountCurb');block='curb'}else{if(!R.touch[i]){R.touch[i]=1;if(Math.abs(R.v)>.75)ev('hitCurb');if(SCN.onTouch)SCN.onTouch(q,cb)}block='curb'}}})});
 if(!block){const me=[R.x,R.z,R.h,LW.HL,LW.HW];if((SCN.obst||[]).some(o=>Math.abs(o[0]-R.x)<7&&Math.abs(o[1]-R.z)<7&&obbHit(me,[o[0],o[1],o[2],LW.HL,LW.HW]))){block='car';ev('crash');crashSnd()}}
 if(block){R.x=px;R.z=pz;R.h=ph;R.v=0}else if(Math.abs(R.v)>.02){R.touch={}}
 // 方向变化（前进／倒车）算一段
 const dir=R.v>.1?1:R.v<-.1?-1:0;if(dir&&dir!==R.lastDir){R.segs++;R.lastDir=dir;if(SCN.onSeg)SCN.onSeg(dir,R.segs)}
 // 倒车要回头看
 if(R.v<-.05){R.revDist+=-R.v*dt;if(!R.back)R.revNoLook+=-R.v*dt;if(R.revNoLook>.45)ev('noLookBack')}else if(R.v>.05)R.revNoLook=0;
 if(R.back)R.bT=t;
 // 看后视镜（中间→左→右）、看盲点
 if(R.look){const L=R.look,k9=Math.min(1,dt*12);L.t+=dt;
  if(LSEQ[L.k]){const q=LSEQ[L.k];let s=0,i=0;while(i<q.length&&L.t>s+q[i][2]){if(q[i][3])q[i][3].forEach(m=>{if(m==='M')R.mT=t;else R.oT[m]=t});s+=q[i][2];i++}
   if(i>=q.length){R.look=null;R.yaw=0;R.pit=0;mk()}else{const kk=Math.min(1,dt*(Math.abs(q[i][0])>1.5?10:12));R.yaw+=(q[i][0]-R.yaw)*kk;R.pit+=(q[i][1]-R.pit)*kk}}
  else if(L.k==='M'){const tg=L.t<.6?[.42,.2]:L.t<1.2?[-.46,-.34]:L.t<1.8?[.83,-.27]:[0,0];R.yaw+=(tg[0]-R.yaw)*k9;R.pit+=(tg[1]-R.pit)*k9;if(L.t>1.6)R.mT=t;if(L.t>2.1){R.look=null;R.yaw=0;R.pit=0;mk()}}
  else{const sd=L.k==='L'?-1:1;if(L.t<.95){R.yaw+=(sd*2.05-R.yaw)*Math.min(1,dt*10);R.pit+=(-.03-R.pit)*k9;if(L.t>.6)R.oT[L.k]=t}else{R.yaw+=(0-R.yaw)*k9;R.pit+=(0-R.pit)*k9;if(L.t>1.3){R.oT[L.k]=t;R.look=null;R.yaw=0;R.pit=0;mk()}}}}
 else{const yt=R.back?Math.PI*.92:0;R.yaw+=(yt-R.yaw)*Math.min(1,dt*6);R.pit+=((R.back?-.08:0)-R.pit)*Math.min(1,dt*6)}
 SCN.step(R,dt);
 // 屏幕上的提示：挡位、方向盘、离路缘
 const wv=$('whl');if(wv){wv.style.transform=`rotate(${R.w*540}deg)`;const dg=Math.round(Math.abs(R.w)*WLOCK/10)*10;$('wtx').textContent=dg<10?'正':(R.w<0?'左 ':'右 ')+dg+'°'+(Math.abs(R.w)>.995?' 到底':'')}
 const cg=curbGap(1),e=$('cgap');if(e){if(cg){const m=Math.min(cg.front,cg.rear);e.style.display='';e.textContent='右轮离路缘：前 '+Math.max(0,cg.front).toFixed(2)+' 米 · 后 '+Math.max(0,cg.rear).toFixed(2)+' 米';e.style.color=m<=.3&&m>=-.01?'#7ee787':'#fff'}else e.style.display='none'}}
function finish(okText){if(R.over)return;R.over=true;R.sig=null;$('sg').style.display='none';const o=$('ov');let h;const SER=LSSER.concat(SCN.SER||[]);
 if(!R.ev.length)h='<h2>驾驶总结</h2><div class="st">★★★</div><p>'+(okText||SCN.okText)+'</p>';
 else h='<h2>驾驶总结</h2><p>这一趟有 '+R.ev.length+' 处需要注意：</p><div class="cards">'+R.ev.map(e=>`<div class="card">${e.img?`<img src="${e.img}">`:''}<b>${e.title}${SER.includes(e.key)?'<span class="tag s">严重</span>':'<span class="tag">扣分项</span>'}</b><span>${e.text}</span></div>`).join('')+'</div>';
 if(typeof ADS!=='undefined')h+=ADS.credit();
 o.innerHTML=`<div class="pn">${h}<br><button id="again">再来一次</button> <button id="home" style="background:#6b7280">回到首页</button></div>`;o.style.display='flex';
 $('again').onclick=()=>{if(SCN.again&&SCN.again())return;o.style.display='none';newRun(true);playing=true};$('home').onclick=()=>{o.innerHTML=HOME;o.style.display='flex';bindHome()}}
// ================= 渲染循环（左边俯视、右边驾驶视角） =================
let last=0,TOPC=null,HOME='';
MRL.rt.setSize(512,256);MRR.rt.setSize(512,256);
{const vf=h=>2*Math.atan(Math.tan(h/2*Math.PI/180)/2)*180/Math.PI;MRL.c.fov=vf(16);MRL.dir.set(Math.sin(7*Math.PI/180),-.03,-1).normalize();MRR.c.fov=vf(24);MRR.dir.set(-Math.sin(11*Math.PI/180),-.03,-1).normalize();[MRL,MRR].forEach(m=>m.c.updateProjectionMatrix())}
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
  cockpit.visible=true;cockpit.position.set(bx0,Y+1.25,bz0);cockpit.rotation.order='YXZ';cockpit.rotation.y=-R.h;cockpit.rotation.x=-Math.atan(pitchG);wheel.rotation.z=-R.w*WLOCK*Math.PI/180}
 $('sp').textContent=(Math.abs(R.v)*3.6).toFixed(0);if(cluster)cluster(Math.round(Math.abs(R.v)*3.6));
 if(((loop.fc=(loop.fc||0)+1)&1)===0){const m=MR[(loop.fc>>1)%MR.length],sa=ren.shadowMap.autoUpdate;cockpit.updateMatrixWorld(true);
  m.c.position.copy(cockpit.localToWorld(m.pos.clone()));m.c.lookAt(m.c.position.clone().add(m.dir.clone().transformDirection(cockpit.matrixWorld)));
  cockpit.visible=false;ren.shadowMap.autoUpdate=false;ren.setRenderTarget(m.rt);ren.render(scene,m.c);ren.setRenderTarget(null);ren.shadowMap.autoUpdate=sa;cockpit.visible=true}
 ren.setScissorTest(true);ren.setViewport(W-w2,0,w2,HH);ren.setScissor(W-w2,0,w2,HH);mine.visible=false;ren.render(scene,cam);
 if(!SCN.noSplit){if(!TOPC)TOPC=new T.PerspectiveCamera(40,1,1,300);TOPC.aspect=(W-w2)/HH;TOPC.updateProjectionMatrix();
 const tc=SCN.topCam?SCN.topCam(R):[R.x,R.z,20];TOPC.position.set(-tc[0],SCN.Y(tc[1])+tc[2],tc[1]);TOPC.up.set(0,0,1);TOPC.lookAt(-tc[0],SCN.Y(tc[1]),tc[1]);
 mine.visible=true;cockpit.visible=false;ren.setViewport(0,0,W-w2,HH);ren.setScissor(0,0,W-w2,HH);ren.render(scene,TOPC);mine.visible=false;cockpit.visible=true}ren.setScissorTest(false);ren.setViewport(0,0,W,HH);
 requestAnimationFrame(loop)}
function bindHome(){document.querySelectorAll('.md').forEach(b=>b.onclick=()=>{DIFF=b.dataset.diff||'easy';if(SCN.pick&&SCN.pick(DIFF))return;$('ov').style.display='none';newRun(true);playing=true})}
const LS={start(s){SCN=s;rs();newRun(false);setView(1);requestAnimationFrame(loop);HOME=$('ov').innerHTML;bindHome();
 if(/[?&]go=1/.test(typeof location!=='undefined'?location.search:'')){$('ov').style.display='none';newRun(true);playing=true}      // 换了场景重新加载页面后直接开始
 $('hm').onclick=()=>{if(R)R.over=true;playing=false;const o=$('ov');o.innerHTML=HOME;o.style.display='flex';bindHome()}}};
