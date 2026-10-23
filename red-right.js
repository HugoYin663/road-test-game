// ============================================================
// red-right.js — 项目：红灯右转（完全停车 → 被左侧 SUV 挡住视线 → 慢慢前移观察左方 → 找空档右转）
// ============================================================
// 路线：和绿灯右转同一条右转路线
const bz=t=>{const u=1-t,P=[[6.25,-30],[6.25,-14],[8,-6.25],[16,-6.25]];return[0,1].map(k=>u*u*u*P[0][k]+3*u*u*t*P[1][k]+3*u*t*t*P[2][k]+t*t*t*P[3][k])};
const myPts=[[6.25,-110],[6.25,-30],...Array.from({length:40},(_,i)=>bz((i+1)/40)),[70,-6.25]];
const myLen=myPts.reduce((a,p,i)=>i?a+Math.hypot(p[0]-myPts[i-1][0],p[1]-myPts[i-1][1]):0,0);
const myPath=path(myPts);
let cs=0,ce=0;for(let i=1;i<=41;i++){ce+=Math.hypot(myPts[i][0]-myPts[i-1][0],myPts[i][1]-myPts[i-1][1]);if(i===1)cs=ce}
const AB=5,U0=60,UEND=ce+14;
const uAt=zz=>{for(let u=0;u<myLen;u+=.05)if(myPath(u)[1]>=zz)return u;return myLen};
const uS=uAt(-19.3)-1.7,      // 停车线后的停车位置（车头离停车线约 0.6 米）
      uC=uAt(-17.7);          // 慢慢前移的最远位置：车头到人行横道边
const front=u=>{const a=myPath(u);return[a[0]+2.35*Math.sin(a[2]),a[1]+2.35*Math.cos(a[2])]};
const mine=car(C[0]);
let R=null,round=0,playing=false,gt=0,view=1,yawD=0,az=2.4,el=.85,drag=false,lx=0,ly=0,STD='g2';
const live=[];
// ---------- 场景里固定的车 ----------
// 左边车道等红灯的 SUV：又高又宽，停过了停车线一点（没到人行横道），挡住你看左边的视线
const SUV=car(0x3b4148);SUV.scale.set(1.12,1.5,1.08);place(SUV,2.75,-19.05,0);
place(car(C[6]),2.75,-26.5,0);
// 对面、同向直行方向也是红灯：车都停在各自停车线后
[[-2.75,19.6],[-6.25,19.6],[-6.25,26.5]].forEach((a,i)=>place(car(C[[1,5,3][i]]),a[0],a[1],Math.PI));
// 横向另一方向（从右往左开）的车：只作背景
const bgFlows=[0,70,140].map((o,i)=>({c:car(C[[2,7,4][i]]),p:path([[150,6.25],[-150,6.25]]),off:o,v:11}));
// ---------- 横向直行车（从左往右，两条车道：内道 z=-2.75，外道/右道 z=-6.25）----------
// sched：每辆车经过路口中线（x=0）的时间；先是连续的车流，然后出现空档
function makeTraffic(){const L=[],v0=()=>11+Math.random()*2;let t=-2;
 const Tg=10+Math.random()*5;                                   // 车流逐渐变少、开始出现空档的时间
 while(t<Tg){t+=1.4+Math.random()*1.3;L.push({lane:Math.random()<.55?-6.25:-2.75,tc:t,v:v0()})}
 const leftOnly=Math.random()<.45;                              // 空档中只在左道（内道）来一辆车：看着右道空了也不能转
 const gap=12+Math.random()*3;
 if(leftOnly)L.push({lane:-2.75,tc:t+3.2+Math.random()*1.5,v:v0()});
 t+=gap;for(let k=0;k<6;k++){t+=1.6+Math.random()*1.5;L.push({lane:Math.random()<.5?-6.25:-2.75,tc:t,v:v0()})}
 return{list:L.map(s=>Object.assign(s,{c:car(C[1+Math.random()*8|0]),x:-s.v*s.tc,cv:s.v})),Tg,gap,leftOnly}}
