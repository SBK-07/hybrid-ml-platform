"""
schemas.py
==========
Standardized Pydantic v2 Data Contracts and Schemas for the QMed-AI Platform.
Defines strict type specifications for Data Intelligence, Clinical Representations,
Experiment Results, Quantum Feasibility, Multimodal Fusion, Explainability, and Uncertainty.
"""

from typing import Dict, List, Optional, Any, Union
from enum import Enum
from pydantic import BaseModel, Field


class ModalityType(str, Enum):
    TABULAR = "tabular"
    IMAGING = "imaging"
    SIGNAL = "signal"
    MULTIMODAL = "multimodal"


class ClinicalDomain(str, Enum):
    ONCOLOGY = "Oncology / Cytopathology"
    CARDIOLOGY = "Cardiovascular Medicine"
    ENDOCRINOLOGY = "Endocrinology / Metabolic Disease"
    NEUROLOGY = "Neurology"
    GENERAL = "General Biomedical"


class FeatureType(str, Enum):
    CONTINUOUS = "continuous"
    CATEGORICAL = "categorical"
    DISCRETE = "discrete"
    ID = "identifier"


# ============================================================================
# DATA INTELLIGENCE & DATASET PROFILE
# ============================================================================

class FeatureSummary(BaseModel):
    name: str
    feature_type: FeatureType
    missing_count: int = 0
    missing_percentage: float = 0.0
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    unique_values_count: int = 0


class ClassDistribution(BaseModel):
    class_0_healthy: int
    class_1_diseased: int
    imbalance_ratio: float
    is_balanced: bool = True
    positive_label: str = "Diseased / Positive"
    negative_label: str = "Healthy / Control"


class CovariateShiftReport(BaseModel):
    tested_features_count: int
    significant_shift_count: int = 0
    max_ks_statistic: float = 0.0
    mean_ks_statistic: float = 0.0
    is_distribution_shifted: bool = False
    details: Dict[str, float] = Field(default_factory=dict)


class DatasetProfile(BaseModel):
    dataset_key: str
    dataset_name: str
    domain: str
    modality: ModalityType = ModalityType.TABULAR
    modalities_detected: List[str] = Field(default_factory=lambda: ["tabular"])
    target_column: str
    total_samples: int
    total_features: int
    train_samples: int
    test_samples: int
    feature_names: List[str]
    features_summary: List[FeatureSummary] = Field(default_factory=list)
    class_distribution: ClassDistribution
    quantum_qubits: int = 4
    pca_explained_variance_ratio: List[float] = Field(default_factory=list)
    pca_cumulative_variance: float = 0.0
    leak_free_guarantee: bool = True
    covariate_shift: Optional[CovariateShiftReport] = None
    preprocessing_time_sec: float = 0.0
    status: str = "READY_FOR_BENCHMARK"


# ============================================================================
# CLINICAL REPRESENTATION (COMMON LATENT LAYER)
# ============================================================================

class ModalityEmbedding(BaseModel):
    modality: ModalityType
    input_dim: int
    latent_dim: int
    normalized_values: List[float]
    confidence_score: float = 1.0
    is_missing: bool = False


class ClinicalRepresentation(BaseModel):
    patient_id: Optional[str] = None
    dataset_key: str
    raw_feature_count: int
    classical_scaled_features: List[float]
    quantum_bloch_angles: List[float]  # [0, pi] for N qubits
    pca_components: List[float]
    multimodal_embeddings: Dict[str, ModalityEmbedding] = Field(default_factory=dict)
    unified_latent_vector: List[float] = Field(default_factory=list)
    active_modalities: List[str] = Field(default_factory=lambda: ["tabular"])
    missing_modalities: List[str] = Field(default_factory=list)


# ============================================================================
# EXPERIMENT RESULTS & BENCHMARKING
# ============================================================================

class ConfusionMatrixMetrics(BaseModel):
    true_positives: int
    true_negatives: int
    false_positives: int
    false_negatives: int


class MetricSet(BaseModel):
    accuracy: float
    sensitivity: float  # Recall
    specificity: float  # True Negative Rate
    precision: float
    f1_score: float
    roc_auc: float
    log_loss: Optional[float] = None


class CrossValidationSummary(BaseModel):
    method: str = "5-Fold Stratified Cross-Validation"
    accuracy_mean: float
    accuracy_std: float
    sensitivity_mean: float
    specificity_mean: float
    roc_auc_mean: float
    fold_scores: List[float] = Field(default_factory=list)


class QuantumCircuitTelemetry(BaseModel):
    qubit_count: int = 4
    circuit_depth: int
    total_gates: int
    cnot_entangler_count: int
    gate_breakdown: Dict[str, int] = Field(default_factory=dict)
    ansatz_name: Optional[str] = None
    feature_map_name: Optional[str] = None
    optimizer_name: Optional[str] = None
    statevector_dimension: int = 16


