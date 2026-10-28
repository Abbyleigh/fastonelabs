from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote
from urllib.request import urlopen
from urllib.error import HTTPError, URLError
import re
ROOT=Path(__file__).resolve().parents[1]/'frontend/dist'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def list_directory(self,path):self.send_error(404);return None
 def do_GET(self):
  path=urlsplit(self.path).path
  if path.startswith('/api/'):
   if not re.fullmatch(r'/api/(?:health|news|museum/historian|race-state(?:/(?:schema|verify))?|track|calendar|replay/(?:sample|multi)|archive/(?:season|drivers|race/\d{4}/\d{1,2}|driver/[a-zA-Z0-9_-]+))',path):self.send_error(404);return
   try:
    with urlopen('http://127.0.0.1:8001'+self.path,timeout=90) as response:
     body=response.read(64*1024*1024);self.send_response(response.status);self.send_header('Content-Type',response.headers.get('Content-Type','application/json'));self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
   except HTTPError as e:self.send_error(e.code)
   except (URLError,TimeoutError):self.send_error(502,'Race data unavailable')
   return
  resolved=(ROOT/unquote(path).lstrip('/')).resolve()
  if not resolved.is_relative_to(ROOT.resolve()) or not (path in ('/','/index.html','/favicon.ico') or path.startswith(('/assets/','/models/','/images/'))):self.send_error(404);return
  super().do_GET()
 def do_HEAD(self):
  path=urlsplit(self.path).path
  resolved=(ROOT/unquote(path).lstrip('/')).resolve()
  if not resolved.is_relative_to(ROOT.resolve()) or not (path in ('/','/index.html','/favicon.ico') or path.startswith(('/assets/','/models/','/images/'))):self.send_error(404);return
  super().do_HEAD()
ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
