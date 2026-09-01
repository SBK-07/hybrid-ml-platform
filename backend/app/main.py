import os
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from .dataset_generator import ensure_datasets_exist, DATASETS_DIR
from .preprocessor import DataPreprocessor
from .models_engine import HybridModelEngine
from .explainability import ExplainabilityEngine

app = FastAPI(
    title="Hybrid Quantum-Classical Disease Detection Platform",
    description="SIH 2026 PS 139 - End-to-end benchmarkable hybrid QML platform API",
    version="1.0.0"
)

# Enable CORS for React/Vite/Static frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Frontend static assets if available
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend")
os.makedirs(frontend_dir, exist_ok=True)
app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")



# Global State Management (In-Memory for MVP)
class AppState:
    def __init__(self):
        self.current_dataset_name = "heart.csv"
        self.df = None
        self.preprocessor = DataPreprocessor(n_qubits=4)
        self.processed_data = None
        self.engine = HybridModelEngine(n_qubits=4)
        self.explainability = None

state = AppState()

@app.on_event("startup")
def startup_event():
    ensure_datasets_exist()
    # Auto-load default Heart Disease dataset on boot
    default_path = os.path.join(DATASETS_DIR, "heart.csv")
    if os.path.exists(default_path):
        state.df = pd.read_csv(default_path)
        state.processed_data = state.preprocessor.process(state.df)
        state.explainability = ExplainabilityEngine(state.preprocessor.feature_names)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "platform": "SIH 2026 PS 139 - Hybrid QML Platform",
        "active_dataset": state.current_dataset_name,
        "docs_url": "/docs"
    }

@app.get("/api/datasets")
def list_datasets():
    datasets = []
    names = {
        "heart.csv": "UCI Heart Disease (13 Clinical Features)",
        "diabetes.csv": "PIMA Indians Diabetes (8 Metabolic Features)",
        "parkinsons.csv": "Parkinson's Voice Recording (13 Acoustic Features)"
    }
    for filename in os.listdir(DATASETS_DIR):
        if filename.endswith(".csv"):
            file_path = os.path.join(DATASETS_DIR, filename)
            df = pd.read_csv(file_path)
            datasets.append({
                "id": filename,
                "name": names.get(filename, filename),
                "samples": len(df),
                "features": len(df.columns) - 1,
                "target_column": df.columns[-1]
            })
    return {"datasets": datasets}

@app.post("/api/upload_dataset")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    filename = file.filename.replace(" ", "_")
    file_path = os.path.join(DATASETS_DIR, filename)
    
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
        
    try:
        df = pd.read_csv(file_path)
        if len(df.columns) < 2:
            os.remove(file_path)
            raise HTTPException(status_code=400, detail="Uploaded CSV must contain at least 1 feature column and 1 target column.")
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
        
    return {
        "status": "success",
        "message": f"Dataset '{filename}' uploaded successfully.",
        "dataset": {
            "id": filename,
            "name": filename.replace(".csv", "").replace("_", " ").title(),
            "samples": len(df),
            "features": len(df.columns) - 1,
            "target_column": df.columns[-1]
        }
    }

class PreprocessRequest(BaseModel):
    dataset_id: str
    n_qubits: int = 4
    apply_smote: bool = True

@app.post("/api/preprocess")
def preprocess_dataset(req: PreprocessRequest):
    file_path = os.path.join(DATASETS_DIR, req.dataset_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    state.current_dataset_name = req.dataset_id
    state.df = pd.read_csv(file_path)
    state.preprocessor = DataPreprocessor(n_qubits=req.n_qubits)
    state.processed_data = state.preprocessor.process(state.df, apply_smote=req.apply_smote)
    state.engine = HybridModelEngine(n_qubits=req.n_qubits)
    state.explainability = ExplainabilityEngine(state.preprocessor.feature_names)

    return {
        "status": "success",
        "dataset": req.dataset_id,
        "original_stats": state.processed_data["original_stats"],
        "processed_stats": state.processed_data["processed_stats"],
        "feature_names": state.preprocessor.feature_names,
        "sample_preview": state.df.head(5).to_dict(orient="records")
    }

@app.post("/api/train")
def train_models():
    if state.processed_data is None:
        raise HTTPException(status_code=400, detail="Dataset not preprocessed yet.")

    X_raw = state.processed_data["X_raw"]
    X_quantum = state.processed_data["X_quantum"]
    y = state.processed_data["y"]

    results = state.engine.train_all(X_raw, X_quantum, y)

    # Format table response for frontend
    table = []
    for model_name, res in results.items():
        table.append({
            "model": model_name,
            "category": res["category"],
            "accuracy": res["accuracy"],
            "sensitivity": res["sensitivity"],
            "specificity": res["specificity"],
            "precision": res["precision"],
            "f1_score": res["f1_score"],
            "auc_roc": res["auc_roc"],
            "train_time_sec": res["train_time_sec"]
        })

    return {
        "status": "completed",
        "benchmark_table": table,
        "reality_check": {
            "backend": "PennyLane Quantum Simulator (default.qubit)",
            "qubit_count": state.engine.n_qubits,
            "encoding": "Angle Encoding (RY + RZ)",
            "shots": "Statevector Exact Analytical Simulator",
            "limitation_note": "Simulated quantum circuit. Real quantum hardware execution requires IBM Quantum or AWS Braket API key."
        }
    }

@app.get("/api/benchmark")
def get_benchmark():
    if not state.engine.metrics:
        raise HTTPException(status_code=400, detail="Models not trained yet. Call /api/train first.")
    
    table = []
    for model_name, res in state.engine.metrics.items():
        table.append({
            "model": model_name,
            "category": res["category"],
            "accuracy": res["accuracy"],
            "sensitivity": res["sensitivity"],
            "specificity": res["specificity"],
            "precision": res["precision"],
            "f1_score": res["f1_score"],
            "auc_roc": res["auc_roc"],
            "train_time_sec": res["train_time_sec"]
        })

    return {"benchmark_table": table}

@app.get("/api/explain")
def get_explanation():
    if not state.engine.models:
        raise HTTPException(status_code=400, detail="Models not trained yet.")

    rf_model = state.engine.models.get("Random Forest")
    if rf_model is None:
        raise HTTPException(status_code=400, detail="Random Forest model unavailable for SHAP.")

    X_raw = state.processed_data["X_raw"]
    shap_importances = state.explainability.explain_classical(rf_model, X_raw[:50])

    return {
        "feature_importances": shap_importances,
        "sample_size": min(50, len(X_raw))
    }

class PredictRequest(BaseModel):
    patient_data: Dict[str, float]

@app.post("/api/predict")
def predict_patient(req: PredictRequest):
    if not state.engine.models:
        raise HTTPException(status_code=400, detail="Models not trained yet. Call /api/train first.")

    X_scaled_single, X_quantum_single = state.preprocessor.transform_single_patient(req.patient_data)
    predictions = state.engine.predict_single(X_scaled_single, X_quantum_single)

    # Get feature importances for explanation
    rf_model = state.engine.models.get("Random Forest")
    shap_importances = state.explainability.explain_classical(rf_model, state.processed_data["X_raw"][:50])
    
    summary = state.explainability.generate_clinician_summary(
        req.patient_data, shap_importances, predictions
    )

    return {
        "status": "success",
        "predictions": predictions,
        "top_features": shap_importances[:5],
        "clinician_summary": summary
    }
