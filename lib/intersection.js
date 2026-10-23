// ============================================================
// intersection.js — 十字路口：路面、人行道、标线、信号灯（红绿灯类项目共用）
// ============================================================
// 地面与路面
const asp=M(0xffffff,{map:noise('#6c6c75',80,50)});
box(700,.1,700,asp,0,-.004,0);box(2*hw,.1,700,asp,0,0,0);box(700,.1,2*hw,asp,0,.004,0);
// 带圆角的路缘人行道（米色）
const CL=hw+3.75,WS=.9,XT=12.3;   // 人行道中心线、半宽（总宽1.8米）、缓坡终点（刚好在另一条人行道的边缘之前）
const xaf=(z,R2)=>{const c=hw+6;return c-Math.sqrt(R2*R2-(c-z)**2)};
function islandShape(o){const s=new T.Shape(),r=6,e=300,c=hw+r,R2=r-o,N=48,cl=CL,w=WS,xe=XT;
 const zA1=cl+w,zA2=cl-w,xA=z=>c-Math.sqrt(R2*R2-(c-z)**2);
 s.moveTo(c,hw+o);s.lineTo(e,hw+o);s.lineTo(e,e);s.lineTo(hw+o,e);s.lineTo(hw+o,c);
 const arc=[];for(let i=0;i<=N;i++){const th=Math.PI+i/N*Math.PI/2;arc.push([c+R2*Math.cos(th),c+R2*Math.sin(th)])}
 arc.filter(p=>p[1]>zA1).forEach(p=>s.lineTo(p[0],p[1]));
 s.lineTo(xA(zA1),zA1);s.lineTo(xe,zA1);s.lineTo(xe,zA2);s.lineTo(xA(zA2),zA2);
 arc.filter(p=>p[1]<zA2&&p[0]<cl-w).forEach(p=>s.lineTo(p[0],p[1]));
 s.lineTo(cl-w,xA(cl-w));s.lineTo(cl-w,xe);s.lineTo(cl+w,xe);s.lineTo(cl+w,xA(cl+w));
 arc.filter(p=>p[0]>cl+w).forEach(p=>s.lineTo(p[0],p[1]));
 return s}
function island(o,h,col,sx,sz){const g=new T.ExtrudeGeometry(islandShape(o),{depth:h,bevelEnabled:false});g.rotateX(Math.PI/2);g.translate(0,h,0);
 const m=new T.Mesh(g,M(col,{side:T.DoubleSide}));m.scale.set(sx,1,sz);m.receiveShadow=true;scene.add(m)}
const bx=(w,h,d,c,x,y,z)=>{const m=mesh(new T.BoxGeometry(w,h,d),M(c),x,y,z);m.receiveShadow=true;scene.add(m)};
// 缓坡：路面一端沿路缘圆弧、与路面齐平，向人行道方向平缓抬升，终点接人行道转角平台
function ramp(alongZ,sx,sz){const N=16,W=WS-.005,pos=[],idx=[],hr=.05,ht=.12,rows=[];
 for(let i=0;i<=N;i++){const z=CL-W+2*W*i/N,xa=xaf(z,6);rows.push([[xa,hr,z],[XT+.02,ht,z]])}
 const push=v=>{const p=alongZ?[v[2],v[1],v[0]]:v;pos.push(p[0],p[1],p[2]);return pos.length/3-1};
 const ids=rows.map(r=>r.map(push));
 for(let i=0;i<N;i++){const a=ids[i][0],b=ids[i][1],c=ids[i+1][0],d=ids[i+1][1];idx.push(a,b,c,b,d,c)}
 [0,N].forEach(i=>{const r=rows[i],b0=push([r[0][0],hr-.01,r[0][2]]),b1=push([r[1][0],hr-.01,r[1][2]]),t=ids[i];idx.push(t[0],t[1],b1,t[0],b1,b0)});
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
 const m=new T.Mesh(g,M(0x9b9da3,{side:T.DoubleSide}));m.scale.set(sx,1,sz);m.receiveShadow=true;scene.add(m)}
