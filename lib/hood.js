// ============================================================
// hood.js — 小区里的一条南北向直街（可以有坡）：路面、路缘、草地隔离带、人行道、房子、车道、行道树
// 低速操作的项目（上下坡停车、三点调头、平行停车）共用
// ============================================================
// 路线坐标 (x,z)：x 向东为正，z 向北为正；画到场景里是 (-x, y, z)。路面高度 y＝g·z（g 是坡度，正数＝往北上坡）
const HRW=4.25;      // 路面半宽（8.5 米宽，不画线）
const HCOL={GRS:M(0xffffff,{map:noise('#79a95a',50,40)}),ASF:M(0x5f6168,{side:T.DoubleSide}),CRB:M(0xc9cbcf,{side:T.DoubleSide}),SWK:M(0xd5d3cc,{side:T.DoubleSide}),DRV:M(0xcfccc4,{side:T.DoubleSide}),GRV:M(0x9a8f7c,{side:T.DoubleSide}),EDGE:BM(WH)};
// 沿坡的平面（x0..x1, z0..z1），高出路面 dy
function hSlab(g,x0,x1,z0,z1,dy,mat){const n=Math.max(1,Math.ceil((z1-z0)/20)),pos=[],idx=[];for(let i=0;i<=n;i++){const z=z0+(z1-z0)*i/n;pos.push(-x0,g*z+dy,z,-x1,g*z+dy,z)}for(let i=0;i<n;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}
 const ge=new T.BufferGeometry();ge.setAttribute('position',new T.Float32BufferAttribute(pos,3));ge.setIndex(idx);ge.computeVertexNormals();const m=new T.Mesh(ge,mat);m.receiveShadow=true;scene.add(m);return m}
// 沿坡的长条方块（路缘、人行道）：顶面高出路面 h
function hPrism(g,x0,x1,z0,z1,h,mat){hSlab(g,x0,x1,z0,z1,h,mat);const side=(x)=>{const pos=[],idx=[],n=Math.max(1,Math.ceil((z1-z0)/20));for(let i=0;i<=n;i++){const z=z0+(z1-z0)*i/n;pos.push(-x,g*z-.05,z,-x,g*z+h,z)}for(let i=0;i<n;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}
 const ge=new T.BufferGeometry();ge.setAttribute('position',new T.Float32BufferAttribute(pos,3));ge.setIndex(idx);ge.computeVertexNormals();scene.add(new T.Mesh(ge,mat))};side(x0);side(x1)}
const H_WALLS=[0xb5654a,0x9c5a43,0xc9b28f,0xd8d2c4,0x8d6e5a,0xe2dccd,0xa8a29a],H_ROOFS=[0x3b3f45,0x4a4038,0x5b4a3d,0x2f3338,0x6b6e72];
const H_WIN=M(0x2a3540),H_DOOR=[0x6b2b2b,0x234a6b,0x2f4f3a,0x111111],H_GAR=M(0xeeeeec),H_TRIM=M(0xf2f2ee);
// 房子：正面朝 +z（再用 place 转到朝路），车道从车库门铺到路边（setL＝房子中心到路边的距离）
function hHouse(x,z,h,setL,y,drive){const o=buildHouse({base:1.2}),g=o.g;      // 式样见 houses.js
 if(drive!==false){const dl=setL-o.zf;g.add(mesh(new T.BoxGeometry(o.side?3.2:5,.06,dl),HCOL.DRV,o.gx,.14,o.zf+dl/2))}
 place(g,x,z,h,y);scene.add(g);return g}
const H_TRK=M(0x6b4a2e),H_LEAF=[M(0x3f8a3a),M(0x4f9a44),M(0x5a8f35)];
function hTree(x,z,y){const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.16,.22,2.4,6),H_TRK,0,1.2,0));const c=mesh(new T.SphereGeometry(2+Math.random()*.8,8,6),H_LEAF[Math.random()*3|0],0,3.8+Math.random()*.6,0);c.castShadow=true;g.add(c);g.position.set(-x,y,z);scene.add(g)}
// 整条街：o.g 坡度；o.curbR/o.curbL 有没有路缘（没有就是砂石路肩）；o.quiet：这些 z 范围里不放车道、不种树（停车、调头的地方）
function buildHood(o){const g=o.g||0,z0=-160,z1=160,SW0=HRW+2.25,SW1=HRW+3.75,quiet=o.quiet||[],inQ=z=>quiet.some(q=>z>q[0]&&z<q[1]);
 hSlab(g,-260,260,z0-80,z1+80,-.03,HCOL.GRS);
 hSlab(g,-HRW,HRW,z0-80,z1+80,.02,HCOL.ASF);
 [[1,o.curbR!==false],[-1,o.curbL!==false]].forEach(([s,c])=>{
  if(c)hPrism(g,s>0?HRW:-HRW-.25,s>0?HRW+.25:-HRW,z0-80,z1+80,.15,HCOL.CRB);
  else{hSlab(g,s>0?HRW:-HRW-1.4,s>0?HRW+1.4:-HRW,z0-80,z1+80,.015,HCOL.GRV);hSlab(g,s>0?HRW-.25:-HRW+.1,s>0?HRW-.1:-HRW+.25,z0-80,z1+80,.03,HCOL.EDGE)}      // 没有路缘：路边一条白线，外面砂石路肩
  hPrism(g,s>0?SW0:-SW1,s>0?SW1:-SW0,z0-80,z1+80,.12,HCOL.SWK)});
 const HD=SW1+7+4.5;
 for(let z=z0;z<z1;z+=17)[-1,1].forEach(s=>{const hz=z+Math.random()*2;hHouse(s*HD,hz,s>0?-Math.PI/2:Math.PI/2,HD-HRW,g*hz-.6,!inQ(hz))});
 for(let z=z0;z<z1;z+=15+Math.random()*4)[-1,1].forEach(s=>{if(!inQ(z)&&Math.random()<.85)hTree(s*(HRW+1.25),z,g*z)});
 return{g,Y:z=>g*z}}
