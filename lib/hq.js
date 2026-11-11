// ============================================================
// hq.js — 画面精修（方案 A 的样板）：天空、光照和柔和阴影、带反光的车漆和玻璃、更细的车和行人、
//          路面／草地／人行道的质感、树。全部用代码生成，不增加下载的图片。
// 放在 lowspeed.js 之后、场景脚本之前加载（之后造的车、行人都用新的样子；地面和树等场景建好再换）；网址加 ?hq=0 可以关掉，对比原来的样子
// ============================================================
(function(){if(typeof location==='undefined'||!T.PMREMGenerator||/[?&]hq=0/.test(location.search))return;      /* 测试环境（没有浏览器）里不用 */
window.HQ=true;
const MAXA=ren.capabilities.getMaxAnisotropy?ren.capabilities.getMaxAnisotropy():1;
const canv=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);return c};
const rnd=(a,b)=>a+Math.random()*(b-a);
// ---------------- 光照、柔和阴影 ----------------
ren.shadowMap.type=T.PCFSoftShadowMap;sun.shadow.mapSize.set(2048,2048);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}
scene.children.forEach(o=>{if(o.isHemisphereLight){o.color.set(0xeef6ff);o.groundColor.set(0x8b8f78);o.intensity=.82}});
sun.intensity=.95;sun.color.set(0xfff0d8);
// ---------------- 天空：从天顶的蓝渐变到地平线的浅色，几朵淡淡的云 ----------------
const HZ='#dbe9f2';
{const c=canv(64,512,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#4f8fd0');g.addColorStop(.35,'#7fb2e2');g.addColorStop(.48,'#cfe3f2');g.addColorStop(.5,HZ);g.addColorStop(1,'#c9d6dc');x.fillStyle=g;x.fillRect(0,0,w,h)});
 const t=new T.CanvasTexture(c);const sky=new T.Mesh(new T.SphereGeometry(250,32,16),new T.MeshBasicMaterial({map:t,side:T.BackSide,fog:false,depthWrite:false}));sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);
 // 天空跟着镜头走（高速上开几公里也一直在头顶）；比其他东西都先画，不会挡住远处的东西
 sky.onBeforeRender=(r,s,c)=>{sky.position.copy(c.getWorldPosition(sky.userData.v||(sky.userData.v=new T.Vector3())));sky.updateMatrixWorld();sky.modelViewMatrix.multiplyMatrices(c.matrixWorldInverse,sky.matrixWorld)};
 // 云：几片平平的半透明白色，挂在天上
 // 云：干净的白色积云——几个圆叠成一朵，底部带一点点浅灰，边缘柔和；每朵云各画一张
 const cloudTex=()=>new T.CanvasTexture(canv(256,128,(x,w,h)=>{x.shadowColor='rgba(255,255,255,1)';x.shadowBlur=10;const n=5+Math.random()*4|0,P=[];
  for(let k=0;k<n;k++){const t=k/(n-1),cx=40+t*176+rnd(-8,8),r=(1-Math.abs(t-.5)*1.3)*rnd(26,38)+10,cy=92-r*.55;P.push([cx,cy,r])}
  const g=x.createLinearGradient(0,30,0,100);g.addColorStop(0,'#ffffff');g.addColorStop(.75,'#f7f9fc');g.addColorStop(1,'#dfe6ee');x.fillStyle=g;
  P.forEach(p=>{x.beginPath();x.arc(p[0],p[1],p[2],0,7);x.fill()});x.fillRect(30,80,196,14)}));
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2+rnd(-.3,.3),d=rnd(190,225),w=rnd(50,85),m=new T.Mesh(new T.PlaneGeometry(w,w*.5),new T.MeshBasicMaterial({map:cloudTex(),transparent:true,opacity:.95,fog:false,depthWrite:false}));
  m.position.set(Math.cos(a)*d,rnd(55,95),Math.sin(a)*d);m.lookAt(0,0,0);m.renderOrder=-9;m.frustumCulled=false;sky.add(m);
  m.onBeforeRender=(r,s,c)=>{m.updateMatrixWorld();m.modelViewMatrix.multiplyMatrices(c.matrixWorldInverse,m.matrixWorld)}}}
