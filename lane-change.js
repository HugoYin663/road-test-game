// ============================================================
// lane-change.js — 项目：换线（SMOG：Signal 打灯 → Mirror 看后视镜 → Over shoulder 回头看盲区 → Go 换线）
// ============================================================
// 同向两条车道：左车道 x=1.75（车流约 65 km/h，比你快），右车道 x=5.25（前面的车 60，你后面跟着稍快的车）；你由系统保持 60 km/h
// 路线坐标 (x,z)：x 向右为正，车往 +z 开；画到场景里是 (-x, z)（和其他项目一样）
const LX={L:1.75,R:5.25},V0=16.67,VL=18.06;
const ROAD0=-400,ROAD1=2800,RLN=ROAD1-ROAD0,RCZ=(ROAD0+ROAD1)/2;
// ---------- 道路和路边 ----------
box(900,.1,RLN+600,M(0xffffff,{map:noise('#7fae5a',60,160)}),0,-.012,RCZ);
box(14.4,.1,RLN,M(0xffffff,{map:noise('#6c6c75',80,240)}),0,0,RCZ);
[-1,1].forEach(s=>{box(.3,.18,RLN,0xb9bbc0,s*7.35,.09,RCZ);box(2.2,.12,RLN,0x9b9da3,s*9.6,.06,RCZ);
 box(.15,.02,RLN,WH,s*6.9,.06,RCZ);box(.12,.02,RLN,0xf2c12e,s*.13,.06,RCZ)});      // 路边白实线、中间双黄线
{const dT=cv(4,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#f6f6f6';x.fillRect(0,0,w,Math.round(h*3/9))});dT.wrapT=T.RepeatWrapping;dT.repeat.set(1,RLN/9);
 [-3.5,3.5].forEach(x0=>{const p=mesh(new T.PlaneGeometry(.15,RLN),new T.MeshBasicMaterial({map:dT,transparent:true}),-x0,.065,RCZ);p.rotation.x=-Math.PI/2;scene.add(p)})}      // 车道虚线（3 米线、6 米空）
// 树、路灯（让你感觉到车速）
{const tr=M(0x6b4a2e),lf=[M(0x3f8a3a),M(0x4f9a44),M(0x357a33)],pl=M(0x8a9099);
 for(let z=ROAD0;z<ROAD1;z+=22)[-1,1].forEach(s=>{const x=s*(13+Math.random()*6),g=new T.Group();
  g.add(mesh(new T.CylinderGeometry(.18,.25,2.2,6),tr,0,1.1,0));const c=mesh(new T.SphereGeometry(1.6+Math.random()*.8,8,6),lf[Math.random()*3|0],0,3.2,0);c.castShadow=true;g.add(c);
  g.position.set(-x,0,z+Math.random()*10);scene.add(g)});
 for(let z=ROAD0;z<ROAD1;z+=55)[-1,1].forEach(s=>{const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.08,.11,8,6),pl,0,4,0));
  const a=mesh(new T.BoxGeometry(1.8,.1,.12),pl,s*.9,7.9,0);g.add(a);g.add(mesh(new T.BoxGeometry(.5,.12,.25),BM(0xf4f1dc),s*1.7,7.82,0));g.position.set(-s*8.3,0,z);scene.add(g)})}
// 限速牌 MAXIMUM 60
{const t=cv(240,300,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#111';x.lineWidth=8;x.strokeRect(12,12,w-24,h-24);x.fillStyle='#111';x.textAlign='center';
  x.font='bold 46px Arial';x.fillText('MAXIMUM',w/2,80);x.font='bold 170px Arial';x.fillText('60',w/2,255)});
 [40,640,1240].forEach(z=>{const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.05,.05,2.9,8),M(0x8a9099),0,1.45,0));const f=mesh(new T.PlaneGeometry(.75,.94),new T.MeshBasicMaterial({map:t}),0,2.35,-.05);f.rotation.y=Math.PI;g.add(f);g.position.set(-8.2,0,z);scene.add(g)})}