// ---------- 过街行人（走你车头前的人行横道，横向绿灯）和横向自行车道里的自行车 ----------
const pedD=(p,t)=>{if(p.dd!=null)return p.dd;let d=0;const g=p.sg;for(let i=0;i<g.length;i++){const a=g[i].t,b=i+1<g.length?g[i+1].t:1e9;if(t<=a)break;d+=g[i].v*(Math.min(t,b)-a)}return d};
const pedSeg=(p,t)=>{let c=p.sg[0];for(const g of p.sg)if(t>=g.t)c=g;return c};
const pedPos=(p,t)=>p.path(Math.min(p.off+pedD(p,t),p.len-.06));
function newRun(inc){live.forEach(o=>scene.remove(o));live.length=0;if(inc)round++;
 const TR=makeTraffic();TR.list.forEach(s=>live.push(s.c));
 const peds=[],P=a=>a[Math.random()*a.length|0];
 // 行人：0–2 个，从左边或右边走来，大约在车流变少、你想走的时候正好走到你车头前
 const np=P([0,1,1,2]);for(let i=0;i<np;i++){const fromL=Math.random()<.6,v=1.25+Math.random()*.3,o=ped(PCOL[Math.random()*5|0]);live.push(o);
  const pts=fromL?[[-30,-13.8+i*.5],[13.25,-13.8+i*.5],[13.25,-60]]:[[13.25,-40],[13.25,-13.6-i*.5],[-30,-13.6-i*.5]];
  const pp={k:'X',o,path:path(pts),len:120,sg:[{t:0,v}],off:0},tMeet=TR.Tg+Math.random()*2.5;      // 走到你车头前（x≈6.5）的时间
  let dTo=0;for(let d=0;d<120;d+=.2){const q=pp.path(d);if(Math.abs(q[1]+13.7)<.8&&Math.abs(q[0]-6.5)<.25){dTo=d;break}}pp.off=Math.max(0,dTo-v*tMeet);peds.push(pp)}
 // 自行车：横向自行车道（z=-8.75）里从左边骑过来
 if(Math.random()<.4){const o=cyclist(PCOL[Math.random()*5|0]);live.push(o);const v=5+Math.random(),tMeet=TR.Tg+.5+Math.random()*3;
  peds.push({k:'K',o,bike:true,path:path([[-150,-8.75],[150,-8.75]]),len:300,sg:[{t:0,v}],off:Math.max(0,150+8-v*tMeet)})}
 R={t:0,u:U0,v:7,mode:'drive',over:false,peds,TR,ev:[],sig:false,sigChk:false,lookT:-1,scT:-1,yaw:0,pit:0,full:false,stopAt:null,lastLook:null,lastScan:null,stT:0,hitT:null};
 {const fc=car(C[Math.random()*9|0]);live.push(fc);R.fol={car:fc,u:R.u-16,v:R.v}}
 HEADS.forEach(lm=>{for(const k in lm)lm[k].m.material=k==='r'?lm[k].on:lm[k].off});CHEADS.forEach(lm=>{for(const k in lm)lm[k].m.material=k==='g'?lm[k].on:lm[k].off});
 setPedSig('M','hand');setPedSig('X','walk');
 gt=0;mk();$('sp').textContent='0'}
