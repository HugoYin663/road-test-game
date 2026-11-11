// ============================================================
// stop-left.js — 项目：小区停牌路口左转（单面停牌：你和对面有 STOP，横路不停）
// ============================================================
// 加拿大小区的样子：路面 8.5 米宽、不画线，路缘、草地隔离带、人行道、前院草坪、独栋房子、车道、行道树
// 路线坐标 (x,z)：x 向东为正，z 向北为正；画到场景里是 (-x, y, z)。你往北开（x=2.1 车道），到路口左转往西（z=+2.0 车道）
// 你这条路在路口前有人行横道（没有停车线）：停在人行横道前
const RW=4.25,RC=6,SW0=RW+2.25,SW1=RW+3.75;      // 路面半宽、路口转角半径、人行道内外边
const XL=2.1,ZE=-2.0,ZEp=-1.3,ZWB=2.0;      // 你的车道；横路往东车道（有路边停车时往中间让）；往西车道（你要转进去的）
const CW0=-8.4,CW1=-6.1;      // 人行横道（你这条路）：z 从 CW0 到 CW1。车头停在 CW0 前面
const FR=2.3;      // 车中心到车头
// 四面停牌（页面里写 var ALLWAY=1）：四个方向都有 STOP（下面加 ALL WAY 小牌），你直行；先停稳的先走——这一局对面左转的车比你先到，要让它先转
const AW4=typeof ALLWAY!=='undefined'&&!!ALLWAY;
// 车头要停在 SL 前面：单面停牌没有停车线，SL 就是人行横道；四面停牌每个方向都有粗白停车线（人行横道外面 0.6 米，0.45 米宽），SL 是停车线靠你这边的边
const SL=AW4?CW0-1.05:CW0;
// ---------- 地面、道路 ----------
const GRS=M(0xffffff,{map:noise('#79a95a',50,40)}),ASF=M(0xffffff,{map:noise('#5f6168',70,30)}),CRB=M(0xc9cbcf),SWK=M(0xd5d3cc),DRV=M(0xcfccc4);
{const g=new T.Mesh(new T.PlaneGeometry(700,700),GRS);g.rotation.x=-Math.PI/2;g.receiveShadow=true;scene.add(g)}
box(2*RW,.04,420,ASF,0,.02,0);box(460,.04,2*RW,ASF,0,.021,0);      // 你这条路（南北）、横路（东西）
// 路缘（到转角为止）、人行道（一直通到转角，和横路的人行道接上）
// 路缘在后面画（车道口那一段是平的，要等车道位置定了）
[-1,1].forEach(s=>{
 [[-230,-6],[6,230]].forEach(([a,b])=>{const L=b-a,c=(a+b)/2;box(1.5,.12,L,SWK,s*(SW0+.75),.06,c);box(L,.12,1.5,SWK,c,.06,s*(SW0+.75))})});
// 路口转角：路面填成圆角，外面一圈路缘
function fan(pts,mat,y){const pos=[],idx=[];pts.forEach(p=>pos.push(-p[0],y,p[1]));for(let i=1;i<pts.length-1;i++)idx.push(0,i,i+1);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,mat);m.receiveShadow=true;scene.add(m)}
const ASD=M(0x5f6168,{side:T.DoubleSide}),CRD=M(0xc9cbcf,{side:T.DoubleSide}),SWD=M(0xd5d3cc,{side:T.DoubleSide}),GRD=M(0x79a95a,{side:T.DoubleSide});
[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([sx,sz])=>{const cx=sx*(RW+RC),cz=sz*(RW+RC),N=16,arc=r=>Array.from({length:N+1},(_,i)=>{const a=i/N*Math.PI/2;return[cx-sx*r*Math.cos(a),cz-sz*r*Math.sin(a)]});
 fan([[sx*RW,sz*RW],...arc(RC).map(p=>p)],ASD,.021);
 // 路缘：一圈 0.25 宽的带子
 {const a=arc(RC),b=arc(RC-.25),pos=[],idx=[];for(let i=0;i<=N;i++){pos.push(-a[i][0],.15,a[i][1],-b[i][0],.15,b[i][1])}for(let i=0;i<N;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();scene.add(new T.Mesh(g,CRD))}
});
// 人行横道（你这条路，以及对面那条路）：小区里只画两条细白线（不是大路口那种斑马线）
const WLm=BM(WH);
[[CW0,CW1],[-CW1,-CW0]].forEach(([a,b])=>{box(2*RW,.03,.18,WLm,0,.045,a+.09);box(2*RW,.03,.18,WLm,0,.045,b-.09)});
if(AW4){[[CW0,CW1],[-CW1,-CW0]].forEach(([a,b])=>{box(.18,.03,2*RW,WLm,a+.09,.045,0);box(.18,.03,2*RW,WLm,b-.09,.045,0)});      /* 四面停牌：横路两边也有人行横道 */
 const c=SL+.225,w=RW-.15;box(w,.035,.45,WLm,RW/2,.05,c);box(w,.035,.45,WLm,-RW/2,.05,-c);box(.45,.035,w,WLm,c,.05,-RW/2);box(.45,.035,w,WLm,-c,.05,RW/2)}      /* 四个方向的粗白停车线：只画在来车那一半（中线到路缘） */
// 路口两个角的院子：大云杉、灌木和树篱，挡住在人行横道前往左右看的视线（真实小区路口常见）。OBST＝挡视线的矩形 [x,z,半长x,半宽z]
const OBST=[];
{const SP=M(0x2f5f3a),SH=[M(0x3f7a3a),M(0x4d8a40),M(0x5f9640)];
 const spruce=(x,z,r,h)=>{const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.15,.2,1,6),M(0x5a3d26),0,.5,0));const c=mesh(new T.ConeGeometry(r,h,9),SP,0,h/2+.6,0);c.castShadow=true;g.add(c);g.position.set(-x,0,z);scene.add(g);OBST.push([x,z,r*.8,r*.8])};
 const hedge=(x0,x1,z,w,h)=>{for(let x=x0;x<x1;x+=1.4){const b=mesh(new T.SphereGeometry(.95,8,6),SH[Math.random()*3|0],-(x+.7),h*.55,z+(Math.random()-.5)*.3);b.scale.set(1.1,h/1.7,w/1.9);b.castShadow=true;scene.add(b)}OBST.push([(x0+x1)/2,z,(x1-x0)/2,w/2])};
 hedge(-24,-9.5,-9.3,1.6,1.7);spruce(-11.5,-12,2.4,6.5);      // 左边路角
 hedge(9.5,22,-9.3,1.6,1.6);spruce(11,-11.6,2.8,7.5);spruce(16.5,-12.5,2.2,6);      // 右边路角
}
// ---------- 标志牌 ----------
function signPost(x,z,h,tex,w,hh,y0,extra){const g=new T.Group(),pm=M(0x8a9099);g.add(mesh(new T.CylinderGeometry(.05,.05,y0+hh+(extra?.6:0),8),pm,0,(y0+hh+(extra?.6:0))/2,.05));
 const f=mesh(new T.PlaneGeometry(w,hh),new T.MeshBasicMaterial({map:tex,transparent:true}),0,y0+hh/2,0);f.rotation.y=Math.PI;g.add(f);g.add(mesh(new T.PlaneGeometry(w,hh),M(0x9aa0a8),0,y0+hh/2,.01));
 if(extra)extra(g,y0+hh);place(g,x,z,h);scene.add(g);return g}
