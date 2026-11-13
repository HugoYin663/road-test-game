// ============================================================
// plaza.js — 出车位、停车场头进共用的停车场（商铺、出口、大路、对面的汽车经销店）
// ============================================================
// 路线坐标：x 向东（右）为正，z 向北为正。停车场的车道南北走向；车道南头是一条东西向的通道，往西通到出口和大路
const HOOD={drives:[]};
const AW=3.6,SD=5.5,SWD=2.75,XC=AW+SD,ZS=k=>k*SWD,PCX=XC-.55-LW.HL;
const ZA=ZS(-8)-SWD/2,ZB=ZA-7,ZL=ZA-1.8;      // 车位排到 ZA 为止；南边的通道 z 在 ZB～ZA，往西开时走北半边（右边）ZL
const XR=-20,NX=-21.85,SX=-25.55,XW=-27.4,ZC=(ZA+ZB)/2;      // 大路：东边路缘 x＝-20；往北的车道（近）、往南的车道（远）；出口中心 ZC
const LANE=-1.8;      // 在车道里往南开时走西半边（右边）
const VR=50/3.6;      // 大路车速
// ---------------- 场景 ----------------
const LOT={ASF:M(0xffffff,{map:noise('#6f7176',40,70)}),RD:M(0x55585d),CAP:M(0xf2efe8),AWN:M(0x2f7d6d),S1:M(0x2f6fe0),S2:M(0xd9483b),S3:M(0x3a9a5b),S4:M(0xf0b429),PAT:M(0x707277),YEL:M(0xd9b23c),CRB:M(0xc9cbcf),SWK:M(0xd5d3cc),GRS:M(0xffffff,{map:noise('#79a95a',50,40)}),GRS2:M(0x79a95a),
 BRK:M(0xc49a72),GLS:M(0x6f93ad),FRM:M(0xd9dcdf),DK:M(0x3a3d42),WH:M(0xf3f4f6),GRY:M(0xc9ced4)};
