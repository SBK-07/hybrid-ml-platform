import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

try:
    from imblearn.over_sampling import SMOTE
    HAS_SMOTE = True
except ImportError:
    HAS_SMOTE = False

class DataPreprocessor:

    def __init__(self, n_qubits: int = 4):
        self.n_qubits = n_qubits
        self.scaler = StandardScaler()
        self.pca_quantum = PCA(n_components=n_qubits)
        self.pca_2d = PCA(n_components=2)
        self.feature_names = []
        self.target_name = None

    def process(self, df: pd.DataFrame, target_col: str = None, apply_smote: bool = True):
        # Auto-detect target column if not provided
        if target_col is None:
            possible_targets = ["target", "Outcome", "status", "label", "class"]
            for col in possible_targets:
                if col in df.columns:
                    target_col = col
                    break
            if target_col is None:
                target_col = df.columns[-1]

        self.target_name = target_col
        X = df.drop(columns=[target_col]).select_dtypes(include=[np.number])
        y = df[target_col].values
        self.feature_names = list(X.columns)

        # Missing value imputation
        X = X.fillna(X.median())

        original_stats = {
            "num_samples": len(df),
            "num_features": X.shape[1],
            "class_distribution": dict(pd.Series(y).value_counts().items())
        }

        # Apply SMOTE if requested and imbalanced
        if apply_smote and HAS_SMOTE and len(np.unique(y)) == 2:
            try:
                smote = SMOTE(random_state=42)
                X_res, y_res = smote.fit_resample(X, y)
            except Exception:
                X_res, y_res = X.values, y
        else:
            X_res, y_res = X.values, y


        # Standard Scale
        X_scaled = self.scaler.fit_transform(X_res)

        # PCA for Quantum Circuit (N components matching qubit count)
        actual_qubits = min(self.n_qubits, X_scaled.shape[1])
        if actual_qubits < self.n_qubits:
            self.pca_quantum = PCA(n_components=actual_qubits)
        
        X_quantum = self.pca_quantum.fit_transform(X_scaled)
        
        # Scale quantum features to [-pi, pi] for angle encoding
        X_quantum = np.pi * (X_quantum / (np.max(np.abs(X_quantum)) + 1e-8))

        # 2D PCA for Visualization scatter plot
        X_2d = self.pca_2d.fit_transform(X_scaled)

        processed_stats = {
            "num_samples": len(y_res),
            "num_features_compressed": actual_qubits,
            "explained_variance_ratio": list(self.pca_quantum.explained_variance_ratio_),
            "total_explained_variance": float(np.sum(self.pca_quantum.explained_variance_ratio_)),
            "class_distribution": dict(pd.Series(y_res).value_counts().items()),
            "scatter_2d": [
                {"x": float(X_2d[i, 0]), "y": float(X_2d[i, 1]), "label": int(y_res[i])}
                for i in range(len(y_res))
            ]
        }

        return {
            "X_raw": X_scaled,
            "X_quantum": X_quantum,
            "y": y_res,
            "original_stats": original_stats,
            "processed_stats": processed_stats
        }

    def transform_single_patient(self, input_dict: dict):
        """Transform a single patient dict for live inference."""
        df_single = pd.DataFrame([input_dict])
        df_single = df_single[self.feature_names].fillna(0)
        X_scaled = self.scaler.transform(df_single)
        X_quantum = self.pca_quantum.transform(X_scaled)
        X_quantum = np.pi * (X_quantum / (np.max(np.abs(X_quantum)) + 1e-8))
        return X_scaled, X_quantum
