// ============================================================
// sheet.js — 模拟考试成绩单：照考官用的 G2 / G 评分表（Record of Examination）的样子
// 每个场景的错误（R.ev 里的 key）对应到表上的某一栏、某一行、某个字母；格子里写上字母，就是考官记的一个扣分
// 转弯（Turns）、G 牌换线、停牌路口等是“按第几次”分列的；其他栏是一个错误占一个格子，按顺序往后填
// ============================================================
(function(){
// ---------- 评分表的栏目 ----------
// 行：[id, 英文, 中文说明]；h:true 的是小标题行
const R_=(id,en,zh)=>({id,en,zh}),H=(en,zh)=>({h:1,en,zh});
const G2={
 ST:{en:'START',zh:'起步',n:1,rows:[R_('1','Unable to: A_Locate / B_Adjust / C_Operate safety devices','找不到、不会调整或操作安全装置'),R_('2','A_Fail to observe / B_Uses mirror only','起步前没有观察 / 只看后视镜'),
  R_('3','A_Fail to signal / B_Improper signal','起步没打灯 / 打错灯'),R_('4','Incorrect use of: A_Clutch / B_Brake / C_Gears / D_Steering','离合、刹车、挡位、方向盘使用不当')]},
 BK:{en:'BACKING — Turnabout',zh:'倒车 · 三点调头',n:2,rows:[R_('1','A_Control / B_Steering method / C_Observation / D_Veh. position','控制 / 打方向方法 / 观察 / 车辆位置'),R_('2','Incorrect use of: A_Clutch / B_Brake / C_Gears / D_Steering','离合、刹车、挡位、方向盘使用不当')]},
 DA:{en:'DRIVING ALONG',zh:'行驶中',n:4,rows:[R_('1','A_Follows too closely / B_Passes too closely / C_Cuts in too soon','跟车太近 / 超车太近 / 切入太早'),
  R_('2','A_Improper choice of lane / B_Straddles lane / C_Unmarked roadway','车道选择不当 / 骑线 / 无标线道路'),R_('3','A_Fails to check blind spot / B_Observe properly','没看盲点 / 观察不足'),
  R_('4','Lane change signal: A_Wrong / B_Early / C_Late / D_Not given / E_Not cancelled','换线转向灯：打错 / 太早 / 太晚 / 没打 / 没关'),R_('5','Right-of-way observance: A_Ped / B_Self / C_Other vehicles','路权：行人 / 自己的路权 / 其他车辆'),
  R_('6','Fail to use caution or obey: A_Ped crossover / B_School crossing / C_Emerg. veh.','人行过道 / 学校路口 / 紧急车辆'),R_('7','Speed: A_Too fast / B_Slow for condition / C_Impedes traffic','车速：太快 / 太慢 / 妨碍交通'),
  R_('8','Incorrect use of: A_Clutch / B_Brake / C_Accelerator / D_Gears / E_Steering / F_Safety devices','离合、刹车、油门、挡位、方向盘、安全装置使用不当')]},
 IN:{en:'INTERSECTION / R.R. CROSSING',zh:'路口 / 铁路道口',n:4,rows:[R_('1','Fail to observe properly: A_Controlled / B_Uncontrolled intersections','路口观察不足：有管制 / 无管制路口'),
  R_('2','Fail to obey: A_Signs / B_Signals / C_Pavement markings','不遵守：标志 / 信号灯 / 路面标线'),R_('3','Late in: A_Slowing / B_Stopping / C_Slows too soon','减速太晚 / 停车太晚 / 减速太早'),
  R_('4','Stopping position: A_Too soon / B_Blocks crosswalk / C_Blocks intersection','停车位置：太靠后 / 挡人行横道 / 挡路口'),R_('5','Right-of-way observance: A_Ped / B_Self / C_Other vehicles','路权：行人 / 自己的路权 / 其他车辆')]},
 TU:{en:'TURNS',zh:'转弯',two:['LEFT TURNS 左转','RIGHT TURNS 右转'],rows:[R_('1','Signalling: A_Wrong / B_Early / C_Late / D_Not given / E_Not cancelled','转向灯：打错 / 太早 / 太晚 / 没打 / 没关'),
  R_('2','Fail to get in proper: A_Position / B_Lane / C_Late into lane / D_Late into position','没进入正确的位置 / 车道，或进得太晚'),R_('3','Right-of-way observance: A_Ped / B_Self / C_Position / D_Other vehicles','路权：行人 / 自己的路权 / 位置 / 其他车辆'),
  R_('4','Too wide: A_Turn too wide / B_Enters wrong lane','转弯太大 / 进错车道'),R_('5','Too short: A_Cuts corner / B_Enters wrong lane','转弯太小切角 / 进错车道'),R_('6','Steering: A_Method / B_Control / C_Recovery','打方向：方法 / 控制 / 回正'),
  R_('7','Speed: A_Too fast / B_Fast enter / C_Fast leave / D_Too slow / E_Slow enter / F_Slow leave / G_Impedes','车速：太快 / 进弯快 / 出弯快 / 太慢 / 进弯慢 / 出弯慢 / 妨碍交通'),R_('8','Incorrect use of: A_Clutch / B_Brake / C_Accelerator / D_Gears','离合、刹车、油门、挡位使用不当')]},
 PK:{en:'PARKING',zh:'停车',n:2,rows:[H('Fail to observe','观察'),R_('1','A_Backing / B_Leaving / C_Mirror only backing / D_Mirror only leaving','倒车时 / 离开时没观察；倒车 / 离开时只看后视镜'),
  R_('2','Hits: A_Objects / B_Other vehicles / C_Climbs curb','碰到：物体 / 其他车 / 压上路缘'),R_('3','A_Incorrect vehicle position','停车位置不对'),R_('4','A_Fail to signal when leaving / B_Incorrect signal','离开时没打灯 / 转向灯不对'),
  R_('5','Incorrect use of: A_Clutch / B_Brake / C_Accelerator / D_Gears / E_Steering','离合、刹车、油门、挡位、方向盘使用不当')]},
 GR:{en:'STOP, PARK AND START ON A GRADE',zh:'坡道停车和起步',n:2,rows:[H('Fail to observe','观察'),R_('1','A_Properly / B_Use mirror only / C_Signals before leaving','观察不足 / 只看后视镜 / 转向灯'),
  R_('2','A_Rolls back when parking / B_Starting','停车时 / 起步时溜车'),R_('3','A_Fails to angle wheels properly / B_Incorrect vehicle position','车轮方向没打对 / 停车位置不对'),
  R_('4','A_Fails to set parking brake / B_Select proper gear','没拉手刹 / 挡位不对'),R_('5','Incorrect use of: A_Clutch / B_Brake / C_Accelerator / D_Gears / E_Steering','离合、刹车、油门、挡位、方向盘使用不当')]}};
G2.order=[['ST','BK'],['DA'],['IN'],['TU'],['PK','GR']];
const G={
 TU:{en:'TURNS',zh:'转弯',two:['Left 左转','Right 右转'],cols:4,rows:[H('Approach','接近路口'),R_('a1','Traffic check: A_Mirrors','观察：后视镜'),R_('a2','Traffic check: A_No blind spot','观察：没看盲点'),
  R_('a3','Lane: A_Incorrect / B_Late lane','车道不对 / 进车道太晚'),R_('a4','Signal: A_No / B_Late / C_Entrance','转向灯：没打 / 太晚 / 打在入口前'),R_('a5','Speed: A_Uneven / B_Brake / C_Gears / D_Coast','车速：不稳 / 刹车 / 挡位 / 空滑'),
  R_('a6','Gap: A_Less than 2-3 sec','跟车距离不到 2～3 秒'),H('If stops','如果停车'),R_('s1','Full stop: A_No / B_Roll / C_Block traffic','完全停车：没停 / 溜过 / 挡住交通'),
  R_('s2','Positions: A_No rear wheels / B_Over line / C_Wheels turned','位置：看不见前车后轮 / 压线 / 车轮打着方向'),R_('s3','Traffic check: A_None while waiting','等候时没观察'),
  H('Turning','转弯中'),R_('t1','Traffic check: A_Left-right-left','观察：左右左'),R_('t2','Traffic check: A_No blind spot / B_Conflict','观察：没看盲点 / 和其他车或行人冲突'),
  R_('t3','Hands / Gears: A_One hand / B_Change','单手 / 转弯中换挡'),R_('t4','Speed: A_Wait 4-5 sec / B_Too fast / C_Slow','车速：多等了 4～5 秒 / 太快 / 太慢'),R_('t5','Wide / Short: A_Too wide / B_Short','转太大 / 太小'),
  H('Complete turn','转完'),R_('c1','Lane: A_Wrong lane / B_Not move right','车道：进错车道 / 没有靠右'),R_('c2','Speed: A_Not by traffic speed','没跟上车流速度'),R_('c3','Speed: A_Fast / B_Slow / C_Lug / D_Rev / E_Gears','车速：快 / 慢 / 低转速 / 高转速 / 挡位')]},
 EX:{en:'EXPRESSWAY',zh:'高速公路',cols:2,colLab:['1','2'],rows:[H('Entering','上高速'),R_('e1','Traffic check: A_No left-right / B_Mirrors','观察：没左右看 / 后视镜'),R_('e2','Traffic check: A_No blind spot','观察：没看盲点'),
  R_('e3','Signal: A_Late / B_Never','转向灯：太晚 / 没打'),R_('e4','Spacing: A_Not 2-3 sec front / B_Back / C_Out of acc. lane','距离：前车不到 2～3 秒 / 后车太近 / 出了加速车道'),
  R_('e5','Speed: A_Too fast / B_Slow / C_Accelerate after acc. lane','车速：太快 / 太慢 / 出了加速车道才加速'),R_('e6','Merge: A_Sharp / B_Not to lane centre','并线太急 / 没并到车道中间'),R_('e7','Signal: A_On after 5 sec','并入 5 秒后转向灯还开着'),
  H('Driving along','高速上行驶'),R_('d1','Traffic check: A_Not every 5 sec','没有每 5 秒观察'),R_('d2','Speed: A_Over limit / B_Not traffic speed / C_Uneven / D_Avoid obstacles','车速：超速 / 没跟上车流 / 不稳 / 避障'),
  R_('d3','Spacing: A_Under 2-3 sec / B_Sides / C_In blind spots / D_Not inc. follow dist.','距离：不到 2～3 秒 / 两边 / 待在盲区 / 没加大跟车距离'),
  H('Exiting','出高速'),R_('x1','Traffic check: A_No left-right / B_Mirrors / C_No blind spot','观察：没左右看 / 后视镜 / 没看盲点'),R_('x2','Signal: A_None / B_After exit lane','转向灯：没打 / 进了出口车道才打'),
  R_('x3','Exit lane: A_Over line / B_After start of lane / C_Sharp turn to lane','出口车道：压线 / 进得太晚 / 换得太急'),R_('x4','Speed: A_Slowed on expressway / B_Spacing / C_Rough slowing','车速：在主路上减速 / 距离 / 减速太猛'),
  R_('x5','Gap: A_Under 2-3 sec front','和前车不到 2～3 秒'),R_('x6','Signal: A_Still on at ramp end','匝道尽头转向灯还开着'),
  H('Curve','匝道弯道'),R_('v1','Speed: A_Braked / B_Too fast / C_Not steady speed / D_Changed gear','车速：弯中刹车 / 太快 / 不稳 / 换挡'),R_('v2','Lane: A_Out of / B_Unsteady steering','出了车道 / 方向不稳')]},
 LC:{en:'LANE CHANGES',zh:'换线',two:['Business 市区','Expressway 高速'],cols:4,colLab:['1L','1R','2L','2R'],rows:[R_('1','Traffic check: A_Front/left-right / B_Mirrors / C_Conflict','观察：前方和左右 / 后视镜 / 冲突'),
  R_('2','Traffic check: A_No blind spot','观察：没看盲点'),R_('3','Signal: A_Not 2-3 sec early','转向灯没提前 2～3 秒'),R_('4','Spacing: A_Front / B_Behind / C_Sides','距离：前 / 后 / 两边'),
  R_('5','Speed: A_Too fast / B_Slow','车速：太快 / 太慢'),R_('6','Change: A_Sharp / B_Not to centre','换线太急 / 没换到车道中间'),R_('7','Hands: A_One hand','单手'),R_('8','Signal: A_On after 5 sec','换完 5 秒后转向灯还开着')]},
 BR:{en:'BUSINESS / RESIDENTIAL',zh:'市区 / 住宅区',two:['Business 市区','Residential 住宅区'],cols:2,colLab:['1','2'],rows:[R_('1','Traffic check: A_Not look at hazard','观察：没看到危险'),
  R_('4','Mirrors check: A_Not in 10 seconds','10 秒内没看后视镜'),R_('5','Lane: A_Wrong / B_Wanders / C_Obstacles','车道：不对 / 飘 / 避障'),R_('6','Speed: A_Over limit / B_Traffic / C_Uneven / D_Avoid obstacles','车速：超速 / 车流 / 不稳 / 避障'),
  R_('7','Spacing: A_2-3 seconds / B_Rear wheels / C_Sides / D_Blind spots / E_Inc. follow distance','距离：2～3 秒 / 前车后轮 / 两边 / 盲区 / 加大跟车距离')]},
 SI:{en:'STOP INTERSECTION',zh:'停牌路口',cols:2,colLab:['1','2'],rows:[H('Approach','接近'),R_('p1','Traffic check: A_No mirrors','没看后视镜'),R_('p2','Speed: A_Uneven / B_Brake / C_Gears / D_Coast','车速：不稳 / 刹车 / 挡位 / 空滑'),
  R_('p3','Gap: A_Less than 2-3 sec','跟车不到 2～3 秒'),H('Stopping','停车'),R_('q1','Full stop: A_No full stop / B_Roll / C_Blocked traffic','没完全停 / 溜过 / 挡住交通'),R_('q2','Position: A_Rear wheels / B_Over line','位置：前车后轮 / 压线'),
  R_('q3','Traffic check: A_None while waiting','等候时没观察'),H('Starting','起步'),R_('r1','Traffic check: A_No left-right-left','没有左右左观察'),R_('r2','Hands-Gears: A_One hand / B_Gear change','单手 / 换挡'),
  R_('r3','Traffic check: A_Not by traffic speed','没跟上车流'),R_('r4','Speed: A_Wait / B_Fast / C_Slow / D_Lug / E_Rev / F_Gears','车速：等太久 / 快 / 慢 / 低转速 / 高转速 / 挡位')]},
 TI:{en:'THROUGH INTERSECTION',zh:'直行通过路口',cols:2,colLab:['1','2'],rows:[H('Approach','接近'),R_('h1','Traffic check: A_No left-right-left','没有左右左观察'),R_('h2','Traffic check: A_No blind spot','没看盲点'),
  R_('h3','Speed: A_Not keep speed / B_Not slow for hazard / C_Not cover brake','车速：不稳 / 有危险没减速 / 脚没放在刹车上'),R_('h4','Gap: A_Less than 2-3 sec','跟车不到 2～3 秒'),H('Through','通过'),
  R_('u1','A_Lane change / B_One hand / C_Gears','路口里换线 / 单手 / 换挡'),R_('u2','Traffic check: A_No mirrors','没看后视镜')]}};
G.order=[['TU','EX'],['LC','SI'],['BR','TI']];

// ---------- 每个场景的错误 → 表上的位置 ----------
// 'TU.3.D'＝转弯栏第 3 行字母 D；转弯栏按这一项是第几次左转 / 右转分列
const LOWG2={dryS:'DA.8.E',gearMove:'DA.8.D',noPB:'ST.4.B',hitCurb:'DA.8.E',mountCurb:'DA.8.E',crash:'DA.5.C',brkNoMir:'DA.3.B',brkNoSig:'DA.4.D',hardBrake:'DA.8.B',offRoad:'DA.2.B',noLookBack:'PK.1.A'};
const PKLOW={dryS:'PK.5.E',gearMove:'PK.5.D',noPB:'PK.5.B',noLookBack:'PK.1.A',hitCurb:'PK.2.C',mountCurb:'PK.2.C',crash:'PK.2.B',brkNoMir:'DA.3.B',brkNoSig:'PK.4.B',hardBrake:'DA.8.B',missed:'PK.3.A',offRoad:'PK.2.C',blockDrive:'PK.3.A'};
const STOPG2={yield4:'IN.5.C',sigStraight:'DA.4.A',waitTurn:'IN.5.B',hesitate:'TU.7.G',noSig:'TU.1.D',lateSig:'TU.1.C',noStop:'IN.2.A',stopOnCross:'IN.4.B',stopFar:'IN.4.A',noLook:'IN.1.A',blindGo:'IN.1.A',pedYield:'TU.3.A',unsafeL:'TU.3.D',unsafeR:'TU.3.D',crash:'TU.3.D'};
const MAPG2={
 exit:Object.assign({},LOWG2,{noLookL:'ST.2.A',noSigOut:'ST.3.A',noScanAisle:'IN.1.B',noYieldCar:'DA.5.C',noSeeCar:'DA.5.C',noYieldPed:'DA.5.A',noYieldBack:'DA.5.C',noSigL2:'TU.1.D',noYieldEC:'DA.5.C',noPedE:'TU.3.A',stopFar:'IN.4.A',noScan:'IN.1.B',cutOff:'TU.3.D'}),
 'red-right':{noStop:'IN.2.A',yieldX:'TU.3.D',yieldP:'TU.3.A',yieldK:'TU.3.D',crash:'TU.3.D',hitP:'TU.3.A',hitB:'TU.3.D',noScan:'IN.1.A',noCreep:'IN.1.A',noRR:'IN.1.A',stopOver:'IN.2.C',stopXw:'IN.4.B',blockP:'IN.4.B',yieldL:'TU.3.D',sig:'TU.1.D',sigL:'TU.1.C'},
 'green-right':{cut:'TU.3.D',delay:'TU.7.G',delayP:'TU.7.G',delayL:'TU.7.G',hookA:'IN.1.A',hookB:'TU.3.D',redR:'IN.2.B',red:'IN.2.B',yel:'IN.2.B',yieldL2:'TU.3.D',goX:'TU.7.G',yieldL:'TU.3.D',blockX:'IN.4.B',blockX2:'IN.4.B',inX:'IN.4.C',police:'DA.6.C',noScanP:'IN.1.A',hitP:'TU.3.A',hitBA:'TU.3.D',hitBB:'TU.3.D',sig:'TU.1.D',sigL:'TU.1.C'},
 'green-left':{stopOverL:'IN.3.B',stopXwL:'IN.4.B',sig:'TU.1.D',sigL:'TU.1.C',wheels:'TU.6.A',noEnter:'TU.2.A',enter2:'IN.4.C',noScanL:'IN.1.A',yieldO:'TU.3.D',sameLT:'TU.3.D',yieldRT:'TU.3.D',yieldBk:'TU.3.D',yieldPL:'TU.3.A',stuckO:'IN.4.C',stuckRed:'IN.4.C',yelIn:'IN.2.B',redIn:'IN.2.B',yelA:'IN.2.B',arrowWait:'TU.7.G',crash:'TU.3.D',hitP:'TU.3.A',hitB:'TU.3.D',
  keepRight:'DA.2.A',lcNoSig:'DA.4.D',lcSigShort:'DA.4.C',lcNoMir:'DA.3.B',lcNoSho:'DA.3.A',lcUnsafe:'DA.5.C',lcSigOn:'DA.4.E'},
 'stop-left':STOPG2,
 'stop-4way':Object.assign({},STOPG2,{hesitate:'IN.5.B',pedYield:'IN.5.A',crash:'IN.5.C',unsafeL:'IN.5.C',unsafeR:'IN.5.C'}),
 'hill-park':{noSigR:'GR.1.C',noMirror:'GR.1.B',noShoulderR:'GR.1.A',noSigL:'GR.1.C',noShoulderL:'GR.1.A',farCurb:'GR.3.B',notPar:'GR.3.B',wrongWheels:'GR.3.A',weakWheels:'GR.3.A',noRest:'GR.3.A',rollAway:'GR.2.A',noP:'GR.4.B',
  noPB:'GR.4.A',dryS:'GR.5.E',gearMove:'GR.5.D',hitCurb:'GR.5.E',mountCurb:'GR.5.E',brkNoMir:'GR.1.B',brkNoSig:'GR.1.C',noLookBack:'GR.1.A',crash:'DA.5.C',hardBrake:'DA.8.B',offRoad:'DA.2.B'},
 'three-point':{noSigR:'BK.1.C',noMirror:'BK.1.C',noShoulderR:'BK.1.C',farCurb:'BK.1.D',noSigL:'BK.1.C',noShoulderL:'BK.1.C',noScan:'BK.1.C',no360:'BK.1.C',noSigR2:'BK.1.C',noSigL3:'BK.1.C',touchCurb:'BK.1.A',tooMany:'BK.1.B',unsafe:'BK.1.C',wrongLane:'BK.1.D',
  dryS:'BK.2.D',gearMove:'BK.2.C',noPB:'BK.2.B',noLookBack:'BK.1.C',hitCurb:'BK.1.A',mountCurb:'BK.1.A',brkNoMir:'BK.1.C',brkNoSig:'BK.1.C',crash:'BK.1.C',hardBrake:'DA.8.B',offRoad:'BK.1.D'},
 parallel:Object.assign({},PKLOW,{noSigR:'PK.4.B',noMirror:'PK.1.C',noShoulderR:'PK.1.A',posGap:'PK.3.A',notIn:'PK.3.A',farCurb:'PK.3.A',farCurb2:'PK.3.A',notPar:'PK.3.A',notCentre:'PK.3.A',manyMoves:'PK.5.E',no360:'PK.1.A',few360:'PK.1.A',noYieldBike:'PK.1.A',noSeeBike:'PK.1.A',noP:'PK.5.D'}),
 stall:Object.assign({},PKLOW,{frontIn:'PK.3.A',notIn:'PK.3.A',overLine:'PK.3.A',notCentre:'PK.3.A',crooked:'PK.3.A',notAlign:'PK.3.A',notDeep:'PK.3.A',wheelNotStr:'PK.5.E',manyMoves:'PK.5.E',no360:'PK.1.A',noYieldCar:'PK.1.A',noSeeCar:'PK.1.A',noP:'PK.5.D'})};
const MAPG={
 exit:{noLookL:'BR.1.A',noSigOut:'TU.a4.A',noScanAisle:'BR.1.A',noYieldCar:'BR.1.A',noSeeCar:'BR.1.A',noYieldPed:'BR.1.A',noYieldBack:'BR.1.A',noSigL2:'TU.a4.A',noYieldEC:'BR.1.A',noPedE:'TU.t2.B',noScan:'TU.t1.A',cutOff:'TU.a6.A',crash:'BR.1.A',offRoad:'BR.5.A'},
 'red-right':{noStop:'TU.s1.A',yieldX:'TU.t2.B',yieldP:'TU.t2.B',yieldK:'TU.t2.B',crash:'TU.t2.B',hitP:'TU.t2.B',hitB:'TU.t2.B',noScan:'TU.t1.A',noCreep:'TU.s3.A',noRR:'TU.t2.A',stopOver:'TU.s2.B',stopXw:'TU.s2.B',blockP:'TU.s1.C',yieldL:'TU.t2.B',sig:'TU.a4.A',sigL:'TU.a4.B'},
 'green-right':{cut:'TU.t2.B',delay:'TU.t4.A',delayP:'TU.t4.A',delayL:'TU.t4.A',hookA:'TU.t2.A',hookB:'TU.t2.B',yieldL2:'TU.t2.B',goX:'TU.t4.A',yieldL:'TU.t2.B',blockX:'TU.s1.C',blockX2:'TU.s1.C',inX:'TU.s1.C',noScanP:'TU.t1.A',hitP:'TU.t2.B',hitBA:'TU.t2.A',hitBB:'TU.t2.B',sig:'TU.a4.A',sigL:'TU.a4.B'},
 'green-left':{stopOverL:'TU.s2.B',stopXwL:'TU.s1.C',sig:'TU.a4.A',sigL:'TU.a4.B',wheels:'TU.s2.C',noEnter:'TU.t4.A',enter2:'TU.s1.C',noScanL:'TU.t1.A',yieldO:'TU.t2.B',sameLT:'TU.t2.B',yieldRT:'TU.t2.B',yieldBk:'TU.t2.B',yieldPL:'TU.t2.B',stuckO:'TU.s1.C',stuckRed:'TU.s1.C',arrowWait:'TU.t4.A',crash:'TU.t2.B',hitP:'TU.t2.B',hitB:'TU.t2.B',
  keepRight:'TU.c1.B',lcNoSig:'LC.3.A',lcSigShort:'LC.3.A',lcNoMir:'LC.1.B',lcNoSho:'LC.2.A',lcUnsafe:'LC.1.C',lcSigOn:'LC.8.A'},
 'highway-on':{noSig:'EX.e3.B',wrongSig:'EX.e3.B',sigShort:'EX.e3.A',noMirror:'EX.e1.B',noShoulder:'EX.e2.A',oldShoulder:'EX.e2.A',unsafeB:'EX.e4.B',unsafeR:'EX.e4.B',unsafeF:'EX.e4.A',sigOn:'EX.e7.A',solidX:'EX.e6.A',rampFast:'EX.e5.A',slowA:'EX.e5.B',slowB:'EX.e5.B',onShoulder:'EX.e6.B',slowF:'EX.e5.C',tooClose:'EX.d3.A',hardBrake:'EX.d3.D',noMerge:'EX.e4.C',crash:'EX.e4.B',speedF:'EX.d2.A'},
 'highway-off':{noSig:'LC.3.A',sigShort:'LC.3.A',noMirror:'LC.1.B',noShoulder:'LC.2.A',oldShoulder:'LC.2.A',unsafeB:'LC.4.C',unsafeR:'LC.4.B',unsafeF:'LC.4.A',lateRight:'EX.x3.B',noLane:'EX.x3.A',slowHwy:'EX.x4.A',rampFast:'EX.v1.B',rampFastC:'EX.v1.B',tooClose:'EX.x5.A',hardBrake:'EX.x4.C',crash:'LC.1.C',speedF:'EX.d2.A',stay80:'EX.d2.B'},
 headin:{noSigIn:'TU.a4.A',noYieldPedIn:'TU.t2.B',noYieldOnc:'BR.1.A',noYieldCar:'BR.1.A'}};
// 每一项里有几次左转、右转（转弯栏分列用）
const TURNS={exit:['L'],'red-right':['R'],'green-right':['R'],'green-left':['L'],'stop-left':['L'],headin:['R']};
// 分列的栏：这一项算第几列（同一种项目第几次出现）
const COLG={EX:{'highway-on':0,'highway-off':0},LC:s=>s==='green-left'?{side:0,lane:'R'}:s==='highway-off'?{side:1,lane:'R'}:null,BR:{exit:0,headin:1},SI:{'stop-left':0,'stop-4way':0},TI:{'stop-4way':0}};

// ---------- 把考试结果填进表 ----------
function fill(S){const lvl=S.level==='g'?'g':'g2',F=lvl==='g'?G:G2,M=lvl==='g'?MAPG:MAPG2,cells={},other=[],crit=[];
 const nTurn={L:0,R:0},occ={},lcN=[0,0],steps=S.steps||[];
 const put=(sec,row,side,col,letter,ser)=>{const k=sec+'|'+row+'|'+side+'|'+col;const c=cells[k]=cells[k]||{l:[],ser:false};if(!c.l.includes(letter))c.l.push(letter);if(ser)c.ser=true};
 const seqCol=(sec,row,side)=>{let i=0;while(cells[sec+'|'+row+'|'+side+'|'+i])i++;return i};
 steps.forEach((st,si)=>{const r=(S.res||[])[si];const tl=(TURNS[st.s]||[]).map(t=>({t,i:nTurn[t]++}));
  const occI=(occ[st.s]=(occ[st.s]||0)+1)-1;
  if(!r)return;
  (r.ev||[]).forEach(e=>{if(e.ser)crit.push({step:st,e});
   const tgt=e.k&&M[st.s]&&M[st.s][e.k];if(!tgt){other.push({step:st,e});return}
   const [sec,row,L]=tgt.split('.'),SD=F[sec];let side=0,col;
   if(sec==='TU'){let w=tl[0];if(st.s==='headin'&&lvl==='g')w=tl.find(x=>x.t==='R');if(!w){other.push({step:st,e});return}side=w.t==='L'?0:1;col=w.i}
   else if(lvl==='g'&&sec==='LC'){const o=COLG.LC(st.s);if(!o){other.push({step:st,e});return}side=o.side;const n=st.s==='green-left'?occI:0;col=Math.min(1,n)*2+(o.lane==='R'?1:0)}
   else if(lvl==='g'&&COLG[sec]&&!SD.two){const o=COLG[sec][st.s];col=(o||0)+(sec==='SI'||sec==='TI'?Math.min(1,occI):0)}
   else if(lvl==='g'&&sec==='BR'){side=0;col=COLG.BR[st.s]||0}
   else col=seqCol(sec,row,0);
   put(sec,row,side,col,L,e.ser)})});
 let marks=0;Object.values(cells).forEach(c=>{if(!c.ser)marks+=c.l.length});marks+=other.filter(o=>!o.e.ser).length;
 return {F,cells,other,crit,marks,nTurn}}

// ---------- 画表 ----------
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function boxes(cells,sec,row,side,n,labs){let h='<span class="bx">';for(let i=0;i<n;i++){const c=cells[sec+'|'+row+'|'+side+'|'+i];
  h+='<i class="'+(c?(c.ser?'f s':'f'):'')+'"'+(labs?' title="'+labs[i]+'"':'')+'>'+(c?c.l.sort().join(''):'')+'</i>'}return h+'</span>'}
function secHtml(F,id,cells,lvl,zh,nTurn){const S=F[id];const two=!!S.two;
 let n=S.n||S.cols||1;if(id==='TU'){n=Math.max(4,nTurn.L,nTurn.R)}
 // 顺序填的栏：格子不够就加
 if(!S.cols&&id!=='TU')S.rows.forEach(r=>{if(r.h)return;for(let i=0;cells[id+'|'+r.id+'|0|'+i];i++)n=Math.max(n,i+1)});
 const labs=S.colLab||null;
 let h='<section class="fm"><h4>'+esc(S.en)+(zh?' <small>'+esc(S.zh)+'</small>':'')+'</h4>';
 if(two)h+='<div class="fr hd"><span class="no"></span><span class="bx lab">'+esc(S.two[0])+'</span><span class="tx"></span><span class="bx lab">'+esc(S.two[1])+'</span></div>';
 if(labs)h+='<div class="fr hd"><span class="no"></span><span class="bx">'+labs.map(l=>'<i class="l">'+l+'</i>').join('')+'</span><span class="tx"></span>'+(two?'<span class="bx">'+labs.map(l=>'<i class="l">'+l+'</i>').join('')+'</span>':'')+'</div>';
 S.rows.forEach(r=>{if(r.h){h+='<div class="fr sh"><span class="no"></span><span class="tx">'+esc(r.en)+(zh?' · '+esc(r.zh):'')+'</span></div>';return}
  const any=Object.keys(cells).some(k=>k.startsWith(id+'|'+r.id+'|'));
  h+='<div class="fr'+(any?' hit':'')+'"><span class="no">'+esc(r.id.replace(/^[a-z]/,''))+'</span>'+boxes(cells,id,r.id,0,n,labs)+'<span class="tx">'+esc(r.en).replace(/([A-G])_/g,'<b>$1</b>_')+(zh?'<small>'+esc(r.zh)+'</small>':'')+'</span>'+(two?boxes(cells,id,r.id,1,n,labs):'')+'</div>'});
 return h+'</section>'}
window.renderSheet=function(S,zh){const lvl=S.level==='g'?'g':'g2',R=fill(S),F=R.F;
 let h='<div class="sheet"><div class="shh"><b>Record of '+(lvl==='g'?'G':'G2')+' Examination</b>'+(zh?' <small>'+(lvl==='g'?'G':'G2')+' 路考评分表（模拟）</small>':'')+'<span class="lg"><i class="f">A</i> '+(zh?'扣分（格子里的字母＝那一行的哪一项）':'mark (letter = item on that line)')+' <i class="f s">A</i> '+(zh?'严重错误':'critical')+'</span></div>';
 h+='<div class="cols">'+F.order.map(col=>'<div>'+col.map(id=>secHtml(F,id,R.cells,lvl,zh,R.nTurn)).join('')+'</div>').join('')+'</div>';
 if(R.other.length)h+='<section class="fm"><h4>OTHER'+(zh?' <small>表上没有对应栏目的错误</small>':'')+'</h4>'+R.other.map(o=>'<div class="fr hit"><span class="no">•</span><span class="bx"><i class="f'+(o.e.ser?' s':'')+'">✕</i></span><span class="tx">'+esc(o.e.t)+'<small>'+esc(zh?o.step.zh:o.step.en)+'</small></span></div>').join('')+'</section>';
 return {html:h+'</div>',marks:R.marks,crit:R.crit,other:R.other,dq:many=>dqHtml(S,R.crit,many,zh)}};
// ---------- 不合格的理由：照考官表上的写法（G2 用 Summary reasons，G 用 Reasons for disqualification） ----------
const DQ2=[['rw','Right-of-way: ped. / self / other traffic','路权：行人 / 自己 / 其他车辆'],['ix','Intersections: controlled / uncontrolled','路口：有管制 / 无管制'],['pm','Pavement or lane markings','路面或车道标线'],
 ['ts','Traffic signs & signals','交通标志和信号灯'],['bk','Backing manoeuvres','倒车操作'],['fd','Following distances','跟车距离'],['tm','Turn manoeuvres / intersections','转弯操作 / 路口'],['pk','Parking skills','停车技能'],['sp','Speed (fast / slow)','车速（太快 / 太慢）'],['many','Too many driving errors','驾驶错误太多']];
const DQG=[['col','Preventable collision','可以避免的碰撞'],['dan','Dangerous action','危险行为'],['law','Traffic law violation','违反交通法规'],['skill','Inadequate skill to complete test','技能不足，无法完成考试'],['many','Too many driving errors','驾驶错误太多']];
const COLK=['crash','hitP','hitB','hitBA','hitBB'],YLDK=['yieldX','yieldP','yieldK','yieldL','yieldL2','yieldO','sameLT','yieldRT','yieldBk','yieldPL','pedYield','yield4','hookA','hookB','unsafeL','unsafeR','unsafeB','unsafeF','lcUnsafe','cutOff','pedA','pedB','noYieldPed','noYieldCar','noYieldBike'],
 SIGK=['noStop','red','redR','redIn','yel','yelIn','yelA','xwalk','stopOver'],BLKK=['blockP','blockX','blockX2','stuckO','stuckRed','inX','noScan','noScanL','noLook','blindGo'],SKK=['missRamp','missExit','noMerge','missed','mountCurb','rollAway','tooMany','notIn'],SPK=['speedF','rampFast','rampFastC','slowF','slowB','stay80'],FDK=['tooClose','hardBrake'];
function dqKey2(k,s){if(COLK.includes(k)||YLDK.includes(k)||k==='police')return'rw';if(SIGK.includes(k))return'ts';if(BLKK.includes(k))return s==='stop-4way'||s==='stop-left'?'ix':'tm';if(SPK.includes(k))return'sp';if(FDK.includes(k))return'fd';if(k==='solidX'||k==='onShoulder')return'pm';
 if(s==='three-point')return'bk';if(['hill-park','parallel','stall','headin'].includes(s))return'pk';if(s==='stop-4way')return'ix';if(['red-right','green-right','green-left','stop-left'].includes(s))return'tm';return'rw'}
function dqKeyG(k,s){if(COLK.includes(k))return'col';if(SIGK.includes(k)||k==='speedF'||k==='solidX')return'law';if(SKK.includes(k))return'skill';return'dan'}
function dqHtml(S,crit,many,zh){const g=S.level==='g',L=g?DQG:DQ2,on=new Set();crit.forEach(c=>on.add(g?dqKeyG(c.e.k,c.step.s):dqKey2(c.e.k,c.step.s)));if(many)on.add('many');
 return '<div class="dq"><h4>'+(g?'REASONS FOR DISQUALIFICATION':'SUMMARY REASONS FOR DISQUALIFICATION')+(zh?' · 不合格的理由':'')+'</h4><ul>'+L.map(([id,en,z])=>'<li class="'+(on.has(id)?'on':'')+'"><i>'+(on.has(id)?'✕':'')+'</i><span>'+esc(en)+(zh?'<small>'+esc(z)+'</small>':'')+'</span></li>').join('')+'</ul></div>'}
window.SHEET_MAPS={G2,G,MAPG2,MAPG};
})();
