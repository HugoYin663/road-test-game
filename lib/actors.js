// ============================================================
// actors.js — 汽车、行人、自行车、路径、警车、声音（所有项目共用）
// ============================================================
// 流线型车身（侧面轮廓挤出）＋玻璃顶＋侧窗＋灯带
const glassM=new T.MeshPhongMaterial({color:0x0d141c,shininess:160,specular:0xe8f4ff,transparent:true,opacity:.92,side:T.DoubleSide});
function ex(sh,w,b){const g=new T.ExtrudeGeometry(sh,{depth:w,bevelEnabled:b>0,bevelThickness:b,bevelSize:b*.5,bevelSegments:3,curveSegments:10});g.rotateY(-Math.PI/2);g.translate(w/2,0,0);return g}
const bodyS=new T.Shape();bodyS.moveTo(-2.1,.32);bodyS.lineTo(2,.32);bodyS.quadraticCurveTo(2.3,.34,2.3,.6);bodyS.quadraticCurveTo(2.28,.8,1.8,.88);
bodyS.quadraticCurveTo(1.3,.95,.9,1.1);bodyS.quadraticCurveTo(.5,1.42,.1,1.45);bodyS.quadraticCurveTo(-.7,1.46,-1.3,1.12);
bodyS.quadraticCurveTo(-1.8,.98,-2.15,.95);bodyS.quadraticCurveTo(-2.35,.9,-2.32,.6);bodyS.quadraticCurveTo(-2.3,.36,-2.1,.32);
const bez=(a,b,c,n,t0)=>Array.from({length:n+1},(_,i)=>{const t=t0+(1-t0)*i/n,u=1-t;return[u*u*a[0]+2*u*t*b[0]+t*t*c[0],u*u*a[1]+2*u*t*b[1]+t*t*c[1]]});
function ribbon(pts,w,off){const pos=[],idx=[],n=pts.length;
 pts.forEach((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)],dz=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dz,dy),z=p[0]+dy/l*off,y=p[1]-dz/l*off;pos.push(-w/2,y,z,w/2,y,z)});
 for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g}
function gShape(p,y0){const s=new T.Shape();s.moveTo(p[0][0],p[0][1]);p.slice(1).forEach(q=>s.lineTo(q[0],q[1]));s.lineTo(p[p.length-1][0],y0);s.lineTo(p[0][0],y0);return s}
const winS=new T.Shape();winS.moveTo(.85,1.12);winS.quadraticCurveTo(.5,1.37,.1,1.4);winS.quadraticCurveTo(-.7,1.41,-1.2,1.15);winS.lineTo(.85,1.12);
const bodyG=ex(bodyS,1.7,.12),wsG=ribbon(bez([.9,1.1],[.5,1.42],[.1,1.45],14,0),1.56,.09),rwG=ribbon(bez([.1,1.45],[-.7,1.46],[-1.3,1.12],14,.5),1.5,.09),winG=new T.ShapeGeometry(winS,12);winG.rotateY(-Math.PI/2);

function car(col){const g=new T.Group();
 const b=new T.Mesh(bodyG,new T.MeshPhongMaterial({color:col,shininess:70,specular:0x555555}));b.castShadow=true;g.add(b);
 g.add(mesh(wsG,glassM,0,0,0),mesh(rwG,glassM,0,0,0));
 [-1,1].forEach(sx=>{g.add(mesh(winG,glassM,sx*.99,0,0));
  const pm=new T.MeshPhongMaterial({color:col,shininess:70});g.add(mesh(new T.BoxGeometry(.18,.13,.11),pm,sx*1.0,1.03,.9),mesh(new T.BoxGeometry(.15,.09,.03),glassM,sx*1.0,1.03,.84),mesh(new T.BoxGeometry(.1,.05,.1),pm,sx*.94,.98,.92));      // 后视镜：外沿约 ±1.09 米（含后视镜总宽约 2.2 米）
  [[1.4],[-1.4]].forEach(zw=>{const w=mesh(new T.CylinderGeometry(.36,.36,.24,16),M(0x15171b),sx*.8,.36,zw[0]);w.rotation.z=Math.PI/2;g.add(w);      // 轮胎在车身里面（轮距约 1.6 米），不再伸出车身
   const h=mesh(new T.CylinderGeometry(.2,.2,.04,12),M(0xc9ced6),sx*.93,.36,zw[0]);h.rotation.z=Math.PI/2;g.add(h)})});
 g.add(mesh(new T.BoxGeometry(1.7,.14,4.3),M(0x15171b),0,.3,0));
 g.add(mesh(new T.BoxGeometry(1.3,.07,.05),BM(0xfff7b0),0,.72,2.33));
 g.add(mesh(new T.BoxGeometry(1.45,.07,.05),BM(0xff3030),0,.86,-2.36));
 const bl=[];[[.88,2.2],[.88,-2.2]].forEach(a=>{const m=mesh(new T.BoxGeometry(.5,.3,.14),new T.MeshBasicMaterial({color:0xff8a00}),a[0],.74,a[1]);m.visible=false;g.add(m);bl.push(m);
  const h=mesh(new T.BoxGeometry(1.1,.7,.08),new T.MeshBasicMaterial({color:0xffc040,transparent:true,opacity:.85}),a[0],.74,a[1]+(a[1]>0?.1:-.1));h.visible=false;g.add(h);bl.push(h)});
 g.userData.bl=bl;
 scene.add(g);return g}
