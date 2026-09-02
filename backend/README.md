# Q-Med: Hybrid Quantum-Classical ML Platform — Backend

**SIH 2026 · Problem Statement 139**
**Early Disease Detection using Quantum Support Vector Machines**

---

## Quick Start

```bash
# 1. Activate the virtual environment
cd backend
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS

# 2. Run the full research pipeline (EDA → Classical → Quantum → Benchmark)
python run_pipeline.py

# 3. Start the web dashboard + REST API
python run_pipeline.py --serve-only
# Open http://127.0.0.1:8000 in your browser
```

Or combine both:
```bash
python run_pipeline.py --serve    # Runs full pipeline, then starts server
```

---

## Pipeline Architecture

The backend consists of **4 sequential research stages**. Each stage reads artifacts from the previous one and produces its own outputs. **`run_pipeline.py`** orchestrates all of them.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        run_pipeline.py                              │
│                  (Single entry point — runs all 4)                  │
└───────┬──────────┬──────────┬──────────┬────────────────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Stage 1 │ │ Stage 2 │ │ Stage 3 │ │ Stage 4 │
   │  EDA &  │→│Classical│→│ Quantum │→│Benchmark│
   │ Preproc │ │   SVM   │ │  QSVM   │ │& Verdict│
   └─────────┘ └─────────┘ └─────────┘ └─────────┘
        │          │  │         │  │        │
        ▼          ▼  ▼         ▼  ▼        ▼
     data/      models/ results/ models/ results/
    figures/    figures/  reports/ figures/ figures/
    results/    reports/          reports/ reports/
    reports/
```

### Dependency Graph

```
Stage 1 (EDA)  ──────┬──→  Stage 2 (Classical SVM)  ──→  Stage 4 (Benchmark)
                     └──→  Stage 3 (Quantum QSVM)   ──→  Stage 4 (Benchmark)
