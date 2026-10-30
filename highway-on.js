// ============================================================
// highway-on.js — 项目：上高速（「换线」那条城市道路往前开 → 右边多出匝道车道，系统换进去 → 匝道（建议 50）→ 加速车道提速 → 找空档并入 401）
// ============================================================
// 道路、标线、路边都来自 lib/road2.js（和换线同一条路）；lib/hwy-opt.js 在路的右边加出匝道车道，并在前方挖出高速路堑，城市道路平着从上面跨过去
// 路线坐标 (x,z)：x 向右（东）为正，z 向北为正；画到场景里是 (-x, y, z)
const VR=13.9,VF=27.8;      // 50、100 km/h
const H=ROADOPT.hwy,ZDIV=H.ZD,ZA=H.ZA,DY=0;      // 高速、匝道和地面在同一个平面
const ZF1=ZA+3.75,ZF2=ZA+7.5,ZF3=ZA+11.25,ZMED=ZA+15.7,ZW1=ZA+20.15,ZW2=ZA+23.9,ZW3=ZA+27.65;      // 高速往东三条车道（右、中、左），中间隔离墙，往西三条
const XL0=8.85,RX=14,RR=55,XC=RX+RR,ZC=ZA-RR,XSOL=XC+60,XEND=XC+300,XTAP=XEND+60;      // 匝道车道中心 x=8.85；分出后到 x=14 往北，再右转（半径 55）；加速车道：实线到 XSOL，虚线到 XEND，再 60 米收窄
// 你的路线 P：匝道车道 → 分出匝道 → 弯道（顺着坡往下）→ 加速车道 → 高速右道旁边一直往东。你从右车道出发（P 往左偏 3.6 米），系统自动换进匝道车道
const PP=[[XL0,-700],[XL0,ZDIV],...Array.from({length:60},(_,i)=>{const z=ZDIV+(i+1)/60*50;return[XL0+(RX-XL0)*ss(ZDIV,ZDIV+50,z),z]}),[RX,ZC],
 ...Array.from({length:180},(_,i)=>{const f=(i+1)/180*Math.PI/2;return[XC-RR*Math.cos(f),ZC+RR*Math.sin(f)]}),[1800,ZA]];
const P0=path(PP),P=u=>{const a=P0(u),b=P0(Math.max(0,u-1.5)),c=P0(Math.min(P0.len-.01,u+1.5));return[a[0],a[1],Math.atan2(c[0]-b[0],c[1]-b[1])]};P.len=P0.len;      // 车头方向用前后 1.5 米的平均：转弯时方向盘平稳
const uAtZ=z=>{for(let u=0;u<P.len;u+=.1)if(P(u)[1]>=z)return u;return P.len},uAtX=x=>{for(let u=0;u<P.len;u+=.1){const q=P(u);if(q[1]>ZA-.5&&q[0]>=x)return u}return P.len};
const UDIV=uAtZ(ZDIV),UARC0=uAtZ(ZC),UARC1=uAtX(XC+.05);
const yR=z=>0;
const ASP=M(0x6e6e76,{side:T.DoubleSide}),SHO=M(0x8d8d92,{side:T.DoubleSide}),WL=BM(WH),YL=BM(0xf2c12e),CON=M(0xb5b7bb);
// 匝道：左边黄色实线、右边白色实线
{const YF=(x,z)=>yR(z),k=u=>ss(UDIV,UDIV+40,u),k2=u=>ss(UARC1-40,UARC1,u),L=u=>1.7+.55*k(u)-.375*k2(u),Rt=u=>-(1.65+.6*k(u)-.375*k2(u));      /* 弯道结束前 40 米再慢慢收到加速车道的宽度（3.75 米） */      /* 分岔口的匝道宽度和匝道车道一样，40 米内慢慢放宽，路面不会错开 */
 strip(P,UDIV,UARC1,Rt,L,.07,ASP,YF);strip(P,UDIV,UARC1,u=>L(u)-.15*k(u)-.05,u=>L(u)+.15*(1-k(u))-.05,.09,YL,YF);strip(P,UDIV,UARC1,u=>Rt(u)+.05,u=>Rt(u)+.2,.09,WL,YF);strip(P,UDIV,UARC1,u=>Rt(u)-.3,Rt,.17,M(0xb9bbc0,{side:T.DoubleSide}),YF)}      // 匝道右边接着有路缘
