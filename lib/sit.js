// 标题下拉菜单（练习用，模拟考不出现）：画面最上方中间的标题变成按钮“场景名-当前项 ▾”，点开可以直接切换首页上的各个练习项；
// 有“情况”列表的场景（window.SITDEF），困难项下面再列出 1、2、3… 每种情况，练过的打 ✓（记在这台手机上）
(function(){
if(/[?&]mock=/.test(location.search)||window.MOCK)return;
const PG=(location.pathname.split('/').pop()||'').replace(/\.html$/,'');
if(PG==='green-left'||PG==='green-arrow'||PG==='index'||!PG)return;      // 绿灯左转、左转箭头用自己的
const $=id=>document.getElementById(id),T=s=>typeof TT==='function'?TT(s):s;
// 每个场景：练习里只分“简单”“困难”（it：[名字, 首页原来的哪个按钮, 难度单选]），模拟考的选项不再出现；标题位置原来显示的灯色／名称提示（sup，练习里不再显示）
const ED=[['简单','easy'],['困难','hard']];
const CFG={
 'green-right':{it:[['简单','free','easy'],['困难','free','hard']],sup:['绿灯右转','黄灯！','红灯']},
 'red-right':{it:[['简单','g2','easy'],['困难','g2','hard']],sup:['红灯右转','横向黄灯','四面红灯','红灯 + 左转箭头','本方红灯','左转箭头变黄','绿灯 · 右转让行人']},
 'straight':{one:1,sup:['直行通过路口','红灯直行 · 你是第二辆车','绿灯直行 · 保持 60','绿灯 · 跟着前车走']},
 'stop-left':{sup:['停牌左转','无停牌左转','Maple Dr 往北','右转','左转']},
 'stop-4way':{sup:['四面停牌右转','停牌左转','Maple Dr 往北','右转','左转']},
 'highway-on':{sup:['上高速','匝道']},'highway-off':{sup:['出高速','401 往东']},'lane-change':{sup:['换线']},
 'exit':{it:ED,sup:['出车位、出停车场'],name:'出车位'},'headin':{it:ED,sup:['停车场头进'],name:'头进停车'},
 'stall':{it:ED,sup:['停车场倒车入位'],name:'倒车入位'},'parallel':{it:ED,sup:['平行停车']},
 'three-point':{it:[['简单','easy'],['困难','exam']],sup:['三点调头']},'hill-park':{sup:['上下坡停车']},
 'residential':{it:ED,sup:['小区路段连考'],name:'小区连考'}};
const C=CFG[PG]||{sup:[]};let NAME=T(C.name||document.title.split(' · ')[0]);
const kOf=b=>b.dataset.diff||b.dataset.mode||b.dataset.std||b.dataset.v||'';
let ITEMS=[],CURI=null,wasP=false;
const css=document.createElement('style');css.textContent=
 '#ttl{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:2;color:#fff;padding:7px 16px;border-radius:10px;font-size:15px;white-space:nowrap;font-family:inherit;cursor:pointer;background:rgba(30,90,170,.85);border:2px solid #fff;font-weight:700}'+
 '#bn.sit{top:calc(54px + env(safe-area-inset-top,0px))!important}#bn.sup{display:none!important}'+
 '#sitm{display:none;position:fixed;top:calc(50px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:25;background:rgba(20,24,30,.92);border-radius:12px;padding:6px;min-width:230px;max-height:calc(100vh - 70px);overflow:auto}'+
 '#sitm .hd{color:#a5b0c0;font-size:12px;padding:4px 10px 6px}#sitm button{display:block;width:100%;text-align:left;background:none;border:0;color:#fff;font-size:15px;padding:9px 12px;border-radius:8px;cursor:pointer;font-family:inherit;white-space:nowrap}#sitm button.cur{background:rgba(255,255,255,.16);font-weight:700}';
document.head.appendChild(css);
// ---------- 情况（只有定义了 SITDEF 的场景） ----------
const S={sel:null,cur:null};
const SD=()=>window.SITDEF;
const done=()=>{try{return JSON.parse(localStorage.getItem(SD().key)||'[]')}catch(e){return[]}};
function mark(i){if(typeof i!=='number'||!SD())return;const d=done();if(!d.includes(i)){d.push(i);try{localStorage.setItem(SD().key,JSON.stringify(d))}catch(e){}}}
function on(){return !!(SD()&&SD().when())}
function begin(){if(!on()){S.cur=null;return null}if(S.sel!=null){S.cur=S.sel;return S.cur}const d=done(),L=SD().list.map((x,i)=>i).filter(i=>!d.includes(i));S.cur=L.length?L[Math.random()*L.length|0]:'mix';return S.cur}
function curLine(){if(S.cur==null)return'';const n=SD().list.length,d=done().length;return T('这次的情况')+'：'+(S.cur==='mix'?T('综合（多种叠加）'):(S.cur+1)+' '+T(SD().list[S.cur]))+(S.sel==null?' · '+T('已练')+' '+d+'/'+n:'')}
window.SITUI={begin,mark,on,curLine,get cur(){return S.cur},refresh:()=>title()};
// ---------- 标题 ----------
const ikey=x=>x.k+'|'+(x.df||'');
function title(){const t=$('ttl');if(!t)return;let s=NAME;const x=ITEMS[CURI];
 if(x&&ITEMS.length>1)s+='-'+T(x.lab)+(on()&&S.cur!=null?' · '+(S.cur==='mix'?T('综合'):S.cur+1):'');t.textContent=s+' ▾'}
function sup(){const b=$('bn');if(!b)return;const x=(b.textContent||'').trim();b.classList.toggle('sup',!x||C.sup.includes(x)||C.sup.map(T).includes(x)||x===NAME)}
// ---------- 首页：只留“简单”“困难”两个按钮（点了等于原来的按钮＋难度单选） ----------
function homeFix(){const ov=$('ov');if(!ov||!C.it||!ov.querySelector('.md')||ov.querySelector('.md[data-sx]'))return;
 const md=[...ov.querySelectorAll('.md')],box=md[0].parentNode,rw=ov.querySelector('input[name=df]');
 const rp=rw&&rw.closest('p,div:not(.modes)');if(rp&&rp!==ov&&!rp.contains(box))rp.style.display='none';
 ITEMS.forEach((x,i)=>{const o=md.find(b=>kOf(b)===x.k);if(!o)return;let d='';
  if(x.df){const r=ov.querySelector('input[name=df][value="'+x.df+'"]'),l=r&&r.parentNode.textContent.trim().match(/[（(](.*)[)）]/);d=l?l[1]:''}
  else d=(o.querySelector('span')||{}).textContent||'';
  const n=document.createElement('button');n.className='md';n.dataset.sx=i;n.innerHTML='<b>'+T(x.lab)+'</b><span>'+d+'</span>';
  n.onclick=e=>{S.sel=null;pick(i)};box.insertBefore(n,md[0])});
 md.forEach(b=>b.style.display='none')}
function pick(i){const x=ITEMS[i],ov=$('ov');if(!x||!ov)return;CURI=i;
 if(x.df){const r=ov.querySelector('input[name=df][value="'+x.df+'"]');if(r)r.checked=true}
 const b=[...ov.querySelectorAll('.md:not([data-sx])')].find(o=>kOf(o)===x.k);if(b)b.click();setTimeout(title,0)}
// ---------- 菜单 ----------
function setP(v){try{playing=v}catch(e){}}function getP(){try{return playing}catch(e){return false}}
function menu(open){const m=$('sitm');if(!open){if(m.style.display==='block'&&wasP)setP(true);wasP=false;m.style.display='none';return}
 const ov=$('ov');wasP=getP()&&!(ov&&ov.style.display!=='none'&&ov.style.display!=='');setP(false);
 const it=(v,l,c)=>`<button data-v="${v}" class="${c?'cur':''}">${l}</button>`;let h='';
 ITEMS.forEach((x,i)=>{const cur=i===CURI;
  if(SD()&&SD().item===ikey(x)){const dn=done();h+=`<div class="hd">${T(x.lab)} · ${T('已练')} ${dn.length}/${SD().list.length}</div>`+it(i+'|auto',T('自动（没练过的）'),cur&&S.sel==null)+SD().list.map((n,j)=>it(i+'|'+j,(j+1)+'  '+T(n)+(dn.includes(j)?'  ✓':''),cur&&S.sel===j)).join('')+it(i+'|mix',T('综合（多种叠加）'),cur&&S.sel==='mix')}
  else h+=it(i,ITEMS.length>1?T(x.lab):T('重新开始'),cur)});
 m.innerHTML=h;m.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();const[i,s]=b.dataset.v.split('|');S.sel=s==null||s==='auto'?null:s==='mix'?'mix':+s;wasP=false;m.style.display='none';go(+i)});
 m.style.display='block'}
