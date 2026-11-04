// ============================================================
// parallel.js — 项目：平行停车（停在参考车旁边约 1 米、后保险杠对齐 → R、回头看 → 慢慢倒、往右打到底 → 车身 45° 时回正 → 车头过了参考车后保险杠，往左打到底 → 和路缘平行时停 → D、停在车位中间 → P）
// ============================================================
const HOOD=buildHood({g:0,curbR:true,curbL:true,quiet:[[-30,12]]});
// 路边停着的车：参考车 A（你要停在它后面），后面的车 B，车位约 8 米长；再往前、往后也停着车
const PX=HRW-.2-LW.HW,PA=0,SPACE=8.0,PB=PA-LW.HL*2-SPACE;
const PARKS=[[PX,PA+12.5],[PX,PA],[PX,PB],[PX,PB-11.5]];
const PK_TXT={
 noSigR:["停车前没有打右转灯","平行停车之前：看后视镜、打右转灯（告诉后面的车你要停车）、看右边盲点。"],
 noMirror:["没有看后视镜","开到参考车旁边停车之前，要先看后视镜，确认后面没有车紧跟着。"],
 noShoulderR:["倒车前没有看右边盲点","平行停车倒进去之前，要回头看右边盲点：右后方可能有自行车、行人。"],
 posGap:["停在参考车旁边的位置不对","起始位置：和参考车平行、相隔约 1 米，你的后保险杠和它的后保险杠对齐。"],
 notIn:["没有停进车位","车要停进两辆车之间的车位里，车身全在路边，不能停在车道上。"],
 farCurb:["停好后离路缘太远","平行停车最后要离路缘 30 厘米以内。"],
 notPar:["停好后车身没有和路缘平行","最后要把车身摆正，和路缘平行。"],
 notCentre:["没有停在车位中间","停好后前后都要留出空间：挂 D 往前一点，停在两辆车中间（能看到前车的后轮落地处）。"],
 manyMoves:["来回调整的次数太多","平行停车一般一次倒进去，最多再往前调整一下。来回很多次，说明打方向的时机不对。"],
 sigOn:["停好后没有关转向灯","停好车后要关掉转向灯。"],
 noP:["没有挂 P 停好","停好车的最后一步要挂 P（再熄火、拉手刹）。"]};
const SCENE={g:0,Y:()=>0,TXT:PK_TXT,SER:['notIn'],vmax:2.0,
 curbs:[{side:1,x:HRW},{side:-1,x:-HRW}],
 okText:'M.S.B. 之后停在参考车旁边，倒车时回头看，打方向的时机准确，没有碰车、没有碰路缘，停在车位中间、离路缘 30 厘米内，做得很好。',
 setup(R){Object.assign(R,{x:.35,z:PB-26,h:0,gear:'D',ph:0});R.obst=[];
  PARKS.forEach(p=>{const c=car([0x7b8794,0x1f2328,0xeceff1,0x4a4f57,0x8e2b2b][Math.random()*5|0]);live.push(c);place(c,p[0],p[1],0,0)});
  SCN.obst=PARKS.map(p=>[p[0],p[1],0]);banner('考官：在前面那辆车（深色箭头那辆）后面的空位平行停车','#ffe27a',1)},
 onGear(g){if(R.ph===2&&g==='P')parkDone()},
 onSeg(dir,n){if(R.ph>=2)R.moves=(R.moves||0)+1},
 step(R,dt){const t=R.t;
  // 0：开到参考车旁边停下（第一次停在参考车附近）：检查 M.S.B. 和起始位置
  if(R.ph===0&&R.v===0&&R.z>PA-6&&R.z<PA+4){R.ph=1;msb('R',{sh:'noShoulderR'});const gap=(PX-LW.HW)-(R.x+LW.HW),al=(R.z-LW.HL)-(PA-LW.HL);
   if(gap<.4||gap>1.7||Math.abs(al)>1.2||Math.abs(R.h)>.12)ev('posGap','（当时和参考车相隔 '+gap.toFixed(1)+' 米，后保险杠'+(al>0?'靠前 ':'靠后 ')+Math.abs(al).toFixed(1)+' 米）');banner('挂 R，回头看后面，慢慢倒进车位','#ffe27a')}
  if(R.ph===1&&R.v<-.05){R.ph=2;R.lastDir=-1;R.moves=1}
  if(t>200&&!R.over){if(R.ph<3)ev('noP');finish()}},
 draw(R){},
 topCam(R){return R.ph>=1?[.5,(PA+PB)/2,26]:[R.x-1.5,R.z+4,26]}};
function parkDone(){const g=curbGap(1),fA=(PA-LW.HL)-(R.z+LW.HL),rB=(R.z-LW.HL)-(PB+LW.HL),inS=R.x>HRW-2.2&&fA>-.2&&rB>-.2;
 if(!inS)ev('notIn');
 else{if(g&&Math.max(g.front,g.rear)>.3)ev('farCurb','（右轮离路缘 前 '+g.front.toFixed(2)+' 米、后 '+g.rear.toFixed(2)+' 米）');
  if(Math.abs(R.h)>.1)ev('notPar');if(fA<.5||rB<.5)ev('notCentre','（前面留了 '+fA.toFixed(1)+' 米，后面留了 '+rB.toFixed(1)+' 米）')}
 if((R.moves||0)>4)ev('manyMoves');
 if(R.sig)ev('sigOn');
 R.ph=3;setTimeout(()=>{if(!R.over)finish()},1200)}
// 参考车上方的箭头（俯视里看得清是哪辆）
{const a=new T.Mesh(new T.ConeGeometry(.6,1.4,4),BM(0x1f6feb));a.rotation.x=Math.PI;a.position.set(-PX,3.2,PA);scene.add(a)}
LS.start(SCENE);
