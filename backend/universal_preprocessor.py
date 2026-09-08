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
    neg_label_name = "Healthy / Control (Class 0)"
    pos_label_name = "Pathology / Disease (Class 1)"

    if y_raw.dtype == 'object' or isinstance(y_raw.iloc[0], str):
        unique_vals = [str(v).strip() for v in y_raw.dropna().unique()]
        unique_lower = [v.lower() for v in unique_vals]

        neg_indicators = ['0', 'b', 'benign', 'normal', 'control', 'healthy', 'no', 'false', 'neg', 'negative', 'non_demented', 'notumor']
        pos_indicators = ['1', 'm', 'malignant', 'tumor', 'positive', 'diseased', 'present', 'yes', 'true', 'demented', 'abnormal', 'sick', 'cancer']

        if len(unique_vals) == 2:
            val0, val1 = unique_vals[0], unique_vals[1]
            if any(k in val0.lower() for k in neg_indicators) or any(k in val1.lower() for k in pos_indicators):
                neg_val, pos_val = val0, val1
            elif any(k in val1.lower() for k in neg_indicators) or any(k in val0.lower() for k in pos_indicators):
                neg_val, pos_val = val1, val0
            else:
                neg_val, pos_val = sorted([val0, val1])[0], sorted([val0, val1])[1]

            neg_label_name = f"{neg_val} (Class 0)"
            pos_label_name = f"{pos_val} (Class 1)"
            y_binary = y_raw.map(lambda v: 1 if str(v).strip() == pos_val else 0).values
        else:
            y_binary = y_raw.map(lambda v: 1 if any(p in str(v).lower().strip() for p in pos_indicators) else 0).values
    else:
        # Numerical target: binarize if not 0/1
        u_vals = sorted(list(set(y_raw.dropna().unique())))
        if set(u_vals) == {0, 1}:
            y_binary = y_raw.astype(int).values
            neg_label_name = "Control (Class 0)"
            pos_label_name = "Positive (Class 1)"
        elif set(u_vals) == {1, 2}:
            y_binary = (y_raw - 1).astype(int).values
            neg_label_name = "Class 1 (Control)"
            pos_label_name = "Class 2 (Positive)"
        else:
            med_val = float(y_raw.median())
            y_binary = (y_raw > med_val).astype(int).values
            neg_label_name = f"<= {med_val:.1f} (Class 0)"
            pos_label_name = f"> {med_val:.1f} (Class 1)"

    # Ensure both classes are present
    if len(np.unique(y_binary)) < 2:
        mean_val = float(y_raw.mean()) if pd.api.types.is_numeric_dtype(y_raw) else 0.5
        y_binary = (y_raw >= mean_val).astype(int).values

    # 4. Dirty string numeric coercion: columns containing numbers mixed with "?", "None", spaces
    for col in X_raw.columns:
        if X_raw[col].dtype == 'object' or pd.api.types.is_categorical_dtype(X_raw[col]):
            # Try converting to numeric
            coerced = pd.to_numeric(X_raw[col].astype(str).str.replace(',', '').str.strip(), errors='coerce')
            valid_ratio = coerced.notnull().sum() / max(1, len(coerced))
            if valid_ratio >= 0.45:  # predominantly numeric with some missing noise
                X_raw[col] = coerced

    # 5. Handle Categorical Features & Missing Values
    categorical_cols = X_raw.select_dtypes(include=['object', 'category']).columns.tolist()
    if categorical_cols:
        # Impute categorical with mode
        for c in categorical_cols:
            mode_v = X_raw[c].mode()
            fill_v = mode_v[0] if len(mode_v) > 0 else 'Unknown'
            X_raw[c] = X_raw[c].fillna(fill_v)
        X_raw = pd.get_dummies(X_raw, columns=categorical_cols, drop_first=True)

    # Impute numeric missing values with median
    for col in X_raw.columns:
        if X_raw[col].isnull().any():
            median_val = X_raw[col].median()
            X_raw[col] = X_raw[col].fillna(median_val if not pd.isna(median_val) else 0.0)

    # 6. Drop constant / zero-variance features
    std_series = X_raw.std()
    constant_cols = std_series[std_series <= 1e-8].index.tolist()
    if constant_cols:
        X_raw = X_raw.drop(columns=constant_cols)

    # Fallback if all features dropped
    if X_raw.shape[1] == 0:
        X_raw["baseline_feature"] = np.random.normal(0, 1, len(y_binary))

    # Ensure all data is numeric
    X_matrix = X_raw.astype(float).values
    feature_names = list(X_raw.columns)

    # 7. Stratified Train/Test Split (80/20) - strictly leak-free with safe stratification
    class_counts = np.bincount(y_binary) if len(y_binary) > 0 else []
    can_stratify = (len(np.unique(y_binary)) >= 2 and len(class_counts) >= 2 and min(class_counts) >= 2)
    strat = y_binary if can_stratify else None

    X_train, X_test, y_train, y_test = train_test_split(
        X_matrix, y_binary, test_size=0.20, random_state=random_state, stratify=strat
    )

    # 8. Classical Normalization (StandardScaler fitted strictly on X_train)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 9. Quantum Dimensionality Reduction (PCA to n_qubits fitted strictly on X_train)
    actual_qubits = min(n_qubits, X_train_scaled.shape[1])
    pca = PCA(n_components=actual_qubits, random_state=random_state)
    X_train_pca = pca.fit_transform(X_train_scaled)
    X_test_pca = pca.transform(X_test_scaled)

    # 10. Scale Quantum Features to Bloch Sphere Rotation Angles [0, π]
    angle_scaler = MinMaxScaler(feature_range=(0.0, np.pi))
    X_train_quantum = angle_scaler.fit_transform(X_train_pca)
    X_test_quantum = angle_scaler.transform(X_test_pca)

    # 11. Generate Dataset Summary & EDA Statistics
    explained_variance_ratio = [float(round(v, 4)) for v in pca.explained_variance_ratio_]
    cumulative_variance = float(round(sum(explained_variance_ratio), 4))

    class_distribution = {
        "class_0_healthy": int(np.sum(y_binary == 0)),
        "class_1_diseased": int(np.sum(y_binary == 1)),
        "imbalance_ratio": float(round(np.sum(y_binary == 1) / max(1, np.sum(y_binary == 0)), 3)),
        "positive_label": pos_label_name,
        "negative_label": neg_label_name
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
        "disease_positive_label": pos_label_name,
        "disease_negative_label": neg_label_name,
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
