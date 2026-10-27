#!/usr/bin/env python3
"""Install a self-contained GLB, keep a backup, build, and restore on failure."""
from pathlib import Path
from datetime import datetime
import argparse,json,struct,shutil,subprocess,re,sys
ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('file',type=Path)
kind=parser.add_mutually_exclusive_group(required=True);kind.add_argument('--car',action='store_true');kind.add_argument('--driver',metavar='DRIVER_ID')
parser.add_argument('--creator',default='Custom model creator')
parser.add_argument('--source',default='')
parser.add_argument('--license',default='See accompanying model licence')
args=parser.parse_args()
try:
    source=args.file.expanduser().resolve()
    if not source.is_file() or source.stat().st_size>150*1024*1024:raise ValueError('Choose a GLB file smaller than 150 MB.')
    data=source.read_bytes()
    if len(data)<20 or data[:4]!=b'glTF' or struct.unpack_from('<I',data,4)[0]!=2 or struct.unpack_from('<I',data,8)[0]!=len(data):raise ValueError('Not a valid binary glTF 2 file.')
    size,kind=struct.unpack_from('<II',data,12)
    if kind!=0x4E4F534A:raise ValueError('Missing model JSON chunk.')
    model=json.loads(data[20:20+size])
    for resource in model.get('buffers',[])+model.get('images',[]):
        uri=resource.get('uri','')
        if uri and not uri.startswith('data:'):raise ValueError('Use a self-contained GLB with embedded textures and buffers.')
    if args.driver and not re.fullmatch('[a-z0-9_-]{1,80}',args.driver):raise ValueError('Driver ID must use lowercase letters, digits, underscores or hyphens.')
    target=ROOT/'frontend/public/models'/('cars/f1-assembly.glb' if args.car else f'drivers/{args.driver}.glb')
    backup=ROOT/'backups'/('model-install-'+datetime.now().strftime('%Y%m%d-%H%M%S'));backup.mkdir(parents=True)
    metadata=target.parent/'model-info.json' if args.car else None
    metadata_existed=metadata is not None and metadata.exists()
    if metadata_existed:shutil.copy2(metadata,backup/metadata.name)
    existed=target.exists()
    if existed:shutil.copy2(target,backup/target.name)
    target.parent.mkdir(parents=True,exist_ok=True)
    if source!=target:shutil.copy2(source,target)
    if metadata:metadata.write_text(json.dumps({'name':source.stem,'author':args.creator,'source':args.source if args.source.startswith('https://') else '', 'license':args.license,'licenseUrl':'','note':'Installed custom model. Display fitted automatically; disassembly depends on separate, named component meshes.'},indent=2))
    try:
        npm=shutil.which('npm') or '/opt/homebrew/bin/npm'
        subprocess.run([npm,'run','build'],cwd=ROOT/'frontend',check=True)
    except BaseException:
        if metadata:
            if metadata_existed:shutil.copy2(backup/metadata.name,metadata)
            else:metadata.unlink(missing_ok=True)
        if existed:shutil.copy2(backup/target.name,target)
        else:target.unlink(missing_ok=True)
        raise
    print(f'Installed {target}\nBackup: {backup}\nRefresh the app. Keep the model author and licence credits with the asset.')
except Exception as error:
    print(f'Install failed: {error}',file=sys.stderr);sys.exit(1)
