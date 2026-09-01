# Implementation Plan - SIH 2026 PS 139: Hybrid Quantum-Classical ML Platform for Early Disease Detection

## Executive Overview & Problem Alignment

Yes, **SIH 2026 Problem Statement 139** ("Hybrid Quantum Machine Learning Platform for Early Disease Detection") is an outstanding choice. Based on the literature review analysis of 80+ papers:
1. **Existing Research Gap**: Current studies implement isolated QML prototypes (e.g., 4-qubit QSVM on a single dataset) without a scalable platform. Purely classical frameworks lack quantum integration, while QML papers lack auditable feature compression, classical baselines, and transparent explainability.
2. **Winning Hackathon Differentiator**: Rather than building another standalone notebook, this project builds an **end-to-end benchmarkable software platform** that accepts biomedical datasets, compresses features to qubit limits via PCA/LDA, trains classical vs quantum vs hybrid models, generates SHAP explainability, and presents a live 3-way prediction comparison.

To eliminate overwhelm, we will execute a **decoupled, backend-first strategy**:
- **Phase 1 (Backend Core)**: Data ingestion, feature reduction (PCA to Qubits), classical models (LR, RF, SVM, XGBoost), QML models (QSVM, VQC via PennyLane/Qiskit), and SHAP explainability.
- **Phase 2 (Minimal Verification UI)**: FastAPI Swagger docs + light HTML/Streamlit test script to verify API contracts and predictions end-to-end.
- **Phase 3 (Frontend Production UI)**: Modern React/Vite pipeline dashboard with dark mode, interactive charts, and 7-stage narrative flow.

---

## Architecture & Data Flow

```
[ Biomedical Dataset ] ──> [ Preprocessing & SMOTE ] ──> [ PCA / LDA Compression (N Qubits) ]
                                                                      │
                         ┌────────────────────────────────────────────┴────────────────────────────────────────────┐
                         ▼                                            ▼                                            ▼
           [ Classical Suite ]                          [ Quantum Suite (PennyLane/Qiskit) ]                   [ Hybrid Fusion Engine ]
      (LR, RF, SVM, XGBoost)                            (QSVM Kernel, VQC Circuit)                        (Weighted Ensemble Meta-Learner)
                         │                                            │                                            │
                         └────────────────────────────────────────────┼────────────────────────────────────────────┘
                                                                      ▼
                                                   [ Benchmarking & Explainability ]
                                                   (Metrics, SHAP, Qubit Metadata)
                                                                      │
                                                                      ▼
                                                   [ REST API (FastAPI) ]
                                                                      │
                                                                      ▼
                                             [ Frontend Dashboard (7-Stage Storyline) ]
```

---

## Proposed Component Breakdown

### 1. Dataset Management & Preprocessing Module
- **Pre-packaged Datasets**:
  1. **UCI Heart Disease** (13 features → 4–6 qubits, Binary classification)
  2. **PIMA Indians Diabetes** (8 features → 4 qubits, Binary classification)
  3. **Parkinson's Voice Dataset** (22 features → 4–6 qubits, Binary classification)
- **Custom CSV Upload**: Dynamically parse CSV, check target column, compute class imbalance.
- **Dimensionality Reduction & Preprocessing**:
  - Class imbalance handling using **SMOTE** (Synthetic Minority Over-sampling Technique).
  - Feature compression via **PCA** (Principal Component Analysis) or **LDA** to scale high-dimensional features down to 4–8 quantum attributes (matching simulator/NISQ hardware constraints).

### 2. Machine Learning & QML Model Engine
- **Classical Baselines**:
  - Logistic Regression, Random Forest, SVM (RBF kernel), XGBoost.
- **Quantum Machine Learning Models (PennyLane / Qiskit Aer)**:
  - **QSVM (Quantum Support Vector Machine)**: Uses Quantum Feature Map (Angle / ZZ Encoding) to compute quantum kernel matrices.
  - **VQC (Variational Quantum Classifier)**: Parameterized Quantum Circuit (PQC) with data re-uploading ansatz, optimized using classical optimizers (Adam/COBYLA).
- **Hybrid Fusion Classifier**:
  - Stacking meta-classifier combining soft probabilities from Classical (XGBoost/RF) + Quantum (QSVM/VQC) to achieve superior accuracy and generalization.