const STOPT=cv(256,256,(x,w,h)=>{x.clearRect(0,0,w,h);x.save();x.translate(128,128);const oct=r=>{x.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;x.lineTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath()};
 oct(124);x.fillStyle='#fff';x.fill();oct(112);x.fillStyle='#c8102e';x.fill();x.fillStyle='#fff';x.font='bold 72px Arial';x.textAlign='center';x.fillText('STOP',0,25);x.restore()});
const BLADE=t=>cv(256,48,(x,w,h)=>{x.fillStyle='#1d6b3a';x.fillRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=3;x.strokeRect(3,3,w-6,h-6);x.fillStyle='#fff';x.font='bold 30px Arial';x.textAlign='center';x.fillText(t,w/2,34)});
const blades=(g,top)=>{const a=mesh(new T.PlaneGeometry(1.1,.21),new T.MeshBasicMaterial({map:BLADE('BIRCH CRES'),side:T.DoubleSide}),0,top+.42,0);a.rotation.y=Math.PI/2;g.add(a);
 const b=mesh(new T.PlaneGeometry(1.1,.21),new T.MeshBasicMaterial({map:BLADE('MAPLE DR'),side:T.DoubleSide}),0,top+.18,0);b.rotation.y=Math.PI;g.add(b)};
signPost(RW+1.0,(AW4?SL+.4:CW0)-1.4,0,STOPT,.75,.75,1.55,blades);      // 你这边：右边路角
signPost(-RW-1.0,-(AW4?SL+.4:CW0)+1.4,Math.PI,STOPT,.75,.75,1.55);      // 对面也有停牌（你看到它的背面）
const AWT=cv(160,80,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#c8102e';x.lineWidth=6;x.strokeRect(6,6,w-12,h-12);x.fillStyle='#c8102e';x.font='bold 40px Arial Narrow,Arial';x.textAlign='center';x.fillText('ALL-WAY',w/2,54,w-24)});      /* 白底红字红边：短小，宽度和下面的条纹牌差不多 */      /* 白底红字红边 */
const STRT=cv(64,256,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='#c8102e';for(let i=0;i<5;i++)x.fillRect(4,6+i*50,w-8,26)});      /* 停牌下面红白横条的竖牌 */
if(AW4)[[RW+1.0,SL-1.0,0],[-RW-1.0,-SL+1.0,Math.PI],[SL-1.0,-(RW+1.0),Math.PI/2],[-SL+1.0,RW+1.0,-Math.PI/2]].forEach((a,i)=>{if(i>=2)signPost(a[0],a[1],a[2],STOPT,.75,.75,1.55);signPost(a[0],a[1],a[2],AWT,.3,.15,1.36);signPost(a[0],a[1],a[2],STRT,.26,.86,.44)});      /* 横路两个方向也有停牌；四个停牌下面都有 ALL WAY 小牌 */
{const t=cv(200,280,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#111';x.lineWidth=6;x.strokeRect(8,8,w-16,h-16);x.fillStyle='#111';x.textAlign='center';x.font='bold 40px Arial';x.fillText('MAXIMUM',w/2,62);x.font='bold 130px Arial';x.fillText('40',w/2,200)});
 signPost(RW+1.0,-80,0,t,.6,.84,1.6)}
// ---------- 房子、车道、树、路灯、消防栓、信箱 ----------
const WALLS=[0xb5654a,0x9c5a43,0xc9b28f,0xd8d2c4,0x8d6e5a,0xe2dccd,0xa8a29a],ROOFS=[0x3b3f45,0x4a4038,0x5b4a3d,0x2f3338,0x6b6e72];
const WIN=M(0x2a3540),DOORc=[0x6b2b2b,0x234a6b,0x2f4f3a,0x111111],GAR=M(0xeeeeec),TRIM=M(0xf2f2ee);
const MOUTH=[];      // 车道口：{road:'ns'|'ew',s:哪一边,a,b：沿路的范围}
const DRA=M(0x4a4c51),CRBS=M(0x8e9196);
function house(x,z,h,setL){const o=buildHouse(),g=o.g;      // 式样见 lib/houses.js：平房、科德角、殖民式、两层砖房、工匠平房
 // 车道：窄的占房子宽度一半以上，宽的和房子一样宽；水泥或沥青；人行道照常从车道上穿过去；路边那一段路缘是平的
 const W=Math.min(o.bw,o.bw*(.55+Math.random()*.45)),cx=o.side?o.gx:Math.max(-o.bw/2+W/2,Math.min(o.bw/2-W/2,W>o.bw*.9?0:o.gx)),dm=Math.random()<.4?DRA:DRV;
 const seg=(z0,z1,y,m)=>{if(z1>z0)g.add(mesh(new T.BoxGeometry(W,.05,z1-z0),m,cx,y,(z0+z1)/2))};
 seg(o.fz,setL-(SW1-RW),.13,dm);seg(setL-(SW0-RW),setL-.25,.13,dm);seg(setL-.25,setL,.05,CRB);
 place(g,x,z,h);scene.add(g);g.updateMatrixWorld(true);
 const p=[cx-W/2,cx+W/2].map(lx=>new T.Vector3(lx,0,setL).applyMatrix4(g.matrixWorld)),ns=Math.abs(Math.sin(h))>.5;
 const v=ns?p.map(q=>q.z):p.map(q=>-q.x);MOUTH.push({road:ns?'ns':'ew',s:ns?(x>0?1:-1):(z>0?1:-1),a:Math.min(...v),b:Math.max(...v)});
 return{x,z,gx:o.gx,h}}
const DRIVES=[];
// 沿你这条路（南北）两边、沿横路两边各一排房子；房子正面朝路，离人行道约 7 米
const HD=SW1+7+4.5;      // 房子中心离路中心
for(let z=-30;z>-230;z-=17)[-1,1].forEach(s=>{const hz=z-Math.random()*2;const o=house(s*HD,hz,s>0?-Math.PI/2:Math.PI/2,HD-RW);DRIVES.push([s,hz,o])});
for(let z=30;z<210;z+=17)[-1,1].forEach(s=>{const hz=z+Math.random()*2;house(s*HD,hz,s>0?-Math.PI/2:Math.PI/2,HD-RW)});
for(let x=30;x<240;x+=17)[-1,1].forEach(sx=>[-1,1].forEach(sz=>{house(sx*(x+Math.random()*2),sz*HD,sz>0?Math.PI:0,HD-RW)}));
// 路口四个角的房子：侧面朝横路
[[1,-1],[-1,-1],[1,1],[-1,1]].forEach(([sx,sz])=>house(sx*(HD+1),sz*(HD+2),sx>0?-Math.PI/2:Math.PI/2,HD+1-RW));
// 路缘（到转角为止）：车道口断开；立面颜色深一点（有阴影），脚下一条深色边沟
{const GUT=M(0x4c4e54);
 [-1,1].forEach(s=>{[['ns',[-230,-RW-RC]],['ns',[RW+RC,230]],['ew',[-230,-RW-RC]],['ew',[RW+RC,230]]].forEach(([rd,[a,b]])=>{
  const gaps=MOUTH.filter(m=>m.road===rd&&m.s===s&&m.b>a&&m.a<b).sort((p,q)=>p.a-q.a);let c0=a;const pcs=[];gaps.forEach(m=>{pcs.push([c0,Math.max(c0,m.a)]);c0=Math.max(c0,m.b)});pcs.push([c0,b]);
  pcs.forEach(([p,q])=>{const L=q-p,c=(p+q)/2;if(L<.05)return;
   if(rd==='ns'){box(.25,.15,L,CRB,s*(RW+.125),.075,c);box(.02,.15,L,CRBS,s*(RW-.005),.075,c)}else{box(L,.15,.25,CRB,c,.075,s*(RW+.125));box(L,.15,.02,CRBS,c,.075,s*(RW-.005))}});
  const L=b-a,c=(a+b)/2;if(rd==='ns')box(.22,.01,L,GUT,s*(RW-.11),.045,c);else box(L,.01,.22,GUT,c,.045,s*(RW-.11))})})}
const onMouth=(rd,s,v)=>MOUTH.some(m=>m.road===rd&&m.s===s&&v>m.a-1.5&&v<m.b+1.5);
// 行道树（草地隔离带里）
const TRK=M(0x6b4a2e),LEAF=[M(0x3f8a3a),M(0x4f9a44),M(0x5a8f35)];
function tree(x,z,s){const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.16,.22,2.4,6),TRK,0,1.2,0));const c=mesh(new T.SphereGeometry(2+Math.random()*.8*s,8,6),LEAF[Math.random()*3|0],0,3.8+Math.random()*.6,0);c.castShadow=true;g.add(c);g.position.set(-x,0,z);scene.add(g)}
for(let z=-22;z>-230;z-=16+Math.random()*4)[-1,1].forEach(s=>{const zz=z+Math.random()*3;Math.random()<.85&&!onMouth('ns',s,zz)&&tree(s*(RW+1.25),zz,1)});
for(let z=24;z<210;z+=16+Math.random()*4)[-1,1].forEach(s=>Math.random()<.85&&!onMouth('ns',s,z)&&tree(s*(RW+1.25),z,1));
for(let x=24;x<240;x+=16+Math.random()*4)[-1,1].forEach(sx=>[-1,1].forEach(sz=>Math.random()<.8&&!onMouth('ew',sz,sx*x)&&tree(sx*x,sz*(RW+1.25),1)));
// 路灯（路角）、消防栓、社区信箱
{const pm=M(0x8a9099);[[RW+1.2,RW+9],[-RW-1.2,-RW-9]].forEach(([x,z])=>{const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.08,.11,7.5,6),pm,0,3.75,0));g.add(mesh(new T.BoxGeometry(1.6,.1,.12),pm,(x>0?-1:1)*.8,7.4,0));g.add(mesh(new T.BoxGeometry(.5,.14,.25),BM(0xf4f1dc),(x>0?-1:1)*1.5,7.32,0));g.position.set(-x,0,z);scene.add(g)});
 const hy=new T.Group();hy.add(mesh(new T.CylinderGeometry(.16,.18,.7,10),M(0xd0261f),0,.35,0));hy.add(mesh(new T.SphereGeometry(.17,10,6),M(0xf2c12e),0,.72,0));hy.add(mesh(new T.CylinderGeometry(.06,.06,.5,6),M(0xd0261f),0,.45,0)).rotation.z=Math.PI/2;hy.position.set(-(-RW-1.1),0,-16);scene.add(hy);
 const mb=new T.Group();mb.add(mesh(new T.BoxGeometry(1.6,1.4,.7),M(0x8f959c),0,.9,0));mb.add(mesh(new T.BoxGeometry(1.7,.12,.8),M(0x6f757c),0,1.66,0));mb.position.set(-(RW+1.4),0,-34);mb.rotation.y=Math.PI/2;scene.add(mb)}
