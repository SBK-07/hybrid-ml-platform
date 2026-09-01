# Walkthrough - SIH 2026 PS 139 Hybrid Quantum ML Platform MVP

We have fully designed, implemented, and verified the **Hybrid Quantum-Classical Machine Learning Platform for Early Disease Detection** (SIH 2026 PS 139).

## Key Accomplishments

### 1. Phased Backend & Data Engine (`backend/app/`)
- **Dataset Manager** (`app/dataset_generator.py`): Auto-generates and validates 3 pre-packaged biomedical benchmark datasets:
  - **UCI Heart Disease** (13 clinical features)
  - **PIMA Indians Diabetes** (8 metabolic features)
  - **Parkinson's Voice Recording** (13 acoustic features)
- **Data Preprocessing & PCA Quantum Compression** (`app/preprocessor.py`):
  - Class rebalancing using **SMOTE**.
  - **PCA Feature Reduction** compressing high-dimensional clinical inputs down to 4 qubits to fit quantum circuit limits.
  - 2D PCA coordinate projection generation for scatter plot visualization.
- **Quantum & Hybrid Model Engine** (`app/models_engine.py`):
  - **Classical Baselines**: Logistic Regression, Random Forest, SVM (RBF), XGBoost.
  - **Quantum Support Vector Machine (QSVM)**: Vectorized Angle-Encoding Quantum Kernel ($K_{ij} = \prod_k \cos^2((x_{ik}-x_{jk})/2)$).
  - **Variational Quantum Classifier (VQC)**: 4-qubit Parameterized Quantum Circuit with $RY/RZ$ state preparation and $CNOT$ entangling layers via **PennyLane**.
  - **Hybrid Fusion Engine**: Stacked soft-voting ensemble combining Classical RF and QSVM probabilities.
- **Explainability Engine** (`app/explainability.py`):
  - **SHAP (SHapley Additive exPlanations)** feature attribution scoring.
  - Clinician-facing plain-language diagnostic summary generator.
- **FastAPI REST Server** (`app/main.py`): Exposes REST endpoints (`/api/datasets`, `/api/preprocess`, `/api/train`, `/api/benchmark`, `/api/explain`, `/api/predict`).

---

### 2. Modern 7-Stage Pipeline UI (`frontend/`)
Built with modern CSS, dark theme styling, glassmorphism, responsive navigation, and Chart.js integration:
1. **Overview & Pipeline**: Architectural pitch, persistent dataset selector, and 6-stage storyline map.
2. **Data Ingestion**: Interactive data preview table & raw class distribution doughnut chart.
3. **PCA & Compression**: Feature reduction panel (13 features → 4 qubits) & interactive 2D PCA scatter plot.
4. **Hybrid Training**: Model toggle cards, PennyLane circuit metadata chips, and live training progress indicator.
5. **Benchmarking Dashboard (Centerpiece)**: Full comparative matrix (Accuracy, Sensitivity, Specificity, F1, AUC, Training Latency) & grouped bar chart. Includes explicit **Simulator Reality Check** banner.
6. **Explainability (SHAP)**: SHAP feature importance horizontal bar chart & clinician interpretability guide.
7. **Live Patient Prediction**: Interactive clinical parameters form, 3-way side-by-side diagnostic cards, and automated clinician report.

---

## Verification Results

The backend data pipeline was verified end-to-end via `python backend/test_backend.py`:

```text
==================================================
SIH 2026 PS 139 - BACKEND PIPELINE VERIFICATION TEST
==================================================

[1] Loading dataset: Heart Disease (303 rows x 14 columns)
[2] Running Preprocessing & PCA Feature Reduction to 4 Qubits...
    - SMOTE Samples Count: 518
    - Target Qubits: 4
    - PCA Total Explained Variance: 44.18%

[3] Training Classical Baseline & Quantum Models (PennyLane)...

--- BENCHMARKING RESULTS TABLE ---
Model                            | Category   | Accuracy | Sens(Recall) | Specificity | F1-Score | AUC-ROC  | Time (s)
-------------------------------------------------------------------------------------------------------------------
Logistic Regression              | Classical  | 94.98%   | 93.82%       | 96.14%      | 94.92%   | 0.9909   | 0.014s   
Random Forest                    | Classical  | 99.23%   | 99.23%       | 99.23%      | 99.23%   | 0.9998   | 0.288s   
SVM (RBF)                        | Classical  | 98.26%   | 97.30%       | 99.23%      | 98.25%   | 0.9994   | 0.125s   
XGBoost                          | Classical  | 100.00%  | 100.00%      | 100.00%     | 100.00%  | 1.0000   | 0.231s   
QSVM (Quantum Kernel)            | Quantum    | 92.66%   | 90.35%       | 94.98%      | 92.49%   | 0.9779   | 0.089s   
VQC (Variational Quantum)        | Quantum    | 52.12%   | 64.48%       | 39.77%      | 57.39%   | 0.5151   | 7.071s   
Hybrid Fusion (Classical + QML)  | Hybrid     | 95.75%   | 94.59%       | 96.91%      | 95.70%   | 0.9966   | 0.001s   

[4] Top Driving Clinical Features (SHAP):
    - Chest Pain Type (cp): 25.2%
    - Number of Major Vessels (ca): 17.34%
    - ST Depression (oldpeak): 15.94%
    - Max Heart Rate (thalach): 13.17%

[5] Live Patient 3-Way Inference:
    * Classical (Random Forest): Label=1 (High Risk) | Probability=93.0%
    * Quantum (QSVM):            Label=1 (High Risk) | Probability=78.3%
    * Hybrid Fusion:             Label=1 (High Risk) | Probability=85.6%

--- CLINICIAN PLAIN-LANGUAGE SUMMARY ---
Diagnostic Assessment: POSITIVE (High Disease Risk) with 85.6% confidence.
Key Clinical Risk Drivers: cp (3), ca (0), oldpeak (2.3).
Quantum-Classical Consensus: Classical = 93.0%, Quantum = 78.3%.
```

---

## How to Run the Platform

To launch the complete application with a single command:

```powershell
python run_platform.py
```

- **Interactive 7-Stage Dashboard**: [http://localhost:8000/app](http://localhost:8000/app)
- **FastAPI REST API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
