// ============================================================
// highway-on.js — 项目：上高速（城市道路换到右车道 → 匝道（建议 50）→ 加速车道提速 → 找空档并入高速）
// ============================================================
// 路线坐标 (x,z)：x 向右（东）为正，z 向北为正；画到场景里是 (-x, y, z)（和其他项目一样）
// 城市道路往北：左车道 x=1.75、右车道 x=5.25，限速 60；z=-150 处右车道分出匝道，右转 90° 后往东接加速车道（z=-35）
// 高速（401）东西向：往东的两条车道 z=-31.25（右道）、-27.5（左道），中间隔离墙 z≈-23，往西的两条 z=-18.5、-14.75
const V0=16.67,VR=13.9,VF=27.8;      // 60、50、100 km/h
const ZDIV=-150,ZA=-35,ZF1=-31.25,ZF2=-27.5,ZW1=-18.5,ZW2=-14.75,XSOL=124.5,XEND=364.5,XTAP=424.5;      // 匝道分出处、加速车道中心、高速车道；加速车道实线到 XSOL，虚线到 XEND，然后收窄
const RX=12,RR=55,XC=RX+RR,ZC=-90;      // 匝道离开城市道路后在 x=12 往北，再右转：半径 55 米，圆心 (67,-90)
const cub=(P,t)=>{const u=1-t;return[0,1].map(k=>u*u*u*P[0][k]+3*u*u*t*P[1][k]+3*u*t*t*P[2][k]+t*t*t*P[3][k])};
// 你的路线 P：城市道路右边多出来的匝道车道（x=8.75）→ 分出匝道 → 弯道 → 加速车道 → 高速右道旁边一直往东
// （你从右车道 x=5.25 出发，也就是 P 往左偏 3.5 米；到了匝道车道，系统自动换进去）
const PP=[[8.75,-700],[8.75,ZDIV],...Array.from({length:60},(_,i)=>cub([[8.75,ZDIV],[8.75,-132],[RX,-122],[RX,-100]],(i+1)/60)),[RX,ZC],
 ...Array.from({length:180},(_,i)=>{const f=(i+1)/180*Math.PI/2;return[XC-RR*Math.cos(f),ZC+RR*Math.sin(f)]}),[1800,ZA]];
const P0=path(PP),P=u=>{const a=P0(u),b=P0(Math.max(0,u-1.5)),c=P0(Math.min(P0.len-.01,u+1.5));return[a[0],a[1],Math.atan2(c[0]-b[0],c[1]-b[1])]};P.len=P0.len;      // 车头方向用前后 1.5 米的平均：转弯时方向盘平稳，不会一顿一顿地晃
const uAtZ=z=>{for(let u=0;u<P.len;u+=.1)if(P(u)[1]>=z)return u;return P.len},uAtX=x=>{for(let u=0;u<P.len;u+=.1){const q=P(u);if(q[1]>ZA-.5&&q[0]>=x)return u}return P.len};
const UDIV=uAtZ(ZDIV),UARC0=uAtZ(ZC),UARC1=uAtX(XC+.05);
// 城市道路的高度：分岔以后直行的城市道路慢慢升高，跨过高速（立交桥）
const artY=z=>z<-110?0:z<-62?6.5*ss(-110,-62,z):z<15?6.5:6.5*(1-ss(15,70,z));
// ---------- 画路：沿一条线铺一条带子（分段，每段不超过 80 米，避免手机上大平面闪烁） ----------
function strip(f,u0,u1,a,b,y,mat,yf){const step=2,n=Math.max(1,Math.ceil((u1-u0)/step));let s0=0;
 while(s0<n){const s1=Math.min(n,s0+40),pos=[],idx=[];
  for(let i=s0;i<=s1;i++){const u=u0+(u1-u0)*i/n,q=f(u),lx=-Math.cos(q[2]),lz=Math.sin(q[2]),yy=y+(yf?yf(q[0],q[1]):0);
   const A=typeof a==='function'?a(u):a,B=typeof b==='function'?b(u):b;pos.push(-(q[0]+lx*A),yy,q[1]+lz*A,-(q[0]+lx*B),yy,q[1]+lz*B)}
  for(let i=0;i<s1-s0;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  const m=new T.Mesh(g,mat);m.receiveShadow=true;scene.add(m);s0=s1}}
function dashes(f,u0,u1,off,w,y,mat,on,gap,yf){for(let u=u0;u<u1;u+=on+gap)strip(f,u,Math.min(u1,u+on),off-w/2,off+w/2,y,mat,yf)}
const line=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0),h=Math.atan2(x1-x0,z1-z0),f=u=>[x0+(x1-x0)*u/L,z0+(z1-z0)*u/L,h];f.len=L;return f};
const ASP=M(0x6e6e76,{side:T.DoubleSide}),SHO=M(0x8d8d92,{side:T.DoubleSide}),WL=BM(WH),YL=BM(0xf2c12e),GR=M(0x7fae5a),CON=M(0xb5b7bb);
// 草地
for(let x=-300;x<1500;x+=150)for(let z=-800;z<300;z+=150)box(150,.1,150,GR,x+75,-.08,z+75);
// 城市道路（中心线 x=0：往北两条 x=1.75、5.25，往南两条），过了分岔慢慢升高，跨过高速（立交桥）
{const A=line(0,-800,0,300),AY=(x,z)=>artY(z),u=z=>z+800;strip(A,0,A.len,-7.2,7.2,.02,ASP,AY);
 strip(A,0,A.len,.05,.2,.05,YL,AY);strip(A,0,A.len,-.2,-.05,.05,YL,AY);strip(A,0,A.len,6.95,7.1,.05,WL,AY);      // 中间双黄线、左边白线
 strip(A,0,u(-282),-7.1,-6.95,.05,WL,AY);strip(A,u(-150),A.len,-7.1,-6.95,.05,WL,AY);      // 右边白线（匝道车道那一段没有）
 strip(A,u(-282),u(-150),u=>-7.2-3.5*ss(-282,-252,u-800),-7.0,.021,ASP);strip(A,u(-282),u(-150),u=>-7.2-3.5*ss(-282,-252,u-800),u=>-7.05-3.5*ss(-282,-252,u-800),.05,WL);      // 多出来的匝道车道（x=7–10.7），右边白线
 dashes(A,u(-252),u(-195),-7.0,.2,.06,WL,3,6);strip(A,u(-195),u(-150),-7.1,-6.9,.06,WL);      // 右车道和匝道车道之间：先虚线，快到分岔口是实线
 dashes(A,0,A.len,-3.5,.15,.06,WL,3,6,AY);dashes(A,0,A.len,3.5,.15,.06,WL,3,6,AY);      // 车道虚线
 [-7.45,7.45].forEach(x=>{const g=new T.Mesh(new T.BoxGeometry(.35,1,77),CON);g.position.set(-x,6.5+.5,-23.5);scene.add(g)});      // 桥两边护栏
 {const d=new T.Mesh(new T.BoxGeometry(15.2,.9,44),CON);d.position.set(0,6.5-.45,-25);scene.add(d)}      // 桥面
 [-44,-23,-6].forEach(z=>{const p=new T.Mesh(new T.BoxGeometry(13,6.1,z===-23?.9:2),CON);p.position.set(0,3.05,z);scene.add(p)})}      // 桥台、桥墩（中间的在隔离带上）
