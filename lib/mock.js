// ============================================================
// mock.js — 模拟考试：把单项一项接一项串起来
// 首页（index.html）开始考试时，把路线存在 localStorage('rt_mock')：{level:'g2'|'g',diff:'easy'|'hard',steps:[{s,v,zh,en}],i,res:[]}
// 每个项目的页面最后加载这个文件；网址里有 ?mock=1 时：按考试的难度自动开始这一项（第一项先有一张开始卡片）；
// 这一项结束（总结卡片出现，但是藏着）时，把错误记下来，直接接到下一项；最后一项做完，回首页看成绩单
// ============================================================
(function(){
 let Q;try{Q=new URLSearchParams(location.search)}catch(e){return}
 if(!Q.get('mock'))return;
 let S=window.MST?MST.get():null;
 const page=(location.pathname.split('/').pop()||'').replace(/\.html$/,'');
 if(!S||!S.steps||!S.steps[S.i]||S.steps[S.i].s!==page){document.documentElement.classList.remove('mk');return}      // 不是考试里这一项：照常练习
 const ST=S.steps[S.i],EN=S.lang==='en',bi=(z,e)=>EN?e:z+'<br><small style="opacity:.75">'+e+'</small>';
 window.MOCK=S;
 // 首页当“宿主”：每一项装在首页里的一个框（iframe）里，首页负责叠画转场和读考官指令（iPhone 上换页面后不能自己出声）
 const H=(()=>{try{return window.parent!==window&&window.parent.MKH||null}catch(e){return null}})();
 const save=()=>{if(window.MST)MST.set(S)};
 // 各项目开始按钮：哪个难度对应哪个模式
 const MODE={'three-point':{easy:'exam',hard:'exam'},'hill-park':{easy:'rand',hard:'rand'},parallel:{easy:'exam',hard:'hard'},stall:{easy:'exam',hard:'hard'},
  'lane-change':{easy:'easy',hard:'easy'},'highway-on':{easy:'easy',hard:'easy'},'highway-off':{easy:'easy',hard:'easy'}};
 function clickStart(){const ov=document.getElementById('ov');
  const r=ov.querySelector('input[name=df][value="'+S.diff+'"]');if(r)r.checked=true;
  let b=null;if(page==='green-right')b=ov.querySelector('.md[data-mode="free"]');
  else if(page==='red-right')b=ov.querySelector('.md[data-std="'+S.level+'"]');
  else{const m=(MODE[page]||{})[S.diff]||S.diff;b=ov.querySelector('.md[data-diff="'+m+'"]')||ov.querySelector('.md')}
  if(b)b.click()}
 // 只有第一项有一张“开始考试”卡片；之后每一项都自动开始，中间不出标题、不出总结，用叠画接上（mockfx.js）
 const quit=()=>{if(H)H.quit();else MST.nav('index.html#mock')};
 const D=document.documentElement,fxIn=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>{if(H)H.ready(window);else D.classList.add('fxin')},150)));
 // 屏幕上方的提示条：考试里只留考官的指令（“考官：……”），项目名称、灯色提示、教学提示都不显示
 const BN=document.getElementById('bn');
 if(BN){const chk=()=>{BN.style.visibility=/^(考官|Examin)/.test(BN.textContent.trim())?'':'hidden'};new MutationObserver(chk).observe(BN,{childList:true,characterData:true,subtree:true});chk()}
 // 红绿灯项目本身没有考官指令：开始时考官说一句
 const SAY={'red-right':'考官：前面红绿灯路口右转（turn right at the lights）','green-right':'考官：前面红绿灯路口右转（turn right at the lights）',
  'green-left':'考官：前面红绿灯路口左转（turn left at the lights）','green-arrow':'考官：前面红绿灯路口左转（turn left at the lights）'}[page];
 const say=()=>{if(SAY&&BN)setTimeout(()=>{BN.textContent=SAY;BN.style.color='#ffe27a'},1000)};      // 场景开始约 1 秒（离路口还远）发指令
 let started=false;
 const go=()=>{started=true;clickStart();say();fxIn()};
 // 浏览器要先点一下屏幕才放声音：第一次点按时把声音打开
 addEventListener('pointerdown',()=>{try{if(typeof AC!=='undefined'&&AC&&AC.state==='suspended')AC.resume()}catch(e){}},true);
 if(S.i===0){const box=document.createElement('div');box.className='ov';box.id='mkov';box.style.zIndex='20';document.body.appendChild(box);
  box.innerHTML='<div class="pn"><p class="mu" style="margin:0 0 4px">'+(EN?'Mock '+S.level.toUpperCase()+' test · '+(S.diff==='hard'?'Hard':'Easy'):'模拟考试 '+S.level.toUpperCase()+' · '+(S.diff==='hard'?'困难':'容易'))+'</p><h2>'+bi('准备好就出发','Ready when you are')+'</h2><p class="mu">'+
   (EN?'The test runs straight through, like the real one. Driving between tasks is skipped.':'整场考试一气呵成，像真的路考一样，中间不停下；路上的行驶和等灯会略过。')+'</p><button id="mkgo">'+(EN?'Start':'开始')+'</button> <button id="mkq" style="background:#6b7280">'+(EN?'Quit test':'退出考试')+'</button></div>';
  box.style.display='flex';if(H)H.ready(window);else D.classList.add('fxin');
  document.getElementById('mkq').onclick=quit;
  document.getElementById('mkgo').onclick=()=>{box.style.display='none';started=true;clickStart();say()}}
 else go();
 // 考试中“首页”键：退出考试
 const hm=document.getElementById('hm');if(hm)hm.onclick=quit;
 // 这一项结束：总结卡片出现（藏着的）
 const ov=document.getElementById('ov');
 const obs=new MutationObserver(()=>{if(!started||ov.style.display==='none'||!ov.querySelector('h2'))return;
  if(!ov.querySelector('#again')&&!ov.querySelector('#next')&&!ov.querySelector('.cards')&&!/总结/.test(ov.textContent))return;
  started=false;obs.disconnect();done()});
 obs.observe(ov,{attributes:true,attributeFilter:['style'],childList:true,subtree:false});
 // 最后一帧画面，给下一项叠画用
 function snap(){try{ren.render(scene,cam);const c=ren.domElement,w=Math.min(1280,c.width),h=Math.round(c.height*w/c.width),k=document.createElement('canvas');k.width=w;k.height=h;
  k.getContext('2d').drawImage(c,0,0,w,h);return k.toDataURL('image/jpeg',.72)}catch(e){return ''}}
 function done(){const ov=document.getElementById('ov'),ev=[];
  const RE=(typeof R!=='undefined'&&R&&Array.isArray(R.ev))?R.ev:[];      // 场景自己记的错误（有 key），用来对应到评分表
  ov.querySelectorAll('.card').forEach(c=>{const b=c.querySelector('b');if(!b)return;const t=b.cloneNode(true);t.querySelectorAll('.tag').forEach(x=>x.remove());const sp=c.querySelector('span:not(.tag)');
   const tt=t.textContent.trim().replace(/^第 \d+ 个路口 · /,''),m=RE.find(e=>e.title===tt);const nImg=S.res.reduce((n,r)=>n+(r?r.ev.filter(e=>e.img).length:0),0)+ev.filter(e=>e.img).length;
   ev.push({k:m?m.key:null,t:tt,ser:!!c.querySelector('.tag.s'),x:sp?sp.textContent.trim():'',img:m&&typeof m.img==='string'&&m.img.length<90000&&nImg<30?m.img:''})});      /* 出错那一刻的截图：成绩单上面一排排显示（最多 30 张） */
  S.res[S.i]={s:ST.s,zh:ST.zh,en:ST.en,ev};S.i++;save();
  const last=S.i>=S.steps.length,nx=S.steps[S.i];
  if(last){if(H){H.finish();return}D.classList.remove('fxin');D.classList.add('fxout');setTimeout(()=>{MST.nav('index.html#mock/result')},950);return}      // 考完：淡出到黑，看成绩单
  const url=nx.s+'.html?mock=1&v='+(S.v||'')+(nx.var?'&var='+nx.var:'');
  // 车继续往前溜（红绿灯项目：沿路线往前开），等下一项准备好再叠画过去
  let lt=performance.now();const roll=now=>{const dt=Math.min(.05,(now-lt)/1000);lt=now;try{if(typeof R!=='undefined'&&typeof R.u==='number'&&R.v>0)R.u+=R.v*dt}catch(e){}requestAnimationFrame(roll)};requestAnimationFrame(roll);
  if(H){H.next(url);return}
  const u=snap();if(u)MST.fx(u);MST.nav(url)}
})();