// ---------- 状态 ----------
const mine=car(C[0]);
let R=null,round=0,playing=false,gt=0,view=1,yawD=0,az=2.4,el=.85,drag=false,lx=0,ly=0,DIFF='easy';
const live=[];
const TXT={
 yield4:["四面停牌路口没有按先后顺序让行","四面停牌（ALL WAY）路口：谁先完全停稳谁先走。别的车比你先停下，要等它先通过（离开路口）再走；同时停下时让右边的车。"],
 sigStraight:["直行却打了转向灯","在路口直行不要打转向灯，不然别人会以为你要转弯。"],
 waitTurn:["轮到你了却一直不走","四面停牌路口，前面先到的车都走了、轮到你时，要果断开过去。等太久，别的车会以为你在让它，反而更乱。"],
 noSig:["左转没有打转向灯","到停牌路口前（约 30 米）就要打左转灯，停车、观察、转弯的整个过程都开着。"],
 lateSig:["转向灯打得太晚","左转灯要在停车之前就打好（离路口约 30 米），让后面和对面的人早知道你要左转。"],
 noStop:["停牌前没有完全停车","停牌路口必须完全停住（车速为 0）；没有停车线时，停在人行横道前。慢慢滑过去（rolling stop）在路考里是严重错误。"],
 stopOnCross:["停车压到了人行横道","没有停车线时，要停在人行横道前面，车头不要压到人行横道。"],
 stopFar:["停车离人行横道太远","车头要停在接近人行横道的地方（1～2 米内）。停得太远看不清路口，之后还要再往前挪。"],
 noLook:["转弯前没有左右观察","停稳以后、起步左转之前，要看左边、看右边（最好再看一眼左边），两个方向的来车都要看清。"],
 blindGo:["视线被挡住，没看清就转弯","路角的树和灌木挡住视线时，要先在人行横道前完全停车；没有行人时，再慢慢往前挪（前移）到能看清两边来车的地方（不能进入横路），停下来再看左、看右，确认安全再转。"],
 pedYield:["没有让人行横道上的行人","行人在人行横道上（或正要走上来）时，车要停在人行横道前等他走过去，不能往前挪，也不能转弯。"],
 unsafeL:["左边来车太近还转弯","横路的车不用停，你要让它。左边的车离你太近时转弯，你会挡在它前面，逼它急刹，甚至撞上。"],
 unsafeR:["右边来车太近还转弯","你要转进去的那条车道上，右边来的车不用停。它离得太近时转进去，它只能急刹或撞上你。"],
 hesitate:["有安全的空档却一直不走","两边都没车、看得也清楚的时候，要果断转弯。等了很久不走，会影响后面的车，也算犹豫不决。"],
 crash:["和别的车相撞","左转要让横路两个方向的车。看不清就慢慢前移再看，确认两边都有足够的空档再走。"]};
