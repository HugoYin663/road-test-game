// voice.js — 考官指令的语音：屏幕上方提示条（#bn）出现“考官：……”时，用浏览器自带的语音朗读（练习和模拟考试都有）
// 中文界面读中文（括号里的英文原话不读）；英文界面读括号里的英文原话，没有英文就读中文
// 浏览器规定页面上要先有一次点按才能出声：被挡住的话，玩家第一次点屏幕时补读（10 秒内的指令）
(function(){if(!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance)return;
 const ss=speechSynthesis,BN=document.getElementById('bn');if(!BN)return;
 let EN=false;try{EN=localStorage.getItem('rt_lang')==='en'}catch(e){}
 let VS=[];const lv=()=>{try{VS=ss.getVoices()||[]}catch(e){}};lv();try{ss.addEventListener('voiceschanged',lv)}catch(e){}
 const norm=l=>(l||'').replace('_','-').toLowerCase();
 function voice(zh){const c=VS.filter(v=>zh?/^(zh|cmn)/.test(norm(v.lang)):/^en/.test(norm(v.lang)));
  const pref=zh?c.filter(v=>/(cn|hans)/.test(norm(v.lang))):c.filter(v=>/en-(ca|us)/.test(norm(v.lang)));
  const L=pref.length?pref:c;return L.find(v=>/natural|neural|online|premium|enhanced|xiaoxiao|yunxi|tingting|google/i.test(v.name))||L.find(v=>v.localService)||L[0]||null}
 function text(t){t=t.replace(/^考官[：:]\s*/,'');
  if(EN){const m=t.match(/[（(]([^）)]*[A-Za-z][^）)]*)[）)]/g);if(m)return {s:m.map(x=>x.slice(1,-1)).join('. '),zh:false}}
  return {s:t.replace(/[（(][^）)]*[A-Za-z][^）)]*[）)]/g,'').replace(/[，、]\s*$/,''),zh:true}}
 let last='',pend=null;
 function speak(p){try{ss.cancel();const u=new SpeechSynthesisUtterance(p.s);u.lang=p.zh?'zh-CN':'en-CA';const v=voice(p.zh);if(v)u.voice=v;u.rate=p.zh?1:.95;
  let ok=false;u.onstart=()=>{ok=true;pend=null};ss.speak(u);
  setTimeout(()=>{if(!ok&&!ss.speaking){pend=Object.assign(p,{t:Date.now()})}},900)}catch(e){}}
 addEventListener('pointerdown',()=>{if(pend&&Date.now()-pend.t<10000){const p=pend;pend=null;speak(p)}},true);
 const chk=()=>{const t=BN.textContent.trim();if(!/^考官/.test(t)||t===last)return;last=t;const p=text(t);if(p.s)speak(p)};
 new MutationObserver(chk).observe(BN,{childList:true,characterData:true,subtree:true});
 addEventListener('pagehide',()=>{try{ss.cancel()}catch(e){}});
})();