// 匝道：从分岔到弯道结束，再接加速车道；路边线
{strip(P,UDIV,UARC1,-2.25,2.25,.03,ASP);strip(P,UDIV,UARC1,2.05,2.2,.06,YL);strip(P,UDIV,UARC1,-2.2,-2.05,.06,WL)}      // 匝道：左边黄色实线、右边白色实线
// 高速（东西向）：往东两条车道 + 加速车道，往西两条车道，路肩，中间隔离墙
{const E=line(-600,0,1800,0),EL=u=>[u-600,0,Math.PI/2];EL.len=2400;
 const Z=z=>u=>{const q=EL(u);return[q[0],z,q[2]]};
 const band=(z0,z1,mat,y)=>strip(Z((z0+z1)/2),0,2400,-(z1-z0)/2,(z1-z0)/2,y,mat);
 band(-33.125,-25.625,ASP,.03);band(-25.625,-23.6,SHO,.025);band(-22.4,-20.375,SHO,.025);band(-20.375,-12.875,ASP,.03);band(-12.875,-10.4,SHO,.025);
 // 往东车道右边：加速车道段以外是路肩
 strip(Z(-35),XC+600,XEND+600,-1.875,1.875,.031,ASP);
 {const T0=XEND+600,T1=XTAP+600;strip(Z(-35),T0,T1,u=>-1.875+3.75*(u-T0)/(T1-T0),1.875,.032,SHO)}
 band(-39.5,-33.125,SHO,.02);strip(line(XEND,-36.8,XTAP,-33.2),0,Math.hypot(60,3.6),-.08,.08,.06,WL);
 // 隔离墙
 for(let x=-600;x<1800;x+=100){const w=new T.Mesh(new T.BoxGeometry(100,.85,.5),CON);w.position.set(-(x+50),.425,-23);scene.add(w)}
 // 标线：往东左边黄线、两条车道之间虚线、右边白线；加速车道和右道之间：先实线后虚线
 strip(Z(-25.7),0,2400,-.08,.08,.06,YL);dashes(Z(-29.375),0,2400,0,.2,.06,WL,3,9);
 strip(Z(-33.125),0,XC+600-60,-.08,.08,.06,WL);strip(Z(-33.125),XC+600-60,XSOL+600,-.1,.1,.06,WL);dashes(Z(-33.125),XSOL+600,XEND+600,0,.2,.06,WL,1.5,3);
 strip(Z(-33.125),XTAP+600,2400,-.08,.08,.06,WL);strip(Z(-36.8),XC+600,XEND+600,-.08,.08,.06,WL);
 strip(Z(-20.3),0,2400,-.08,.08,.06,YL);dashes(Z(-16.625),0,2400,0,.2,.06,WL,3,9);strip(Z(-12.95),0,2400,-.08,.08,.06,WL);
 // 分流三角（匝道和高速之间的白色斜线区）
 for(let k=0;k<6;k++){const x=XC-6-k*7;strip(line(x,-33.4,x+3,-36.3),0,4.2,-.25,.25,.065,WL)}}