if(AW4){TXT.stopOnCross=["停车压到了停车线","有停车线时，车头要停在粗白停车线后面，不要压线，更不能停到人行横道上。"];TXT.stopFar=["停车离停车线太远","车头要停在接近停车线的地方（1～2 米内）。停得太远，别的车看不出你已经停好在等。"];
 TXT.noStop=["停牌前没有完全停车","停牌路口必须在停车线前完全停住（车速为 0）。慢慢滑过去（rolling stop）在路考里是严重错误。"]}
const SER=['noStop','unsafeL','unsafeR','crash','pedYield','yield4'];
// 横路车流：dir＝+1 往东（从你左边来），-1 往西（从你右边来）
function add(dir,x,v){const c=car(C[1+Math.random()*8|0]);live.push(c);const k={c,dir,x,v,cv:v,z:dir>0?ZE:ZWB};R.cars.push(k);return k}
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;
 const hard=DIFF==='hard';
 R={t:0,mode:'app',z:-75,v:11.1,sig:null,sigT:-9,sigZ:null,ev:[],over:false,cars:[],stopped:false,lastStop:-9,firstStop:true,lookL:-9,lookR:-9,yaw:0,look:0,lookT:0,hard,park:false,stopReq:false,creep:false,turnP:null,u:0,safeT:0,hk:0};
 // 人行横道上的行人：你快到路口时，沿着横路的人行道走过来，从你车前的人行横道过去（简单约一半、困难大多数时候有）
 R.pedOn=Math.random()<(hard?.75:.45);
 // 横路两个方向的车：间距随机（有长有短），40～50 km/h
 // 横路车流：一段一段的车，中间有大空档；两个方向的大空档差不多同时到路口，这样左右都空的机会多（左转要两边都空）
 if(!AW4){const xs=[];let x=-230;while(x<230){xs.push(x);x+=hard?(Math.random()<.5?150+Math.random()*80:28+Math.random()*30):(Math.random()<.5?160+Math.random()*100:34+Math.random()*36)}
  const v=12.5;xs.forEach(x0=>{add(1,x0,v+Math.random()*.6);add(-1,-x0+(Math.random()*10-5),v+Math.random()*.6)})}
 R.spawnGap={'1':0,'-1':0};
 if(AW4){R.pedOn=Math.random()<(hard?.4:.25);R.A=[mkA('O',-4.5)];if(hard){R.A.push(mkA('L',-8));R.A.push(mkA('Rt',1.5))}}      /* 对面左转车比你早约 4 秒停下；困难：左边直行车更早到，右边直行车等你停稳后才开到路口（明显比你晚） */
 mine.visible=view===2;R.sig=null;$('sg').style.display='none';banner('Maple Dr 往北','');mk();$('sp').textContent='40'}
// ---------- 四面停牌：其他车 ----------
const SZ0=AW4?SL-.3-FR:-(SW1+.3+FR);      // 横路的车停下时车中心的位置（车头在人行道前）
function mkA(k,off){const Rr=8.3;let pts;
 if(k==='O'){pts=[[-XL,140],[-XL,6.3]];for(let i=1;i<=24;i++){const a=i/24*Math.PI/2;pts.push([-XL+Rr-Rr*Math.cos(a),6.3-Rr*Math.sin(a)])}pts.push([140,ZE])}      // 对面往南、左转往东
 else if(k==='L')pts=[[-140,ZE],[140,ZE]];else pts=[[140,ZWB],[-140,ZWB]];
 const P=path(pts),stopAt=k==='O'?(()=>{for(let u=0;u<P.len;u+=.05)if(P(u)[1]<=-SL+.3+FR)return u})():(()=>{for(let u=0;u<P.len;u+=.05)if(Math.abs(P(u)[0])<=-SZ0)return u})();
 const c=car(C[[2,4,6,8][Math.random()*4|0]]);live.push(c);
 return{k,c,P,u:Math.max(0,stopAt-(k==='Rt'?58:k==='O'?34:22)),v:k==='Rt'?11:10,st:'app',off,stopAt,tStop:null}}      // 先到的车从更远处出发，才来得及明显比你早停下