class ExperimentResult(BaseModel):
    model_id: str
    model_name: str
    model_type: str  # "classical" or "quantum"
    paradigm: str
    metrics: MetricSet
    confusion_matrix: ConfusionMatrixMetrics
    cross_validation: Optional[CrossValidationSummary] = None
    quantum_telemetry: Optional[QuantumCircuitTelemetry] = None
    training_time_sec: float
    inference_latency_ms: float
    basic_concept_summary: str
    advanced_research_summary: str
    figure_artifacts: Dict[str, str] = Field(default_factory=dict)


# ============================================================================
# QUANTUM FEASIBILITY & NOISE ROBUSTNESS
# ============================================================================

class NoiseDegradationPoint(BaseModel):
    noise_rate_percentage: float  # 0.0, 1.0, 3.0, 5.0
    accuracy: float
    fidelity_score: float
    state_purity: float


class QuantumFeasibilityReport(BaseModel):
    dataset_key: str
    qubits_required: int = 4
    hilbert_space_dimension: int = 16
    pca_variance_retention: float
    circuit_depth: int
    cnot_count: int
    noise_resilience_score: float  # Scale 0-100
    noise_curve: List[NoiseDegradationPoint] = Field(default_factory=list)
    barren_plateau_risk: str  # "LOW", "MODERATE", "HIGH"
    expressivity_score: float
    nisq_readiness_level: str  # "Simulation-Only", "NISQ-Ready (QPU)", "Fault-Tolerant Only"
    scientific_verdict: str


# ============================================================================
# MULTIMODAL FUSION
# ============================================================================

class FusionStrategyMetrics(BaseModel):
    strategy_name: str  # "Early Fusion", "Intermediate Fusion", "Late Adaptive Consensus"
    accuracy: float
    sensitivity: float
    specificity: float
    roc_auc: float
    modality_weights: Dict[str, float]
    missing_modality_robustness: float  # Accuracy drop percentage when a modality is dropped
    latency_ms: float
    recommendation: str


class MultimodalFusionResult(BaseModel):
    dataset_key: str
    available_modalities: List[str]
    early_fusion: FusionStrategyMetrics
    intermediate_fusion: FusionStrategyMetrics
    late_fusion: FusionStrategyMetrics
    best_strategy: str
    clinical_synergy_gain_auc: float  # AUC gain over best single modality


# ============================================================================
# EXPLAINABILITY & FEATURE ATTRIBUTION
# ============================================================================

class FeatureAttribution(BaseModel):
    feature_name: str
    importance_score: float
    normalized_impact: float  # -1.0 to +1.0
    direction: str  # "Increases Risk" or "Decreases Risk"


class BlochCoordinate(BaseModel):
    qubit_index: int
    theta_angle_rad: float
    phi_angle_rad: float = 0.0
    x: float
    y: float
    z: float
    alpha_real: float = 1.0
    beta_real: float = 0.0
    quantum_state_str: str = "|0>"


class CounterfactualItem(BaseModel):
    feature_name: str
    original_value: float
    recommended_value: float
    delta_change: float
    percentage_change: float
    clinical_rationale: str


class CounterfactualReport(BaseModel):
    dataset_key: str
    original_risk_probability: float
    target_risk_probability: float
    original_risk_tier: str
    target_risk_tier: str
    is_reversible: bool = True
    key_interventions: List[CounterfactualItem] = Field(default_factory=list)
    clinical_takeaway: str


class ExplainabilityReport(BaseModel):
    patient_id: Optional[str] = None
    predicted_class: int
    predicted_risk_probability: float
    top_attributions: List[FeatureAttribution]
    quantum_bloch_coordinates: List[BlochCoordinate] = Field(default_factory=list)
    quantum_kernel_sensitivity: Dict[str, float] = Field(default_factory=dict)
    counterfactual: Optional[CounterfactualReport] = None
    clinical_rationale: str


# ============================================================================
# UNCERTAINTY & MODEL DISAGREEMENT
# ============================================================================

class UncertaintyReport(BaseModel):
    epistemic_uncertainty: float  # Model lack of knowledge (0.0 - 1.0)
    aleatoric_uncertainty: float  # Inherent biomarker noise (0.0 - 1.0)
    consensus_confidence: float  # 0.0 - 1.0
    is_borderline_case: bool
    is_classical_quantum_discordant: bool
    classical_prediction: int
    classical_probability: float
    quantum_prediction: int
    quantum_probability: float
    hybrid_probability: float
    risk_tier: str  # "Low Risk", "Moderate / Borderline", "High Risk"
    triage_recommendation: str
    inter_model_std: Optional[float] = None
    inter_model_variance: Optional[float] = None
    boundary_entropy: Optional[float] = None
    discordance_delta: Optional[float] = None
    individual_probabilities: Optional[Dict[str, float]] = None