scene.background=new T.Color(HZ);scene.fog=new T.Fog(HZ,150,440);
// ---------------- 反光用的环境贴图（天空＋地面），车漆、玻璃用 ----------------
let ENV=null;
{const c=canv(256,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#5d9ad6');g.addColorStop(.45,'#e3eef6');g.addColorStop(.5,'#ffffff');g.addColorStop(.52,'#8d9097');g.addColorStop(1,'#55585e');x.fillStyle=g;x.fillRect(0,0,w,h);
  x.fillStyle='rgba(255,255,255,.9)';x.beginPath();x.arc(70,30,9,0,7);x.fill();      // 太阳的高光
  for(let i=0;i<10;i++){x.fillStyle='rgba(70,78,88,.55)';const bx=rnd(0,w),bw=rnd(10,30),bh=rnd(4,12);x.fillRect(bx,64-bh,bw,bh)}});      // 地平线上的房子、树
 const t=new T.CanvasTexture(c);t.mapping=T.EquirectangularReflectionMapping;const pm=new T.PMREMGenerator(ren);ENV=pm.fromEquirectangular(t).texture;pm.dispose()}
const SM=(o)=>new T.MeshStandardMaterial(o);
const paint={},paintM=col=>paint[col]||(paint[col]=SM({color:col,metalness:.12,roughness:.34,envMap:ENV,envMapIntensity:.9}));
const GLS=SM({color:0x0f151c,metalness:.7,roughness:.06,envMap:ENV,envMapIntensity:1.3,transparent:true,opacity:.93,side:T.DoubleSide}),
 CHR=SM({color:0xe4e8ee,metalness:1,roughness:.18,envMap:ENV}),BLK=SM({color:0x16181c,roughness:.75,metalness:0}),TIRE=SM({color:0x131416,roughness:.92}),
 RIM=SM({color:0xc3c8cf,metalness:.85,roughness:.28,envMap:ENV}),DISC=SM({color:0x5b5f66,metalness:.6,roughness:.5}),
 HL=new T.MeshBasicMaterial({color:0xfffbea}),TLM=SM({color:0xb3121b,roughness:.25,metalness:.1,emissive:0x5a0408,envMap:ENV}),SEAM=new T.MeshBasicMaterial({color:0x0b0c0e}),
 PLATE=new T.MeshBasicMaterial({map:new T.CanvasTexture(canv(128,64,(x,w,h)=>{x.fillStyle='#f7f8fa';x.fillRect(0,0,w,h);x.strokeStyle='#1f3f8a';x.lineWidth=3;x.strokeRect(3,3,w-6,h-6);x.fillStyle='#1f3f8a';x.font='bold 30px Arial';x.textAlign='center';x.fillText('HY 2026',w/2,44)}))});
// 车底的软阴影（像环境光遮蔽），让车“坐”在地上
const SHD=new T.MeshBasicMaterial({map:new T.CanvasTexture(canv(128,256,(x,w,h)=>{x.shadowColor='rgba(0,0,0,1)';x.shadowBlur=26;x.fillStyle='rgba(0,0,0,.95)';x.fillRect(30,34,68,188)})),transparent:true,opacity:.62,depthWrite:false});
const SHDG=new T.PlaneGeometry(2.5,5.3);SHDG.rotateX(-Math.PI/2);
// 把一辆车里不会动的零件按材质合并成几块：几十辆停着的车也不卡（手机上要紧）
function mergeGroup(g,skip){g.updateMatrixWorld(true);const inv=new T.Matrix4().copy(g.matrixWorld).invert(),by=new Map(),rm=[];
 g.traverse(o=>{if(!o.isMesh||skip.has(o)||o.parent!==g)return;const mt=o.material;if(!by.has(mt))by.set(mt,[]);by.get(mt).push(o);rm.push(o)});
 by.forEach((list,mt)=>{if(list.length<2)return;let P=[],N=[],U=[];list.forEach(o=>{let ge=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();const m=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld);ge.applyMatrix4(m);
   const p=ge.attributes.position.array,n=ge.attributes.normal?ge.attributes.normal.array:new Float32Array(p.length),u=ge.attributes.uv?ge.attributes.uv.array:new Float32Array(p.length/3*2);P.push(p);N.push(n);U.push(u)});
  const cat=a=>{const L=a.reduce((s,x)=>s+x.length,0),r=new Float32Array(L);let k=0;a.forEach(x=>{r.set(x,k);k+=x.length});return r};
  const ge=new T.BufferGeometry();ge.setAttribute('position',new T.BufferAttribute(cat(P),3));ge.setAttribute('normal',new T.BufferAttribute(cat(N),3));ge.setAttribute('uv',new T.BufferAttribute(cat(U),2));
  list.forEach(o=>g.remove(o));const mm=new T.Mesh(ge,mt);mm.castShadow=list.some(o=>o.castShadow);mm.receiveShadow=true;mm.renderOrder=list[0].renderOrder;g.add(mm)})}
