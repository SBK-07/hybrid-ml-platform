"""
common_representation.py
========================
Unified Clinical Common Representation Layer.
Aligns and normalizes heterogeneous modalities (Tabular biomarkers, Imaging latents,
Biosignal frequency signatures) into a standardized clinical embedding space
suitable for both high-dimensional classical ML and 4-qubit Hilbert space encoding.
"""

import os
import sys
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from app.schemas import ClinicalRepresentation, ModalityEmbedding, ModalityType
except ImportError:
    from schemas import ClinicalRepresentation, ModalityEmbedding, ModalityType

from modules.imaging_pipeline import encode_imaging_features_to_latent
from modules.signal_pipeline import encode_signal_features_to_latent


class CommonRepresentationLayer:
    """
    Transforms multi-source clinical inputs into a unified latent clinical state.
    """
    def __init__(self, n_qubits: int = 4, unified_dim: int = 16):
        self.n_qubits = n_qubits
        self.unified_dim = unified_dim
        self.pca_model: Optional[PCA] = None
        self.angle_scaler: Optional[MinMaxScaler] = None

    def construct_representation(
        self,
        dataset_key: str,
        tabular_features: Dict[str, float],
        imaging_features: Optional[Dict[str, float]] = None,
        signal_features: Optional[Dict[str, float]] = None,
        scaler: Optional[StandardScaler] = None,
        pca: Optional[PCA] = None,
        angle_scaler: Optional[MinMaxScaler] = None,
        feature_order: Optional[List[str]] = None
    ) -> ClinicalRepresentation:
        """
        Build a standardized ClinicalRepresentation object from active modalities.
        """
        active_modalities = ["tabular"]
        missing_modalities = []
        modality_embeddings = {}

        # 1. Tabular Modality Processing
        if feature_order:
            tab_values = [float(tabular_features.get(k, 0.0)) for k in feature_order]
        else:
            tab_values = [float(v) for v in tabular_features.values()]

        raw_vec = np.array(tab_values, dtype=float).reshape(1, -1)

        # Scale tabular features
        if scaler is not None:
            scaled_tab = scaler.transform(raw_vec)[0].tolist()
        else:
            # Fallback zero-mean unit-variance
            s_mean = np.mean(raw_vec)
            s_std = max(1e-6, np.std(raw_vec))
            scaled_tab = ((raw_vec - s_mean) / s_std)[0].tolist()

        modality_embeddings["tabular"] = ModalityEmbedding(
            modality=ModalityType.TABULAR,
            input_dim=len(tab_values),
            latent_dim=len(scaled_tab),
            normalized_values=[float(round(v, 4)) for v in scaled_tab],
            confidence_score=1.0,
            is_missing=False
        )

        # 2. Imaging Modality Processing
        if imaging_features and len(imaging_features) > 0:
            active_modalities.append("imaging")
            z_img = encode_imaging_features_to_latent(imaging_features, latent_dim=8)
            modality_embeddings["imaging"] = ModalityEmbedding(
                modality=ModalityType.IMAGING,
                input_dim=len(imaging_features),
                latent_dim=len(z_img),
                normalized_values=[float(round(v, 4)) for v in z_img],
                confidence_score=0.95,
                is_missing=False
            )
        else:
            missing_modalities.append("imaging")
            modality_embeddings["imaging"] = ModalityEmbedding(
                modality=ModalityType.IMAGING,
                input_dim=0,
                latent_dim=8,
                normalized_values=[0.0] * 8,
                confidence_score=0.0,
                is_missing=True
            )

        # 3. Biosignal Modality Processing
        if signal_features and len(signal_features) > 0:
            active_modalities.append("signal")
            z_sig = encode_signal_features_to_latent(signal_features, latent_dim=8)
            modality_embeddings["signal"] = ModalityEmbedding(
                modality=ModalityType.SIGNAL,
                input_dim=len(signal_features),
                latent_dim=len(z_sig),
                normalized_values=[float(round(v, 4)) for v in z_sig],
                confidence_score=0.95,
                is_missing=False
            )
        else:
            missing_modalities.append("signal")
            modality_embeddings["signal"] = ModalityEmbedding(
                modality=ModalityType.SIGNAL,
                input_dim=0,
                latent_dim=8,
                normalized_values=[0.0] * 8,
                confidence_score=0.0,
                is_missing=True
            )

        # 4. Quantum 4-Qubit Bloch Angle Projection
        scaled_array = np.array(scaled_tab).reshape(1, -1)
        if pca is not None and angle_scaler is not None:
            pca_feats = pca.transform(scaled_array)[0].tolist()
            bloch_angles = angle_scaler.transform(np.array(pca_feats).reshape(1, -1))[0].tolist()
        else:
            # Fallback direct projection
            if len(scaled_tab) >= self.n_qubits:
                pca_feats = scaled_tab[:self.n_qubits]
            else:
                pca_feats = scaled_tab + [0.0] * (self.n_qubits - len(scaled_tab))
            # Map tanh to [0, pi]
            bloch_angles = [(np.tanh(v) + 1.0) * (np.pi / 2.0) for v in pca_feats]

        # 5. Build Unified Latent Vector
        unified_vec = list(scaled_tab[:self.unified_dim])
        if len(unified_vec) < self.unified_dim:
            unified_vec += [0.0] * (self.unified_dim - len(unified_vec))

        return ClinicalRepresentation(
            dataset_key=dataset_key,
            raw_feature_count=len(tab_values),
            classical_scaled_features=[float(round(v, 4)) for v in scaled_tab],
            quantum_bloch_angles=[float(round(v, 4)) for v in bloch_angles],
            pca_components=[float(round(v, 4)) for v in pca_feats],
            multimodal_embeddings=modality_embeddings,
            unified_latent_vector=[float(round(v, 4)) for v in unified_vec],
            active_modalities=active_modalities,
            missing_modalities=missing_modalities
        )
