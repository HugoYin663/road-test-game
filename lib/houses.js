// ============================================================
// houses.js — 北美小区的独立屋（house）：几种常见式样，尺寸不大
//   ranch     平房：一层、宽，低矮的四坡顶，车库在房子一头
//   capecod   科德角：一层半，陡的人字屋顶，屋顶上两个老虎窗，门在正中，一头有烟囱
//   colonial  殖民式：两层、左右对称，门在正中带小门廊，窗边有百叶，旁边一层的车库
//   suburban  安省常见的两层砖房：四坡顶，车库往前突出、车库上是朝街的山墙
//   craftsman 工匠平房：朝街的山墙，整排的前廊和柱子，车道在房子旁边
// 用法：const o=buildHouse({base:1.2}) → o.g（正面朝 +z、地面 y=0 的 Group），o.gx 车道中心的 x，o.zf 车道开始处（车库门/路边那一侧）的 z
// 每栋房子按材质合并成几个网格，几百栋也不会太卡
// ============================================================
const HS={
 SIDING:[0xd9d4c7,0xc8cfd2,0xa9b4a2,0x9aa8b5,0xe9e4d6,0xf1ede4,0xd7c9a3,0x8f9c8c,0xb9ad98],
 BRICK:[0xa24f3a,0x8e4a36,0xb76a4c,0x9d7a5c,0xc4a07a,0x7d4b3b],
 ROOF:[0x3a3d42,0x4b4239,0x2e3034,0x5a4c40,0x55585e,0x3f3a36],
 DOOR:[0x7a2a2a,0x1f4566,0x2f4f3a,0x1b1b1b,0x6b4a2e,0xf2f0ea],
 SHUT:[0x1f2a33,0x2f4f3a,0x5b2a2a,0x3b3f45]};
const HSM={};const hsm=c=>HSM[c]||(HSM[c]=M(c));      // 同色材质共用
const HS_GLASS=0x2b3a48,HS_TRIM=0xf3f1ea,HS_GAR=0xeceae4,HS_STEP=0xbdb8ad,HS_CHIM=0x8a4a38;
const hsPick=a=>a[Math.random()*a.length|0];
// 把一堆几何体按材质合并（只要位置和法线）
function hsMerge(parts){const by=new Map();parts.forEach(([geo,mat])=>{const gg=geo.index?geo.toNonIndexed():geo;if(!by.has(mat))by.set(mat,[]);by.get(mat).push(gg)});
 const out=[];by.forEach((list,mat)=>{let n=0;list.forEach(g=>n+=g.attributes.position.count);const P=new Float32Array(n*3),N=new Float32Array(n*3);let k=0;
  list.forEach(g=>{P.set(g.attributes.position.array,k*3);N.set(g.attributes.normal.array,k*3);k+=g.attributes.position.count});
  const ge=new T.BufferGeometry();ge.setAttribute('position',new T.BufferAttribute(P,3));ge.setAttribute('normal',new T.BufferAttribute(N,3));out.push(new T.Mesh(ge,mat))});
 return out}
function hsKit(){const parts=[],m4=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),one=new T.Vector3(1,1,1);
 const put=(geo,mat,x,y,z,ry)=>{e.set(0,ry||0,0);q.setFromEuler(e);m4.compose(new T.Vector3(x,y,z),q,one);geo.applyMatrix4(m4);parts.push([geo,mat])};
 const K={parts,put,
  box(w,h,d,c,x,y,z,ry){put(new T.BoxGeometry(w,h,d),hsm(c),x,y+h/2,z,ry)},      // y＝底面高度
  // 人字屋顶：屋脊沿 x，宽 w（含出檐）、进深 d、高 r；ry 转 90° 就是屋脊朝街
  gable(w,d,r,c,x,y,z,ry){const s=new T.Shape();s.moveTo(-d/2,0);s.lineTo(d/2,0);s.lineTo(0,r);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:w,bevelEnabled:false});g.translate(0,0,-w/2);g.rotateY(Math.PI/2);g.computeVertexNormals();put(g,hsm(c),x,y,z,ry)},
  // 山墙（三角形的墙，补在人字屋顶下面两头）
  gableWall(w,r,c,x,y,z,ry,th){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,r);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:th||.2,bevelEnabled:false});g.translate(0,0,-(th||.2)/2);g.computeVertexNormals();put(g,hsm(c),x,y,z,ry)},
  // 四坡顶：底 w×d，高 r，屋脊沿 x
  hip(w,d,r,c,x,y,z,ry){const a=Math.max(0,(w-d)/2),v=[[-w/2,0,d/2],[w/2,0,d/2],[w/2,0,-d/2],[-w/2,0,-d/2],[-a,r,0],[a,r,0]],
   f=[[0,1,5],[0,5,4],[2,3,4],[2,4,5],[1,2,5],[3,0,4]],P=[];f.forEach(t=>t.forEach(i=>P.push(...v[i])));
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.computeVertexNormals();put(g,hsm(c),x,y,z,ry)},
  // 窗：白色窗框＋玻璃（＋百叶）；zf＝墙面
  win(x,y,zf,w,h,shut){K.box(w+.22,h+.22,.08,HS_TRIM,x,y-.11,zf+.02);K.box(w,h,.1,HS_GLASS,x,y,zf+.03);K.box(.06,h,.12,HS_TRIM,x,y,zf+.04);
   if(shut)[-1,1].forEach(s=>K.box(w*.42,h+.1,.06,shut,x+s*(w/2+.11+w*.21+.04),y-.05,zf+.03))},
  door(x,zf,c,w){w=w||1.0;K.box(w+.3,2.35,.08,HS_TRIM,x,0,zf+.02);K.box(w,2.15,.1,c,x,0,zf+.04);K.box(w+.9,.18,.9,HS_STEP,x,-.05,zf+.45)},
  // 车库门：白色、带几道横线
  garage(x,zf,w){K.box(w+.3,2.45,.08,HS_TRIM,x,0,zf+.02);K.box(w,2.25,.1,HS_GAR,x,0,zf+.04);for(let i=1;i<4;i++)K.box(w,.04,.12,0xc9c6bd,x,i*.56,zf+.05)},
  chimney(x,z,top,c){K.box(1.0,top,.8,c||HS_CHIM,x,0,z)},
  post(x,z,h){K.box(.22,h,.22,HS_TRIM,x,0,z)}};
 return K}
