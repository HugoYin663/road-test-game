// ============================================================
// cockpit.js — 车内视角（全景贴图）、方向盘、仪表、三面后视镜（所有项目共用）
// ============================================================
// ================= 车内（极简：车顶横梁、A 柱、仪表台边缘、方向盘、中镜、两个外后视镜）=================
const cockpit=new T.Group();scene.add(cockpit);
const PH=(c,sh)=>new T.MeshPhongMaterial({color:c,shininess:sh||25,side:T.DoubleSide});
const DK=PH(0x20252c),DK2=PH(0x2f353e),BODY=new T.MeshPhongMaterial({color:C[0],shininess:70,specular:0x555555}),
 GL=new T.MeshPhongMaterial({color:0xa9c3d9,shininess:120,specular:0xffffff}),
 MIR=new T.MeshBasicMaterial({map:cv(64,64,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#8fc4ee');g.addColorStop(.5,'#d3e8f6');g.addColorStop(.52,'#7d8088');g.addColorStop(1,'#5e6169');x.fillStyle=g;x.fillRect(0,0,w,h)})});
const cb=(w,h,d,m,x,y,z,rx,ry,rz)=>{const o=mesh(new T.BoxGeometry(w,h,d),m,x,y,z);o.rotation.set(rx||0,ry||0,rz||0);cockpit.add(o);return o};
// 两点之间的一根杆：两端落在指定点上，保证 A 柱与车顶、仪表台真正相连
const rod=(a,b,w,h,m)=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),o=new T.Mesh(new T.BoxGeometry(w,h,L),m);o.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);o.lookAt(b[0],b[1],b[2]);cockpit.add(o);return o};
const imC=document.createElement('canvas');imC.width=256;imC.height=60;const imX=imC.getContext('2d'),imT=new T.CanvasTexture(imC),IM=new T.MeshBasicMaterial({map:imT});
// 车顶：小轿车司机头顶到顶棚约一拳，挡风玻璃上沿比眼睛高约 29°（全景图 pano2：顶棚边缘按真车的平顶重新画过）
// 中镜贴在挡风玻璃上、顶棚边缘正下方（约 0.6 米前、0.26 米高，抬头约 20°；镜子上沿离顶棚边缘约 5 厘米，用一根短支杆连到贴在玻璃上沿的小底座）：平时往前看最多露出下面一小半（模糊、偏暗）；
// 看中镜时视线往上抬 MPIT、镜头拉近（中镜放大约 1.5 倍）、镜子变清楚（见文件末尾 MIRF）；看中镜这一步停留得长一些（MSLOW）
const MSLOW=.45;      // 看中镜、看外后视镜：时间走得慢一些（各约 0.8～1 秒），视线停稳在镜子上，看得清
const MRY=0,MRZ=0;      // 中镜贴在挡风玻璃上（顶棚边缘下面一点），长边和顶棚边缘平行
// 视角：画面横向 95°（以前 110° 太广，东西都显得又小又远，像坐在车顶很高的大车里）
const FOVD=85;
// 平时开车往前看：视线稍微往下（约 1.7°），画面上沿约比眼睛高 21°：中镜（约 20°）最多露出下面一小半，挡风玻璃上沿基本在画面外
const BASEP=-.03;
// 看镜子时视线正对镜子（驾驶员眼睛在车内 x=.38 处）：中镜（右上方）、左镜、右镜的方向（转头角、抬头量）
const MYAW=.42,MPIT=.27,      // 看中镜：头只往右上转一点（约 24°、抬约 14°），剩下的靠眼睛——镜子出现在画面右上方，不用转到正对着它
      MLYAW=-.66,MLPIT=-.3,MRYAW=1.03,MRPIT=-.22;
      // MRY：中镜朝司机这边转一点（真车的中镜也是斜着对着司机），从驾驶座看过去是正的
// 中镜：平时是空路，停车一会儿后显示后车车头（鸣笛时它就在后面）
function setMir(on){if(setMir.s===on)return;setMir.s=on;const x=imX,w=256,h=60,g=x.createLinearGradient(0,0,0,h);
 g.addColorStop(0,'#bfe0f5');g.addColorStop(.5,'#dff0fa');g.addColorStop(.5,'#8a8d94');g.addColorStop(1,'#6c6f77');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.strokeStyle='#fff';x.lineWidth=2;x.setLineDash([10,10]);x.beginPath();x.moveTo(128,30);x.lineTo(128,h);x.stroke();x.setLineDash([]);
 if(on){x.fillStyle='#2b3440';x.beginPath();x.moveTo(98,10);x.lineTo(158,10);x.lineTo(170,30);x.lineTo(86,30);x.fill();
  x.fillStyle='#dfe3e8';x.fillRect(78,28,100,24);x.fillStyle='#2b2f36';x.fillRect(110,36,36,10);
  x.fillStyle='#ffe27a';x.beginPath();x.arc(92,38,6,0,7);x.arc(164,38,6,0,7);x.fill();x.fillStyle='#202429';x.fillRect(84,52,16,8);x.fillRect(156,52,16,8)}
 imT.needsUpdate=true}
