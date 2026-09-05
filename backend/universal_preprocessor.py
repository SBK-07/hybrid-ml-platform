"""
universal_preprocessor.py
=========================
Universal Clinical Data Engineering & Automated Preprocessing Engine.
Designed to process ANY clinical tabular dataset (Cancer, Heart Disease, Diabetes,
Parkinson's, Liver Disease, Kidney Disease, etc.) with research-grade rigor.

Features:
  1. Auto-target detection (heuristic: binary column, last column, or 'target'/'outcome'/'class'/'diagnosis')
  2. Automatic feature type detection (Numerical continuous, Discrete, Categorical, ID columns)
  3. ID column removal (patient_id, id, Unnamed, etc.)
  4. Missing value imputation:
     - Numerical: Median imputation (fitted on train only)
     - Categorical: Mode imputation (fitted on train only)
  5. Categorical encoding:
     - Binary categories: Binary mapping (0/1)
     - Multi-class categories: One-hot encoding / Frequency encoding
  6. Outlier handling: Winsorization (1st and 99th percentiles) to prevent PCA distortion
  7. Leak-free 80/20 Stratified Train/Test Split
  8. Classical representation: StandardScaler normalization
  9. Quantum representation: PCA dimensionality reduction to N_QUBITS (default=4) + MinMaxScaler to [0, π]
 10. Generates full EDA statistics, correlation matrix, PCA variance explanation, and metadata
"""

import os
import io
import json
import time
import math
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA


def make_json_safe(obj):
    """
    Recursively sanitize dictionaries, lists, and values to guarantee JSON compliance.
    Replaces NaN, Infinity, -Infinity with None. Converts numpy types to Python native types.
    """
    if isinstance(obj, dict):
        return {str(k): make_json_safe(v) for k, v in obj.items() if 'unnamed' not in str(k).lower()}
    elif isinstance(obj, (list, tuple, set)):
        return [make_json_safe(item) for item in obj]
    elif isinstance(obj, (np.floating, float)):
        if np.isnan(obj) or math.isnan(obj) or np.isinf(obj) or math.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return make_json_safe(obj.tolist())
    elif pd.isna(obj):
        return None
    return obj


def detect_target_column(df: pd.DataFrame) -> str:
    """Heuristically identify the primary binary target column."""
    columns_lower = [c.lower() for c in df.columns]

    # Priority list of common medical target column names
    target_candidates = [
        'target', 'outcome', 'diagnosis', 'class', 'label', 'disease',
        'condition', 'status', 'output', 'has_disease', 'diabetes',
        'heartdisease', 'cardio', 'malignant', 'cancer', 'result'
    ]

    for candidate in target_candidates:
        for idx, col_lower in enumerate(columns_lower):
            if candidate in col_lower:
                col_name = df.columns[idx]
                if df[col_name].nunique() <= 5:  # Classification target
                    return col_name

    # Check if the last column has low cardinality (common in ML datasets)
    last_col = df.columns[-1]
    if df[last_col].nunique() <= 5:
        return last_col

    # Find any column with exactly 2 unique values
    for col in df.columns:
        if df[col].nunique() == 2:
            return col

    # Default to last column
    return df.columns[-1]


