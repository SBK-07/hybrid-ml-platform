export const mockDatasets = [
  {
    key: "cancer",
    id: "cancer",
    name: "Breast Cancer Wisconsin Diagnostic (WDBC)",
    domain: "Oncology / Cytopathology",
    samples: 569,
    features_count: 30,
    quantum_qubits: 4,
    disease_positive_label: "Malignant",
    disease_negative_label: "Benign",
    description: "30 imaging-derived continuous nuclear morphometric features from fine-needle aspirates (FNA)."
  },
  {
    key: "cardiovascular",
    id: "cardiovascular",
    name: "UCI Heart Disease",
    domain: "Cardiovascular Medicine",
    samples: 303,
    features_count: 13,
    quantum_qubits: 4,
    disease_positive_label: "Heart Disease (Angiographic Presence)",
    disease_negative_label: "Healthy / Absence",
    description: "13 clinical, hemodynamic, and electrocardiographic attributes."
  }
];

export const mockCancerMetrics = {
  classical_svm: { accuracy: "97.4%", sensitivity: "95.2%", specificity: "98.6%", roc_auc: "0.991", train_time: "0.04s" },
  classical_mlp: { accuracy: "97.4%", sensitivity: "92.9%", specificity: "100.0%", roc_auc: "0.985", architecture: "(128, 64)", train_time: "0.53s" },
  quantum_qsvm: { accuracy: "85.1%", sensitivity: "76.2%", specificity: "90.3%", roc_auc: "0.916", qubits: 4, depth: 19, kernel_time: "0.61s" },
  quantum_qnn: { accuracy: "82.5%", sensitivity: "74.0%", specificity: "88.0%", roc_auc: "0.890", qubits: 4, train_time: "12.4s" },
  quantum_qvc: { accuracy: "83.8%", sensitivity: "75.5%", specificity: "89.1%", roc_auc: "0.898", qubits: 4, train_time: "14.1s" },
  hybrid_consensus_ensemble: { accuracy: "98.2%", sensitivity: "96.4%", specificity: "99.1%", roc_auc: "0.996", strategy: "Bayesian 5-Model Synthesis" }
};

export const mockCardioMetrics = {
  classical_svm: { accuracy: "83.6%", sensitivity: "81.5%", specificity: "85.2%", roc_auc: "0.912", train_time: "0.03s" },
  classical_mlp: { accuracy: "85.2%", sensitivity: "82.8%", specificity: "87.1%", roc_auc: "0.925", architecture: "(128, 64)", train_time: "0.48s" },
  quantum_qsvm: { accuracy: "80.3%", sensitivity: "78.1%", specificity: "82.0%", roc_auc: "0.875", qubits: 4, depth: 19, kernel_time: "0.55s" },
  quantum_qnn: { accuracy: "78.9%", sensitivity: "75.0%", specificity: "81.5%", roc_auc: "0.850", qubits: 4, train_time: "11.2s" },
  quantum_qvc: { accuracy: "79.8%", sensitivity: "76.4%", specificity: "82.3%", roc_auc: "0.862", qubits: 4, train_time: "13.0s" },
  hybrid_consensus_ensemble: { accuracy: "86.9%", sensitivity: "84.2%", specificity: "88.5%", roc_auc: "0.938", strategy: "Bayesian 5-Model Synthesis" }
};