function mk(){document.querySelectorAll('.b').forEach(b=>b.classList.toggle('on',b.dataset.m==='sig'?!!R.sig:b.dataset.m===R.mode))}
function flash(t){const f=$('fl');f.textContent=t;f.style.opacity=1;clearTimeout(flash.h);flash.h=setTimeout(()=>f.style.opacity=0,1800)}
// ---------- 提示 ----------
const TXT={
 noStop:["没有完全停车","红灯右转前，必须在停车线后完全停住（车速为 0），然后再观察、再转。慢慢滑过停车线不算停车，路考直接不合格。"],
 yieldX:["没有让行横向直行车","你转弯时，横向有直行车正开过来或已经在路口里。红灯右转要让横向的车：两条车道都要看，左道（内道）的车虽然不会和你进同一条车道，也不能和它同时进入路口。要等到明显的空档再转。"],
 yieldP:["没有让行过街行人","你车头前的人行横道上有行人在过街（横向是绿灯，他们有路权），你就开了过去。要等行人走过你的车头、离开你的路线再走。"],
 yieldK:["没有让行自行车","横向自行车道里有自行车从左边骑过来，你转弯时挡住了它的路。自行车和直行车一样，要让它先过。"],
 hitP:["撞到了行人","你的车撞到了正在过马路的行人。"],
 hitB:["撞到了自行车","你的车撞到了横向骑过来的自行车。"],
 noScan:["转弯前没有观察左方","红灯右转前，最危险的车和人都从左边来。车头进入路口前，要按“观察路口”看左边（两条车道和人行横道），确认没有车和人再走。"],
 noCreep:["视线被挡时没有慢慢往前观察","左边停着一辆高大的 SUV，挡住了你看横向车流的视线。在停车线停稳后，应该按“行驶”慢慢往前挪（随时准备按停车），挪到能看清左边的位置再按“观察路口”，不能只在 SUV 后面看一眼就转。"],
 noRR:["转弯前没有观察右后方（G 标准）","按 G 路考的要求，红灯右转时，车头进入右侧人行横道之前要做一次右后观察，确认右后方没有自行车或行人。"],
 stopOver:["停车越过了停车线","红灯右转第一次停车，应该停在停车线后面。你停过了线（还没到人行横道），完全停车是做到了，但位置不对。"],
 stopXw:["第一次停车就停在了人行横道上","红灯右转应该先在停车线后停稳，再慢慢往前挪出来观察。你一次就停到了人行横道上，完全停车是做到了，但位置不对；如果这时有行人过街，就是挡住行人的严重错误。"],
 blockP:["停车挡住了过街行人","你的车停在人行横道上，挡住了正在过街的行人，他们只能绕着你的车走。没有行人时，车头可以挪到人行横道上观察；有行人时，车头要停在人行横道前。"],
 sig:["转弯前没有打右转灯","右转前一定要打右转灯，一般在停车线前约 30 米就打开。"],
 sigL:["右转灯打得太晚","离停车线不到 15 米才打右转灯，后车和行人来不及反应。"]};
const SER=['blockP','noStop','yieldX','yieldP','yieldK','hitP','hitB','noScan'];
function snap(){const c=document.createElement('canvas');c.width=280;c.height=200;const x=c.getContext('2d'),X=a=>(a+20)*4.5,Y=a=>(18-a)*4.5;
 x.fillStyle='#7bbf52';x.fillRect(0,0,280,200);x.fillStyle='#6c6c75';x.fillRect(X(-9.5),0,85.5,200);x.fillRect(0,Y(9.5),280,85.5);
 x.fillStyle='#f3f3f3';for(let i=0;i<19;i++){x.fillRect(X(11.5),Y(-9.5+i+.5),15.75,2.25);x.fillRect(X(-9.5+i),Y(-11.5),2.25,15.75)}
 const cr=(q,col,l)=>{x.save();x.translate(X(q[0]),Y(q[1]));x.rotate(q[2]);x.fillStyle=col;x.fillRect(-4.3,-(l||10),8.6,2*(l||10));x.restore()};
 R.peds.forEach(p=>{const a=pedPos(p,R.t);x.fillStyle='#ff8a1f';x.beginPath();x.arc(X(a[0]),Y(a[1]),4,0,7);x.fill()});
 R.TR.list.forEach(s=>{if(Math.abs(s.x)<40)cr([s.x,s.lane,Math.PI/2],'#eceff1')});cr([2.75,-19.05,0],'#3b4148',11);cr(myPath(R.u),'#2e6fd6');return c.toDataURL()}
function ev(key,tk){if(R.ev.some(e=>e.key===key))return;const t=TXT[tk||key];R.ev.push({key,tk:tk||key,title:t[0],text:t[1],img:snap()});flash(t[0])}
// 线段（视线）是否穿过一个长方形（SUV 的车身）
function hitBox(x0,z0,x1,z1,xa,xb,za,zb){let t0=0,t1=1;const dx=x1-x0,dz=z1-z0;
 for(const [p,d,lo,hi] of [[x0,dx,xa,xb],[z0,dz,za,zb]]){if(Math.abs(d)<1e-9){if(p<lo||p>hi)return false}else{let a=(lo-p)/d,b=(hi-p)/d;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)return false}}return true}
