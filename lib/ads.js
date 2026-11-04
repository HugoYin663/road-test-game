// ============================================================
// ads.js — 路边广告牌的广告：从网站根目录的 ads.json 读取
// 换广告只要改 ads.json、把图片放进 ads/ 文件夹，不用改程序；读不到（离线、文件坏了）就显示默认的 G1+ 广告
// ============================================================
const ADS={cfg:null,shown:{}};
ADS.ready=(typeof fetch==='function'?fetch('ads.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null):Promise.resolve(null)).then(j=>{ADS.cfg=j;return j});
// 某个广告位现在该放哪条广告：在投放日期内（from～to，含当天），有图片；同一个广告位有好几条时随机放一条
ADS.pick=slot=>{const c=ADS.cfg;if(!c||!c.slots||!c.slots[slot])return null;const now=new Date(),d=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
 const ok=[].concat(c.slots[slot]).filter(a=>a&&a.image&&(!a.from||a.from<=d)&&(!a.to||a.to>=d));return ok.length?ok[Math.random()*ok.length|0]:null};
// 把广告图贴到广告牌的画面上（mesh 是画面那一块）。图片要和网页在同一个网站，或者允许跨站读取（CORS）
ADS.apply=(mesh,slot)=>ADS.ready.then(()=>{const a=ADS.pick(slot);if(!a)return;const im=new Image();im.crossOrigin='anonymous';
 im.onload=()=>{const t=new THREE.Texture(im);t.needsUpdate=true;const m=mesh.material.clone();m.map=t;m.needsUpdate=true;mesh.material=m;ADS.shown[slot]=a};im.src=a.image});
// 结束总结页最下面的一行：“本场景广告：××（点开看）”
ADS.credit=()=>{const seen={},l=Object.values(ADS.shown).filter(a=>a.sponsor&&!seen[a.sponsor]&&(seen[a.sponsor]=1));if(!l.length)return'';
 return'<p class="mu" style="margin-top:8px">本场景广告：'+l.map(a=>a.link?`<a href="${encodeURI(a.link)}" target="_blank" rel="noopener sponsored">${a.sponsor.replace(/[<>&"]/g,'')}</a>`:a.sponsor.replace(/[<>&"]/g,'')).join('、')+'</p>'};
