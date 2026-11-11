// ============================================================
// billboard.js — 路边广告牌（G1+ 默认广告；ads.json 里有广告就换成广告图）。换线、上下高速、路口转弯、出停车场共用
// ============================================================
const BBT=(()=>{const W=1280,H=640,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),t=new T.CanvasTexture(c);
 const rr=(a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
 const draw=logo=>{x.fillStyle='#fff';x.fillRect(0,0,W,H);
  // 右下角的蓝绿色弧带
  x.save();x.beginPath();x.moveTo(560,H);x.quadraticCurveTo(900,560,W,330);x.lineTo(W,H);x.closePath();x.fillStyle='#7ccf2a';x.fill();
  x.beginPath();x.moveTo(640,H);x.quadraticCurveTo(960,585,W,380);x.lineTo(W,H);x.closePath();const g=x.createLinearGradient(640,H,W,380);g.addColorStop(0,'#1f6fe0');g.addColorStop(1,'#0b3fae');x.fillStyle=g;x.fill();x.restore();
  // logo
  if(logo)x.drawImage(logo,46,70,260,260);else{rr(46,70,260,260,46);x.fillStyle='#1d8cf0';x.fill();x.fillStyle='#c6f23a';x.font='bold 120px Arial';x.fillText('G1+',70,240)}
  // 标题
  x.fillStyle='#10285a';x.font='900 92px Arial,Helvetica,sans-serif';x.fillText('Pass Your',340,150);{let fs=92;x.font='900 '+fs+'px Arial,Helvetica,sans-serif';while(x.measureText('G1 G2 G Test').width>640&&fs>60){fs-=2;x.font='900 '+fs+'px Arial,Helvetica,sans-serif'}x.fillText('G1 G2 G Test',340,245)}      /* G1、G2、G 三种考试 */
  x.fillStyle='#1673e6';x.font='bold 58px Arial,Helvetica,sans-serif';x.fillText('with Confidence',340,312);
  x.fillStyle='#1b2b45';x.font='600 36px Arial,Helvetica,sans-serif';x.fillText('Study · Practice · Succeed',340,368);
  // 三个小图标
  [['Real','Questions',0],['Mock','Tests',1],['Track','Progress',2]].forEach((a,i)=>{const cx=110+i*190,cy=470;x.fillStyle='#eaf2fd';x.beginPath();x.arc(cx,cy,48,0,7);x.fill();x.strokeStyle=x.fillStyle='#1665d8';x.lineWidth=6;
   if(i===0){x.strokeRect(cx-26,cy-20,24,40);x.strokeRect(cx+2,cy-20,24,40)}
   else if(i===1){x.strokeRect(cx-20,cy-24,40,50);x.beginPath();x.moveTo(cx-10,cy+2);x.lineTo(cx-2,cy+12);x.lineTo(cx+14,cy-10);x.stroke()}
   else{[[-22,10,12],[-4,-6,28],[14,-22,44]].forEach(b=>x.fillRect(cx+b[0],cy+b[1]+8,12,b[2]))}
   x.fillStyle='#1b2b45';x.font='600 30px Arial,Helvetica,sans-serif';x.textAlign='center';x.fillText(a[0],cx,cy+86);x.fillText(a[1],cx,cy+120);x.textAlign='left';
   if(i<2){x.strokeStyle='#d6dde8';x.lineWidth=2;x.beginPath();x.moveTo(cx+95,cy-40);x.lineTo(cx+95,cy+120);x.stroke()}});
  // 手机
  x.save();x.translate(1010,18);x.rotate(.06);x.scale(.86,.86);rr(0,0,240,470,34);x.fillStyle='#16191f';x.fill();rr(12,12,216,446,26);x.fillStyle='#fff';x.fill();
  x.fillStyle='#1665d8';rr(12,12,216,64,26);x.fill();x.fillRect(12,50,216,26);x.fillStyle='#fff';x.font='bold 30px Arial';x.textAlign='center';x.fillText('G1+',120,58);
  x.fillStyle='#1b2b45';x.font='bold 21px Arial';x.fillText('What does this sign',120,112);x.fillText('mean?',120,138);
  x.save();x.translate(120,200);x.rotate(Math.PI/4);x.fillStyle='#f6c71b';x.fillRect(-38,-38,76,76);x.strokeStyle='#111';x.lineWidth=4;x.strokeRect(-34,-34,68,68);x.restore();
  x.strokeStyle='#111';x.lineWidth=7;x.beginPath();x.moveTo(112,228);x.lineTo(112,200);x.quadraticCurveTo(112,186,126,186);x.lineTo(132,186);x.stroke();x.fillStyle='#111';x.beginPath();x.moveTo(146,186);x.lineTo(130,174);x.lineTo(130,198);x.fill();
  x.textAlign='left';['A. Left turn only','B. Right turn ahead','C. Merge','D. No U-turn'].forEach((o,k)=>{const y=262+k*44;rr(24,y,192,36,8);x.fillStyle=k===1?'#1665d8':'#eef2f8';x.fill();x.fillStyle=k===1?'#fff':'#1b2b45';x.font='18px Arial';x.fillText(o,34,y+24)});
  x.restore();
  // 口号
  x.save();x.translate(1050,560);x.rotate(-.32);x.fillStyle='#fff';x.font='italic bold 34px Arial';x.textAlign='center';x.fillText('Your Driving Success',0,0);x.fillStyle='#f4e04a';x.fillText('Starts Here!',10,40);x.restore();
  t.needsUpdate=true};
 draw(null);if(typeof Image!=='undefined'){const im=new Image();im.onload=()=>draw(im);im.src='assets/g1plus.png'}return t})();
function billboard(slot){const g=new T.Group(),pm=M(0x3a3f47);
 g.add(mesh(new T.BoxGeometry(.5,3.2,.5),pm,0,1.6,0));g.add(mesh(new T.BoxGeometry(7.0,3.6,.35),pm,0,4.9,.12));      // 立柱、外框
 const f=mesh(new T.PlaneGeometry(6.6,3.3),new T.MeshBasicMaterial({map:BBT}),0,4.9,-.06);f.rotation.y=Math.PI;g.add(f);if(slot&&typeof ADS!=='undefined')ADS.apply(f,slot);      // 有广告就换成广告图（lib/ads.js、ads.json）
      // 画面朝向开过来的车
 g.children.forEach(m=>m.castShadow=true);scene.add(g);return g}
// 放一块广告牌：路线坐标 (x,z)，开过来的车的方向 h；画面朝着开过来的车，稍微斜向马路
function placeBB(g,x,z,h,y){place(g,x,z,h+.42,y||0);g.visible=true;return g}
