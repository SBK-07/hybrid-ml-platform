import os
import sys
import pandas as pd
import numpy as np

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(__file__))

from app.dataset_generator import ensure_datasets_exist, DATASETS_DIR
from app.preprocessor import DataPreprocessor
from app.models_engine import HybridModelEngine
from app.explainability import ExplainabilityEngine

def test_full_pipeline():
    print("==================================================")
    print("SIH 2026 PS 139 - BACKEND PIPELINE VERIFICATION TEST")
    print("==================================================")

    # 1. Datasets setup
    ensure_datasets_exist()
    heart_path = os.path.join(DATASETS_DIR, "heart.csv")
    print(f"\n[1] Loading dataset: {heart_path}")
    df = pd.read_csv(heart_path)
    print(f"    Raw Shape: {df.shape[0]} rows x {df.shape[1]} columns")

    # 2. Preprocessing & Quantum Compression
    print("\n[2] Running Preprocessing & PCA Feature Reduction to 4 Qubits...")
    preprocessor = DataPreprocessor(n_qubits=4)
    processed = preprocessor.process(df, apply_smote=True)
    
    print(f"    SMOTE Samples Count: {processed['processed_stats']['num_samples']}")
    print(f"    Target Qubits: {processed['processed_stats']['num_features_compressed']}")
    print(f"    PCA Total Explained Variance: {round(processed['processed_stats']['total_explained_variance'] * 100, 2)}%")

    # 3. Model Engine Training (Classical + Quantum + Hybrid)
    print("\n[3] Training Classical Baseline & Quantum Models (PennyLane)...")
    engine = HybridModelEngine(n_qubits=4)
    results = engine.train_all(processed["X_raw"], processed["X_quantum"], processed["y"])

    print("\n--- BENCHMARKING RESULTS TABLE ---")
    print(f"{'Model':<32} | {'Category':<10} | {'Accuracy':<8} | {'Sens(Recall)':<12} | {'Specificity':<11} | {'F1-Score':<8} | {'AUC-ROC':<8} | {'Time (s)':<8}")
    print("-" * 115)
    for model_name, res in results.items():
        print(f"{model_name:<32} | {res['category']:<10} | {res['accuracy']:<8}% | {res['sensitivity']:<12}% | {res['specificity']:<11}% | {res['f1_score']:<8}% | {res['auc_roc']:<8} | {res['train_time_sec']:<8}")

    # 4. Explainability SHAP
    print("\n[4] Generating SHAP Feature Importances...")
    explainability = ExplainabilityEngine(preprocessor.feature_names)
    rf_model = engine.models["Random Forest"]
    importances = explainability.explain_classical(rf_model, processed["X_raw"][:50])
    
    print("    Top 5 Driving Clinical Features:")
    for item in importances[:5]:
        print(f"      - {item['feature']}: {item['importance']}%")

    # 5. Live Single Patient Prediction
    print("\n[5] Testing Live Patient 3-Way Inference (Classical vs Quantum vs Hybrid)...")
    sample_patient = {
        "age": 63, "sex": 1, "cp": 3, "trestbps": 145, "chol": 233, 
        "fbs": 1, "restecg": 0, "thalach": 150, "exang": 0, "oldpeak": 2.3, 
        "slope": 0, "ca": 0, "thal": 1
    }
    X_s, X_q = preprocessor.transform_single_patient(sample_patient)
    preds = engine.predict_single(X_s, X_q)

    for model_type, pdict in preds.items():
        print(f"    * {model_type}: Label={pdict['label']} | Risk Probability={round(pdict['probability']*100, 1)}% | Confidence={pdict['confidence']}")

    summary = explainability.generate_clinician_summary(sample_patient, importances, preds)
    print("\n--- CLINICIAN PLAIN-LANGUAGE SUMMARY ---")
    print(summary)
    print("\n==================================================")
    print("VERIFICATION SUCCESSFUL - BACKEND PIPELINE READY!")
    print("==================================================")

if __name__ == "__main__":
    test_full_pipeline()
