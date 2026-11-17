// ============================================================
// ui.js — 视角切换、按钮、键盘、拖动转头、窗口大小（所有项目共用）
// ============================================================
function setView(v){view=v;mine.visible=v===2;$('vb').textContent=v===1?'俯视':'驾驶视角'}
$('vb').onclick=()=>setView(view===1?2:1);
// 按钮：手机上在整个页面上统一处理触摸，按每根手指的位置找按钮，可以同时按住两个键（比如一只手按住加速，另一只手看后视镜、换线）
const up=m=>{if(typeof cmdUp==='function')cmdUp(m)};
const TB=new Map(),btnAt=(x,y)=>{const e=document.elementFromPoint(x,y);return e&&e.closest?e.closest('.b'):null};
document.addEventListener('touchstart',e=>{let hit=false;for(const t of e.changedTouches){const b=btnAt(t.clientX,t.clientY);if(b){hit=true;TB.set(t.identifier,b);cmd(b.dataset.m)}}if(hit||TB.size)e.preventDefault()},{passive:false});
const tEnd=e=>{let hit=false;for(const t of e.changedTouches){const b=TB.get(t.identifier);if(!b)continue;hit=true;TB.delete(t.identifier);if(![...TB.values()].includes(b))up(b.dataset.m)}if(hit)e.preventDefault()};
document.addEventListener('touchend',tEnd,{passive:false});document.addEventListener('touchcancel',tEnd,{passive:false});
document.addEventListener('touchmove',e=>{if(TB.size)e.preventDefault()},{passive:false});      // 按着按钮时不让页面滚动、缩放
document.querySelectorAll('.b').forEach(b=>{b.style.touchAction='none';b.style.webkitUserSelect='none';b.style.userSelect='none';b.style.webkitTouchCallout='none';
 b.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;e.preventDefault();cmd(b.dataset.m)});      // 鼠标
 ['pointerup','pointerleave'].forEach(k=>b.addEventListener(k,e=>{if(e.pointerType!=='touch')up(b.dataset.m)}));
 b.addEventListener('contextmenu',e=>e.preventDefault())});
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
// ---------------- 暂停（像播放器一样）：点画面中间一下就暂停，中间出现两条竖线；再点一下继续 ----------------
(function(){let P=false,Q=[],st=null;const raf=window.requestAnimationFrame.bind(window);
 window.requestAnimationFrame=f=>{if(P){Q.push(f);return 0}return raf(f)};      // 暂停时画面、车、计时全部停住
 const css=document.createElement('style');css.textContent='#pauseov{position:fixed;inset:0;z-index:60;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.32);-webkit-user-select:none;user-select:none;touch-action:none}'+
  '#pauseov .pz{width:96px;height:96px;border-radius:50%;background:rgba(0,0,0,.55);display:flex;gap:16px;align-items:center;justify-content:center}#pauseov .pz i{display:block;width:13px;height:40px;background:#fff;border-radius:3px}'+
  '#pauseov p{color:#fff;font:600 16px/1.4 system-ui,-apple-system,sans-serif;margin:14px 0 0;text-shadow:0 1px 3px rgba(0,0,0,.6)}';
 document.head.appendChild(css);const ov=document.createElement('div');ov.id='pauseov';ov.innerHTML='<div class="pz"><i></i><i></i></div><p>已暂停 · 点一下继续</p>';document.body.appendChild(ov);
 const vis=id=>{const e=document.getElementById(id);if(!e||e===ov)return false;const c=getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'};
 const can=()=>!vis('ov')&&!vis('mkov')&&!vis('rot')&&(typeof playing==='undefined'||playing)&&!(typeof R!=='undefined'&&R&&R.over);
 const acs=()=>{const a=[];try{if(typeof AC!=='undefined'&&AC)a.push(AC)}catch(e){}try{if(window.parent!==window&&window.parent.MKAC)a.push(window.parent.MKAC)}catch(e){}return a};
 const sss=()=>{const a=[];try{if(window.speechSynthesis)a.push(speechSynthesis)}catch(e){}try{if(window.parent!==window&&window.parent.speechSynthesis)a.push(window.parent.speechSynthesis)}catch(e){}return a};
 const vx=()=>{try{return window.VOX||(window.parent!==window&&window.parent.VOX)||null}catch(e){return null}};
 function pause(){if(P||!can())return;P=true;ov.style.display='flex';acs().forEach(a=>{try{a.suspend()}catch(e){}});const v=vx();if(v&&v.hold)v.hold();else sss().forEach(s=>{try{s.cancel()}catch(e){}})}      /* 考官正在说的话也停下，继续时重说这一句 */
 function resume(){if(!P)return;P=false;ov.style.display='none';acs().forEach(a=>{try{a.resume()}catch(e){}});{const v=vx();if(v&&v.release)v.release()}const q=Q;Q=[];q.forEach(f=>raf(f))}
 window.GPAUSE={pause,resume,get on(){return P}};
 addEventListener('pointerdown',e=>{const t=e.target;st=(t&&t.closest&&(t.closest('.b')||t.closest('button')||t.closest('#ov')))?null:{x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId}},true);
 addEventListener('pointerup',e=>{const s=st;st=null;if(!s||s.id!==e.pointerId)return;if(Math.hypot(e.clientX-s.x,e.clientY-s.y)>14||performance.now()-s.t>600)return;
  if(P){resume();return}const W=innerWidth,H=innerHeight;if(e.clientX>W*.3&&e.clientX<W*.7&&e.clientY>H*.22&&e.clientY<H*.75)pause()},true);      /* 只认画面中间那一块（按钮都在四周） */
 addEventListener('keydown',e=>{if(e.key==='p'||e.key==='P'){P?resume():pause()}});
 addEventListener('visibilitychange',()=>{if(document.hidden)pause()})})();      /* 切到别的应用：自动暂停 */
