"""Fetch only permitted CC BY 4.0 catalogue thumbnails. Never downloads model meshes."""
from pathlib import Path
import json,hashlib,re
from datetime import datetime,timezone
from urllib.request import Request,urlopen
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor
root=Path(__file__).resolve().parents[1];dest=root/'frontend/public/images/vehicles';dest.mkdir(parents=True,exist_ok=True)
assets=json.loads((root/'backups/vehicle-preview-input.json').read_text())
def fetch(url,limit):
    with urlopen(Request(url,headers={'User-Agent':'FastOneLabs/1.0'}),timeout=25) as response:
        data=response.read(limit+1)
        if len(data)>limit:raise ValueError('Preview exceeds size limit')
        return data

def one(asset):
    uid=re.search(r'([a-f0-9]{32})/?$',asset['source']).group(1)
    meta=json.loads(fetch('https://api.sketchfab.com/v3/models/'+uid,2_000_000))
    licence=meta.get('license',{})
    if licence.get('slug')!='by' or 'creativecommons.org/licenses/by/4.0' not in licence.get('url',''):raise ValueError(asset['id']+': licence requires review; thumbnail not downloaded')
    thumbs=[t for t in meta.get('thumbnails',{}).get('images',[]) if 200<=t.get('width',0)<=720 and t.get('width',0)>t.get('height',0)]
    thumb=max(thumbs,key=lambda t:t['width']);url=thumb['url']
    if urlparse(url).scheme!='https' or urlparse(url).hostname!='media.sketchfab.com':raise ValueError('Unrecognised image host')
    image=fetch(url,1_000_000)
    if not image.startswith(b'\xff\xd8'):raise ValueError('Expected original JPEG thumbnail')
    (dest/(asset['id']+'.jpg')).write_bytes(image)
    return {'id':asset['id'],'path':'/images/vehicles/'+asset['id']+'.jpg','modelName':meta.get('name'),'creator':meta.get('user',{}).get('displayName') or asset['author'],'source':asset['source'],'thumbnailSource':url,'license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','modifications':'Original creator thumbnail, displayed resized without modifying the file.','bytes':len(image),'sha256':hashlib.sha256(image).hexdigest(),'checked':datetime.now(timezone.utc).isoformat()}
with ThreadPoolExecutor(max_workers=3) as pool: records=list(pool.map(one,assets))
(dest/'ATTRIBUTION.json').write_text(json.dumps(records,indent=2)+'\n')
(root/'frontend/src/vehiclePreviews.ts').write_text('export const vehiclePreviews:Record<string,string>='+json.dumps({r['id']:r['path'] for r in records})+';\n')
print(f"Prepared {len(records)} credited previews, {sum(r['bytes'] for r in records):,} bytes total.")