[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(a=>{island(0,.09,0x9b9da3,a[0],a[1]);island(.35,.10,0x7bbf52,a[0],a[1]);ramp(false,a[0],a[1]);ramp(true,a[0],a[1]);
 // 两条人行道在转角处连成一体：各自从缓坡终点起一直通到远处，转角处重叠成平台
 const ln=300-XT,mid=(300+XT)/2,W2=2*WS;bx(W2,.031,ln,0x9b9da3,a[0]*CL,.1055,a[1]*mid);bx(ln,.03,W2,0x9b9da3,a[0]*mid,.105,a[1]*CL)});
// 中央绿化隔离带
[-1,1].forEach(sg=>{const len=150,c=sg*(hw+6+len/2);
 box(2,.09,len,0x9b9da3,0,.045,c);box(1.3,.1,len,0x6fae4a,0,.05,c);
 box(len,.09,2,0x9b9da3,c,.045,0);box(len,.1,1.3,0x6fae4a,c,.05,0)});
// 标线
for(let d=hw+9;d<150;d+=6)[-1,1].forEach(sg=>[-4.5,4.5].forEach(o=>{box(.15,.02,3,WH,o,.06,sg*(d+1.5));box(3,.02,.15,WH,sg*(d+1.5),.06,o)}));
// 自行车道线：进口方向离路口 15 米内为虚线，更远为实线；出口方向（过了路口）一开始就是实线
[[8,-1],[-8,1]].forEach(q=>{const o=q[0],a=q[1];
 for(let d=hw+8;d<hw+22;d+=3)box(.15,.02,1.5,WH,o,.06,a*(d+.75));
 let l=150-(hw+22);box(.15,.02,l,WH,o,.06,a*(hw+22+l/2));
 l=150-(hw+5.5);box(.15,.02,l,WH,o,.06,-a*(hw+5.5+l/2))});
[[-8,-1],[8,1]].forEach(q=>{const o=q[0],a=q[1];
 for(let d=hw+8;d<hw+22;d+=3)box(1.5,.02,.15,WH,a*(d+.75),.06,o);
 let l=150-(hw+22);box(l,.02,.15,WH,a*(hw+22+l/2),.06,o);
 l=150-(hw+5.5);box(l,.02,.15,WH,-a*(hw+5.5+l/2),.06,o)});
// 停车线：离人行横道 2 米（真实约 1.5–2 米），稍微过线也不会压到人行横道
box(8.5,.02,.5,WH,5.25,.06,-(hw+7.75));box(8.5,.02,.5,WH,-5.25,.06,hw+7.75);
box(.5,.02,8.5,WH,-(hw+7.75),.06,-5.25);box(.5,.02,8.5,WH,hw+7.75,.06,5.25);
for(let i=-9;i<=9;i++){box(.6,.02,3.5,WH,i,.06,-(hw+3.75));box(.6,.02,3.5,WH,i,.06,hw+3.75);
 box(3.5,.02,.6,WH,hw+3.75,.06,i);box(3.5,.02,.6,WH,-(hw+3.75),.06,i)}
// 车道箭头（内侧车道：直行＋左转；外侧车道：直行＋右转）
function arrowTex(side){const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');x.fillStyle=x.strokeStyle='#f6f6f6';x.lineWidth=9;
 x.beginPath();x.moveTo(32,124);x.lineTo(32,36);x.stroke();x.beginPath();x.moveTo(32,6);x.lineTo(12,38);x.lineTo(52,38);x.fill();
 x.save();if(side<0){x.translate(64,0);x.scale(-1,1)}x.beginPath();x.moveTo(32,92);x.quadraticCurveTo(32,66,50,60);x.stroke();
 x.beginPath();x.moveTo(62,58);x.lineTo(48,46);x.lineTo(46,72);x.fill();x.restore();return new T.CanvasTexture(c)}
const arrL=arrowTex(-1),arrR=arrowTex(1);
const bikeTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.strokeStyle='#f6f6f6';x.lineWidth=5;
 [[32,16],[32,48]].forEach(a=>{x.beginPath();x.arc(a[0],a[1],11,0,7);x.stroke()});x.beginPath();x.moveTo(32,48);x.lineTo(32,30);x.lineTo(32,16);x.moveTo(22,19);x.lineTo(42,19);x.stroke();return new T.CanvasTexture(c)})();