### 3. Benchmarking & Explainability Module
- **Metrics Evaluator**: Computes Accuracy, Sensitivity (Recall), Specificity, Precision, F1-Score, ROC-AUC, and Training Latency across all models.
- **Explainability (XAI)**:
  - **SHAP (SHapley Additive exPlanations)** for feature attribution.
  - Plain-language clinician summary (top 3 risk drivers per prediction).
- **Hardware & Simulator Metadata**: Qubit count, shot count (e.g., 1024), quantum circuit depth, gate counts, simulator backend (PennyLane `default.qubit` / Qiskit Aer).

### 4. FastAPI REST Backend Endpoints
- `GET /api/health` - Health check.
- `GET /api/datasets` - Return available pre-loaded sample datasets & metadata.
- `POST /api/preprocess` - Upload/select dataset, apply SMOTE, perform PCA feature reduction, return dataset stats & scatter plot coordinates.
- `POST /api/train` - Trigger training for selected models (Classical, Quantum, Hybrid) with live metrics return.
- `GET /api/benchmark` - Return aggregated model evaluation matrix & comparison data.
- `POST /api/explain` - Return SHAP feature importance scores and plain text summary.
- `POST /api/predict` - Perform real-time patient prediction, returning 3-way comparisons (Classical vs Quantum vs Hybrid) with confidence scores.

### 5. Minimal Interactive Verification UI (Phase 2)
- FastAPI built-in `/docs` interactive Swagger interface.
- Lightweight standalone HTML/JS or python script to test complete end-to-end data pass without frontend dependency.

### 6. Modern Frontend Pipeline Dashboard (Phase 3)
Built with React/Vite, CSS design system, and Lucide icons:
1. **Landing / Overview**: Platform introduction, dataset selector, 6-stage pipeline map.
2. **Data Ingestion**: Dataset selector / CSV drag-drop, dataset preview table, class balance chart.
3. **Preprocessing & Compression**: Feature compression view (13 features → 4 qubits), interactive PCA scatter plot.
4. **Model Training**: Model toggle cards, quantum circuit parameter configs, training status feedback.
5. **Benchmarking Dashboard (Centerpiece)**: Comparative performance table, grouped metric bar charts, reality-check simulator callout.
6. **Explainability**: SHAP feature importance visualization, plain-language patient risk explanation.
7. **Live Prediction**: Form for entering patient clinical parameters, 3-way prediction confidence cards.

---

## User Review Required

> [!IMPORTANT]
> **QML Framework Selection**: We recommend using **PennyLane** (backed by PyTorch/Scikit-Learn integration) for quantum circuit simulation as it supports rapid gradient optimization for VQC and QSVM kernels, with seamless fallback to Qiskit Aer simulators.

> [!NOTE]
> **Tabular-First Approach**: Starting with tabular biomedical datasets (Heart, Diabetes, Parkinson's) ensures high model convergence speed and low latency for quantum simulation on CPU. Imaging support (e.g., Alzheimer's MRI pre-extracted ResNet vectors) can be connected as an advanced extension.

---

## Step-by-Step Implementation Roadmap

```
Step 1: Setup Backend Environment (FastAPI, PennyLane, Scikit-Learn, Pandas, SHAP)
  └─ Step 2: Implement Data Preprocessing & PCA Quantum Compressor
       └─ Step 3: Implement Classical Baselines & QML Models (QSVM, VQC, Hybrid)
            └─ Step 4: Build FastAPI Endpoints & Test via Swagger / Python Script
                 └─ Step 5: Initialize React/Vite Frontend Infrastructure
                      └─ Step 6: Assemble 7-Stage Pipeline Pages & Connect Backend
```

---

## Verification Plan

### Automated & Backend Verification
1. **Backend Test Script**: Verify API responses for preprocessing, training, evaluation metrics, SHAP values, and predictions using sample Heart Disease data.
2. **Quantum Circuit Check**: Verify circuit execution without memory overload (keeping qubit count $\le 6$).

### Manual & Visual Verification
1. **Swagger UI Validation**: Exercise `/api/predict` and `/api/benchmark` endpoints directly in browser.
2. **Frontend Workflow Test**: Walk through all 7 stages from data selection to live patient prediction.
