// ============================================================
// highway-off.js — 项目：下高速（401 往东，你在右数第二条车道，车流约 80 → 换一次线进最右车道（出口专用道，前面直接分出去变匝道）→ 离出口还远，跟上车流加速到 110 左右 → 快到出口再减速 → 开到匝道弯道结束）
// ============================================================
// 道路来自 lib/road2.js（城市道路，和换线、上高速同一条路），高速在路堤上，城市道路从桥上跨过去。出口在城市道路西边（桥前）
// 路线坐标 (x,z)：x 向东为正，z 向北为正；画到场景里是 (-x, y, z)
const H=ROADOPT.hwy,ZA=H.ZA,HY=3.2;
const ZF1=ZA+3.75,ZF2=ZA+7.5,ZF3=ZA+11.25,ZMED=ZA+15.7,ZW1=ZA+20.15,ZW2=ZA+23.9,ZW3=ZA+27.65;      // 高速往东：最右是出口专用道（中心 z=ZA），再往左三条车道；中间隔离墙，往西三条
const XW=-1800,XLEN=3400;      // 高速从 x=-1800 画到 1600
// 出口：ZA 是出口减速车道的中心线。XT0 开始渐宽（70 米），XT1 起全宽，XG 分岔（虚线结束）；匝道先直 AA 米，右弯 60°（半径 RE），斜着往东南 DD 米，再左弯 60°，最后往东 BB 米到停车线 XS
const RE=130,TH=Math.PI/3,AA=7.5,BB=22,ZEND=470,XS=-14;
const DD=(ZA-ZEND-2*RE*(1-Math.cos(TH)))/Math.sin(TH),XG=XS-BB-AA-2*RE*Math.sin(TH)-DD*Math.cos(TH),XT0=XG-370,XT1=XT0+70;      // 出口减速车道约 370 米（从 110 换进来还有足够的距离减速）
const X0=-1420;      // 你出发的位置（右数第二条车道）
// 你的路线 P：沿出口车道的中心线（高速部分在 z=ZA），分岔后是匝道，过了停车线再往东一点
const PP=(()=>{const pts=[[XW,ZA]];let x=XG,z=ZA,h=Math.PI/2;pts.push([x,z]);
 const seg=(len,k)=>{const n=Math.ceil(len);for(let i=0;i<n;i++){const ds=len/n;h+=k*ds/2;x+=Math.sin(h)*ds;z+=Math.cos(h)*ds;h+=k*ds/2;pts.push([x,z])}};
 seg(AA,0);seg(RE*TH,1/RE);seg(DD,0);seg(RE*TH,-1/RE);seg(BB+40,0);return pts})();
const P0=path(PP),P=u=>{const a=P0(u),b=P0(Math.max(0,u-1.5)),c=P0(Math.min(P0.len-.01,u+1.5));return[a[0],a[1],Math.atan2(c[0]-b[0],c[1]-b[1])]};P.len=P0.len;
const uAtX=x=>{for(let u=0;u<P.len;u+=.1)if(P(u)[0]>=x)return u;return P.len};
const UG=uAtX(XG),UC1=UG+AA,UC2=UC1+RE*TH,UC3=UC2+DD,UC4=UC3+RE*TH,US=uAtX(XS),UCR=uAtX(-7.2);      // 分岔、第一个弯、斜直段、第二个弯、停车线、匝道接上城市道路
const yP=u=>u<UG?HY:HY*(1-ss(UG+40,UG+300,u));      // 匝道从分岔后 40 米开始下坡，到城市道路时回到地面
const grade=u=>(yP(u+1)-yP(u-1))/2;
const ZT=x=>ZA+.3-4.8*(1-ss(XG,XG+20,x));      // 高速路堤顶面右边缘：分岔口之前有出口专用道和路肩
const RS=[],TX0=XG-12,TX1=-11.6;      // 匝道的采样点：地形要贴着匝道两边
const Lw=u=>1.875+.125*ss(UG,UG+40,u);      // 匝道半宽：分岔后 40 米从 3.75 慢慢放宽到 4 米
const ASP=M(0x6e6e76,{side:T.DoubleSide}),SHO=M(0x8d8d92,{side:T.DoubleSide}),WL=BM(WH),YL=BM(0xf2c12e),CON=M(0xb5b7bb);
// 匝道：分岔后先是白线（和高速右边线一起分开），之后左边黄线、右边白线，右边有路肩
{const YF=(x,z,u)=>yP(u),L=Lw,Rt=u=>-Lw(u);
 strip(P,UG,UCR,Rt,L,.07,ASP,YF);
 strip(P,UG,UG+50,u=>L(u)-.2,u=>L(u)-.05,.09,WL,YF);strip(P,UG+50,UCR-6,u=>L(u)-.2,u=>L(u)-.05,.09,YL,YF);strip(P,UG,UCR-6,u=>Rt(u)+.05,u=>Rt(u)+.2,.09,WL,YF);
 strip(P,UG,UCR-12,u=>Rt(u)-1.5,Rt,.065,SHO,YF);
 // 分岔口：高速右边线和匝道左边线之间铺满路面（两条白线中间）
 strip(P,UG,UG+40,L,u=>{const q=P(u),zl=q[1]+Math.sin(q[2])*L(u);return L(u)+Math.max(0,(ZA+1.875-zl)/Math.max(.5,Math.sin(q[2])))},.066,ASP,YF);
 // 停车线
 strip(P,US-.25,US+.25,Rt,L,.1,WL,YF);
 for(let u=UG;u<UCR+6;u+=1){const q=P(u),lx=-Math.cos(q[2]),lz=Math.sin(q[2]);RS.push([q[0],q[1],yP(u),Lw(u)+(u<UCR-12?1.5:0)+.35])}}