// 树
{const tr=M(0x6b4a2e),lf=[M(0x3f8a3a),M(0x4f9a44),M(0x357a33)];const tree=(x,z)=>{const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.18,.25,2.2,6),tr,0,1.1,0));const c=mesh(new T.SphereGeometry(1.6+Math.random()*.8,8,6),lf[Math.random()*3|0],0,3.2,0);c.castShadow=true;g.add(c);g.position.set(-x,0,z);scene.add(g)};
 for(let z=-780;z<-60;z+=24){tree(-14-Math.random()*6,z);if(z<-170)tree(22+Math.random()*8,z)}
 for(let x=-560;x<1700;x+=30){if(Math.abs(x)>16){tree(x,-46-Math.random()*8);tree(x+12,-6*Math.random())}}
 for(let k=0;k<14;k++)tree(32+Math.random()*25,-135+Math.random()*70)}
// ---------- 标志牌 ----------
function post(x,z,ry,w,hh,tex,y0){const g=new T.Group(),pm=M(0x8a9099);const n=w>1.6?2:1;for(let i=0;i<n;i++)g.add(mesh(new T.CylinderGeometry(.06,.06,y0+hh,8),pm,n>1?(i?w*.3:-w*.3):0,(y0+hh)/2,.06));
 const f=mesh(new T.PlaneGeometry(w,hh),new T.MeshBasicMaterial({map:tex,transparent:true}),0,y0+hh/2,0);f.rotation.y=Math.PI;g.add(f);
 const b=mesh(new T.PlaneGeometry(w,hh),pm,0,y0+hh/2,.01);g.add(b);g.position.set(-x,0,z);g.rotation.y=ry||0;scene.add(g);return g}
// 绿色高速入口指示牌：401 皇冠盾牌 + EAST + 箭头
const GUIDE=d=>cv(512,320,(x,w,h)=>{x.fillStyle='#0f6b3a';x.fillRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=7;x.strokeRect(10,10,w-20,h-20);
 x.save();x.translate(150,150);x.fillStyle='#fff';x.strokeStyle='#111';x.lineWidth=6;x.beginPath();x.moveTo(-80,-70);x.lineTo(80,-70);x.lineTo(80,10);x.quadraticCurveTo(80,80,0,110);x.quadraticCurveTo(-80,80,-80,10);x.closePath();x.fill();x.stroke();
 x.fillStyle='#111';x.beginPath();x.moveTo(-50,-72);x.lineTo(-48,-100);x.lineTo(-26,-84);x.lineTo(0,-108);x.lineTo(26,-84);x.lineTo(48,-100);x.lineTo(50,-72);x.closePath();x.fill();
 x.font='bold 80px Arial';x.textAlign='center';x.fillText('401',0,40);x.restore();
 x.fillStyle='#fff';x.font='bold 74px Arial';x.textAlign='left';x.fillText('EAST',270,135);x.font='bold 40px Arial';x.fillText('Kingston',272,195);
 x.strokeStyle='#fff';x.lineWidth=14;x.beginPath();if(d==='r'){x.moveTo(330,290);x.lineTo(330,250);x.lineTo(420,250)}else{x.moveTo(380,295);x.lineTo(440,235)}x.stroke();x.fillStyle='#fff';x.beginPath();
 if(d==='r'){x.moveTo(450,250);x.lineTo(415,226);x.lineTo(415,274)}else{x.moveTo(462,213);x.lineTo(420,222);x.lineTo(453,255)}x.fill()});
post(9.6,-330,0,3.4,2.1,GUIDE('u'),2.2);      // 匝道车道出现之前：401 东 入口
post(12.8,-175,0,3.4,2.1,GUIDE('r'),2.2);      // 分岔处
// 黄底黑字建议速度 50 km/h（匝道入口左侧）
const ADV=cv(256,256,(x,w,h)=>{x.fillStyle='#f6c71b';x.fillRect(0,0,w,h);x.strokeStyle='#111';x.lineWidth=10;x.strokeRect(12,12,w-24,h-24);x.fillStyle='#111';x.textAlign='center';x.font='bold 130px Arial';x.fillText('50',w/2,160);x.font='bold 46px Arial';x.fillText('km/h',w/2,220)});
post(8.4,-102,.15,.8,.8,ADV,1.6);      // 在城市道路和匝道之间（匝道左侧）
// 加速车道牌：黄色菱形（车道并入）＋“300 m”
const MRG=cv(256,360,(x,w,h)=>{x.clearRect(0,0,w,h);x.save();x.translate(128,124);x.rotate(Math.PI/4);x.fillStyle='#f6c71b';x.fillRect(-84,-84,168,168);x.strokeStyle='#111';x.lineWidth=7;x.strokeRect(-76,-76,152,152);x.restore();
 x.strokeStyle='#111';x.lineWidth=12;x.beginPath();x.moveTo(108,200);x.lineTo(108,60);x.stroke();x.beginPath();x.moveTo(150,200);x.lineTo(150,150);x.quadraticCurveTo(150,118,116,96);x.stroke();
 x.fillStyle='#111';x.beginPath();x.moveTo(108,38);x.lineTo(90,68);x.lineTo(126,68);x.fill();
 x.fillStyle='#f6c71b';x.fillRect(48,262,160,84);x.strokeStyle='#111';x.lineWidth=6;x.strokeRect(52,266,152,76);x.fillStyle='#111';x.font='bold 50px Arial';x.textAlign='center';x.fillText('300 m',128,322)});
