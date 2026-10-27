"""Group existing triangles for inspection; preserve every source triangle and texture."""
from pathlib import Path
import json,struct,hashlib,numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
ROOT=Path(__file__).resolve().parents[1]/'frontend/public/models/cars'
NAMES=['body','frontWing','rearWing','floor','power','wheels','wheels','wheels','wheels','suspension']
for source in sorted(ROOT.glob('*/*/*.glb')):
 raw=source.read_bytes();length=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+length]);binary=20+length+8
 def accessor(i):
  a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];cols={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];dt=np.dtype({5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]);return np.ndarray((a['count'],cols),dtype=dt,buffer=raw,offset=binary+v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',dt.itemsize*cols),dt.itemsize))
 world={}
 def walk(i,parent):
  n=j['nodes'][i]
  if 'matrix'in n:m=np.array(n['matrix']).reshape((4,4),order='F')
  else:
   x,y,z,w=n.get('rotation',[0,0,0,1]);m=np.eye(4);m[:3,:3]=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0])
  world[i]=parent@m
  for c in n.get('children',[]):walk(c,world[i])
 for i in j['scenes'][j.get('scene',0)]['nodes']:walk(i,np.eye(4))
 rows=[];offset=0
 for ni,n in enumerate(j['nodes']):
  if 'mesh'not in n:continue
  primitives=j['meshes'][n['mesh']]['primitives'];assert len(primitives)==1,'Inspect a multi-primitive node before preparing it'
  p=primitives[0];assert p.get('mode',4)==4
  pts=accessor(p['attributes']['POSITION']);pts=(np.c_[pts,np.ones(len(pts))]@world[ni].T)[:,:3];faces=accessor(p['indices']).reshape(-1,3).astype(np.int64)if 'indices'in p else np.arange(len(pts)).reshape(-1,3)
  rows.append({'name':n['name'],'pts':pts,'faces':faces,'offset':offset,'material':j.get('materials',[])[p.get('material',0)].get('name','')});offset+=len(pts)
 points=np.concatenate([r['pts']for r in rows]);lo=points.min(0);hi=points.max(0);turn=np.array([[0,0,1],[0,1,0],[-1,0,0]])if (hi-lo)[0]>(hi-lo)[2]else np.eye(3)
 points=points@turn.T;lo=points.min(0);hi=points.max(0);centre=(lo+hi)/2;centre[1]=lo[1];scale=6/(hi-lo)[2];points=(points-centre)*scale;points[:,[0,2]]*=-1
 triangles=np.concatenate([r['faces']+r['offset']for r in rows]);_,inverse=np.unique(np.rint(points*100000).astype(np.int64),axis=0,return_inverse=True);faces=inverse[triangles]
 edges=np.concatenate([faces[:,[0,1]],faces[:,[1,2]]]);graph=coo_matrix((np.ones(len(edges),dtype=np.uint8),(edges[:,0],edges[:,1])),shape=(int(inverse.max())+1,)*2).tocsr();count,labels=connected_components(graph,directed=False);vertex_group=labels[inverse]
 mins=np.full((count,3),np.inf);maxs=np.full((count,3),-np.inf);np.minimum.at(mins,vertex_group,points);np.maximum.at(maxs,vertex_group,points);sizes=maxs-mins;centres=(mins+maxs)/2
 wheel_candidates=(np.abs(centres[:,0])>.6)&(sizes[:,0]<.7)&(sizes[:,1]>.43)&(sizes[:,2]>.43)&(sizes[:,2]<1.3)&(maxs[:,1]<1.05)&(mins[:,1]<.28)&(np.abs(centres[:,2])>1)
 wheel_centres=centres[wheel_candidates]
 component_parts=np.zeros(count,dtype=np.uint8)
 for k,(lo,hi,size,c) in enumerate(zip(mins,maxs,sizes,centres)):
  wheel=wheel_candidates[k] or (len(wheel_centres)>0 and size[0]<.7 and hi[1]<1.05 and np.min(np.linalg.norm((wheel_centres-c)[:,[0,2]],axis=1))<.4)
  if wheel:component_parts[k]=5+(0 if c[2]<0 else 2)+(0 if c[0]<0 else 1)
  elif hi[2]<-1.95 and hi[1]<.8 and (size[0]>.8 or abs(c[0])>.65):component_parts[k]=1
  elif lo[2]>1.75 and hi[1]>.75 and (size[0]>.7 or abs(c[0])>.6):component_parts[k]=2
  elif hi[1]<.48 and size[2]>2 and size[0]>.85:component_parts[k]=3
  elif size[0]>.28 and size[1]<.18 and size[2]<.65 and 1<abs(c[2])<2.5 and hi[1]<.9:component_parts[k]=9
 data=bytearray();entries=[];counts={name:0 for name in set(NAMES)}
 for r in rows:
  ids=component_parts[vertex_group[r['faces'][:,0]+r['offset']]].copy();mat=r['material'].lower()
  if any(token in mat for token in ['sidewall','tread','wheel_hub','wheelhub','discs','tyre','tire','rim_']):
   c=points[r['faces']+r['offset']].mean(1);ids=(5+(c[:,2]>=0)*2+(c[:,0]>=0)).astype(np.uint8)
  bounds={}
  for code in np.unique(ids):
   used=points[r['faces'][ids==code]+r['offset']].reshape(-1,3);bounds[str(int(code))]={'min':used.min(0).tolist(),'max':used.max(0).tolist()};counts[NAMES[int(code)]]+=int(np.count_nonzero(ids==code))
  entries.append({'name':r['name'],'offset':len(data),'triangles':len(ids),'bounds':bounds});data.extend(ids.tobytes())
 manifest={'version':1,'source_sha256':hashlib.sha256(raw).hexdigest(),'source':source.name,'method':'Connected-surface and material grouping of original triangles; approximate inspection groups, not manufacturer part boundaries. No triangles, UVs or textures changed.','normalization':{'turn':turn.flatten().tolist(),'centre':centre.tolist(),'scale':scale},'entries':entries,'counts':counts,'available':[name for name,c in counts.items()if c>0],'triangle_count':len(triangles)}
 (source.parent/'engineering-parts.bin').write_bytes(data);(source.parent/'engineering-parts.json').write_text(json.dumps(manifest,separators=(',',':')))
 print(source.parent.relative_to(ROOT),count,'surfaces',counts,flush=True)