// ---------- 操作 ----------
function cmd(m){if(!playing||R.over||R.u>=ce+1)return;
 if(m==='sig'){R.sig=!R.sig;$('sg').style.display=R.sig?'block':'none';if(R.sig){tick(true);if(R.sigU==null)R.sigU=R.u}mk();return}
 if(m==='look'){if(R.lookT>=0)return;R.scT=-1;R.scRel=null;yawD=0;R.lookT=0;return}
 if(m==='scan'){R.lookT=-1;R.pit=0;R.scT=0;R.scRel=null;yawD=0;R.scQ=R.u>=uS-3;return}      // 随时可以重新看路口（会打断正在做的右后观察）
 if(m===R.mode)return;
 if(m==='stop'){const dA=uS-R.u;if(R.u<uS-.2&&dA>R.v*R.v/(2*AB)+.2){R.stopT=uS;R.stopA=Math.max(AB,R.v*R.v/(2*Math.max(.1,dA)))}else{R.stopA=7;R.stopT=R.u+R.v*R.v/14}}
 if(m==='turn'){if(R.v<.05)R.goAt=R.t;if(front(R.u)[1]>=-14.6)R.goN=true}      // 已经挪出来看清了再按行驶：正常起步转弯
 if(m==='turn'&&!R.turnU)R.turnU=R.u;                      // 从哪里开始转
 R.mode=m;mk()}