// ---------------- 车：车漆反光、轮拱、轮毂、门缝、门把手、格栅、车牌、尾灯 ----------------
window.car=function(col){const g=new T.Group(),pm=paintM(col),add=(geo,m,x,y,z,rx,ry,rz)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);if(rx||ry||rz)o.rotation.set(rx||0,ry||0,rz||0);g.add(o);return o};
 const b=add(bodyG,pm,0,0,0);b.castShadow=true;
 add(wsG,GLS,0,0,0);add(rwG,GLS,0,0,0);
 [-1,1].forEach(sx=>{add(winG,GLS,sx*.99,0,0);
  add(new T.BoxGeometry(.18,.13,.11),pm,sx*1.0,1.03,.9);add(new T.BoxGeometry(.15,.09,.03),CHR,sx*1.0,1.03,.84);add(new T.BoxGeometry(.1,.05,.1),BLK,sx*.94,.98,.92);      // 后视镜（位置不变：停车时“镜子对镜子”）
  [1.4,-1.4].forEach(z=>{add(new T.CylinderGeometry(.36,.36,.24,24),TIRE,sx*.8,.36,z,0,0,Math.PI/2);
   add(new T.CylinderGeometry(.22,.22,.03,20),RIM,sx*.925,.36,z,0,0,Math.PI/2);add(new T.CylinderGeometry(.12,.12,.02,14),DISC,sx*.935,.36,z,0,0,Math.PI/2);
   for(let k=0;k<5;k++){const a=k/5*Math.PI*2;add(new T.BoxGeometry(.02,.2,.045),RIM,sx*.94,.36+Math.cos(a)*.1,z+Math.sin(a)*.1,a,0,0)}      // 五根轮辐
   add(new T.TorusGeometry(.44,.045,6,18,Math.PI),BLK,sx*.92,.36,z,0,Math.PI/2,0)});      // 黑色轮拱
  add(new T.BoxGeometry(.05,.1,1.9),BLK,sx*.955,.4,0);      // 侧裙
  [.98,-.28,-1.2].forEach(z=>add(new T.BoxGeometry(.012,.56,.014),SEAM,sx*.972,.74,z));      // 门缝
  [.5,-.62].forEach(z=>add(new T.BoxGeometry(.03,.035,.17),CHR,sx*.975,.95,z))});      // 门把手
 add(new T.BoxGeometry(1.7,.14,4.3),BLK,0,.3,0);
 // 车头：格栅、两个大灯（灯壳＋灯）、车牌
 add(new T.BoxGeometry(.95,.17,.05),BLK,0,.55,2.33);add(new T.BoxGeometry(.5,.12,.02),PLATE,0,.45,2.37);
 [-1,1].forEach(sx=>{add(new T.BoxGeometry(.44,.16,.05),CHR,sx*.62,.74,2.31);add(new T.BoxGeometry(.38,.12,.05),HL,sx*.62,.74,2.335)});      // 两个车头灯
 // 车尾：两个尾灯、车牌
 [-1,1].forEach(sx=>add(new T.BoxGeometry(.42,.13,.06),TLM,sx*.6,.86,-2.34));add(new T.BoxGeometry(.75,.05,.04),BLK,0,.86,-2.35);add(new T.BoxGeometry(.5,.12,.02),PLATE,0,.62,-2.38,0,Math.PI,0);
 add(SHDG,SHD,0,.018,0).renderOrder=-1;
 const bl=[];[[.88,2.2],[.88,-2.2]].forEach(a=>{const m=add(new T.BoxGeometry(.5,.3,.14),new T.MeshBasicMaterial({color:0xff8a00}),a[0],.74,a[1]);m.visible=false;bl.push(m);
  const h=add(new T.BoxGeometry(1.1,.7,.08),new T.MeshBasicMaterial({color:0xffc040,transparent:true,opacity:.85}),a[0],.74,a[1]+(a[1]>0?.1:-.1));h.visible=false;bl.push(h)});
 mergeGroup(g,new Set(bl));g.userData.bl=bl;scene.add(g);return g};
