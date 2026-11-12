// voice.js — 考官指令：语音一律用英文（加拿大路考中心只有英语、法语两种考试语言；法语版用法语语音）
// 屏幕上方提示条（#bn）出现“考官：……”时：改成显示英文指令（考官说的原话），非英语版在下面加一行本语言的注释，同时朗读
// 浏览器规定页面上要先有一次点按才能出声：被挡住的话，玩家第一次点屏幕时补读（10 秒内的指令）
(function(){const BN=document.getElementById('bn');if(!BN)return;
 let UL='zh';try{UL=(window.MST?MST.lang():localStorage.getItem('rt_lang'))||'zh'}catch(e){}
 const VL=UL==='fr'?'fr':'en';      // 语音语言：法语版用法语，其他都是英语
 // 中文指令 → [英文原话, 法文]
 const HILL={'上坡、有路缘':['uphill, with a curb','en montée, avec bordure'],'下坡、有路缘':['downhill, with a curb','en descente, avec bordure'],'上坡、没有路缘':['uphill, without a curb','en montée, sans bordure'],'下坡、没有路缘':['downhill, without a curb','en descente, sans bordure']};
 const D=[
  [/开出车位，左转/,'Pull out of the parking spot and turn left.','Sortez de la place de stationnement et tournez à gauche.'],
  [/前面右转，进停车场/,'Turn right into the plaza ahead.','Tournez à droite dans le stationnement devant.'],
  [/前面左转，进车道/,'Turn left into the next aisle.','Tournez à gauche dans la prochaine allée.'],
  [/前面左转，上大路/,'At the exit, turn left onto the road.','À la sortie, tournez à gauche sur la route.'],
  [/前面右转（turn right at the end）|^前面右转$/,'At the end, turn right.','Au bout, tournez à droite.'],
  [/红绿灯路口右转/,'At the lights, turn right.','Aux feux, tournez à droite.'],
  [/红绿灯路口左转/,'At the lights, turn left.','Aux feux, tournez à gauche.'],
  [/停牌路口直行/,'At the stop sign, go straight through.','Au panneau d’arrêt, continuez tout droit.'],
  [/停牌路口左转/,'At the stop sign, turn left.','Au panneau d’arrêt, tournez à gauche.'],
  [/平行停车/,'Using the white car ahead as your reference, parallel park behind it.','En utilisant la voiture blanche devant comme repère, stationnez en parallèle derrière elle.'],
  [/三点调头/,'Pull over to the right. When it’s safe, turn the vehicle around using a three-point turn.','Rangez-vous à droite. Quand c’est sécuritaire, faites demi-tour en trois manœuvres.'],
  [/继续行驶/,'Okay. When it’s safe, drive on.','D’accord. Quand c’est sécuritaire, continuez.'],
  [/倒车停进去/,'Back into the parking spot on your right.','Stationnez en marche arrière dans la place à votre droite.'],
  [/车头朝里停进去/,'Park front-in in the spot on your left.','Stationnez en marche avant dans la place à votre gauche.'],
  [/换到左车道/,'When it’s safe, change to the left lane.','Quand c’est sécuritaire, changez pour la voie de gauche.'],
  [/换回右车道/,'When it’s safe, change back to the right lane.','Quand c’est sécuritaire, revenez dans la voie de droite.'],
  [/401 高速往东/,'Take the ramp onto Highway 401 eastbound.','Prenez la bretelle vers l’autoroute 401 est.'],
  [/下一个出口/,'Take the next exit, exit three forty-two, Maple Road.','Prenez la prochaine sortie, la sortie 342, Maple Road.']];
 function look(zh){
  if(/坡道停车/.test(zh)){const k=Object.keys(HILL).find(k=>zh.includes(k)),h=HILL[k]||['on a hill','en pente'];
   return ['When it’s safe, pull over to the right and park, '+h[0]+'.','Quand c’est sécuritaire, rangez-vous à droite et stationnez, '+h[1]+'.']}
  const r=D.find(d=>d[0].test(zh));if(r)return [r[1],r[2]];
  const m=zh.match(/[（(]([^）)]*[A-Za-z][^）)]*)[）)]/);return m?[m[1].charAt(0).toUpperCase()+m[1].slice(1)+'.',null]:null}
 const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 // 语音
 const ss=window.speechSynthesis&&window.SpeechSynthesisUtterance?speechSynthesis:null;
 let VS=[];const lv=()=>{try{VS=ss.getVoices()||[]}catch(e){}};if(ss){lv();try{ss.addEventListener('voiceschanged',lv)}catch(e){}}
 const norm=l=>(l||'').replace('_','-').toLowerCase();
 function voice(){const c=VS.filter(v=>norm(v.lang).startsWith(VL));const pref=c.filter(v=>/-ca$/.test(norm(v.lang)));
  const L=pref.length?pref:VL==='en'?(c.filter(v=>/en-us/.test(norm(v.lang))).length?c.filter(v=>/en-us/.test(norm(v.lang))):c):c;
  return L.find(v=>/natural|neural|online|premium|enhanced|google/i.test(v.name))||L.find(v=>v.localService)||L[0]||null}
 let pend=null;
 function speak(s){if(!ss)return;try{ss.cancel();const u=new SpeechSynthesisUtterance(s);u.lang=VL==='fr'?'fr-CA':'en-CA';const v=voice();if(v)u.voice=v;u.rate=.95;
  let ok=false;u.onstart=()=>{ok=true;pend=null};ss.speak(u);
  setTimeout(()=>{if(!ok&&!ss.speaking)pend={s,t:Date.now()}},900)}catch(e){}}
 addEventListener('pointerdown',()=>{if(pend&&Date.now()-pend.t<10000){const p=pend;pend=null;speak(p.s)}},true);
 addEventListener('pagehide',()=>{try{ss&&ss.cancel()}catch(e){}});
 // 提示条：英文原话 + 本语言注释
 let shown='',lastSay='',lastT=0;
 const chk=()=>{if(BN.innerHTML===shown)return;const t=BN.textContent.trim();if(!/^考官/.test(t))return;
  const zh=t.replace(/^考官[：:]\s*/,''),r=look(zh);if(!r)return;
  const say=VL==='fr'&&r[1]?r[1]:r[0],note=UL==='en'||UL==='fr'?'':zh.replace(/[（(][^）)]*[A-Za-z][^）)]*[）)]/g,'');
  const html=(VL==='fr'?'Examinateur : ':'Examiner: ')+esc(say)+(note?'<br><small style="font-size:.82em;opacity:.85">考官：'+esc(note)+'</small>':'');
  shown=html;BN.innerHTML=html;
  const cf=document.getElementById('cf');if(cf&&cf.textContent.trim()===t)cf.innerHTML=html;
  if(say!==lastSay||Date.now()-lastT>20000){lastSay=say;lastT=Date.now();speak(say)}};
 new MutationObserver(chk).observe(BN,{childList:true,characterData:true,subtree:true});chk();
})();
