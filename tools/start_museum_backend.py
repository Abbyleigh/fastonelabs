"""Launch the existing API with optional private museum configuration."""
from pathlib import Path
import os, sys
root=Path(__file__).resolve().parents[1]
config=root/'backend/.env.museum'
allowed={'MUSEUM_AI_ENABLED','OPENAI_API_KEY','MUSEUM_AI_MODEL'}
if config.exists():
 if config.stat().st_mode&0o077:raise SystemExit('Private AI config permissions must be 600.')
 for line in config.read_text().splitlines():
  key,separator,value=line.partition('=')
  if separator and key in allowed:os.environ[key]=value
os.chdir(root/'backend')
os.execv(sys.executable,[sys.executable,'-m','uvicorn','main:app','--host','127.0.0.1','--port','8001'])