function pickTgt(){return null}
// ---------- 每一帧 ----------
function step(dt){if(!playing||R.over)return;R.t+=dt;gt=R.t;let v=R.v,u=R.u,m=R.mode;
 if(m==='drive'){const vt=u<uS-18?7:Math.max(2.4,7-4.6*(u-(uS-18))/18);v=v>vt?Math.max(vt,v-4*dt):Math.min(vt,v+2*dt)}    // 不停车的话会慢慢滑过停车线
 else if(m==='stop'){const dS=R.stopT-u;if(dS>.05)v=Math.min(v,Math.sqrt(2*R.stopA*dS));else v=0}
  else if(m==='turn'){const fz0=front(u)[1],cr=fz0<-13&&!R.goN;const vt=cr?1.3:4.2+2.8*ss(ce-6,ce+14,u);v=Math.min(vt,v+(cr?1.5:2.2)*dt)}      // 车头进横向道路之前慢慢往前挪（creep），随时可以按停车
 if(v<.05&&m==='stop'){v=0;R.stT+=dt;if(R.stopAt==null||R.stT<dt*1.5)R.stopAt=R.t;if(!R.full&&front(u)[1]<-11.5){R.full=true;R.fullT=R.t;const fz=front(u)[1];if(fz>=-15.1)ev('stopXw');else if(fz>-17)ev('stopOver')}}      // 第一次完全停车：停在哪里都算停了，但停过线、停在人行横道上要扣分else R.stT=0;      // 车头在停车线后完全停住
 u+=v*dt;R.v=v;R.u=u;
 const a=myPath(u),f=front(u);
 // 没有完全停车就过了停车线
 if(!R.full&&!R.ns&&f[1]>-11.5){R.ns=true;ev('noStop')}      // 一直没停就开进了横向道路
 // 停在人行横道上
 // 开始转弯（车头进入横向道路）：检查观察和让行
 if(!R.entered&&f[1]>-9.5){R.entered=true;
  if(!(R.lastScan!=null&&R.lastScan>=(R.fullT==null?0:R.fullT)))ev('noScan');
  else if(R.full&&!(R.scanFront>=-14.4))ev('noCreep');      // 车头要挪进人行横道约 1 米，才看得清 SUV 后面的远处      // 看过左边，但只是在 SUV 后面看的，没有挪出来看
}
 // G 标准：车头进入右侧人行横道之前，做过右后观察就算有效（真有行人还来得及停）
 if(STD==='g'&&!R.rrc&&f[0]>=11.5&&f[1]>-12){R.rrc=true;if(!(R.lastLook!=null&&R.lastLook>=(R.fullT==null?0:R.fullT)))ev('noRR')}
 if(R.entered&&a[0]<14&&v>.3){
  R.TR.list.forEach(s=>{const tArr=(a[0]-s.x)/Math.max(1,s.cv);if(s.x<a[0]+1&&(s.x>-14||tArr<3.2))ev('yieldX')});      // 横向车还没开过你的位置，并且已经在路口里或 3 秒内就到
  R.peds.forEach(p=>{if(p.hit)return;const c=pedPos(p,R.t);if(p.bike){if(Math.abs(c[1]+8.75)<.5&&c[0]>a[0]-14&&c[0]<a[0]+1.5)ev('yieldK')}})}
 // 行人：在你车头前的人行横道上、离你的路线很近时你还在动
 if(v>.3&&f[1]>-15.6)R.peds.forEach(p=>{if(p.bike||p.hit)return;const c=pedPos(p,R.t);if(c[1]>-15&&c[1]<-11.5&&Math.abs(c[0]-f[0])<3.2)ev('yieldP')});
 // 撞到行人或自行车：倒地，急停
 R.peds.forEach(p=>{if(p.hit)return;const c=pedPos(p,R.t),dx=c[0]-a[0],dz=c[1]-a[1],fw=dx*Math.sin(a[2])+dz*Math.cos(a[2]),lat=dx*Math.cos(a[2])-dz*Math.sin(a[2]);
  if(Math.abs(fw)<2.45&&Math.abs(lat)<1.05&&v>.4){p.hit=true;p.dd=pedD(p,R.t);p.sg=[{t:0,v:0}];ev(p.bike?'hitB':'hitP');R.mode=m='stop';R.stopA=7;R.stopT=u+v*v/14;R.hitT=R.t;mk()}});
 if(R.hitT!=null&&R.t-R.hitT>3){finish();return}
 // 行人遇到挡在人行横道上的车，会停下等
 R.peds.forEach(p=>{if(p.bike||p.hit)return;const n=p.path(p.off+pedD(p,R.t)+1.6),dx=n[0]-a[0],dz=n[1]-a[1],blk=Math.abs(dx*Math.sin(a[2])+dz*Math.cos(a[2]))<2.6&&Math.abs(dx*Math.cos(a[2])-dz*Math.sin(a[2]))<1.3;
  if(blk&&!p.det){p.bt=(p.bt||0)+dt;if(p.bt>.8&&!R.ev.some(e=>e.key==='blockP')){R.ev=R.ev.filter(e=>e.key!=='stopXw');ev('blockP')}if(p.bt>1.6)p.det=true}      /* 只有真的挡住了过街的行人才算错；没人过街时停在人行横道上观察没问题 */if(p.det){const fz=f[1]+1.4,cz=p.path(p.off+pedD(p,R.t))[1];p.oz=(p.oz||0)+Math.max(-dt,Math.min(dt,(Math.abs(n[0]-f[0])<4?fz-cz:0)-(p.oz||0)))}   // 等一会儿，再从车头前绕过去
  if((blk&&!p.det)||p.dd!=null){if(p.dd==null)p.dd=pedD(p,R.t);p.wv=p.wv||p.sg[0].v;p.dd+=(blk&&!p.det?0:p.wv)*dt}});
 // 横向车：按时间表开，前面有车或你的车挡在车道上就减速
 R.TR.list.forEach(s=>{let vt=s.v;R.TR.list.forEach(o=>{if(o!==s&&o.lane===s.lane&&o.x>s.x&&o.x-s.x<14)vt=Math.min(vt,Math.max(0,(o.x-s.x-7)*1.5))});
  const g=a[0]-s.x;if(Math.abs(a[1]-s.lane)<2.6&&g>0&&g<28){vt=Math.min(vt,Math.max(0,(g-7)*1.2));if(g<18&&!R.honked){R.honked=true;honk()}}
  s.cv=s.cv>vt?Math.max(vt,s.cv-7*dt):Math.min(vt,s.cv+2.5*dt);s.x+=s.cv*dt});
 bgFlows.forEach(f=>{f.off+=f.v*dt});
 // 转向灯检查
 if(!R.sigChk&&f[1]>-17){R.sigChk=true;if(!R.sig)ev('sig');else if(R.sigU>uS-12)ev('sig','sigL')}
 if(R.sig&&u>ce+2){R.sig=false;$('sg').style.display='none';mk()}
 // 观察路口：已经停在线前，左-右-左里重点看左边（看久一点）
 if(R.scT>=0){R.scT+=dt;const sT=R.scT;
  if(R.scQ){const ex=a[0]-.38,ez=a[1]-.2,see=(x,z)=>!hitBox(ex,ez,x,z,1.7,3.8,-21.7,-16.4);      // 从驾驶座看出去，视线有没有被左边的 SUV 挡住
   const busy=R.TR.list.some(s=>s.x<a[0]&&s.x>-70&&see(s.x,s.lane))||R.peds.some(p=>{const c=pedPos(p,R.t);return c[0]<a[0]&&c[0]>-30&&(p.bike||Math.abs(c[1]+13.8)<2)&&see(c[0],c[1])});   // 看得见的左边来车多，就多看一会儿；被挡住看不见，就很快转回来
   if(R.scRel==null&&sT>.8&&(!busy||sT>3.5))R.scRel=sT;const tg=R.scRel==null?-1.35:0;R.yaw+=(tg-R.yaw)*Math.min(1,dt*10);if(R.scRel!=null&&sT-R.scRel>.4){R.scT=-1;R.scRel=null;R.yaw=0}}
  else{const tg=sT<.55?-1.25:sT<1.25?1.05:sT<1.8?-1.25:0;R.yaw+=(tg-R.yaw)*Math.min(1,dt*10);if(sT>2.2){R.scT=-1;R.yaw=0}}
  if(sT>.3&&R.scT>=0){R.lastScan=R.t;R.scanFront=Math.max(R.scanFront==null?-99:R.scanFront,f[1])}}
 // 右后观察：中镜→右镜→右后盲区
 if(R.lookT>=0){R.lookT+=dt*1.4;const lt=R.lookT,k9=Math.min(1,dt*12);
  if(lt<.5){R.yaw+=(.45-R.yaw)*k9;R.pit+=(.22-R.pit)*k9}else if(lt<1){R.yaw+=(1-R.yaw)*k9;R.pit+=(-.15-R.pit)*k9}
  else{R.lastLook=R.t;R.pit+=(0-R.pit)*k9;if(lt<2){R.yaw+=(1.9-R.yaw)*Math.min(1,dt*12)}else{R.yaw+=(0-R.yaw)*Math.min(1,dt*14);if(lt>2.5){R.lookT=-1;R.yaw=0;R.pit=0}}}}
 // 后车跟着你
 {const fo=R.fol;const gap=u-fo.u-4.6;let vt=Math.max(0,Math.min(R.v+3,2.2*(gap-2.5)));if(myPath(fo.u)[1]>-19.6)vt=Math.min(vt,Math.sqrt(2*4*Math.max(0,uS-fo.u)));fo.v=fo.v>vt?Math.max(vt,fo.v-6*dt):Math.min(vt,fo.v+3*dt);fo.u=Math.min(fo.u+fo.v*dt,u-4.6)}
 if(u>=UEND||R.t>90)finish()}
