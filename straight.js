// ============================================================
// straight.js — 项目：直行通过红绿灯路口（G 路考）。都在右车道，限速 60，你只管车速（加速／减速键）和观察
//   var=green 绿灯直行：保持 60；接近路口时看后视镜，进路口前左右观察，过了路口再看一次后视镜
//   var=red   红灯直行：你是第二辆车。减速时看后视镜，停在能看到前车后轮和地面的地方，停下后再看后视镜（也可以左右看路口），
//             绿灯后跟着前车起步，一边加速到 60，中间再看一次后视镜
// ============================================================
const VAR0=((typeof location!=='undefined'?location.search:'').match(/var=(\w+)/)||[])[1]||null;
const LANE=6.25,HL=2.35,SL=-19.6,SC=SL-.6-HL;      // 你的车道（右车道）、半个车长、停车线、停车线前第一辆车的车身中心
const myPath=u=>[LANE,u,0];
const mine=car(C[0]);
let DIFF='easy',R=null,round=0,playing=false,gt=0,view=1,yawD=0,az=2.4,el=.85,drag=false,lx=0,ly=0,VAR='green';
const live=[];
// 刹车灯（和出高速的车一样）
function brakeL(g){const ms=[];[-1,1].forEach(sx=>{const m=mesh(new T.BoxGeometry(.36,.17,.06),new T.MeshBasicMaterial({color:0xff1a1a}),sx*.6,.86,-2.39);m.visible=false;g.add(m);ms.push(m);
 const h=mesh(new T.PlaneGeometry(.5,.28),new T.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:.35,depthWrite:false}),sx*.6,.86,-2.46);h.rotation.y=Math.PI;h.visible=false;g.add(h);ms.push(h)});return ms}
// ---------- 车道：每辆车沿自己的方向走，s＝沿行驶方向的距离，停车线前第一辆车停在 s＝SC ----------
const LN={me:{x:LANE,z:0,dx:0,dz:1,g:'main'},ml:{x:2.75,z:0,dx:0,dz:1,g:'main'},o1:{x:-2.75,z:0,dx:0,dz:-1,g:'main'},o2:{x:-6.25,z:0,dx:0,dz:-1,g:'main'},
 e1:{x:0,z:-2.75,dx:1,dz:0,g:'cross'},e2:{x:0,z:-6.25,dx:1,dz:0,g:'cross'},w1:{x:0,z:2.75,dx:-1,dz:0,g:'cross'},w2:{x:0,z:6.25,dx:-1,dz:0,g:'cross'}};
const posOf=m=>{const L=LN[m.ln];return[L.x+L.dx*m.s,L.z+L.dz*m.s,Math.atan2(L.dx,L.dz)]};
function addCar(ln,s,v,vmax,o){const c=car(C[1+Math.random()*8|0]);live.push(c);const m=Object.assign({c,ln,s,v,vmax,bk:brakeL(c),flow:false},o||{});R.cars.push(m);return m}
// 同一车道里前面最近的车（你的车道把你也算上）
function leader(m){let b=null,bs=1e9;R.cars.forEach(o=>{if(o!==m&&!o.gone&&o.ln===m.ln&&o.s>m.s&&o.s<bs){bs=o.s;b=o}});if(m.ln==='me'&&R.u>m.s&&R.u<bs)b={s:R.u,v:R.v};return b}
function moveCar(m,dt){if(m.gone)return;if(m.crash){m.v=0;return}
 const st=R.lt[LN[m.ln].g];let vt=m.vmax;
 if(m.s<SC+2.5){let must=st==='r'||(st==='y'&&m.stopY)||(st==='g'&&R.t<(m.rel||0));if(must)vt=m.s>=SC-.05?0:Math.min(vt,Math.sqrt(2*2.2*Math.max(0,SC-m.s)))}      // 红灯、能停下的黄灯：停在停车线前；变绿灯后过一会儿才起步
 const ah=leader(m);if(ah){const gap=ah.s-m.s-2*HL;vt=Math.min(vt,Math.max(0,ah.v+(gap-(3+1.4*m.v))*.5));if(gap<2.4)vt=0}      // 跟前车：停下时留约 3 米，开起来约 1.4 秒
 const a=vt>m.v?Math.min(2,(vt-m.v)*2):Math.max(-6,(vt-m.v)*6);m.v=Math.max(0,m.v+a*dt);m.s+=m.v*dt;m.bOn=a<-.5||(m.v<.2&&st!=='g');
 if(m.flow&&m.s>420){const L=R.lt[LN[m.ln].g];if(L==='g'){let mn=-200;R.cars.forEach(o=>{if(o!==m&&o.ln===m.ln&&!o.gone)mn=Math.min(mn,o.s)});m.s=Math.min(-330,mn-35-Math.random()*40);m.v=m.vmax;m.c=m.c}else{m.gone=true;m.c.visible=false}}}