function arrows(rot){const g=new T.Group();
 [[-2.75,arrL],[-6.25,arrR]].forEach(a=>[-(hw+13),-(hw+32)].forEach(z=>{const p=mesh(new T.PlaneGeometry(1.7,3.4),new T.MeshBasicMaterial({map:a[1],transparent:true}),0,0,0);p.rotation.x=-Math.PI/2;
  const h=new T.Group();h.add(p);h.position.set(a[0],.07,z);h.rotation.y=Math.PI;g.add(h)}));
 {const p=mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:bikeTex,transparent:true}),0,0,0);p.rotation.x=-Math.PI/2;const h=new T.Group();h.add(p);h.position.set(-8.75,.07,-(hw+38));h.rotation.y=Math.PI;g.add(h)}
 g.rotation.y=rot;scene.add(g)}
[0,Math.PI,-Math.PI/2,Math.PI/2].forEach(arrows);
// 信号灯（参照实拍）：路右侧／路左侧为悬臂式，隔离带为杆顶灯头＋“靠右行驶”牌＋黄黑警示板
const YEL=0xe8aa1d,GRY=0x7d838c;
const signTex=txt=>cv(256,56,(x,w,h)=>{x.fillStyle='#0f6b3a';x.fillRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=3;x.strokeRect(3,3,w-6,h-6);x.fillStyle='#fff';x.font='bold 28px sans-serif';x.textAlign='center';x.fillText(txt,128,38)});
// 白底黑边的标准标志牌（圆角），f 在里面画图案
const rrect=(x,a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
const regSign=(w,h,f)=>cv(w,h,(x)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.strokeStyle='#999';x.lineWidth=2;rrect(x,1,1,w-2,h-2,w*.06);x.stroke();
 x.strokeStyle='#111';x.lineWidth=w*.035;rrect(x,w*.05,w*.05,w*.9,h-w*.1,w*.05);x.stroke();x.fillStyle='#111';f(x,w,h)});
// 靠右行驶（中央隔离带）：左上是隔离带（盾形），箭头从下面弯到右上
const keepTex=regSign(160,200,(x)=>{x.beginPath();x.moveTo(30,38);x.lineTo(78,38);x.lineTo(78,78);x.bezierCurveTo(78,104,62,116,54,116);x.bezierCurveTo(46,116,30,104,30,78);x.closePath();x.fill();
 x.lineWidth=22;x.lineCap='butt';x.beginPath();x.moveTo(102,182);x.lineTo(102,150);x.bezierCurveTo(102,120,124,112,124,86);x.lineTo(124,56);x.stroke();
 x.beginPath();x.moveTo(124,18);x.lineTo(148,60);x.lineTo(100,60);x.closePath();x.fill()});
// 限速牌 MAXIMUM 60
const maxTex=regSign(240,300,(x,w)=>{x.textAlign='center';x.textBaseline='alphabetic';x.font='bold 46px Arial,Helvetica,sans-serif';x.save();x.translate(w/2,80);x.scale(.8,1);x.fillText('MAXIMUM',0,0);x.restore();
 x.font='bold 190px Arial,Helvetica,sans-serif';x.save();x.translate(w/2,262);x.scale(.86,1);x.fillText('60',0,0);x.restore()});
// 路边立一块限速牌：(x,z) 是路线坐标，牌子朝向 -x 方向开来的车（从路口往 +x 开的车看得到）
function speedSign(x,z){const g=new T.Group();g.add(mesh(new T.CylinderGeometry(.05,.05,2.9,8),M(GRY),0,1.45,0));
 const f=mesh(new T.PlaneGeometry(.75,.94),new T.MeshBasicMaterial({map:maxTex}),.06,2.35,0);f.rotation.y=Math.PI/2;g.add(f);
 const b=mesh(new T.PlaneGeometry(.75,.94),M(GRY),.05,2.35,0);b.rotation.y=-Math.PI/2;g.add(b);g.position.set(-x,0,z);scene.add(g)}