function cardsHtml(list){return'<div class="cards">'+list.map(e=>`<div class="card"><img src="${e.img}"><b>${e.title}${SER.includes(e.tk)?'<span class="tag s">严重</span>':'<span class="tag">扣分项</span>'}</b><span>${e.text}</span></div>`).join('')+'</div>'}
function finish(){R.over=true;R.sig=false;$('sg').style.display='none';mk();const o=$('ov');let h;
 const turned=R.u>=ce;
 if(!R.ev.length)h=turned?'<h2>驾驶总结</h2><div class="st">★★★</div><p>完全停车、看清左边、找到空档再转，红灯右转处理得很好。</p>':'<h2>驾驶总结</h2><p>你一直没有转弯。红灯右转不是必须的，看不清或没有把握时可以等绿灯；但路考时考官通常希望你在安全的空档里完成右转。</p>';
 else h='<h2>驾驶总结</h2><p>这一趟有 '+R.ev.length+' 处需要注意：</p>'+cardsHtml(R.ev);
 o.innerHTML=`<div class="pn">${h}<br><button id="again">再来一次</button> <button id="home" style="background:#6b7280">回到首页</button></div>`;o.style.display='flex';
 $('again').onclick=()=>{o.style.display='none';newRun(true);playing=true};$('home').onclick=()=>{o.innerHTML=HOME;o.style.display='flex';bindHome()}}