function flowLane(ln,n,vmax){let s=-240+Math.random()*30;for(let i=0;i<n;i++){addCar(ln,s,vmax,vmax+(Math.random()-.5)*.8,{flow:true});s+=45+Math.random()*45}}
// 路边限速牌 MAXIMUM 60：开局前方约 70 米一块，过了路口约 45 米再一块
function signZ(z){const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.05,.05,2.9,8),M(GRY),0,1.45,0));
 const f=mesh(new T.PlaneGeometry(.75,.94),new T.MeshBasicMaterial({map:maxTex}),0,2.35,-.06);f.rotation.y=Math.PI;g.add(f);
 g.add(mesh(new T.PlaneGeometry(.75,.94),M(GRY),0,2.35,-.05));g.position.set(-(hwX+1.7),0,z);scene.add(g);return g}
// ---------- 每一趟 ----------
const U0=-330,UEND={green:130,red:175};      // 离停车线约 310 米开始（约 18 秒），有时间先适应自己控制车速
[U0+70,45].forEach(signZ);
function setLights(main,cross){R.lt={main,cross};setHeads(HEADS,main);setHeads(CHEADS,cross);setPedSig('M',main==='g'?'walk':'hand');setPedSig('X',cross==='g'?'walk':'hand');
 const lt=$('lt');if(lt){const c={g:'#2ee66b',y:'#ffc21a',r:'#ff3b3b'}[main];lt.style.background=c;lt.style.boxShadow='0 0 8px '+c}}
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;
 R={t:0,u:U0,v:60/3.6,a:0,acc:false,dec:false,over:false,ev:[],cars:[],lt:{},yaw:0,pit:0,mirT:-1,scT:-1,lastMir:null,mirs:[],scans:[],ph:0,crash:null,acc0:{fast:0,slow:0,close:0}};
 const red=VAR==='red';
 if(red){setLights('r','g');
  R.lead=addCar('me',U0+45,60/3.6,60/3.6);
  addCar('ml',U0+20,60/3.6,60/3.6);addCar('ml',U0-30,60/3.6,60/3.6);      // 左车道也有车，到停车线停下，绿灯一起走
  ['o1','o2'].forEach(l=>{addCar(l,SC,0,15.5+Math.random());addCar(l,SC-7,0,15.5+Math.random())});      // 对面直行方向也是红灯：停在停车线后
  ['e1','e2','w1','w2'].forEach(l=>flowLane(l,4,15.3+Math.random()*1.6));      // 横向绿灯：车流不断
  banner('红灯直行 · 你是第二辆车','#ff5a5a')}
 else{setLights('g','r');
  R.lead=addCar('me',U0+50,60/3.6,16.4);
  addCar('ml',U0+95,60/3.6,16.6);addCar('ml',U0+10,60/3.6,16.9);
  ['o1','o2'].forEach(l=>flowLane(l,5,15.8+Math.random()*1.2));      // 对面车流
  ['e1','e2','w1','w2'].forEach(l=>{addCar(l,SC,0,15);if(Math.random()<.7)addCar(l,SC-7,0,15)});      // 横向红灯：停着等
  banner('绿灯直行 · 保持 60','#2ee66b')}
 R.fol=addCar('me',U0-28,60/3.6,60/3.6);
 gt=0;mk();$('sp').textContent='60'}
