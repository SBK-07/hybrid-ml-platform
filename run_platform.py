import os
import sys
import uvicorn

if __name__ == "__main__":
    print("=" * 70)
    print("  Q-MED: HYBRID QUANTUM-CLASSICAL DISEASE DETECTION PLATFORM")
    print("  SIH 2026 Problem Statement 139 Implementation")
    print("=" * 70)
    print("  [*] Starting FastAPI Server & Frontend Dashboard...")
    print("  [*] Open in Browser: http://127.0.0.1:8000")
    print("  [*] REST API Docs:   http://127.0.0.1:8000/docs")
    print("=" * 70)

    # Change working dir to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    sys.path.insert(0, backend_dir)

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