// 高速（东西向，在 HY 米高的路堤上，城市道路从桥上跨过去）：往东三条车道 + 出口减速车道，往西三条车道，路肩，中间隔离墙
{const Y=HY,EL=u=>[u+XW,0,Math.PI/2];EL.len=XLEN;
 const Z=z=>u=>{const q=EL(u);return[q[0],z,q[2]]},o=x=>x-XW;
 const band=(z0,z1,mat,y)=>strip(Z((z0+z1)/2),0,XLEN,-(z1-z0)/2,(z1-z0)/2,Y+y,mat);
 band(ZA+1.875,ZA+13.125,ASP,.03);band(ZA+13.125,ZA+15.1,SHO,.025);band(ZA+16.3,ZA+18.275,SHO,.025);band(ZA+18.275,ZA+29.525,ASP,.03);band(ZA+29.525,ZA+32,SHO,.025);
 strip(Z(ZA),0,XLEN,u=>ZT(u+XW)-ZA,1.875,Y+.02,SHO);
 // 路堤：顶面（铺在车道下面）＋两边斜坡到地面；匝道旁边那一段用下面的高度场
 {const GM=M(0x7fae5a,{side:T.DoubleSide});strip(Z(ZA),0,XLEN,u=>ZT(u+XW)-ZA-.6,34,Y-.03,GM);
  const sl=(e,s)=>{let pos=[],idx=[],k=0;const out=()=>{if(k>1){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,GM);m.receiveShadow=true;scene.add(m)}pos=[];idx=[];k=0};
   for(let x=XW;x<=XW+XLEN;x+=x>XT0-60&&x<XG+60?4:20){if(s<0&&x>TX0&&x<TX1){out();continue}const z=e(x);pos.push(-x,Y-.03,z,-x,-.05,z+s*2.4*HY);if(k)idx.push(k-2,k-1,k,k-1,k+1,k);k+=2}out()};
  sl(x=>ZT(x)-.6,-1);sl(()=>ZA+34,1)}
 // 最右的出口专用道：一直全宽，到分岔口直接分出去变成匝道
 strip(Z(ZA),0,o(XG),-1.875,1.875,Y+.031,ASP);strip(Z(ZA-1.8),0,o(XG),-.08,.08,Y+.06,WL);
 for(let x=XW;x<XW+XLEN;x+=100){const w=new T.Mesh(new T.BoxGeometry(100,.85,.5),CON);w.position.set(-(x+50),Y+.425,ZMED);scene.add(w)}      // 隔离墙
 // 标线：往东左边黄线、车道之间虚线；右车道和出口车道之间是虚线（短虚线），到分岔口为止；其他地方是高速右边的白实线
 strip(Z(ZA+13.05),0,XLEN,-.08,.08,Y+.06,YL);dashes(Z(ZA+5.625),0,XLEN,0,.2,Y+.06,WL,3,9);dashes(Z(ZA+9.375),0,XLEN,0,.2,Y+.06,WL,3,9);
 dashes(Z(ZA+1.875),0,o(XT0),0,.2,Y+.06,WL,3,9);dashes(Z(ZA+1.875),o(XT0),o(XG),0,.32,Y+.06,WL,1.5,3);strip(Z(ZA+1.875),o(XG),XLEN,-.08,.08,Y+.06,WL);
 strip(Z(ZA+18.35),0,XLEN,-.08,.08,Y+.06,YL);dashes(Z(ZA+22.025),0,XLEN,0,.2,Y+.06,WL,3,9);dashes(Z(ZA+25.775),0,XLEN,0,.2,Y+.06,WL,3,9);strip(Z(ZA+29.45),0,XLEN,-.08,.08,Y+.06,WL)}
// 匝道旁边的地形（高度场）：远处是高速路堤的斜坡，靠近匝道的地方贴着匝道的高度，离开路边再按 1:2.4 接回去
{const GM=M(0x7fae5a,{side:T.DoubleSide}),S=2.4,x0=TX0,x1=TX1,z0=ZEND-30,z1=ZA+.4,dx=1.5,dz=1.5,nx=Math.ceil((x1-x0)/dx),nz=Math.ceil((z1-z0)/dz),pos=[],idx=[];
 const emb=(x,z)=>{const e=ZT(x)-.6;return z>=e?HY-.03:Math.max(-.05,HY-.03-(e-z)/S)};
 const hgt=(x,z)=>{let h=emb(x,z),bd=1e9,b=null;for(const r of RS){const d=(r[0]-x)*(r[0]-x)+(r[1]-z)*(r[1]-z);if(d<bd){bd=d;b=r}}if(!b)return h;const e=Math.max(0,Math.sqrt(bd)-b[3]),yr=b[2]-.04;return Math.min(Math.max(h,yr-e/S),yr+e/S)};
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=Math.min(x1,x0+i*dx),z=Math.min(z1,z0+j*dz);pos.push(-x,hgt(x,z),z);if(i&&j){const k=j*(nx+1)+i;idx.push(k-nx-2,k-1,k,k-nx-2,k,k-nx-1)}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,GM);m.receiveShadow=true;scene.add(m)}
// 高速西边更远的地方也铺上草地（lib/road2.js 只铺到 x=-600）
for(let x=XW-100;x<-600;x+=100){const m=new T.Mesh(new T.BoxGeometry(100,.1,800),R2M.g);m.position.set(-(x+50),-.06,ZA);m.receiveShadow=true;scene.add(m)}
// 城市道路西边的树：挡在匝道上的不要
TREES.forEach(t=>{const p=t.g.position,x=-p.x,z=p.z;if(RS.some(r=>Math.hypot(r[0]-x,r[1]-z)<r[3]+4))t.g.visible=false});
// ---------- 标志牌 ----------
function post(x,z,ry,w,hh,tex,y0,yb){const g=new T.Group(),pm=M(0x8a9099);const n=w>1.6?2:1;for(let i=0;i<n;i++)g.add(mesh(new T.CylinderGeometry(.06,.06,y0+hh,8),pm,n>1?(i?w*.3:-w*.3):0,(y0+hh)/2,.06));
 const f=mesh(new T.PlaneGeometry(w,hh),new T.MeshBasicMaterial({map:tex,transparent:true}),0,y0+hh/2,0);f.rotation.y=Math.PI;g.add(f);
 const b=mesh(new T.PlaneGeometry(w,hh),pm,0,y0+hh/2,.01);g.add(b);g.position.set(-x,yb||0,z);g.rotation.y=ry||0;scene.add(g);return g}
