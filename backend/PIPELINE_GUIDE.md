# Pipeline Execution Guide

## What Was Created

Two new files have been added to simplify and clarify the research pipeline:

### 1. **`run_pipeline.py`** — Unified Pipeline Orchestrator
A single entry point that runs all 4 stages in the correct order with dependency checking, progress logging, and flexible execution modes.

### 2. **`README.md`** — Complete Documentation
Comprehensive documentation explaining:
- Pipeline architecture and dependencies
- What each stage does and what artifacts it creates
- Complete directory structure map
- How to use `run_pipeline.py`
- FastAPI server endpoints
- Troubleshooting guide

---

## Understanding the Pipeline

### The 4 Stages

```
Stage 1: 01_eda_preprocessing.py
   ↓  Creates: data/, results/eda/, figures/eda/, reports/eda_*.md
   ↓
   ├──→ Stage 2: 02_classical_algorithms.py
   │     Creates: models/, results/classical/, figures/classical/, reports/classical_*.md
   │
   └──→ Stage 3: 03_quantum_algorithms.py
         Creates: models/qsvm_*.joblib, results/quantum/, figures/quantum/, reports/quantum_*.md
         
         Both feed into ↓
         
Stage 4: 04_benchmark.py
   Creates: results/benchmark/, figures/benchmark/, reports/final_*.md
```

### Key Points

1. **Stage 1 MUST run first** — it creates the preprocessed data that Stages 2 & 3 need
2. **Stages 2 & 3 are independent** — they can run in any order (both need Stage 1 done)
3. **Stage 4 needs both 2 & 3** — it compares classical vs quantum results
4. **All artifacts are preserved** — nothing overwrites previous runs unless you re-run that stage

---

## How to Use `run_pipeline.py`

### First Time Setup (Full Pipeline)

```bash
cd backend
.venv\Scripts\activate
python run_pipeline.py
```

This runs all 4 stages sequentially. Estimated time:
- Stage 1 (EDA): ~30 seconds
- Stage 2 (Classical): ~2-3 minutes
- Stage 3 (Quantum): ~5-15 minutes ⚠️ SLOWEST
- Stage 4 (Benchmark): ~10 seconds

**Total: ~10-20 minutes**

### After First Run (Server Only)

```bash
python run_pipeline.py --serve-only
```

Opens web dashboard at http://127.0.0.1:8000

### Development Workflows

```bash
# Skip quantum during testing (much faster)
python run_pipeline.py --skip-quantum

# Re-run only specific stages
python run_pipeline.py --stages 2      # Re-train classical models
python run_pipeline.py --stages 4      # Re-generate benchmark reports

# Update quantum results only
python run_pipeline.py --stages 3 4

# Full pipeline + auto-start server
python run_pipeline.py --serve
```

### View What Gets Created

```bash
python run_pipeline.py --list
```

Shows detailed artifact map for each stage.

---

## Common Scenarios

### "I changed the preprocessing code"
```bash
python run_pipeline.py              # Re-run all 4 stages
```

### "I changed the classical SVM hyperparameters"
```bash
python run_pipeline.py --stages 2 4  # Re-run classical + benchmark
```

### "I changed the quantum feature map"
```bash
python run_pipeline.py --stages 3 4  # Re-run quantum + benchmark
```

### "I want to test the dashboard changes"
```bash
python run_pipeline.py --serve-only  # Just start server (no pipeline)
```

### "I'm iterating fast and quantum is too slow"
```bash
python run_pipeline.py --skip-quantum   # Runs 1, 2, 4 only
```

---

## Where Are the Artifacts?

After running the pipeline, look in these directories:

| What You Want | Where to Find It |
|---|---|
| **Preprocessed datasets** | `data/processed/cancer/` and `cardiovascular/` |
| **Trained models** | `models/cancer/*.joblib` and `cardiovascular/*.joblib` |
| **JSON results** | `results/eda/`, `results/classical/`, `results/quantum/`, `results/benchmark/` |
| **Figures (PNG)** | `figures/eda/`, `figures/classical/`, `figures/quantum/`, `figures/benchmark/` |
| **Research reports** | `reports/*.md` — 4 markdown files |

### Key Files to Check