scene.add(sun.target);
// ---------- 状态 ----------
const mine=car(C[0]);
let R=null,round=0,playing=false,gt=0,view=1,yawD=0,az=2.4,el=.85,drag=false,lx=0,ly=0,DIFF='easy';
const live=[];
const TXT={
 noSig:["换线前没有打转向灯","换线要先打转向灯（Signal），让旁边车道和后面的车知道你要过去，再看后视镜、回头看盲区，最后才换线。"],
 wrongSig:["转向灯打错了方向","你要往哪边换线，就打哪边的转向灯。"],
 sigShort:["转向灯打得太晚","转向灯要提前打，至少闪 3 秒左右（三四下）再开始换线，给别人反应的时间。打灯后马上就换，等于没打。"],
 noMirror:["换线前没有看后视镜","打灯后要先看中间后视镜和要换过去那一侧的外后视镜（Mirror），看清后面和旁边车道的车流。"],
 noShoulder:["没有回头看盲区","后视镜看不到车身侧后方的盲区。换线前一定要回头（Over shoulder）看一眼要换过去那一侧的盲区，确认没有车。"],
 oldShoulder:["回头看盲区后隔太久才换线","回头看盲区要在换线前的最后一刻做，看完马上换。隔了几秒，盲区里可能已经有车开进来了。"],
 unsafeB:["旁边车道的车就在你旁边（盲区里）还换线","换线那一刻，要换过去的车道上有车和你并排或在你侧后方的盲区里，换过去会撞上它。看后视镜、回头看盲点，确认旁边没有车再换。"],
 unsafeR:["后面的车开过来太近还换线，逼它刹车","要换过去的车道上，后面有车比你快、离你又不够远，你换过去它就得刹车让你。要等它过去，或者等它离你足够远（换过去以后它不用刹车）再换。"],
 unsafeF:["换到前车后面太近","要换过去的车道上，前面的车比你慢、离你太近，换过去你就贴在它后面。要等它和你拉开距离再换。"],
 sigOn:["换完线没有关转向灯","换线完成后要马上关掉转向灯，否则别人会以为你还要换线或转弯。"],
 noChange:["一直没有完成换线","考官要求换线后，要在安全的时候尽快完成。空档不够可以等，但看到足够的空档就要果断换过去。"],
 crash:["换线时和旁边车道的车相撞","换线前一定要看后视镜和回头看盲区，确认旁边车道有足够的空档。"]};
const SER=['unsafeB','unsafeR','unsafeF','crash'];
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;
 R={t:0,x:LX.R,z:0,h:0,v:V0,lane:'R',lc:null,ph:0,sig:null,sigT:-9,mT:{},oT:{},look:null,yaw:0,pit:0,ev:[],over:false,cars:[],done:{L:false,R:false},lastDone:-9};
 const add=(lane,dz,v)=>{const c=car(C[1+Math.random()*8|0]);live.push(c);R.cars.push({c,lane,x:LX[lane],z:dz,vd:v,cv:v})};
 // 左车道：开头有一辆车在你左后方的盲区附近慢慢超过你，之后才有空档；再往后是一团一团的车流
 const vl=()=>Math.random()<.15?19.44:VL;
 [18,52,90,135].forEach(d=>add('L',d+Math.random()*6,VL));
 let d=-(9+Math.random()*3);add('L',d,VL);
 d-=58+Math.random()*25;add('L',d,Math.random()<.5?19.44:VL);
 while(d>-650){const n=2+(Math.random()*2|0);for(let k=0;k<n;k++){d-=24+Math.random()*10;add('L',d,vl())}d-=50+Math.random()*30;add('L',d,vl())}
 // 右车道：你前面 45 米有一辆车（和你一样 60），后面跟着一辆；你换到左车道以后，右车道慢下来，车会从前面慢慢“退”到你旁边
 d=45+Math.random()*8;add('R',d,V0);
 while(d<700){d+=Math.random()<.35?26+Math.random()*8:42+Math.random()*28;add('R',d,V0)}
 // 你后面跟着 1～3 辆车（约 65–70 km/h，比你快，平时跟在你后面）：你换到左车道后，它们会在右车道跟上来、从你右边开过去，换回右车道时要等它们过去
 {let b=-13;const n=1+(Math.random()*3|0);for(let k=0;k<n;k++){add('R',b,18.1+Math.random()*1.3);b-=12+Math.random()*4}add('R',b-70-Math.random()*20,V0);add('R',b-130-Math.random()*20,V0)}
 // 对面车道的车（只是背景）
 R.opp=[];for(let k=0;k<8;k++){const c=car(C[1+Math.random()*8|0]);live.push(c);R.opp.push({c,x:-(Math.random()<.5?1.75:5.25),z:40+k*45+Math.random()*20})}
 mine.visible=view===2;setSig(null);banner('保持车道，跟着车流行驶','');mk();$('sp').textContent='60'}