// 绿色出口预告牌：上面黄色 EXIT 342 小牌，下面 Maple Rd，再下面距离或斜箭头
const EXS=dist=>cv(512,360,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#f6c71b';x.fillRect(250,0,250,64);x.fillStyle='#111';x.font='bold 46px Arial';x.textAlign='center';x.fillText('EXIT 342',375,48);
 x.fillStyle='#0f6b3a';x.fillRect(0,64,w,h-64);x.strokeStyle='#fff';x.lineWidth=7;x.strokeRect(10,74,w-20,h-84);x.fillStyle='#fff';x.font='bold 84px Arial';x.fillText('Maple Rd',w/2,190);
 if(dist){x.font='bold 64px Arial';x.fillText(dist,w/2,300)}else{x.strokeStyle='#fff';x.lineWidth=16;x.beginPath();x.moveTo(220,320);x.lineTo(290,250);x.stroke();x.beginPath();x.moveTo(310,228);x.lineTo(262,236);x.lineTo(302,276);x.closePath();x.fill()}});
post(-1180,ZA-1.2,-Math.PI/2,3.4,2.4,EXS('1 km'),2.0,HY-.2);post(XT0-40,ZA-1.2,-Math.PI/2,3.4,2.4,EXS(null),2.0,HY-.2);
// 分岔口的 EXIT 小牌（绿底白字＋斜箭头）
{const t=cv(256,180,(x,w,h)=>{x.fillStyle='#0f6b3a';x.fillRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=6;x.strokeRect(8,8,w-16,h-16);x.fillStyle='#fff';x.font='bold 64px Arial';x.textAlign='center';x.fillText('EXIT',w/2,82);
  x.strokeStyle='#fff';x.lineWidth=12;x.beginPath();x.moveTo(100,160);x.lineTo(150,110);x.stroke();x.beginPath();x.moveTo(166,92);x.lineTo(128,98);x.lineTo(160,130);x.closePath();x.fill()});
 const q=P(UG+34);post(q[0]+1,(q[1]+ZA+1.9)/2+.6,-Math.PI/2,1.0,.7,t,1.4,HY)}
// 黄底黑字建议速度 50 km/h（匝道右边，第一个弯之前）
const ADV=cv(200,300,(x,w,h)=>{const rr=(a,b,ww,hh,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+ww,b,a+ww,b+hh,r);x.arcTo(a+ww,b+hh,a,b+hh,r);x.arcTo(a,b+hh,a,b,r);x.arcTo(a,b,a+ww,b,r);x.closePath()};
 x.clearRect(0,0,w,h);rr(2,2,w-4,h-4,14);x.fillStyle='#f6c71b';x.fill();x.lineWidth=5;x.strokeStyle='#111';rr(9,9,w-18,h-18,10);x.stroke();
 x.fillStyle='#111';x.fillRect(9,h-76,w-18,67);x.textAlign='center';x.font='bold 140px Arial';x.fillText('50',w/2,170);x.fillStyle='#f6c71b';x.font='bold 50px Arial';x.fillText('km/h',w/2,h-24)});
{const u=UG+12,q=P(u),rx=Math.cos(q[2]),rz=-Math.sin(q[2]),o=Lw(u)+2.2;post(q[0]+rx*o,q[1]+rz*o,-q[2],.6,.9,ADV,1.6,yP(u))}
// 停车标志（红色八角形 STOP），在停车线右边
{const t=cv(256,256,(x,w,h)=>{x.clearRect(0,0,w,h);x.save();x.translate(128,128);x.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;x.lineTo(Math.cos(a)*124,Math.sin(a)*124)}x.closePath();x.fillStyle='#fff';x.fill();
  x.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;x.lineTo(Math.cos(a)*112,Math.sin(a)*112)}x.closePath();x.fillStyle='#c8102e';x.fill();x.fillStyle='#fff';x.font='bold 70px Arial';x.textAlign='center';x.fillText('STOP',0,25);x.restore()});
 const q=P(US),rx=Math.cos(q[2]),rz=-Math.sin(q[2]),o=Lw(US)+1.4;post(q[0]+rx*o+.5,q[1]+rz*o,-q[2],.75,.75,t,1.6,0)}
// 高速限速牌 MAXIMUM 110
{const t=cv(200,300,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#111';x.lineWidth=6;x.strokeRect(8,8,w-16,h-16);x.fillStyle='#111';x.textAlign='center';x.font='bold 40px Arial';x.fillText('MAXIMUM',w/2,62);
  x.font='bold 120px Arial';x.fillText('110',w/2,190);x.fillRect(8,h-70,w-16,62);x.fillStyle='#fff';x.font='bold 46px Arial';x.fillText('km/h',w/2,h-22)});
 [-1600,-1000].forEach(x=>post(x,ZA-.9,-Math.PI/2,1.0,1.5,t,1.6,HY-.2))}
