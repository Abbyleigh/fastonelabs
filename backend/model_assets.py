"""Read source-equivalent GLBs, including lossless static-host distribution parts."""
from pathlib import Path
import gzip,hashlib,json
PUBLIC=Path(__file__).resolve().parents[1]/'frontend/public'
def read_model_bytes(path):
 path=Path(path)
 if path.exists():return path.read_bytes()
 logical='/'+str(path.resolve().relative_to(PUBLIC.resolve()))
 manifest=json.loads((PUBLIC/'models/packed-models.json').read_text())['models'][logical]
 chunks=[]
 for part in manifest['chunks']:
  raw=(PUBLIC/part['path'].lstrip('/')).read_bytes()
  if len(raw)!=part['bytes']:raise ValueError('Model part length mismatch')
  chunks.append(raw)
 compressed=b''.join(chunks)
 if hashlib.sha256(compressed).hexdigest()!=manifest['compressedSha256']:raise ValueError('Compressed integrity mismatch')
 raw=gzip.decompress(compressed)
 if len(raw)!=manifest['bytes']or hashlib.sha256(raw).hexdigest()!=manifest['sha256']:raise ValueError('Model integrity mismatch')
 return raw