// 高速（东西向，和地面同一个平面，城市道路从上面的桥跨过去）：往东两条车道 + 加速车道，往西两条车道，路肩，中间隔离墙
{const Y=-DY,EL=u=>[u-600,0,Math.PI/2];EL.len=2200;
 const Z=z=>u=>{const q=EL(u);return[q[0],z,q[2]]},o=x=>x+600;
 const band=(z0,z1,mat,y)=>strip(Z((z0+z1)/2),0,2200,-(z1-z0)/2,(z1-z0)/2,Y+y,mat);
 band(ZA+1.875,ZA+13.125,ASP,.03);band(ZA+13.125,ZA+15.1,SHO,.025);band(ZA+16.3,ZA+18.275,SHO,.025);band(ZA+18.275,ZA+29.525,ASP,.03);band(ZA+29.525,ZA+32,SHO,.025);      // 往东三条、左路肩；往西左路肩、三条、右路肩
 band(ZA-4.5,ZA+1.875,SHO,.02);
 strip(Z(ZA),o(XC),o(XEND),-1.875,1.875,Y+.031,ASP);
 {const T0=o(XEND),T1=o(XTAP);strip(Z(ZA),T0,T1,u=>-1.875+3.75*(u-T0)/(T1-T0),1.875,Y+.032,ASP)}
 strip(line(XEND,ZA-1.8,XTAP,ZA+1.8),0,Math.hypot(60,3.6),-.08,.08,Y+.06,WL);
 for(let x=-600;x<1600;x+=100){const w=new T.Mesh(new T.BoxGeometry(100,.85,.5),CON);w.position.set(-(x+50),Y+.425,ZMED);scene.add(w)}      // 隔离墙
 // 标线：往东左边黄线、车道之间虚线；加速车道和右道之间：先实线后虚线，虚线一直画到加速车道收窄的尽头
 strip(Z(ZA+13.05),0,2200,-.08,.08,Y+.06,YL);dashes(Z(ZA+5.625),0,2200,0,.2,Y+.06,WL,3,9);dashes(Z(ZA+9.375),0,2200,0,.2,Y+.06,WL,3,9);
 strip(Z(ZA+1.875),0,o(XC-60),-.08,.08,Y+.06,WL);strip(Z(ZA+1.875),o(XC-60),o(XSOL),-.1,.1,Y+.06,WL);dashes(Z(ZA+1.875),o(XSOL),o(XTAP),0,.2,Y+.06,WL,1.5,3);
 strip(Z(ZA+1.875),o(XTAP),2200,-.08,.08,Y+.06,WL);strip(Z(ZA-1.8),o(XC),o(XEND),-.08,.08,Y+.06,WL);
 strip(Z(ZA+18.35),0,2200,-.08,.08,Y+.06,YL);dashes(Z(ZA+22.025),0,2200,0,.2,Y+.06,WL,3,9);dashes(Z(ZA+25.775),0,2200,0,.2,Y+.06,WL,3,9);strip(Z(ZA+29.45),0,2200,-.08,.08,Y+.06,WL);
 for(let k=0;k<6;k++){const x=XC-6-k*7;strip(line(x,ZA+1.6,x+3,ZA-1.3),0,4.2,-.25,.25,Y+.065,WL)}}      // 分流三角（匝道和高速之间的白色斜线）
// ---------- 标志牌 ----------
function post(x,z,ry,w,hh,tex,y0,yb){const g=new T.Group(),pm=M(0x8a9099);const n=w>1.6?2:1;for(let i=0;i<n;i++)g.add(mesh(new T.CylinderGeometry(.06,.06,y0+hh,8),pm,n>1?(i?w*.3:-w*.3):0,(y0+hh)/2,.06));
 const f=mesh(new T.PlaneGeometry(w,hh),new T.MeshBasicMaterial({map:tex,transparent:true}),0,y0+hh/2,0);f.rotation.y=Math.PI;g.add(f);
 const b=mesh(new T.PlaneGeometry(w,hh),pm,0,y0+hh/2,.01);g.add(b);g.position.set(-x,yb||0,z);g.rotation.y=ry||0;scene.add(g);return g}