function setHeads(L,c){L.forEach(lm=>{for(const k of ["r","y","g"])lm[k].m.material=k===c?lm[k].on:lm[k].off})}
function banner(t,col){const b=$('bn');b.textContent=TT(t);b.style.color=col}
function mk(){document.querySelectorAll('.b').forEach(b=>{const m=b.dataset.m;b.classList.toggle('on',m==='acc'?!!R.acc:m==='dec'?!!R.dec:m==='mir'?R.mirT>=0:m==='scan'?R.scT>=0:false)})}
function flash(t){const f=$('fl');f.textContent=t;f.style.opacity=1;clearTimeout(flash.h);flash.h=setTimeout(()=>f.style.opacity=0,1800)}
// ---------- 提示 ----------
const TXT={
 noMirA:["接近路口前没有看后视镜","直行通过路口也要知道后面的情况：开始接近路口时（离路口 100 多米），要看一眼中镜。万一前面有情况要急刹，你也知道后车离你多近。"],
 noScan:["过路口前没有左右观察","绿灯直行也要观察路口：车头进入路口前（离路口几十米时），按“观察路口”左右看，确认横向没有闯红灯的车、没有还在过街的行人。"],
 noMirB:["过了路口没有再看后视镜","开过路口以后要再看一次中镜，掌握后面车流的情况。红灯后起步的，在加速到 60 的过程中看。"],
 fast:["车速超过限速","这段路限速 60。超过限速会扣分；按住减速把车速降回 60 左右。"],
 slow:["车速太慢","这段路限速 60，车流也在 60 左右。没有原因开得太慢（低于约 50），会妨碍后面的车。"],
 tooClose:["跟前车太近","和前车至少保持 2 秒左右：前车经过一个路标，你数“一千零一、一千零二”再经过。太近时松开加速或按一下减速。"],
 crash:["发生碰撞","你的车和别的车撞上了。看到前车刹车灯亮、前面是红灯，要提前按住减速。"],
 noMirSlow:["减速前没有看后视镜","看到前面红灯、前车刹车，开始减速的时候要看一眼中镜，知道后车离你多近、有没有跟得太紧。"],
 stopClose:["停车离前车太近","停在前车后面，要停在能看到前车后轮和地面接触的地方（从驾驶座看，前车车尾下面的路面要露出来，大约留 4～6 米）。停得太近，前车溜车或出故障时，你没有余地绕开。"],
 stopFar:["停车离前车太远","停在前车后面，能看到它的后轮和地面就可以了（大约 4～6 米），不要留出两个车身那么大的空当。"],
 noMirStop:["停下后没有看后视镜","在红灯前停稳以后，要再看一次中镜，看后面的车有没有停稳、会不会追尾。"],
 red:["闯红灯","红灯时车头越过了停车线。"],
 slowGo:["绿灯后起步太慢","变绿灯、前车开走以后，你过了很久才起步，妨碍后面的车。"],
 slowAfter:["过路口后没有加速到车流速度","过了路口要平稳地加速到 60 左右，开得太慢会妨碍后面的车。"]};
const SER=['crash','red'];
function ev(key){if(R.ev.some(e=>e.key===key))return;const t=TXT[key];R.ev.push({key,tk:key,title:TT(t[0]),text:t[1],img:snap3D()||''});flash(TT(t[0]))}
// ---------- 操作 ----------
const accN=v=>Math.max(.6,2.37-.045*v);      // 和上高速一样的油门：50 km/h 时约 1.7 m/s²
function cmd(m){if(!playing||!R||R.over||R.crash)return;
 if(m==='acc'||m==='dec'){R[m]=true;if(m==='dec'&&R.v>10&&R.brk0==null)R.brk0=R.t;mk();return}
 if(m==='mir'||m==='look'){if(R.mirT>=0)return;R.scT=-1;yawD=0;R.mirT=0;mk();return}
 if(m==='scan'){if(R.scT>=0)return;R.mirT=-1;R.pit=0;yawD=0;R.scT=0;R.scOK=false;mk();return}}
