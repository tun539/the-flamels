"""Run the production MVP locally or inside a private GitHub Codespace."""
import argparse
import fcntl
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / '.runtime'

def healthy(url):
    try:
        with urlopen(url, timeout=2) as response:
            return response.status == 200
    except (OSError, ValueError):
        return False

def wait_ready(url, process, seconds=45):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError('Server exited. Inspect .runtime/mvp.log.')
        if healthy(url):
            return
        time.sleep(.3)
    raise RuntimeError('Server startup timed out. Inspect .runtime/mvp.log.')

def serve():
    STATE.mkdir(exist_ok=True)
    children = []
    with (STATE / 'mvp.lock').open('w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit('An MVP supervisor is already running.')
        def stop(signum, frame):
            raise KeyboardInterrupt
        signal.signal(signal.SIGTERM, stop)
        signal.signal(signal.SIGINT, stop)
        try:
            subprocess.run([sys.executable, 'scripts/seed.py'], cwd=ROOT, check=True)
            api = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', '8000'], cwd=ROOT, start_new_session=True)
            children.append(api)
            wait_ready('http://127.0.0.1:8000/api/health', api)
            web = subprocess.Popen(['npm', '--prefix', 'frontend', 'run', 'start'], cwd=ROOT, env={**os.environ, 'BACKEND_URL': 'http://127.0.0.1:8000'}, start_new_session=True)
            children.append(web)
            wait_ready('http://127.0.0.1:3000/api/health', web)
            print('FlameAtlas ready: http://localhost:3000', flush=True)
            while all(child.poll() is None for child in children):
                time.sleep(1)
            raise RuntimeError('A server stopped unexpectedly.')
        except KeyboardInterrupt:
            pass
        finally:
            for child in children:
                if child.poll() is None:
                    os.killpg(child.pid, signal.SIGTERM)
            for child in children:
                try:
                    child.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    os.killpg(child.pid, signal.SIGKILL)
                    child.wait()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--background', action='store_true')
    args = parser.parse_args()
    if args.background:
        if healthy('http://127.0.0.1:3000/api/health'):
            print('FlameAtlas is already available on port 3000.')
            raise SystemExit(0)
        STATE.mkdir(exist_ok=True)
        with (STATE / 'mvp.log').open('a') as log:
            process = subprocess.Popen([sys.executable, str(Path(__file__).resolve())], cwd=ROOT, stdout=log, stderr=log, stdin=subprocess.DEVNULL, start_new_session=True)
        wait_ready('http://127.0.0.1:3000/api/health', process, seconds=60)
        print('FlameAtlas ready on port 3000. Open the Codespaces Ports panel.')
    else:
        serve()