// 绿色高速入口指示牌：401 皇冠盾牌 + EAST + 箭头
const GUIDE=d=>cv(512,320,(x,w,h)=>{x.fillStyle='#0f6b3a';x.fillRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=7;x.strokeRect(10,10,w-20,h-20);
 x.save();x.translate(150,150);x.fillStyle='#fff';x.strokeStyle='#111';x.lineWidth=6;x.beginPath();x.moveTo(-80,-70);x.lineTo(80,-70);x.lineTo(80,10);x.quadraticCurveTo(80,80,0,110);x.quadraticCurveTo(-80,80,-80,10);x.closePath();x.fill();x.stroke();
 x.fillStyle='#111';x.beginPath();x.moveTo(-50,-72);x.lineTo(-48,-100);x.lineTo(-26,-84);x.lineTo(0,-108);x.lineTo(26,-84);x.lineTo(48,-100);x.lineTo(50,-72);x.closePath();x.fill();
 x.font='bold 80px Arial';x.textAlign='center';x.fillText('401',0,40);x.restore();
 x.fillStyle='#fff';x.font='bold 74px Arial';x.textAlign='left';x.fillText('EAST',270,135);x.font='bold 40px Arial';x.fillText('Kingston',272,195);
 x.strokeStyle='#fff';x.lineWidth=14;x.beginPath();if(d==='r'){x.moveTo(330,290);x.lineTo(330,250);x.lineTo(420,250)}else{x.moveTo(380,295);x.lineTo(440,235)}x.stroke();x.fillStyle='#fff';x.beginPath();
 if(d==='r'){x.moveTo(450,250);x.lineTo(415,226);x.lineTo(415,274)}else{x.moveTo(462,213);x.lineTo(420,222);x.lineTo(453,255)}x.fill()});
post(12.4,H.L0-60,0,3.4,2.1,GUIDE('u'),2.2);      // 匝道车道出现之前：401 东 入口
post(15.6,ZDIV-25,0,3.4,2.1,GUIDE('r'),2.2);      // 分岔处（匝道车道右边）
// 黄底黑字建议速度 50 km/h（匝道入口左侧）
const ADV=cv(200,300,(x,w,h)=>{const rr=(a,b,ww,hh,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+ww,b,a+ww,b+hh,r);x.arcTo(a+ww,b+hh,a,b+hh,r);x.arcTo(a,b+hh,a,b,r);x.arcTo(a,b,a+ww,b,r);x.closePath()};
 x.clearRect(0,0,w,h);rr(2,2,w-4,h-4,14);x.fillStyle='#f6c71b';x.fill();x.lineWidth=5;x.strokeStyle='#111';rr(9,9,w-18,h-18,10);x.stroke();
 x.fillStyle='#111';x.fillRect(9,h-76,w-18,67);x.textAlign='center';x.font='bold 140px Arial';x.fillText('50',w/2,170);x.fillStyle='#f6c71b';x.font='bold 50px Arial';x.fillText('km/h',w/2,h-24)});      // 建议速度：黄底黑字 50，下面黑底黄字 km/h
