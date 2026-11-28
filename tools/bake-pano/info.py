import json,struct,numpy as np
f=open('car.glb','rb').read();L=struct.unpack('<I',f[12:16])[0];j=json.loads(f[20:20+L])
def q2m(q):
    x,y,z,w=q;return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def local(n):
    if 'matrix' in n:return np.array(n['matrix']).reshape(4,4).T
    M=np.eye(4);M[:3,:3]=q2m(n.get('rotation',[0,0,0,1]))@np.diag(n.get('scale',[1,1,1]));M[:3,3]=n.get('translation',[0,0,0]);return M
W={}
def walk(i,P):
    M=P@local(j['nodes'][i]);W[i]=M
    for c in j['nodes'][i].get('children',[]):walk(c,M)
for r in j['scenes'][0]['nodes']:walk(r,np.eye(4))
out=[]
for i,n in enumerate(j['nodes']):
    if 'mesh' not in n:continue
    lo=np.array([1e9]*3);hi=-lo
    for p in j['meshes'][n['mesh']]['primitives']:
        a=j['accessors'][p['attributes']['POSITION']];mn,mx=np.array(a['min']),np.array(a['max'])
        for c in np.array(np.meshgrid(*zip(mn,mx))).T.reshape(-1,3):
            w=(W[i]@np.r_[c,1])[:3];lo=np.minimum(lo,w);hi=np.maximum(hi,w)
    mats=set(j['materials'][p.get('material',0)]['name'] for p in j['meshes'][n['mesh']]['primitives'])
    out.append((n['name'],np.round(lo,2),np.round(hi,2),mats))
for o in out:print(o[0][:40].ljust(40),o[1],o[2],o[3])