post(100,ZA-3.6,-Math.PI/2,1.2,1.7,MRG,1.2);
// 高速限速 MAXIMUM 100
{const t=cv(240,300,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#111';x.lineWidth=8;x.strokeRect(12,12,w-24,h-24);x.fillStyle='#111';x.textAlign='center';x.font='bold 46px Arial';x.fillText('MAXIMUM',w/2,80);x.font='bold 150px Arial';x.fillText('100',w/2,250)});
 post(470,ZA-3.6,-Math.PI/2,.9,1.12,t,1.8)}
scene.add(sun.target);sun.shadow.bias=-.0006;
const SUNO=new T.Vector3(60,90,-60),SUNF=SUNO.clone().negate().normalize(),SUNR=new T.Vector3().crossVectors(SUNF,new T.Vector3(0,1,0)).normalize(),SUNU=new T.Vector3().crossVectors(SUNR,SUNF),SUNTS=150/1024;
function sunFollow(wx,z){const c=new T.Vector3(wx,0,z),a=Math.round(c.dot(SUNR)/SUNTS)*SUNTS,b=Math.round(c.dot(SUNU)/SUNTS)*SUNTS,f=c.dot(SUNF);
 const p=SUNR.clone().multiplyScalar(a).add(SUNU.clone().multiplyScalar(b)).add(SUNF.clone().multiplyScalar(f));sun.target.position.copy(p);sun.position.copy(p).add(SUNO)}
// ---------- 状态 ----------
const mine=car(C[0]);
let R=null,round=0,playing=false,gt=0,view=1,yawD=0,az=2.4,el=.85,drag=false,lx=0,ly=0,DIFF='easy';
const live=[];
const TXT={
 noSig:["换线（并线）前没有打转向灯","换线和并入高速都要先打转向灯（Signal），让旁边车道和后面的车知道你要过去，再看后视镜、回头看盲点，最后才动。"],
 wrongSig:["转向灯打错了方向","你要往哪边换线、并线，就打哪边的转向灯。"],
 sigShort:["转向灯打得太晚","转向灯要提前打，至少闪 3 秒左右再开始换线或并线，给别人反应的时间。"],
 noMirror:["换线（并线）前没有看后视镜","打灯后要看中间后视镜和要过去那一侧的外后视镜，看清后面和旁边车道的车流。"],
 noShoulder:["没有回头看盲点","后视镜看不到车身侧后方的盲区。换线、并入高速前一定要回头看一眼要过去那一侧的盲点。"],
 oldShoulder:["看完盲点隔太久才动","看盲点要在动之前的最后一刻做，看完马上换线（并线）。隔了几秒，盲区里可能已经有车开进来了。"],
 unsafeB:["旁边车道的车就在你旁边（盲区里）还换线","要过去的车道上有车和你并排或在你侧后方的盲区里，过去就会撞上它。确认旁边没车再动。"],
 unsafeR:["后面的车开过来太近还过去，逼它刹车","要过去的车道上，后面有车比你快、离你又不够远，你过去它就得刹车让你。要等它过去，或者等它离你足够远再动。"],
 unsafeF:["插到前车后面太近","要过去的车道上，前面的车比你慢、离你太近。要等它和你拉开距离再过去。"],
 sigOn:["换线（并线）后没有关转向灯","完成换线、并入高速后要马上关掉转向灯（最晚 5 秒内）。"],
 missRamp:["没有及时换到右车道，错过了高速入口","去高速的匝道从右车道分出去。听到指令后要尽早找空档换到右车道，到了分岔口还在左车道，就错过了入口。"],
 solidX:["在实线处就并入高速","加速车道开头一段和高速之间是实线，不能并线。要开到虚线的地方，一边提速一边找空档再并入。"],
 slowMerge:["车速没提上来就并入高速","加速车道就是用来提速的：要把车速提到和高速车流差不多（约 100）再并入。速度太慢就并进去，后面的车要急刹。"],
 noMerge:["加速车道走完了还没并入","加速车道只有约 300 米，要一边提速一边看后视镜和盲点，看到合适的空档就果断并入。走到尽头只能停车，非常危险。"],
 crash:["和旁边的车相撞","换线、并线前一定要看后视镜和回头看盲点，确认有足够的空档。"]};
const SER=['unsafeB','unsafeR','unsafeF','crash','missRamp','noMerge'];
// 其他车：road A＝城市道路（往北，s＝z，lane＝x），F＝高速往东（s＝x，lane＝z），W＝高速往西
function carPos(c){if(c.road==='A')return[c.lane,c.s,c.lane<0?Math.PI:0];if(c.road==='F')return[c.s,c.lane,Math.PI/2];return[c.s,c.lane,-Math.PI/2]}
function add(road,lane,s,v,o){const c=car(C[1+Math.random()*8|0]);live.push(c);const k=Object.assign({c,road,lane,s,vd:v,cv:Math.abs(v)},o||{});R.cars.push(k);return k}
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;
 const u0=uAtZ(-560);R={t:0,u:u0,d:3.5,v:V0,ph:0,sig:null,sigT:-9,mT:{},oT:{},look:null,yaw:0,pit:0,ev:[],over:false,cars:[],lc:null,lastDone:-9,q:[],on:'A',hd:0};
 // 城市道路（和换线一样的两条车道）：你在右车道；左车道的车稍快，右车道前后有车，速度和你一样
 const z0=-560;[12,48,90,140].forEach(d=>add('A',1.75,z0+d+Math.random()*6,18.06));[-20,-55].forEach(d=>add('A',1.75,z0+d,18.06));
 [55,105].forEach(d=>add('A',5.25,z0+d,V0));[-24,-62].forEach(d=>add('A',5.25,z0+d,V0));
 for(let k=0;k<10;k++)add('A',-1.75-(k%2)*3.5,z0+60+k*55,-V0);      // 对面往南的车
 // 高速往东左道、往西两条：背景车流
 for(let k=0;k<18;k++)add('F',ZF2,-500+k*110+Math.random()*30,31+Math.random()*2);
 for(let k=0;k<22;k++)add('W',k%2?ZW1:ZW2,-550+k*100+Math.random()*40,-(29+Math.random()*3));
 for(let k=0;k<5;k++)add('F',ZF1,700+k*140,29.5);      // 远处前方的右道车
 mine.visible=view===2;setSig(null);banner('城市道路，跟着车流行驶','');mk();$('sp').textContent='60'}
