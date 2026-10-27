"""Run the gate checks in the existing environment, without upgrading packages."""
from pathlib import Path
import shutil,subprocess,sys
root=Path(__file__).resolve().parents[1]
python=root/'backend/.venv312/bin/python'
if not python.exists():python=Path(sys.executable)
npm=shutil.which('npm')
if not npm:raise SystemExit('Node/npm is required for frontend checks.')
commands=[[str(python),'-m','pytest','-q'],[npm,'--prefix','frontend','test'],[str(python),'tools/generate_race_contract.py','--check'],[npm,'--prefix','frontend','run','build']]
for command in commands:
 result=subprocess.run(command,cwd=root)
 if result.returncode:raise SystemExit(result.returncode)
print('All gate checks passed.')
