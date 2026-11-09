// ============================================================
// hood.js — 小区里的一条南北向直街（可以有坡）：路面、路缘、草地隔离带、人行道、房子、车道、行道树
// 低速操作的项目（上下坡停车、三点调头、平行停车）共用
// ============================================================
// 路线坐标 (x,z)：x 向东为正，z 向北为正；画到场景里是 (-x, y, z)。路面高度 y＝g·z（g 是坡度，正数＝往北上坡）
const HRW=4.25;      // 路面半宽（8.5 米宽，不画线）
const HCOL={GRS:M(0xffffff,{map:noise('#79a95a',50,40)}),ASF:M(0x5f6168,{side:T.DoubleSide}),CRB:M(0xc9cbcf,{side:T.DoubleSide}),CRBS:M(0x8e9196,{side:T.DoubleSide}),GUT:M(0x4c4e54,{side:T.DoubleSide}),SWK:M(0xd5d3cc,{side:T.DoubleSide}),DRV:M(0xb3aea4,{side:T.DoubleSide}),DRA:M(0x4a4c51,{side:T.DoubleSide}),GRV:M(0x9a8f7c,{side:T.DoubleSide}),EDGE:BM(WH)};
// 沿坡的平面（x0..x1, z0..z1），高出路面 dy
function hSlab(g,x0,x1,z0,z1,dy,mat){const n=Math.max(1,Math.ceil((z1-z0)/20)),pos=[],idx=[];for(let i=0;i<=n;i++){const z=z0+(z1-z0)*i/n;pos.push(-x0,g*z+dy,z,-x1,g*z+dy,z)}for(let i=0;i<n;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}
 const ge=new T.BufferGeometry();ge.setAttribute('position',new T.Float32BufferAttribute(pos,3));ge.setIndex(idx);ge.computeVertexNormals();const m=new T.Mesh(ge,mat);m.receiveShadow=true;scene.add(m);return m}
// 沿坡的长条方块（路缘、人行道）：顶面高出路面 h
function hPrism(g,x0,x1,z0,z1,h,mat,smat){hSlab(g,x0,x1,z0,z1,h,mat);const side=(x)=>{const pos=[],idx=[],n=Math.max(1,Math.ceil((z1-z0)/20));for(let i=0;i<=n;i++){const z=z0+(z1-z0)*i/n;pos.push(-x,g*z-.05,z,-x,g*z+h,z)}for(let i=0;i<n;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}
 const ge=new T.BufferGeometry();ge.setAttribute('position',new T.Float32BufferAttribute(pos,3));ge.setIndex(idx);ge.computeVertexNormals();scene.add(new T.Mesh(ge,smat||mat))};side(x0);side(x1)}      // smat：立面用深一点的颜色（路缘的立面有阴影，更立体、更好看清）
const H_WALLS=[0xb5654a,0x9c5a43,0xc9b28f,0xd8d2c4,0x8d6e5a,0xe2dccd,0xa8a29a],H_ROOFS=[0x3b3f45,0x4a4038,0x5b4a3d,0x2f3338,0x6b6e72];
const H_WIN=M(0x2a3540),H_DOOR=[0x6b2b2b,0x234a6b,0x2f4f3a,0x111111],H_GAR=M(0xeeeeec),H_TRIM=M(0xf2f2ee);
// 房子：正面朝 +z（再用 place 转到朝路）。返回车道口在路边的 z 范围（车道从房子前面一直铺到路边）
function hHouse(x,z,h,y,dw){const o=buildHouse({base:1.2}),g=o.g;place(g,x,z,h,y);scene.add(g);
 // 车道：窄的占房子宽度一半以上，宽的和房子一样宽；中心对着车库（侧面车道的房子对着旁边）
 const W=Math.min(o.bw,dw==null?o.bw*(.55+Math.random()*.45):dw),cx=o.side?o.gx:Math.max(-o.bw/2+W/2,Math.min(o.bw/2-W/2,W>o.bw*.9?0:o.gx));
 g.updateMatrixWorld(true);const a=new T.Vector3(cx-W/2,0,0).applyMatrix4(g.matrixWorld).z,b=new T.Vector3(cx+W/2,0,0).applyMatrix4(g.matrixWorld).z;
 return{z0:Math.min(a,b),z1:Math.max(a,b),front:o.fz}}