// 进入匝道时，按你接下来的车速，在很远的地方（看不到）安排高速右道的车流：先有 1～3 辆从你旁边过去，然后一个空档，再后面又有车
function spawnF1(){let u=R.u,v=R.v,t=0,tA=null;const xs=[];for(let i=0;i<900;i++){const dt=.05;let vt=u<UARC0?Math.max(VR,V0-(u-UDIV)*.08):u<UARC1?VR:VF;v=v>vt?Math.max(vt,v-3*dt):Math.min(vt,v+(u>=UARC1?2.2:1.5)*dt);u+=v*dt;t+=dt;
  if(tA==null&&u>=UARC1)tA=t;if(tA!=null&&i%2===0)xs.push([t-tA,P(u)[0]])}
 const X=tau=>{for(const a of xs)if(a[0]>=tau)return a[1];return xs[xs.length-1][1]};
 const put=(tau,rel,vc)=>{const x0=X(tau)+rel-vc*(tau+tA);add('F',ZF1,x0,vc)};
 const n=1+(Math.random()*3|0);for(let k=0;k<n;k++){const vc=30+Math.random()*1.2;put(2.4+k*1.2+Math.random()*.4,0,vc)}      /* 先过去的 1～3 辆（约 108–112 km/h） */
 let rel=-58-Math.random()*8,vc=29.8+Math.random();put(11,rel,vc);      /* 空档后面的下一团车 */for(let k=0;k<2+(Math.random()*2|0);k++){rel-=30+Math.random()*8;put(11,rel,vc)}
 rel-=70;for(let k=0;k<4;k++){rel-=32;put(11,rel,29)}}
function banner(t,col,big){const b=$('bn');b.textContent=t;b.style.color=col||'';if(big){const e=$('cf');e.textContent=t;e.classList.remove('go');void e.offsetWidth;e.classList.add('go')}}
function flash(t){const f=$('fl');f.textContent=t;f.style.opacity=1;clearTimeout(flash.h);flash.h=setTimeout(()=>f.style.opacity=0,1800)}
function setSig(s){R.sig=s;R.sigT=R.t;const e=$('sg');e.style.display=s?'block':'none';e.textContent=s==='L'?'⬅':'➡';if(s)tick(true);mk()}
function mk(){const on={sigL:R.sig==='L',sigR:R.sig==='R',mir:R.look&&R.look.k==='M',sho:R.look&&R.look.k==='O',go:!!R.lc};document.querySelectorAll('.b').forEach(b=>b.classList.toggle('on',!!on[b.dataset.m]))}
// 你的位置：沿路线 P 的 u，再往左偏 d 米
function me(){if(R.mz!=null)return[R.mx,R.mz,0];const q=P(R.u),lx=-Math.cos(q[2]),lz=Math.sin(q[2]);return[q[0]+lx*R.d,q[1]+lz*R.d,q[2]+R.hd]}
const onArt=()=>R.u<UDIV+2,onAcc=()=>R.u>=UARC1;
const other=()=>onArt()?(R.d>1.75?'R':'L'):'L';
let SNC=null;
function snap(){try{const cvs=ren.domElement,W=360,H=240;if(!cvs.width)return null;if(!SNC)SNC=new T.PerspectiveCamera(45,1,1,500);SNC.aspect=cvs.width/cvs.height;SNC.updateProjectionMatrix();
 const p=me();SNC.position.set(-p[0],55,p[1]);SNC.up.set(Math.sin(p[2])*-1,0,Math.cos(p[2]));SNC.lookAt(-p[0],0,p[1]);const vc=cockpit.visible,vm=mine.visible;cockpit.visible=false;mine.visible=true;placeMine();ren.render(scene,SNC);cockpit.visible=vc;mine.visible=vm;
 const c2=document.createElement('canvas');c2.width=W;c2.height=H;const sw=Math.min(cvs.width,cvs.height*W/H),sh=sw*H/W;c2.getContext('2d').drawImage(cvs,(cvs.width-sw)/2,(cvs.height-sh)/2,sw,sh,0,0,W,H);return c2.toDataURL('image/jpeg',.82)}catch(e){return null}}