function cmdUp(m){if(!R)return;if(m==='acc'||m==='dec'){R[m]=false;mk()}}
addEventListener('keydown',e=>{if(e.repeat)return;if(e.key==='ArrowUp')cmd('acc');if(e.key==='ArrowDown')cmd('dec');if(e.key==='m')cmd('mir')});addEventListener('keyup',e=>{if(e.key==='ArrowUp')cmdUp('acc');if(e.key==='ArrowDown')cmdUp('dec')});
const gapLead=()=>R.lead&&!R.lead.gone&&R.lead.s>R.u?R.lead.s-R.u-2*HL:1e9;
// ---------- 每一帧 ----------
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;const t=R.t,red=VAR==='red';
 // 你的车：按住加速／减速；都不按就慢慢减速（松油门滑行，约 0.45 m/s²）；很慢时松开就停住（像踩着刹车）
 if(!R.crash){const aT=R.acc?accN(R.v):R.dec?-3.5:R.v<1?-2.5:-.45;R.a+=(aT-R.a)*Math.min(1,dt*(R.dec?5:4));R.v=Math.max(0,Math.min(25,R.v+R.a*dt));if(R.v===0&&R.a<0)R.a=0}
 R.u+=R.v*dt;const u=R.u,fz=u+HL,rz=u-HL;
 R.cars.forEach(m=>moveCar(m,dt));
 // 观察：后视镜（中镜）
 if(R.mirT>=0){R.mirT+=dt*1.4*LOOKK*(R.mirT<.7?MSLOW:1);const k=Math.min(1,dt*12),mt=R.mirT;
  if(mt<.7){R.yaw+=(MYAW-R.yaw)*k;R.pit+=(MPIT-R.pit)*k;if(mt>.4&&!R.mirDone){R.mirDone=true;R.lastMir=t;R.mirs.push({t,u,v:R.v})}}
  else{R.yaw+=(0-R.yaw)*k;R.pit+=(0-R.pit)*k;if(mt>1.05){R.mirT=-1;R.mirDone=false;R.yaw=0;R.pit=0;mk()}}}
 // 观察路口：左-右-左
 if(R.scT>=0){R.scT+=dt*LOOKK*(R.v>6?1.4:1);const sT=R.scT,tg=sT<.55?-1.25:sT<1.25?1.05:sT<1.8?-1.25:0;R.yaw+=(tg-R.yaw)*Math.min(1,dt*10);
  if(sT>=1.25&&!R.scOK){R.scOK=true;R.scans.push({t,fz})}if(sT>2.2){R.scT=-1;R.yaw=0;mk()}}
 const mirSince=(a,b)=>R.mirs.some(o=>o.t>=a&&o.t<=(b==null?1e9:b));
 // 车速
 const kmh=R.v*3.6;R.acc0.fast=kmh>67?R.acc0.fast+dt:0;if(R.acc0.fast>1.5)ev('fast');
 if(!red&&t>3){const blocked=gapLead()<1.8*R.v+8;R.acc0.slow=kmh<49&&!blocked?R.acc0.slow+dt:0;if(R.acc0.slow>4)ev('slow')}
 {const g=gapLead();R.acc0.close=R.v>8&&g<1.25*R.v?R.acc0.close+dt:0;if(R.acc0.close>2.5)ev('tooClose')}
 if(R.crash){}
 else if(!red){
  if(fz>=-140&&R.tA==null)R.tA=t;      // 开始接近路口（离停车线约 120 米）
  if(!R.chkA&&fz>=SL){R.chkA=true;if(!mirSince(R.tA))ev('noMirA')}
  if(!R.chkS&&fz>=-15.1){R.chkS=true;if(!R.scans.some(s=>s.fz>=-95))ev('noScan')}}
 else{
  // 开始减速时看后视镜：开始踩刹车前 6 秒到之后 2 秒之间看过就行
  if(R.brk0!=null&&!R.chkB&&t>=R.brk0+2){R.chkB=true;if(!mirSince(R.brk0-6,R.brk0+2))ev('noMirSlow')}
  if(R.brk0==null&&R.v<8&&R.lead.v<1&&!R.chkB){R.brk0=t}      // 没按减速、松开加速慢慢滑停的：也从这时起算
  // 停下：和前车的距离（两辆车都停稳以后量）
  if(R.v<.05&&R.lead.v<.05&&fz<SL&&R.stopAt==null){R.stopAt=t;R.stopU=u}
  if(R.stopAt!=null&&!R.chkP&&t>R.stopAt+.6){R.chkP=true;const g=gapLead();if(g<3.6)ev('stopClose');else if(g>9)ev('stopFar')      /* 从驾驶座看：留 4 米左右，前车车尾下面的路面刚好露出来 */}
  // 变灯：停稳 6 秒后（前车停了很久你还没停，也会变）横向变黄 → 全红 → 本方绿灯
  if(R.ph===0&&((R.stopAt!=null&&t>R.stopAt+6)||(R.lead.v<.05&&(R.lst=(R.lst||0)+dt)>14))){R.ph=1;R.tY=t;R.lt.cross='y';setHeads(CHEADS,'y');setPedSig('X','hand');R.cars.forEach(m=>{if(LN[m.ln].g==='cross')m.stopY=SC-m.s>m.v*m.v/7})}
  if(R.ph===1&&t>=R.tY+3){R.ph=2;R.lt.cross='r';setHeads(CHEADS,'r')}
  if(R.ph===2&&t>=R.tY+4.5){R.ph=3;R.tG=t;setLights('g','r');banner('绿灯 · 跟着前车走','#2ee66b');R.cars.forEach(m=>{if(LN[m.ln].g==='main'&&m.v<.5)m.rel=t+.8+Math.random()*.6})}
  if(R.ph===3&&R.tLeadGo==null&&R.lead.v>.5)R.tLeadGo=t;
  if(R.stopAt!=null&&R.tG!=null&&!R.chkM&&R.v>1){R.chkM=true;if(!mirSince(R.stopAt+.01))ev('noMirStop')}
  if(R.tLeadGo!=null&&!R.chkG&&R.v<.5&&t>R.tLeadGo+5&&gapLead()>10){R.chkG=true;ev('slowGo');honk()}
  if(!R.chkR&&fz>=SL&&R.lt.main!=='g'){R.chkR=true;ev('red')}}
 // 过了路口（车尾离开对面的人行横道）以后看后视镜
 if(R.tX==null&&rz>=15.1)R.tX=t;
 // 和别的车相撞
 if(!R.crash){const me=[LANE,u,0,2.3,.95];const H=R.cars.find(m=>{if(m.gone)return false;const p=posOf(m);return Math.abs(p[0]-LANE)<12&&Math.abs(p[1]-u)<12&&obbHit(me,[p[0],p[1],p[2],2.3,.95])});
  if(H){H.crash=true;R.crash={t};R.v=0;R.a=0;R.acc=R.dec=false;crashSnd();ev('crash');mk()}}
 if(R.crash&&t-R.crash.t>3){finish();return}
 if(u>=UEND[VAR]||t>90)finish()}
