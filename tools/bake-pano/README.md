# 烘焙车内全景图 assets/pano3.png

1. 把车模 car.glb（用户提供的 mmc_generic_small_suv_car.glb，19 MB，不放进仓库）和 three.min.js（r128）放在本目录
2. `python3 -m http.server 8766`（在本目录）
3. `node bake.js '{"W":8192,"H":2738,"cube":4096,"eye":[0.37,0.5,-0.2],"hide":"dashboard|steering|pedals|center-console|seat-front-left|rearview-mirror","hemi":0.9,"dir":0.5,"amb":0.4,"flip":"1.0","dark":0.55,"roof":"#121418"}' raw8.png`
4. `python3 alpha.py raw8.png big.png`（洋红 = 玻璃和车外 → 透明）
5. 缩到 4096×1369：`python3 -c "from PIL import Image;Image.open('big.png').convert('RGBa').resize((4096,1369),Image.LANCZOS).convert('RGBA').save('pano3.png')"`

eye = 驾驶员眼睛在车模坐标里的位置（x 左、y 上、z 前，米）。仪表台、方向盘、驾驶座、车模自己的中镜不烘进去（游戏里用 3D 的）。天窗玻璃、天窗框和顶棚统一画成一块平的深色顶棚；alpha.py 再把所有内饰压成统一的深灰（36,40,46 上下），只留一点明暗。
