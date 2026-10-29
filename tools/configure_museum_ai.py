"""Run locally to configure the optional museum AI. Never paste keys in chat."""
from pathlib import Path
import getpass, os
root=Path(__file__).resolve().parents[1]
key=getpass.getpass('Groq API key (hidden): ').strip()
model=input('Groq chat-completion model ID from your account: ').strip()
if not key or not model or any(c in key+model for c in '\r\n'):
 raise SystemExit('No configuration saved: key and model are required.')
path=root/'backend/.env.museum'
fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
with os.fdopen(fd,'w')as f:f.write('MUSEUM_AI_ENABLED=1\nGROQ_API_KEY='+key+'\nMUSEUM_AI_MODEL='+model+'\n')
os.chmod(path,0o600)
print('Private configuration saved. Start with: backend/.venv312/bin/python tools/start_museum_backend.py')
