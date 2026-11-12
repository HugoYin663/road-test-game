// mockfx.js — 模拟考试的“电影转场”：放在每个项目页面的 <head> 里，网址有 ?mock=1 才起作用
// 上一项结束时 mock.js 把最后一帧画面存在 sessionStorage('rt_fx')；这里一打开新页面就先把那张画面盖满屏幕，
// 新场景跑起来以后 mock.js 再让它慢慢变透明 —— 就是叠画（没有上一帧时就是黑场淡入）。项目自己的开始菜单和总结卡片都藏起来
(function(){try{if(!/[?&]mock=/.test(location.search))return;const d=document.documentElement;d.classList.add('mk');
 let u='';try{u=sessionStorage.getItem('rt_fx')||'';sessionStorage.removeItem('rt_fx')}catch(e){}
 const s=document.createElement('style');
 s.textContent='html.mk,html.mk body{background:#000!important}html.mk #ov{visibility:hidden!important}'+
  'html.mk::after{content:"";position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;pointer-events:none;background:#000'+(u?' url('+u+') center/cover no-repeat':'')+';opacity:1}'+
  'html.mk.fxin::after{opacity:0;transition:opacity 1.4s ease-in-out}'+
  'html.mk.fxout::after{opacity:1;background:#000;transition:opacity .9s ease-in-out}';
 document.head.appendChild(s)}catch(e){}})();
