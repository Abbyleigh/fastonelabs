"""Refresh pinned public embed metadata. Never downloads a model or authenticates."""
from pathlib import Path
from urllib.request import urlopen
import json
ROOT=Path(__file__).resolve().parents[1]
PINNED={'lotus-49':'9146a7f36cc140f2b9805965ccaade51','lotus-79':'cd0c94db4b81455aa85817f1886d2ff6','fw14b':'e84d5941fd354881abdd97ca791e8e2a','f2004':'827e64acecba4f008759ae30a5bfeecc'}
out={}
for car,uid in PINNED.items():
 with urlopen('https://api.sketchfab.com/v3/models/'+uid,timeout=15)as r:d=json.load(r)
 lic=d.get('license')or{}
 if lic.get('slug')not in ['by','cc0']:raise ValueError('Review changed licence before enabling '+car)
 out[car]=[dict(uid=uid,name=d['name'],creator=d['user'].get('displayName')or d['user']['username'],license=lic['fullName'],licenseUrl=lic['url'].replace('http://','https://'),requirements=lic.get('requirements',''),downloadable=bool(d.get('isDownloadable')),source='https://sketchfab.com/models/'+uid,triangles=d.get('faceCount'),checked='2026-10-28',accuracy='Creator representation; historical accuracy not independently reviewed',use='Official embedded viewer only; no local mesh import or commercial deployment approval',commercialReview=False)]
(ROOT/'frontend/src/heritageModels.ts').write_text('// Pinned public Sketchfab API metadata; no model bytes or downloads.\nexport const heritageModels:Record<string,{uid:string;name:string;creator:string;license:string;licenseUrl:string;requirements:string;downloadable:boolean;source:string;triangles:number|null;checked:string;accuracy:string;use:string;commercialReview:boolean}[]>='+json.dumps(out,ensure_ascii=False)+';\n')
print('Reviewed',len(out),'embed candidates; excluded wrong-year MP4/1 and MP4/4 search results.')
