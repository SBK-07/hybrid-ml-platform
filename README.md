# Q-Med: Adaptive Multimodal Hybrid Quantum Clinical Intelligence Framework
> **SIH 2026 Problem Statement ID:** 26139 | **Theme:** MedTech / HealthTech | **Organization:** Egreen Quanta  
> **Platform Version:** 2.0.0 (Research & Production Grade)

---

## 📌 Executive Overview

**Q-Med** is a state-of-the-art hybrid quantum-classical biomedical intelligence platform developed for early disease detection across oncology (Breast Cancer WDBC), cardiology (UCI Heart Disease), metabolic syndromes (Diabetes), and neurology (Parkinson's).

The platform bridges classical clinical machine learning and near-term quantum machine learning (QML) through:
- **Multimodal Data Intelligence:** Automated ingestion and feature extraction for tabular clinical records, biomedical image patches (GLCM texture, Sobel gradients), and electrophysiological biosignals (FFT power spectra, wavelet entropy).
- **Quantum Hardware Feasibility:** Auditable dimensionality reduction down to 4 qubits via train-only PCA ($\ge 79.2\%$ variance retention) and Bloch sphere angle mapping ($[0, \pi]$) for $ZZFeatureMap$ quantum kernel estimation.
- **Multimodal Adaptive Consensus:** Early, Intermediate, and Late fusion with dynamic missing-modality compensation preserving $99.4\%$ accuracy during emergency clinical triage.
- **Explainable AI & Clinical Safety:** Permutation and SHAP biomarker attributions, 3D Bloch sphere projections, and dual Epistemic vs. Aleatoric uncertainty quantification.
- **Interactive Step-by-Step Animated Pipeline:** A live execution simulator displaying classical synaptic activations, 4-qubit quantum statevector pulse waves, and streaming telemetry.

> 📖 **Exhaustive Architectural Specification:** For the complete mathematical formulation, offline vs. online execution mechanics, multimodal ingestion protocols, and button-to-result lifecycle traces, see [**`SYSTEM_WORKFLOW_ARCHITECTURE.md`**](./SYSTEM_WORKFLOW_ARCHITECTURE.md).

---

## 🏗️ 7-Stage End-to-End Workflow Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 1. MULTIMODAL INGESTION & SNIFFING                                │
│          [ Tabular CSV Records ] ── [ Biopsy Images (GLCM) ] ── [ Biosignals (FFT PSD) ]         │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │
┌────────────────────────────────────────────────▼─────────────────────────────────────────────────┐
│                           2. LEAK-FREE CLINICAL PREPROCESSING & SPLIT                             │
│                  [ Stratified 80/20 Split ] ── [ Train-Only StandardScaler ]                      │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │
                     ┌───────────────────────────┴───────────────────────────┐
                     ▼                                                       ▼
┌──────────────────────────────────────────┐   ┌───────────────────────────────────────────────────┐
│     3. CLASSICAL ML OPTIMIZATION         │   │       4. QUANTUM STATE PREPARATION & ENCODING     │
│  • Linear, RBF (C=100, γ=0.001), Poly SVM│   │  • Train-Only PCA Compression to 4 Qubits         │
│  • Multi-Layer Perceptron (128→64)       │   │  • Linear Bloch Angle Scaling: θ ∈ [0, π]         │
│  • 5-Fold Stratified Cross-Validation    │   │  • ZZFeatureMap(reps=2, 6 CNOTs) in H = ℂ¹⁶       │
└────────────────────┬─────────────────────┘   └─────────────────────────┬─────────────────────────┘
                     │                                                   │
                     └───────────────────────────┬───────────────────────┘
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             5. MULTIMODAL ADAPTIVE CONSENSUS FUSION                              │
│         Early Feature Fusion ── Intermediate Bilinear Alignment ── Late Adaptive Consensus       │
│                  Missing-Modality Dynamic Fallback Engine (Zero Pipeline Crash)                  │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          6. EXPLAINABILITY & UNCERTAINTY QUANTIFICATION                          │
│        SHAP Feature Risk Waterfall ── 3D Bloch Sphere Projections ── Epistemic/Aleatoric Gap     │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             7. CLINICAL REPORTING & EXPERIMENT AUDIT                             │
│       Reproducible SHA-256 Provenance Hashing ── Downloadable Clinician Diagnostic Reports       │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Frameworks & Libraries |
| :--- | :--- |
| **Backend API & Core** | Python 3.10 / 3.11, FastAPI, Uvicorn, Pydantic v2 |
| **Quantum Machine Learning (QML)** | Qiskit 2.x, Qiskit Aer Statevector Simulator, Quantum Circuit Transpilation |
| **Classical Machine Learning** | Scikit-Learn (SVM, MLP, PCA, Cross-Validation), NumPy, SciPy |
| **Multimodal Processing** | Pillow (PIL), GLCM Texture Descriptors, Sobel Spatial Filters, SciPy FFT |
| **Frontend User Interface** | Modern React 18 SPA, Vite, Lucide Icons, Canvas 2D/3D Animation Engine |
| **AI Decision Support** | Quddos Clinical AI reasoning service with cross-modal context |

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Python 3.10 or 3.11**
- **Node.js 18+** and `npm`

### 2. Backend Installation & Launch

```bash
# Navigate to project root
cd D:/SIH26/hybrid-ml-platform

# Activate Python virtual environment
# On Windows:
backend\.venv\Scripts\activate
# On Linux/macOS:
source backend/.venv/bin/activate

# Install Python dependencies (if not already installed)
pip install -r backend/requirements.txt

# Launch FastAPI backend on port 8000
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
- **Backend API:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`

### 3. Frontend Installation & Launch

In a second terminal window:

```bash
cd frontend
npm install
npm run dev
```
- **Frontend Web Application:** `http://localhost:5173`

---

## 🔬 Running the Complete CLI Pipeline (Offline Retraining)

To execute the complete 5-stage Python training pipeline from scratch, compute quantum statevector Gram matrices, and generate verified research figures:

```bash
# Run end-to-end training and benchmark evaluation
python backend/run_pipeline.py
```

### Running Individual Pipeline Stages:
```bash
# Stage 1: Preprocessing, Leak-Free Imputation & PCA Compression
python backend/01_eda_preprocessing.py

# Stage 2: Train Classical Models (Linear SVM, RBF SVM, Poly SVM, MLP)
python backend/02_classical_algorithms.py

# Stage 3: Train Quantum Models (QSVM ZZFeatureMap, QNN RealAmplitudes, QVC EfficientSU2)
python backend/03_quantum_algorithms.py

# Stage 4: Generate Radar Charts & Multi-Model Comparative Visualizations
python backend/04_benchmark.py
```

---

## 📁 Repository Structure

```text
hybrid-ml-platform/
├── SYSTEM_WORKFLOW_ARCHITECTURE.md  # Definitive master workflow & mathematical deep-dive
├── README.md                        # Platform overview & quickstart guide
│
├── backend/
│   ├── run_pipeline.py              # Master CLI pipeline runner (Stages 1–4)
│   ├── 01_eda_preprocessing.py      # Stage 1: Data ingestion & PCA compression
│   ├── 02_classical_algorithms.py   # Stage 2: Classical SVM & Neural Network baselines
│   ├── 03_quantum_algorithms.py     # Stage 3: Qiskit 2.x QSVM, QNN, & QVC circuits
│   ├── 04_benchmark.py              # Stage 4: Research charts & statistical synthesis
│   ├── ai_service.py                # Quddos AI contextual clinical assistant
│   ├── universal_preprocessor.py    # Zero-leakage scaler & PCA transformer
│   ├── requirements.txt             # Backend Python dependencies
│   │
│   ├── app/
│   │   ├── main.py                  # FastAPI REST API endpoints
│   │   ├── schemas.py               # Pydantic v2 data contracts
│   │   └── datasets/                # Standardized biomedical benchmark datasets
│   │
│   ├── modules/                     # Modular Research & Clinical Intelligence Engine
│   │   ├── data_intelligence.py     # Modality sniffer & multi-format ZIP/image parser
│   │   ├── imaging_pipeline.py      # GLCM texture & spatial gradient feature extraction
│   │   ├── signal_pipeline.py       # FFT spectral power & entropy feature extraction
│   │   ├── common_representation.py # Unified clinical latent space mapping (𝒵)
│   │   ├── fusion_engine.py         # Early, Intermediate, & Late Adaptive Fusion
│   │   ├── quantum_feasibility.py   # Circuit depth, gate counts & noise budget analysis
│   │   ├── explainability.py        # Permutation SHAP & Bloch sphere state mapping
│   │   ├── uncertainty_engine.py    # Epistemic vs. Aleatoric uncertainty quantification
│   │   └── experiment_tracker.py    # SHA-256 artifact provenance & JSON audit ledger
│   │
│   └── results/                     # Precomputed verified metrics & figure plots
│       ├── classical/               # Classical model metrics JSON
│       ├── quantum/                 # Quantum model metrics JSON
│       ├── benchmark/               # Comparison figures (radar charts, bar charts)
│       └── figures/                 # ROC curves, confusion matrices, PCA plots
│
└── frontend/
    ├── package.json                 # Frontend dependencies (React 18, Vite, Lucide)
    ├── vite.config.js               # Vite build & backend proxy configuration
    ├── index.html                   # HTML5 application root
    └── src/
        ├── App.jsx                  # Main application router & persistent shell
        ├── index.css                # Enterprise design system & theme variables
        │
        ├── components/
        │   ├── Header.jsx           # Global header with dataset status
        │   ├── Sidebar.jsx          # 5-stage primary navigation bar
        │   ├── CardActionMenu.jsx   # 4-action card menu (Save, Explain, Share, Export)
        │   └── PipelineExecutionModal.jsx # 7-stage animated pipeline visualizer
        │
        ├── pages/
        │   ├── OverviewSection.jsx      # Stage 1: Interactive architecture map
        │   ├── IndividualExperiment.jsx # Stage 2: Single model training & quantum telemetry
        │   ├── CumulativeExperiment.jsx # Stage 3: 5-model benchmark & multimodal fusion
        │   ├── LivePatientInference.jsx # Stage 4: Real-time risk inference & uncertainty
        │   ├── AdaptiveReport.jsx       # Stage 5: Dynamic clinician audit report
        │   └── QuddosAI.jsx             # Dedicated AI conversational copilot
        │
        └── services/
            └── api.js               # Centralized Axios REST client with offline fallback
```

---

## 📊 Benchmark Summary: Classical vs. Quantum vs. Hybrid

| Evaluation Metric | Classical SVM (RBF) | Quantum SVM ($ZZFeatureMap$) | Multimodal Consensus (Q-Med) |
| :--- | :---: | :---: | :---: |
| **Diagnostic Accuracy** | $97.37\%$ | $85.09\%$ | **$98.50\%$** |
| **Sensitivity (Recall)** | $95.24\%$ | $80.95\%$ | **$97.62\%$** |
| **Specificity** | $98.61\%$ | $87.50\%$ | **$99.00\%$** |
| **ROC-AUC Score** | $0.9962$ | $0.9162$ | **$0.9991$** |
| **Training Latency** | $0.041\text{s}$ | $14.12\text{s}$ | Sub-second consensus |
| **Circuit Depth / Gates** | N/A (Convex Dual) | $19\text{ layers} / 24\text{ gates}$ | Optimized 4-qubit embedding |
| **Missing Modality Fallback** | Crash if missing | Crash if missing | **$99.4\%$ retention preserved** |

---

## 🔒 Clinical & Ethical Safeguards

1. **Non-Diagnostic Framing:** Q-Med is engineered strictly as a **Clinical Decision Support System (CDSS)** to augment clinical workflows, not replace physician judgment.
2. **Deterministic Reproducibility:** Every experiment run is assigned an immutable SHA-256 provenance hash logged to `backend/results/experiment_history.json`.
3. **Transparent Uncertainty:** Borderline or discordant predictions are highlighted with elevated Epistemic Uncertainty, flagging the patient for secondary histopathological confirmation.

---
*Built with ❤️ for SIH 2026 Problem Statement 26139.*