BB1.visible=BB2.visible=false;
// ---------- 状态 ----------
const mine=car(C[0]);
let R=null,round=0,playing=false,gt=0,view=1,yawD=0,az=2.4,el=.85,drag=false,lx=0,ly=0,DIFF='easy';
const live=[];
const TXT={
 noSig:["换线前没有打转向灯","换线和进出口车道都要先打转向灯，让旁边车道和后面的车知道你要过去。"],
 sigShort:["转向灯打得太晚","转向灯要提前打，至少闪 3 秒左右再换线（打灯、看后视镜、看盲点，做完正好 3 秒左右）。"],
 noMirror:["换线前没有看后视镜","换线前要看中间后视镜和右边的外后视镜，看清后面和右边车道的车流。"],
 noShoulder:["没有回头看盲点","后视镜看不到车身右后方的盲区。换线、进入出口车道前一定要回头看一眼右边的盲点。"],
 oldShoulder:["看完盲点隔太久才动","看盲点要在动之前的最后一刻做，看完马上换线。隔了几秒，盲区里可能已经有车开进来了。"],
 unsafeB:["旁边车道的车就在你旁边（盲区里）还换线","要过去的车道上有车和你并排或在你侧后方的盲区里，过去就会撞上它。确认旁边没车再动。"],
 unsafeR:["后面的车开过来太近还过去，逼它刹车","要过去的车道上，后面有车比你快、离你又不够远，你过去它就得刹车让你。要等它过去，或者等它离你足够远再动。"],
 unsafeF:["插到前车后面太近","要过去的车道上，前面的车比你慢、离你太近。要等它和你拉开距离再过去。"],
 lateRight:["快到出口才换到最右车道","看到出口预告牌（1 km）以后，就要找机会提早换到最右车道（出口专用道），不要拖到快到出口了还在主路车道上。"],
 noLane:["出口车道还没开始就往右并","出口减速车道从渐宽的地方（虚线开始）才有。之前右边是路肩，不能往右开。"],
 missExit:["错过了出口","要提早按 后视镜 → 看盲点 → 换线 换进最右车道，这条车道前面直接分出去就是出口匝道。过了分岔口还在主路上，就只能开到下一个出口。"],
 slowHwy:["还在高速主路上就开始减速","下高速要先换进最右的出口车道，快到出口时再在出口车道和匝道上减速。在主路上就减速，后面的车只能跟着急刹，非常危险。"],
 rampFast:["匝道弯道上太快","出口匝道弯道的建议速度是 50 km/h。快到出口时就在出口车道里把车速降下来，进弯前降到 50 左右。"],
 noStop:["没有在停车线前停车","匝道尽头有停车标志（STOP），要在停车线前完全停住（车速为 0），再观察路口。"],
 farStop:["停车离停车线太远","要停在停车线后面、车头接近停车线的地方。停得太远，看不清路口的车，也容易让别人误会你的意图。"],
 tooClose:["跟前车太近","高速上要和前车保持约 2 秒的距离。一直贴得很近（不到 0.7 秒，比如 100 km/h 时不到 20 米）就扣分。"],
 hardBrake:["冲到前车后面，只能急刹","和前车的车速差太大、距离又近，只能急刹才不撞上。要提早松开加速、点减速。"],
 crash:["和别的车相撞","换线前一定要看后视镜和回头看盲点，确认有足够的空档。"],
 speedF:["高速上超速","这段高速限速 110，不要超过限速。"],
 stay80:["换到最右车道后一直只开 80","原来的车道车多才开 80；换进最右车道时离出口还很远，前面也没有慢车，应该跟上车流加速到 110 左右，快到出口（看到带箭头的 EXIT 牌）再减速。一直只开 80，后面的车只能跟着你或者急着超你。"],
 rampFastC:["进匝道弯道时车速太快","匝道弯道建议 50 km/h。快到出口时就要在出口车道里把车速降下来，进弯前降到 50～60 左右。"]};
const SER=['unsafeB','unsafeR','unsafeF','crash','missExit','noStop'];
// 其他车：road A＝城市道路（往北，s＝z，lane＝x），F＝高速往东（s＝x，lane＝z），W＝高速往西，P＝最右的出口专用道（沿你的路线 P，s＝u，分岔后走匝道）
function carPos(c){if(c.road==='P'){const q=P(c.s);return[q[0],q[1],q[2]]}if(c.road==='A')return[c.lane,c.s,c.lane<0?Math.PI:0];if(c.road==='F')return[c.s,c.lane,Math.PI/2];return[c.s,c.lane,-Math.PI/2]}
function add(road,lane,s,v,o){const c=car(C[1+Math.random()*8|0]);live.push(c);const k=Object.assign({c,road,lane,s,vd:v,cv:Math.abs(v)},o||{});R.cars.push(k);return k}
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;
 R={t:0,u:uAtX(X0),d:3.75,v:22.2,ph:1,sig:null,sigT:-9,mT:{},oT:{},look:null,yaw:0,pit:0,ev:[],over:false,cars:[],lc:null,lastDone:-9,q:[],hd:0};
 // 城市道路：两个方向都有车
 for(let k=0;k<10;k++)add('A',[1.75,5.25][k%2],200+k*70+Math.random()*20,V0);for(let k=0;k<10;k++)add('A',-1.75-(k%2)*3.5,250+k*70+Math.random()*20,-V0);
 // 你的车道（右数第二条）：前后各有车，速度和你差不多
 [45,90,140,195,250].forEach(d=>add('F',ZF1,X0+d+Math.random()*8,22.2));[-40,-85].forEach(d=>add('F',ZF1,X0+d,22.2));      // 这条车道车多，大家都只开 80 左右
 for(let k=0;k<34;k++)add('F',ZF2,XW+k*100+Math.random()*30,27+Math.random()*2);      // 左边一条车道开 100 左右
 // 最右的出口专用道：一团一团的车（2～3 辆、间距 33～38 米），团和团之间 120～160 米的空档；车速约 108，比你快：一团车从后面超过去以后，就有空档可以换过去，换过去要马上加速跟上。它们到出口都走匝道
 {const VR1=30,uX=x=>x-XW,c0=X0+15+Math.random()*20,gp=()=>125+Math.random()*35,sp=()=>33+Math.random()*5;let x=c0+gp()/2,k=0,n=2+(Math.random()*2|0);
  while(x<XG-150){add('P',0,uX(x),VR1);if(++k===n){x+=gp();k=0;n=2+(Math.random()*2|0)}else x+=sp()}
  x=c0-55-Math.random()*10;k=0;n=2+(Math.random()*2|0);while(x>X0-900){add('P',0,uX(x),VR1);if(++k===n){x-=gp();k=0;n=2+(Math.random()*2|0)}else x-=sp()}}
 for(let k=0;k<30;k++)add('F',ZF3,XW+k*115+Math.random()*30,30.5+Math.random()*2);      // 左车道快一些
 for(let k=0;k<36;k++)add('W',[ZW1,ZW2,ZW3][k%3],XW+k*95+Math.random()*40,-(29+Math.random()*3));
 mine.visible=false;setSig(null);banner('401 往东','');mk();$('sp').textContent='80'}
