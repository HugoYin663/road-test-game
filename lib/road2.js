// ============================================================
// road2.js — 城市道路（同向两条车道，限速 60）：「换线」和「上高速」共用同一条路，以后路考时可以直接接起来
// ============================================================
// 路线坐标 (x,z)：x 向右为正，车往 +z 开；画到场景里是 (-x, y, z)
// 页面里先写 var ROADOPT={hwy:{...}} 就会在这条路的右边加出匝道车道，并在前方挖出高速公路的路堑（城市道路平着从上面跨过去）
const RO=(typeof ROADOPT!=='undefined'&&ROADOPT)||{},HW=RO.hwy||null;
const LX={L:1.75,R:5.25},V0=16.67,VL=18.06;
const ROAD0=-400,ROAD1=2800,RLN=ROAD1-ROAD0,RCZ=(ROAD0+ROAD1)/2;
const cub=(P,t)=>{const u=1-t;return[0,1].map(k=>u*u*u*P[0][k]+3*u*u*t*P[1][k]+3*u*t*t*P[2][k]+t*t*t*P[3][k])};
// 沿一条线（f(u)→[x,z,方向]）铺一条带子：a..b 是相对这条线往左的偏移（可以是函数），y 是高度（yf 可按位置变化）。每 80 米一块，避免大平面在手机上闪
function strip(f,u0,u1,a,b,y,mat,yf){const step=2,n=Math.max(1,Math.ceil((u1-u0)/step));let s0=0;
 while(s0<n){const s1=Math.min(n,s0+40),pos=[],idx=[];
  for(let i=s0;i<=s1;i++){const u=u0+(u1-u0)*i/n,q=f(u),lx=-Math.cos(q[2]),lz=Math.sin(q[2]),yy=y+(yf?yf(q[0],q[1]):0);
   const A=typeof a==='function'?a(u):a,B=typeof b==='function'?b(u):b;pos.push(-(q[0]+lx*A),yy,q[1]+lz*A,-(q[0]+lx*B),yy,q[1]+lz*B)}
  for(let i=0;i<s1-s0;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  if(mat.side!==T.DoubleSide){mat.side=T.DoubleSide;mat.needsUpdate=true}      // 两面都画：不然有的带子（车道线）朝下，从上面看不见
  const m=new T.Mesh(g,mat);m.receiveShadow=true;scene.add(m);s0=s1}}
function dashes(f,u0,u1,off,w,y,mat,on,gap,yf){for(let u=u0;u<u1;u+=on+gap)strip(f,u,Math.min(u1,u+on),off-w/2,off+w/2,y,mat,yf)}
const line=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0),h=Math.atan2(x1-x0,z1-z0),f=u=>[x0+(x1-x0)*u/L,z0+(z1-z0)*u/L,h];f.len=L;return f};
const NBL=line(0,-1000,0,3000),nb=z=>z+1000;      // 沿城市道路往北的线（偏移为负＝往右）
// ---------- 道路和路边 ----------
// 路面分成 99 米一段：整条几公里长的大平面在手机上会因为精度不够出现“整条路闪烁”，分段后每块都不大
const R2M={g:M(0xffffff,{map:noise('#7fae5a',60,6)}),a:M(0xffffff,{map:noise('#6c6c75',80,8)}),c:M(0xb9bbc0),w:M(0x9b9da3),l:M(WH),y:M(0xf2c12e),aD:M(0x6c6c75,{side:T.DoubleSide}),lD:BM(WH),cD:M(0xb9bbc0,{side:T.DoubleSide}),wD:M(0x9b9da3,{side:T.DoubleSide}),gD:M(0x7fae5a,{side:T.DoubleSide}),con:M(0xb5b7bb)};
const ov=(z0,z1,a,b)=>z1>a&&z0<b;
// 城市道路的高度：上高速的场景里，过了匝道以后城市道路慢慢升高（约 4% 的坡），从高速上方跨过去，再慢慢下来；其他地方都是平的
const Yart=z=>!HW?0:HW.AH*(ss(HW.A0,HW.R0,z)-ss(HW.R1,HW.A1,z));
{const SEG=99,gM=R2M.g,aM=R2M.a,cM=R2M.c,wM=R2M.w,lM=R2M.l,yM=R2M.y;
 const dT=cv(4,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#f6f6f6';x.fillRect(0,0,w,Math.round(h*3/9))});dT.wrapT=T.RepeatWrapping;dT.repeat.set(1,SEG/9);const dM=new T.MeshBasicMaterial({map:dT,transparent:true});
 for(let z0=ROAD0;z0<ROAD1;z0+=SEG){const zc=z0+SEG/2,el=HW&&ov(z0,z0+SEG,HW.A0,HW.A1),rs=HW&&ov(z0,z0+SEG,HW.L0,HW.S0);
  [-1,1].forEach(s=>box(140,.1,SEG,gM,s*(10.7+70),-.06,zc));      // 两边草地
  if(el)continue;      // 升高的那一段另外画（带坡）
  box(14.4,.1,SEG,aM,0,0,zc);      // 路面（顶 .05）
  [-1,1].forEach(s=>{if(s>0&&rs)return;box(.3,.18,SEG,cM,s*7.35,.09,zc);box(3.2,.12,SEG,wM,s*9.1,.06,zc);box(.15,.03,SEG,lM,s*6.9,.07,zc);box(.12,.03,SEG,yM,s*.13,.07,zc)});      // 路缘、人行道、路边白线、中间双黄线
  if(rs)box(.12,.03,SEG,yM,.13,.07,zc);
  [-3.5,3.5].forEach(x0=>{const p=mesh(new T.PlaneGeometry(.15,SEG),dM,-x0,.075,zc);p.rotation.x=-Math.PI/2;scene.add(p)})}}      // 车道虚线（3 米线、6 米空）
// ---------- 上高速：右边多出来的匝道车道、高速路堑 ----------
// HW：L0 匝道车道开始（先 30 米渐宽），ZD 匝道分出去的地方，S0 这一段结束，T0/T1 路堑（坡顶）范围，xr(z) 匝道车道右边缘
if(HW){const xr=z=>7.2+3.3*ss(HW.L0,HW.L0+30,z),o=u=>-xr(u-1000);
 strip(NBL,nb(HW.L0),nb(HW.ZD),u=>-7.15,o,.055,R2M.aD);      // 匝道车道路面
 strip(NBL,nb(HW.L0),nb(HW.ZD),u=>o(u)+.15,o,.07,R2M.lD);      // 匝道车道右边白线
 strip(NBL,nb(HW.L0),nb(HW.ZD),o,u=>o(u)-.3,.17,R2M.cD);strip(NBL,nb(HW.L0),nb(HW.ZD),u=>o(u)-.3,u=>o(u)-.3-3.2*(1-ss(HW.ZD-25,HW.ZD,u-1000)),.12,R2M.wD);      // 人行道在分岔口前 25 米慢慢收窄、结束      // 路缘、人行道
 dashes(NBL,nb(HW.L0),nb(HW.ZD),-7.02,.2,.072,R2M.lD,3,6);      // 右车道和匝道车道之间：先虚线，快到分岔口是实线
 strip(NBL,nb(HW.ZD),nb(HW.S0),-6.92,-7.07,.07,R2M.lD);      /* 虚线到分岔口变成两条线：城市道路右边白线直走，匝道左边黄线分出去 */[[-7.2,-7.5,.17,R2M.cD]].forEach(a=>strip(NBL,nb(HW.ZD),nb(HW.S0),a[0],a[1],a[2],a[3]));      // 分岔以后城市道路的右边线、路缘
 if(HW.gore)strip(NBL,nb(HW.ZD),nb(HW.S0),-7.5,u=>-Math.min(10.7,Math.max(7.6,HW.gore(u-1000)-.3)),.11,R2M.wD);      // 城市道路和匝道之间的三角地
 // 城市道路升高的那一段：路面、标线、路缘、人行道都跟着坡走；两边是挡土墙；跨高速的地方是桥（桥面板、护栏、桥台、中间桥墩）
 {const A0=nb(HW.A0),A1=nb(HW.A1),YF=(x,z)=>Yart(z);
  strip(NBL,A0,A1,-7.2,7.2,.05,R2M.aD,YF);strip(NBL,A0,A1,.05,.2,.075,R2M.y,YF);strip(NBL,A0,A1,-.2,-.05,.075,R2M.y,YF);
  [-1,1].forEach(s=>{strip(NBL,A0,A1,s*6.85,s*7.0,.075,R2M.lD,YF);strip(NBL,A0,A1,s*7.2,s*7.5,.18,R2M.cD,YF);strip(NBL,A0,A1,s*7.5,s*10.7,.12,R2M.wD,YF);dashes(NBL,A0,A1,s*3.5,.15,.08,R2M.lD,3,6,YF)});
  const wall=(x,z0,z1)=>{const pos=[],idx=[];let k=0;for(let z=z0;z<=z1+.01;z+=4){const y=Yart(z);pos.push(-x,-.1,z,-x,y+.12,z);if(z>z0){idx.push(k-2,k-1,k,k-1,k+1,k)}k+=2}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,new T.MeshLambertMaterial({color:0xb5b7bb,side:T.DoubleSide}));scene.add(m)};
  const B0=HW.F0-8,B1=HW.F1+8;[-10.75,10.75].forEach(x=>{wall(x,HW.A0,B0);wall(x,B1,HW.A1)});      // 挡土墙（桥下面空出来让高速通过）
  {const b=new T.Mesh(new T.BoxGeometry(21.6,1,B1-B0),R2M.con);b.position.set(0,HW.AH-.55,(B0+B1)/2);scene.add(b)}
  [-10.85,10.85].forEach(x=>{const p=new T.Mesh(new T.BoxGeometry(.3,.9,B1-B0),R2M.con);p.position.set(-x,HW.AH+.45,(B0+B1)/2);scene.add(p)});
  [B0,B1].forEach(z=>{const a=new T.Mesh(new T.BoxGeometry(21.6,HW.AH,1.4),R2M.con);a.position.set(0,HW.AH/2,z);scene.add(a)});
  {const p=new T.Mesh(new T.BoxGeometry(12,HW.AH-1,1),R2M.con);p.position.set(0,(HW.AH-1)/2,HW.PM);scene.add(p)}}
 // 城市道路两边 150 米以外，高速附近也铺上草地
 [[-600,-150.7],[150.7,1600]].forEach(a=>{for(let x=a[0];x<a[1];x+=100){const w=Math.min(100,a[1]-x);const m=new T.Mesh(new T.BoxGeometry(w,.1,800),R2M.g);m.position.set(-(x+w/2),-.06,HW.ZA);m.receiveShadow=true;scene.add(m)}})}
