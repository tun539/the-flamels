"""Prepare and run the complete pinned SpaceFire-derived edition for The Flamels.

Uses only Python's standard library. Source and dependencies stay in .runtime;
the original FlameAtlas MVP and user-edited materialized checkouts are retained.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time
from urllib.error import URLError
from urllib.request import ProxyHandler, build_opener

ROOT = Path(__file__).resolve().parents[1]
EDITION = ROOT / "research-platform"
RUNTIME = ROOT / ".runtime"
SOURCE = RUNTIME / "research-platform"
UPSTREAM = "https://github.com/COngtuthien/SpaceFire-AI.git"
LOCAL_HTTP = build_opener(ProxyHandler({}))


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_release():
    lock = json.loads((EDITION / "upstream.lock.json").read_text(encoding="utf-8"))
    if lock.get("repository") != UPSTREAM or len(lock.get("commit", "")) != 40 or any(
        c not in "0123456789abcdef" for c in lock["commit"]
    ):
        raise RuntimeError("Invalid pinned source configuration.")
    patch = EDITION / "flamels-edition.patch"
    manifest = EDITION / "source-manifest.json"
    for path, key in [(patch, "patch_sha256"), (manifest, "manifest_sha256")]:
        if digest(path.read_bytes()) != lock[key]:
            raise RuntimeError(f"Release integrity check failed: {path.name}.")
    return lock, patch, json.loads(manifest.read_text(encoding="utf-8"))


def verify_sources(source: Path, manifest):
    base = source.resolve()
    for item in manifest:
        path = (source / item["path"]).resolve()
        if base not in path.parents:
            raise RuntimeError("Source manifest contains a path outside the checkout.")
        if not path.is_file() or digest(path.read_bytes()) != item["sha256"]:
            raise RuntimeError(f"NASA source integrity check failed: {item['path']}. Files were preserved.")


def run(command, cwd, *, env=None):
    subprocess.run([str(x) for x in command], cwd=cwd, env=env, check=True)


def prepare():
    lock, patch, manifest = load_release()
    if SOURCE.exists():
        marker = SOURCE / ".flamels-edition.json"
        if not marker.is_file():
            raise RuntimeError(f"Existing folder is not a managed edition: {SOURCE}. It was preserved.")
        current = json.loads(marker.read_text(encoding="utf-8"))
        if any(current.get(k) != lock[k] for k in ("commit", "patch_sha256", "manifest_sha256")):
            raise RuntimeError("The installed edition differs from this release. Export local changes and rename its folder before preparing a new edition; nothing was overwritten.")
        head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=SOURCE, text=True).strip()
        if head != lock["commit"]:
            raise RuntimeError("The materialized checkout has a different Git base. It was preserved.")
        verify_sources(SOURCE, manifest)
        print(f"FlameAtlas source ready: {SOURCE}", flush=True)
        return SOURCE
    if not shutil.which("git"):
        raise RuntimeError("Git is required. Install Git, then run setup again.")
    RUNTIME.mkdir(exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix="platform-prepare-", dir=RUNTIME)) / "source"
    try:
        run(["git", "-c", "core.autocrlf=false", "clone", "--no-checkout", UPSTREAM, staging], ROOT)
        run(["git", "config", "--local", "core.autocrlf", "false"], staging)
        run(["git", "checkout", "--detach", lock["commit"]], staging)
        verify_sources(staging, manifest)
        run(["git", "apply", "--check", patch], staging)
        run(["git", "apply", "--whitespace=nowarn", patch], staging)
        verify_sources(staging, manifest)
        (staging / ".flamels-edition.json").write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8")
        with (staging / ".git/info/exclude").open("a", encoding="utf-8") as excluded:
            excluded.write("\n.flamels-edition.json\n")
        staging.rename(SOURCE)
        staging.parent.rmdir()
    except Exception:
        print(f"Preparation stopped. Any partial checkout is retained at {staging}.", file=sys.stderr)
        raise
    print(f"Prepared the full reference clone and The Flamels edition: {SOURCE}", flush=True)
    return SOURCE


def python_for(source):
    return source / "backend/.venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def npm_command():
    path = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if not path:
        raise RuntimeError("Node.js 20 or newer, including npm, is required.")
    return path


def build(source, api_port):
    lock, _, _ = load_release()
    backend_url = f"http://127.0.0.1:{api_port}"
    env = {**os.environ, "BACKEND_URL": backend_url, "NEXT_TELEMETRY_DISABLED": "1"}
    run([npm_command(), "run", "typecheck"], source / "frontend", env=env)
    run([npm_command(), "run", "build"], source / "frontend", env=env)
    (source / "frontend/.next/flamels-build.json").write_text(
        json.dumps({"backend_url": backend_url, "patch_sha256": lock["patch_sha256"]}), encoding="utf-8")


def setup(api_port):
    if not (3, 11) <= sys.version_info[:2] <= (3, 13):
        raise RuntimeError("Use Python 3.11–3.13 for this pinned edition. Python 3.12 is recommended.")
    source = prepare()
    run([sys.executable, "-m", "venv", source / "backend/.venv"], ROOT)
    py = python_for(source)
    run([py, "-m", "pip", "install", "-r", "requirements.txt"], source / "backend")
    run([npm_command(), "ci", "--no-audit", "--no-fund"], source / "frontend")
    if not (source / ".env").exists():
        shutil.copyfile(source / ".env.example", source / ".env")
    run([py, "-m", "app.ingest.run"], source / "backend", env={**os.environ, "PYTHONIOENCODING": "utf-8"})
    build(source, api_port)
    print("Setup complete. Run launch.cmd on Windows, or python scripts/research_platform.py start.")


def healthy(url):
    try:
        with LOCAL_HTTP.open(url, timeout=2) as response:
            data = json.load(response)
        return data.get("status") == "ok" and data.get("database", {}).get("ok") is True
    except (URLError, OSError, ValueError):
        return False


def wait_ready(url, children, seconds=120):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        if any(p.poll() is not None for p in children):
            raise RuntimeError("A server stopped during startup. See its console or .runtime/research-platform.log.")
        if healthy(url):
            return
        time.sleep(0.3)
    raise RuntimeError("Server startup timed out. See .runtime/research-platform.log.")


@contextmanager
def supervisor_lock():
    RUNTIME.mkdir(exist_ok=True)
    with (RUNTIME / "research-platform.lock").open("a+b") as handle:
        try:
            if os.name == "nt":
                import msvcrt
                handle.seek(0); handle.write(b"0"); handle.flush(); handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as exc:
            raise RuntimeError("A FlameAtlas platform supervisor is already running.") from exc
        yield


def check_free_port(port):
    with socket.socket() as sock:
        try:
            sock.bind(("127.0.0.1", port))
        except OSError as exc:
            raise RuntimeError(f"Port {port} is busy. Choose a different --frontend-port or --api-port.") from exc


def serve(args):
    source = prepare()
    if not python_for(source).is_file() or not (source / "processed/spacefire.db").is_file():
        raise RuntimeError("Dependencies or the scientific database are missing. Run setup.cmd first.")
    with supervisor_lock():
        check_free_port(args.api_port)
        check_free_port(args.frontend_port)
        url = f"http://127.0.0.1:{args.api_port}"
        marker = source / "frontend/.next/flamels-build.json"
        expected = {"backend_url": url, "patch_sha256": load_release()[0]["patch_sha256"]}
        if args.rebuild or not marker.is_file() or json.loads(marker.read_text()) != expected:
            build(source, args.api_port)
        children = []
        def stop(signum, frame):
            raise KeyboardInterrupt
        signal.signal(signal.SIGTERM, stop)
        signal.signal(signal.SIGINT, stop)
        try:
            children.append(subprocess.Popen([str(python_for(source)), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(args.api_port)], cwd=source / "backend", env={**os.environ, "PYTHONIOENCODING": "utf-8"}))
            wait_ready(url + "/api/v1/health", children)
            node = shutil.which("node")
            if not node:
                raise RuntimeError("Node.js is required.")
            children.append(subprocess.Popen([node, str(source / "frontend/node_modules/next/dist/bin/next"), "start", "--hostname", args.host, "--port", str(args.frontend_port)], cwd=source / "frontend", env={**os.environ, "BACKEND_URL": url, "NEXT_TELEMETRY_DISABLED": "1"}))
            site = f"http://127.0.0.1:{args.frontend_port}"
            wait_ready(site + "/api/v1/health", children)
            print(f"FlameAtlas by The Flamels is ready: {site}\nPress Ctrl+C to stop both servers.", flush=True)
            while all(p.poll() is None for p in children):
                time.sleep(1)
            raise RuntimeError("A server stopped unexpectedly.")
        except KeyboardInterrupt:
            pass
        finally:
            for process in reversed(children):
                if process.poll() is None:
                    process.terminate()
            for process in children:
                try:
                    process.wait(timeout=8)
                except subprocess.TimeoutExpired:
                    process.kill(); process.wait()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["prepare", "setup", "start", "status"])
    parser.add_argument("--frontend-port", type=int, default=3000)
    parser.add_argument("--api-port", type=int, default=8000)
    parser.add_argument("--host", choices=["127.0.0.1", "0.0.0.0"], default="127.0.0.1")
    parser.add_argument("--background", action="store_true")
    parser.add_argument("--rebuild", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.api_port <= 65535 or not 1 <= args.frontend_port <= 65535 or args.api_port == args.frontend_port:
        parser.error("Choose two different ports between 1 and 65535.")
    if args.command == "prepare":
        prepare()
    elif args.command == "setup":
        setup(args.api_port)
    elif args.command == "status":
        ok = healthy(f"http://127.0.0.1:{args.frontend_port}/api/v1/health")
        print("FlameAtlas platform is ready." if ok else "FlameAtlas platform is not ready.")
        return 0 if ok else 1
    elif args.background:
        if healthy(f"http://127.0.0.1:{args.frontend_port}/api/v1/health"):
            print("FlameAtlas platform is already ready.")
            return 0
        RUNTIME.mkdir(exist_ok=True)
        command = [sys.executable, str(Path(__file__).resolve()), "start", "--frontend-port", str(args.frontend_port), "--api-port", str(args.api_port), "--host", args.host]
        if args.rebuild:
            command.append("--rebuild")
        options = {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == "nt" else {"start_new_session": True}
        with (RUNTIME / "research-platform.log").open("a", encoding="utf-8") as log:
            child = subprocess.Popen(command, cwd=ROOT, stdin=subprocess.DEVNULL, stdout=log, stderr=log, **options)
        wait_ready(f"http://127.0.0.1:{args.frontend_port}/api/v1/health", [child], seconds=360)
        print(f"FlameAtlas platform ready on port {args.frontend_port}. Logs: .runtime/research-platform.log")
    else:
        serve(args)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"FlameAtlas: {exc}", file=sys.stderr)
        raise SystemExit(1)