setMir(false);
let cluster=null,CLM=null;
{ // 车内壳体：一张环绕驾驶员的全景图（深灰、无细节），贴在驾驶员眼睛处的透明球体内侧。转头时它跟车不动。
 const pt=new T.TextureLoader().load('assets/pano2.png?v=1126l');pt.minFilter=T.LinearFilter;pt.generateMipmaps=false;
 const sp=new T.Mesh(new T.SphereGeometry(1.3,128,32,0,Math.PI*2,Math.PI/2-1.05,2.1),new T.MeshBasicMaterial({map:pt,transparent:true,side:T.BackSide,depthWrite:false,fog:false}));
 sp.position.set(.38,0,0);sp.renderOrder=1;sp.frustumCulled=false;cockpit.add(sp);
 // 仪表盘：只画一次的静态图（两个圆表盘）
 const clT=(cv(256,80,(x,w,h)=>{x.fillStyle='#0b1118';x.fillRect(0,0,w,h);
  [[64,40],[192,40]].forEach(c=>{x.strokeStyle='#8fb4d8';x.lineWidth=3;x.beginPath();x.arc(c[0],c[1],30,.75*Math.PI,2.25*Math.PI);x.stroke();
   x.strokeStyle='#c9d6e3';x.lineWidth=1.5;for(let i=0;i<=8;i++){const a=.75*Math.PI+i*Math.PI*1.5/8;x.beginPath();x.moveTo(c[0]+Math.cos(a)*24,c[1]+Math.sin(a)*24);x.lineTo(c[0]+Math.cos(a)*30,c[1]+Math.sin(a)*30);x.stroke()}
   x.strokeStyle='#ff7a3a';x.lineWidth=2.5;x.beginPath();x.moveTo(c[0],c[1]);x.lineTo(c[0]-16,c[1]+14);x.stroke()});
  x.fillStyle='#8be3a0';x.fillRect(118,34,20,10)}));
 const cl=mesh(new T.BoxGeometry(.5,.15,.02),new T.MeshBasicMaterial({map:clT}),.38,-.42,.9);cl.rotation.x=.25;cockpit.add(cl);CLM=cl;
 // 中间后视镜：短支架
 rod([0,.345,.628],[0,.285,.617],.018,.018,DK);{const j=new T.Mesh(new T.SphereGeometry(.016,10,8),DK);j.position.set(0,.285,.617);cockpit.add(j)}   /* 连杆一直插进镜壳背面，加一个球形接头，不留缝 */cb(.06,.03,.012,DK,0,.348,.63);cb(.27,.075,.035,DK,0,.262,.6,0,MRY,MRZ);{const o=cb(.24,.052,.012,IM,0,.262,.58,0,MRY,MRZ);o.position.x-=.02*Math.sin(MRY)}}
// 方向盘：只有轮圈、辐条和中心
const wheelP=new T.Group();wheelP.position.set(.38,-.4,.62);      // 方向盘上移：能看到一半多一点，包括中间的标志
wheelP.rotation.x=.5;wheelP.scale.set(.88,.88,.88);cockpit.add(wheelP);
const wheel=new T.Group();wheelP.add(wheel);
wheel.add(mesh(new T.TorusGeometry(.17,.03,12,32),DK,0,0,0));
// 按屏幕比例摆放方向盘：不管电脑还是手机，方向盘中心（标志）都在画面下沿往上一点，露出一半多一点
function fitWheel(){const vh=Math.min(105,2*Math.atan(Math.tan(FOVD/2*Math.PI/180)/cam.aspect)*180/Math.PI)/2*Math.PI/180,ang=vh*.88+.05-Math.atan(BASEP);      // 方向盘中心在画面下沿往上约四分之一处
 wheelP.position.y=-.62*Math.tan(ang);if(CLM)CLM.position.y=-.9*Math.tan(Math.max(.05,ang-.12))}
wheel.add(mesh(new T.BoxGeometry(.3,.04,.03),DK,0,0,0));wheel.add(mesh(new T.BoxGeometry(.04,.15,.03),DK,0,-.09,0));
{const hub=mesh(new T.CylinderGeometry(.068,.068,.05,20),DK2,0,0,0);hub.rotation.x=Math.PI/2;wheel.add(hub);
 const lg=mesh(new T.PlaneGeometry(.05,.083),new T.MeshBasicMaterial({map:new T.TextureLoader().load('assets/logo.png'),transparent:true}),0,.003,-.0265);lg.rotation.y=Math.PI;wheel.add(lg)}   // 方向盘中间的亮银色标志
