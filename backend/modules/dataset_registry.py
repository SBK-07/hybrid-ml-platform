"""
dataset_registry.py
===================
Persistent Biomedical Dataset Registry & Management Engine.
Manages built-in reference clinical datasets and dynamically uploaded custom
biomedical datasets with persistent metadata storage, leak-free artifact storage,
and lifecycle operations (add, list, delete).
"""

import os
import re
import json
import shutil
import datetime
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DATA_PROC_DIR = os.path.join(DATA_DIR, "processed")
DATA_RAW_DIR = os.path.join(DATA_DIR, "raw")
MODELS_DIR = os.path.join(BASE_DIR, "models")
RESULTS_DIR = os.path.join(BASE_DIR, "results")
DATASETS_CSV_DIR = os.path.join(BASE_DIR, "app", "datasets")
REGISTRY_FILE = os.path.join(DATA_DIR, "custom_datasets_registry.json")

BUILT_IN_DATASETS: List[Dict[str, Any]] = [
    {
        "key": "cancer",
        "name": "Breast Cancer Wisconsin Diagnostic (WDBC)",
        "domain": "Oncology / Cytopathology",
        "samples": 569,
        "features_count": 30,
        "quantum_qubits": 4,
        "disease_positive_label": "Malignant",
        "disease_negative_label": "Benign",
        "description": "30 imaging-derived continuous nuclear morphometric features from fine-needle aspirates (FNA).",
        "modality": "multimodal (tabular + imaging-derived)",
        "built_in": True,
        "can_delete": False
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
        "description": "13 clinical, hemodynamic, and electrocardiographic attributes.",
        "modality": "multimodal (tabular + biosignal ECG)",
        "built_in": True,
        "can_delete": False
    },
    {
        "key": "diabetes",
        "name": "Pima Indians Diabetes Database",
        "domain": "Endocrinology / Metabolic Disease",
        "samples": 768,
        "features_count": 8,
        "quantum_qubits": 4,
        "disease_positive_label": "Diabetes Positive",
        "disease_negative_label": "Non-Diabetic",
        "description": "8 diagnostic measurements including glucose, insulin, BMI, and age for diabetes prediction.",
        "modality": "tabular",
        "built_in": True,
        "can_delete": False,
        "file_path": "backend/app/datasets/diabetes.csv"
    },
    {
        "key": "parkinsons",
        "name": "Parkinson's Disease Dataset",
        "domain": "Neurology",
        "samples": 195,
        "features_count": 22,
        "quantum_qubits": 4,
        "disease_positive_label": "Parkinson's Disease",
        "disease_negative_label": "Healthy",
        "description": "22 biomedical voice measurements for Parkinson's disease detection.",
        "modality": "signal (voice phonation acoustics)",
        "built_in": True,
        "can_delete": False,
        "file_path": "backend/app/datasets/parkinsons.csv"
    }
]


def load_custom_registry() -> Dict[str, Dict[str, Any]]:
    """Load persistent registry of uploaded custom datasets."""
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_custom_registry(registry: Dict[str, Dict[str, Any]]) -> None:
    """Save persistent registry to disk atomically."""
    os.makedirs(os.path.dirname(REGISTRY_FILE), exist_ok=True)
    temp_file = REGISTRY_FILE + ".tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=4)
    if os.path.exists(REGISTRY_FILE):
        os.remove(REGISTRY_FILE)
    os.rename(temp_file, REGISTRY_FILE)


def get_all_datasets() -> List[Dict[str, Any]]:
    """
    Return all available datasets: built-in reference datasets + dynamically registered custom datasets.
    """
    datasets = [dict(ds) for ds in BUILT_IN_DATASETS]
    custom_reg = load_custom_registry()

    for key, c_data in custom_reg.items():
        # Check if underlying files still exist
        meta_path = os.path.join(DATA_PROC_DIR, key, "classical", "metadata.json")
        if os.path.exists(meta_path):
            datasets.append(c_data)

    return datasets


def generate_unique_dataset_key(filename: str) -> str:
    """Generate a clean, URL-safe and collision-free dataset key from filename."""
    base_name = os.path.splitext(filename)[0].lower()
    clean_slug = re.sub(r'[^a-z0-9]+', '_', base_name).strip('_')
    if not clean_slug:
        clean_slug = "custom_dataset"

    # Avoid collisions with built-ins
    built_in_keys = {ds["key"] for ds in BUILT_IN_DATASETS}
    key_candidate = f"custom_{clean_slug}" if not clean_slug.startswith("custom_") else clean_slug
    if key_candidate in built_in_keys:
        key_candidate = f"custom_{key_candidate}"

    custom_reg = load_custom_registry()
    if key_candidate not in custom_reg and not os.path.exists(os.path.join(DATA_PROC_DIR, key_candidate)):
        return key_candidate

    # If collision, append timestamp/counter
    idx = 1
    while f"{key_candidate}_{idx}" in custom_reg or os.path.exists(os.path.join(DATA_PROC_DIR, f"{key_candidate}_{idx}")):
        idx += 1
    return f"{key_candidate}_{idx}"