hSlab(0,-300,300,-300,300,-.05,LOT.GRS);
sun.intensity=.75;sun.color.set(0xfff1d6);
hSlab(0,-XC-.3,XC+.3,ZB,80,.0,LOT.ASF);      // 停车场
hSlab(0,XC+.3,XC+70,ZB,ZA,.0,LOT.ASF);      // 南头的通道一直往东，从商铺前面过去（和出口正对着）
hSlab(0,XR,-XC-.3,ZB,ZA,.0,LOT.ASF);      // 出口
hSlab(0,XW,XR,-300,300,.0,LOT.RD);      // 大路（双向两车道）
// 出口两边的路缘做成圆角：先铺一块沥青，再盖一块四分之一圆的草地
[[ZA,1],[ZB,-1]].forEach(([z0,s])=>{hSlab(0,XR,XR+3,Math.min(z0,z0+3*s),Math.max(z0,z0+3*s),.0,LOT.ASF);const q=mesh(new T.CircleGeometry(3,16,s>0?0:-Math.PI/2,Math.PI/2),LOT.GRS2,-(XR+3),.008,z0+3*s);q.rotation.x=-Math.PI/2;scene.add(q)});
for(let i=0;i<20;i++){const x=(Math.random()*2-1)*(XC-.5),z=ZB+Math.random()*100,w=.6+Math.random()*2.2,d=.5+Math.random()*3;const p=mesh(new T.PlaneGeometry(w,d),LOT.PAT,-x,.006,z);p.rotation.x=-Math.PI/2;p.rotation.z=Math.random()*.6;scene.add(p)}
// 车位线
const SLINE=new T.PlaneGeometry(SD-.1,.1);
for(let k=-9;k<=24;k++)[-1,1].forEach(s=>{if(s<0&&k<-8)return;const p=mesh(SLINE,LOT.YEL,-(s*(AW+SD/2+.05)),.012,ZS(k)+SWD/2);p.rotation.x=-Math.PI/2;scene.add(p)});
// 大路的黄色单中线：在出口那里断开（车可以从这里左转进出）
[[-300,ZB-3],[ZA+3,300]].forEach(([a,b])=>{const p=mesh(new T.PlaneGeometry(.12,b-a),LOT.YEL,23.7,.012,(a+b)/2);p.rotation.x=-Math.PI/2;scene.add(p)});
// 路缘、人行道
box(.2,.15,80-ZA,LOT.CRB,XC+.1,.075,(80+ZA)/2);box(2.6,.14,80-ZA,LOT.SWK,XC+1.5,.07,(80+ZA)/2);      // 东边
box(70-.3,.15,.2,LOT.CRB,XC+.3+35,.075,ZA+.1);box(70,.14,2.4,LOT.SWK,XC+35,.07,ZA+1.3);      // 通道北边：商铺门前的路缘和人行道
box(.2,.15,80-ZA,LOT.CRB,-(XC+.1),.075,(80+ZA)/2);      // 西边车位尽头的路缘（出口那段没有）
box(2.5,.02,240,LOT.SWK,-(XC+1.45),.012,-40);      // 西边的人行道（在出口那里和路面平，横过出口）
box(XC+70+17,.15,.2,LOT.CRB,(XC+70-17)/2,.075,ZB-.1);box(60,.14,2.4,LOT.SWK,XC+10+30,.07,ZB-1.3);      // 南边的路缘
[[ZA+3,300],[-300,ZB-3]].forEach(([a,b])=>{box(.2,.15,b-a,LOT.CRB,XR-.1,.075,(a+b)/2)});box(.2,.15,600,LOT.CRB,XW-.1,.075,0);
box(1.6,.02,600,LOT.SWK,XW-1.3,.012,0);      // 大路西边的人行道
// 东边的商铺（同倒车入位）
{const X0=XC+4.2,X1=X0+14,Z0=ZA+3,Z1=80,ZM=(Z0+Z1)/2,L=Z1-Z0;box(X1-X0,4.2,L,LOT.BRK,(X0+X1)/2,2.1,ZM);box(X1-X0+.6,.35,L+.6,LOT.CAP,(X0+X1)/2,4.3,ZM);box(1.4,.04,L,LOT.SWK,XC+3.3,.15,ZM);
 const SC=[LOT.S1,LOT.S2,LOT.S3,LOT.S4];let si=0;
 for(let z=Z0+1;z<Z1-8;z+=8){box(.06,2.7,6.2,LOT.FRM,X0-.03,1.6,z+4);box(.07,2.5,5.8,LOT.GLS,X0-.04,1.55,z+4);box(.08,2.8,.08,LOT.FRM,X0-.05,1.6,z+4);box(.1,.7,5.2,SC[si++%4],X0-.06,3.4,z+4);box(.12,.18,6.4,LOT.AWN,X0-.5,2.95,z+4)}
 for(let z=ZA+6;z<80;z+=24){const lp=new T.Group();lp.add(mesh(new T.CylinderGeometry(.07,.09,8,8),LOT.DK,0,4,0));lp.add(mesh(new T.BoxGeometry(.9,.18,.4),LOT.DK,.4,8,0));lp.position.set(-(XC+.9),0,z);scene.add(lp)}}
// 树：出口两边的草地、南边
for(let z=ZA+5;z<150;z+=9+Math.random()*3)hTree(-(XC+5.5+Math.random()*2),z,0);
for(let z=ZB-5;z>-150;z-=9+Math.random()*3)hTree(-(XC+5.5+Math.random()*2),z,0);
for(let x=-6;x<XC+6;x+=10+Math.random()*3)hTree(x,ZB-4-Math.random()*2,0);
// 通道南边的另一排商铺（门脸朝北，对着通道）
{const Zb=ZB-3,Zc=Zb-14,X0=XC+10,X1=XC+64;box(X1-X0,4.2,Zb-Zc,LOT.BRK,(X0+X1)/2,2.1,(Zb+Zc)/2);box(X1-X0+.6,.35,Zb-Zc+.6,LOT.CAP,(X0+X1)/2,4.3,(Zb+Zc)/2);
 const SC=[LOT.S3,LOT.S4,LOT.S1,LOT.S2];let si=0;for(let x=X0+1;x<X1-6;x+=8){box(6.2,2.7,.06,LOT.FRM,x+4,1.6,Zb+.03);box(5.8,2.5,.07,LOT.GLS,x+4,1.55,Zb+.04);box(5.2,.7,.1,SC[si++%4],x+4,3.4,Zb+.06);box(6.4,.18,.12,LOT.AWN,x+4,2.95,Zb+.5)}}