const accN=v=>Math.max(.6,2.37-.045*v);      // 和上高速一样：50→100 约 10 秒
function banner(t,col,big){const b=$('bn');b.textContent=t;b.style.color=col||'';if(big){const e=$('cf');e.textContent=t;e.classList.remove('go');void e.offsetWidth;e.classList.add('go')}}
function flash(t){const f=$('fl');f.textContent=t;f.style.opacity=1;clearTimeout(flash.h);flash.h=setTimeout(()=>f.style.opacity=0,1800)}
function setSig(s){R.sig=s;R.sigT=R.t;const e=$('sg');e.style.display=s?'block':'none';e.textContent=s==='L'?'⬅':'➡';if(s)tick(true);mk()}
function mk(){const on={acc:!!R.acc,dec:!!R.dec,mir:R.look&&R.look.k==='M',sho:R.look&&R.look.k==='O',go:!!R.lc};document.querySelectorAll('.b').forEach(b=>b.classList.toggle('on',!!on[b.dataset.m]))}
// 你的位置：沿路线 P 的 u，再往左偏 d 米（d＝7.5 中间车道，3.75 右车道，0 出口车道）
function me(){if(R.mz!=null)return[R.mx,R.mz,Math.PI/2];const q=P(R.u),lx=-Math.cos(q[2]),lz=Math.sin(q[2]);return[q[0]+lx*R.d,q[1]+lz*R.d,q[2]+R.hd]}
const myY=()=>R.mz!=null?HY:yP(R.u);
const carY=c=>c.road==='A'?Yart(c.s):c.road==='P'?yP(c.s):HY;
const onHwy=()=>R.mz!=null||R.u<UG;
let SNC=null;
function snap(ah){try{ah=ah||0;{const sz=ren.getSize(new T.Vector2());ren.setScissorTest(false);ren.setViewport(0,0,sz.x,sz.y)}const cvs=ren.domElement,W=360,H=240;if(!cvs.width)return null;if(!SNC)SNC=new T.PerspectiveCamera(45,1,1,500);SNC.aspect=cvs.width/cvs.height;SNC.updateProjectionMatrix();
 const p0=me(),cx=p0[0]+Math.sin(p0[2])*ah/2,cz=p0[1]+Math.cos(p0[2])*ah/2,hh=Math.max(55,(ah/2+9)/.414),p=[cx,cz,p0[2]];SNC.position.set(-p[0],hh+myY(),p[1]);SNC.up.set(Math.sin(p[2])*-1,0,Math.cos(p[2]));SNC.lookAt(-p[0],myY(),p[1]);const vc=cockpit.visible,vm=mine.visible;cockpit.visible=false;mine.visible=true;placeMine();ren.render(scene,SNC);cockpit.visible=vc;mine.visible=vm;
 const c2=document.createElement('canvas');c2.width=W;c2.height=H;const sw=Math.min(cvs.width,cvs.height*W/H),sh=sw*H/W;c2.getContext('2d').drawImage(cvs,(cvs.width-sw)/2,(cvs.height-sh)/2,sw,sh,0,0,W,H);return c2.toDataURL('image/jpeg',.82)}catch(e){return null}}
function ev(key,o){o=o||{};if(R.ev.some(e=>e.key===key))return;const t=TXT[key];R.ev.push({key,title:t[0],text:t[1]+(o.add||''),img:snap(o.ah)});flash(t[0])}
// ---------- 按钮 ----------
// 转向灯由系统打：你开始看后视镜（或看盲点、换线）准备往右换线时自动打右转灯，换完自动关
function canRight(){return onHwy()&&!R.lc&&R.d>1&&R.ph<9}
function cmd(m){if(!R||R.over||!playing)return;
 if(m==='acc'||m==='dec'){R[m]=true;R[m==='acc'?'dec':'acc']=false;mk();return}
 if(m==='mir'||m==='sho'||m==='go'){if(canRight()&&!R.sig)setSig('R');if(R.look||R.q.length){if(R.q.length<3)R.q.push(m);return}doAct(m)}}
function doAct(m){if(m==='go'){if(!R.lc)startChange();return}R.look={k:m==='mir'?'M':'O',t:0,side:'R'};mk()}
function nextAct(){const m=R.q.shift();if(m)doAct(m)}
function cmdUp(m){if(!R)return;if(m==='acc'||m==='dec'){R[m]=false;mk()}}
addEventListener('keydown',e=>{if(e.repeat)return;if(e.key==='ArrowUp')cmd('acc');if(e.key==='ArrowDown')cmd('dec')});addEventListener('keyup',e=>{if(e.key==='ArrowUp')cmdUp('acc');if(e.key==='ArrowDown')cmdUp('dec')});
// 空档：L＝目标车道上其他车 [{s,cv}]，s 是沿车道的位置；S＝你的位置
function gapWhy(L,S){let w=null;L.forEach(c=>{if(w)return;const dz=c.s-S,dv=c.cv-R.v;
  if(dz<5.6&&dz>-12)w='unsafeB';
  else if(dz<0){const g=-dz-4.6-Math.max(0,dv)*2;if(g<Math.max(6,.6*c.cv+2.5*Math.max(0,dv)))w='unsafeR'}
  else{const g=dz-4.6+dv*2;if(g<Math.max(3,.2*R.v))w='unsafeF'}});return w}
function startChange(){if(!canRight())return;const x=me()[0],t=R.t,toExit=R.d<5;
 if(toExit&&x>XG-12){flash('已经到分岔口，来不及了');return}
 if(!R.sig)ev('noSig');else if(t-R.sigT<3)ev('sigShort');
 if(!(R.mT.R!=null&&t-R.mT.R<10))ev('noMirror');
 if(!(R.oT.R!=null&&t-R.oT.R<10))ev('noShoulder');else if(t-R.oT.R>2.5)ev('oldShoulder');
 const tz=ZA+R.d-3.75,why=gapWhy(R.cars.filter(c=>c.road==='P'?tz<ZA+.5&&!c.gone:c.road==='F'&&Math.abs(c.lane-tz)<.5).map(c=>({s:carPos(c)[0],cv:c.cv})),x);if(why)ev(why);
 R.lc={to:'R',d0:R.d,d1:R.d-3.75,t0:t,T:5};mk()}