function ped(col){const g=new T.Group(),R=a=>a[Math.random()*a.length|0],sk=R([0xf1c9a0,0xe0b088,0xc58a5e,0x8d5a3b,0x6b4429]),hc=R([0x1b1b1f,0x3a2a1c,0x7a4a24,0xd8b04a,0x8a8a8a]),pc=R([0x2b3a55,0x3a3f48,0x5a4a38,0x1f2328,0x4a5a6e]),sh=R([0x15171b,0xf2f2f2,0x6b3a1e]);
 const limb=(x,y,r,l,c,hand)=>{const p=new T.Group();p.position.set(x,y,0);p.add(mesh(new T.CylinderGeometry(r,r*.85,l,8),M(c),0,-l/2,0));
  if(hand)p.add(mesh(new T.SphereGeometry(r*.95,8,6),M(sk),0,-l-.02,0));      // 手
  else p.add(mesh(new T.BoxGeometry(.13,.08,.27),M(sh),0,-l-.02,.05));        // 鞋：鞋头朝前
  g.add(p);return p};
 g.userData={l:limb(-.11,.8,.09,.8,pc),r:limb(.11,.8,.09,.8,pc),al:limb(-.3,1.42,.07,.62,col,1),ar:limb(.3,1.42,.07,.62,col,1)};
 g.add(mesh(new T.CylinderGeometry(.23,.2,.66,10),M(col),0,1.12,0),mesh(new T.SphereGeometry(.17,12,10),M(sk),0,1.6,0));
 // 脸：眼睛和鼻子在前（+Z），后脑是头发
 [-.06,.06].forEach(x=>g.add(mesh(new T.SphereGeometry(.02,6,5),M(0x15171b),x,1.62,.155)));
 g.add(mesh(new T.BoxGeometry(.03,.04,.04),M(sk),0,1.58,.17));
 g.add(mesh(new T.SphereGeometry(.18,12,8,0,6.3,0,1.2),M(hc),0,1.625,-.01));
 g.add(mesh(new T.SphereGeometry(.18,12,8,Math.PI,Math.PI,0,2.05),M(hc),0,1.62,-.01));
 // 衣服前后：前胸一道拉链线，后背一个书包或斜挎包（约一半的人）
 g.add(mesh(new T.BoxGeometry(.025,.5,.01),M(0xe8e8e8),0,1.12,.215));
 const bg=Math.random();
 if(bg<.5){g.add(mesh(new T.BoxGeometry(.36,.42,.16),M(R([0xc0392b,0x2c3e50,0x27ae60,0xe67e22])),0,1.2,-.27));[-.14,.14].forEach(x=>g.add(mesh(new T.BoxGeometry(.04,.4,.03),M(0x15171b),x,1.18,-.19)))}
 else if(bg<.7)g.add(mesh(new T.BoxGeometry(.22,.18,.1),M(0x5a3a22),.27,.85,.05));
 // 帽子（约三成）：帽檐朝前，一眼看出朝向
 if(Math.random()<.3){const hat=R([0xc0392b,0x2c3e50,0x15171b,0xe8e8e8]);g.add(mesh(new T.SphereGeometry(.19,12,8,0,6.3,0,1.35),M(hat),0,1.64,-.005),mesh(new T.BoxGeometry(.22,.02,.13),M(hat),0,1.63,.2))}
 g.traverse(o=>o.castShadow=true);scene.add(g);return g}
