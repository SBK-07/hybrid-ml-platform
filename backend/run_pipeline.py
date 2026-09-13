"""
run_pipeline.py
===============
Unified Pipeline Orchestrator for the Hybrid Quantum-Classical ML Platform.

This is the SINGLE entry point to run the entire research pipeline end-to-end.
It executes the 4 pipeline stages in order, each building on the artifacts
produced by the previous one:

  Stage 1  →  01_eda_preprocessing.py        (Data acquisition, EDA, preprocessing)
  Stage 2  →  02_classical_algorithms.py      (Classical SVM baselines)
  Stage 3  →  03_quantum_algorithms.py        (Quantum Kernel SVM experiments)
  Stage 4  →  04_benchmark.py                 (Comparative benchmarking & verdict)

Usage:
  python run_pipeline.py                      # Run ALL stages (1 → 2 → 3 → 4)
  python run_pipeline.py --stages 1 2         # Run only stages 1 and 2
  python run_pipeline.py --stages 3 4         # Run only stages 3 and 4 (requires 1 & 2 done)
  python run_pipeline.py --stages 2           # Re-run only stage 2
  python run_pipeline.py --skip-quantum       # Run stages 1, 2, 4 (skip slow quantum)
  python run_pipeline.py --serve              # Run full pipeline, then start FastAPI server
  python run_pipeline.py --serve-only         # Skip pipeline, just start the server

After a successful run, these artifact directories will be populated:

  backend/
  ├── data/raw/                  ← Raw downloaded datasets (Stage 1)
  ├── data/processed/            ← Train/test splits, scalers, PCA models (Stage 1)
  ├── figures/eda/               ← Correlation heatmaps, distributions (Stage 1)
  ├── figures/classical/         ← ROC curves, confusion matrices, CV charts (Stage 2)
  ├── figures/quantum/           ← Kernel heatmaps, qubit scaling, noise plots (Stage 3)
  ├── figures/benchmark/         ← Radar charts, metric comparisons (Stage 4)
  ├── results/eda/               ← EDA JSON reports (Stage 1)
  ├── results/classical/         ← Classical SVM JSON results (Stage 2)
  ├── results/quantum/           ← Quantum QSVM JSON results (Stage 3)
  ├── results/benchmark/         ← Benchmark JSON + inference verdicts (Stage 4)
  ├── models/cancer/             ← Trained SVM & QSVM models (Stages 2, 3)
  ├── models/cardiovascular/     ← Trained SVM & QSVM models (Stages 2, 3)
  └── reports/                   ← Markdown research reports (Stages 1, 2, 3, 4)
"""

import os
import sys
import time
import argparse
import traceback

# Fix Windows console encoding for Unicode characters
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure the backend directory is on the Python path so imports resolve correctly
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


# ─── Stage Definitions ──────────────────────────────────────────────────────

STAGES = {
    1: {
        "name": "EDA & Preprocessing",
        "script": "01_eda_preprocessing",
        "description": "Acquires datasets, performs scientific EDA, creates leak-free "
                       "train/test splits, generates classical and quantum feature representations.",
        "creates": [
            "data/raw/cancer/",
            "data/raw/cardiovascular/",
            "data/processed/cancer/classical/     (X_train.npy, X_test.npy, y_train.npy, y_test.npy, scaler.joblib, metadata.json)",
            "data/processed/cancer/quantum/       (X_train_quantum.npy, X_test_quantum.npy, pca_model.joblib, angle_scaler.joblib)",
            "data/processed/cardiovascular/       (same structure as cancer)",
            "results/eda/                         (cancer_eda_report.json, cardiovascular_eda_report.json)",
            "figures/eda/                         (correlation matrices, feature distributions, PCA variance plots)",
            "reports/eda_data_quality_report.md",
        ],
        "depends_on": [],
    },
    2: {
        "name": "Classical SVM Baselines",
        "script": "02_classical_algorithms",
        "description": "Trains Linear, RBF, and Polynomial SVMs on full-feature and "
                       "4-PCA representations with 5-fold stratified CV + grid search.",
        "creates": [
            "models/cancer/                       (classical_linear_full_svm.joblib, classical_rbf_*.joblib, classical_poly_*.joblib)",
            "models/cardiovascular/               (same set of models)",
            "results/classical/                   (cancer_classical_svm.json, cardiovascular_classical_svm.json)",
            "figures/classical/                   (ROC curves, confusion matrices, CV performance bar charts)",
            "reports/classical_baseline_report.md",
        ],
        "depends_on": [1],
    },
    3: {
        "name": "Quantum Kernel SVM (QSVM)",
        "script": "03_quantum_algorithms",
        "description": "Builds ZZFeatureMap quantum circuits, computes quantum kernel "
                       "Gram matrices, trains QSVM, runs qubit scaling / noise studies.",
        "creates": [
            "models/cancer/qsvm_zz_model.joblib",
            "models/cardiovascular/qsvm_zz_model.joblib",
            "results/quantum/                     (cancer_qsvm.json, cardiovascular_qsvm.json)",
            "figures/quantum/                     (kernel heatmaps, qubit scaling, noise sensitivity plots)",
            "reports/quantum_qsvm_report.md",
        ],
        "depends_on": [1],
    },
    4: {
        "name": "Benchmark & Quantum Advantage Verdict",
        "script": "04_benchmark",
        "description": "Reads results from stages 2 & 3, performs statistical significance "
                       "testing, generates comparative visualizations and research verdict.",
        "creates": [
            "results/benchmark/                   (cancer_benchmark.json, cardiovascular_benchmark.json, cross_disease_summary.json)",
            "results/benchmark/                   (cancer_research_inference.txt, cardiovascular_research_inference.txt)",
            "figures/benchmark/                   (metric comparison, confusion matrices side-by-side, radar charts)",
            "reports/final_research_benchmark_report.md",
        ],
        "depends_on": [2, 3],
    },
}


