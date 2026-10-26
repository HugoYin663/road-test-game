// ============================================================
// ui.js — 视角切换、按钮、键盘、拖动转头、窗口大小（所有项目共用）
// ============================================================
function setView(v){view=v;mine.visible=v===2;$('vb').textContent=v===1?'俯视':'驾驶视角'}
$('vb').onclick=()=>setView(view===1?2:1);
document.querySelectorAll('.b').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();cmd(b.dataset.m)});
 ['pointerup','pointercancel','pointerleave'].forEach(k=>b.addEventListener(k,()=>{if(typeof cmdUp==='function')cmdUp(b.dataset.m)}))});      // 松开按钮（按住观察用）
addEventListener('keyup',e=>{if(e.key==='9'&&typeof cmdUp==='function')cmdUp('scan')});
addEventListener('keydown',e=>{if(e.repeat)return;if(e.key==='0')cmd('sig');if(e.key==='9')cmd('scan');if(e.key==='1')cmd('look');if(e.key==='2')cmd('stop');if(e.key==='3')cmd('turn')});
addEventListener('pointerdown',e=>{return});   // 驾驶视角不能用手指拖动转头（只能用观察按钮）；俯视角度固定，也不能拖
addEventListener('pointerup',()=>drag=false);
addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;
 if(view===1)yawD=Math.max(-2.1,Math.min(2.1,yawD-dx*.012));else{az-=dx*.005;el=Math.max(.35,Math.min(1.4,el+dy*.005))}});
function rs(){const W=document.documentElement.clientWidth||innerWidth,H=document.documentElement.clientHeight||innerHeight;ren.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();if(typeof fitWheel==='function')fitWheel();$('rot').style.display=innerHeight>innerWidth?'flex':'none'}
addEventListener('resize',rs);

// 全屏：手机浏览器支持时，进入全屏并尽量锁定横屏；不支持（如 iPhone）就隐藏按钮
{const fb=$('fs'),d=document,el=d.documentElement,can=d.fullscreenEnabled||d.webkitFullscreenEnabled;
 if(fb){if(!can)fb.style.display='none';
  fb.onclick=()=>{const on=d.fullscreenElement||d.webkitFullscreenElement;
   try{if(on){(d.exitFullscreen||d.webkitExitFullscreen).call(d)}else{const r=(el.requestFullscreen||el.webkitRequestFullscreen).call(el);
    if(r&&r.then)r.then(()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(()=>{fb.style.display='none'})}}catch(e){fb.style.display='none'}};
  const up=()=>{fb.textContent=(d.fullscreenElement||d.webkitFullscreenElement)?'退出全屏':'全屏';setTimeout(rs,200)};d.addEventListener('fullscreenchange',up);d.addEventListener('webkitfullscreenchange',up)}}

// 错误卡片的配图：俯瞰图截屏（出错那一刻从上方拍一张路口，缩成小图）；拍不了就用简单示意图
let SNAPC=null;
function snap3D(){try{if(typeof ren==='undefined'||!ren.domElement||typeof myPath!=='function')return null;
 const q=myPath(R.u),cvs=ren.domElement,W=360,H=240;if(!cvs.width)return null;
 if(!SNAPC)SNAPC=new THREE.PerspectiveCamera(45,1,1,500);
 SNAPC.aspect=cvs.width/cvs.height;SNAPC.updateProjectionMatrix();
 const cx=-q[0]*.5,cz=q[1]*.5;SNAPC.position.set(cx,62,cz-1);SNAPC.up.set(0,0,1);SNAPC.lookAt(cx,0,cz);
 const vc=cockpit.visible,vm=mine.visible;cockpit.visible=false;mine.visible=true;ren.render(scene,SNAPC);cockpit.visible=vc;mine.visible=vm;
 const c2=document.createElement('canvas');c2.width=W;c2.height=H;const sw=Math.min(cvs.width,cvs.height*W/H),sh=sw*H/W;
 c2.getContext('2d').drawImage(cvs,(cvs.width-sw)/2,(cvs.height-sh)/2,sw,sh,0,0,W,H);return c2.toDataURL('image/jpeg',.82)}catch(e){return null}}