// ---------- 每一帧 ----------
function occ(c){const p=me();if(c.road==='P')return R.mz==null&&!c.gone&&Math.abs(R.d)<2.7;if(c.road==='F')return onHwy()&&Math.abs(p[1]-c.lane)<2.7;if(c.road==='A')return R.u>US-5&&Math.abs(p[0]-c.lane)<2.7;return false}
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;const t=R.t;const p=me();
 // 指令和阶段
 if(!R.b0&&t>=.6){R.b0=1;banner('考官：从下一个出口（342 Maple Rd）下高速','#ffe27a',1)}
 if(R.ph===1&&R.d<.5&&!R.lc){R.ph=2;banner(p[0]<XG-300?'进了最右车道（出口专用道）：离出口还远，跟上车流加速到 110':'进了最右车道（出口专用道）','#ffe27a')}
 if(R.ph===1&&!R.lr&&R.d>1.8&&!(R.lc&&R.lc.d1<1)&&p[0]>XG-450){R.lr=1;ev('lateRight')}
 if(R.ph<=2&&p[0]>=XG-300&&(R.ph===2||R.d<.5)){R.ph=3;banner('快到出口：现在开始减速，匝道弯道建议 50 km/h','#ffe27a')}
 if(R.ph<=3&&R.u>=UG){if(R.d>1.8&&!(R.lc&&R.lc.d1<1)){ev('missExit');R.ph=9;R.miss=t;R.mx=p[0];R.mz=p[1];R.lc=null;R.hd=0;setSig(null)}else{R.ph=4;banner('匝道：前方弯道，建议 50 km/h','#ffe27a')}}
 if(R.ph===4&&R.u>=UC1+2){if(R.v*3.6>68)ev('rampFastC',{add:'（进弯时 '+Math.round(R.v*3.6)+' km/h）'});R.ph=5;R.p5=t;banner('下高速完成','')}      /* 开到匝道第一个弯就结束（后面接城市道路） */
 if(R.ph===9&&t>R.miss+3){finish();return}
 // 停车线：车头＝车中心往前 2.3 米
 if(false){const front=R.u+2.3,dist=US-front;
  if(R.v<.15&&dist>-.5){R.stT=(R.stT||0)+dt;if(R.stT>.6){if(dist>6)ev('farStop');R.ph=5;R.p5=t;banner('停稳了','')}}else R.stT=0;
  if(dist<-.8&&R.v>.5){ev('noStop');R.ph=5;R.p5=t}}
 if(R.ph===5&&t>R.p5+1){finish();return}
 // 车速：你用加速／减速按钮控制（按住起作用，松开保持车速）
 let vt=99;
 R.cars.forEach(c=>{if(!occ(c))return;const q=carPos(c),g=(c.road==='A'?Math.abs(q[1]-p[1]):c.road==='P'?c.s-R.u:q[0]-p[0])-4.6;if((c.road==='F'||c.road==='P')&&(g>-2&&g<60))vt=Math.min(vt,Math.sqrt(c.cv*c.cv+2*4*Math.max(0,g-8)))});
 if(R.crash)vt=0;
 const v0=R.v,aT=R.acc?accN(R.v)-9.8*grade(R.u)*.6:R.dec?-3.5:-9.8*grade(R.u)*.3;R.a=(R.a||0)+(aT-(R.a||0))*Math.min(1,dt*4);R.v=Math.max(0,Math.min(36,R.v+R.a*dt));
 if(R.dec&&R.v<.3)R.v=0;
 if(R.v>vt)R.v=Math.max(vt,Math.min(R.v,v0)-(R.crash?9:8)*dt);      // 快撞上前车：系统帮你刹车
 // 前车（你现在这条车道）：两个键都没按、正在追近前车时，像真人一样松油门／轻点刹车，保持约 2 秒
 let FG=1e9,FV=0;if(R.mz==null&&!R.lc&&R.d<.5)R.cars.forEach(c=>{if(c.road==='P'&&!c.gone&&c.s>R.u&&c.s-R.u-4.6<FG){FG=c.s-R.u-4.6;FV=c.cv}});if(onHwy()&&!R.lc)R.cars.forEach(c=>{if(c.road==='F'&&Math.abs(c.lane-p[1])<1.9&&c.s>p[0]&&c.s-p[0]-4.6<FG){FG=c.s-p[0]-4.6;FV=c.cv}});
 if(FG<200&&!R.acc&&!R.dec&&!R.crash){const want=Math.max(FV-2.5,FV+(FG-2*R.v)/4);if(R.v>want)R.v=Math.max(want,R.v-1.5*dt)}
 // 车速判断
 const kmh=R.v*3.6;
 if(onHwy()&&R.ph<9){R.sH=R.d>1.8&&kmh<72&&!(FG<45&&FV*3.6<80)?(R.sH||0)+dt:0;if(R.sH>2)ev('slowHwy')}      /* 主路上（还没进出口车道）就减速；前车慢逼你慢的不算 */
 {const inR=Math.abs(R.d)<.4&&!R.lc&&R.ph<9,far=p[0]<XG-300,free=!(FG<80&&FV*3.6<100);R.s80=inR&&far&&free&&kmh<96?(R.s80||0)+dt:0;if(R.s80>7)ev('stay80')}      /* 在最右车道、离分岔口还有 300 米以上、前面没有慢车：7 秒还没加速到 96 以上 */
 R.spF=onHwy()&&kmh>122?(R.spF||0)+dt:0;if(R.spF>2)ev('speedF');
 R.rf=R.ph<5&&((R.u>UC1+5&&R.u<UC2)||(R.u>UC3+5&&R.u<UC4))&&kmh>65?(R.rf||0)+dt:0;if(R.rf>1)ev('rampFast');
 if(FG<200&&t-R.lastDone>4&&!R.lc){const g=FG,lv=FV,h=g/Math.max(1,R.v);
  if(R.v>lv+.5&&(R.v*R.v-lv*lv)/(2*Math.max(1,g-4))>4.5)ev('hardBrake',{ah:g+4.6,add:`（当时你 ${Math.round(kmh)} km/h，前车 ${Math.round(lv*3.6)} km/h，车距约 ${Math.max(0,Math.round(g))} 米）`});
  R.tc=h<.7?(R.tc||0)+dt:0;R.tc2=h<.45?(R.tc2||0)+dt:0;if(R.tc>3||R.tc2>1)ev('tooClose',{ah:g+4.6,add:`（当时你 ${Math.round(kmh)} km/h，离前车约 ${Math.max(0,Math.round(g))} 米，只有 ${h.toFixed(1)} 秒；2 秒应该约 ${Math.round(R.v*2)} 米）`})}
 if(R.mz!=null)R.mx+=R.v*dt;else R.u+=R.v*dt;
 if(R.lc){const L=R.lc,k=Math.min(1,(t-L.t0)/L.T),s=k*k*k*(10-15*k+6*k*k),dd=(L.d1-L.d0)*30*k*k*(1-k)*(1-k)/L.T;R.d=L.d0+(L.d1-L.d0)*s;R.hd=-Math.atan2(dd,Math.max(1,R.v));
  if(k>=1){R.lc=null;R.hd=0;R.d=L.d1;R.lastDone=t;setSig(null);mk()}}
 // 看后视镜／看盲点（右边）
 if(R.look){const L=R.look,k9=Math.min(1,dt*12),sd=1;L.t+=dt;
  if(L.k==='M'){if(L.t<.55){R.yaw+=(.42-R.yaw)*k9;R.pit+=(.2-R.pit)*k9}else if(L.t<1.35){R.yaw+=(.83-R.yaw)*k9;R.pit+=(-.27-R.pit)*k9;if(L.t>1)R.mT.R=t}
   else{R.yaw+=(0-R.yaw)*k9;R.pit+=(0-R.pit)*k9;if(L.t>1.7){R.look=null;R.yaw=0;R.pit=0;mk();nextAct()}}}
  else{if(L.t<.95){R.yaw+=(sd*2.05-R.yaw)*Math.min(1,dt*10);R.pit+=(-.03-R.pit)*k9;if(L.t>.6)R.oT.R=t}
   else{R.yaw+=(0-R.yaw)*Math.min(1,dt*12);R.pit+=(0-R.pit)*k9;if(L.t>1.3){R.oT.R=t;R.look=null;R.yaw=0;R.pit=0;mk();nextAct()}}}}
 // 没打算换线却开着灯（看了镜子但没换）：10 秒后自动关
 if(R.sig&&!R.lc&&!R.look&&!R.q.length&&t-R.sigT>10&&t-Math.max(R.mT.R||-9,R.oT.R||-9)>6)setSig(null);
 // 其他车：保持速度、跟前车；你在它车道上时把你当前车；你切到它前面太近时它刹车、按喇叭
 R.cars.forEach(c=>{if(c.gone)return;if(c.crash){c.cv*=Math.max(0,1-3*dt);c.s+=c.cv*dt;return}
  const sg=Math.sign(c.vd)||1;let vt=Math.abs(c.vd);
  if(c.road==='P'){if(c.s>UC2+40){c.gone=true;return}if(c.s>UG-320)vt=Math.min(vt,Math.sqrt(13.5*13.5+2*2.2*Math.max(0,UC1-c.s)));      /* 出口车道的车：快到出口减速，匝道弯道约 50 */
   if(R.mz==null&&Math.abs(R.d)<2.7){const g=R.u-c.s-4.6;if(g>-1&&g<80){const need=Math.sqrt(R.v*R.v+2*4*Math.max(0,g-6));if(need<vt){vt=need;if(c.cv-R.v>.5&&(c.cv*c.cv-R.v*R.v)/(2*Math.max(.5,g-2))>3.2&&!c.hk&&(R.lc||t-R.lastDone<3)){c.hk=true;honk()}}}}}
  R.cars.forEach(o=>{if(o===c||o.gone||o.road!==c.road||o.lane!==c.lane)return;const g=(o.s-c.s)*sg-4.6;if(g>-1&&g<80)vt=Math.min(vt,Math.sqrt(o.cv*o.cv+2*4*Math.max(0,g-7)))});
  if(c.road==='F'&&onHwy()&&Math.abs(p[1]-c.lane)<2.7){const g=(p[0]-c.s)-4.6;if(g>-1&&g<80){const need=Math.sqrt(R.v*R.v+2*4*Math.max(0,g-6));if(need<vt){vt=need;if(c.cv-R.v>.5&&(c.cv*c.cv-R.v*R.v)/(2*Math.max(.5,g-2))>3.2&&!c.hk&&(R.lc||t-R.lastDone<3)){c.hk=true;honk()}}}}
  c.cv=c.cv>vt?Math.max(vt,c.cv-7*dt):Math.min(vt,c.cv+1.8*dt);c.s+=c.cv*sg*dt;
  if(c.road==='A'){if(c.vd<0&&c.s<-300)c.s+=1000;if(c.vd>0&&c.s>1400)c.s-=1000}if(c.road==='W'&&c.s<XW)c.s+=XLEN;if(c.road==='F'&&c.s>XW+XLEN)c.s-=XLEN});
 // 相撞
 if(!R.crash){const mm=[p[0],p[1],p[2],2.3,.95];const Hh=R.cars.find(c=>{if(c.gone)return false;const q=carPos(c);if(Math.abs(q[0]-p[0])>8||Math.abs(q[1]-p[1])>8)return false;if(Math.abs(carY(c)-myY())>2)return false;return obbHit(mm,[q[0],q[1],q[2],2.3,.95])});
  if(Hh){Hh.crash=true;Hh.spin=.3;R.crash={t};crashSnd();ev('crash')}}
 if(R.crash&&t-R.crash.t>3){finish();return}}