const rr=(w,h,r)=>{const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s};
// 三个后视镜的贴图：一个朝后的小镜头，画面左右翻转后贴在镜面上
const MR=[];function mkMir(w,h,pos,dir,fov){const rt=new T.WebGLRenderTarget(w,h,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});rt.texture.wrapS=T.RepeatWrapping;rt.texture.repeat.x=-1;rt.texture.offset.x=1;
 const m={rt,c:new T.PerspectiveCamera(fov,w/h,.3,300),pos:new T.Vector3(pos[0],pos[1],pos[2]),dir:new T.Vector3(dir[0],dir[1],dir[2]).normalize()};MR.push(m);return m}
const MRI=mkMir(256,64,[0,.262,.57],[0,-.04,-1],12),MRL=mkMir(256,128,[1.08,-.3,.9],[.22,-.03,-1],18),MRR=mkMir(256,128,[-1.12,-.3,.9],[-.22,-.03,-1],18);
IM.map=MRI.rt.texture;IM.needsUpdate=true;
// 左右外后视镜：只有镜面＋薄薄的车身色外框，朝向驾驶员
[[1,1.08,.66,.9],[-1,-1.12,-1.03,.9]].forEach(a=>{const g=new T.Group();g.position.set(a[1],-.3,a[3]);g.rotation.y=a[2];cockpit.add(g);
 g.add(mesh(new T.ExtrudeGeometry(rr(.3,.21,.085),{depth:.012,bevelEnabled:false}),BODY,0,0,-.006));
 const gg=new T.ShapeGeometry(rr(.265,.18,.07)),ps=gg.attributes.position,uv=gg.attributes.uv;for(let i=0;i<ps.count;i++)uv.setXY(i,ps.getX(i)/.265+.5,ps.getY(i)/.18+.5);
 g.add(mesh(gg,new T.MeshBasicMaterial({map:(a[0]>0?MRL:MRR).rt.texture,transparent:true,depthTest:false}),0,0,-.0075));g.children[1].rotation.y=Math.PI;g.renderOrder=5;g.children.forEach(m=>m.renderOrder=5)});
[BODY,MIR].forEach(m=>{m.transparent=true;m.depthTest=false});
let lastH=0;
// 驾驶视角里的引擎盖：从前挡风玻璃下沿一直到车头，挡住车头前面近处的地面（真车上离前车 1.5 米左右就看不到它的后保险杠了）
{const NU=48,NV=32,P=[],I=[],CL=[];const SS=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t)};
 // 一张规则的弧面：左右方向是平缓的拱（中间高、两边低），前后方向往车头慢慢低下去，前缘在俯视里是一段圆弧；颜色统一深蓝、哑光，不出亮斑
 for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++){const u=i/NU*2-1,v=1-Math.pow(1-j/NV,1.4);      /* 车头那头的网格密一些，前缘的圆弧才顺 */
  // 参照真轿车（驾驶座看出去）：引擎盖几乎是平的、往前微微低下去，前缘差不多是一条横线，两边略往后收；
  // 左右两侧是翼子板，比引擎盖稍高一点，中间有一条接缝；车头最前面往下圆过去，不是刀口
  const au=Math.abs(u),fd=SS((au-.72)/.22),x=u*(.91+.04*Math.min(1,v/.3)),cr=SS((au-.7)/.3),zF=2.34-.07*u*u-.1*cr*cr,z=1.05+(zF-1.05)*v;
  const nose=Math.max(0,(v-.74)/.26),y=-.33-.04*v*v-.03*v-.02*u*u+.012*fd-.075*nose*nose;      /* 前面约四分之一往下圆过去（起头是相切的，不起棱），两个前角在俯视里也往后圆 */      /* 车头前缘约离地 0.85 米（和真车差不多）：离前车 1 米左右就看不到它的后保险杠了 */
  P.push(x,y,z);const seam=au>.785&&au<.815?.55:1,k=(1-.1*u*u-.1*v-.22*nose)*seam*(1-.07*fd);CL.push(.11*k,.29*k,.6*k)}      /* 颜色固定（不受阳光方向影响）：中间稍亮、两边和车头稍暗，整块都是深蓝 */
 for(let j=0;j<NV;j++)for(let i=0;i<NU;i++){const a=j*(NU+1)+i,b=a+1,c=a+NU+1,d=c+1;I.push(a,c,b,b,c,d)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(CL,3));g.setIndex(I);
 const hood=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,depthWrite:false,transparent:true}));hood.renderOrder=.5      /* 和地上的标线一起放在“透明”那一批里、排在标线后面画：标线就不会透过引擎盖 */;cockpit.add(hood);
 // 前挡风玻璃下面那块黑色塑料板（cowl）：和引擎盖是分开的，从仪表台下沿一直到引擎盖后沿；车内的仪表台、A 柱用全景图（画在它上面）
 {const P=[],I=[],NU=24,NV=4;for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++){const u=i/NU*2-1,v=j/NV;const fd=(t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t)})((Math.abs(u)-.72)/.22);P.push(u*.96,-.5+(.152-.02*u*u+.012*fd)*v,.78+.36*v)}      /* 黑板的上沿跟着引擎盖后沿的高度走（两边翼子板高一点），中间不留缝 */
  for(let j=0;j<NV;j++)for(let i=0;i<NU;i++){const a=j*(NU+1)+i,b=a+1,c=a+NU+1,d=c+1;I.push(a,c,b,b,c,d)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();
  const cw=new T.Mesh(g,new T.MeshLambertMaterial({color:0x17191d,side:T.DoubleSide,depthWrite:false,transparent:true}));cw.renderOrder=.4;cockpit.add(cw)}}      // 所有场景共用：引擎盖 + 挡风玻璃下的黑板（cowl）

