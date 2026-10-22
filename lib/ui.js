// ============================================================
// ui.js — 视角切换、按钮、键盘、拖动转头、窗口大小（所有项目共用）
// ============================================================
function setView(v){view=v;mine.visible=v===2;$('vb').textContent=v===1?'俯视':'驾驶视角'}
$('vb').onclick=()=>setView(view===1?2:1);
document.querySelectorAll('.b').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();cmd(b.dataset.m)}));
addEventListener('keydown',e=>{if(e.key==='0')cmd('sig');if(e.key==='9')cmd('scan');if(e.key==='1')cmd('look');if(e.key==='2')cmd('stop');if(e.key==='3')cmd('turn')});
addEventListener('pointerdown',e=>{if(e.target.tagName==='BUTTON'||view===1)return;drag=true;lx=e.clientX;ly=e.clientY});   // 驾驶视角不能用手指拖动转头，只能用观察按钮
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