function finish(){if(R.over)return;R.over=true;setSig(null);const o=$('ov');let h;
 if(!R.ev.length)h='<h2>驾驶总结</h2><div class="st">★★★</div><p>提早换进最右的出口车道，换过去后跟上车流加速，快到出口才减速，进匝道弯道时车速合适，做得很好。</p>';
 else h='<h2>驾驶总结</h2><p>这一趟有 '+R.ev.length+' 处需要注意：</p><div class="cards">'+R.ev.map(e=>`<div class="card">${e.img?`<img src="${e.img}">`:''}<b>${e.title}${SER.includes(e.key)?'<span class="tag s">严重</span>':'<span class="tag">扣分项</span>'}</b><span>${e.text}</span></div>`).join('')+'</div>';
 o.innerHTML=`<div class="pn">${h}<br><button id="again">再来一次</button> <button id="home" style="background:#6b7280">回到首页</button></div>`;o.style.display='flex';
 $('again').onclick=()=>{o.style.display='none';newRun(true);playing=true};$('home').onclick=()=>{o.innerHTML=HOME;o.style.display='flex';bindHome()}}
// ================= 渲染循环 =================
let last=0,fovH=96;
MRL.rt.setSize(512,256);MRR.rt.setSize(512,256);
{const vf=h=>2*Math.atan(Math.tan(h/2*Math.PI/180)/2)*180/Math.PI;MRL.c.fov=vf(16);MRL.dir.set(Math.sin(7*Math.PI/180),-.03,-1).normalize();MRR.c.fov=vf(24);MRR.dir.set(-Math.sin(11*Math.PI/180),-.03,-1).normalize();[MRL,MRR].forEach(m=>m.c.updateProjectionMatrix())}
function placeMine(){const p=me();place(mine,p[0],p[1],p[2],myY());mine.userData.bl.forEach(m=>{m.position.x=R.sig==='R'?-.88:.88})}
let TOPC=null;
function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;step(dt);const bl=Math.sin(ts/1000*15)>0;const p=me();
 R.cars.forEach(c=>{const q=carPos(c);place(c.c,q[0],q[1],q[2]+(c.spin||0),carY(c));c.c.visible=!c.gone&&Math.hypot(q[0]-p[0],q[1]-p[1])<420});
 placeMine();mine.userData.bl.forEach(m=>m.visible=!!R.sig&&bl);
 sunFollow(p[1]+10,-p[0]);
 if(R.sig&&playing&&!R.over){const on=Math.sin(ts/1000*9.4)>0;$('sg').style.opacity=on?1:.15;if(on!==loop.sgOn){loop.sgOn=on;tick(on)}}
 const q=p;
 {const h=q[2]+R.yaw+yawD,L=R.look?6:10,fT=!R.look?96:R.look.k==='M'?(R.look.t<.55?70:R.look.t<1.35?56:96):90;fovH+=(fT-fovH)*Math.min(1,dt*7);{const sz=ren.getSize(new T.Vector2());cam.aspect=Math.floor(sz.x/2)/sz.y}cam.fov=Math.min(105,2*Math.atan(Math.tan(fovH*Math.PI/360)/cam.aspect)*180/Math.PI);cam.updateProjectionMatrix();
  const ox=.38*Math.cos(q[2]),oz=.38*Math.sin(q[2]),bx0=-q[0]+Math.sin(q[2])*.2,bz0=q[1]-Math.cos(q[2])*.2;const sk=R.crash&&R.t-R.crash.t<.7?(1-(R.t-R.crash.t)/.7)*.12:0;
  const Y=myY();cam.position.set(bx0+ox+(Math.random()-.5)*sk,Y+1.25+(Math.random()-.5)*sk,bz0+oz+(Math.random()-.5)*sk);
  const gr=R.mz!=null?0:grade(R.u);cam.lookAt(-q[0]-Math.sin(h)*L+ox,Y+1.25+L*.05+R.pit*L+gr*L*Math.cos(R.yaw),q[1]+Math.cos(h)*L+oz);
  cockpit.visible=true;cockpit.position.set(bx0,Y+1.25,bz0);cockpit.rotation.order='YXZ';cockpit.rotation.y=-q[2];cockpit.rotation.x=-Math.atan(gr);
  const dh=normA(q[2]-lastH)/Math.max(dt,.001);lastH=q[2];wheel.rotation.z+=((Math.max(-2.6,Math.min(2.6,dh*2.4)))-wheel.rotation.z)*Math.min(1,dt*10)}
 $('sp').textContent=Math.round(R.v*3.6);if(cluster)cluster(Math.round(R.v*3.6));
 if(((loop.fc=(loop.fc||0)+1)&1)===0){const m=MR[(loop.fc>>1)%MR.length],sa=ren.shadowMap.autoUpdate;cockpit.updateMatrixWorld(true);
  m.c.position.copy(cockpit.localToWorld(m.pos.clone()));m.c.lookAt(m.c.position.clone().add(m.dir.clone().transformDirection(cockpit.matrixWorld)));
  cockpit.visible=false;ren.shadowMap.autoUpdate=false;ren.setRenderTarget(m.rt);ren.render(scene,m.c);ren.setRenderTarget(null);ren.shadowMap.autoUpdate=sa;cockpit.visible=true}
 // 分屏：左边俯视（跟着你的车，车头朝上），右边驾驶视角
 {const sz=ren.getSize(new T.Vector2()),w=sz.x,hh=sz.y,w2=Math.floor(w/2);ren.setScissorTest(true);
  ren.setViewport(w-w2,0,w2,hh);ren.setScissor(w-w2,0,w2,hh);mine.visible=false;cockpit.visible=true;ren.render(scene,cam);
  if(!TOPC)TOPC=new T.PerspectiveCamera(40,1,1,800);TOPC.aspect=(w-w2)/hh;TOPC.updateProjectionMatrix();
  const h=q[2],Y=myY(),cx=-q[0]-Math.sin(h)*6,cz=q[1]+Math.cos(h)*6;TOPC.position.set(cx,Y+95,cz);TOPC.up.set(-Math.sin(h),0,Math.cos(h));TOPC.lookAt(cx,Y,cz);
  mine.visible=true;cockpit.visible=false;ren.setViewport(0,0,w-w2,hh);ren.setScissor(0,0,w-w2,hh);ren.render(scene,TOPC);
  mine.visible=false;cockpit.visible=true;ren.setScissorTest(false);ren.setViewport(0,0,w,hh)}
 requestAnimationFrame(loop)}
rs();newRun(false);setView(1);requestAnimationFrame(loop);
const HOME=$('ov').innerHTML;
function bindHome(){document.querySelectorAll('.md').forEach(b=>b.onclick=()=>{DIFF=b.dataset.diff||'easy';$('ov').style.display='none';newRun(true);playing=true})}
bindHome();
$('hm').onclick=()=>{if(R)R.over=true;playing=false;const o=$('ov');o.innerHTML=HOME;o.style.display='flex';bindHome()};