// ---------- 中镜：平时模糊，看中镜时放大、清楚 ----------
// 平时：中镜画面用一张很小的贴图（48×12）放大，自然就是糊的，颜色也压暗一点（余光里只看得出“后面有没有东西”）
// 看中镜（R.pit 抬到 MPIT 附近）：换回清楚的贴图（256×64），整个画面拉近（视角缩小约 35%），中镜看起来大一些
let MIRF=0,SMF=0,ZH=0;
// 观察路口（左-右-左）时的转头：用平顺的弹簧曲线（起步、到位都是慢慢的），不再一下子甩过去
const SCANK=.85;      // 观察路口整套动作再放慢一点（约 3.6 秒），转头角度也小一点（左约 63°、右约 52°），不晕
window.HTURN=(R,tg,dt)=>{const n=R.t||0;if(!(Math.abs(n-(R.yvN==null?-9:R.yvN))<.2))R.yv=0;R.yvN=n;const w=5;R.yv=(R.yv||0)+(w*w*(tg-R.yaw)-2*w*R.yv)*dt;R.yaw+=R.yv*dt};
{const st=document.createElement('style');st.textContent='#bn.mirdim{opacity:.12!important;transition:opacity .2s}';document.head.appendChild(st)}
{const HI=MRI.rt,LO=new T.WebGLRenderTarget(64,16,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});LO.texture.wrapS=T.RepeatWrapping;LO.texture.repeat.x=-1;LO.texture.offset.x=1;
 const r0=ren.render.bind(ren);let lt=0;
 ren.render=function(sc,c){
  if(c===cam&&cockpit.visible){const now=performance.now(),dt=Math.min(.1,(now-lt)/1000||0);lt=now;
   let p=0,y=0;try{if(R&&!R.over){p=R.pit||0;y=R.yaw||0}}catch(e){}
   // 视线离哪面镜子近：越近拉得越近（中镜 20%、右镜 45%、左镜 25%）。从一面镜子直接转到下一面时，拉近的程度连续变化，不会先拉远再拉近（看起来像先往后缩一下）
   const near=(yy,pp)=>Math.max(0,Math.min(1,(.75-Math.hypot(y-yy,p-pp))/.5)),nC=near(MYAW,MPIT),nR=near(MRYAW,MRPIT),nL=near(MLYAW,MLPIT);
   MIRF+=((nC>.5?1:0)-MIRF)*Math.min(1,dt*8);
   const rt=MIRF>.25?HI:LO;if(MRI.rt!==rt){MRI.rt=rt;IM.map=rt.texture;IM.needsUpdate=true}
   IM.color.setScalar(.62+.38*MIRF);
   {const bn=document.getElementById('bn');if(bn)bn.classList.toggle('mirdim',MIRF>.4)}      /* 看中镜时上方的考官指令条先变淡，不挡镜子 */
   // 变焦：眼睛不动、只转头。一离开正前方就慢慢变焦到固定的 30%，在几面镜子、盲点之间转来转去时一直保持不变（不会一会儿近一会儿远），转回正前方才恢复
   let scn=false;try{scn=R&&R.scT>=0}catch(e){}      // 观察路口时不变焦（只有看镜子、看盲点时变焦）
   ZH=Math.hypot(y,p)>.3&&!scn?.5:Math.max(0,ZH-dt*(scn?4:1));const zt=ZH>0?.3:0;SMF+=(zt-SMF)*Math.min(1,dt*3);const z=SMF;
   if(z>.002){const f0=c.fov;c.fov=f0*(1-z);c.updateProjectionMatrix();r0(sc,c);c.fov=f0;c.updateProjectionMatrix();return}}
  return r0(sc,c)}}