# ─── Dependency Checker ─────────────────────────────────────────────────────

def check_stage_prerequisites(stage_num, completed_stages):
    """Verify that prerequisite stages have either run in this session or their artifacts exist."""
    deps = STAGES[stage_num]["depends_on"]
    for dep in deps:
        if dep in completed_stages:
            continue
        # Check for key artifact existence instead
        if dep == 1:
            check_path = os.path.join(BASE_DIR, "data", "processed", "cancer", "classical", "X_train.npy")
        elif dep == 2:
            check_path = os.path.join(BASE_DIR, "results", "classical", "cancer_classical_svm.json")
        elif dep == 3:
            check_path = os.path.join(BASE_DIR, "results", "quantum", "cancer_qsvm.json")
        else:
            check_path = None

        if check_path and not os.path.exists(check_path):
            return False, (
                f"Stage {stage_num} ({STAGES[stage_num]['name']}) requires Stage {dep} "
                f"({STAGES[dep]['name']}) to be completed first.\n"
                f"  Missing artifact: {check_path}\n"
                f"  Run: python run_pipeline.py --stages {dep} {stage_num}"
            )
    return True, ""


# ─── Stage Runner ────────────────────────────────────────────────────────────

def run_stage(stage_num, completed_stages):
    """Import and execute a single pipeline stage."""
    stage = STAGES[stage_num]

    # Prerequisite check
    ok, msg = check_stage_prerequisites(stage_num, completed_stages)
    if not ok:
        print(f"\n ❌ DEPENDENCY ERROR: {msg}")
        return False

    header = f" STAGE {stage_num}/4: {stage['name'].upper()} "
    print("\n" + "=" * 75)
    print(header.center(75))
    print("=" * 75)
    print(f"  Script : {stage['script']}.py")
    print(f"  Purpose: {stage['description']}")
    print("-" * 75)

    t0 = time.time()
    try:
        module = __import__(stage["script"])
        module.main()
        elapsed = time.time() - t0
        print(f"\n ✅ Stage {stage_num} completed in {elapsed:.1f}s")
        return True
    except Exception as e:
        elapsed = time.time() - t0
        print(f"\n ❌ Stage {stage_num} FAILED after {elapsed:.1f}s")
        print(f"    Error: {e}")
        traceback.print_exc()
        return False


# ─── Server Launcher ─────────────────────────────────────────────────────────

def start_server():
    """Start the FastAPI server (backend/app/main.py) on port 8000."""
    print("\n" + "=" * 75)
    print(" STARTING FASTAPI SERVER".center(75))
    print("=" * 75)
    print("  Dashboard : http://127.0.0.1:8000")
    print("  API Docs  : http://127.0.0.1:8000/docs")
    print("  Press Ctrl+C to stop.")
    print("=" * 75)

    import uvicorn
    os.chdir(BASE_DIR)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)