post(9.3,ZDIV+35,.15,.6,.9,ADV,1.6,.11);      // 在城市道路和匝道之间的三角地上（匝道左侧）
// 加速车道牌：黄色菱形（车道并入）＋“300 m”
const MRG=cv(256,370,(x,w,h)=>{x.clearRect(0,0,w,h);x.save();x.translate(128,126);x.rotate(Math.PI/4);x.fillStyle='#f6c71b';x.fillRect(-86,-86,172,172);x.strokeStyle='#111';x.lineWidth=6;x.strokeRect(-80,-80,160,160);x.restore();
 x.fillStyle='#111';x.fillRect(84,64,22,124);      // 左边一条直的车道线
 x.beginPath();x.moveTo(132,64);x.lineTo(152,64);x.lineTo(152,98);x.lineTo(172,128);x.lineTo(172,188);x.lineTo(152,188);x.lineTo(152,132);x.lineTo(132,102);x.closePath();x.fill();      // 右边那条线往左收进来（右车道到头）
 for(let k=0;k<3;k++)x.fillRect(128,128+k*22,12,13);      // 中间虚线
 x.fillStyle='#f6c71b';x.fillRect(52,276,152,80);x.strokeStyle='#111';x.lineWidth=5;x.strokeRect(57,281,142,70);x.fillStyle='#111';x.font='bold 48px Arial';x.textAlign='center';x.fillText('300 m',128,334)});      // 右车道到头（加速车道收窄）＋ 下面黄底黑字 300 m
post(100,ZA-3.6,-Math.PI/2,1.2,1.7,MRG,1.2,-DY);
// 高速限速牌：白底黑字 MAXIMUM 110，下面黑底白字 km/h
{const t=cv(200,300,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#111';x.lineWidth=6;x.strokeRect(8,8,w-16,h-16);x.fillStyle='#111';x.textAlign='center';x.font='bold 40px Arial';x.fillText('MAXIMUM',w/2,62);
  x.font='bold 120px Arial';x.fillText('110',w/2,190);x.fillRect(8,h-70,w-16,62);x.fillStyle='#fff';x.font='bold 46px Arial';x.fillText('km/h',w/2,h-22)});
 [480,1000].forEach(x=>post(x,ZA-5.2,-Math.PI/2,1.0,1.5,t,1.6,-DY))}
BB1.visible=BB2.visible=false;      // 这个场景不放广告牌
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
 missRamp:["没有换进匝道车道，错过了高速入口","去高速的匝道车道是右边多出来的那条车道。看到它出现后，要按 SMOG 尽早换进去；到了分岔口还在原来的车道，就错过了入口。"],
 solidX:["在实线处就并入高速","加速车道开头一段和高速之间是实线，不能并线。要开到虚线的地方，一边提速一边找空档再并入。"],
 slowMerge:["车速没提上来就并入高速","加速车道就是用来提速的：要把车速提到和高速车流差不多（约 100）再并入。速度太慢就并进去，后面的车要急刹。"],
 noMerge:["加速车道走完了还没并入","加速车道只有约 300 米，要一边提速一边看后视镜和盲点，看到合适的空档就果断并入。走到尽头只能停车，非常危险。"],
 crash:["和旁边的车相撞","换线、并线前一定要看后视镜和回头看盲点，确认有足够的空档。"]};