const TREES=[];      // 右边的树：广告牌前面一段要清空，不然挡住看不见
// 树、路灯（让你感觉到车速）
{const tr=M(0x6b4a2e),lf=[M(0x3f8a3a),M(0x4f9a44),M(0x357a33)],pl=M(0x8a9099);
 const skip=(s,z)=>HW&&((s>0&&z>HW.L0-20&&z<HW.ZA+40)||(z>HW.ZA-14&&z<HW.ZA+36));
 for(let z=ROAD0;z<ROAD1;z+=22)[-1,1].forEach(s=>{const zz=z+Math.random()*10,x=s>0?22+Math.random()*8:-(13+Math.random()*6);if(skip(s,zz))return;const g=new T.Group();      /* 右边的树种得靠后一些，不挡广告牌 */
  g.add(mesh(new T.CylinderGeometry(.18,.25,2.2,6),tr,0,1.1,0));const c=mesh(new T.SphereGeometry(1.6+Math.random()*.8,8,6),lf[Math.random()*3|0],0,3.2,0);c.castShadow=true;g.add(c);
  g.position.set(-x,0,zz);scene.add(g);TREES.push({s,g})});
 for(let z=ROAD0;z<ROAD1;z+=55)[-1,1].forEach(s=>{if(HW&&((s>0&&z>HW.L0-10&&z<HW.S0+10)||(z>HW.A0-5&&z<HW.A1+5)))return;const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.08,.11,8,6),pl,0,4,0));
  const a=mesh(new T.BoxGeometry(1.8,.1,.12),pl,s*.9,7.9,0);g.add(a);g.add(mesh(new T.BoxGeometry(.5,.12,.25),BM(0xf4f1dc),s*1.7,7.82,0));g.position.set(-s*8.3,0,z);scene.add(g)})}
