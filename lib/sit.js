// 标题下拉菜单（练习用，模拟考不出现）：画面最上方中间的标题变成按钮“场景名-当前项 ▾”，点开可以直接切换首页上的各个练习项；
// 有“情况”列表的场景（window.SITDEF），困难项下面再列出 1、2、3… 每种情况，练过的打 ✓（记在这台手机上）
(function(){
if(/[?&]mock=/.test(location.search)||window.MOCK)return;
const PG=(location.pathname.split('/').pop()||'').replace(/\.html$/,'');
if(PG==='green-left'||PG==='green-arrow'||PG==='index'||!PG)return;      // 绿灯左转、左转箭头用自己的
const $=id=>document.getElementById(id),T=s=>typeof TT==='function'?TT(s):s;
// 每个场景：短标签（标题里用）、哪些项要再分简单／困难（首页上的难度单选）、标题位置原来显示的灯色／名称提示（练习里不再显示）
const CFG={
 'green-right':{sh:{free:'随机驾驶',g2:'模拟考 G2',g:'模拟考 G'},df:['free'],sup:['绿灯右转','黄灯！','红灯']},
 'red-right':{sh:{g2:'G2',g:'G'},df:['g2','g'],sup:['红灯右转','横向黄灯','四面红灯','红灯 + 左转箭头','本方红灯','左转箭头变黄','绿灯 · 右转让行人']},
 'straight':{sh:{green:'绿灯',red:'红灯'},sup:['直行通过路口','红灯直行 · 你是第二辆车','绿灯直行 · 保持 60','绿灯 · 跟着前车走'],name:'直行'},
 'stop-left':{sup:['停牌左转','无停牌左转','Maple Dr 往北','右转','左转']},
 'stop-4way':{sup:['四面停牌右转','停牌左转','Maple Dr 往北','右转','左转']},
 'highway-on':{sup:['上高速','匝道']},'highway-off':{sup:['出高速','401 往东']},'lane-change':{sup:['换线']},
 'exit':{sh:{easy:'练习',hard:'困难'},sup:['出车位、出停车场'],name:'出车位'},'headin':{sh:{easy:'练习',park:'只练停进车位',hard:'困难'},sup:['停车场头进'],name:'头进停车'},
 'stall':{sh:{easy:'分步',exam:'考试',hard:'困难'},sup:['停车场倒车入位'],name:'倒车入位'},'parallel':{sh:{easy:'分步',exam:'考试',hard:'困难'},sup:['平行停车']},
 'three-point':{sh:{easy:'分步',exam:'考试'},sup:['三点调头']},'hill-park':{sup:['上下坡停车']},
 'residential':{sh:{easy:'标准',hard:'困难'},sup:['小区路段连考'],name:'小区连考'}};
const C=CFG[PG]||{sup:[]},NAME=T(C.name||document.title.split(' · ')[0]);
const kOf=b=>b.dataset.diff||b.dataset.mode||b.dataset.std||b.dataset.v||'';
let H0=null,ITEMS=[],CURK=null,CURD=null,wasP=false;
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
function lab(k,d){const b=ITEMS.find(x=>x.k===k);let s=(C.sh&&C.sh[k]&&T(C.sh[k]))||(b?b.lab:'');if(d&&C.df&&C.df.includes(k))s+=(s?' · ':'')+T(d==='hard'?'困难':'简单');return s}
function title(){const t=$('ttl');if(!t)return;let s=NAME;if(CURK!=null){let x=on()&&S.cur!=null?(lab(CURK,'')+(lab(CURK,'')?' · ':'')+(S.cur==='mix'?T('综合'):S.cur+1)):lab(CURK,CURD);if(x&&ITEMS.length>1||on())s+='-'+x}t.textContent=s+' ▾'}
function sup(){const b=$('bn');if(!b)return;const x=(b.textContent||'').trim();b.classList.toggle('sup',!x||C.sup.includes(x)||C.sup.map(T).includes(x)||x===NAME)}
// ---------- 菜单 ----------
function setP(v){try{playing=v}catch(e){}}function getP(){try{return playing}catch(e){return false}}
function menu(open){const m=$('sitm');if(!open){if(m.style.display==='block'&&wasP)setP(true);wasP=false;m.style.display='none';return}
 const ov=$('ov');wasP=getP()&&!(ov&&ov.style.display!=='none'&&ov.style.display!=='');setP(false);
 const it=(v,l,c)=>`<button data-v="${v}" class="${c?'cur':''}">${l}</button>`;let h='';
 ITEMS.forEach(x=>{const dfs=C.df&&C.df.includes(x.k)?['easy','hard']:[null];dfs.forEach(d=>{const key=x.k+'|'+(d||''),cur=x.k===CURK&&(d==null||d===CURD);
  if(d==='hard'&&SD()&&SD().item===x.k+'|hard'||!d&&SD()&&SD().item===x.k){const dn=done();h+=`<div class="hd">${lab(x.k,d)} · ${T('已练')} ${dn.length}/${SD().list.length}</div>`+it(key+'|auto',T('自动（没练过的）'),cur&&S.sel==null)+SD().list.map((n,i)=>it(key+'|'+i,(i+1)+'  '+T(n)+(dn.includes(i)?'  ✓':''),cur&&S.sel===i)).join('')+it(key+'|mix',T('综合（多种叠加）'),cur&&S.sel==='mix')}
  else h+=it(key,(d?lab(x.k,d):x.lab||NAME),cur)})});
 m.innerHTML=h;m.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();const[k,d,s]=b.dataset.v.split('|');S.sel=s==null||s==='auto'?null:s==='mix'?'mix':+s;wasP=false;m.style.display='none';go(k,d)});
 m.style.display='block'}
function go(k,d){const ov=$('ov'),hm=$('hm');if(!ov)return;if(hm&&hm.onclick)hm.onclick();else{try{if(R)R.over=true}catch(e){}ov.innerHTML=H0;ov.style.display='flex';try{bindHome()}catch(e){}}
 if(d){const r=ov.querySelector('input[name=df][value="'+d+'"]');if(r)r.checked=true}
 const b=[...ov.querySelectorAll('.md')].find(x=>kOf(x)===k);if(b)b.click()}
function init(){const ov=$('ov');if(!ov||!ov.querySelector('.md'))return;H0=ov.innerHTML;
 ITEMS=[...ov.querySelectorAll('.md')].map(b=>({k:kOf(b),lab:((b.querySelector('b')||b).textContent||'').trim()}));
 const t=document.createElement('button');t.id='ttl';document.body.appendChild(t);const m=document.createElement('div');m.id='sitm';document.body.appendChild(m);
 t.onclick=e=>{e.stopPropagation();menu(m.style.display!=='block')};
 document.addEventListener('pointerdown',e=>{if(m.style.display==='block'&&!m.contains(e.target)&&e.target!==t)menu(false)});
 // 记住现在练的是哪一项（首页点的、菜单点的都算）
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.md');if(!b)return;CURK=kOf(b);const r=document.querySelector('input[name=df]:checked');CURD=r?r.value:null;if(e.isTrusted)S.sel=null;setTimeout(title,0)},true);
 const bn=$('bn');if(bn){bn.classList.add('sit');new MutationObserver(sup).observe(bn,{childList:true,characterData:true,subtree:true});sup()}
 const um=new URLSearchParams(location.search).get('mode');if(um&&ITEMS.some(x=>x.k===um))CURK=um;      // 上下坡停车选了某一种会重新载入页面
 title()}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',init);else init();
})();