```

- **Stage 2** and **Stage 3** both depend on Stage 1 (they read from `data/processed/`)
- **Stage 4** depends on both Stage 2 and Stage 3 (it reads from `results/classical/` and `results/quantum/`)
- Stages 2 and 3 are independent of each other (they can run in any order after Stage 1)

---

## Stage Details

### Stage 1: `01_eda_preprocessing.py` — Data Engineering & EDA

**What it does:**
1. Acquires the Breast Cancer Wisconsin (WDBC) dataset from `sklearn` and the UCI Heart Disease dataset from `app/datasets/heart.csv`
2. Performs scientific data-quality auditing (missing values, duplicates, outliers, correlations)
3. Executes leak-free preprocessing: `StandardScaler` and `PCA` fitted **only on training data**
4. Creates two representations per dataset:
   - **Classical**: StandardScaler-normalized full features
   - **Quantum**: PCA → 4 components → MinMaxScaler to `[0, π]` rotation angles

**Artifacts created:**
| Directory / File | Contents |
|---|---|
| `data/raw/cancer/` | Raw CSV dataset |
| `data/raw/cardiovascular/` | Raw CSV dataset |
| `data/processed/cancer/classical/` | `X_train.npy`, `X_test.npy`, `y_train.npy`, `y_test.npy`, `scaler.joblib`, `metadata.json` |
| `data/processed/cancer/quantum/` | `X_train_quantum.npy`, `X_test_quantum.npy`, `pca_model.joblib`, `angle_scaler.joblib`, `quantum_metadata.json` |
| `data/processed/cardiovascular/` | Same structure as cancer |
| `results/eda/` | `cancer_eda_report.json`, `cardiovascular_eda_report.json` |
| `figures/eda/` | Correlation heatmaps, feature distribution plots, PCA variance charts (6 PNGs) |
| `reports/eda_data_quality_report.md` | Master EDA markdown report |

---

### Stage 2: `02_classical_algorithms.py` — Classical SVM Baselines

**What it does:**
1. Loads preprocessed data from `data/processed/`
2. Trains 3 SVM kernel types (Linear, RBF, Polynomial) on both full-feature and 4-PCA representations
3. Uses 5-Fold Stratified Cross-Validation with GridSearchCV for hyperparameter optimization
4. Evaluates on held-out 20% test set with clinical metrics (Sensitivity, Specificity, ROC-AUC)

**Artifacts created:**
| Directory / File | Contents |
|---|---|
| `models/cancer/` | `classical_linear_full_svm.joblib`, `classical_rbf_full_svm.joblib`, `classical_poly_full_svm.joblib`, `*_pca_svm.joblib` (6 models) |
| `models/cardiovascular/` | Same 6 models |
| `results/classical/` | `cancer_classical_svm.json`, `cardiovascular_classical_svm.json` |
| `figures/classical/` | ROC curves, confusion matrices, CV performance bar charts (6 PNGs) |
| `reports/classical_baseline_report.md` | Classical baselines report |

---

### Stage 3: `03_quantum_algorithms.py` — Quantum Kernel SVM

**What it does:**
1. Builds parameterized `ZZFeatureMap` quantum circuits (4 qubits, reps=2)
2. Computes quantum fidelity kernel matrices `K(x,z) = |⟨φ(x)|φ(z)⟩|²` via Statevector simulation
3. Trains QSVM using `SVC(kernel="precomputed")` on the quantum kernel
4. Runs experimental studies:
   - **Qubit Scaling**: 2, 4, 6, 8 qubits
   - **Feature Map Comparison**: ZZFeatureMap vs PauliFeatureMap
   - **Noise Sensitivity**: Depolarizing noise at 1%, 3%, 5%

**Artifacts created:**
| Directory / File | Contents |
|---|---|
| `models/cancer/qsvm_zz_model.joblib` | Trained QSVM model + metadata |
| `models/cardiovascular/qsvm_zz_model.joblib` | Trained QSVM model + metadata |
| `results/quantum/` | `cancer_qsvm.json`, `cardiovascular_qsvm.json` |
| `figures/quantum/` | Kernel heatmaps, qubit scaling/depth plots, noise sensitivity bars (6 PNGs) |
| `reports/quantum_qsvm_report.md` | Quantum research report |

> ⚠️ **This is the slowest stage** (~5-15 min depending on hardware). Use `--skip-quantum` to skip it during development.

---

### Stage 4: `04_benchmark.py` — Comparative Benchmark & Verdict

**What it does:**
1. Reads precomputed JSON results from Stages 2 and 3 (no redundant training)
2. Builds master comparison tables across all models
3. Performs paired Student's t-test and Cohen's d effect size analysis
4. Generates an evidence-based Quantum Advantage Verdict
5. Produces cross-disease generalization synthesis

**Artifacts created:**
| Directory / File | Contents |
|---|---|
| `results/benchmark/` | `cancer_benchmark.json`, `cardiovascular_benchmark.json`, `cross_disease_summary.json` |
| `results/benchmark/` | `cancer_research_inference.txt`, `cardiovascular_research_inference.txt` |
| `figures/benchmark/` | Metric comparison bars, side-by-side confusion matrices, radar charts (6 PNGs) |
| `reports/final_research_benchmark_report.md` | Master final research report |

---

## Complete Artifact Directory Map

After a full pipeline run, the backend directory looks like this:

```
backend/
├── run_pipeline.py                     ← ★ UNIFIED ENTRY POINT (this file)
├── 01_eda_preprocessing.py             ← Stage 1
├── 02_classical_algorithms.py          ← Stage 2
├── 03_quantum_algorithms.py            ← Stage 3
├── 04_benchmark.py                     ← Stage 4
│
├── app/
│   ├── main.py                         ← FastAPI REST API server
│   └── datasets/
│       ├── heart.csv                   ← Source Heart Disease CSV
│       ├── diabetes.csv                ← (Available for future use)
│       └── parkinsons.csv              ← (Available for future use)
│
├── data/                               ← [Created by Stage 1]
│   ├── raw/
│   │   ├── cancer/                     ← breast_cancer_wisconsin_diagnostic.csv
│   │   └── cardiovascular/             ← uci_heart_disease.csv
│   └── processed/
│       ├── cancer/
│       │   ├── classical/              ← X_train.npy, X_test.npy, y_*.npy, scaler.joblib
│       │   └── quantum/               ← X_train_quantum.npy, pca_model.joblib, angle_scaler.joblib
│       └── cardiovascular/
│           ├── classical/              ← (same structure)
│           └── quantum/                ← (same structure)
│
├── models/                             ← [Created by Stages 2 & 3]
│   ├── cancer/
│   │   ├── classical_linear_full_svm.joblib
│   │   ├── classical_rbf_full_svm.joblib
│   │   ├── classical_poly_full_svm.joblib
│   │   ├── classical_linear_pca_svm.joblib
│   │   ├── classical_rbf_pca_svm.joblib
│   │   ├── classical_poly_pca_svm.joblib
│   │   └── qsvm_zz_model.joblib
│   └── cardiovascular/                 ← (same set of 7 model files)
│
├── results/                            ← [Created by Stages 1–4]
│   ├── eda/                            ← cancer_eda_report.json, cardiovascular_eda_report.json
│   ├── classical/                      ← cancer_classical_svm.json, cardiovascular_classical_svm.json
│   ├── quantum/                        ← cancer_qsvm.json, cardiovascular_qsvm.json
│   └── benchmark/                      ← cancer_benchmark.json, cross_disease_summary.json, *.txt
│
├── figures/                            ← [Created by Stages 1–4]
│   ├── eda/                            ← Correlation matrices, distributions, PCA variance
│   ├── classical/                      ← ROC curves, confusion matrices, CV performance
│   ├── quantum/                        ← Kernel heatmaps, qubit scaling, noise sensitivity
│   └── benchmark/                      ← Metric comparisons, radar charts, CM side-by-side
│
├── reports/                            ← [Created by Stages 1–4]
│   ├── eda_data_quality_report.md
│   ├── classical_baseline_report.md
│   ├── quantum_qsvm_report.md
│   └── final_research_benchmark_report.md
│
└── .venv/                              ← Python virtual environment
```

---

## `run_pipeline.py` Usage

```bash
# Full pipeline (recommended for first run)
python run_pipeline.py