function cardsHtml(list){return'<div class="cards">'+list.map(e=>`<div class="card">${e.img?`<img src="${e.img}">`:''}<b>${e.title}${SER.includes(e.tk)?'<span class="tag s">严重</span>':'<span class="tag">扣分项</span>'}</b><span>${e.text}</span></div>`).join('')+'</div>'}
function finish(){if(R.over)return;
 if(!R.crash&&R.u>=UEND[VAR]){if(R.tX!=null&&!R.mirs.some(o=>o.t>=R.tX))ev('noMirB');if(VAR==='red'&&R.v*3.6<48)ev('slowAfter')}
 R.over=true;R.acc=R.dec=false;mk();const o=$('ov');let h;
 if(!R.ev.length)h='<h2>驾驶总结</h2><div class="st">★★★</div><p>'+(VAR==='red'?'停车位置、后视镜、起步加速都做得很好。':'车速稳、后视镜和路口观察都做到了。')+'</p>';
 else h='<h2>驾驶总结</h2><p>这一趟有 '+R.ev.length+' 处需要注意：</p>'+cardsHtml(R.ev);
 o.innerHTML=`<div class="pn">${h}<br><button id="again">再来一次</button> <button id="home" style="background:#6b7280">回到首页</button></div>`;o.style.display='flex';
 $('again').onclick=()=>{o.style.display='none';newRun(true);playing=true};$('home').onclick=()=>{o.innerHTML=HOME;o.style.display='flex';bindHome()}}
// 车速提示：开头几秒告诉你车速现在由你控制；练习时车速偏离 60 再提醒（模拟考只有开头那句）
function tip(t){const e=$('tp');if(!e)return;if(!t){e.style.opacity=0;tip.c='';return}if(tip.c===t)return;tip.c=t;e.textContent=TT(t);e.style.opacity=1}
function tipTick(){if(!R||R.over||!playing||R.crash){tip('');return}const t=R.t,k=R.v*3.6,red=VAR==='red',mk2=!!window.MOCK;
 if(t<6){tip('车速由你控制：按住 ▲加速 保持 60，不按会慢慢变慢');return}
 if(mk2){tip('');return}
 if(red&&R.tG==null){if(R.lead.v<15&&R.v>1&&!R.dec)tip('前面红灯，前车在减速：按住 ▼减速，停在前车后面');else tip('');return}
 if(red&&R.v<1&&R.lead.v>.5){tip('绿灯了，前车已经走了：按住 ▲加速 跟上');return}
 const blocked=gapLead()<1.8*R.v+8;
 if(k>64&&R.acc)tip('快超速了：松开 ▲加速');else if(k>65)tip('超过 60 了：按一下 ▼减速');else if(k<54&&!R.acc&&!blocked)tip('车速在下降：按住 ▲加速，回到 60');else if(tip.c&&(k>=57&&k<=63||R.acc||R.dec))tip('')}
