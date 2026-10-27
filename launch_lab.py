#!/usr/bin/env python3
"""Start local development services without stopping processes owned by the user."""
from pathlib import Path
import json, os, shutil, signal, socket, subprocess, sys, time, urllib.request
ROOT = Path(__file__).resolve().parent
OWNED = []

def occupied(port):
    with socket.socket() as sock:
        sock.settimeout(.3)
        return sock.connect_ex(('127.0.0.1', port)) == 0

def get(url):
    with urllib.request.urlopen(url, timeout=2) as response:
        return response.read().decode()

def backend_matches():
    try:
        return json.loads(get('http://127.0.0.1:8001/openapi.json'))['info']['title'] == 'F1 Strategy Lab API' and json.loads(get('http://127.0.0.1:8001/api/health'))['status'] == 'ok'
    except Exception:
        return False

def frontend_matches():
    try:
        source = get('http://127.0.0.1:5173/src/main.tsx')
        return 'StrategyWorkbench' in source and 'RaceBrowser' in source
    except Exception:
        return False

def cleanup(*_):
    for process in reversed(OWNED):
        if process.poll() is None:
            try: os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError: pass
    for process in OWNED:
        try: process.wait(timeout=6)
        except subprocess.TimeoutExpired:
            try: os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError: pass
    OWNED.clear()

def main():
    python = ROOT/'backend/.venv312/bin/python'
    npm = shutil.which('npm') or next((p for p in ['/opt/homebrew/bin/npm','/usr/local/bin/npm'] if Path(p).exists()), None)
    if not python.exists() or not npm:
        raise RuntimeError('Python environment or npm is missing. Expected backend/.venv312 and an installed Node.js.')
    if not (ROOT/'frontend/node_modules/vite').exists():
        raise RuntimeError('Frontend dependencies are missing. Run npm install in the frontend folder first.')
    services = [(8001, backend_matches, 'backend'), (5173, frontend_matches, 'frontend')]
    # Check both ports before launching anything. Never kill an existing listener.
    for port, check, label in services:
        if occupied(port) and not check():
            raise RuntimeError(f'Port {port} is occupied by a different service. Close that service or free the port, then try again. No existing process was stopped.')
    logs = ROOT/'logs'; logs.mkdir(exist_ok=True)
    env = os.environ.copy()
    env['PATH'] = '/opt/homebrew/bin:/usr/local/bin:' + env.get('PATH','')
    commands = {'backend':[str(python),'-m','uvicorn','main:app','--host','127.0.0.1','--port','8001'], 'frontend':[npm,'run','dev','--','--port','5173','--strictPort']}
    for port, check, label in services:
        if occupied(port):
            print(f'Using your already-running {label}.', flush=True)
            continue
        with (logs/f'{label}.log').open('a') as output:
            process = subprocess.Popen(commands[label],cwd=ROOT/label,stdout=output,stderr=subprocess.STDOUT,env=env,start_new_session=True)
        OWNED.append(process)
        for _ in range(90):
            if process.poll() is not None:
                raise RuntimeError(f'{label.capitalize()} exited. See {logs / (label + ".log")}')
            if check(): break
            time.sleep(.5)
        else: raise RuntimeError(f'{label.capitalize()} did not become ready. See {logs / (label + ".log")}')
        print(f'{label.capitalize()} ready.', flush=True)
    url = 'http://127.0.0.1:5173'
    print(f'\nF1 Strategy Lab is ready: {url}\nChoose Strategy workbench on the home screen.\nKeep this window open. Press Control+C to stop only services started here.\n', flush=True)
    if sys.platform == 'darwin': subprocess.run(['open', url],check=False)
    else:
        import webbrowser
        webbrowser.open(url)
    while OWNED:
        if any(p.poll() is not None for p in OWNED):
            raise RuntimeError(f'A service stopped. See logs in {logs}.')
        time.sleep(1)

if __name__ == '__main__':
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    try: main()
    except KeyboardInterrupt: print('\nStopping services started by this launcher.')
    except Exception as error:
        print(f'\nCould not start: {error}', file=sys.stderr)
        sys.exit(1)
    finally: cleanup()
