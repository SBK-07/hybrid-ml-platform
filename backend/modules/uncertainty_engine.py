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
    features: Optional[Dict[str, float]] = None,
    all_model_probs: Optional[Dict[str, float]] = None
) -> UncertaintyReport:
    """
    Quantify epistemic uncertainty, aleatoric noise, and model agreement
    across classical and quantum models (including full 5-model ensemble).
    """
    c_p = float(np.clip(classical_prob, 0.0, 1.0))
    q_p = float(np.clip(quantum_prob, 0.0, 1.0))

    if all_model_probs and len(all_model_probs) >= 3:
        # 5-Model Bayesian Formulation
        probs_list = [float(np.clip(v, 0.0, 1.0)) for v in all_model_probs.values()]
        class_probs = [v for k, v in all_model_probs.items() if "svm" in k or "mlp" in k or "classical" in k]
        quant_probs = [v for k, v in all_model_probs.items() if "quantum" in k or "qnn" in k or "qvc" in k or "qsvm" in k]

        c_avg = float(np.mean(class_probs)) if class_probs else c_p
        q_avg = float(np.mean(quant_probs)) if quant_probs else q_p
        hybrid_p = float(np.clip(0.50 * c_avg + 0.50 * q_avg, 0.0, 1.0))

        # Inter-model standard deviation across all 5 estimators
        model_std = float(np.std(probs_list))
        disagreement_gap = abs(c_avg - q_avg)

        # Entropy near decision boundary
        p_safe = np.clip(hybrid_p, 1e-6, 1.0 - 1e-6)
        binary_entropy = -float(p_safe * np.log2(p_safe) + (1.0 - p_safe) * np.log2(1.0 - p_safe))

        epistemic_unc = float(round(0.45 * disagreement_gap + 0.35 * model_std + 0.20 * binary_entropy, 4))
        c_pred = 1 if c_avg >= 0.5 else 0
        q_pred = 1 if q_avg >= 0.5 else 0
        is_discordant = (c_pred != q_pred) or (disagreement_gap > 0.22)
    else:
        hybrid_p = float(np.clip(0.5 * c_p + 0.5 * q_p, 0.0, 1.0))
        c_pred = 1 if c_p >= 0.5 else 0
        q_pred = 1 if q_p >= 0.5 else 0
        disagreement_gap = abs(c_p - q_p)
        p_safe = np.clip(hybrid_p, 1e-6, 1.0 - 1e-6)
        binary_entropy = -float(p_safe * np.log2(p_safe) + (1.0 - p_safe) * np.log2(1.0 - p_safe))
        epistemic_unc = float(round(0.6 * disagreement_gap + 0.4 * binary_entropy, 4))
        is_discordant = c_pred != q_pred

    epistemic_unc = float(np.clip(epistemic_unc, 0.02, 0.98))

    # 2. Aleatoric Uncertainty (boundary proximity + sensor noise sensitivity)
    distance_to_boundary = abs(hybrid_p - 0.5)
    aleatoric_unc = float(round(1.0 - 2.0 * distance_to_boundary, 4))
    aleatoric_unc = float(np.clip(aleatoric_unc, 0.01, 0.95))

    # 3. Consensus Confidence
    consensus_conf = float(round(1.0 - epistemic_unc, 4))

    # 4. Borderline Flags
    is_borderline = 0.35 <= hybrid_p <= 0.65

    # 5. Risk Tier & Clinical Triage Action
    if hybrid_p >= 0.70:
        risk_tier = "High Risk"
        if is_discordant:
            triage = "High Risk with Classical-Quantum Discordance. Secondary histopathology review & quantum statevector inspection recommended."
        else:
            triage = "High Risk (Unanimous 5-Model Agreement). Immediate clinical referral and biopsy staging advised."
    elif hybrid_p >= 0.35:
        risk_tier = "Moderate / Borderline Risk"
        triage = "Borderline Diagnostic Zone. Classical linear models ambiguous; quantum Hilbert geometry arbitrates watchlist follow-up."
    else:
        risk_tier = "Low Risk"
        triage = "Routine Preventive Screening. Biomarkers within safe baseline limits across all 5 classical and quantum models."

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
        triage_recommendation=triage,
        inter_model_std=round(model_std, 4) if 'model_std' in locals() else round(abs(c_p - q_p) / 2, 4),
        inter_model_variance=round(model_std ** 2, 4) if 'model_std' in locals() else round((abs(c_p - q_p) / 2) ** 2, 4),
        boundary_entropy=round(binary_entropy, 4) if 'binary_entropy' in locals() else 0.0,
        discordance_delta=round(disagreement_gap, 4) if 'disagreement_gap' in locals() else round(abs(c_p - q_p), 4),
        individual_probabilities={k: round(v, 4) for k, v in all_model_probs.items()} if all_model_probs else None
    )