// 大路西边：电线杆、对面的汽车经销店（大玻璃、白墙）和门口一排车
{const PSKIP=/exit(\.html)?$/.test(location.pathname)?[-48,-86]:[];      /* 出考场左转上大路：这两根电线杆正好在你和右前方的广告牌之间，拿掉（电线照样连着），广告牌不再被挡住 */
 for(let z=-200;z<200;z+=38){if(PSKIP.includes(z))continue;const p=new T.Group();p.add(mesh(new T.CylinderGeometry(.13,.16,10,8),M(0x6b5a48),0,5,0));p.add(mesh(new T.BoxGeometry(1.8,.12,.12),M(0x6b5a48),0,9.3,0));p.position.set(-(XW-2.6),0,z);scene.add(p)}
 [9.25,9.6].forEach(y=>[-.8,.8].forEach(dx=>{const w=mesh(new T.BoxGeometry(.03,.03,400),M(0x2a2a2a),-(XW-2.6+dx),y,0);scene.add(w)}));
 const X0=XW-18,X1=X0-26;box(X0-X1,7,46,LOT.WH,(X0+X1)/2,3.5,-30);box(.1,4.2,40,LOT.GLS,X0+.05,3.2,-30);box(X0-X1+.4,.4,46.4,LOT.GRY,(X0+X1)/2,7.2,-30);
 const sg=mesh(new T.PlaneGeometry(9,1.6),new T.MeshBasicMaterial({map:cv(512,90,(x,w,h)=>{x.fillStyle='#ffffff';x.fillRect(0,0,w,h);x.fillStyle='#c62828';x.font='bold 58px sans-serif';x.textAlign='center';x.fillText('AUTO  SALES',w/2,66)})}),-(X0+.12),6.1,-30);sg.rotation.y=-Math.PI/2;scene.add(sg);
 {const lc=document.createElement('canvas');lc.width=180;lc.height=180;const lx=lc.getContext('2d');lx.fillStyle='#ffffff';lx.fillRect(0,0,180,180);const lt=new T.CanvasTexture(lc);
  const im=document.createElement('img');im.onload=()=>{const t=document.createElement('canvas');t.width=128;t.height=212;const tx=t.getContext('2d');tx.drawImage(im,0,0);tx.globalCompositeOperation='source-in';tx.fillStyle='#1f3f8a';tx.fillRect(0,0,128,212);lx.drawImage(t,90-128*150/212/2,15,128*150/212,150);lt.needsUpdate=true};im.src='assets/logo.png';
  const lg=mesh(new T.PlaneGeometry(1.6,1.6),new T.MeshBasicMaterial({map:lt}),-(X0+.12),6.1,-35.6);lg.rotation.y=-Math.PI/2;scene.add(lg)}      // 方向盘上的 HY 标志：白底（和招牌一样高），标志深蓝色，在 AUTO SALES 左边
 box(14,.12,60,LOT.ASF,X0+7,.02,-30);
 for(let i=0;i<9;i++){const c=car([0xf4f6f8,0xd9483b,0x1f2328,0x2f6fe0,0xb9bec4][i%5]);c.position.set(-(X0+4),0,-52+i*5.2);c.rotation.y=Math.PI/2;
  const c2=car([0xb9bec4,0xf4f6f8,0x23324f][i%3]);c2.position.set(-(X0+10),0,-50+i*5.2);c2.rotation.y=Math.PI/2}}
const PCOLS=[0xf4f6f8,0x1f2328,0x1f2328,0xb9bec4,0x7b8794,0x23324f,0x4a4f57,0x8e2b2b,0xeceff1];