function bar(a,b,r,c){const d=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),m=mesh(new T.CylinderGeometry(r,r,d.length(),6),M(c),(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m}
function cyclist(col){const g=new T.Group(),r=ped(col);scene.remove(r);r.position.set(0,.2,-.3);r.rotation.x=.3;g.add(r);
 const wh=[];[-.55,.55].forEach(z=>{const w=new T.Group();w.position.set(0,.38,z);const t=mesh(new T.TorusGeometry(.36,.045,8,20),M(0x15171b),0,0,0);t.rotation.y=Math.PI/2;w.add(t);
  [0,Math.PI/2].forEach(a=>{const s=mesh(new T.BoxGeometry(.02,.7,.02),M(0x9aa0aa),0,0,0);s.rotation.x=a;w.add(s)});g.add(w);wh.push(w)});
 [[[0,.38,-.55],[0,.9,-.25]],[[0,.9,-.25],[0,.38,0]],[[0,.38,0],[0,.38,-.55]],[[0,.9,-.25],[0,.88,.38]],[[0,.38,0],[0,.88,.38]],[[0,.88,.38],[0,.38,.55]]].forEach(a=>g.add(bar(a[0],a[1],.03,0xe74c3c)));
 const hb=mesh(new T.CylinderGeometry(.025,.025,.5,6),M(0x15171b),0,.95,.4);hb.rotation.z=Math.PI/2;g.add(hb);
 g.add(mesh(new T.BoxGeometry(.14,.04,.26),M(0x15171b),0,.94,-.3));
 r.userData.al.rotation.x=-1;r.userData.ar.rotation.x=-1;g.userData=Object.assign({},r.userData,{wh});g.traverse(o=>o.castShadow=true);scene.add(g);return g}
function path(p){const L=[0];for(let i=1;i<p.length;i++)L[i]=L[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);const n=L[L.length-1];
 const pos=u=>{u=((u%n)+n)%n;let i=1;while(L[i]<u)i++;const a=p[i-1],b=p[i],t=(u-L[i-1])/(L[i]-L[i-1]||1);return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,Math.atan2(b[0]-a[0],b[1]-a[1])]};
 return u=>{const c=pos(u);if(n<10)return c;const w=((u%n)+n)%n,a=pos(Math.max(0,w-.8)),b=pos(Math.min(n-1e-6,w+.8));return[c[0],c[1],Math.atan2(b[0]-a[0],b[1]-a[1])]}}