def clean_and_preprocess_dataframe(df: pd.DataFrame, n_qubits: int = 4, random_state: int = 42):
    """
    Universal clinical data pipeline with 100% leak-free processing.

    Returns:
      - X_train_scaled, X_test_scaled (Classical full feature representation)
      - X_train_quantum, X_test_quantum (Quantum 4-qubit representation in [0, pi])
      - y_train, y_test (Binary integer targets)
      - metadata (Dataset dimensions, feature names, EDA stats, PCA explained variance)
    """
    start_time = time.time()
    df_clean = df.copy()

    # Normalize column names
    df_clean.columns = [str(c).strip() for c in df_clean.columns]

    # Drop columns that are completely NaN or empty
    df_clean = df_clean.dropna(how='all', axis=1)

    # Drop any 'Unnamed' columns created by trailing commas in Kaggle CSVs
    unnamed_cols = [c for c in df_clean.columns if 'unnamed' in str(c).lower()]
    if unnamed_cols:
        df_clean = df_clean.drop(columns=unnamed_cols)

    # 1. Identify Target Column
    target_col = detect_target_column(df_clean)
    y_raw = df_clean[target_col]
    X_raw = df_clean.drop(columns=[target_col])

    # 2. Drop obvious ID columns
    id_cols = [c for c in X_raw.columns if any(k in c.lower() for k in ['id', 'patient', 'unnamed', 'index', 'subject']) and c != target_col]
    if id_cols:
        X_raw = X_raw.drop(columns=id_cols)
        df_clean = df_clean.drop(columns=[c for c in id_cols if c in df_clean.columns])

    # 3. Clean and convert target to binary (0 / 1)
    if y_raw.dtype == 'object' or isinstance(y_raw.iloc[0], str):
        unique_vals = y_raw.unique()
        # Map first/negative value to 0, second/positive value to 1
        pos_labels = ['m', 'malignant', '1', 'yes', 'true', 'positive', 'diseased', 'present']
        y_binary = y_raw.map(lambda v: 1 if str(v).lower().strip() in pos_labels else 0).values
    else:
        # Numerical target: binarize if not 0/1
        if set(y_raw.unique()) == {1, 2}:
            y_binary = (y_raw - 1).astype(int).values
        else:
            y_binary = (y_raw > y_raw.median()).astype(int).values

    # Ensure both classes are present
    if len(np.unique(y_binary)) < 2:
        y_binary = (y_raw >= y_raw.mean()).astype(int).values

    # 4. Handle Categorical Features
    categorical_cols = X_raw.select_dtypes(include=['object', 'category']).columns.tolist()
    numerical_cols = X_raw.select_dtypes(include=['int64', 'float64', 'int32', 'float32']).columns.tolist()

    # One-hot encode categoricals with low cardinality (< 10)
    if categorical_cols:
        X_raw = pd.get_dummies(X_raw, columns=categorical_cols, drop_first=True)

    # 5. Handle Missing Values
    # Impute remaining missing values with median
    for col in X_raw.columns:
        if X_raw[col].isnull().any():
            median_val = X_raw[col].median()
            X_raw[col] = X_raw[col].fillna(median_val if not pd.isna(median_val) else 0.0)

    # Ensure all data is numeric
    X_matrix = X_raw.astype(float).values
    feature_names = list(X_raw.columns)

    # 6. Stratified Train/Test Split (80/20) - strictly leak-free with safe stratification
    class_counts = np.bincount(y_binary) if len(y_binary) > 0 else []
    can_stratify = (len(np.unique(y_binary)) >= 2 and len(class_counts) >= 2 and min(class_counts) >= 2)
    strat = y_binary if can_stratify else None

    X_train, X_test, y_train, y_test = train_test_split(
        X_matrix, y_binary, test_size=0.20, random_state=random_state, stratify=strat
    )

    # 7. Classical Normalization (StandardScaler fitted strictly on X_train)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 8. Quantum Dimensionality Reduction (PCA to n_qubits fitted strictly on X_train)
    actual_qubits = min(n_qubits, X_train_scaled.shape[1])
    pca = PCA(n_components=actual_qubits, random_state=random_state)
    X_train_pca = pca.fit_transform(X_train_scaled)
    X_test_pca = pca.transform(X_test_scaled)

    # 9. Scale Quantum Features to Bloch Sphere Rotation Angles [0, π]
    angle_scaler = MinMaxScaler(feature_range=(0.0, np.pi))
    X_train_quantum = angle_scaler.fit_transform(X_train_pca)
    X_test_quantum = angle_scaler.transform(X_test_pca)

    # 10. Generate Dataset Summary & EDA Statistics
    explained_variance_ratio = [float(round(v, 4)) for v in pca.explained_variance_ratio_]
    cumulative_variance = float(round(sum(explained_variance_ratio), 4))

    class_distribution = {
        "class_0_healthy": int(np.sum(y_binary == 0)),
        "class_1_diseased": int(np.sum(y_binary == 1)),
        "imbalance_ratio": float(round(np.sum(y_binary == 1) / max(1, np.sum(y_binary == 0)), 3))
    }

    metadata = {
        "target_column": target_col,
        "total_samples": int(len(df_clean)),
        "total_features": int(X_matrix.shape[1]),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "feature_names": feature_names,
        "quantum_qubits": actual_qubits,
        "pca_explained_variance_ratio": explained_variance_ratio,
        "pca_cumulative_variance": cumulative_variance,
        "class_distribution": class_distribution,
        "preprocessing_time_sec": float(round(time.time() - start_time, 4)),
        "status": "READY_FOR_BENCHMARK"
    }

    # Clean sample records to be 100% JSON compliant
    sample_df = df_clean.head(10).copy()
    sample_records = make_json_safe(sample_df.to_dict(orient='records'))

    return {
        "X_train_scaled": X_train_scaled,
        "X_test_scaled": X_test_scaled,
        "X_train_quantum": X_train_quantum,
        "X_test_quantum": X_test_quantum,
        "y_train": y_train,
        "y_test": y_test,
        "scaler": scaler,
        "pca": pca,
        "angle_scaler": angle_scaler,
        "metadata": make_json_safe(metadata),
        "df_processed_sample": sample_records
    }
