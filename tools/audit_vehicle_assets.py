"""Audit installed GLBs without changing original bytes or inferring physical scale."""
from pathlib import Path
import json, struct, hashlib
ROOT=Path(__file__).resolve().parents[1]
rows={}
for info in (ROOT/'frontend/public/models/cars').glob('*/*/model-info.json'):
 d=json.loads(info.read_text()); p=next(info.parent.glob('*.glb')); raw=p.read_bytes(); n=struct.unpack_from('<I',raw,12)[0]; gltf=json.loads(raw[20:20+n]); triangles=0
 for mesh in gltf.get('meshes',[]):
  for prim in mesh['primitives']:
   if prim.get('mode',4)==4: triangles+=gltf['accessors'][prim.get('indices',prim['attributes']['POSITION'])]['count']//3
 manifest=json.loads((p.parent/'engineering-parts.json').read_text()); sha=hashlib.sha256(raw).hexdigest()
 rows[d.get('id',info.parent.parent.name+'-'+str(d['season']))]={'bytes':len(raw),'triangles':triangles,'meshes':len(gltf.get('meshes',[])),'sha256':sha,'components':manifest['available'],'mappingMatches':manifest.get('source_sha256')==sha,'dimensions':None,'scaleNote':'Normalised to six viewer units; physical dimensions unverified.'}
(ROOT/'frontend/src/vehicleAudit.ts').write_text('// Measured from installed GLBs. Regenerate with tools/audit_vehicle_assets.py.\nexport const vehicleAudit = '+json.dumps(rows,indent=2)+' as const;\n')
print(f'Audited {len(rows)} cars')