// ---------------- 行人：圆润一些的身体、脖子、关节 ----------------
const pmat={},PM=c=>pmat[c]||(pmat[c]=SM({color:c,roughness:.85}));
window.ped=function(col){const g=new T.Group(),Rr=a=>a[Math.random()*a.length|0],sk=Rr([0xf1c9a0,0xe0b088,0xc58a5e,0x8d5a3b,0x6b4429]),hc=Rr([0x1b1b1f,0x3a2a1c,0x7a4a24,0xd8b04a,0x8a8a8a]),pc=Rr([0x2b3a55,0x3a3f48,0x5a4a38,0x1f2328,0x4a5a6e]),shc=Rr([0x15171b,0xf2f2f2,0x6b3a1e]);
 const ad=(geo,m,x,y,z,p)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);(p||g).add(o);return o};
 const limb=(x,y,r0,r1,l,c,hand)=>{const p=new T.Group();p.position.set(x,y,0);ad(new T.CylinderGeometry(r0,r1,l,10),PM(c),0,-l/2,0,p);ad(new T.SphereGeometry(r0,10,8),PM(c),0,0,0,p);
  if(hand)ad(new T.SphereGeometry(r1*1.15,10,8),PM(sk),0,-l-.03,0,p);else{const s=ad(new T.SphereGeometry(.075,10,8),PM(shc),0,-l-.02,.05,p);s.scale.set(.9,.6,1.7)}
  g.add(p);return p};
 g.userData={l:limb(-.1,.84,.085,.06,.8,pc),r:limb(.1,.84,.085,.06,.8,pc),al:limb(-.27,1.42,.06,.045,.6,col,1),ar:limb(.27,1.42,.06,.045,.6,col,1)};
 const tor=new T.LatheGeometry([[0,.78],[.17,.8],[.19,.9],[.17,1.02],[.2,1.22],[.22,1.38],[.17,1.47],[.07,1.5],[0,1.5]].map(p=>new T.Vector2(p[0],p[1])),16);const tm=ad(tor,PM(col),0,0,0);tm.scale.set(1,1,.72);
 const hip=ad(new T.SphereGeometry(.17,12,8),PM(pc),0,.84,0);hip.scale.set(1.05,.5,.75);
 ad(new T.CylinderGeometry(.055,.06,.1,10),PM(sk),0,1.53,0);
 const hd=ad(new T.SphereGeometry(.15,16,12),PM(sk),0,1.66,0);hd.scale.set(.95,1.08,1);
 [-.055,.055].forEach(x=>ad(new T.SphereGeometry(.018,8,6),PM(0x15171b),x,1.68,.135));ad(new T.SphereGeometry(.022,8,6),PM(sk),0,1.64,.15);
 const hr=ad(new T.SphereGeometry(.158,16,10,0,Math.PI*2,0,1.25),PM(hc),0,1.675,-.01);hr.scale.set(.97,1.08,1.02);
 ad(new T.SphereGeometry(.158,16,10,Math.PI,Math.PI,0,2.0),PM(hc),0,1.665,-.012).scale.set(.97,1.05,1.02);
 const bg=Math.random();
 if(bg<.5){const bp=ad(new T.BoxGeometry(.32,.4,.15),PM(Rr([0xc0392b,0x2c3e50,0x27ae60,0xe67e22])),0,1.18,-.2);[-.12,.12].forEach(x=>ad(new T.BoxGeometry(.035,.36,.03),PM(0x15171b),x,1.2,-.12))}
 else if(bg<.7)ad(new T.BoxGeometry(.22,.18,.09),PM(0x5a3a22),.25,.88,.06);
 if(Math.random()<.3){const hat=Rr([0xc0392b,0x2c3e50,0x15171b,0xe8e8e8]);ad(new T.SphereGeometry(.165,16,10,0,Math.PI*2,0,1.35),PM(hat),0,1.69,-.005);ad(new T.BoxGeometry(.2,.02,.12),PM(hat),0,1.69,.17)}
 g.traverse(o=>o.castShadow=true);scene.add(g);return g};
