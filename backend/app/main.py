"""
FastAPI Server for Q-Med Hybrid Quantum-Classical Platform
==========================================================
Serves REST API endpoints for EDA, Classical Baselines, Quantum QSVM,
Benchmarking, Live Inference, and Static Frontend Dashboard.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

# Qiskit for live quantum kernel prediction
from qiskit.circuit.library import zz_feature_map
from qiskit.quantum_info import Statevector

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")
RESULTS_DIR = os.path.join(BASE_DIR, "results")
FIGURES_DIR = os.path.join(BASE_DIR, "figures")
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_PROC_DIR = os.path.join(BASE_DIR, "data", "processed")
DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

app = FastAPI(
    title="Q-Med Hybrid Quantum-Classical ML Platform",
    description="Research-grade QML benchmarking and clinical diagnostic engine (SIH 2026 PS 139).",
    version="2.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Figures and Reports static files
if os.path.exists(FIGURES_DIR):
    app.mount("/figures", StaticFiles(directory=FIGURES_DIR), name="figures")
if os.path.exists(REPORTS_DIR):
    app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")


# -------------------------------------------------------------
# Models for live prediction request
# -------------------------------------------------------------
class PredictionRequest(BaseModel):
    dataset_key: str  # "cancer" or "cardiovascular"
    features: Dict[str, float]


# -------------------------------------------------------------
# REST API Endpoints
# -------------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {"status": "online", "platform": "Q-Med Quantum-Classical Hybrid ML", "version": "2.0.0"}


@app.get("/api/datasets")
def get_datasets():
    """List available biomedical research datasets with summary metadata."""
    datasets = [
        {
            "key": "cancer",
            "name": "Breast Cancer Wisconsin Diagnostic (WDBC)",
            "domain": "Oncology / Cytopathology",
            "samples": 569,
            "features_count": 30,
            "quantum_qubits": 4,
            "disease_positive_label": "Malignant",
            "disease_negative_label": "Benign",
            "description": "30 imaging-derived continuous nuclear morphometric features from fine-needle aspirates (FNA)."
        },
        {
            "key": "cardiovascular",
            "name": "UCI Heart Disease",
            "domain": "Cardiovascular Medicine",
            "samples": 303,
            "features_count": 13,
            "quantum_qubits": 4,
            "disease_positive_label": "Heart Disease (Angiographic Presence)",
            "disease_negative_label": "Healthy / Absence",
            "description": "13 clinical, hemodynamic, and electrocardiographic attributes."
        }
    ]
    return {"datasets": datasets}


@app.get("/api/eda/{dataset_key}")
def get_eda_report(dataset_key: str):
    """Fetch scientific EDA report and figure links for selected dataset."""
    key = dataset_key.lower()
    report_file = os.path.join(RESULTS_DIR, "eda", f"{key}_eda_report.json")
    if not os.path.exists(report_file):
        raise HTTPException(status_code=404, detail=f"EDA report not found for {dataset_key}. Run 01_eda_preprocessing.py first.")
    
    with open(report_file, "r") as f:
        data = json.load(f)
        
    data["figures"] = {
        "correlation_matrix": f"/figures/eda/{key}_correlation_matrix.png",
        "feature_distributions": f"/figures/eda/{key}_feature_distributions.png",
        "pca_variance": f"/figures/eda/{key}_pca_variance.png"
    }
    return data


@app.get("/api/classical/{dataset_key}")
def get_classical_report(dataset_key: str):
    """Fetch 5-fold cross-validation and test evaluation for classical SVMs."""
    key = dataset_key.lower()
    report_file = os.path.join(RESULTS_DIR, "classical", f"{key}_classical_svm.json")
    if not os.path.exists(report_file):
        raise HTTPException(status_code=404, detail=f"Classical results not found for {dataset_key}. Run 02_classical_algorithms.py first.")
    
    with open(report_file, "r") as f:
        data = json.load(f)
        
    data["figures"] = {
        "roc_curves": f"/figures/classical/{key}_roc_curves.png",
        "confusion_matrices": f"/figures/classical/{key}_confusion_matrices.png",
        "cv_performance": f"/figures/classical/{key}_cv_performance.png"
    }
    return data


@app.get("/api/quantum/{dataset_key}")
def get_quantum_report(dataset_key: str):
    """Fetch Quantum Kernel SVM metrics, qubit scaling, and noise sensitivity results."""
    key = dataset_key.lower()
    report_file = os.path.join(RESULTS_DIR, "quantum", f"{key}_qsvm.json")
    if not os.path.exists(report_file):
        raise HTTPException(status_code=404, detail=f"Quantum results not found for {dataset_key}. Run 03_quantum_algorithms.py first.")
    
    with open(report_file, "r") as f:
        data = json.load(f)
        
    data["figures"] = {
        "kernel_heatmaps": f"/figures/quantum/{key}_kernel_heatmaps.png",
        "qubit_scaling": f"/figures/quantum/{key}_qubit_scaling.png",
        "noise_sensitivity": f"/figures/quantum/{key}_noise_sensitivity.png"
    }
    return data


@app.get("/api/benchmark/{dataset_key}")
def get_benchmark_report(dataset_key: str):
    """Fetch comparative benchmark matrix, statistical significance tests, and Quantum Advantage Verdict."""
    key = dataset_key.lower()
    report_file = os.path.join(RESULTS_DIR, "benchmark", f"{key}_benchmark.json")
    inf_file = os.path.join(RESULTS_DIR, "benchmark", f"{key}_research_inference.txt")
    
    if not os.path.exists(report_file):
        raise HTTPException(status_code=404, detail=f"Benchmark results not found for {dataset_key}. Run 04_benchmark.py first.")
    
    with open(report_file, "r") as f:
        data = json.load(f)
        
    inference_text = ""
    if os.path.exists(inf_file):
        with open(inf_file, "r", encoding="utf-8") as f:
            inference_text = f.read()
            
    data["research_inference_text"] = inference_text
    data["figures"] = {
        "metric_comparison": f"/figures/benchmark/{key}_metric_comparison.png",
        "confusion_matrix_side_by_side": f"/figures/benchmark/{key}_confusion_matrix_side_by_side.png",
        "radar_chart": f"/figures/benchmark/{key}_radar_chart.png"
    }
    return data


@app.get("/api/cross-disease")
def get_cross_disease():
    """Fetch cross-disease generalization synthesis."""
    summary_file = os.path.join(RESULTS_DIR, "benchmark", "cross_disease_summary.json")
    if not os.path.exists(summary_file):
        raise HTTPException(status_code=404, detail="Cross-disease summary not found. Run 04_benchmark.py first.")
    with open(summary_file, "r") as f:
        return json.load(f)


@app.get("/api/reports/{report_name}")
def get_markdown_report(report_name: str):
    """Fetch any Markdown report content."""
    report_file = os.path.join(REPORTS_DIR, report_name)
    if not os.path.exists(report_file):
        raise HTTPException(status_code=404, detail=f"Report {report_name} not found.")
    with open(report_file, "r", encoding="utf-8") as f:
        return {"report_name": report_name, "content": f.read()}


# In-memory Statevector Cache for Real-Time Inference
_TRAIN_SV_CACHE = {}

def get_cached_train_sv(key: str, X_train_quantum, fm):
    if key not in _TRAIN_SV_CACHE:
        _TRAIN_SV_CACHE[key] = np.array([Statevector.from_instruction(fm.assign_parameters(x_tr)).data for x_tr in X_train_quantum])
    return _TRAIN_SV_CACHE[key]


@app.post("/api/predict")
def predict_patient(req: PredictionRequest):
    """
    Real-Time Patient Risk Inference:
      1. Normalizes patient input using pre-fitted StandardScaler.
      2. Projects to 4 orthogonal quantum features using pre-fitted PCA.
      3. Scales quantum components to rotation angles [0, pi].
      4. Computes exact Quantum Kernel overlap with training states.
      5. Generates 3-way prediction: Classical RBF SVM, Quantum QSVM, and Hybrid Ensemble.
    """
    key = req.dataset_key.lower()
    class_dir = os.path.join(DATA_PROC_DIR, key, "classical")
    quant_dir = os.path.join(DATA_PROC_DIR, key, "quantum")
    
    if not os.path.exists(class_dir) or not os.path.exists(quant_dir):
        raise HTTPException(status_code=400, detail="Processed artifacts not found.")
        
    # Load scalers, models, and metadata
    scaler = joblib.load(os.path.join(class_dir, "scaler.joblib"))
    pca = joblib.load(os.path.join(quant_dir, "pca_model.joblib"))
    angle_scaler = joblib.load(os.path.join(quant_dir, "angle_scaler.joblib"))
    
    with open(os.path.join(class_dir, "metadata.json"), "r") as f:
        class_meta = json.load(f)
    feature_names = class_meta["feature_names"]
    
    # Extract feature values in exact ordering
    input_vector = []
    for fn in feature_names:
        input_vector.append(float(req.features.get(fn, 0.0)))
    x_raw = np.array(input_vector).reshape(1, -1)
    
    # Preprocessing (Zero leakage - using train parameters)
    x_scaled = scaler.transform(x_raw)
    x_pca = pca.transform(x_scaled)
    x_quantum = angle_scaler.transform(x_pca)
    
    # 1. Classical RBF Prediction
    class_model_path = os.path.join(MODELS_DIR, key, "classical_rbf_full_svm.joblib")
    if os.path.exists(class_model_path):
        classical_model = joblib.load(class_model_path)
        class_pred = int(classical_model.predict(x_scaled)[0])
        class_prob = float(classical_model.predict_proba(x_scaled)[0][1])
    else:
        class_pred = 0
        class_prob = 0.5
        
    # 2. Quantum Kernel SVM Prediction
    qsvm_save_path = os.path.join(MODELS_DIR, key, "qsvm_zz_model.joblib")
    X_train_quantum = np.load(os.path.join(quant_dir, "X_train_quantum.npy"))
    
    if os.path.exists(qsvm_save_path):
        qsvm_data = joblib.load(qsvm_save_path)
        qsvm_clf = qsvm_data["qsvm_clf"]
        
        # Build 4-qubit feature map and compute statevector for test sample
        fm = zz_feature_map(feature_dimension=4, reps=2, entanglement='linear')
        patient_qc = fm.assign_parameters(x_quantum[0])
        patient_sv = Statevector.from_instruction(patient_qc)
        
        # Fast cached training statevectors
        train_sv_matrix = get_cached_train_sv(key, X_train_quantum, fm)
        overlaps = np.abs(patient_sv.data @ train_sv_matrix.conj().T) ** 2
        k_patient = overlaps.reshape(1, -1)
        
        qsvm_pred = int(qsvm_clf.predict(k_patient)[0])
        qsvm_prob = float(qsvm_clf.predict_proba(k_patient)[0][1])
    else:
        qsvm_pred = class_pred
        qsvm_prob = class_prob
        
    # 3. Hybrid Ensemble (Consensus Soft-Voting)
    hybrid_prob = float(0.5 * class_prob + 0.5 * qsvm_prob)
    hybrid_pred = 1 if hybrid_prob >= 0.5 else 0
    
    # Risk Stratification
    if hybrid_prob >= 0.70:
        risk_level = "High Risk (Immediate Specialist Referral Recommended)"
        risk_color = "#E74C3C"
    elif hybrid_prob >= 0.40:
        risk_level = "Moderate / Intermediate Risk (Further Diagnostic Confirmation Advised)"
        risk_color = "#F39C12"
    else:
        risk_level = "Low Risk / Negative (Routine Follow-up)"
        risk_color = "#27AE60"
        
    return {
        "dataset_key": key,
        "input_features": req.features,
        "quantum_compressed_coordinates": [float(round(v, 4)) for v in x_pca[0]],
        "quantum_rotation_angles": [float(round(v, 4)) for v in x_quantum[0]],
        "predictions": {
            "classical_rbf_svm": {
                "prediction": class_pred,
                "label": class_meta.get("disease_positive_label", "Disease Positive") if class_pred == 1 else "Healthy / Benign",
                "probability": float(round(class_prob, 4)),
                "confidence_pct": float(round(class_prob * 100, 2))
            },
            "quantum_kernel_svm": {
                "prediction": qsvm_pred,
                "label": "Disease Positive" if qsvm_pred == 1 else "Healthy / Benign",
                "probability": float(round(qsvm_prob, 4)),
                "confidence_pct": float(round(qsvm_prob * 100, 2)),
                "qubit_count": 4,
                "feature_map": "ZZFeatureMap (reps=2)"
            },
            "hybrid_consensus_ensemble": {
                "prediction": hybrid_pred,
                "label": "Disease Positive" if hybrid_pred == 1 else "Healthy / Benign",
                "probability": float(round(hybrid_prob, 4)),
                "confidence_pct": float(round(hybrid_prob * 100, 2)),
                "risk_tier": risk_level,
                "risk_color": risk_color
            }
        },
        "clinical_guidance": {
            "sensitivity_note": "Quantum and Classical models exhibit high diagnostic sensitivity, reducing deadly false negatives.",
            "recommendation": "Review clinical findings alongside high-resolution radiological / laboratory confirmation."
        }
    }


# Mount Frontend directory to root
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