function banner(t,col,big){const b=$('bn');b.textContent=t;b.style.color=col||'';if(big){const e=$('cf');e.textContent=t;e.classList.remove('go');void e.offsetWidth;e.classList.add('go')}}      // big：考官指令先在屏幕中间大字闪几下，再缩回上方
function flash(t){const f=$('fl');f.textContent=t;f.style.opacity=1;clearTimeout(flash.h);flash.h=setTimeout(()=>f.style.opacity=0,1800)}
function setSig(s){R.sig=s;R.sigT=R.t;const e=$('sg');e.style.display=s?'block':'none';e.textContent=s==='L'?'⬅':'➡';if(s)tick(true);mk()}
function mk(){const on={sigL:R.sig==='L',sigR:R.sig==='R',mir:R.look&&R.look.k==='M',sho:R.look&&R.look.k==='O',go:!!R.lc};document.querySelectorAll('.b').forEach(b=>b.classList.toggle('on',!!on[b.dataset.m]))}
const other=()=>R.lane==='R'?'L':'R';      // 只有两条车道：能换的只有另一条
// 错误卡片的配图：出错那一刻从正上方拍一张
let SNC=null;
function snapLC(){try{const cvs=ren.domElement,W=360,H=240;if(!cvs.width)return null;if(!SNC)SNC=new T.PerspectiveCamera(45,1,1,500);SNC.aspect=cvs.width/cvs.height;SNC.updateProjectionMatrix();
 SNC.position.set(-3.5,52,R.z+3);SNC.up.set(0,0,1);SNC.lookAt(-3.5,0,R.z+4);const vc=cockpit.visible,vm=mine.visible;cockpit.visible=false;mine.visible=true;placeMine();ren.render(scene,SNC);cockpit.visible=vc;mine.visible=vm;
 const c2=document.createElement('canvas');c2.width=W;c2.height=H;const sw=Math.min(cvs.width,cvs.height*W/H),sh=sw*H/W;c2.getContext('2d').drawImage(cvs,(cvs.width-sw)/2,(cvs.height-sh)/2,sw,sh,0,0,W,H);return c2.toDataURL('image/jpeg',.82)}catch(e){return null}}
function ev(key){if(R.ev.some(e=>e.key===key))return;const t=TXT[key];R.ev.push({key,title:t[0],text:t[1],img:snapLC()});flash(t[0])}
// ---------- 按钮 ----------
function cmd(m){if(!R||R.over||!playing)return;
 if(m==='sigL'||m==='sigR'){const s=m==='sigL'?'L':'R';setSig(R.sig===s?null:s);return}
 if(m==='mir'||m==='sho'){if(R.look)return;R.look={k:m==='mir'?'M':'O',t:0,side:R.lc?R.lc.to:other()};mk();return}
 if(m==='go'){if(R.lc)return;startChange();return}}
