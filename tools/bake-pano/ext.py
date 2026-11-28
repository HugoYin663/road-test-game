import json,struct,numpy as np,base64
exec(open('info.py').read().split('out=[]')[0])
bin_off=20+L+8;BIN=f[bin_off:]
NC={5126:('f',4),5123:('H',2),5125:('I',4)}
def acc(i):
    a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];t,bs=NC[a['componentType']];n={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']]
    o=v.get('byteOffset',0)+a.get('byteOffset',0);st=v.get('byteStride',n*bs)
    return np.array([struct.unpack_from('<'+t*n,BIN,o+k*st) for k in range(a['count'])])
def get(name):
    for i,n in enumerate(j['nodes']):
        if n.get('name')==name:
            p=j['meshes'][n['mesh']]['primitives'][0];P=acc(p['attributes']['POSITION']);I=acc(p['indices']).ravel()
            P=(W[i]@np.c_[P,np.ones(len(P))].T).T[:,:3];return P,I
EYE=np.array([.37,.5,-.2])
def toC(P):return P-EYE+np.array([.38,0,0])      # 车模坐标 → 驾驶舱坐标（眼睛在 (.38,0,0)）
out={}
for k,nm in [('LB','mirror-left_body_0'),('LG','mirror-left_mirror_0'),('RB','mirror-right_body_0'),('RG','mirror-right_mirror_0'),('C','rearview-mirror-intern_interior_0')]:
    P,I=get(nm);P=toC(P);mn=P.min(0);mx=P.max(0);sc=(mx-mn).max()
    q=np.round((P-mn)/sc*65535).astype('<u2')
    out[k]={'mn':[round(x,5) for x in mn],'sc':round(float(sc),6),'p':base64.b64encode(q.tobytes()).decode(),'i':base64.b64encode(I.astype('<u2').tobytes()).decode(),'n':len(P)}
    print(k,len(P),len(I)//3,np.round(mn,3),np.round(mx,3))
open('mirgeo.json','w').write(json.dumps(out))
import os;print(os.path.getsize('mirgeo.json'))
# 中镜外形：看看朝驾驶员那一面
P,I=get('rearview-mirror-intern_interior_0');np.save('cm.npy',P)