- **`reports/final_research_benchmark_report.md`** — Master research report with all results
- **`results/benchmark/cancer_research_inference.txt`** — Quantum advantage verdict for cancer dataset
- **`results/benchmark/cardiovascular_research_inference.txt`** — Quantum advantage verdict for heart dataset
- **`figures/benchmark/cancer_radar_chart.png`** — Multi-metric comparison visualization

---

## FastAPI Server Endpoints

Once the server is running (via `--serve-only` or `--serve`):

| Endpoint | What It Returns |
|---|---|
| http://127.0.0.1:8000 | Frontend dashboard |
| http://127.0.0.1:8000/docs | Interactive API docs (Swagger UI) |
| http://127.0.0.1:8000/api/health | Server health check |
| http://127.0.0.1:8000/api/datasets | List datasets |
| http://127.0.0.1:8000/api/eda/cancer | EDA report for cancer dataset |
| http://127.0.0.1:8000/api/classical/cancer | Classical results for cancer |
| http://127.0.0.1:8000/api/quantum/cancer | Quantum results for cancer |
| http://127.0.0.1:8000/api/benchmark/cancer | Benchmark comparison |
| http://127.0.0.1:8000/api/cross-disease | Cross-disease synthesis |
| http://127.0.0.1:8000/figures/eda/cancer_correlation_matrix.png | Direct figure access |

Replace `cancer` with `cardiovascular` for heart disease results.

---

## Troubleshooting

### "Stage 4 fails with missing artifacts"
**Problem:** Stage 4 can't find results from Stages 2 or 3.

**Solution:**
```bash
python run_pipeline.py --stages 1 2 3 4   # Run all stages
```

### "ImportError or ModuleNotFoundError"
**Problem:** Virtual environment not activated or missing packages.

**Solution:**
```bash
.venv\Scripts\activate
pip install -r requirements.txt   # If you have one
# Or install manually: numpy pandas scikit-learn qiskit matplotlib seaborn fastapi uvicorn joblib
```

### "Server says 'EDA report not found'"
**Problem:** Pipeline hasn't run yet, so no artifacts exist.

**Solution:**
```bash
python run_pipeline.py              # Run pipeline first
python run_pipeline.py --serve-only # Then start server
```

### "Port 8000 already in use"
**Problem:** Another process is using port 8000.

**Solution:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <pid> /F

# Or change the port in run_pipeline.py line 189:
# uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=False)
```

### "Stage 3 is taking forever"
**Problem:** Quantum kernel computation is computationally intensive.

**Solution:**
- Use `--skip-quantum` during development
- Or let it run (5-15 min is normal)
- Results are cached, so subsequent runs of Stage 4 are instant

---

## Quick Reference Card

```bash
# FIRST TIME
python run_pipeline.py                     # Run everything (10-20 min)
python run_pipeline.py --serve-only        # Start dashboard

# DEVELOPMENT
python run_pipeline.py --skip-quantum      # Fast iteration (skip Stage 3)
python run_pipeline.py --stages 2 4        # Re-run classical + benchmark
python run_pipeline.py --stages 3 4        # Re-run quantum + benchmark
python run_pipeline.py --list              # Show what each stage creates

# INFO
python run_pipeline.py --help              # Show all options
cat README.md                              # Read full documentation
```

---

## Next Steps

1. **Run the full pipeline once:**
   ```bash
   python run_pipeline.py
   ```

2. **Check the master report:**
   ```bash
   cat reports/final_research_benchmark_report.md
   ```

3. **Start the web dashboard:**
   ```bash
   python run_pipeline.py --serve-only
   ```

4. **Browse the figures:**
   ```bash
   ls figures/benchmark/
   ls figures/quantum/
   ls figures/classical/
   ls figures/eda/
   ```

5. **Read the quantum advantage verdicts:**
   ```bash
   cat results/benchmark/cancer_research_inference.txt
   cat results/benchmark/cardiovascular_research_inference.txt
   ```

---

## Summary

- **`run_pipeline.py`** is now your single entry point — no need to run 01, 02, 03, 04 separately
- **`README.md`** explains the entire architecture and artifact map
- **Dependencies are checked automatically** — you'll get clear errors if prerequisites are missing
- **All artifacts are organized** in `data/`, `models/`, `results/`, `figures/`, `reports/`
- **The FastAPI server** serves everything via REST API and web dashboard

You're all set! 🚀
