import sys,numpy as np
from PIL import Image
a=np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.float32)/255
s=np.clip((np.minimum(a[...,0],a[...,2])-a[...,1])*1.15,0,1)      # 洋红占多少 = 透明度（玻璃、车外）
al=1-s;m=np.array([1,0,1],np.float32)
obj=(a-s[...,None]*m)/np.maximum(al,1e-3)[...,None]
obj=np.clip(obj,0,1)
# 全部压成统一的深灰（和原来的内饰一个颜色），只留一点明暗看得出形状，不抢眼
L=obj@np.array([.299,.587,.114],np.float32);base=np.array([36,40,46],np.float32)/255
obj=np.clip(base*(.5+1.5*L[...,None]),0,1)
out=np.dstack([obj,al])
out[al<.02]=0
Image.fromarray((out*255+.5).astype(np.uint8),'RGBA').save(sys.argv[2],optimize=True)