// 你的车头还要多久开到 F（按平常的开法：离人行横道 25 米以外 40 km/h，以内 20 km/h）
function tTo(F){const fz=front();if(F<=fz||R.everStop)return 0;let t=0;const k=SL-25;if(fz<k){t+=(Math.min(F,k)-fz)/11.1}if(F>k)t+=(F-Math.max(fz,k))/5.6;return t}
// 你还要多久停下（按平常的开法估计）
function tPlayer(){if(R.everStop)return 0;if(R.stopReq&&R.stopT!=null)return R.v/(R.stopA||5)+.3;const d=SL-front();return d>25?(d-25)/11.1+25/5.6+.6:Math.max(0,d)/5.6+.6}
const bc4=b=>{const s=Math.sin(b[2]),c=Math.cos(b[2]);return[[1,1],[1,-1],[-1,1],[-1,-1]].map(([f,l])=>[b[0]+s*b[3]*f+c*b[4]*l,b[1]+c*b[3]*f-s*b[4]*l])};
const inBoxP=(x,z)=>Math.abs(x)<RW+.6&&Math.abs(z)<RW+.6;
function meIn(){const p=me();return bc4([p[0],p[1],p[2],2.3,.95]).some(q=>inBoxP(q[0],q[1]))}
function aIn(a){const q=a.P(a.u);return bc4([q[0],q[1],q[2],2.3,.95]).some(r=>inBoxP(r[0],r[1]))}
const cleared=a=>a.st==='gone'||(a.st==='go'&&!aIn(a)&&a.u>a.stopAt+12);
// 轮到谁：先停稳的先走（你也在里面，用你第一次停稳的时间）
const RANK={Rt:0,L:1,P:2,O:3};      // 同时停下时谁先走：右边来的先走；左转的让直行的
const bef=(bt,bk,at,ak)=>bt<at-.05||(Math.abs(bt-at)<=.05&&RANK[bk]<RANK[ak]);
function myTurn(){const tm=R.stop1;if(tm==null)return false;return R.A.every(a=>a.tStop==null||!bef(a.tStop,a.k,tm,'P')||cleared(a))}
function aStep(dt){const t=R.t,p=me();
 R.A.forEach(a=>{if(a.st==='gone')return;let vt=a.v;
  if(a.st==='app'){const dA=a.stopAt-a.u,tA=tPlayer()+a.off;      /* 按你大概什么时候停下来安排：对面左转车比你早约 2 秒停稳；左边的车更早；右边的车比你晚到约 2 秒 */vt=Math.max(2,Math.min(16,dA/Math.max(.6,tA)));vt=Math.min(vt,Math.sqrt(2*3.2*Math.max(0,dA)));
   if(a.k==='Rt'&&R.stop1==null)vt=Math.min(vt,Math.sqrt(2*3.2*Math.max(0,dA-10)));      /* 右边的车：你还没停稳，它就在 10 米外慢下来；你停稳以后约 3 秒它才停到停车线，先后很明显 */
   if(dA<.05){a.u=a.stopAt;vt=0;if(a.v<.15){a.st='stop';a.tStop=t;a.v=0}}}
  else if(a.st==='stop'){vt=0;
   const earlier=R.A.filter(b=>b!==a&&b.tStop!=null&&bef(b.tStop,b.k,a.tStop,a.k)&&!cleared(b)).length===0,meDone=R.mode==='turn'&&me()[1]>RW+3,meFirst=R.stop1!=null&&bef(R.stop1,'P',a.tStop,a.k)&&!meDone,busy=R.A.some(b=>b!==a&&b.st==='go'&&!cleared(b))||meIn();
   const fed=meFirst&&a.k==='Rt'&&R.myTurnT!=null&&t-R.myTurnT>6;      /* 轮到你了你一直不走：右边的车等了 6 秒以后就先走了 */
   if(earlier&&(!meFirst||fed)&&!busy){a.rdy=a.rdy||t;if(t-a.rdy>1.1){a.st='go';if(fed)a.fed=true}}else a.rdy=null}
  else if(a.st==='go'){vt=aIn(a)?7:11;const q=a.P(a.u+3),blk=obbHit([q[0],q[1],q[2],2.4,1],[p[0],p[1],p[2],2.3,.95]);if(blk){vt=0;if(!a.hk&&R.v>.2){a.hk=1;honk()}}
   if(a.u>a.P.len-3||Math.abs(a.P(a.u)[0])>130||a.P(a.u)[1]<-130){a.st='gone';a.c.visible=false}}
  a.v=a.v>vt?Math.max(vt,a.v-6*dt):Math.min(vt,a.v+2.2*dt);a.u+=a.v*dt;
  {const q=a.P(a.u);for(let k=0;k<30&&obbHit([q[0],q[1],q[2],2.3,.95],[p[0],p[1],p[2],2.3,.95]);k++){a.u-=.1;a.v=0}}})      /* 无论如何不会开进你的车里 */
 // 轮到你的时刻
 if(R.myTurnT==null&&R.mode!=='turn'&&R.stopped&&myTurn())R.myTurnT=t;
 if(R.myTurnT!=null&&R.mode!=='turn'&&R.stopped&&!pedNear()&&R.lookL>R.lastStop&&R.lookR>R.lastStop&&t-R.myTurnT>6&&!R.A.some(a=>a.fed))ev('waitTurn')}
function banner(t,col,big){const b=$('bn');b.textContent=t;b.style.color=col||'';if(big){const e=$('cf');e.textContent=t;e.classList.remove('go');void e.offsetWidth;e.classList.add('go')}}
function flash(t){const f=$('fl');f.textContent=t;f.style.opacity=1;clearTimeout(flash.h);flash.h=setTimeout(()=>f.style.opacity=0,1800)}
function mk(){const on={sig:!!R.sig,lookL:R.look<0,lookR:R.look>0,stop:R.stopReq&&R.mode!=='turn',creep:R.creep,go:R.mode==='turn'};document.querySelectorAll('.b').forEach(b=>b.classList.toggle('on',!!on[b.dataset.m]))}
// 你的位置
function me(){if(R.mode==='turn'){const q=R.turnP(Math.min(R.u,R.turnP.len-.01));return[q[0],q[1],q[2]]}return[XL,R.z,0]}
const front=()=>R.z+FR;
let SNC=null;
let SNR=null;function snap(fc){try{const cvs=ren.domElement,W=360,H=240;if(!cvs.width)return null;if(!SNC)SNC=new T.PerspectiveCamera(45,1,1,400);SNC.aspect=cvs.width/cvs.height;SNC.updateProjectionMatrix();
 const p=me(),cx=fc?(p[0]+fc[0])/2:p[0]*.5,cz=fc?(p[1]+fc[1])/2:p[1]*.5,hh=fc?Math.max(62,Math.hypot(fc[0]-p[0],fc[1]-p[1])*1.15+18):62;SNC.position.set(-cx,hh,cz-1);SNC.up.set(0,0,1);SNC.lookAt(-cx,0,cz);      /* 有关的车也要拍进去 */if(!SNR){SNR=new T.Mesh(new T.RingGeometry(3.6,4.6,32),new T.MeshBasicMaterial({color:0xff2a2a,side:T.DoubleSide,depthTest:false}));SNR.rotation.x=-Math.PI/2;SNR.renderOrder=9;scene.add(SNR)}SNR.visible=!!fc;if(fc)SNR.position.set(-fc[0],.4,fc[1]);      /* 红圈：就是这辆车 */
 const vc=cockpit.visible,vm=mine.visible;cockpit.visible=false;mine.visible=true;placeMine();ren.render(scene,SNC);cockpit.visible=vc;mine.visible=vm;SNR.visible=false;
 const c2=document.createElement('canvas');c2.width=W;c2.height=H;const sw=Math.min(cvs.width,cvs.height*W/H),sh=sw*H/W;c2.getContext('2d').drawImage(cvs,(cvs.width-sw)/2,(cvs.height-sh)/2,sw,sh,0,0,W,H);return c2.toDataURL('image/jpeg',.82)}catch(e){return null}}
