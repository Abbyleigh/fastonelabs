from pathlib import Path
import subprocess,sys,signal,re,json,urllib.request,shutil,time
ROOT=Path(__file__).resolve().parents[1]
children=[]
def cleanup(*args):
 for child in reversed(children):
  if child.poll() is None:child.terminate()
 for child in children:
  try:child.wait(timeout=5)
  except subprocess.TimeoutExpired:child.kill()
 (ROOT/'demo/share-url.txt').unlink(missing_ok=True)
def stop(*args):raise KeyboardInterrupt
signal.signal(signal.SIGTERM,stop)
try:
 with urllib.request.urlopen('http://127.0.0.1:8001/api/health',timeout=3) as response:
  if json.load(response).get('status')!='ok':raise RuntimeError('Start the F1 backend first.')
 binary=shutil.which('cloudflared') or '/opt/homebrew/bin/cloudflared'
 if not (ROOT/'frontend/dist/index.html').exists():raise RuntimeError('Build the frontend first.')
 server=subprocess.Popen([sys.executable,str(ROOT/'demo/server.py')]);children.append(server)
 time.sleep(.5)
 if server.poll() is not None:raise RuntimeError('Demo port 8765 is already occupied or unavailable.')
 print('\nSharing F1 Strategy Lab. Keep this window open. Control+C stops sharing.\n',flush=True)
 tunnel=subprocess.Popen([binary,'tunnel','--url','http://127.0.0.1:8765','--no-autoupdate'],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True);children.append(tunnel)
 for line in tunnel.stdout:
  print(line,end='',flush=True)
  match=re.search(r'https://[a-z0-9-]+\.trycloudflare\.com',line)
  if match:
   (ROOT/'demo/share-url.txt').write_text(match.group(0))
   print('\nSEND THIS LINK: '+match.group(0)+'\nAnyone with this link can open the demo. Control+C ends access.\n',flush=True)
 if tunnel.wait()!=0:raise RuntimeError('The sharing tunnel stopped unexpectedly.')
except KeyboardInterrupt:print('\nSharing stopped.',flush=True)
except Exception as error:print(f'\nDemo could not start: {error}',file=sys.stderr);sys.exit(1)
finally:cleanup()