# ─── CLI Entry Point ─────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Hybrid Quantum-Classical ML Platform — Unified Pipeline Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_pipeline.py                  Run all 4 stages sequentially
  python run_pipeline.py --stages 1 2     Run only EDA + Classical
  python run_pipeline.py --stages 3 4     Run Quantum + Benchmark (needs 1 & 2 done)
  python run_pipeline.py --skip-quantum   Run stages 1, 2, 4 (skip slow quantum stage)
  python run_pipeline.py --serve          Run pipeline then start web server
  python run_pipeline.py --serve-only     Just start the web server (skip pipeline)
  python run_pipeline.py --list           Show stage descriptions and artifact map
        """
    )
    parser.add_argument(
        "--stages", nargs="+", type=int, choices=[1, 2, 3, 4],
        help="Run only specific stages (e.g. --stages 1 2)"
    )
    parser.add_argument(
        "--skip-quantum", action="store_true",
        help="Run stages 1, 2, 4 — skip stage 3 (quantum) which is the slowest"
    )
    parser.add_argument(
        "--serve", action="store_true",
        help="After running the pipeline, start the FastAPI server"
    )
    parser.add_argument(
        "--serve-only", action="store_true",
        help="Skip pipeline execution, just start the FastAPI server"
    )
    parser.add_argument(
        "--list", action="store_true",
        help="Print stage descriptions and artifact map, then exit"
    )

    args = parser.parse_args()

    # ── List mode ──
    if args.list:
        print("\n" + "=" * 75)
        print(" PIPELINE STAGES & ARTIFACT MAP".center(75))
        print("=" * 75)
        for num, stage in STAGES.items():
            deps = ", ".join(str(d) for d in stage["depends_on"]) or "None"
            print(f"\n  Stage {num}: {stage['name']}")
            print(f"  Script:  {stage['script']}.py")
            print(f"  Depends: Stage(s) {deps}")
            print(f"  {stage['description']}")
            print(f"  Creates:")
            for a in stage["creates"]:
                print(f"    → {a}")
        print()
        return

    # ── Serve-only mode ──
    if args.serve_only:
        start_server()
        return

    # ── Determine which stages to run ──
    if args.skip_quantum:
        stages_to_run = [1, 2, 4]
    elif args.stages:
        stages_to_run = sorted(set(args.stages))
    else:
        stages_to_run = [1, 2, 3, 4]

    # ── Print banner ──
    print("\n" + "█" * 75)
    print(" Q-MED HYBRID QUANTUM-CLASSICAL ML PLATFORM ".center(75, "█"))
    print(" SIH 2026 · Problem Statement 139 ".center(75, "█"))
    print(" UNIFIED RESEARCH PIPELINE ".center(75, "█"))
    print("█" * 75)
    print(f"\n  Stages queued : {stages_to_run}")
    print(f"  Working dir   : {BASE_DIR}")

    # ── Execute stages ──
    pipeline_start = time.time()
    completed = set()
    failed = []

    for stage_num in stages_to_run:
        success = run_stage(stage_num, completed)
        if success:
            completed.add(stage_num)
        else:
            failed.append(stage_num)
            # If a dependency fails, skip downstream stages
            downstream = [s for s in stages_to_run if stage_num in STAGES[s]["depends_on"]]
            if downstream:
                print(f"\n ⚠️  Skipping downstream stages {downstream} due to Stage {stage_num} failure.")
                for ds in downstream:
                    if ds in stages_to_run:
                        failed.append(ds)
            break

    # ── Final Summary ──
    total_time = time.time() - pipeline_start
    print("\n" + "=" * 75)
    print(" PIPELINE EXECUTION SUMMARY".center(75))
    print("=" * 75)
    print(f"  Total time     : {total_time:.1f}s ({total_time/60:.1f} min)")
    print(f"  Completed      : {sorted(completed) if completed else 'None'}")
    if failed:
        print(f"  Failed/Skipped : {sorted(set(failed))}")
    else:
        print(f"  Status         : ✅ ALL STAGES PASSED")

    # ── Artifact Summary ──
    print(f"\n  Artifact directories (relative to backend/):")
    artifact_dirs = {
        "data/processed/": "Preprocessed train/test splits & scalers",
        "models/":         "Trained SVM & QSVM model files (.joblib)",
        "results/":        "Structured JSON experiment results",
        "figures/":        "Publication-ready PNG visualizations",
        "reports/":        "Markdown research reports",
    }
    for d, desc in artifact_dirs.items():
        full_path = os.path.join(BASE_DIR, d)
        exists = "✅" if os.path.exists(full_path) else "❌"
        print(f"    {exists} {d:<25} {desc}")

    print("=" * 75)

    # ── Optionally start server ──
    if args.serve and not failed:
        start_server()
    elif args.serve and failed:
        print("\n ⚠️  Skipping server start because some stages failed.")


if __name__ == "__main__":
    main()
