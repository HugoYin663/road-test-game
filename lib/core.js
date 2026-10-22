// ============================================================
// core.js — 场景、灯光、材质、通用小工具（所有项目共用）
// ============================================================
const $=id=>document.getElementById(id);
const T=THREE,hw=9.5;
const scene=new T.Scene();scene.background=new T.Color(0xbfe3f7);scene.fog=new T.Fog(0xbfe3f7,120,380);
const cam=new T.PerspectiveCamera(62,1,.3,600);
const ren=new T.WebGLRenderer({antialias:true});ren.setPixelRatio(Math.min(devicePixelRatio||1,2));ren.shadowMap.enabled=true;document.body.appendChild(ren.domElement);
scene.add(new T.HemisphereLight(0xffffff,0x9bbf7a,.95));
const sun=new T.DirectionalLight(0xfff4e0,.6);sun.position.set(60,90,-40);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-75,right:75,top:75,bottom:-75,far:260});scene.add(sun);
const M=(c,o)=>new T.MeshLambertMaterial(Object.assign({color:c},o||{}));
const BM=c=>new T.MeshBasicMaterial({color:c});
const mesh=(g,m,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);return o};
const box=(w,h,d,c,x,y,z)=>{const m=mesh(new T.BoxGeometry(w,h,d),typeof c==='object'?c:M(c),-x,y,z);m.receiveShadow=true;scene.add(m);return m};
function noise(base,amp,rep){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,128,128);
 for(let i=0;i<900;i++){const v=Math.random()*amp|0;x.fillStyle=`rgba(${v>amp/2?255:0},${v>amp/2?255:0},${v>amp/2?255:0},.06)`;x.fillRect(Math.random()*128,Math.random()*128,2,2)}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rep,rep);return t}
const WH=0xf6f6f6;
function cv(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);return new T.CanvasTexture(c)}
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const C=[0x2e6fd6,0x30c4cf,0xe53935,0xf2c230,0x8ec9f0,0xeceff1,0x7b8794,0x1f2328,0x4a4f57],PCOL=[0xff8a1f,0x3fb68b,0xe74c3c,0x9b59b6,0x3498db];
const place=(o,x,z,h,y)=>{o.position.set(-x,y||0,z);o.rotation.y=-h};
const normA=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a};
