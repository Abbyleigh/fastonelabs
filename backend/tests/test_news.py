import sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from news import parse_feed,load_news,safe_link
XML=b'''<rss xmlns:ppg="http://bbc.co.uk/2009/01/ppgRss"><channel><item><title>F1 &amp; strategy</title><link>http://www.bbc.co.uk/sport/formula1/articles/abc</link><pubDate>Tue, 01 Oct 2024 12:00:00 GMT</pubDate><ppg:enclosureSecure url="https://open.live.bbc.co.uk/clip.mp3"/></item></channel></rss>'''
class NewsTests(unittest.TestCase):
 def test_parse_text_time_and_secure_audio(self):
  result=parse_feed(XML,'radio');self.assertEqual(result[0]['title'],'F1 & strategy');self.assertTrue(result[0]['url'].startswith('https://'));self.assertEqual(result[0]['audio_url'],'https://open.live.bbc.co.uk/clip.mp3')
 def test_reject_external_and_active_urls(self):
  for url in ('javascript:alert(1)','https://bbc.co.uk.evil.example/a','https://user:secret@www.bbc.co.uk/a'):
   self.assertIsNone(safe_link(url,{'www.bbc.co.uk'}))
  self.assertEqual(parse_feed(XML.replace(b'www.bbc.co.uk',b'evil.example'),'headlines'),[])
 def test_no_entities_or_oversized_xml(self):
  for raw in (b'<!DOCTYPE rss><rss/>',b'<!ENTITY unsafe "x">',b' '*2000001):
   with self.assertRaises(ValueError):parse_feed(raw,'headlines')
 def test_cache_refresh_and_independent_failure(self):
  with tempfile.TemporaryDirectory()as directory:
   path=Path(directory)/'cache.json';calls=[]
   def fetch(url):calls.append(url);return XML
   initial=load_news(fetch,path,1000);self.assertFalse(initial['feeds']['headlines']['stale']);load_news(fetch,path,1100);self.assertEqual(len(calls),2)
   def partial(url):
    if 'formula1' in url:raise OSError('offline')
    return XML
   updated=load_news(partial,path,1300);self.assertTrue(updated['feeds']['headlines']['stale']);self.assertEqual(updated['feeds']['headlines']['items'],initial['feeds']['headlines']['items']);self.assertFalse(updated['feeds']['radio']['stale']);self.assertEqual(updated['feeds']['headlines']['updated_at'],initial['feeds']['headlines']['updated_at'])
