// mockfx.js — 模拟考试用的两样东西（首页和每个项目页面的 <head> 里都加载）
// 1. MST：考试进度的存取。先用 localStorage；有的环境（比如 iPhone 上的 Claude 应用里）localStorage 用不了，
//    就同时存在 window.name 里 —— 同一个窗口换页面时 window.name 会一直留着
// 2. “电影转场”：网址有 ?mock=1 时，先把上一项最后一帧画面（存在 MST 的 fx 里）盖满屏幕，
//    新场景跑起来以后 mock.js 再让它慢慢变透明 —— 就是叠画（没有上一帧时就是黑场淡入）。项目自己的开始菜单和总结卡片都藏起来
window.MST=(function(){
 const wn=()=>{try{const o=JSON.parse(window.name||'{}');return o&&typeof o==='object'&&o.rt?o:{rt:1}}catch(e){return {rt:1}}};
 const wset=(k,v)=>{try{const o=wn();if(v==null)delete o[k];else o[k]=v;window.name=JSON.stringify(o)}catch(e){}};
 return {
  // 换页面：用“点链接”的方式，不用 location.href —— 手机上的 Claude 应用只放行点链接的换页（单项练习都是链接，所以能用）
  nav(url){try{const a=document.createElement('a');a.href=url;a.style.display='none';(document.body||document.documentElement).appendChild(a);a.click()}catch(e){}
   const here=location.href;setTimeout(()=>{if(location.href===here)location.href=url},1500)},
  said(v){if(v===undefined)return wn().said||null;wset('said',{s:v,t:Date.now()})},      // 刚读过的考官指令（换页后不再重复读）
  lang(v){if(v===undefined){let l=null;try{l=localStorage.getItem('rt_lang')}catch(e){}return l||wn().lang||null}
   try{localStorage.setItem('rt_lang',v)}catch(e){}wset('lang',v)},
  get(){let a=null,b=wn().mock||null;try{a=JSON.parse(localStorage.getItem('rt_mock')||'null')}catch(e){}
   if(a&&b)return (b.t0>a.t0||(b.t0===a.t0&&b.i>a.i))?b:a;return a||b},
  set(S){let ok=false;try{localStorage.setItem('rt_mock',JSON.stringify(S));ok=true}catch(e){}wset('mock',S);
   try{return ok||wn().mock.t0===S.t0}catch(e){return ok}},
  fx(u){if(u===undefined){let v='';try{v=sessionStorage.getItem('rt_fx')||'';sessionStorage.removeItem('rt_fx')}catch(e){}
    if(!v)v=wn().fx||'';wset('fx',null);return v}
   try{sessionStorage.setItem('rt_fx',u);return}catch(e){}wset('fx',u)}}})();
(function(){try{if(!/[?&]mock=/.test(location.search))return;const d=document.documentElement;d.classList.add('mk');
 let host=false;try{host=window.parent!==window&&!!window.parent.MKH}catch(e){}
 if(host){const s=document.createElement('style');s.textContent='html.mk,html.mk body{background:#000!important}html.mk #ov{visibility:hidden!important}';document.head.appendChild(s);return}      // 在首页的框里：转场由首页做
 const u=MST.fx();
 const s=document.createElement('style');
 s.textContent='html.mk,html.mk body{background:#000!important}html.mk #ov{visibility:hidden!important}'+
  'html.mk::after{content:"";position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;pointer-events:none;background:#000'+(u?' url('+u+') center/cover no-repeat':'')+';opacity:1}'+
  'html.mk.fxin::after{opacity:0;transition:opacity 1.4s ease-in-out}'+
  'html.mk.fxout::after{opacity:1;background:#000;transition:opacity .9s ease-in-out}';
 document.head.appendChild(s);
 setTimeout(()=>{if(!d.classList.contains('fxout'))d.classList.add('fxin')},6000)      // 保险：万一没接上，6 秒后也一定把画面露出来
 }catch(e){}})();