export const mockPredictResult = (datasetKey, features) => {
  const isCardio = datasetKey === 'cardiovascular' || features?.age !== undefined;
  let baseRisk = 0.5;

  if (isCardio) {
    const oldpeak = Number(features?.oldpeak ?? 0);
    const ca = Number(features?.ca ?? 0);
    const thal = Number(features?.thal ?? 2);
    const trestbps = Number(features?.trestbps ?? 120);
    const chol = Number(features?.chol ?? 200);
    const thalach = Number(features?.thalach ?? 150);

    let score = -1.2;
    score += oldpeak * 0.95;
    score += ca * 0.75;
    score += (thal === 3 ? 1.1 : (thal === 1 ? 0.3 : -0.6));
    score += (trestbps - 120) * 0.025;
    score += (chol - 200) * 0.008;
    score -= (thalach - 150) * 0.015;
    baseRisk = 1 / (1 + Math.exp(-score));
  } else {
    // Breast Cancer Wisconsin continuous risk model
    const cp = Number(features?.['mean concave points'] ?? 0.04);
    const wp = Number(features?.['worst perimeter'] ?? 90);
    const wr = Number(features?.['worst radius'] ?? 14);
    const wconc = Number(features?.['worst concavity'] ?? 0.1);
    const mt = Number(features?.['mean texture'] ?? 18);

    // Calibrated logistic transfer function
    const logit = -4.2 + (cp * 32.0) + ((wp - 80) * 0.042) + ((wr - 12) * 0.12) + (wconc * 2.2) + ((mt - 16) * 0.05);
    baseRisk = 1 / (1 + Math.exp(-logit));
  }

  // Bound within reasonable clinical spectrum
  baseRisk = Math.max(0.04, Math.min(0.96, baseRisk));

  // Derive calibrated individual model probabilities reflecting characteristic paradigms
  const pSvm = Math.max(0.01, Math.min(0.99, baseRisk + (baseRisk > 0.5 ? 0.02 : -0.03)));
  const pMlp = Math.max(0.01, Math.min(0.99, baseRisk + (baseRisk > 0.5 ? 0.03 : -0.02)));
  // Quantum models exhibit non-linear boundary separation in ambiguous zones
  const pQsvm = Math.max(0.02, Math.min(0.98, baseRisk + (baseRisk > 0.35 && baseRisk < 0.65 ? 0.08 : (baseRisk > 0.5 ? -0.03 : 0.02))));
  const pQnn = Math.max(0.02, Math.min(0.98, baseRisk + (baseRisk > 0.5 ? -0.04 : 0.05)));
  const pQvc = Math.max(0.02, Math.min(0.98, baseRisk + (baseRisk > 0.5 ? 0.01 : -0.01)));

  // Paradigm consensus
  const pClass = (pSvm + pMlp) / 2;
  const pQuant = (pQsvm + pQnn + pQvc) / 3;
  const pHybrid = (pClass * 0.50) + (pQuant * 0.50);

  const benchmarks = isCardio ? mockCardioMetrics : mockCancerMetrics;

  let riskTier = "Low Risk (Routine Clearance / Healthy Baseline)";
  let riskColor = "#27AE60";
  if (pHybrid >= 0.80) {
    riskTier = "Critical Malignancy (Immediate Surgical / Oncology Referral)";
    riskColor = "#E74C3C";
  } else if (pHybrid >= 0.60) {
    riskTier = "Elevated Risk (Further Diagnostic Confirmation Advised)";
    riskColor = "#F39C12";
  } else if (pHybrid >= 0.40) {
    riskTier = "Borderline Ambiguity (Short-Interval Diagnostic Watchlist)";
    riskColor = "#D97706";
  } else if (pHybrid >= 0.20) {
    riskTier = "Guarded Baseline (Low Clinical Concern / Guarded)";
    riskColor = "#10B981";
  }

  const modelStd = Math.sqrt(
    [pSvm, pMlp, pQsvm, pQnn, pQvc].reduce((acc, v) => acc + Math.pow(v - pHybrid, 2), 0) / 5
  );
  const boundaryEntropy = - (pHybrid * Math.log2(Math.max(1e-5, pHybrid)) + (1 - pHybrid) * Math.log2(Math.max(1e-5, 1 - pHybrid)));
  const epistemicUncertainty = Math.min(0.45, Math.max(0.02, modelStd * 0.7 + boundaryEntropy * 0.12));
  const aleatoricUncertainty = Math.min(0.35, Math.max(0.03, boundaryEntropy * 0.18));
  const consensusConfidence = Math.max(0.55, Math.min(0.99, 1.0 - (epistemicUncertainty * 1.1)));
  const isDiscordant = Math.abs(pClass - pQuant) > 0.20;

  return {
    dataset_key: datasetKey,
    input_features: features,
    quantum_compressed_coordinates: [
      parseFloat((baseRisk * 2.5 - 1.25).toFixed(4)),
      parseFloat((Math.sin(baseRisk * Math.PI) * 1.2).toFixed(4)),
      parseFloat((-0.5 + baseRisk * 0.8).toFixed(4)),
      parseFloat((0.3 - baseRisk * 0.6).toFixed(4))
    ],
    quantum_rotation_angles: [
      parseFloat((baseRisk * Math.PI).toFixed(4)),
      parseFloat(((1 - baseRisk) * Math.PI * 0.8).toFixed(4)),
      parseFloat((baseRisk * Math.PI * 0.5).toFixed(4)),
      parseFloat(((1 - baseRisk) * Math.PI * 0.6).toFixed(4))
    ],
    predictions: {
      classical_rbf_svm: {
        prediction: pSvm >= 0.5 ? 1 : 0,
        label: pSvm >= 0.5 ? "Disease Positive" : "Healthy Baseline",
        probability: parseFloat(pSvm.toFixed(4)),
        confidence_pct: parseFloat((pSvm * 100).toFixed(1)),
        model_name: "Classical SVM (RBF Kernel)",
        framework: "Scikit-Learn RBF Hyperplane Margin",
        training_metrics: benchmarks.classical_svm
      },
      classical_mlp: {
        prediction: pMlp >= 0.5 ? 1 : 0,
        label: pMlp >= 0.5 ? "Disease Positive" : "Healthy Baseline",
        probability: parseFloat(pMlp.toFixed(4)),
        confidence_pct: parseFloat((pMlp * 100).toFixed(1)),
        model_name: "Classical Neural Network (MLP)",
        framework: "Deep Feed-Forward Network (64, 32 ReLU)",
        training_metrics: benchmarks.classical_mlp
      },
      quantum_kernel_svm: {
        prediction: pQsvm >= 0.5 ? 1 : 0,
        label: pQsvm >= 0.5 ? "Disease Positive" : "Healthy Baseline",
        probability: parseFloat(pQsvm.toFixed(4)),
        confidence_pct: parseFloat((pQsvm * 100).toFixed(1)),
        model_name: "Quantum Kernel QSVM",
        qubit_count: 4,
        feature_map: "ZZFeatureMap (reps=2, linear entanglement)",
        training_metrics: benchmarks.quantum_qsvm
      },
      quantum_qnn: {
        prediction: pQnn >= 0.5 ? 1 : 0,
        label: pQnn >= 0.5 ? "Disease Positive" : "Healthy Baseline",
        probability: parseFloat(pQnn.toFixed(4)),
        confidence_pct: parseFloat((pQnn * 100).toFixed(1)),
        model_name: "Quantum Neural Network (QNN)",
        qubit_count: 4,
        feature_map: "RealAmplitudes Variational Circuit (16 angles)",
        training_metrics: benchmarks.quantum_qnn
      },
      quantum_qvc: {
        prediction: pQvc >= 0.5 ? 1 : 0,
        label: pQvc >= 0.5 ? "Disease Positive" : "Healthy Baseline",
        probability: parseFloat(pQvc.toFixed(4)),
        confidence_pct: parseFloat((pQvc * 100).toFixed(1)),
        model_name: "Quantum Variational Circuit (QVC)",
        qubit_count: 4,
        feature_map: "EfficientSU2 Noise-Robust Circuit (24 angles)",
        training_metrics: benchmarks.quantum_qvc
      },
      hybrid_consensus_ensemble: {
        prediction: pHybrid >= 0.5 ? 1 : 0,
        label: pHybrid >= 0.5 ? "Disease Positive (Pathological Risk)" : "Healthy Baseline (Routine Clearance)",
        probability: parseFloat(pHybrid.toFixed(4)),
        confidence_pct: parseFloat((pHybrid * 100).toFixed(1)),
        risk_tier: riskTier,
        risk_color: riskColor,
        classical_consensus_prob: parseFloat(pClass.toFixed(4)),
        quantum_consensus_prob: parseFloat(pQuant.toFixed(4)),
        training_metrics: benchmarks.hybrid_consensus_ensemble
      }
    },
    uncertainty: {
      epistemic_uncertainty: parseFloat(epistemicUncertainty.toFixed(4)),
      aleatoric_uncertainty: parseFloat(aleatoricUncertainty.toFixed(4)),
      consensus_confidence: parseFloat(consensusConfidence.toFixed(4)),
      inter_model_variance: parseFloat(Math.pow(modelStd, 2).toFixed(4)),
      inter_model_std: parseFloat(modelStd.toFixed(4)),
      boundary_entropy: parseFloat(boundaryEntropy.toFixed(4)),
      is_borderline_case: pHybrid >= 0.35 && pHybrid <= 0.65,
      is_classical_quantum_discordant: isDiscordant,
      discordance_delta: parseFloat(Math.abs(pClass - pQuant).toFixed(4)),
      classical_probability: parseFloat(pClass.toFixed(4)),
      quantum_probability: parseFloat(pQuant.toFixed(4)),
      hybrid_probability: parseFloat(pHybrid.toFixed(4)),
      risk_tier: riskTier,
      triage_recommendation: isDiscordant
        ? "Classical and Quantum paradigms diverge across non-linear manifold. Prioritize high-resolution imaging and specialist pathology review."
        : (pHybrid >= 0.5 ? "High-confidence 5-model consensus. Proceed with diagnostic workup." : "Consistent low-risk consensus across classical and quantum models. Recommend routine surveillance.")
    },
    explainability: {
      patient_id: "preset_screening",
      predicted_class: pHybrid >= 0.5 ? 1 : 0,
      predicted_risk_probability: parseFloat(pHybrid.toFixed(4)),
      top_attributions: isCardio ? [
        { feature_name: "oldpeak", importance_score: 0.385, normalized_impact: 0.385, direction: "Increases Risk (ST Depression)" },
        { feature_name: "ca", importance_score: 0.295, normalized_impact: 0.295, direction: "Increases Risk (Calcified Vessels)" },
        { feature_name: "thal", importance_score: 0.210, normalized_impact: 0.210, direction: "Increases Risk (Defect)" },
        { feature_name: "thalach", importance_score: 0.125, normalized_impact: -0.125, direction: "Protective (Max Heart Rate Reserve)" }
      ] : [
        { feature_name: "mean concave points", importance_score: 0.428, normalized_impact: 0.428, direction: "Increases Risk (Pathological Driver)" },
        { feature_name: "worst perimeter", importance_score: 0.312, normalized_impact: 0.312, direction: "Increases Risk (Pathological Driver)" },
        { feature_name: "worst radius", importance_score: 0.285, normalized_impact: 0.285, direction: "Increases Risk (Pathological Driver)" },
        { feature_name: "mean texture", importance_score: 0.184, normalized_impact: 0.184, direction: "Increases Risk (Heterogeneity)" },
        { feature_name: "mean smoothness", importance_score: 0.095, normalized_impact: -0.095, direction: "Protective / Baseline Margin" }
      ],
      quantum_kernel_sensitivity: {
        "Qubit_0_Sensitivity": parseFloat((0.65 + baseRisk * 0.25).toFixed(3)),
        "Qubit_1_Sensitivity": parseFloat((0.35 + (1 - baseRisk) * 0.15).toFixed(3)),
        "Qubit_2_Sensitivity": parseFloat((0.25 + baseRisk * 0.10).toFixed(3)),
        "Qubit_3_Sensitivity": 0.198
      },
      counterfactual: {
        dataset_key: datasetKey,
        original_risk_probability: parseFloat(pHybrid.toFixed(4)),
        target_risk_probability: 0.145,
        original_risk_tier: riskTier,
        target_risk_tier: "Routine Clearance / Healthy Baseline",
        is_reversible: true,
        key_interventions: isCardio ? [
          {
            feature_name: "oldpeak",
            original_value: Number(features?.oldpeak ?? 2.0),
            recommended_value: 0.2,
            delta_change: -1.8,
            percentage_change: -90.0,
            clinical_rationale: "Revascularization or medical anti-ischemic therapy to normalize exertion-induced ST depression."
          },
          {
            feature_name: "chol",
            original_value: Number(features?.chol ?? 250),
            recommended_value: 180,
            delta_change: -70,
            percentage_change: -28.0,
            clinical_rationale: "High-intensity statin therapy to reduce LDL-cholesterol below guideline threshold."
          }
        ] : [
          {
            feature_name: "mean concave points",
            original_value: Number(features?.['mean concave points'] ?? 0.10),
            recommended_value: 0.025,
            delta_change: -0.075,
            percentage_change: -75.0,
            clinical_rationale: "Surgical / biopsy clearance or anti-angiogenic intervention to normalize cellular border irregularity."
          },
          {
            feature_name: "worst radius",
            original_value: Number(features?.['worst radius'] ?? 20.0),
            recommended_value: 13.5,
            delta_change: -6.5,
            percentage_change: -32.5,
            clinical_rationale: "Targeted tumor debulking or neoadjuvant therapy to reduce lesion mass dimension."
          }
        ],
        clinical_takeaway: `Targeted clinical normalization of primary drivers reduces predicted risk from ${(pHybrid * 100).toFixed(1)}% to 14.5%.`
      },
      clinical_rationale: `5-model consensus assigned a ${(pHybrid * 100).toFixed(1)}% diagnostic risk score. Quantum kernel statevector projections and classical margins synthesize a high-fidelity risk profile.`
    },
    bloch_coordinates: [
      { qubit_index: 0, theta_angle_rad: parseFloat((baseRisk * 2.2).toFixed(3)), phi_angle_rad: 0.625, x: 0.768, y: 0.554, z: 0.315, alpha_real: 0.817, beta_real: 0.576, quantum_state_str: "0.82|0⟩ + 0.58e^(i0.62)|1⟩" },
      { qubit_index: 1, theta_angle_rad: parseFloat(((1 - baseRisk) * 2.8).toFixed(3)), phi_angle_rad: 1.40, x: 0.058, y: 0.334, z: -0.941, alpha_real: 0.170, beta_real: 0.985, quantum_state_str: "0.17|0⟩ + 0.99e^(i1.40)|1⟩" },
      { qubit_index: 2, theta_angle_rad: 0.65, phi_angle_rad: 0.325, x: 0.575, y: 0.193, z: 0.796, alpha_real: 0.948, beta_real: 0.319, quantum_state_str: "0.95|0⟩ + 0.32e^(i0.32)|1⟩" },
      { qubit_index: 3, theta_angle_rad: 1.95, phi_angle_rad: 0.975, x: 0.521, y: 0.772, z: -0.366, alpha_real: 0.560, beta_real: 0.828, quantum_state_str: "0.56|0⟩ + 0.83e^(i0.98)|1⟩" }
    ],
    clinical_guidance: {
      sensitivity_note: "Quantum and Classical models exhibit high diagnostic sensitivity, reducing deadly false negatives.",
      recommendation: isDiscordant
        ? "Classical and Quantum paradigms diverge across non-linear manifold. Prioritize high-resolution imaging and specialist pathology review."
        : (pHybrid >= 0.5 ? "High-confidence 5-model consensus. Proceed with diagnostic workup." : "Consistent low-risk consensus across classical and quantum models. Recommend routine surveillance.")
    }
  };
};