function ev(key){if(R.ev.some(e=>e.key===key))return;const t=TXT[key];R.ev.push({key,title:t[0],text:t[1],img:snap()});flash(t[0])}
// ---------- 按钮 ----------
function cmd(m){if(!R||R.over||!playing)return;
 if(m==='sigL'||m==='sigR'){const s=m==='sigL'?'L':'R';setSig(R.sig===s?null:s);return}
 if(m==='mir'||m==='sho'||m==='go'){if(R.look||R.q.length){if(R.q.length<3)R.q.push(m);return}doAct(m)}}
function doAct(m){if(m==='go'){if(!R.lc)startChange();return}R.look={k:m==='mir'?'M':'O',t:0,side:R.lc?R.lc.to:other()};mk()}
function nextAct(){const m=R.q.shift();if(m)doAct(m)}
function cmdUp(){}
// 空档：L＝目标车道上其他车 [{s,cv}]，s 是沿车道的位置；S＝你的位置
function gapWhy(L,S){let w=null;L.forEach(c=>{if(w)return;const dz=c.s-S,dv=c.cv-R.v;
  if(dz<5.6&&dz>-12)w='unsafeB';
  else if(dz<0){const g=-dz-4.6-Math.max(0,dv)*2;if(g<Math.max(6,.6*c.cv+2.5*Math.max(0,dv)))w='unsafeR'}
  else{const g=dz-4.6+dv*2;if(g<Math.max(3,.2*R.v))w='unsafeF'}});return w}
function targetCars(to){const p=me();if(onArt())return{L:R.cars.filter(c=>c.road==='A'&&c.lane===(to==='R'?5.25:1.75)),S:p[1]};return{L:R.cars.filter(c=>c.road==='F'&&c.lane===ZF1),S:p[0]}}
function startChange(){if(!onAcc())return;      // 只有在加速车道上由你操作并入（进匝道车道由系统完成）
 if(onAcc()&&R.d>1)return;      // 已经并进高速了
 const to=other(),t=R.t;
 if(!R.sig)ev('noSig');else if(R.sig!==to)ev('wrongSig');else if(t-R.sigT<3)ev('sigShort');
 if(!(R.mT[to]!=null&&t-R.mT[to]<10))ev('noMirror');
 if(!(R.oT[to]!=null&&t-R.oT[to]<10))ev('noShoulder');else if(t-R.oT[to]>2.5)ev('oldShoulder');
 const T2=targetCars(to),why=gapWhy(T2.L,T2.S);if(why)ev(why);
 if(onAcc()){if(me()[0]<XSOL)ev('solidX');if(R.v<22.2)ev('slowMerge')}
 const d1=onArt()?(to==='R'?0:3.5):3.75;R.lc={to,d0:R.d,d1,t0:t,T:onAcc()?4.5:5.5,merge:onAcc()};mk()}
