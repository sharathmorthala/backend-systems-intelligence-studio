#!/usr/bin/env python3
import subprocess
import sys
import signal
import time
import os

vite_process = None
fastapi_process = None

def cleanup(signum=None, frame=None):
    print("\nStopping servers...")
    if vite_process:
        vite_process.terminate()
        try:
            vite_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            vite_process.kill()
    if fastapi_process:
        fastapi_process.terminate()
        try:
            fastapi_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            fastapi_process.kill()
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def main():
    global vite_process, fastapi_process
    
    print("Starting Vite dev server on port 5173...")
    vite_process = subprocess.Popen(
        ["npx", "vite", "--port", "5173"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    time.sleep(2)
    
    print("Starting FastAPI server on port 5000...")
    fastapi_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    print("Both servers started:")
    print("  - FastAPI (API + Proxy): http://0.0.0.0:5000")
    print("  - Vite (Frontend): http://127.0.0.1:5173")
    print("Press Ctrl+C to stop.")
    
    import select
    
    while True:
        if vite_process.poll() is not None:
            print("Vite process exited unexpectedly!")
            cleanup()
        if fastapi_process.poll() is not None:
            print("FastAPI process exited unexpectedly!")
            cleanup()
        
        for proc, name in [(vite_process, "Vite"), (fastapi_process, "FastAPI")]:
            if proc.stdout:
                try:
                    import fcntl
                    flags = fcntl.fcntl(proc.stdout.fileno(), fcntl.F_GETFL)
                    fcntl.fcntl(proc.stdout.fileno(), fcntl.F_SETFL, flags | os.O_NONBLOCK)
                    try:
                        line = proc.stdout.readline()
                        if line:
                            print(f"[{name}] {line}", end="")
                    except:
                        pass
                except ImportError:
                    pass
        
        time.sleep(0.1)

if __name__ == "__main__":
    main()