// ---------- 各种式样 ----------
const HS_STYLES={
 ranch(K,o){const w=12+Math.random()*1.5,d=8.5,H=2.7,wall=o.brick?hsPick(HS.BRICK):hsPick(HS.SIDING),roof=hsPick(HS.ROOF),gs=o.gs,gw=4.8;
  K.box(w,H+o.base,d,wall,0,-o.base,0);
  if(Math.random()<.6)K.hip(w+.9,d+.9,1.9,roof,0,H,0);else{K.gable(w+.9,d+.9,1.9,roof,0,H,0);[-1,1].forEach(s=>K.gableWall(d,1.9,wall,s*(w/2-.1),H,0,Math.PI/2))}
  const zf=d/2,gc=gs*(w/2-gw/2-.5);K.garage(gc,zf,gw);
  const ds=-gs;K.door(ds*.6,zf,hsPick(HS.DOOR));K.win(ds*(w/2-2.0),1.0,zf,2.4,1.3);
  return{w,d,gx:gc,zf}},
 capecod(K,o){const w=9.5,d=8,H=2.7,r=3.7,wall=hsPick(HS.SIDING),roof=hsPick(HS.ROOF),gs=o.gs;
  K.box(w,H+o.base,d,wall,0,-o.base,0);K.gable(w+.5,d+.7,r,roof,0,H,0);[-1,1].forEach(s=>K.gableWall(d,r,wall,s*(w/2-.1),H,0,Math.PI/2));
  const zf=d/2,sh=Math.random()<.6?hsPick(HS.SHUT):0;K.door(0,zf,hsPick(HS.DOOR));[-1,1].forEach(s=>{K.win(s*1.9,1.0,zf,1.1,1.3,sh);K.win(s*3.5,1.0,zf,1.1,1.3,sh)});
  // 老虎窗：屋顶前坡上两个小房子
  [-1,1].forEach(s=>{const x=s*2.4,zc=zf-1.2,y=H+.3;K.box(1.6,2.2,1.9,wall,x,y,zc);K.gable(2.1,2.0,.8,roof,x,y+2.2,zc+.1,Math.PI/2);K.gableWall(1.6,.8,wall,x,y+2.2,zc+.85);K.win(x,y+.8,zc+.95,.8,.9)});
  K.chimney(-gs*(w/2-.7),-.6,H+r+.6);
  // 一层的车库，在另一头，稍微往后
  const gw=3.6,gx=gs*(w/2+gw/2),gz=-.8,gd=6.4;K.box(gw,2.8+o.base,gd,wall,gx,-o.base,gz);K.gable(gd+.6,gw+.6,1.4,roof,gx,2.8,gz,Math.PI/2);K.gableWall(gw,1.4,wall,gx,2.8,gz+gd/2-.1);K.garage(gx,gz+gd/2,2.9);
  return{w:w+gw,d,gx,zf:gz+gd/2}},
 colonial(K,o){const w=9.6,d=8.5,H=5.7,r=2.3,wall=Math.random()<.5?hsPick(HS.BRICK):hsPick(HS.SIDING),roof=hsPick(HS.ROOF),gs=o.gs,sh=hsPick(HS.SHUT);
  K.box(w,H+o.base,d,wall,0,-o.base,0);K.gable(w+.5,d+.8,r,roof,0,H,0);[-1,1].forEach(s=>K.gableWall(d,r,wall,s*(w/2-.1),H,0,Math.PI/2));
  const zf=d/2;K.door(0,zf,hsPick(HS.DOOR),1.1);[-1,1].forEach(s=>K.win(s*2.9,.95,zf,1.1,1.4,sh));[-2.9,0,2.9].forEach(x=>K.win(x,3.75,zf,1.1,1.3,sh));
  // 门廊：两根柱子＋小人字顶
  [-1,1].forEach(s=>K.post(s*1.0,zf+1.3,2.6));K.box(2.4,.15,1.5,HS_TRIM,0,2.6,zf+.75);K.gable(1.7,2.6,.8,roof,0,2.75,zf+.75,Math.PI/2);
  K.chimney(-gs*(w/2-.6),-1,H+r+.5);
  const gw=3.8,gx=gs*(w/2+gw/2),gz=-.7,gd=6.6;K.box(gw,2.9+o.base,gd,wall,gx,-o.base,gz);K.gable(gw+.4,gd+.6,1.5,roof,gx,2.9,gz);[-1,1].forEach(s=>K.gableWall(gd,1.5,wall,gx+s*(gw/2-.1),2.9,gz,Math.PI/2));K.garage(gx,gz+gd/2,3.0);
  return{w:w+gw,d,gx,zf:gz+gd/2}},
 suburban(K,o){const w=8.4,d=9,H=5.6,wall=hsPick(HS.BRICK),roof=hsPick(HS.ROOF),gs=o.gs,gw=5.2,gp=2.6;
  K.box(w,H+o.base,d,wall,0,-o.base,0);K.hip(w+.8,d+.8,2.2,roof,0,H,0);
  // 往前突出的双车库，上面是朝街的山墙
  const gx=gs*(w/2-gw/2+.4),gd=d/2+gp,gz=gd/2-.2;K.box(gw,2.9+o.base,gd,wall,gx,-o.base,gz-gd/2+gd/2);
  K.gable(gd+.6,gw+.6,1.7,roof,gx,2.9,gz,Math.PI/2);K.gableWall(gw,1.7,HS_TRIM,gx,2.9,gz+gd/2-.1);K.garage(gx,gz+gd/2,4.6);
  // 门在车库旁边，往里凹，有个小门廊
  const dx=gx-gs*(gw/2+1.1),zf=d/2;K.door(dx,zf,hsPick(HS.DOOR));K.post(dx-gs*.9,zf+1.3,2.6);K.box(2.0,.15,1.6,roof,dx-gs*.1,2.6,zf+.75);
  K.win(-gs*(w/2-.9),1.0,zf,1.0,1.3);[dx,-gs*(w/2-.9)].forEach(x=>K.win(x,3.6,zf,1.1,1.2));
  return{w,d,gx,zf:gz+gd/2}},
 craftsman(K,o){const w=9.8,d=10,H=3.0,r=2.4,wall=hsPick(HS.SIDING),roof=hsPick(HS.ROOF),gs=o.gs;
  K.box(w,H+o.base,d,wall,0,-o.base,0);K.gable(d+.8,w+.9,r,roof,0,H,0,Math.PI/2);[-1,1].forEach(s=>K.gableWall(w,r,s>0?wall:wall,0,H,s*(d/2-.1)));
  const zf=d/2;K.box(w,.35,2.4,HS_STEP,0,-.2,zf+1.2);[-1,1].forEach(s=>{K.box(.45,.9,.45,wall,s*(w/2-.3),0,zf+2.1);K.box(.28,1.7,.28,HS_TRIM,s*(w/2-.3),.9,zf+2.1)});
  K.box(.45,.9,.45,wall,0,0,zf+2.1);K.box(.28,1.7,.28,HS_TRIM,0,.9,zf+2.1);K.box(w+.4,.15,2.8,roof,0,2.6,zf+1.3);
  K.door(gs*1.6,zf,hsPick(HS.DOOR));K.win(-gs*2.4,1.0,zf,2.2,1.4);K.win(0,H+.7,zf+.1,1.2,.8);
  return{w,d,gx:-gs*(w/2+1.9),zf:0,side:true}}};
const HS_LIST=['ranch','ranch','capecod','colonial','suburban','suburban','craftsman'];
// opts.base：墙往地下多埋多少（坡道上用）；opts.style 指定式样
function buildHouse(opts){opts=opts||{};const K=hsKit(),st=opts.style||hsPick(HS_LIST),gs=Math.random()<.5?1:-1;
 const info=HS_STYLES[st](K,{base:opts.base||0,gs,brick:Math.random()<.5});const g=new T.Group();
 const ms=hsMerge(K.parts),bb=new T.Box3();ms.forEach(m=>{m.geometry.computeBoundingBox();bb.union(m.geometry.boundingBox)});const cx=(bb.min.x+bb.max.x)/2;      // 房子左右居中（车库在一边时整栋往另一边挪）
 ms.forEach(m=>{m.geometry.translate(-cx,0,0);m.castShadow=true;m.receiveShadow=true;g.add(m)});info.gx-=cx;
 return Object.assign({g,style:st},info)}
