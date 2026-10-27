"""Public Commons racing-photo lookup; cache credit and licence with each image."""
from urllib.request import Request,urlopen
from urllib.parse import urlencode
from pathlib import Path
import json,re,time,html,unicodedata
CACHE=Path(__file__).resolve().parent/'.media-cache';CACHE.mkdir(exist_ok=True)
def plain(value):return html.unescape(re.sub('<[^>]*>','',value or '')).strip()[:1000]
def find_media(id,name):
    catalog_path=Path(__file__).resolve().parent/'driver_photo_catalog.json'
    if catalog_path.exists():
        catalog=json.loads(catalog_path.read_text())
        if id in catalog:return catalog[id]
    path=CACHE/(id+'.json')
    if path.exists() and time.time()-path.stat().st_mtime<604800:
        cached=json.loads(path.read_text())
        if cached.get('lookup_version')==4 and cached.get('photos'):return cached
    # Commons image metadata supplies attribution and the source file page.
    lookup={'antonelli':'Kimi Antonelli','perez':'Sergio Perez'}.get(id,name)
    params={'action':'query','generator':'search','gsrsearch':f'"{lookup}"','gsrnamespace':6,'gsrlimit':20,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':1280,'format':'json'}
    req=Request('https://commons.wikimedia.org/w/api.php?'+urlencode(params),headers={'User-Agent':'F1StrategyLab/1.0 (educational driver gallery)'})
    try:
        with urlopen(req,timeout=20) as response:data=json.load(response)
        candidates=[]
        for page in sorted(data.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',99)):
            info=page.get('imageinfo',[{}])[0];meta=info.get('extmetadata',{});license=plain(meta.get('LicenseShortName',{}).get('value',''))
            title=page.get('title','');description=plain(meta.get('ImageDescription',{}).get('value',''))
            if not any(l in license.lower() for l in ('cc by','cc0','public domain')):continue
            if re.search(r'portrait|podium|signature|helmet|fanzone|press conference|cropped|safety car|museum|Thursday|Cannes|ceremony|Dakar|rally|fan[ -]*zone|award|stage|puppet|media tour|NASCAR|GP3|Formula 2|Formula 3|kart',title,re.I):continue
            if unicodedata.normalize('NFKD',lookup).encode('ascii','ignore').decode().lower() not in unicodedata.normalize('NFKD',title).encode('ascii','ignore').decode().lower():continue
            if not (re.search(r'FP[123]|qualifying|free practice|car\b|MCL[ -]?[0-9]|W0[0-9]|R26|SF[ -]?[0-9]',title,re.I) or re.search(r'driving|drives|alla guida|au volant|during.*practice|in his.*car',description,re.I)):continue
            if not re.search(r'car|driving|drives|racing|ferrari|mclaren|mercedes|red bull|williams|haas|sauber|alpine|audi|aston martin|toro rosso|renault',description+' '+title,re.I):continue
            image=info.get('thumburl') or info.get('url','')
            if not image.startswith(('https://upload.wikimedia.org/','https://thumb.wikimedia.org/')):continue
            candidates.append({'url':image,'source':info.get('descriptionurl') if info.get('descriptionurl','').startswith('https://commons.wikimedia.org/') else 'https://commons.wikimedia.org/','title':title.removeprefix('File:'),'description':description,'artist':plain(meta.get('Artist',{}).get('value','Unknown author')),'license':license,'license_url':meta.get('LicenseUrl',{}).get('value','') if meta.get('LicenseUrl',{}).get('value','').startswith('https://creativecommons.org/') else '','date':plain(meta.get('DateTimeOriginal',{}).get('value',''))})
        candidates.sort(key=lambda p:(bool(re.search(r'FP[123]|qualifying',p['title'],re.I)),bool(re.search(r'202[56]',p['title']))),reverse=True)
        result={'driver':name,'photos':candidates[:6],'lookup_version':4,'source':'Wikimedia Commons','notice':'Archive photographs; the car/team/year may differ from the latest race.'}
        path.write_text(json.dumps(result));return result
    except Exception:
        if path.exists():return json.loads(path.read_text())
        return {'driver':name,'photos':[],'source':'Wikimedia Commons','notice':'Racing photos are temporarily unavailable. You can still use the 3D viewer.'}
