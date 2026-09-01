# Q-Med: Hybrid Quantum-Classical ML Platform for Early Disease Detection
> **SIH 2026 Problem Statement ID**: 26139 | **Theme**: MedTech / HealthTech | **Organization**: Egreen Quanta

---

## 📌 Executive Overview
**Q-Med** is an end-to-end benchmarkable software platform designed for early disease detection across tabular biomedical datasets (Heart Disease, Diabetes, Parkinson's). 

While existing research literature focuses on isolated quantum machine learning (QML) notebook experiments, **Q-Med** provides a complete clinical pipeline that bridges classical feature preprocessing, auditable PCA dimensionality reduction down to qubit constraints, classical baseline comparisons, PennyLane quantum circuit models, SHAP explainability, and real-time patient risk inference.

---

## 🏗️ System Architecture & 7-Stage Workflow

```
[ Raw Biomedical CSV ] ──> [ SMOTE Rebalance & PCA Compression (4 Qubits) ]
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
       [ Classical Baseline Suite ]                  [ Quantum Circuit Suite (PennyLane) ]
  (LR, Random Forest, SVM, XGBoost)                      (QSVM Kernel, VQC Circuit)
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            ▼
                                [ Hybrid Fusion Ensemble ]
                                            │
                                            ▼
                           [ SHAP Explainability & Live UI ]
```

### The 7 Narrative Pipeline Stages
1. **Landing & Overview**: Platform context setting and 6-stage interactive architecture map.
2. **Data Ingestion**: Multi-dataset selector (Heart Disease, Diabetes, Parkinson's) & raw class balance visualizer.
3. **Preprocessing & Compression**: Class rebalancing via SMOTE and feature reduction down to 4 qubits via PCA.
4. **Hybrid Model Training**: Live execution of Classical baselines & PennyLane quantum statevector circuits.
5. **Benchmarking Dashboard (Centerpiece)**: Full performance matrix (Accuracy, Sensitivity, Specificity, F1, AUC-ROC, Latency) & simulator reality check banner.
6. **Explainability (XAI)**: SHAP (SHapley Additive exPlanations) feature attribution bar chart & clinician risk summaries.
7. **Live Patient Risk Inference**: Interactive clinical input form, 3-way side-by-side diagnostic cards, and automated clinician diagnostic report.

---

## 🛠️ Tech Stack

* **Backend & API Framework**: Python 3.11, FastAPI, Uvicorn
* **Quantum Machine Learning (QML)**: PennyLane (Xanadu QML Simulator), Qiskit Aer compatibility
* **Classical Machine Learning**: Scikit-Learn, XGBoost, Imbalanced-Learn (SMOTE)
* **Explainable AI (XAI)**: SHAP
* **Frontend UI**: Modern HTML5, Vanilla JavaScript, CSS3 Glassmorphism design system, Chart.js

---

## 🚀 Quickstart Guide

### 1. Installation & Environment Setup
Clone the repository and install dependencies:

```bash
git clone https://github.com/SBK-07/hybrid-ml-platform.git
cd hybrid-ml-platform
pip install -r backend/requirements.txt
```

### 2. Launch the Platform
Start the FastAPI server and interactive web frontend with a single command:

```bash
python run_platform.py
```

### 3. Open in Browser
- **Interactive Web App**: [http://localhost:8000/app](http://localhost:8000/app)
- **Interactive REST API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Repository Directory Structure

```text
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI REST API endpoints
│   │   ├── dataset_generator.py # Sample dataset builder
│   │   ├── preprocessor.py       # SMOTE & PCA Quantum Compressor
│   │   ├── models_engine.py      # Classical, PennyLane QML & Hybrid Models
│   │   ├── explainability.py     # SHAP feature importance & Clinician report
│   │   └── datasets/            # Pre-packaged biomedical benchmark CSVs
│   ├── requirements.txt
│   └── test_backend.py          # Automated verification test script
├── frontend/
│   ├── index.html               # 7-Stage pipeline HTML markup
│   ├── styles.css               # Glassmorphism dark mode stylesheet
│   └── app.js                   # REST API client & Chart.js renderer
├── .gitignore
├── run_platform.py              # Platform launcher script
└── README.md
```