const SER=['unsafeB','unsafeR','unsafeF','crash','missRamp','noMerge'];
// 其他车：road A＝城市道路（往北，s＝z，lane＝x），F＝高速往东（s＝x，lane＝z），W＝高速往西
function carPos(c){if(c.road==='A')return[c.lane,c.s,c.lane<0?Math.PI:0];if(c.road==='F')return[c.s,c.lane,Math.PI/2];return[c.s,c.lane,-Math.PI/2]}
function add(road,lane,s,v,o){const c=car(C[1+Math.random()*8|0]);live.push(c);const k=Object.assign({c,road,lane,s,vd:v,cv:Math.abs(v)},o||{});R.cars.push(k);return k}
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;
 const Z0=120,u0=uAtZ(Z0);R={t:0,u:u0,d:XL0-LX.R,v:V0,ph:0,sig:null,sigT:-9,mT:{},oT:{},look:null,yaw:0,pit:0,ev:[],over:false,cars:[],lc:null,lastDone:-9,q:[],on:'A',hd:0};
 // 城市道路（和换线一样的两条车道）：你在右车道；左车道的车稍快，右车道前后有车，速度和你一样
 const z0=Z0;[12,48,90,140].forEach(d=>add('A',1.75,z0+d+Math.random()*6,18.06));[-20,-55].forEach(d=>add('A',1.75,z0+d,18.06));
 [55,105].forEach(d=>add('A',5.25,z0+d,V0));[-24,-62].forEach(d=>add('A',5.25,z0+d,V0));
 for(let k=0;k<12;k++)add('A',-1.75-(k%2)*3.5,z0-150+k*60,-V0);      // 对面往南的车
 // 高速往东左道、往西两条：背景车流
 for(let k=0;k<26;k++)add('F',k%2?ZF2:ZF3,-550+k*80+Math.random()*30,(k%2?30.5:32)+Math.random()*2);
 for(let k=0;k<30;k++)add('W',[ZW1,ZW2,ZW3][k%3],-550+k*100+Math.random()*40,-(29+Math.random()*3));
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
const myY=()=>R.mz!=null?Yart(R.mz):0;
const carY=c=>c.road==='A'?Yart(c.s):0;      // 城市道路过了匝道以后升高（立交桥）
const onArt=()=>R.u<UDIV+2,onAcc=()=>R.u>=UARC1;
const other=()=>onArt()?'R':'L';
let SNC=null;
function snap(){try{const cvs=ren.domElement,W=360,H=240;if(!cvs.width)return null;if(!SNC)SNC=new T.PerspectiveCamera(45,1,1,500);SNC.aspect=cvs.width/cvs.height;SNC.updateProjectionMatrix();
 const p=me();SNC.position.set(-p[0],55+myY(),p[1]);SNC.up.set(Math.sin(p[2])*-1,0,Math.cos(p[2]));SNC.lookAt(-p[0],myY(),p[1]);const vc=cockpit.visible,vm=mine.visible;cockpit.visible=false;mine.visible=true;placeMine();ren.render(scene,SNC);cockpit.visible=vc;mine.visible=vm;
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
function targetCars(to){const p=me();if(onArt())return{L:R.cars.filter(c=>c.road==='Q'),S:p[1]};return{L:R.cars.filter(c=>c.road==='F'&&c.lane===ZF1),S:p[0]}}
function startChange(){if(onArt()&&(me()[1]<H.L0+30||R.d<1.8))return;if(!onArt()&&!onAcc())return;      // 城市道路上：匝道车道出现以后，从右车道换进去；匝道弯道上不能换；加速车道上并入高速
 if(onAcc()&&R.d>1)return;      // 已经并进高速了
 const to=other(),t=R.t;
 if(!R.sig)ev('noSig');else if(R.sig!==to)ev('wrongSig');else if(t-R.sigT<3)ev('sigShort');
 if(!(R.mT[to]!=null&&t-R.mT[to]<10))ev('noMirror');
 if(!(R.oT[to]!=null&&t-R.oT[to]<10))ev('noShoulder');else if(t-R.oT[to]>2.5)ev('oldShoulder');
 const T2=targetCars(to),why=gapWhy(T2.L,T2.S);if(why)ev(why);
 if(onAcc()){if(me()[0]<XSOL)ev('solidX');if(R.v<22.2)ev('slowMerge')}
 const d1=onArt()?0:3.75;R.lc={to,d0:R.d,d1,t0:t,T:onAcc()?4.5:5.5,merge:onAcc()};mk()}
// ---------- 每一帧 ----------
function occ(c){const p=me();if(c.road==='A')return onArt()||R.u<UDIV+30?Math.abs(p[0]-c.lane)<2.7&&c.lane>0:false;if(c.road==='F')return onAcc()&&Math.abs(p[1]-c.lane)<2.7;return false}
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;const t=R.t;
 // 指令和阶段
 if(R.ph===0&&t>=2){R.ph=1;banner('考官：前方上 401 高速往东','#ffe27a',1)}
 if(R.ph===1&&!R.lane1&&me()[1]>=H.L0+30){R.lane1=1;banner('右边多出的车道去 401：当安全时换进去','#ffe27a')}      /* 匝道车道出现：由你按 SMOG 换进去 */
 if(R.ph<=1&&R.u>=UDIV){if(R.d>1.8&&!(R.lc&&R.lc.d1<1)){ev('missRamp');R.ph=9;R.miss=t;const q=me();R.mx=q[0];R.mz=q[1];R.lc=null;R.hd=0}else{R.ph=2;banner('匝道','');spawnF1()}}
 if(R.ph===9&&t>R.miss+3){finish();return}
 if(R.ph===2&&R.u>=UARC1){R.ph=3;banner('加速车道：提速，找空档并入高速','#ffe27a')}
 if(R.ph===3&&R.merged){R.ph=4;R.p4=t;banner('已并入高速','')}
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
  if(c.road==='A'&&c.vd<0&&c.s<-300)c.s+=1000;if(c.road==='W'&&c.s<-550)c.s+=2100;if(c.road==='F'&&c.lane!==ZF1&&c.s>1550)c.s-=2100});
 // 相撞
 if(!R.crash){const mm=[p[0],p[1],p[2],2.3,.95];const H=R.cars.find(c=>{if(c.gone)return false;const q=carPos(c);if(Math.abs(q[0]-p[0])>8||Math.abs(q[1]-p[1])>8)return false;if(Math.abs(carY(c)-myY())>2)return false;return obbHit(mm,[q[0],q[1],q[2],2.3,.95])});
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
function placeMine(){const p=me();place(mine,p[0],p[1],p[2],myY());mine.userData.bl.forEach(m=>{m.position.x=R.sig==='R'?-.88:.88})}
function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;step(dt);const bl=Math.sin(ts/1000*15)>0;const p=me();
 R.cars.forEach(c=>{const q=carPos(c);place(c.c,q[0],q[1],q[2]+(c.spin||0),carY(c));c.c.visible=!c.gone&&Math.hypot(q[0]-p[0],q[1]-p[1])<420});
 placeMine();mine.userData.bl.forEach(m=>m.visible=!!R.sig&&bl);
 sunFollow(p[1]+10,-p[0]);
 if(R.sig&&playing&&!R.over){const on=Math.sin(ts/1000*9.4)>0;$('sg').style.opacity=on?1:.15;if(on!==loop.sgOn){loop.sgOn=on;tick(on)}}
 const q=p;
 if(view===1){const h=q[2]+R.yaw+yawD,L=R.look?6:10,fT=!R.look?110:R.look.k==='M'?(R.look.t<.55?75:R.look.t<1.35?60:110):100;fovH+=(fT-fovH)*Math.min(1,dt*7);cam.fov=Math.min(105,2*Math.atan(Math.tan(fovH*Math.PI/360)/cam.aspect)*180/Math.PI);cam.updateProjectionMatrix();
  const ox=.38*Math.cos(q[2]),oz=.38*Math.sin(q[2]),bx0=-q[0]+Math.sin(q[2])*.2,bz0=q[1]-Math.cos(q[2])*.2;const sk=R.crash&&R.t-R.crash.t<.7?(1-(R.t-R.crash.t)/.7)*.12:0;
  const Y=myY();cam.position.set(bx0+ox+(Math.random()-.5)*sk,Y+1.25+(Math.random()-.5)*sk,bz0+oz+(Math.random()-.5)*sk);
  cam.lookAt(-q[0]-Math.sin(h)*L+ox,Y+1.25+L*.05+R.pit*L,q[1]+Math.cos(h)*L+oz);
  cockpit.visible=true;cockpit.position.set(bx0,Y+1.25,bz0);cockpit.rotation.y=-q[2];
  const dh=normA(q[2]-lastH)/Math.max(dt,.001);lastH=q[2];wheel.rotation.z+=((Math.max(-2.6,Math.min(2.6,dh*2.4)))-wheel.rotation.z)*Math.min(1,dt*10)}
 else{cockpit.visible=false;if(cam.fov!==62){cam.fov=62;cam.updateProjectionMatrix()}const h=q[2];cam.position.set(-q[0]+Math.sin(h)*26,42+myY(),q[1]-Math.cos(h)*26);cam.lookAt(-q[0]-Math.sin(h)*14,myY(),q[1]+Math.cos(h)*14)}      /* 俯视：跟着你的车，从后上方往前看 */
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
