// ============================================================
// mock.js — 模拟考试：把单项一项接一项串起来
// 首页（index.html）开始考试时，把路线存在 localStorage('rt_mock')：{level:'g2'|'g',diff:'easy'|'hard',steps:[{s,v,zh,en}],i,res:[]}
// 每个项目的页面最后加载这个文件；网址里有 ?mock=1 时：先显示“第几项”的卡片，点开始就按考试的难度开始这一项；
// 这一项结束（出现总结卡片）时，把错误记下来，换成“下一项”的卡片；最后一项做完，回首页看成绩单
// ============================================================
(function(){
 let Q;try{Q=new URLSearchParams(location.search)}catch(e){return}
 if(!Q.get('mock'))return;
 let S=null;try{S=JSON.parse(localStorage.getItem('rt_mock')||'null')}catch(e){}
 const page=(location.pathname.split('/').pop()||'').replace(/\.html$/,'');
 if(!S||!S.steps||!S.steps[S.i]||S.steps[S.i].s!==page)return;
 const ST=S.steps[S.i],EN=S.lang==='en',bi=(z,e)=>EN?e:z+'<br><small style="opacity:.75">'+e+'</small>';
 window.MOCK=S;
 const save=()=>{try{localStorage.setItem('rt_mock',JSON.stringify(S))}catch(e){}};
 // 各项目开始按钮：哪个难度对应哪个模式
 const MODE={'three-point':{easy:'exam',hard:'exam'},'hill-park':{easy:'rand',hard:'rand'},parallel:{easy:'exam',hard:'hard'},stall:{easy:'exam',hard:'hard'},
  'lane-change':{easy:'easy',hard:'easy'},'highway-on':{easy:'easy',hard:'easy'},'highway-off':{easy:'easy',hard:'easy'}};
 function clickStart(){const ov=document.getElementById('ov');
  const r=ov.querySelector('input[name=df][value="'+S.diff+'"]');if(r)r.checked=true;
  let b=null;if(page==='green-right')b=ov.querySelector('.md[data-mode="free"]');
  else if(page==='red-right')b=ov.querySelector('.md[data-std="'+S.level+'"]');
  else{const m=(MODE[page]||{})[S.diff]||S.diff;b=ov.querySelector('.md[data-diff="'+m+'"]')||ov.querySelector('.md')}
  if(b)b.click()}
 // 盖在页面上的考试卡片
 const box=document.createElement('div');box.className='ov';box.id='mkov';box.style.zIndex='20';document.body.appendChild(box);
 const head=(k)=>'<p class="mu" style="margin:0 0 4px">'+(EN?'Mock '+S.level.toUpperCase()+' test · '+(S.diff==='hard'?'Hard':'Easy'):'模拟考试 '+S.level.toUpperCase()+' · '+(S.diff==='hard'?'困难':'容易'))+' · '+(EN?'Task ':'第 ')+(k||S.i+1)+' / '+S.steps.length+(EN?'':' 项')+'</p>';
 const quit=()=>{location.href='index.html#mock'};
 box.innerHTML='<div class="pn">'+head()+'<h2>'+bi(ST.zh,ST.en)+'</h2><button id="mkgo">'+(EN?'Start':'开始')+'</button> <button id="mkq" style="background:#6b7280">'+(EN?'Quit test':'退出考试')+'</button></div>';
 box.style.display='flex';
 {const o=document.getElementById('ov');if(o)o.style.visibility='hidden'}      // 项目自己的开始菜单先藏起来
 let started=false;
 document.getElementById('mkq').onclick=quit;
 document.getElementById('mkgo').onclick=()=>{box.style.display='none';started=true;clickStart();document.getElementById('ov').style.visibility=''};
 // 考试中“首页”键：退出考试
 const hm=document.getElementById('hm');if(hm)hm.onclick=quit;
 // 这一项结束：总结卡片出现
 const ov=document.getElementById('ov');
 const obs=new MutationObserver(()=>{if(!started||ov.style.display==='none'||!ov.querySelector('h2'))return;
  if(!ov.querySelector('#again')&&!ov.querySelector('#next')&&!ov.querySelector('.cards')&&!/总结/.test(ov.textContent))return;
  started=false;obs.disconnect();done()});
 obs.observe(ov,{attributes:true,attributeFilter:['style'],childList:true,subtree:false});
 function done(){const ov=document.getElementById('ov'),ev=[];
  const RE=(typeof R!=='undefined'&&R&&Array.isArray(R.ev))?R.ev:[];      // 场景自己记的错误（有 key），用来对应到评分表
  ov.querySelectorAll('.card').forEach(c=>{const b=c.querySelector('b');if(!b)return;const t=b.cloneNode(true);t.querySelectorAll('.tag').forEach(x=>x.remove());const sp=c.querySelector('span:not(.tag)');
   const tt=t.textContent.trim().replace(/^第 \d+ 个路口 · /,''),m=RE.find(e=>e.title===tt);ev.push({k:m?m.key:null,t:tt,ser:!!c.querySelector('.tag.s'),x:sp?sp.textContent.trim():''})});
  S.res[S.i]={s:ST.s,zh:ST.zh,en:ST.en,ev};S.i++;save();
  ov.style.display='none';
  const ns=ev.filter(e=>e.ser).length,nm=ev.length-ns,last=S.i>=S.steps.length,nx=S.steps[S.i];
  const list=ev.length?'<div style="text-align:left;max-width:520px;margin:6px auto">'+ev.map(e=>'<p style="margin:4px 0">'+(e.ser?'<span class="tag s">'+(EN?'Critical':'严重')+'</span> ':'<span class="tag">'+(EN?'Mark':'扣分项')+'</span> ')+e.t+'</p>').join('')+'</div>':'<p>'+(EN?'No errors on this task.':'这一项没有错误。')+'</p>';
  box.innerHTML='<div class="pn">'+head(S.i)+'<h2>'+(EN?'Task done: ':'这一项完成：')+(EN?ST.en:ST.zh)+'</h2><p>'+(EN?'Critical '+ns+' · Marks '+nm:'严重错误 <b>'+ns+'</b> 处 · 扣分项 <b>'+nm+'</b> 处')+'</p>'+list+
   (last?'<button id="mknx">'+(EN?'See the score sheet':'查看成绩单')+'</button>':'<p class="mu" style="margin-top:10px">'+(EN?'Next: ':'下一项：')+(EN?nx.en:nx.zh)+'</p><button id="mknx">'+(EN?'Next task →':'下一项 →')+'</button>')+' <button id="mkq2" style="background:#6b7280">'+(EN?'Quit test':'退出考试')+'</button></div>';
  box.style.display='flex';
  document.getElementById('mkq2').onclick=quit;
  document.getElementById('mknx').onclick=()=>{if(last){location.href='index.html#mock/result';return}location.href=nx.s+'.html?mock=1&v='+(S.v||'')+(nx.var?'&var='+nx.var:'')}}
})();