// Curated authentic biomedical imaging presets for instant 1-click clinical testing
export const SAMPLE_IMAGE_PRESETS = [
  {
    id: "mri_gbm",
    name: "Brain MRI: Glioblastoma Multiforme",
    modality: "MRI Scan (T1-Gd)",
    category: "High-Grade Neuro-Oncology",
    expectedRisk: "High Risk (~84%)",
    isPathological: true,
    radiomics: {
      mri_intensity_mean: 0.3842,
      mri_spatial_contrast: 0.0485,
      mri_tissue_heterogeneity: 0.1428,
      mri_edge_density: 0.2864,
      mri_hemispheric_symmetry: 0.6821,
      mri_laplacian_sharpness: 0.0382,
      mri_compactness: 0.4820
    },
    findings: "Pathological tissue profile identified. Key findings: hyperintense contrast-enhancing mass lesion with extensive peritumoral edema, significant mass effect, and disrupted hemispheric symmetry (0.68 vs >0.90 control).",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#0A0F1D"/>
      <ellipse cx="100" cy="100" rx="72" ry="86" fill="#1E293B" stroke="#475569" stroke-width="2"/>
      <ellipse cx="100" cy="100" rx="66" ry="80" fill="#0F172A"/>
      <!-- Ventricles -->
      <path d="M92 80 C88 95 86 110 92 125 C95 110 95 95 92 80 Z" fill="#334155"/>
      <path d="M108 80 C112 95 114 110 108 125 C105 110 105 95 108 80 Z" fill="#334155"/>
      <!-- Glioblastoma Lesion & Edema -->
      <circle cx="128" cy="88" r="22" fill="#E2E8F0" opacity="0.85" filter="drop-shadow(0 0 8px #EF4444)"/>
      <circle cx="128" cy="88" r="14" fill="#FFFFFF"/>
      <ellipse cx="124" cy="92" rx="26" ry="20" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="2,2"/>
      <text x="10" y="24" fill="#EF4444" font-size="10" font-weight="bold" font-family="sans-serif">● LESION DETECTED</text>
      <text x="10" y="190" fill="#94A3B8" font-size="9" font-family="sans-serif">Brain MRI (T1+C) Ax.</text>
    </svg>`
  },
  {
    id: "mri_normal",
    name: "Brain MRI: Normal Cerebral Parenchyma",
    modality: "MRI Scan (T2)",
    category: "Healthy Control",
    expectedRisk: "Minimal Risk (~12%)",
    isPathological: false,
    radiomics: {
      mri_intensity_mean: 0.2215,
      mri_spatial_contrast: 0.0112,
      mri_tissue_heterogeneity: 0.0384,
      mri_edge_density: 0.1240,
      mri_hemispheric_symmetry: 0.9412,
      mri_laplacian_sharpness: 0.0165,
      mri_compactness: 0.2450
    },
    findings: "Normal physiological scan confirmed. Uniform cortical mantle, preserved bilateral ventricular symmetry (0.94), normal white-gray differentiation, and zero focal space-occupying lesions.",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#0A0F1D"/>
      <ellipse cx="100" cy="100" rx="72" ry="86" fill="#1E293B" stroke="#475569" stroke-width="2"/>
      <ellipse cx="100" cy="100" rx="66" ry="80" fill="#0F172A"/>
      <!-- Symmetrical Ventricles -->
      <path d="M92 78 C86 95 86 112 92 126 C96 112 96 95 92 78 Z" fill="#334155"/>
      <path d="M108 78 C114 95 114 112 108 126 C104 112 104 95 108 78 Z" fill="#334155"/>
      <!-- Midline -->
      <line x1="100" y1="20" x2="100" y2="180" stroke="#334155" stroke-dasharray="3,3"/>
      <text x="10" y="24" fill="#10B981" font-size="10" font-weight="bold" font-family="sans-serif">✓ PHYSIOLOGICAL</text>
      <text x="10" y="190" fill="#94A3B8" font-size="9" font-family="sans-serif">Brain MRI (T2) Normal</text>
    </svg>`
  },
  {
    id: "ct_nodule",
    name: "Chest CT: Solitary Pulmonary Nodule",
    modality: "Chest CT (High-Res)",
    category: "Pulmonary Oncology / Watchlist",
    expectedRisk: "Borderline / Elevated (~62%)",
    isPathological: true,
    radiomics: {
      mri_intensity_mean: 0.2980,
      mri_spatial_contrast: 0.0345,
      mri_tissue_heterogeneity: 0.0985,
      mri_edge_density: 0.2240,
      mri_hemispheric_symmetry: 0.7850,
      mri_laplacian_sharpness: 0.0270,
      mri_compactness: 0.3890
    },
    findings: "Focal solitary pulmonary nodule observed in right upper lobe (14mm diameter with lobulated margins and ground-glass halo). Recommend short-interval repeat CT and PET/CT evaluation.",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#0A0F1D"/>
      <ellipse cx="100" cy="100" rx="84" ry="70" fill="#1E293B" stroke="#475569" stroke-width="2"/>
      <!-- Right & Left Lung Cavities -->
      <ellipse cx="68" cy="100" rx="26" ry="46" fill="#020617"/>
      <ellipse cx="132" cy="100" rx="26" ry="46" fill="#020617"/>
      <!-- Mediastinum / Spine -->
      <circle cx="100" cy="148" r="14" fill="#475569"/>
      <path d="M92 70 C96 85 96 115 92 130 C108 130 108 85 92 70 Z" fill="#334155"/>
      <!-- Solitary Nodule in Left Image (Anatomical Right Lung) -->
      <circle cx="64" cy="85" r="9" fill="#F87171" opacity="0.9" filter="drop-shadow(0 0 6px #EF4444)"/>
      <circle cx="64" cy="85" r="5" fill="#FFFFFF"/>
      <text x="10" y="24" fill="#F59E0B" font-size="10" font-weight="bold" font-family="sans-serif">⚠ NODULE DETECTED</text>
      <text x="10" y="190" fill="#94A3B8" font-size="9" font-family="sans-serif">Chest CT Axial (14mm)</text>
    </svg>`
  },
  {
    id: "ct_clear",
    name: "Chest CT: Clear Physiological Lung Field",
    modality: "Chest CT",
    category: "Healthy Control",
    expectedRisk: "Minimal Risk (~11%)",
    isPathological: false,
    radiomics: {
      mri_intensity_mean: 0.1850,
      mri_spatial_contrast: 0.0095,
      mri_tissue_heterogeneity: 0.0290,
      mri_edge_density: 0.1150,
      mri_hemispheric_symmetry: 0.9520,
      mri_laplacian_sharpness: 0.0140,
      mri_compactness: 0.2100
    },
    findings: "Clear bilateral lung parenchyma with normal bronchovascular arborization. Mediastinum, cardiac silhouette, and pleural spaces within normal physiological limits.",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#0A0F1D"/>
      <ellipse cx="100" cy="100" rx="84" ry="70" fill="#1E293B" stroke="#475569" stroke-width="2"/>
      <ellipse cx="68" cy="100" rx="26" ry="46" fill="#020617"/>
      <ellipse cx="132" cy="100" rx="26" ry="46" fill="#020617"/>
      <circle cx="100" cy="148" r="14" fill="#475569"/>
      <path d="M92 70 C96 85 96 115 92 130 C108 130 108 85 92 70 Z" fill="#334155"/>
      <text x="10" y="24" fill="#10B981" font-size="10" font-weight="bold" font-family="sans-serif">✓ CLEAR FIELDS</text>
      <text x="10" y="190" fill="#94A3B8" font-size="9" font-family="sans-serif">Chest CT Normal</text>
    </svg>`
  },
  {
    id: "echo_stress",
    name: "Echocardiogram: Stress Wall Motion Abnormality",
    modality: "Cardiac Ultrasound / Stress",
    category: "Cardiovascular Ischemia",
    expectedRisk: "Elevated Risk (~76%)",
    isPathological: true,
    radiomics: {
      mri_intensity_mean: 0.3420,
      mri_spatial_contrast: 0.0410,
      mri_tissue_heterogeneity: 0.1250,
      mri_edge_density: 0.2540,
      mri_hemispheric_symmetry: 0.7240,
      mri_laplacian_sharpness: 0.0310,
      mri_compactness: 0.4400
    },
    findings: "Apical 4-chamber view demonstrates regional wall motion hypokinesia in the mid-to-apical anterior septum during exertion. Correlates with significant left anterior descending coronary compromise.",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#0A0F1D"/>
      <!-- Fan beam sector -->
      <path d="M100 20 L25 180 A110 110 0 0 0 175 180 Z" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
      <path d="M100 30 L40 175 A95 95 0 0 0 160 175 Z" fill="#020617"/>
      <!-- Chamber silhouettes -->
      <ellipse cx="85" cy="115" rx="16" ry="24" fill="#0F172A" stroke="#334155"/>
      <ellipse cx="115" cy="115" rx="16" ry="24" fill="#0F172A" stroke="#334155"/>
      <!-- Hypokinetic Area Highlight -->
      <path d="M85 92 Q100 95 100 120" stroke="#F59E0B" stroke-width="3" fill="none"/>
      <circle cx="92" cy="100" r="5" fill="#EF4444" opacity="0.8"/>
      <text x="10" y="24" fill="#F59E0B" font-size="10" font-weight="bold" font-family="sans-serif">⚠ WALL MOTION HYPOKINESIA</text>
      <text x="10" y="195" fill="#94A3B8" font-size="9" font-family="sans-serif">Transthoracic Echo 4-Ch</text>
    </svg>`
  }
];

export const mockPredictImageResult = (datasetKey, fileOrPreset, presetInfo = null) => {
  const isPreset = presetInfo !== null && typeof presetInfo === 'object';
  const preset = isPreset ? presetInfo : SAMPLE_IMAGE_PRESETS[0];

  const radiomics = preset.radiomics || {
    mri_intensity_mean: 0.35,
    mri_spatial_contrast: 0.045,
    mri_tissue_heterogeneity: 0.12,
    mri_edge_density: 0.26,
    mri_hemispheric_symmetry: 0.70,
    mri_laplacian_sharpness: 0.035,
    mri_compactness: 0.45
  };

  const isPathological = preset.isPathological ?? (radiomics.mri_spatial_contrast > 0.025);
  const isCardio = datasetKey === 'cardiovascular' || preset.id === 'echo_stress';

  let mappedFeatures = {};
  if (isCardio) {
    mappedFeatures = {
      age: 62,
      sex: 1,
      cp: isPathological ? 3 : 0,
      trestbps: isPathological ? 155 : 120,
      chol: isPathological ? 275 : 185,
      fbs: isPathological ? 1 : 0,
      restecg: isPathological ? 1 : 0,
      thalach: isPathological ? 115 : 160,
      exang: isPathological ? 1 : 0,
      oldpeak: isPathological ? 2.6 : 0.2,
      slope: isPathological ? 1 : 2,
      ca: isPathological ? 2 : 0,
      thal: isPathological ? 3 : 2
    };
  } else {
    mappedFeatures = {
      "mean radius": isPathological ? 19.5 : 12.0,
      "mean texture": isPathological ? 22.4 : 14.5,
      "mean perimeter": isPathological ? 128.0 : 78.0,
      "mean area": isPathological ? 1180.0 : 440.0,
      "mean smoothness": isPathological ? 0.108 : 0.088,
      "mean compactness": isPathological ? 0.165 : 0.052,
      "mean concavity": isPathological ? 0.185 : 0.018,
      "mean concave points": isPathological ? 0.098 : 0.012,
      "mean symmetry": isPathological ? 0.198 : 0.155,
      "mean fractal dimension": isPathological ? 0.065 : 0.058,
      "worst radius": isPathological ? 24.2 : 13.2,
      "worst texture": isPathological ? 29.5 : 18.2,
      "worst perimeter": isPathological ? 160.0 : 84.0,
      "worst area": isPathological ? 1720.0 : 520.0,
      "worst smoothness": isPathological ? 0.145 : 0.115,
      "worst compactness": isPathological ? 0.380 : 0.095,
      "worst concavity": isPathological ? 0.440 : 0.056,
      "worst concave points": isPathological ? 0.210 : 0.039,
      "worst symmetry": isPathological ? 0.315 : 0.245,
      "worst fractal dimension": isPathological ? 0.092 : 0.072
    };
  }

  const baseResult = mockPredictResult(datasetKey, mappedFeatures);

  const svgDataUrl = preset.svg
    ? `data:image/svg+xml;utf8,${encodeURIComponent(preset.svg)}`
    : "";

  baseResult.image_analysis = {
    filename: preset.name || (fileOrPreset?.name || "clinical_scan.png"),
    image_data_url: svgDataUrl,
    scan_type: preset.modality || "Medical Imaging Scan",
    radiomics: radiomics,
    diagnostic_findings: preset.findings || "Image radiomics analyzed. Texture and border gradients mapped into clinical decision space.",
    tissue_heterogeneity: radiomics.mri_tissue_heterogeneity,
    spatial_contrast: radiomics.mri_spatial_contrast,
    edge_density: radiomics.mri_edge_density,
    symmetry_index: radiomics.mri_hemispheric_symmetry,
    sharpness: radiomics.mri_laplacian_sharpness,
    mean_intensity: radiomics.mri_intensity_mean
  };

  return baseResult;
};

