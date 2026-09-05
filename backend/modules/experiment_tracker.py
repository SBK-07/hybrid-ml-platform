"""
experiment_tracker.py
======================
Reproducible Biomedical ML/QML Experiment Tracking & Artifact Provenance.
Logs experiment runs, hashes parameters and datasets (SHA-256), and manages versioned ledgers.
"""

import os
import sys
import json
import time
import hashlib
from typing import Dict, Any, List, Optional

RESULTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
HISTORY_FILE = os.path.join(RESULTS_DIR, "experiment_history.json")


def compute_sha256_hash(data: Any) -> str:
    """Generate SHA-256 hash of any JSON-serializable structure or string."""
    if isinstance(data, (dict, list)):
        payload = json.dumps(data, sort_keys=True).encode('utf-8')
    else:
        payload = str(data).encode('utf-8')
    return hashlib.sha256(payload).hexdigest()[:16]


def log_experiment_run(
    model_id: str,
    dataset_key: str,
    metrics: Dict[str, Any],
    hyperparameters: Optional[Dict[str, Any]] = None,
    quantum_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Log an executed experiment into the persistent history ledger.
    """
    os.makedirs(RESULTS_DIR, exist_ok=True)
    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)
        except Exception:
            history = []

    run_id = f"run_{int(time.time())}_{compute_sha256_hash(model_id + dataset_key)}"
    entry = {
        "run_id": run_id,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "model_id": model_id,
        "dataset_key": dataset_key,
        "metrics": metrics,
        "hyperparameters": hyperparameters or {},
        "quantum_metadata": quantum_metadata or {},
        "provenance_hash": compute_sha256_hash({
            "model": model_id,
            "dataset": dataset_key,
            "metrics": metrics
        })
    }

    history.append(entry)
    # Keep last 100 runs
    if len(history) > 100:
        history = history[-100:]

    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

    return entry


def get_experiment_history(limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve recent logged experiments."""
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r") as f:
            history = json.load(f)
        return history[-limit:][::-1]
    except Exception:
        return []