// ---------- 每一帧 ----------
function occ(c){const p=me();if(c.road==='A')return onArt()||R.u<UDIV+30?Math.abs(p[0]-c.lane)<2.7&&c.lane>0:false;if(c.road==='F')return onAcc()&&Math.abs(p[1]-c.lane)<2.7;return false}
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;const t=R.t;
 // 指令和阶段
 if(R.ph===0&&t>=2){R.ph=1;banner('考官：前方上 401 高速往东','#ffe27a',1)}
 if(R.ph===1&&me()[1]>=-262&&!R.sig){setSig('R')}      /* 匝道车道出现：系统打右转灯，3 秒后自动换进匝道车道（必须进匝道才能上高速） */
 if(R.ph===1&&!R.lc&&R.d>1&&R.sig==='R'&&t-R.sigT>3){R.lc={to:'R',d0:R.d,d1:0,t0:t,T:5.5,auto:1}}
 if(R.ph<=1&&R.u>=UDIV){{R.ph=2;banner('进入匝道：建议速度 50 km/h','#ffe27a');spawnF1()}}
 if(R.ph===2&&R.u>=UARC1){R.ph=3;banner('加速车道：提速，找空档并入高速','#ffe27a')}
 if(R.ph===3&&R.merged){R.ph=4;R.p4=t;banner('已并入高速','')}
 if(R.ph===9&&t>R.miss+2.5){finish();return}
 if(R.ph===4&&t>R.p4+7){finish();return}
 if(R.ph===3&&!R.lc&&me()[0]>XTAP-24){if(R.v<.2&&!R.stopT)R.stopT=t;if(R.stopT&&t>R.stopT+1.5){ev('noMerge');finish();return}}
 // 你的车速：城市道路 60（前面有车跟车）；匝道减到 50；加速车道提速到 100；没并进去就在加速车道尽头停下
 const p=me();let vt=R.ph===9?V0:R.u<UDIV?V0:R.u<UARC0?Math.max(VR,V0-(R.u-UDIV)*.08):R.u<UARC1?VR:VF;
 R.cars.forEach(c=>{if(!occ(c))return;const q=carPos(c),g=(c.road==='A'?q[1]-p[1]:q[0]-p[0])-4.6;if(g>-2&&g<60)vt=Math.min(vt,Math.sqrt(c.cv*c.cv+2*4*Math.max(0,g-8)))});
 if(onAcc()&&!R.merged&&!(R.lc&&R.lc.merge))vt=Math.min(vt,Math.sqrt(2*7*Math.max(0,XTAP-9-p[0])));      /* 加速车道快到头还没并进去：只能刹车停下 */
 if(R.crash)vt=0;R.v=R.v>vt?Math.max(vt,R.v-(R.crash?9:7)*dt):Math.min(vt,R.v+(onAcc()?2.2:1.5)*dt);
 if(R.mz!=null)R.mz+=R.v*dt;else R.u+=R.v*dt;
 if(R.lc){const L=R.lc,k=Math.min(1,(t-L.t0)/L.T),s=k*k*k*(10-15*k+6*k*k),dd=(L.d1-L.d0)*30*k*k*(1-k)*(1-k)/L.T;R.d=L.d0+(L.d1-L.d0)*s;R.hd=-Math.atan2(dd,Math.max(1,R.v));
  if(k>=1){R.lc=null;R.hd=0;R.d=L.d1;if(L.auto)setSig(null);else R.lastDone=t;if(L.merge)R.merged=true;mk()}}
 if(!R.lc&&R.sig&&R.lastDone>0&&t-R.lastDone>5&&R.sigT<R.lastDone)ev('sigOn');
 // 看后视镜／看盲点
 if(R.look){const L=R.look,k9=Math.min(1,dt*12),sd=L.side==='L'?-1:1;L.t+=dt;
  if(L.k==='M'){if(L.t<.55){R.yaw+=(.42-R.yaw)*k9;R.pit+=(.2-R.pit)*k9}else if(L.t<1.35){R.yaw+=((sd<0?-.46:.83)-R.yaw)*k9;R.pit+=((sd<0?-.34:-.27)-R.pit)*k9;if(L.t>1)R.mT[L.side]=t}
   else{R.yaw+=(0-R.yaw)*k9;R.pit+=(0-R.pit)*k9;if(L.t>1.7){R.look=null;R.yaw=0;R.pit=0;mk();nextAct()}}}
  else{if(L.t<.95){R.yaw+=(sd*2.05-R.yaw)*Math.min(1,dt*10);R.pit+=(-.03-R.pit)*k9;if(L.t>.6)R.oT[L.side]=t}
   else{R.yaw+=(0-R.yaw)*Math.min(1,dt*12);R.pit+=(0-R.pit)*k9;if(L.t>1.3){R.oT[L.side]=t;R.look=null;R.yaw=0;R.pit=0;mk();nextAct()}}}}
 // 其他车：保持速度、跟前车；你在它车道上时把你当前车；你切到它前面太近时它刹车、按喇叭
 R.cars.forEach(c=>{if(c.crash){c.cv*=Math.max(0,1-3*dt);c.s+=c.cv*dt;return}
  const sg=Math.sign(c.vd)||1;let vt=Math.abs(c.vd);
  R.cars.forEach(o=>{if(o===c||o.road!==c.road||o.lane!==c.lane)return;const g=(o.s-c.s)*sg-4.6;if(g>-1&&g<80)vt=Math.min(vt,Math.sqrt(o.cv*o.cv+2*4*Math.max(0,g-7)))});
  if(occ(c)){const g=((c.road==='A'?p[1]:p[0])-c.s)-4.6;if(g>-1&&g<80){const need=Math.sqrt(R.v*R.v+2*4*Math.max(0,g-6));if(need<vt){vt=need;if(c.cv-R.v>.5&&(c.cv*c.cv-R.v*R.v)/(2*Math.max(.5,g-2))>3.2&&!c.hk&&(R.lc||t-R.lastDone<3)){c.hk=true;honk()}}}}
  c.cv=c.cv>vt?Math.max(vt,c.cv-7*dt):Math.min(vt,c.cv+1.8*dt);c.s+=c.cv*sg*dt;
  if(c.road==='W'&&c.s<-600)c.s+=2350;if(c.road==='F'&&c.lane===ZF2&&c.s>1750)c.s-=2350;if(c.road==='A'&&c.vd<0&&c.s<-800)c.s+=1100});
 // 相撞
 if(!R.crash){const mm=[p[0],p[1],p[2],2.3,.95];const H=R.cars.find(c=>{if(c.gone)return false;const q=carPos(c);if(Math.abs(q[0]-p[0])>8||Math.abs(q[1]-p[1])>8)return false;if(c.road==='A'&&artY(c.s)>1)return false;return obbHit(mm,[q[0],q[1],q[2],2.3,.95])});
  if(H){H.crash=true;H.spin=.3;R.crash={t};crashSnd();ev('crash')}}
 if(R.crash&&t-R.crash.t>3){finish();return}}
