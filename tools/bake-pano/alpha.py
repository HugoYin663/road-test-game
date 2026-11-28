import sys,numpy as np
from PIL import Image
a=np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(np.float32)/255
s=np.clip((np.minimum(a[...,0],a[...,2])-a[...,1])*1.15,0,1)      # 洋红占多少 = 透明度（玻璃、车外）
al=1-s;m=np.array([1,0,1],np.float32)
obj=(a-s[...,None]*m)/np.maximum(al,1e-3)[...,None]
obj=np.clip(obj,0,1);out=np.dstack([obj,al])
out[al<.02]=0
Image.fromarray((out*255+.5).astype(np.uint8),'RGBA').save(sys.argv[2],optimize=True)