// 车道口标杆（Reflective Driveway Marker）：细细的橙色杆，顶上一段反光白条，插在车道口两边的草地上，方便找停车的位置
const H_POLE=M(0xff6a00),H_REFL=BM(0xf4f6f8),H_POLEG=new T.CylinderGeometry(.018,.018,1.25,6),H_REFLG=new T.CylinderGeometry(.022,.022,.22,6);
function hPole(x,z,y){const a=mesh(H_POLEG,H_POLE,-x,y+.62,z),b=mesh(H_REFLG,H_REFL,-x,y+1.08,z);scene.add(a);scene.add(b)}
const H_TRK=M(0x6b4a2e),H_LEAF=[M(0x3f8a3a),M(0x4f9a44),M(0x5a8f35)];
function hTree(x,z,y){const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.16,.22,2.4,6),H_TRK,0,1.2,0));const c=mesh(new T.SphereGeometry(2+Math.random()*.8,8,6),H_LEAF[Math.random()*3|0],0,3.8+Math.random()*.6,0);c.castShadow=true;g.add(c);g.position.set(-x,y,z);scene.add(g)}
// 整条街：o.g 坡度；o.curbR/o.curbL 有没有路缘（没有就是砂石路肩）；o.quiet：这些 z 范围里的房子没有车道（停车的地方）
// 每栋房子都有车道一直通到路边；车道口的路缘是平的（没有立起来的路缘）。返回 drives：[{side,z0,z1}] 车道口
function buildHood(o){const g=o.g||0,z0=-160,z1=160,SW0=HRW+2.25,SW1=HRW+3.75,quiet=o.quiet||[],inQ=z=>quiet.some(q=>z>q[0]&&z<q[1]);
 hSlab(g,-260,260,z0-80,z1+80,-.03,HCOL.GRS);
 hSlab(g,-HRW,HRW,z0-80,z1+80,.02,HCOL.ASF);
 const HD=SW1+7+4.5,drives=[];
 [-1,1].forEach(s=>{let last=-1e9;
  for(let z=z0;z<z1;z+=17){const hz=z+Math.random()*2;const d=hHouse(s*HD,hz,s>0?-Math.PI/2:Math.PI/2,g*hz-.6);
   if(inQ(hz))continue;
   // 两个车道口之间至少留 7 米路边（停得下一辆车）
   if(d.z0-last<7)d.z0=last+7;if(d.z1-d.z0<2.6)continue;last=d.z1;drives.push({side:s,z0:d.z0,z1:d.z1,xh:HD-d.front})}});
 [[1,o.curbR!==false],[-1,o.curbL!==false]].forEach(([s,c])=>{
  const dv=drives.filter(d=>d.side===s).sort((a,b)=>a.z0-b.z0),xa=s>0?HRW:-HRW-.25,xb=s>0?HRW+.25:-HRW;
  // 路缘：车道口断开（车道口那一段是平的）
  let zc=z0-80;const pieces=[];dv.forEach(d=>{pieces.push([zc,d.z0]);zc=d.z1});pieces.push([zc,z1+80]);
  if(c){pieces.forEach(p=>{if(p[1]>p[0])hPrism(g,xa,xb,p[0],p[1],.15,HCOL.CRB,HCOL.CRBS)});hSlab(g,s>0?HRW-.22:-HRW,s>0?HRW:-HRW+.22,z0-80,z1+80,.025,HCOL.GUT)}      // 路缘脚下一条深色的边沟
  else{}      // 没有路缘：路面直接接草地（没有白线、没有砂石路肩）      // 没有路缘：路边一条白线，外面砂石路肩
  if(c)hPrism(g,s>0?SW0:-SW1,s>0?SW1:-SW0,z0-80,z1+80,.12,HCOL.SWK);      // 有路缘的路才有人行道
  // 车道：路边（平的路缘口）→ 草地隔离带 → 人行道（人行道照常连过去）→ 房子前
  dv.forEach(d=>{const X=(u,v)=>s>0?[u,v]:[-v,-u],dm=Math.random()<.4?HCOL.DRA:HCOL.DRV;      // 水泥车道或沥青车道
   if(o.poles!==false)[d.z0-.35,d.z1+.35].forEach(z=>hPole(s*(HRW+(c?.6:.45)),z,g*z));      // 车道口两边各一根标杆
   if(c){const q=X(HRW,HRW+.25);hSlab(g,q[0],q[1],d.z0,d.z1,.05,HCOL.CRB)}
   if(c){let q=X(HRW+.25,SW0);hSlab(g,q[0],q[1],d.z0,d.z1,.1,dm);q=X(SW1,d.xh);hSlab(g,q[0],q[1],d.z0,d.z1,.1,dm)}else{const q=X(HRW,d.xh);hSlab(g,q[0],q[1],d.z0,d.z1,.04,dm)}})});
 // 行道树：种在草地隔离带上，不挡车道
 for(let z=z0;z<z1;z+=15+Math.random()*4)[-1,1].forEach(s=>{if(Math.random()<.85&&!drives.some(d=>d.side===s&&z>d.z0-1.5&&z<d.z1+1.5))hTree(s*(HRW+1.25),z,g*z)});
 return{g,Y:z=>g*z,drives}}