function cmdUp(){}
// 空档够不够：旁边／盲区里有车不行；后车比你快、换过去会逼它刹车不行；前车比你慢、离得太近不行（前车比你快、正在开远就没关系）
function gapWhy(to){let w=null;R.cars.forEach(c=>{if(c.lane!==to||w)return;const dz=c.z-R.z,dv=c.cv-R.v;
  if(Math.abs(dz)<5.6)w='unsafeB';
  else if(dz<0){const g=-dz-4.6-Math.max(0,dv)*2;if(g<Math.max(6,.6*c.cv+2.5*Math.max(0,dv)))w='unsafeR'}
  else{const g=dz-4.6+dv*2;if(g<Math.max(3,.2*R.v))w='unsafeF'}});return w}
// 换线前的检查：S → M → O → G
function startChange(){const to=other(),t=R.t,X1=LX[to];
 if(!R.sig)ev('noSig');else if(R.sig!==to)ev('wrongSig');else if(t-R.sigT<2.8)ev('sigShort');
 if(!(R.mT[to]!=null&&t-R.mT[to]<10))ev('noMirror');
 if(!(R.oT[to]!=null&&t-R.oT[to]<10))ev('noShoulder');else if(t-R.oT[to]>2.5)ev('oldShoulder');
 // 空档：换过去以后后车不用刹车、前车不会太近；在旁边（盲区）就一定不行
 const why=gapWhy(to);if(why)ev(why);
 R.lc={from:R.lane,to,x0:R.x,x1:X1,t0:t,T:4};mk()}
// ---------- 每一帧 ----------
function occ(lane){return Math.abs(R.x-LX[lane])<2.7}      // 你的车身占着这条车道
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;const t=R.t;
 // 考官指令
 if(R.ph===0&&t>=3){R.ph=1;R.p1=t;banner('考官：前方安全时，换到左车道','#ffe27a',1)}
 if(R.ph===1&&R.done.L){R.ph=2;R.p2=t}
 if(R.ph===2&&t>=R.p2+6){R.ph=3;R.p3=t;banner('考官：换回右车道','#ffe27a',1)}
 if(R.ph===3&&R.done.R){R.ph=4;R.p4=t;banner('换线完成','')}
 if(R.ph===1&&!R.lc&&t>R.p1+45){ev('noChange');finish();return}
 if(R.ph===3&&!R.lc&&t>R.p3+45){ev('noChange');finish();return}
 if(R.ph===4&&t>R.p4+4){finish();return}
 // 你的车：保持 60，前面有车太近就跟车
 let vt=V0;R.cars.forEach(c=>{if(!occ(c.lane))return;const g=c.z-R.z-4.6;if(g>-2&&g<60)vt=Math.min(vt,Math.sqrt(c.cv*c.cv+2*4*Math.max(0,g-8)))});
 if(R.crash)vt=0;R.v=R.v>vt?Math.max(vt,R.v-(R.crash?9:5)*dt):Math.min(vt,R.v+1.5*dt);R.z+=R.v*dt;
 if(R.lc){const L=R.lc,k=Math.min(1,(t-L.t0)/L.T),s=(1-Math.cos(Math.PI*k))/2,dx=(L.x1-L.x0)*Math.PI/2*Math.sin(Math.PI*k)/L.T;R.x=L.x0+(L.x1-L.x0)*s;R.h=Math.atan2(dx,Math.max(1,R.v));
  if(k>=1){R.lc=null;R.h=0;R.x=L.x1;R.lane=L.to;R.done[L.to]=true;R.lastDone=t;mk()}}
 // 换完线：转向灯要关
 if(!R.lc&&R.sig&&R.lastDone>0&&t-R.lastDone>3.5&&R.sigT<R.lastDone)ev('sigOn');
 // 看后视镜／回头看盲区
 if(R.look){const L=R.look,k9=Math.min(1,dt*12),sd=L.side==='L'?-1:1;L.t+=dt;
  if(L.k==='M'){if(L.t<.55){R.yaw+=(.42-R.yaw)*k9;R.pit+=(.2-R.pit)*k9}else if(L.t<1.35){R.yaw+=((sd<0?-.46:.83)-R.yaw)*k9;R.pit+=((sd<0?-.34:-.27)-R.pit)*k9;      /* 视线落在外后视镜上，镜子完整地出现在画面偏左（或偏右）一点，不被按钮挡住 */if(L.t>1)R.mT[L.side]=t}
   else{R.yaw+=(0-R.yaw)*k9;R.pit+=(0-R.pit)*k9;if(L.t>1.7){R.look=null;R.yaw=0;R.pit=0;mk()}}}
  else{if(L.t<.95){R.yaw+=(sd*2.05-R.yaw)*Math.min(1,dt*10);R.pit+=(-.03-R.pit)*k9;if(L.t>.6)R.oT[L.side]=t}
   else{R.yaw+=(0-R.yaw)*Math.min(1,dt*12);R.pit+=(0-R.pit)*k9;if(L.t>1.3){R.look=null;R.yaw=0;R.pit=0;mk()}}}}
 // 其他车：保持自己的速度，跟前车（你的车在它的车道上时也算前车）；你切到它前面太近时它会刹车、按喇叭
 R.cars.forEach(c=>{  if(c.crash){c.cv=Math.max(0,c.cv-9*dt);c.z+=c.cv*dt;return}
  let vt=c.vd;R.cars.forEach(o=>{if(o===c||o.lane!==c.lane)return;const g=o.z-c.z-4.6;if(g>-1&&g<70)vt=Math.min(vt,Math.sqrt(o.cv*o.cv+2*4*Math.max(0,g-7)))});
  if(occ(c.lane)){const g=R.z-c.z-4.6;if(g>-1&&g<70){const need=Math.sqrt(R.v*R.v+2*4*Math.max(0,g-6));if(need<vt){vt=need;if(c.cv-R.v>.5&&(c.cv*c.cv-R.v*R.v)/(2*Math.max(.5,g-2))>3.2&&!c.hk){c.hk=true;honk()}}}}
  const dec=occ(c.lane)&&R.z>c.z?8:5;c.cv=c.cv>vt?Math.max(vt,c.cv-dec*dt):Math.min(vt,c.cv+1.8*dt);c.z+=c.cv*dt});
 R.opp.forEach(o=>{o.z-=V0*dt;if(o.z<R.z-160)o.z=R.z+260+Math.random()*80});
 // 相撞
 if(!R.crash){const me=[R.x,R.z,R.h,2.3,.95];const H=R.cars.find(c=>obbHit(me,[c.x,c.z,0,2.3,.95]));
  if(H){H.crash=true;H.spin=(R.x>H.x?-1:1)*.3;R.crash={t};crashSnd();ev('crash')}}
 if(R.crash&&t-R.crash.t>3){finish();return}}
