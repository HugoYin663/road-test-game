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
 const pt=new T.TextureLoader().load('assets/pano.png');pt.minFilter=T.LinearFilter;pt.generateMipmaps=false;
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
 rod([0,.37,.675],[0,.24,.8],.02,.02,DK);{const j=new T.Mesh(new T.SphereGeometry(.018,10,8),DK);j.position.set(0,.262,.796);cockpit.add(j)}   /* 连杆一直插进镜壳背面，加一个球形接头，不留缝 */cb(.07,.02,.04,DK,0,.37,.67);cb(.27,.075,.035,DK,0,.23,.79);cb(.24,.052,.012,IM,0,.23,.77)}
// 方向盘：只有轮圈、辐条和中心
const wheelP=new T.Group();wheelP.position.set(.38,-.4,.62);      // 方向盘上移：能看到一半多一点，包括中间的标志
wheelP.rotation.x=.5;wheelP.scale.set(.88,.88,.88);cockpit.add(wheelP);
const wheel=new T.Group();wheelP.add(wheel);
wheel.add(mesh(new T.TorusGeometry(.17,.03,12,32),DK,0,0,0));
// 按屏幕比例摆放方向盘：不管电脑还是手机，方向盘中心（标志）都在画面下沿往上一点，露出一半多一点
function fitWheel(){const vh=Math.min(105,2*Math.atan(Math.tan(55*Math.PI/180)/cam.aspect)*180/Math.PI)/2*Math.PI/180,ang=vh*.74;      // 方向盘中心在画面下沿往上约四分之一处
 wheelP.position.y=-.62*Math.tan(ang);if(CLM)CLM.position.y=-.9*Math.tan(Math.max(.05,ang-.12))}
wheel.add(mesh(new T.BoxGeometry(.3,.04,.03),DK,0,0,0));wheel.add(mesh(new T.BoxGeometry(.04,.15,.03),DK,0,-.09,0));
{const hub=mesh(new T.CylinderGeometry(.068,.068,.05,20),DK2,0,0,0);hub.rotation.x=Math.PI/2;wheel.add(hub);
 const lg=mesh(new T.PlaneGeometry(.05,.083),new T.MeshBasicMaterial({map:new T.TextureLoader().load('assets/logo.png'),transparent:true}),0,.003,-.0265);lg.rotation.y=Math.PI;wheel.add(lg)}   // 方向盘中间的亮银色标志
const rr=(w,h,r)=>{const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s};
// 三个后视镜的贴图：一个朝后的小镜头，画面左右翻转后贴在镜面上
const MR=[];function mkMir(w,h,pos,dir,fov){const rt=new T.WebGLRenderTarget(w,h,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});rt.texture.wrapS=T.RepeatWrapping;rt.texture.repeat.x=-1;rt.texture.offset.x=1;
 const m={rt,c:new T.PerspectiveCamera(fov,w/h,.3,300),pos:new T.Vector3(pos[0],pos[1],pos[2]),dir:new T.Vector3(dir[0],dir[1],dir[2]).normalize()};MR.push(m);return m}
const MRI=mkMir(256,64,[0,.23,.78],[0,-.04,-1],12),MRL=mkMir(256,128,[1.08,-.3,.9],[.22,-.03,-1],18),MRR=mkMir(256,128,[-1.12,-.3,.9],[-.22,-.03,-1],18);
IM.map=MRI.rt.texture;IM.needsUpdate=true;
// 左右外后视镜：只有镜面＋薄薄的车身色外框，朝向驾驶员
[[1,1.08,.66,.9],[-1,-1.12,-1.03,.9]].forEach(a=>{const g=new T.Group();g.position.set(a[1],-.3,a[3]);g.rotation.y=a[2];cockpit.add(g);
 g.add(mesh(new T.ExtrudeGeometry(rr(.3,.21,.085),{depth:.012,bevelEnabled:false}),BODY,0,0,-.006));
 const gg=new T.ShapeGeometry(rr(.265,.18,.07)),ps=gg.attributes.position,uv=gg.attributes.uv;for(let i=0;i<ps.count;i++)uv.setXY(i,ps.getX(i)/.265+.5,ps.getY(i)/.18+.5);
 g.add(mesh(gg,new T.MeshBasicMaterial({map:(a[0]>0?MRL:MRR).rt.texture,transparent:true,depthTest:false}),0,0,-.0075));g.children[1].rotation.y=Math.PI;g.renderOrder=5;g.children.forEach(m=>m.renderOrder=5)});
[BODY,MIR].forEach(m=>{m.transparent=true;m.depthTest=false});
let lastH=0;