const arc=(f,n)=>Array.from({length:n+1},(_,i)=>f(i/n));
// ===== 第 6 关：警车（从左边横向道路直行通过路口，鸣警笛）=====
const PPOL=path([[-140,-6.25],[170,-6.25]]);   // 从左边马路的右侧车道（靠你这边）直行过来，这条车道上没有等红灯的车
const POLT=cv(512,96,(x,w,h)=>{x.fillStyle='#ffd21a';x.fillRect(0,6,w,7);x.fillRect(0,h-13,w,7);x.font='italic 900 62px Arial,Helvetica,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('POLICE',w/2,h/2+2)});
// 警车：kind 'L' 从左边横向直行（开局就鸣笛）；'Lw' 同上但在你等待时才出现；'O' 对面驶来、鸣笛左转进你要转入的路
const POPP=path([[-2.75,120],[-2.75,5],...Array.from({length:24},(_,i)=>{const f=(i+1)/24*Math.PI/2;return[-2.75+9*(1-Math.cos(f)),5-7.75*Math.sin(f)]}),[170,-2.75]]);
function makePolice(kind){const c=car(0x101114);live.push(c);const L=polDeco(c),k=kind||'L',c2=car(0x101114);live.push(c2);const L2=polDeco(c2);   // 两辆警车一前一后，相隔约 16 米
 const u0=k==='L'?125-16*(6.6+(Math.random()-.5)*1.2):k==='Lw'?125-16*4.8:56;
 return{car:c,rd:L.rd,bu:L.bu,tail:{car:c2,rd:L2.rd,bu:L2.bu},gap:16,t0:typeof R!=='undefined'&&R?R.t:0,u:u0,v:k==='O'?13:16,vmax:k==='O'?13:16,pp:k==='O'?POPP:PPOL,passX:k==='O'?10:2,kind:k,chase:false}}
function polDeco(c){const bar=mesh(new T.BoxGeometry(1.2,.12,.32),M(0x22252b),0,1.52,-.2);c.add(bar);
 const rd=mesh(new T.BoxGeometry(.5,.16,.3),BM(0xff2020),.32,1.62,-.2),bu=mesh(new T.BoxGeometry(.5,.16,.3),BM(0x2060ff),-.32,1.62,-.2);c.add(rd,bu);
  [1,-1].forEach(sx=>{const t=mesh(new T.PlaneGeometry(3.2,.6),new T.MeshBasicMaterial({map:POLT,transparent:true,side:T.DoubleSide}),sx*1.0,.66,-.1);t.rotation.y=sx*Math.PI/2;c.add(t)});   // 车身两侧黄色斜体 POLICE
 {const t=mesh(new T.PlaneGeometry(1.3,.25),new T.MeshBasicMaterial({map:POLT,transparent:true}),0,.98,-2.37);t.rotation.y=Math.PI;c.add(t)}                     // 车尾
 return{rd,bu}}
let CRU=null;      // 普通巡逻警车（不闪灯、不鸣笛），常在对面车流里出现
let SIR=null;
function sirenOn(){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';f.type='lowpass';f.frequency.value=1800;g.gain.value=0;o.connect(f);f.connect(g);g.connect(AC.destination);o.start();SIR={o,g}}catch(e){}}
function sirenOff(){if(SIR){try{SIR.o.stop()}catch(e){}SIR=null}}
const polPassed=P=>P.pp(P.u-P.gap)[0]>myPath(R.u)[0]+4;     // 后面那辆警车的车头也开到你前面 4 米以外，才算都过去了
const polHold=()=>R.pol&&!polPassed(R.pol);
// 两辆车的车身（有朝向的长方形）是否重叠：b=[x,z,朝向,半长,半宽]
function obbHit(a,b){const A=[[Math.sin(a[2]),Math.cos(a[2])],[Math.cos(a[2]),-Math.sin(a[2])]],B=[[Math.sin(b[2]),Math.cos(b[2])],[Math.cos(b[2]),-Math.sin(b[2])]],dx=b[0]-a[0],dz=b[1]-a[1];
 for(const n of [...A,...B]){const r=(X,h,w)=>h*Math.abs(n[0]*X[0][0]+n[1]*X[0][1])+w*Math.abs(n[0]*X[1][0]+n[1]*X[1][1]);if(Math.abs(dx*n[0]+dz*n[1])>r(A,a[3],a[4])+r(B,b[3],b[4]))return false}return true}
// 碰撞的声音
function crashSnd(){try{const a=new(window.AudioContext||window.webkitAudioContext)(),n=a.sampleRate*.7|0,bf=a.createBuffer(1,n,a.sampleRate),d=bf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.5)*(i<n*.05?1:.6);
 const s=a.createBufferSource(),g=a.createGain(),f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=1800;g.gain.value=.7;s.buffer=bf;s.connect(f);f.connect(g);g.connect(a.destination);s.start()}catch(e){}}
function honk(){try{const a=new(window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),n=a.createGain();o.type='square';o.frequency.value=420;n.gain.value=.08;o.connect(n);n.connect(a.destination);o.start();o.stop(a.currentTime+.5)}catch(e){}}
let AC=null,NB=null;
function tick(on){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const a=AC,t=a.currentTime;
  if(!NB){NB=a.createBuffer(1,2205,44100);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/160)}
  const s=a.createBufferSource(),f=a.createBiquadFilter(),n=a.createGain();s.buffer=NB;f.type='bandpass';f.frequency.value=on?2300:1700;f.Q.value=2.2;n.gain.value=on?1.6:1.2;s.connect(f);f.connect(n);n.connect(a.destination);s.start(t);
  const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=on?520:420;g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.02);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.03)}catch(e){}}