function finish(){if(R.over)return;R.over=true;setSig(null);const o=$('ov');let h;
 if(!R.ev.length)h='<h2>驾驶总结</h2><div class="st">★★★</div><p>打灯、看后视镜、回头看盲区、找够空档再换线，两次换线都做得很好。</p>';
 else h='<h2>驾驶总结</h2><p>这一趟有 '+R.ev.length+' 处需要注意：</p><div class="cards">'+R.ev.map(e=>`<div class="card">${e.img?`<img src="${e.img}">`:''}<b>${e.title}${SER.includes(e.key)?'<span class="tag s">严重</span>':'<span class="tag">扣分项</span>'}</b><span>${e.text}</span></div>`).join('')+'</div>';
 o.innerHTML=`<div class="pn">${h}<br><button id="again">再来一次</button> <button id="home" style="background:#6b7280">回到首页</button></div>`;o.style.display='flex';
 $('again').onclick=()=>{o.style.display='none';newRun(true);playing=true};$('home').onclick=()=>{o.innerHTML=HOME;o.style.display='flex';bindHome()}}
// ================= 渲染循环 =================
let last=0,fovH=110;
MRL.rt.setSize(512,256);MRR.rt.setSize(512,256);      // 外后视镜画面清楚一些（专门看后视镜时会放大）
function placeMine(){place(mine,R.x,R.z,R.h);mine.userData.bl.forEach(m=>{m.position.x=R.sig==='R'?-.88:.88})}
function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;step(dt);const bl=Math.sin(ts/1000*15)>0;
 R.cars.forEach(c=>{if(c.lane&&!c.crash)c.x=LX[c.lane];place(c.c,c.x,c.z,c.spin||0);c.c.visible=Math.abs(c.z-R.z)<420});
 R.opp.forEach(o=>place(o.c,o.x,o.z,Math.PI));
 placeMine();mine.userData.bl.forEach(m=>m.visible=!!R.sig&&bl);
 sun.position.set(-R.x+60,90,R.z-40);sun.target.position.set(-R.x,0,R.z+20);
 if(R.sig&&playing&&!R.over){const on=Math.sin(ts/1000*9.4)>0;$('sg').style.opacity=on?1:.15;if(on!==loop.sgOn){loop.sgOn=on;tick(on)}}
 const q=[R.x,R.z,R.h];
 if(view===1){const h=q[2]+R.yaw+yawD,L=R.look?6:10,fT=!R.look?110:R.look.k==='M'?(R.look.t<.55?75:R.look.t<1.35?60:110):100;fovH+=(fT-fovH)*Math.min(1,dt*7);      /* 看后视镜时视线集中在镜子上：画面放大，镜子变大 */cam.fov=Math.min(105,2*Math.atan(Math.tan(fovH*Math.PI/360)/cam.aspect)*180/Math.PI);cam.updateProjectionMatrix();
  const ox=.38*Math.cos(q[2]),oz=.38*Math.sin(q[2]),bx0=-q[0]+Math.sin(q[2])*.2,bz0=q[1]-Math.cos(q[2])*.2;const sk=R.crash&&R.t-R.crash.t<.7?(1-(R.t-R.crash.t)/.7)*.12:0;
  cam.position.set(bx0+ox+(Math.random()-.5)*sk,1.25+(Math.random()-.5)*sk,bz0+oz+(Math.random()-.5)*sk);
  cam.lookAt(-q[0]-Math.sin(h)*L+ox,1.25+L*.05+R.pit*L,q[1]+Math.cos(h)*L+oz);
  cockpit.visible=true;cockpit.position.set(bx0,1.25,bz0);cockpit.rotation.y=-q[2];
  const dh=normA(q[2]-lastH)/Math.max(dt,.001);lastH=q[2];wheel.rotation.z+=((Math.max(-2.6,Math.min(2.6,dh*2.4)))-wheel.rotation.z)*Math.min(1,dt*10)}
 else{cockpit.visible=false;if(cam.fov!==62){cam.fov=62;cam.updateProjectionMatrix()}cam.position.set(-3.5,42,R.z-26);cam.lookAt(-3.5,0,R.z+14)}      /* 俯视：跟着你的车，从后上方往前看 */
 $('sp').textContent=Math.round(R.v*3.6);if(cluster)cluster(Math.round(R.v*3.6));
 if(view===1&&((loop.fc=(loop.fc||0)+1)&1)===0){const m=MR[(loop.fc>>1)%MR.length],sa=ren.shadowMap.autoUpdate;cockpit.updateMatrixWorld(true);
  m.c.position.copy(cockpit.localToWorld(m.pos.clone()));m.c.lookAt(m.c.position.clone().add(m.dir.clone().transformDirection(cockpit.matrixWorld)));
  cockpit.visible=false;ren.shadowMap.autoUpdate=false;ren.setRenderTarget(m.rt);ren.render(scene,m.c);ren.setRenderTarget(null);ren.shadowMap.autoUpdate=sa;cockpit.visible=true}
 ren.render(scene,cam);requestAnimationFrame(loop)}
rs();newRun(false);setView(1);requestAnimationFrame(loop);
const HOME=$('ov').innerHTML;
function bindHome(){document.querySelectorAll('.md').forEach(b=>b.onclick=()=>{DIFF=b.dataset.diff||'easy';$('ov').style.display='none';newRun(true);playing=true})}
bindHome();
$('hm').onclick=()=>{if(R)R.over=true;playing=false;const o=$('ov');o.innerHTML=HOME;o.style.display='flex';bindHome()};