def register_custom_dataset(
    dataset_key: str,
    filename: str,
    raw_df: pd.DataFrame,
    preprocessed_res: Dict[str, Any],
    meta_info: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Save preprocessed files, raw dataset, and register metadata persistently.
    """
    custom_dir = os.path.join(DATA_PROC_DIR, dataset_key)
    custom_class_dir = os.path.join(custom_dir, "classical")
    custom_quant_dir = os.path.join(custom_dir, "quantum")
    custom_models_dir = os.path.join(MODELS_DIR, dataset_key)

    os.makedirs(custom_class_dir, exist_ok=True)
    os.makedirs(custom_quant_dir, exist_ok=True)
    os.makedirs(custom_models_dir, exist_ok=True)

    import joblib

    # 1. Save raw DataFrame
    raw_csv_path = os.path.join(custom_dir, "raw.csv")
    raw_df.to_csv(raw_csv_path, index=False)

    # 2. Save classical arrays & scaler
    np.save(os.path.join(custom_class_dir, "X_train.npy"), preprocessed_res["X_train_scaled"])
    np.save(os.path.join(custom_class_dir, "X_test.npy"), preprocessed_res["X_test_scaled"])
    np.save(os.path.join(custom_class_dir, "y_train.npy"), preprocessed_res["y_train"])
    np.save(os.path.join(custom_class_dir, "y_test.npy"), preprocessed_res["y_test"])
    joblib.dump(preprocessed_res["scaler"], os.path.join(custom_class_dir, "scaler.joblib"))

    # 3. Save quantum arrays & models
    np.save(os.path.join(custom_quant_dir, "X_train_quantum.npy"), preprocessed_res["X_train_quantum"])
    np.save(os.path.join(custom_quant_dir, "X_test_quantum.npy"), preprocessed_res["X_test_quantum"])
    np.save(os.path.join(custom_quant_dir, "y_train.npy"), preprocessed_res["y_train"])
    np.save(os.path.join(custom_quant_dir, "y_test.npy"), preprocessed_res["y_test"])
    joblib.dump(preprocessed_res["pca"], os.path.join(custom_quant_dir, "pca_model.joblib"))
    joblib.dump(preprocessed_res["angle_scaler"], os.path.join(custom_quant_dir, "angle_scaler.joblib"))

    # 4. Save metadata.json
    meta = dict(preprocessed_res["metadata"])
    meta["filename"] = filename
    meta["dataset_name"] = f"Custom Dataset ({filename})"
    meta["dataset_key"] = dataset_key
    meta["modalities_detected"] = meta_info.get("modalities_detected", ["tabular"])
    meta["ingestion_format"] = meta_info.get("format", "tabular_csv")
    meta["disease_positive_label"] = "Disease Positive (Class 1)"
    meta["disease_negative_label"] = "Healthy / Control (Class 0)"

    with open(os.path.join(custom_class_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=4)

    # 5. Add to persistent registry
    modality_str = " + ".join(meta["modalities_detected"]) if meta["modalities_detected"] else "tabular"
    display_name = f"Custom: {filename}"
    if len(display_name) > 40:
        display_name = f"Custom: {filename[:30]}..."

    registry_entry = {
        "key": dataset_key,
        "name": display_name,
        "domain": "Custom Clinical Upload",
        "samples": meta["total_samples"],
        "features_count": meta["total_features"],
        "quantum_qubits": meta.get("quantum_qubits", 4),
        "disease_positive_label": meta["disease_positive_label"],
        "disease_negative_label": meta["disease_negative_label"],
        "description": f"{meta['total_features']} features, {meta['total_samples']} samples from uploaded '{filename}'.",
        "modality": f"Custom ({modality_str})",
        "built_in": False,
        "can_delete": True,
        "uploaded_at": datetime.datetime.now().isoformat(),
        "filename": filename
    }

    registry = load_custom_registry()
    registry[dataset_key] = registry_entry
    save_custom_registry(registry)

    return registry_entry


def delete_custom_dataset(dataset_key: str) -> bool:
    """
    Permanently delete a custom dataset, its preprocessed artifacts, and model files.
    """
    built_in_keys = {ds["key"] for ds in BUILT_IN_DATASETS}
    if dataset_key in built_in_keys:
        raise ValueError(f"Built-in dataset '{dataset_key}' cannot be deleted.")

    registry = load_custom_registry()
    if dataset_key not in registry and not os.path.exists(os.path.join(DATA_PROC_DIR, dataset_key)):
        raise ValueError(f"Dataset '{dataset_key}' not found.")

    # 1. Remove from registry
    if dataset_key in registry:
        del registry[dataset_key]
        save_custom_registry(registry)

    # 2. Delete processed data directory
    custom_dir = os.path.join(DATA_PROC_DIR, dataset_key)
    if os.path.exists(custom_dir):
        shutil.rmtree(custom_dir, ignore_errors=True)

    # 3. Delete models directory
    custom_models_dir = os.path.join(MODELS_DIR, dataset_key)
    if os.path.exists(custom_models_dir):
        shutil.rmtree(custom_models_dir, ignore_errors=True)

    # 4. Delete associated results files
    for subdir in ["classical", "quantum", "benchmark", "eda"]:
        s_dir = os.path.join(RESULTS_DIR, subdir)
        if os.path.exists(s_dir):
            for fname in os.listdir(s_dir):
                if fname.startswith(f"{dataset_key}_"):
                    try:
                        os.remove(os.path.join(s_dir, fname))
                    except Exception:
                        pass

    return True