function ev(key,o){o=o||{};if(R.ev.some(e=>e.key===key))return;const t=TXT[key];R.ev.push({key,title:t[0],text:t[1]+(o.add||''),img:snap(o.focus)});flash(t[0])}
// ---------- 视线：从你眼睛到横路上的一点，有没有被路边停的车挡住 ----------
function eye(){const p=me();return[p[0]-.38*Math.cos(p[2])+Math.sin(p[2])*.2,p[1]+Math.sin(p[2])*.38-Math.cos(p[2])*.2]}      // 驾驶座（左边）
function segRect(ax,az,bx,bz,cx,cz,hx,hz){let t0=0,t1=1;const dx=bx-ax,dz=bz-az;for(const [p,q] of [[-dx,ax-(cx-hx)],[dx,(cx+hx)-ax],[-dz,az-(cz-hz)],[dz,(cz+hz)-az]]){if(p===0){if(q<0)return false}else{const r=q/p;if(p<0){if(r>t1)return false;if(r>t0)t0=r}else{if(r<t0)return false;if(r<t1)t1=r}}}return true}
function seen(x,z){const e=eye();return!OBST.some(p=>segRect(e[0],e[1],x,z,p[0],p[1],p[2],p[3]))}
const LIM=()=>-RW-.05,blind=()=>sightL()<50||sightR()<50;      /* 前移最远：车头到横路的路边（不能进入横路）；两边都能看到 50 米以上才算看清 */
// 能看多远：左边（往东车道，从西边来）、右边（往西车道，从东边来）
function sightL(){const z=ZE;for(let d=10;d<=90;d+=5)if(!seen(-d,z))return d-5;return 90}
function sightR(){for(let d=10;d<=90;d+=5)if(!seen(d,ZWB)&&!seen(d,ZE))return d-5;return 90}
// 行人在你车前的人行横道上（或马上要走上来）
function pedNear(){const P=R.ped;if(!P||P.z<front()-.6)return false;return Math.abs(P.x)<RW+.3||(P.dir>0?P.x>-RW-6&&P.x<-RW:P.x<RW+6&&P.x>RW)}      /* 还在路面上（路缘以内），或离路边不到 6 米、正走过来；已经走上对面人行道的不算 */
const pedEv=()=>{const P=R.ped;ev('pedYield',P?{focus:[P.x,P.z],add:'（红圈是那位行人）'}:{})};
// ---------- 转弯路线：从你现在的位置直走到转弯点，再左转进往西车道 ----------
function turnPath(){if(AW4){const P0=path([[XL,R.z],[XL,160]]);const f=u=>[XL,R.z+u,0];f.len=P0.len;f.arcEnd=0;return f}const zc=R.z,zs=Math.max(zc,-6.3),Rr=ZWB-zs,pts=[[XL,zc]];if(zs>zc+.3)pts.push([XL,zs]);
 for(let i=1;i<=24;i++){const a=i/24*Math.PI/2;pts.push([XL-Rr+Rr*Math.cos(a),zs+Rr*Math.sin(a)])}pts.push([-90,ZWB]);
 const P0=path(pts),f=u=>{const a=P0(u),b=P0(Math.max(0,u-1)),c=P0(Math.min(P0.len-.01,u+1));return[a[0],a[1],Math.atan2(c[0]-b[0],c[1]-b[1])]};f.len=P0.len;f.arcEnd=(zs>zc+.3?zs-zc:0)+Rr*Math.PI/2;return f}
// 预测：如果现在开始转，接下来 8 秒会不会和横路的车冲突
//  · 横穿它的车道时：它不减速，开到你刚离开的地方，时间差不到 1.2 秒，就算抢行（不安全）
//  · 并进它的车道、在它前面开时：它要用超过 4 m/s² 的力度刹车才不追尾，就算不安全（它会按实际情况减速跟车）
function predict(){const P=turnPath();let u=0,v=Math.max(R.v,0),res=null;
 const cars=R.cars.map(c=>({o:c,x:c.x,z:c.z,dir:c.dir,v:c.cv,x0:c.x}));
 for(let t=0;t<8&&!res;t+=.1){const vt=u<P.arcEnd?6:11;v=Math.min(vt,v+2.2*.1);u+=v*.1;const q=P(Math.min(u,P.len-.01)),me=[q[0],q[1],q[2],2.3,.95];
  for(const c of cars){const ch=c.dir>0?Math.PI/2:-Math.PI/2,same=Math.sin(q[2])*c.dir>.7,g=(q[0]-c.x)*c.dir-4.6;let bad=false;
   if(same){if(g>-1&&g<45&&Math.abs(q[1]-c.z)<1.6){const ov=v,cl=Math.max(0,c.v-ov),dec=cl*cl/(2*Math.max(.5,g-3));if(dec>4)bad=true;
      const need=ov+Math.sqrt(2*6*Math.max(0,g-3));if(need<c.v)c.v=Math.max(need,c.v-.6)}}
   else{const ext=c.v*1.2;bad=Math.abs(c.x-q[0])<ext+8&&obbHit(me,[c.x+c.dir*ext/2,c.z,ch,2.3+ext/2,.95])}
   if(!bad)bad=Math.abs(c.x-q[0])<6&&obbHit(me,[c.x,c.z,ch,2.3,.95]);
   c.x+=c.dir*c.v*.1;
   if(bad){res={why:c.dir>0?'unsafeL':'unsafeR',x:c.x0,z:c.z,dist:Math.abs(c.x0-XL),kmh:Math.round(c.o.cv*3.6)};break}}}
 return res}
// ---------- 按钮 ----------
function cmd(m){if(!R||R.over||!playing)return;
 if(m==='sig'){R.sig=R.sig?null:'L';if(R.sig){R.sigT=R.t;if(R.sigZ==null)R.sigZ=front();tick(true)}$('sg').style.display=R.sig?'block':'none';mk();return}
 if(m==='lookL'||m==='lookR'){R.look=m==='lookL'?-1:1;R.lookT=R.t;mk();return}
 if(R.mode==='turn')return;
 if(m==='stop'){if(!R.stopReq&&!R.stopped&&!R.creep){const fz=front(),tg=SL-.3,dA=tg-fz;      /* 和红灯停车一样：来得及就正好停在人行横道前，来不及就就地急停 */
   if(dA>R.v*R.v/(2*5)+.2){R.stopT=tg;R.stopA=5}else{R.stopT=fz+R.v*R.v/14;R.stopA=7}}
  R.stopReq=true;R.creep=false;mk();return}
 if(m==='creep'){if(R.v<.2&&R.stopped){if(pedNear())pedEv();R.creep=true;R.stopReq=false;mk()}else if(!R.stopped)flash('先停车，再前移');return}
 if(m==='go')startTurn()}
function cmdUp(m){if(!R)return;if((m==='lookL'&&R.look<0)||(m==='lookR'&&R.look>0)){R.lookUp=R.t;mk()}if(m==='creep'&&R.creep){R.creep=false;R.stopReq=true;mk()}}
addEventListener('keydown',e=>{if(e.repeat)return;const k={ArrowLeft:'lookL',ArrowRight:'lookR',s:'stop',c:'creep',g:'go',l:'sig'}[e.key];if(k)cmd(k)});
addEventListener('keyup',e=>{const k={ArrowLeft:'lookL',ArrowRight:'lookR',c:'creep'}[e.key];if(k)cmdUp(k)});
function startTurn(){const t=R.t;if(pedNear())pedEv();
 if(AW4){if(!R.everStop)ev('noStop');if(R.sig)ev('sigStraight');if(!(R.lookL>R.lastStop&&R.lookR>R.lastStop))ev('noLook');
  if(!myTurn()||R.A.some(a=>a.st==='go'&&aIn(a))){const a=R.A.find(b=>b.st!=='gone'&&!cleared(b));ev('yield4',a?{focus:a.P(a.u),add:'（红圈是那辆比你先停下的车）'}:{})}
  R.turnP=turnPath();R.u=0;R.mode='turn';R.stopReq=false;R.creep=false;mk();banner('直行','');return}
 if(!R.everStop)ev('noStop');
 if(!R.sig)ev('noSig');
 if(!(R.lookL>R.lastStop&&R.lookR>R.lastStop))ev('noLook');
 if(blind())ev('blindGo');
 const pr=predict();if(pr)ev(pr.why,{focus:[pr.x,pr.z],add:`（当时这辆车离路口约 ${Math.round(pr.dist)} 米，车速约 ${pr.kmh} km/h，约 ${(pr.dist/Math.max(1,pr.kmh/3.6)).toFixed(1)} 秒就到）`});
 R.turnP=turnPath();R.u=0;R.mode='turn';R.stopReq=false;R.creep=false;mk();banner('左转','')}
