# 把全景图里方方的座椅头枕改圆：上面两个角做成大圆角，顶部略微拱起，再加一点上亮下暗的明暗，看起来是圆鼓鼓的软头枕
import sys,math
from PIL import Image
src,dst=sys.argv[1],sys.argv[2]
im=Image.open(src).convert('RGBA');px=im.load();W,H=im.size
def top(x):
    g=None
    for y in range(560,900):
        a=px[x,y][3]
        if g is None:
            if a<10:g=y
        elif a>128:return y
    return None
HRS=[(3033,3105),(3212,3320),(3411,3500),(3732,3908)]
for x0,x1 in HRS:
    cols=[x for x in range(x0,x1+1) if top(x) and top(x)>640 and px[x,top(x)-14][3]<10]
    if not cols:continue
    a,b=min(cols),max(cols);w=b-a;yT=min(top(x) for x in cols);r=w*.42
    print('headrest',a,b,'top',yT,'r',round(r))
    for x in list(range(a-12,a))+list(range(b+1,b+13)):      # 原来方头枕两边的半透明柔边，圆角以上的部分清掉
        if px[x,yT-16][3]>10:continue
        for y in range(yT-16,int(yT+r)):
            if px[x,y][3]<235:px[x,y]=(0,0,0,0)
    for x in cols:
        t0=top(x);dx=max(0,(a+r)-x,x-(b-r));nt=yT+ (r-math.sqrt(max(0,r*r-dx*dx)))*1.0
        for y in range(t0-12,int(nt)+1):px[x,y]=(0,0,0,0)
        # 抗锯齿：新边缘那一个像素半透明
        fy=int(nt)+1;fr=nt-int(nt)
        if fy<H and px[x,fy][3]>0:c=px[x,fy];px[x,fy]=(c[0],c[1],c[2],int(255*(1-fr*.8)))
        # 明暗：顶部稍亮、往下渐暗，左右两边也稍暗，像圆鼓的头枕
        hh=int(w*1.0)
        for y in range(int(nt)+2,min(H,int(nt)+2+hh)):
            c=px[x,y]
            if c[3]<200:continue
            k=(y-nt)/hh;side=abs((x-(a+b)/2)/(w/2))
            d=int((10-14*side**3)*max(0,1-k)**1.5)
            px[x,y]=(max(0,min(255,c[0]+d)),max(0,min(255,c[1]+d)),max(0,min(255,c[2]+d)),c[3])
im.save(dst)