speedSign(40,-11.2);      // 右转进去以后大约 30 米
const hazTex=cv(64,128,(x)=>{x.fillStyle='#f2c230';x.fillRect(0,0,64,128);x.fillStyle='#111';for(let k=-4;k<10;k++){x.beginPath();x.moveTo(0,k*20);x.lineTo(64,k*20-30);x.lineTo(64,k*20-10);x.lineTo(0,k*20+20);x.fill()}});
const arrTex=d=>cv(64,64,(x,w,h)=>{x.fillStyle='#15171b';x.fillRect(0,0,w,h);x.strokeStyle=x.fillStyle='#1f4a26';x.lineWidth=7;x.beginPath();x.moveTo(d<0?50:14,32);x.lineTo(d<0?20:44,32);x.stroke();x.beginPath();
 if(d<0){x.moveTo(10,32);x.lineTo(28,16);x.lineTo(28,48)}else{x.moveTo(54,32);x.lineTo(36,16);x.lineTo(36,48)}x.fill()});
const sgL=arrTex(-1),sgR=arrTex(1);
// 亮着的方向箭头（绿色／黄色），给有左转箭头灯的项目用
const arrLit=(d,col)=>cv(64,64,(x,w,h)=>{x.fillStyle='#15171b';x.fillRect(0,0,w,h);x.strokeStyle=x.fillStyle=col;x.lineWidth=7;x.beginPath();x.moveTo(d<0?50:14,32);x.lineTo(d<0?20:44,32);x.stroke();x.beginPath();
 if(d<0){x.moveTo(10,32);x.lineTo(28,16);x.lineTo(28,48)}else{x.moveTo(54,32);x.lineTo(36,16);x.lineTo(36,48)}x.fill()});
let ARR=null;const LARR=[];      // 所有左转箭头灯
function setArrow(st){if(!ARR)ARR={g:new T.MeshBasicMaterial({map:arrLit(-1,'#2ee66b')}),y:new T.MeshBasicMaterial({map:arrLit(-1,'#ffc21a')}),off:new T.MeshBasicMaterial({map:sgL})};LARR.forEach(m=>m.material=ARR[st]||ARR.off)}
// 四格灯头（参照实拍图）：红、黄、圆形绿，最下面是方向箭头灯；本场景只亮圆形绿灯
const HEADS=[],CHEADS=[],SIGK=1.6,HY=6.41-(SIGK-1)*1.075;      // 信号灯头放大 1.6 倍（手机上远处的灯也看得清），顶部高度不变
function sigHead(on,ar){const g=new T.Group(),lm={};if(on==='g')HEADS.push(lm);else CHEADS.push(lm);g.add(mesh(new T.BoxGeometry(.66,2.15,.46),M(YEL),0,0,0));
 const visor=y=>g.add(mesh(new T.BoxGeometry(.44,.05,.3),M(0x15171b),0,y+.24,-.3));
 [[.78,'r',0xff2b2b,0x4a1717],[.26,'y',0xffc21a,0x4a3d0c],[-.26,'g',0x2ee66b,0x1c3a22]].forEach(a=>{
  const d=mesh(new T.CircleGeometry(.23,16),BM(0x15171b),0,a[0],-.235);d.rotation.y=Math.PI;g.add(d);
  const b=mesh(new T.SphereGeometry(.18,12,8),BM(a[1]===on?a[2]:a[3]),0,a[0],-.24);g.add(b);lm[a[1]]={m:b,on:BM(a[2]),off:BM(a[3])};visor(a[0])});
 const al=mesh(new T.CircleGeometry(.23,20),new T.MeshBasicMaterial({map:ar<0?sgL:sgR}),0,-.78,-.236);al.rotation.y=Math.PI;g.add(al);visor(-.78);if(ar<0&&on==='g')LARR.push(al);
 g.scale.setScalar(SIGK);return g}
// 行人灯：上面手掌、下面白色人形；M＝和本方同相位（走转入道路的人行横道），X＝和横向同相位
const PHEADS=[],PSIG={M:'walk',X:'hand'};let PTEX=null;
function pHead(ph){const g=new T.Group();g.add(mesh(new T.BoxGeometry(.66,1.6,.3),M(YEL),0,0,0));
 if(!PTEX)PTEX={hand:new T.MeshBasicMaterial({map:icon('hand')}),handd:new T.MeshBasicMaterial({map:icon('handd')}),walk:new T.MeshBasicMaterial({map:icon('walk')}),walkd:new T.MeshBasicMaterial({map:icon('walkd')})};
 const h=mesh(new T.PlaneGeometry(.44,.64),PTEX.handd,0,.4,.16),w=mesh(new T.PlaneGeometry(.44,.64),PTEX.walk,0,-.4,.16);g.add(h,w);PHEADS.push({ph,h,w});return g}