# Run specific stages
python run_pipeline.py --stages 1          # Only EDA
python run_pipeline.py --stages 1 2        # EDA + Classical
python run_pipeline.py --stages 3 4        # Quantum + Benchmark (needs 1 & 2 done prior)

# Skip quantum (faster iteration during development)
python run_pipeline.py --skip-quantum      # Runs stages 1, 2, 4

# Pipeline + server
python run_pipeline.py --serve             # Run pipeline, then start server
python run_pipeline.py --serve-only        # Just start server (artifacts must exist)

# View stage/artifact info
python run_pipeline.py --list              # Print stage descriptions and what each creates
```

---

## FastAPI Server (`app/main.py`)

The server exposes these endpoints (auto-documented at `http://127.0.0.1:8000/docs`):

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/datasets` | GET | List available datasets and metadata |
| `/api/eda/{dataset_key}` | GET | EDA report + figure links |
| `/api/classical/{dataset_key}` | GET | Classical SVM results + figures |
| `/api/quantum/{dataset_key}` | GET | Quantum QSVM results + figures |
| `/api/benchmark/{dataset_key}` | GET | Benchmark comparison + verdict |
| `/api/cross-disease` | GET | Cross-disease synthesis |
| `/api/reports/{report_name}` | GET | Fetch any markdown report |
| `/api/predict` | POST | Real-time patient risk prediction (Classical + Quantum + Hybrid) |
| `/figures/**` | Static | All generated figure PNGs |
| `/` | Static | Frontend dashboard (served from `../frontend/`) |

**`dataset_key`** is either `"cancer"` or `"cardiovascular"`.

### Starting the server

```bash
# Option A: via run_pipeline.py
python run_pipeline.py --serve-only

# Option B: via the root launcher
cd ..
python run_platform.py

# Option C: directly via uvicorn
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

---

## Datasets

| Dataset | Source | Samples | Features | Target |
|---|---|---|---|---|
| Breast Cancer WDBC | `sklearn.datasets.load_breast_cancer` | 569 | 30 numerical | 0=Benign, 1=Malignant |
| UCI Heart Disease | `app/datasets/heart.csv` | 303 | 13 clinical | 0=Healthy, 1=Heart Disease |

Both datasets are compressed to **4 principal components** for quantum circuit encoding via `PCA(n_components=4)`, then mapped to rotation angles in `[0, π]`.

---

## Dependencies

The project uses a virtual environment at `.venv/`. Key packages:

| Package | Purpose |
|---|---|
| `numpy`, `pandas`, `scipy` | Numerical computing & statistics |
| `scikit-learn` | Classical SVM, preprocessing, metrics |
| `matplotlib`, `seaborn` | Publication-quality figures |
| `qiskit` (2.x) | Quantum circuits & statevector simulation |
| `qiskit-aer` | Quantum noise simulation |
| `qiskit-machine-learning` | Quantum ML utilities |
| `joblib` | Model serialization |
| `fastapi`, `uvicorn` | REST API server |

Install all dependencies:
```bash
pip install numpy pandas scipy scikit-learn matplotlib seaborn qiskit qiskit-aer qiskit-machine-learning joblib fastapi uvicorn
```

---

## Research Configuration

These constants are shared across all pipeline stages (defined at the top of each script):

| Parameter | Value | Meaning |
|---|---|---|
| `RANDOM_STATE` | 42 | Reproducibility seed |
| `TEST_SIZE` | 0.20 | 80/20 stratified train/test split |
| `N_QUBITS` | 4 | Number of qubits for quantum feature map |
| `PCA_COMPONENTS` | 4 | Dimensionality reduction target (= N_QUBITS) |
| `CV_FOLDS` | 5 | Stratified cross-validation folds |
| `FEATURE_MAP_REPS` | 2 | ZZFeatureMap repetition depth |
| `BACKEND` | `"ideal"` | Quantum simulation mode (ideal/shots/noisy) |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Stage 4 fails with "Missing result artifacts" | Run stages 2 and 3 first: `python run_pipeline.py --stages 1 2 3 4` |
| Stage 3 is too slow | Use `--skip-quantum` for faster iteration; quantum stage runs noise simulations |
| Import errors | Make sure `.venv` is activated and all packages installed |
| Server says "EDA report not found" | Run the pipeline first: `python run_pipeline.py` before starting the server |
| Port 8000 already in use | Kill the existing process or change port in `run_platform.py` / uvicorn call |