// ================= 渲染循环 =================
let last=0,fovH=110;
function loop(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;step(dt);const t=R.t;
 R.TR.list.forEach(s=>{place(s.c,s.x,s.lane,Math.PI/2);s.c.visible=s.x>-160&&s.x<160});
 bgFlows.forEach(f=>{const q=f.p(f.off);place(f.c,q[0],q[1],q[2])});
 R.peds.forEach(p=>{const q=p.path(Math.min(p.off+pedD(p,t),p.len-.06));p.o.visible=true;place(p.o,q[0],q[1]+(p.oz||0),q[2],.1);
  if(p.hit){p.o.rotation.order='YXZ';if(p.bike){p.o.rotation.z=Math.min(1.45,(p.o.rotation.z||0)+.12);p.o.position.y=.15}else{p.o.rotation.x=Math.max(-1.45,(p.o.rotation.x||0)-.12);p.o.position.y=.2}return}
  const sp=p.bike?p.sg[0].v:(p.sg[0].v||1.3),s=Math.sin(t*(sp*5+2))*(.45+sp*.1),u=p.o.userData;
  if(p.bike){u.wh.forEach(w=>w.rotation.x=-t*sp/.36);u.l.rotation.x=-.3;u.r.rotation.x=-.3}else{u.l.rotation.x=s;u.r.rotation.x=-s;u.al.rotation.x=-s*.8;u.ar.rotation.x=s*.8}});
 pedSigTick(ts);
 if(R.fol){const fq=myPath(R.fol.u);place(R.fol.car,fq[0],fq[1],fq[2])}
 if(R.sig&&playing&&!R.over){const on=Math.sin(ts/1000*9.4)>0;$('sg').style.opacity=on?1:.15;if(on!==loop.sgOn){loop.sgOn=on;tick(on)}}
 const q=myPath(R.u);place(mine,q[0],q[1],q[2]);
 if(view===1){const h=q[2]+R.yaw+yawD,L=R.lookT>=0||R.scT>=0?14:10;cam.fov=Math.min(105,2*Math.atan(Math.tan(fovH*Math.PI/360)/cam.aspect)*180/Math.PI);cam.updateProjectionMatrix();const ox=.38*Math.cos(q[2]),oz=.38*Math.sin(q[2]),bx0=-q[0]+Math.sin(q[2])*.2,bz0=q[1]-Math.cos(q[2])*.2;cam.position.set(bx0+ox,1.25,bz0+oz);cam.lookAt(-q[0]-Math.sin(h)*L+ox,1.25+L*.05+R.pit*L,q[1]+Math.cos(h)*L+oz);
  cockpit.visible=true;cockpit.position.set(bx0,1.25,bz0);cockpit.rotation.y=-q[2];
  const dh=normA(q[2]-lastH)/Math.max(dt,.001);lastH=q[2];wheel.rotation.z+=((Math.max(-2.6,Math.min(2.6,dh*2.4)))-wheel.rotation.z)*Math.min(1,dt*10)}
 else{cockpit.visible=false;if(cam.fov!==62){cam.fov=62;cam.updateProjectionMatrix()}if(!drag)az+=dt*.05;const r=95;cam.position.set(Math.sin(az)*Math.cos(el)*r,Math.sin(el)*r,Math.cos(az)*Math.cos(el)*r);cam.lookAt(0,0,0)}
 $('sp').textContent=Math.round(R.v*3.6);if(cluster)cluster(Math.round(R.v*3.6));
 if(view===1&&((loop.fc=(loop.fc||0)+1)&1)===0){const m=MR[(loop.fc>>1)%MR.length],sa=ren.shadowMap.autoUpdate;cockpit.updateMatrixWorld(true);
  m.c.position.copy(cockpit.localToWorld(m.pos.clone()));m.c.lookAt(m.c.position.clone().add(m.dir.clone().transformDirection(cockpit.matrixWorld)));
  cockpit.visible=false;ren.shadowMap.autoUpdate=false;ren.setRenderTarget(m.rt);ren.render(scene,m.c);ren.setRenderTarget(null);ren.shadowMap.autoUpdate=sa;cockpit.visible=true}
 ren.render(scene,cam);requestAnimationFrame(loop)}
rs();newRun(false);setView(1);requestAnimationFrame(loop);
const HOME=$('ov').innerHTML;
function bindHome(){document.querySelectorAll('.md').forEach(b=>b.onclick=()=>{STD=b.dataset.std;$('ov').style.display='none';newRun(true);playing=true})}
bindHome();
$('hm').onclick=()=>{if(R)R.over=true;playing=false;const o=$('ov');o.innerHTML=HOME;o.style.display='flex';bindHome()};
