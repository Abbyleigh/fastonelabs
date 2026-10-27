"""Small cached BBC RSS reader. Only fixed publisher URLs are requested."""
from datetime import datetime,timezone
from email.utils import parsedate_to_datetime
from html import unescape
from pathlib import Path
from threading import Lock
from urllib.parse import urlsplit
from urllib.request import Request,urlopen
import json,re,time,xml.etree.ElementTree as ET

CACHE=Path(__file__).resolve().parent/'.news-cache.json'
LOCK=Lock()
FEEDS={'headlines':'https://feeds.bbci.co.uk/sport/formula1/rss.xml','radio':'https://podcasts.files.bbci.co.uk/p02nrsjn.rss'}
BBC={'www.bbc.co.uk','bbc.co.uk','www.bbc.com','bbc.com'}

def text(value):return unescape(re.sub('<[^>]+>','',value or '')).strip()[:300]
def safe_link(url,hosts):
 try:
  p=urlsplit(url or '')
  if p.scheme not in ('http','https') or p.hostname not in hosts or p.username or p.password:return None
  return 'https://'+p.netloc+p.path+('?' +p.query if p.query else '')
 except (TypeError,ValueError):return None

def parse_feed(raw,kind):
 if len(raw)>2_000_000 or b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():raise ValueError('Unsupported feed')
 root=ET.fromstring(raw);items=[];seen=set()
 for item in root.findall('./channel/item'):
  title=text(item.findtext('title'));link=safe_link(item.findtext('link'),BBC)
  if not title or not link or link in seen:continue
  try:published=parsedate_to_datetime(item.findtext('pubDate')).astimezone(timezone.utc).isoformat()
  except (TypeError,ValueError,OverflowError,AttributeError):continue
  if datetime.fromisoformat(published)>datetime.now(timezone.utc):continue
  row={'title':title,'url':link,'published_at':published,'source':'BBC Sport' if kind=='headlines' else 'BBC Radio 5 Live · F1: Chequered Flag'}
  if kind=='radio':
   secure=item.find('{http://bbc.co.uk/2009/01/ppgRss}enclosureSecure')
   row['audio_url']=safe_link(secure.get('url') if secure is not None else None,{'open.live.bbc.co.uk','podcasts.files.bbci.co.uk'})
   row['duration']=text(item.findtext('{http://www.itunes.com/dtds/podcast-1.0.dtd}duration'))
  items.append(row);seen.add(link)
 return sorted(items,key=lambda r:r['published_at'],reverse=True)[:12 if kind=='headlines' else 4]

def download(url):
 with urlopen(Request(url,headers={'User-Agent':'F1StrategyLab/1.0 RSS reader'}),timeout=10) as response:return response.read(2_000_001)

def load_news(fetch=download,cache_path=CACHE,now=None):
 now=time.time() if now is None else now
 with LOCK:
  try:cache=json.loads(cache_path.read_text())
  except (OSError,ValueError):cache={}
  if now-cache.get('checked_timestamp',0)<180:return cache
  result={'checked_timestamp':now,'checked_at':datetime.fromtimestamp(now,timezone.utc).isoformat(),'refresh_seconds':180,'feeds':{}}
  for kind,url in FEEDS.items():
   try:
    items=parse_feed(fetch(url),kind)
    if not items:raise ValueError('Empty publisher feed')
    result['feeds'][kind]={'items':items,'updated_at':result['checked_at'],'stale':False,'error':None}
   except Exception:
    previous=cache.get('feeds',{}).get(kind,{})
    result['feeds'][kind]={'items':previous.get('items',[]),'updated_at':previous.get('updated_at'),'stale':True,'error':'Publisher feed unavailable. Showing saved items if available.'}
  try:
   temporary=cache_path.with_suffix('.tmp');temporary.write_text(json.dumps(result));temporary.replace(cache_path)
  except OSError:pass
  return result