function go(i){const ov=$('ov'),hm=$('hm');if(!ov)return;if(hm&&hm.onclick)hm.onclick();homeFix();pick(i)}
function init(){const ov=$('ov');if(!ov||!ov.querySelector('.md'))return;
 const md=[...ov.querySelectorAll('.md')];
 if(C.it)ITEMS=C.it.map(([lab,k,df])=>({lab,k,df}));
 else ITEMS=md.map(b=>({k:kOf(b),lab:((b.querySelector('b')||b).textContent||'').trim()}));
 if(C.one){const v=new URLSearchParams(location.search).get('var');const L=ITEMS.filter(x=>x.k===v);if(L.length){ITEMS=L;NAME=T(L[0].lab)}}      // 绿灯直行、红灯直行是两个单项
 const t=document.createElement('button');t.id='ttl';document.body.appendChild(t);{const O=document.getElementById('ov');if(O){const f=()=>{t.style.visibility=getComputedStyle(O).display!=='none'?'hidden':''};new MutationObserver(f).observe(O,{attributes:true,attributeFilter:['style','class']});f()}}      /* 首页、总结卡片出来时标题按钮先藏起来（不挡卡片上的字） */const m=document.createElement('div');m.id='sitm';document.body.appendChild(m);
 t.onclick=e=>{e.stopPropagation();menu(m.style.display!=='block')};
 document.addEventListener('pointerdown',e=>{if(m.style.display==='block'&&!m.contains(e.target)&&e.target!==t)menu(false)});
 // 没有改首页的场景：记住首页点的是哪一项
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.md');if(!b||b.dataset.sx!=null||C.it)return;const i=ITEMS.findIndex(x=>x.k===kOf(b));if(i>=0)CURI=i;if(e.isTrusted)S.sel=null;setTimeout(title,0)},true);
 homeFix();new MutationObserver(homeFix).observe(ov,{childList:true,subtree:true});
 const bn=$('bn');if(bn){bn.classList.add('sit');new MutationObserver(sup).observe(bn,{childList:true,characterData:true,subtree:true});sup()}
 const um=new URLSearchParams(location.search).get('mode'),ui=ITEMS.findIndex(x=>x.k===um);if(ui>=0)CURI=ui;      // 上下坡停车选了某一种会重新载入页面
 title()}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',init);else init();
})();