// ---------------- 地面质感：沥青、草地、人行道（按真实尺寸铺，不会拉伸） ----------------
function tex(c,m){const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=MAXA;t.userData={m};return t}
const grain=(x,w,h,amp,base)=>{const d=x.getImageData(0,0,w,h),a=d.data;for(let i=0;i<a.length;i+=4){const v=(Math.random()-.5)*amp;a[i]+=v;a[i+1]+=v;a[i+2]+=v}x.putImageData(d,0,0)};
const ASFT=tex(canv(512,512,(x,w,h)=>{x.fillStyle='#64666b';x.fillRect(0,0,w,h);      // 一格 7 米：比较新的沥青——细细的颗粒，只有很淡的深浅变化，没有裂缝
  for(let i=0;i<14;i++){const cx=rnd(0,w),cy=rnd(0,h),r=rnd(60,140),g=x.createRadialGradient(cx,cy,0,cx,cy,r),dk=Math.random()<.5;g.addColorStop(0,dk?'rgba(40,42,46,.06)':'rgba(140,142,146,.05)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx-r,cy-r,2*r,2*r)}
  grain(x,w,h,22);for(let i=0;i<2200;i++){x.fillStyle=Math.random()<.5?'rgba(170,170,172,.3)':'rgba(30,30,32,.3)';x.fillRect(rnd(0,w),rnd(0,h),1.2,1.2)}}),7);
const RDT=tex(canv(512,512,(x,w,h)=>{x.fillStyle='#55585d';x.fillRect(0,0,w,h);grain(x,w,h,30);for(let i=0;i<4000;i++){x.fillStyle=Math.random()<.5?'rgba(170,170,172,.45)':'rgba(25,25,28,.5)';x.fillRect(rnd(0,w),rnd(0,h),1.5,1.5)}
  for(const cx of[128,384]){const g=x.createLinearGradient(cx-60,0,cx+60,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,'rgba(25,25,28,.16)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx-60,0,120,h)}}),7.4);      // 大路：车轮压出来的两道深色轨迹
const GRT=tex(canv(256,256,(x,w,h)=>{x.fillStyle='#7aa85a';x.fillRect(0,0,w,h);for(let i=0;i<30;i++){const cx=rnd(0,w),cy=rnd(0,h),r=rnd(20,70),g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,Math.random()<.5?'rgba(60,110,40,.25)':'rgba(150,170,80,.2)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx-r,cy-r,2*r,2*r)}
  for(let i=0;i<6000;i++){const l=Math.random()<.5;x.strokeStyle=l?'rgba(170,205,120,.35)':'rgba(40,85,30,.35)';x.lineWidth=1;const px=rnd(0,w),py=rnd(0,h);x.beginPath();x.moveTo(px,py);x.lineTo(px+rnd(-1.5,1.5),py-rnd(2,5));x.stroke()}}),5);
const SWT=tex(canv(256,256,(x,w,h)=>{x.fillStyle='#d3d1ca';x.fillRect(0,0,w,h);grain(x,w,h,18);x.strokeStyle='rgba(120,118,112,.7)';x.lineWidth=2;x.strokeRect(1,1,w-2,h-2)}),1.5);      // 人行道：1.5 米一块水泥板
const CRT=tex(canv(128,128,(x,w,h)=>{x.fillStyle='#cfd0d2';x.fillRect(0,0,w,h);grain(x,w,h,22)}),1.2);
function worldUV(o,t){const ge=o.geometry,p=ge.attributes.position,n=p.count,uv=new Float32Array(n*2),v=new T.Vector3(),s=t.userData.m;o.updateMatrixWorld(true);
 for(let i=0;i<n;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);uv[i*2]=v.x/s;uv[i*2+1]=v.z/s}ge.setAttribute('uv',new T.BufferAttribute(uv,2))}
const swap=(mat,t,col)=>{if(!mat)return null;const m=SM({color:col||0xffffff,map:t,roughness:.95,metalness:0,side:mat.side});return m};
function late(){
sun.intensity=1.0;sun.color.set(0xfff0d8);scene.children.forEach(o=>{if(o.isHemisphereLight)o.intensity=.72});      // 阳光强一些、环境光弱一些：阴影更清楚（场景脚本里会改阳光，所以放在这里）
if(typeof LOT!=='undefined'){const MAP=new Map([[LOT.ASF,swap(LOT.ASF,ASFT)],[LOT.RD,swap(LOT.RD,RDT)],[LOT.GRS,swap(LOT.GRS,GRT)],[LOT.GRS2,swap(LOT.GRS2,GRT)],[LOT.SWK,swap(LOT.SWK,SWT)],[LOT.CRB,swap(LOT.CRB,CRT)]]);
 scene.traverse(o=>{if(o.isMesh&&MAP.has(o.material)){const nm=MAP.get(o.material);worldUV(o,nm.map);o.material=nm;o.receiveShadow=true}});
 // 停车场的补丁：深一点、边缘不那么硬
 if(LOT.PAT){LOT.PAT.color.set(0x5d5f63);LOT.PAT.transparent=true;LOT.PAT.opacity=.25}
 // 车位黄线：旧旧的油漆（有磨损）
 if(LOT.YEL){LOT.YEL.map=new T.CanvasTexture(canv(256,16,(x,w,h)=>{x.fillStyle='#e2bd45';x.fillRect(0,0,w,h);for(let i=0;i<260;i++){x.fillStyle='rgba(110,110,112,'+rnd(.15,.6)+')';x.fillRect(rnd(0,w),rnd(0,h),rnd(1,6),rnd(1,3))}}));LOT.YEL.color.set(0xffffff);LOT.YEL.needsUpdate=true}
 // 商铺的玻璃：能映出天空
 if(LOT.GLS){const g=SM({color:0x2c4256,metalness:.6,roughness:.08,envMap:ENV,envMapIntensity:1.2});scene.traverse(o=>{if(o.isMesh&&o.material===LOT.GLS)o.material=g})}}
// 其他场景的地面：按颜色和形状认出来（平平的、大块的、直接放在场景里的）——草地、沥青、人行道、路缘，换成同样的质感，原来的颜色深浅不变
{const DA=tex(canv(512,512,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);for(let i=0;i<14;i++){const cx=rnd(0,w),cy=rnd(0,h),r=rnd(60,140),g=x.createRadialGradient(cx,cy,0,cx,cy,r),dk=Math.random()<.5;g.addColorStop(0,dk?'rgba(40,40,40,.06)':'rgba(200,200,200,.05)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx-r,cy-r,2*r,2*r)}
   grain(x,w,h,22);for(let i=0;i<2200;i++){x.fillStyle=Math.random()<.5?'rgba(215,215,215,.28)':'rgba(30,30,30,.28)';x.fillRect(rnd(0,w),rnd(0,h),1.2,1.2)}}),7),
  DG=tex(canv(256,256,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);for(let i=0;i<30;i++){const cx=rnd(0,w),cy=rnd(0,h),r=rnd(20,70),g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,Math.random()<.5?'rgba(40,40,40,.2)':'rgba(220,220,220,.16)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx-r,cy-r,2*r,2*r)}
   for(let i=0;i<6000;i++){const l=Math.random()<.5;x.strokeStyle=l?'rgba(220,230,200,.35)':'rgba(30,45,20,.35)';x.lineWidth=1;const px=rnd(0,w),py=rnd(0,h);x.beginPath();x.moveTo(px,py);x.lineTo(px+rnd(-1.5,1.5),py-rnd(2,5));x.stroke()}}),5),
  DS=tex(canv(256,256,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);grain(x,w,h,18);x.strokeStyle='rgba(60,60,60,.6)';x.lineWidth=2;x.strokeRect(1,1,w-2,h-2)}),1.5),
  DC=tex(canv(128,128,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);grain(x,w,h,22)}),1.2);
 const colOf=m=>{let r=m.color.r*255,g=m.color.g*255,b=m.color.b*255;const im=m.map&&m.map.image;if(im&&im.getContext){const d=im.getContext('2d').getImageData(0,0,24,24).data;let R=0,G=0,B=0,n=d.length/4;for(let i=0;i<d.length;i+=4){R+=d[i];G+=d[i+1];B+=d[i+2]}r*=R/n/255;g*=G/n/255;b*=B/n/255}return[r,g,b]};
 const kind=(m,bb)=>{const[r,g,b]=colOf(m),dx=bb.max.x-bb.min.x,dy=bb.max.y-bb.min.y,dz=bb.max.z-bb.min.z,L=Math.max(dx,dz),W=Math.min(dx,dz);
  if(L<1.5||dy>.35+.09*L)return null;if(g>r+12&&g>b+12)return'g';const mx=Math.max(r,g,b),mn=Math.min(r,g,b),lum=(r+g+b)/3;if(mx-mn>24)return null;
  if(lum<135)return'a';if(lum>=150)return W<.45?'c':'s';return null};
 const uses=new Map();scene.traverse(o=>{if(o.isMesh)uses.set(o.geometry,(uses.get(o.geometry)||0)+1)});
 const done=new Map(),bb=new T.Box3();
 scene.children.slice().forEach(o=>{if(!o.isMesh||!o.material||!o.material.isMeshLambertMaterial||o.material.transparent)return;bb.setFromObject(o);const k=kind(o.material,bb);if(!k)return;
  const key=o.material.uuid+k;let nm=done.get(key);if(!nm){const[r,g,b]=colOf(o.material),t={a:DA,g:DG,s:DS,c:DC}[k];nm=SM({color:new T.Color(r/128,g/128,b/128),map:t,roughness:.95,metalness:0,side:o.material.side});done.set(key,nm)}
  if(uses.get(o.geometry)>1)o.geometry=o.geometry.clone();worldUV(o,nm.map);o.material=nm;o.receiveShadow=true})}
// ---------------- 树：几团叶子组成的树冠（有棱角的低多边形风格），颜色深浅不一 ----------------
{const LV=[0x3d7f36,0x4a9140,0x5b9a3a,0x3f7a2f].map(c=>SM({color:c,roughness:.9,flatShading:true})),TR=SM({color:0x6a4a30,roughness:.95});
 const trees=[];scene.traverse(o=>{if(!o.isMesh||o.geometry.type!=='SphereGeometry'||!o.parent||o.parent===scene||o.parent.parent!==scene)return;const r=o.geometry.parameters.radius,c=o.material.color;if(r<1.2||!(c.g>c.r+.05&&c.g>c.b+.05))return;trees.push(o)});      // 树冠：绿色的大球，在一个直接放在场景里的组里
 trees.forEach(o=>{const r=o.geometry.parameters.radius,p=o.parent,lm=LV[Math.random()*LV.length|0];o.geometry=new T.IcosahedronGeometry(r*.88,1);o.material=lm;      /* 树冠总大小和原来差不多，不伸到路上 */
  for(let k=0;k<3;k++){const a=k/3*Math.PI*2+rnd(0,1),b=new T.Mesh(new T.IcosahedronGeometry(r*rnd(.5,.6),1),LV[Math.random()*LV.length|0]);b.position.set(o.position.x+Math.cos(a)*r*.42,o.position.y+rnd(-.5,.4),o.position.z+Math.sin(a)*r*.42);b.castShadow=true;p.add(b)}
  const t=p.children[0];if(t&&t.isMesh&&t.geometry.type==='CylinderGeometry')t.material=TR})}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',late);else late();      // 场景（地面、树）都建好以后再换质感
// ---------------- 方向盘：更圆润的皮质轮圈 ----------------
if(typeof wheel!=='undefined'){const LE=SM({color:0x1d2025,roughness:.55,metalness:0,envMap:ENV,envMapIntensity:.4});const rim=wheel.children[0];if(rim&&rim.geometry.type==='TorusGeometry'){rim.geometry=new T.TorusGeometry(.17,.032,16,64);rim.material=LE}}
})();