// ================= 渲染循环 =================
let last=0,fovH=FOVD;
function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0),HY=headS(R,dt);last=ts;step(dt);
 const bl=Math.sin(ts/1000*9.4)>0;
 R.cars.forEach(m=>{if(m.gone)return;const p=posOf(m);place(m.c,p[0],p[1],p[2]);m.c.visible=Math.abs(p[0])<420&&Math.abs(p[1])<420;m.bk.forEach(x=>x.visible=!!m.bOn)});
 pedSigTick(ts);
 const q=myPath(R.u);place(mine,q[0],q[1],q[2]);
 if(view===1){const h=q[2]+HY.y+yawD,L=R.mirT>=0||R.scT>=0?14:10;cam.fov=Math.min(105,2*Math.atan(Math.tan(fovH*Math.PI/360)/cam.aspect)*180/Math.PI);cam.updateProjectionMatrix();const ox=.38*Math.cos(q[2]),oz=.38*Math.sin(q[2]),bx0=-q[0]+Math.sin(q[2])*.2,bz0=q[1]-Math.cos(q[2])*.2;const sk=R.crash&&R.t-R.crash.t<.7?(1-(R.t-R.crash.t)/.7)*.12:0;cam.position.set(bx0+ox+(Math.random()-.5)*sk,1.25+(Math.random()-.5)*sk,bz0+oz+(Math.random()-.5)*sk);
  cam.lookAt(-q[0]-Math.sin(h)*L+ox,1.25+L*BASEP+HY.p*L,q[1]+Math.cos(h)*L+oz);
  cockpit.visible=true;cockpit.position.set(bx0,1.25,bz0);cockpit.rotation.y=-q[2];wheel.rotation.z+=(0-wheel.rotation.z)*Math.min(1,dt*10)}
 else{cockpit.visible=false;if(cam.fov!==62){cam.fov=62;cam.updateProjectionMatrix()}cam.position.set(-q[0],64,q[1]+6);cam.lookAt(-q[0],0,q[1]+15)}
 {const k=Math.round(R.v*3.6),e=$('sp');e.textContent=k;e.style.color=R.over||k<5?'':k>64?'#ff6b5a':k<53&&!(VAR==='red'&&R.tG==null)?'#ffc21a':'#6ee787'}tipTick();if(cluster)cluster(Math.round(R.v*3.6));
 if(view===1&&((loop.fc=(loop.fc||0)+1)&1)===0){const m=MR[(loop.fc>>1)%MR.length],sa=ren.shadowMap.autoUpdate;cockpit.updateMatrixWorld(true);
  m.c.position.copy(cockpit.localToWorld(m.pos.clone()));m.c.lookAt(m.c.position.clone().add(m.dir.clone().transformDirection(cockpit.matrixWorld)));
  cockpit.visible=false;ren.shadowMap.autoUpdate=false;ren.setRenderTarget(m.rt);ren.render(scene,m.c);ren.setRenderTarget(null);ren.shadowMap.autoUpdate=sa;cockpit.visible=true}
 ren.render(scene,cam);requestAnimationFrame(loop)}
VAR=VAR0||'green';rs();newRun(false);setView(1);requestAnimationFrame(loop);
const HOME=$('ov').innerHTML;
function bindHome(){document.querySelectorAll('.md').forEach(b=>b.onclick=()=>{VAR=(window.MOCK&&VAR0)||b.dataset.v||'green';const r=document.querySelector('input[name=df]:checked');DIFF=r?r.value:'easy';$('ov').style.display='none';newRun(true);playing=true})}
bindHome();
$('hm').onclick=()=>{if(R)R.over=true;playing=false;const o=$('ov');o.innerHTML=HOME;o.style.display='flex';bindHome()};