// 限速牌 MAXIMUM 60
{const t=cv(240,300,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#111';x.lineWidth=8;x.strokeRect(12,12,w-24,h-24);x.fillStyle='#111';x.textAlign='center';
  x.font='bold 46px Arial';x.fillText('MAXIMUM',w/2,80);x.font='bold 170px Arial';x.fillText('60',w/2,255)});
 [40,640,1240].forEach(z=>{if(HW&&z>HW.A0-5&&z<HW.A1+5)return;const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.05,.05,2.9,8),M(0x8a9099),0,1.45,0));const f=mesh(new T.PlaneGeometry(.75,.94),new T.MeshBasicMaterial({map:t}),0,2.35,-.05);f.rotation.y=Math.PI;g.add(f);g.position.set(-8.2,0,z);scene.add(g)})}
scene.add(sun.target);
// ---------- 路边广告牌（G1+）：刚开始还没发指令时、两次换线都做完以后，各从旁边经过一块 ----------
const BBT=(()=>{const W=1280,H=640,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),t=new T.CanvasTexture(c);
 const rr=(a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
 const draw=logo=>{x.fillStyle='#fff';x.fillRect(0,0,W,H);
  // 右下角的蓝绿色弧带
  x.save();x.beginPath();x.moveTo(560,H);x.quadraticCurveTo(900,560,W,330);x.lineTo(W,H);x.closePath();x.fillStyle='#7ccf2a';x.fill();
  x.beginPath();x.moveTo(640,H);x.quadraticCurveTo(960,585,W,380);x.lineTo(W,H);x.closePath();const g=x.createLinearGradient(640,H,W,380);g.addColorStop(0,'#1f6fe0');g.addColorStop(1,'#0b3fae');x.fillStyle=g;x.fill();x.restore();
  // logo
  if(logo)x.drawImage(logo,46,70,260,260);else{rr(46,70,260,260,46);x.fillStyle='#1d8cf0';x.fill();x.fillStyle='#c6f23a';x.font='bold 120px Arial';x.fillText('G1+',70,240)}
  // 标题
  x.fillStyle='#10285a';x.font='900 92px Arial,Helvetica,sans-serif';x.fillText('Pass Your',340,150);x.fillText('G1 Test',340,245);
  x.fillStyle='#1673e6';x.font='bold 58px Arial,Helvetica,sans-serif';x.fillText('with Confidence',340,312);
  x.fillStyle='#1b2b45';x.font='600 36px Arial,Helvetica,sans-serif';x.fillText('Study · Practice · Succeed',340,368);
  // 三个小图标
  [['Real','Questions',0],['Mock','Tests',1],['Track','Progress',2]].forEach((a,i)=>{const cx=110+i*190,cy=470;x.fillStyle='#eaf2fd';x.beginPath();x.arc(cx,cy,48,0,7);x.fill();x.strokeStyle=x.fillStyle='#1665d8';x.lineWidth=6;
   if(i===0){x.strokeRect(cx-26,cy-20,24,40);x.strokeRect(cx+2,cy-20,24,40)}
   else if(i===1){x.strokeRect(cx-20,cy-24,40,50);x.beginPath();x.moveTo(cx-10,cy+2);x.lineTo(cx-2,cy+12);x.lineTo(cx+14,cy-10);x.stroke()}
   else{[[-22,10,12],[-4,-6,28],[14,-22,44]].forEach(b=>x.fillRect(cx+b[0],cy+b[1]+8,12,b[2]))}
   x.fillStyle='#1b2b45';x.font='600 30px Arial,Helvetica,sans-serif';x.textAlign='center';x.fillText(a[0],cx,cy+86);x.fillText(a[1],cx,cy+120);x.textAlign='left';
   if(i<2){x.strokeStyle='#d6dde8';x.lineWidth=2;x.beginPath();x.moveTo(cx+95,cy-40);x.lineTo(cx+95,cy+120);x.stroke()}});
  // 手机
  x.save();x.translate(1010,18);x.rotate(.06);x.scale(.86,.86);rr(0,0,240,470,34);x.fillStyle='#16191f';x.fill();rr(12,12,216,446,26);x.fillStyle='#fff';x.fill();
  x.fillStyle='#1665d8';rr(12,12,216,64,26);x.fill();x.fillRect(12,50,216,26);x.fillStyle='#fff';x.font='bold 30px Arial';x.textAlign='center';x.fillText('G1+',120,58);
  x.fillStyle='#1b2b45';x.font='bold 21px Arial';x.fillText('What does this sign',120,112);x.fillText('mean?',120,138);
  x.save();x.translate(120,200);x.rotate(Math.PI/4);x.fillStyle='#f6c71b';x.fillRect(-38,-38,76,76);x.strokeStyle='#111';x.lineWidth=4;x.strokeRect(-34,-34,68,68);x.restore();
  x.strokeStyle='#111';x.lineWidth=7;x.beginPath();x.moveTo(112,228);x.lineTo(112,200);x.quadraticCurveTo(112,186,126,186);x.lineTo(132,186);x.stroke();x.fillStyle='#111';x.beginPath();x.moveTo(146,186);x.lineTo(130,174);x.lineTo(130,198);x.fill();
  x.textAlign='left';['A. Left turn only','B. Right turn ahead','C. Merge','D. No U-turn'].forEach((o,k)=>{const y=262+k*44;rr(24,y,192,36,8);x.fillStyle=k===1?'#1665d8':'#eef2f8';x.fill();x.fillStyle=k===1?'#fff':'#1b2b45';x.font='18px Arial';x.fillText(o,34,y+24)});
  x.restore();
  // 口号
  x.save();x.translate(1050,560);x.rotate(-.32);x.fillStyle='#fff';x.font='italic bold 34px Arial';x.textAlign='center';x.fillText('Your Driving Success',0,0);x.fillStyle='#f4e04a';x.fillText('Starts Here!',10,40);x.restore();
  t.needsUpdate=true};
 draw(null);if(typeof Image!=='undefined'){const im=new Image();im.onload=()=>draw(im);im.src='assets/g1plus.png'}return t})();