// ---------- 每一帧 ----------
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;const t=R.t;
 if(!R.b0&&t>=.6){R.b0=1;banner(AW4?'考官：前面停牌路口直行':'考官：前面停牌路口左转','#ffe27a',1)}
 const fz=front();
 if(R.mode!=='turn'){
  // 车速：平常 40；离人行横道 25 米内自己慢到 20 左右（准备停车）；按停车就停；前移时很慢
  let vt=fz<SL-25?11.1:5.6;
  if(R.stopReq){if(R.stopT!=null){const dS=R.stopT-fz;vt=dS>.05?Math.min(vt,Math.sqrt(2*R.stopA*dS)):0}else vt=0}if(R.creep)vt=1.3;if(R.stopped&&!R.creep)vt=0;
  // 一直不停车：冲过人行横道时算严重错误，系统帮你在路边停下
  if(!R.everStop&&!R.stopReq&&fz>SL+.3&&R.v>.5&&!R.ns){R.ns=1;ev('noStop');R.stopReq=true;R.stopT=fz+R.v*R.v/14;R.stopA=7}      /* 按了停车、正在刹车的不算没停：停在哪里再判断位置 */
  const lim=LIM();      // 前移最远到这里（再往前就进了横路的车道）
  if(fz>lim-.2&&(R.creep||!R.stopReq)){vt=0;if(R.creep){R.creep=false;R.stopReq=true;flash('已经到横路边上了，不能再往前');mk()}}
  if(fz>lim-3&&!R.stopReq&&!R.creep&&!R.stopped)vt=Math.min(vt,Math.sqrt(2*4*Math.max(0,lim-fz)));
  const a=R.v>vt?(R.stopReq?(R.stopT!=null?(R.stopA||4)+1:4):2.5):1.5;R.v=R.v>vt?Math.max(vt,R.v-a*dt):Math.min(vt,R.v+a*dt);
  R.z+=R.v*dt;
  // 停稳
  if(R.v<.05&&!R.stopped&&R.stopReq){R.stopT=null;R.stopped=true;if(R.stop1==null)R.stop1=t;R.everStop=true;R.lastStop=t;R.v=0;
   if(R.firstStop){R.firstStop=false;if(!R.ns){if(fz>SL+.3)ev('stopOnCross');else if(fz<SL-3)ev('stopFar')}banner(AW4?'停稳了：看左、看右，先停下的车先走':'停稳了：看左、看右；看不清就前移','#ffe27a')}}
  if(R.creep&&R.v>.1)R.stopped=false;
  if(R.sig&&R.sigZ!=null&&!R.ls&&R.sigZ>SL-15){R.ls=1;ev('lateSig')}
  // 有安全空档、看得清、两边都看过，却一直不走
  if(!AW4&&R.stopped&&((t*4|0)!==(R.lastP||0))){R.lastP=t*4|0;const ok=!pedNear()&&!predict()&&!blind()&&R.lookL>R.lastStop&&R.lookR>R.lastStop;R.safeT=ok?R.safeT+.25:R.safeT;if(R.safeT>10)ev('hesitate')}
 }else{const P=R.turnP;let vt=R.u<P.arcEnd?6:(AW4&&meIn()?7:11);if(AW4){const p0=me();R.A.forEach(a=>{if(a.st==='gone')return;const q=a.P(a.u);if(obbHit([p0[0],p0[1]+2.5,0,2.4,1],[q[0],q[1],q[2],2.3,.95]))vt=0})}      /* 你直行时前面有车挡着：先停（不会穿过去） */
  R.v=vt<R.v?Math.max(vt,R.v-7*dt):Math.min(vt,R.v+2.2*dt);R.u+=R.v*dt;if(AW4?me()[1]>40:me()[0]<-45){finish();return}}
 // 看左／看右：按住一直看，点一下也会看一眼（至少 0.6 秒）
 if(R.look&&R.lookUp>=R.lookT&&t-R.lookT>.6){R.look=0;mk()}
 const yt=R.look*1.25;R.yaw+=(yt-R.yaw)*Math.min(1,dt*7);if(R.yaw<-1)R.lookL=t;if(R.yaw>1)R.lookR=t;
 // 横路的车：跟前车；你挡在它车道上就刹车、按喇叭
 // 行人：车头离人行横道 35 米时出现，正好在你停下来前后走到你车前
 if(R.pedOn&&!R.ped&&fz>CW0-35){const dir=Math.random()<.5?1:-1,o=ped(PCOL[Math.random()*5|0]);live.push(o);scene.add(o);R.ped={o,dir,x:-dir*(RW+9+Math.random()*4),v:1.25+Math.random()*.3,ph:0}}
 if(R.ped){const P=R.ped,blk=fz>CW0+.3&&R.mode!=='turn'&&Math.abs(P.x-XL)<4.5;const zt=blk?(fz<-4.8?fz+.9:fz-2*FR-1.1):(CW0+CW1)/2;      /* 车停在人行横道上：行人只好从车头前面绕过去（你确实挡住了他）；车已经挪到横路边上时，从车后面绕 */P.z=P.z==null?zt:P.z+Math.max(-1.2*dt,Math.min(1.2*dt,zt-P.z));P.x+=P.dir*P.v*dt;      P.ph+=dt*P.v*4.2;const sw=Math.sin(P.ph)*.5;P.o.userData.l.rotation.x=sw;P.o.userData.r.rotation.x=-sw;P.o.userData.al.rotation.x=-sw*.8;P.o.userData.ar.rotation.x=sw*.8;
  place(P.o,P.x,P.z,P.dir>0?Math.PI/2:-Math.PI/2,.12);if(Math.abs(P.x)>60){scene.remove(P.o);R.ped=null;R.pedOn=false}
  if(R.mode!=='turn'&&R.v>.3&&fz>CW0-.2&&Math.abs(P.x-XL)<2.6&&P.z>fz-1.5)pedEv()}      /* 开着车压到正在你车前走的行人前面 */
 if(AW4)aStep(dt);
 const p=me();
 R.cars.forEach(c=>{if(c.crash){c.cv*=Math.max(0,1-3*dt);c.x+=c.dir*c.cv*dt;return}let vt=c.v;
  R.cars.forEach(o=>{if(o===c||o.dir!==c.dir)return;const g=(o.x-c.x)*c.dir-4.6;if(g>-1&&g<60)vt=Math.min(vt,Math.sqrt(o.cv*o.cv+2*4*Math.max(0,g-6)))});
  const g=(p[0]-c.x)*c.dir-4.6;if(g>-1&&g<45&&Math.abs(p[1]-c.z)<2.4){const need=Math.sqrt(Math.max(0,2*6*Math.max(0,g-3)));if(need<vt){if((c.cv*c.cv)/(2*Math.max(.5,g-3))>3&&!c.hk){c.hk=true;honk()}vt=need}}
  c.cv=c.cv>vt?Math.max(vt,c.cv-7*dt):Math.min(vt,c.cv+1.8*dt);c.x+=c.dir*c.cv*dt;
  if(c.dir>0&&c.x>240)Object.assign(c,{x:-240-Math.random()*60,hk:false});if(c.dir<0&&c.x<-240)Object.assign(c,{x:240+Math.random()*60,hk:false})});
 // 相撞
 if(!R.crash){const mm=[p[0],p[1],p[2],2.3,.95];const H=R.cars.find(c=>Math.abs(c.x-p[0])<8&&Math.abs(c.z-p[1])<6&&obbHit(mm,[c.x,c.z,c.dir>0?Math.PI/2:-Math.PI/2,2.3,.95]));
  if(H){if(H.dir){H.crash=true;H.spin=.3}R.crash={t};R.v=0;crashSnd();ev('crash')}
  if(AW4&&!R.crash){const A=R.A.find(a=>{if(a.st==='gone')return false;const q=a.P(a.u);return obbHit(mm,[q[0],q[1],q[2],2.3,.95])});if(A){R.crash={t};R.v=0;A.v=0;A.st='gone2';crashSnd();ev('crash')}}}
 if(R.crash){R.v=0;if(t-R.crash.t>2.5){finish();return}}}