function finish(){if(R.over)return;R.over=true;setSig(null);const o=$('ov');let h;
 if(!R.ev.length)h='<h2>驾驶总结</h2><div class="st">★★★</div><p>提前换到右车道进入匝道，在加速车道里提速、找空档，打灯、看后视镜、看盲点后顺利并入高速，做得很好。</p>';
 else h='<h2>驾驶总结</h2><p>这一趟有 '+R.ev.length+' 处需要注意：</p><div class="cards">'+R.ev.map(e=>`<div class="card">${e.img?`<img src="${e.img}">`:''}<b>${e.title}${SER.includes(e.key)?'<span class="tag s">严重</span>':'<span class="tag">扣分项</span>'}</b><span>${e.text}</span></div>`).join('')+'</div>';
 o.innerHTML=`<div class="pn">${h}<br><button id="again">再来一次</button> <button id="home" style="background:#6b7280">回到首页</button></div>`;o.style.display='flex';
 $('again').onclick=()=>{o.style.display='none';newRun(true);playing=true};$('home').onclick=()=>{o.innerHTML=HOME;o.style.display='flex';bindHome()}}
// ================= 渲染循环 =================
let last=0,fovH=110;
MRL.rt.setSize(512,256);MRR.rt.setSize(512,256);
{const vf=h=>2*Math.atan(Math.tan(h/2*Math.PI/180)/2)*180/Math.PI;MRL.c.fov=vf(16);MRL.dir.set(Math.sin(7*Math.PI/180),-.03,-1).normalize();MRR.c.fov=vf(24);MRR.dir.set(-Math.sin(11*Math.PI/180),-.03,-1).normalize();[MRL,MRR].forEach(m=>m.c.updateProjectionMatrix())}      // 外后视镜：左镜平面镜约 16°，右镜约 24°（有盲区）
function placeMine(){const p=me();place(mine,p[0],p[1],p[2]);mine.userData.bl.forEach(m=>{m.position.x=R.sig==='R'?-.88:.88})}
function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;step(dt);const bl=Math.sin(ts/1000*15)>0;const p=me();
 R.cars.forEach(c=>{const q=carPos(c);place(c.c,q[0],q[1],q[2]+(c.spin||0),c.road==='A'?artY(c.s):0);c.c.visible=!c.gone&&Math.hypot(q[0]-p[0],q[1]-p[1])<420});
 placeMine();mine.userData.bl.forEach(m=>m.visible=!!R.sig&&bl);
 sunFollow(-p[0],p[1]+10);
 if(R.sig&&playing&&!R.over){const on=Math.sin(ts/1000*9.4)>0;$('sg').style.opacity=on?1:.15;if(on!==loop.sgOn){loop.sgOn=on;tick(on)}}
 const q=p;
 if(view===1){const h=q[2]+R.yaw+yawD,L=R.look?6:10,fT=!R.look?110:R.look.k==='M'?(R.look.t<.55?75:R.look.t<1.35?60:110):100;fovH+=(fT-fovH)*Math.min(1,dt*7);cam.fov=Math.min(105,2*Math.atan(Math.tan(fovH*Math.PI/360)/cam.aspect)*180/Math.PI);cam.updateProjectionMatrix();
  const ox=.38*Math.cos(q[2]),oz=.38*Math.sin(q[2]),bx0=-q[0]+Math.sin(q[2])*.2,bz0=q[1]-Math.cos(q[2])*.2;const sk=R.crash&&R.t-R.crash.t<.7?(1-(R.t-R.crash.t)/.7)*.12:0;
  cam.position.set(bx0+ox+(Math.random()-.5)*sk,1.25+(Math.random()-.5)*sk,bz0+oz+(Math.random()-.5)*sk);
  cam.lookAt(-q[0]-Math.sin(h)*L+ox,1.25+L*.05+R.pit*L,q[1]+Math.cos(h)*L+oz);
  cockpit.visible=true;cockpit.position.set(bx0,1.25,bz0);cockpit.rotation.y=-q[2];
  const dh=normA(q[2]-lastH)/Math.max(dt,.001);lastH=q[2];wheel.rotation.z+=((Math.max(-2.6,Math.min(2.6,dh*2.4)))-wheel.rotation.z)*Math.min(1,dt*10)}
 else{cockpit.visible=false;if(cam.fov!==62){cam.fov=62;cam.updateProjectionMatrix()}const h=q[2];cam.position.set(-q[0]+Math.sin(h)*26,42,q[1]-Math.cos(h)*26);cam.lookAt(-q[0]-Math.sin(h)*14,0,q[1]+Math.cos(h)*14)}      /* 俯视：跟着你的车，从后上方往前看 */
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
