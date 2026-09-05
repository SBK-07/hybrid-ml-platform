"""
uncertainty_engine.py
=====================
Clinical Uncertainty Quantification & Model Disagreement Analysis Engine.
Estimates Epistemic (model ambiguity) and Aleatoric (data noise) uncertainty,
flags Classical-Quantum Discordance in borderline clinical cases, and provides triage guidance.
"""

import os
import sys
import numpy as np
from typing import Dict, Any, List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from app.schemas import UncertaintyReport
except ImportError:
    from schemas import UncertaintyReport


def quantify_uncertainty(
    classical_prob: float,
    quantum_prob: float,
    features: Optional[Dict[str, float]] = None
) -> UncertaintyReport:
    """
    Quantify epistemic uncertainty, aleatoric noise, and model agreement.
    """
    c_p = float(np.clip(classical_prob, 0.0, 1.0))
    q_p = float(np.clip(quantum_prob, 0.0, 1.0))
    hybrid_p = float(np.clip(0.5 * c_p + 0.5 * q_p, 0.0, 1.0))

    c_pred = 1 if c_p >= 0.5 else 0
    q_pred = 1 if q_p >= 0.5 else 0

    # 1. Epistemic Uncertainty (Model Disagreement & Ambiguity)
    # Measures the gap between classical and quantum probability vectors
    disagreement_gap = abs(c_p - q_p)
    # Entropy near the decision boundary (0.5)
    binary_entropy = - (hybrid_p * np.log2(hybrid_p + 1e-12) + (1.0 - hybrid_p) * np.log2(1.0 - hybrid_p + 1e-12))
    epistemic_unc = float(round(0.6 * disagreement_gap + 0.4 * binary_entropy, 4))
    epistemic_unc = float(np.clip(epistemic_unc, 0.0, 1.0))

    # 2. Aleatoric Uncertainty (Inherent measurement noise / borderline biomarker region)
    # Proximity to boundary threshold (0.5)
    distance_to_boundary = abs(hybrid_p - 0.5)
    aleatoric_unc = float(round(1.0 - 2.0 * distance_to_boundary, 4))
    aleatoric_unc = float(np.clip(aleatoric_unc, 0.0, 1.0))

    # 3. Consensus Confidence
    consensus_conf = float(round(1.0 - epistemic_unc, 4))

    # 4. Borderline and Discordance Flags
    is_borderline = 0.35 <= hybrid_p <= 0.65
    is_discordant = c_pred != q_pred

    # 5. Risk Tier & Clinical Triage Action
    if hybrid_p >= 0.70:
        risk_tier = "High Risk"
        if is_discordant:
            triage = "High Risk with Classical-Quantum Discordance. Urgent specialist review & confirmatory histopathology recommended."
        else:
            triage = "High Risk (Unanimous Consensus). Immediate diagnostic confirmation and treatment planning advised."
    elif hybrid_p >= 0.35:
        risk_tier = "Moderate / Borderline Risk"
        triage = "Borderline Diagnostic Zone. Repeat bio-marker screening in 3 months; inspect quantum kernel sensitivity."
    else:
        risk_tier = "Low Risk"
        triage = "Routine Preventive Screening. Biomarkers within normal limits across both classical and quantum margins."

    return UncertaintyReport(
        epistemic_uncertainty=epistemic_unc,
        aleatoric_uncertainty=aleatoric_unc,
        consensus_confidence=consensus_conf,
        is_borderline_case=is_borderline,
        is_classical_quantum_discordant=is_discordant,
        classical_prediction=c_pred,
        classical_probability=round(c_p, 4),
        quantum_prediction=q_pred,
        quantum_probability=round(q_p, 4),
        hybrid_probability=round(hybrid_p, 4),
        risk_tier=risk_tier,
        triage_recommendation=triage
    )