function finish(){if(R.over)return;R.over=true;R.sig=null;$('sg').style.display='none';const o=$('ov');let h;
 if(!R.ev.length)h='<h2>驾驶总结</h2><div class="st">★★★</div><p>'+(AW4?'在人行横道前完全停车，看了左右，让比你先停下的车先走，轮到你时果断直行通过，做得很好。':'提前打灯，在人行横道前完全停车，看清左右（看不清时前移再看），找到两边都安全的空档果断左转，做得很好。')+'</p>';
 else h='<h2>驾驶总结</h2><p>这一趟有 '+R.ev.length+' 处需要注意：</p><div class="cards">'+R.ev.map(e=>`<div class="card">${e.img?`<img src="${e.img}">`:''}<b>${e.title}${SER.includes(e.key)?'<span class="tag s">严重</span>':'<span class="tag">扣分项</span>'}</b><span>${e.text}</span></div>`).join('')+'</div>';
 o.innerHTML=`<div class="pn">${h}<br><button id="again">再来一次</button> <button id="home" style="background:#6b7280">回到首页</button></div>`;o.style.display='flex';
 $('again').onclick=()=>{o.style.display='none';newRun(true);playing=true};$('home').onclick=()=>{o.innerHTML=HOME;o.style.display='flex';bindHome()}}
// ================= 渲染循环 =================
let last=0,fovH=100;
MRL.rt.setSize(512,256);MRR.rt.setSize(512,256);
{const vf=h=>2*Math.atan(Math.tan(h/2*Math.PI/180)/2)*180/Math.PI;MRL.c.fov=vf(16);MRL.dir.set(Math.sin(7*Math.PI/180),-.03,-1).normalize();MRR.c.fov=vf(24);MRR.dir.set(-Math.sin(11*Math.PI/180),-.03,-1).normalize();[MRL,MRR].forEach(m=>m.c.updateProjectionMatrix())}
function placeMine(){const p=me();place(mine,p[0],p[1],p[2],0);mine.userData.bl.forEach(m=>{m.position.x=.88})}
function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;step(dt);const bl=Math.sin(ts/1000*15)>0;const p=me();
 R.cars.forEach(c=>{place(c.c,c.x,c.z,(c.dir>0?Math.PI/2:-Math.PI/2)+(c.spin||0),0);c.c.visible=Math.abs(c.x)<260});
 if(AW4)R.A.forEach(a=>{const q=a.P(a.u);place(a.c,q[0],q[1],q[2],0);if(a.st==='gone')a.c.visible=false;if(a.k==='O')a.c.userData.bl.forEach(m=>m.visible=bl&&a.st!=='gone'&&a.u<a.stopAt+16)});
 placeMine();mine.userData.bl.forEach(m=>m.visible=!!R.sig&&bl);
 sun.target.position.set(-p[0],0,p[1]);sun.position.set(-p[0]+60,90,p[1]-40);if(!sun.target.parent)scene.add(sun.target);
 if(R.sig&&playing&&!R.over){const on=Math.sin(ts/1000*9.4)>0;$('sg').style.opacity=on?1:.15;if(on!==loop.sgOn){loop.sgOn=on;tick(on)}}
 const q=p;
 if(view===1){const h=q[2]+R.yaw+yawD,L=10;cam.fov=Math.min(105,2*Math.atan(Math.tan(fovH*Math.PI/360)/cam.aspect)*180/Math.PI);cam.updateProjectionMatrix();
  const ox=.38*Math.cos(q[2]),oz=.38*Math.sin(q[2]),bx0=-q[0]+Math.sin(q[2])*.2,bz0=q[1]-Math.cos(q[2])*.2;const sk=R.crash&&R.t-R.crash.t<.7?(1-(R.t-R.crash.t)/.7)*.12:0;
  cam.position.set(bx0+ox+(Math.random()-.5)*sk,1.25+(Math.random()-.5)*sk,bz0+oz+(Math.random()-.5)*sk);
  cam.lookAt(-q[0]-Math.sin(h)*L+ox,1.25+L*.05,q[1]+Math.cos(h)*L+oz);
  cockpit.visible=true;cockpit.position.set(bx0,1.25,bz0);cockpit.rotation.order='YXZ';cockpit.rotation.y=-q[2];cockpit.rotation.x=0;
  const dh=normA(q[2]-lastH)/Math.max(dt,.001);lastH=q[2];wheel.rotation.z+=((Math.max(-2.6,Math.min(2.6,dh*2.4)))-wheel.rotation.z)*Math.min(1,dt*10)}
 else{cockpit.visible=false;if(cam.fov!==50){cam.fov=50;cam.updateProjectionMatrix()}cam.position.set(0,62,-16);cam.lookAt(0,0,-2)}      /* 俯视：固定在路口上方 */
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