function billboard(){const g=new T.Group(),pm=M(0x3a3f47);
 g.add(mesh(new T.BoxGeometry(.5,3.2,.5),pm,0,1.6,0));g.add(mesh(new T.BoxGeometry(7.0,3.6,.35),pm,0,4.9,.12));      // 立柱、外框
 const f=mesh(new T.PlaneGeometry(6.6,3.3),new T.MeshBasicMaterial({map:BBT}),0,4.9,-.06);f.rotation.y=Math.PI;g.add(f);      // 画面朝向开过来的车
 g.children.forEach(m=>m.castShadow=true);scene.add(g);return g}
const BB1=billboard(),BB2=billboard();
// 放在右边人行道外的草地上，稍微斜向马路，开过来的车能看清
function putBB(b,z,fade){TREES.forEach(t=>{if(t.s>0&&t.g.position.z>z-90&&t.g.position.z<z+8)t.g.visible=false});      /* 广告牌前方 90 米内（和它旁边）不种树 */
 b.position.set(-15,0,z);b.rotation.y=-.42;b.visible=true;b.fadeT=fade?R.t:null;b.children.forEach(m=>{m.material.transparent=!!fade;m.material.opacity=fade?0:1})}      // fade：远处慢慢显出来，不要突然冒出来
function fadeBB(b){if(b.fadeT==null)return;const o=Math.min(1,(R.t-b.fadeT)/1.5);b.children.forEach(m=>m.material.opacity=o);if(o>=1){b.fadeT=null;b.children.forEach(m=>m.material.transparent=false)}}
sun.shadow.bias=-.0006;
// 太阳（阴影）跟着你走：在“阳光方向”的坐标里按阴影贴图的格子对齐，阴影贴图每一格都落在同样的地面位置，路面阴影就不会闪
const SUNO=new T.Vector3(60,90,-60),SUNF=SUNO.clone().negate().normalize(),SUNR=new T.Vector3().crossVectors(SUNF,new T.Vector3(0,1,0)).normalize(),SUNU=new T.Vector3().crossVectors(SUNR,SUNF),SUNTS=150/1024;
function sunFollow(z,wx){const c=new T.Vector3(wx||0,0,z),a=Math.round(c.dot(SUNR)/SUNTS)*SUNTS,b=Math.round(c.dot(SUNU)/SUNTS)*SUNTS,f=c.dot(SUNF);
 const p=SUNR.clone().multiplyScalar(a).add(SUNU.clone().multiplyScalar(b)).add(SUNF.clone().multiplyScalar(f));sun.target.position.copy(p);sun.position.copy(p).add(SUNO)}