function setPedSig(ph,st){PSIG[ph]=st;pedSigTick(0)}
function pedSigTick(ts){const on=Math.sin(ts/1000*Math.PI*2*1.6)>0;      // 闪烁：每秒约 1.6 次
 PHEADS.forEach(p=>{const st=PSIG[p.ph];p.h.material=st==='hand'?PTEX.hand:PTEX.handd;p.w.material=(st==='walk'||(st==='flash'&&on))?PTEX.walk:PTEX.walkd})}
function approach(rot,on){const g=new T.Group(),px=hw+2.65,pz=hw+7,y0=6.6,main=Math.abs(Math.sin(rot))<.5;
 const pole=(x,z,h)=>g.add(mesh(new T.CylinderGeometry(.13,.17,h,10),M(GRY),x,h/2,z));
 const AL=.17,ey=l=>y0+l*Math.tan(AL);
 const arm=(x,z,len,dir)=>{const a=mesh(new T.CylinderGeometry(.09,.09,len/Math.cos(AL),8),M(GRY),x+dir*len/2,ey(len/2),z);a.rotation.z=dir*(AL-Math.PI/2);g.add(a);
  const b=mesh(new T.CylinderGeometry(.06,.06,2.31,6),M(GRY),x+dir*.8,y0-.57,z);b.rotation.z=-dir*.766;g.add(b)};
 // 路右侧（人行道边缘）：悬臂＋灯头＋路名牌＋两个行人灯
 pole(-px,pz,7.2);arm(-px,pz,5.9,1);
 let h=sigHead(on,1);h.position.set(-px+5.6,HY,pz-.3);g.add(h);
 const sg=mesh(new T.PlaneGeometry(2.3,.5),new T.MeshBasicMaterial({map:signTex('Passed G2 Ave')}),-px+2,ey(2)-.4,pz-.06);sg.rotation.y=Math.PI;g.add(sg);
 let q=pHead(main?'X':'M');q.position.set(-px+.3,2.7,pz);q.rotation.y=Math.PI/2;g.add(q);
 q=pHead(main?'M':'X');q.position.set(-px,2.7,pz-.3);q.rotation.y=Math.PI;g.add(q);
 // 路左侧：悬臂＋灯头
 pole(px,pz,7.2);arm(px,pz,5.4,-1);
 h=sigHead(on,-1);h.position.set(px-5.1,HY,pz-.3);g.add(h);
 // 中央隔离带：杆顶灯头＋靠右行驶牌＋黄黑警示板
 pole(0,pz,7.5);
 h=sigHead(on,-1);h.position.set(0,HY,pz-.35);g.add(h);
 const kr=mesh(new T.PlaneGeometry(.6,.75),new T.MeshBasicMaterial({map:keepTex}),0,1.9,pz-.16);kr.rotation.y=Math.PI;g.add(kr);
 const hz=mesh(new T.PlaneGeometry(.5,1.1),new T.MeshBasicMaterial({map:hazTex}),0,.75,pz-.16);hz.rotation.y=Math.PI;g.add(hz);
 g.rotation.y=rot;scene.add(g)}
approach(0,'g');approach(Math.PI,'g');approach(-Math.PI/2,'r');approach(Math.PI/2,'r');
// 行人灯
function icon(type){const c=document.createElement('canvas');c.width=64;c.height=96;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,64,96);
 if(type==='walk'||type==='walkd'){x.fillStyle=type==='walk'?'#fff':'#2a2c30';x.beginPath();x.arc(32,24,8,0,7);x.fill();x.fillRect(26,34,12,26);x.fillRect(22,60,8,26);x.fillRect(34,60,8,26);x.fillRect(16,36,8,22);x.fillRect(40,36,8,22)}
 else{x.fillStyle=type==='handd'?'#4d1b1b':'#ff3b30';x.fillRect(18,44,28,34);[[16,22],[24,14],[32,14],[40,22]].forEach(f=>x.fillRect(f[0],f[1],6,32));x.fillRect(8,50,12,8)}
 return new T.CanvasTexture(c)}
