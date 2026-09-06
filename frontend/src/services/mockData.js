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
  classical_svm: { accuracy: "97.4%", sensitivity: "92.9%", specificity: "100.0%", roc_auc: "0.996" },
  classical_mlp: { accuracy: "97.4%", sensitivity: "92.9%", specificity: "100.0%", roc_auc: "0.985", architecture: "(128, 64)", train_time: "0.53s" },
  quantum_qsvm: { accuracy: "85.1%", sensitivity: "76.2%", specificity: "90.3%", roc_auc: "0.916", qubits: 4, depth: 19, kernel_time: "0.61s" },
  quantum_qnn: { accuracy: "82.5%", sensitivity: "74.0%", specificity: "88.0%", roc_auc: "0.890", qubits: 4, train_time: "12.4s" }
};

export const mockCardioMetrics = {
  classical_svm: { accuracy: "83.6%", sensitivity: "81.5%", specificity: "85.2%", roc_auc: "0.912" },
  classical_mlp: { accuracy: "85.2%", sensitivity: "82.8%", specificity: "87.1%", roc_auc: "0.925", architecture: "(128, 64)", train_time: "0.48s" },
  quantum_qsvm: { accuracy: "80.3%", sensitivity: "78.1%", specificity: "82.0%", roc_auc: "0.875", qubits: 4, depth: 19, kernel_time: "0.55s" },
  quantum_qnn: { accuracy: "78.9%", sensitivity: "75.0%", specificity: "81.5%", roc_auc: "0.850", qubits: 4, train_time: "11.2s" }
};

export const mockPredictResult = (datasetKey, features) => {
  const isHighRisk = Object.values(features || {}).some(v => Number(v) > 20) || true;
  const pClass = isHighRisk ? 0.942 : 0.125;
  const pQuant = isHighRisk ? 0.885 : 0.180;
  const pHybrid = isHighRisk ? 0.914 : 0.152;

  return {
    dataset_key: datasetKey,
    input_features: features,
    quantum_compressed_coordinates: [-0.42, 1.15, -0.88, 0.31],
    quantum_rotation_angles: [1.25, 2.80, 0.65, 1.95],
    predictions: {
      classical_rbf_svm: {
        prediction: pClass >= 0.5 ? 1 : 0,
        label: pClass >= 0.5 ? "Disease Positive" : "Healthy Baseline",
        probability: pClass,
        confidence_pct: (pClass * 100).toFixed(1)
      },
      quantum_kernel_svm: {
        prediction: pQuant >= 0.5 ? 1 : 0,
        label: pQuant >= 0.5 ? "Disease Positive" : "Healthy Baseline",
        probability: pQuant,
        confidence_pct: (pQuant * 100).toFixed(1),
        qubit_count: 4,
        feature_map: "ZZFeatureMap (reps=2)"
      },
      hybrid_consensus_ensemble: {
        prediction: pHybrid >= 0.5 ? 1 : 0,
        label: pHybrid >= 0.5 ? "Disease Positive (Malignant / At-Risk)" : "Healthy / Low Risk Baseline",
        probability: pHybrid,
        confidence_pct: (pHybrid * 100).toFixed(1),
        risk_tier: pHybrid >= 0.7 ? "High Risk (Immediate Referral Recommended)" : (pHybrid >= 0.35 ? "Borderline Risk (Follow-up Recommended)" : "Low Risk (Healthy Baseline)"),
        risk_color: pHybrid >= 0.7 ? "#E74C3C" : (pHybrid >= 0.35 ? "#D97706" : "#16A34A")
      }
    },
    uncertainty: {
      epistemic_uncertainty: 0.085,
      aleatoric_uncertainty: 0.142,
      consensus_confidence: 0.915,
      is_borderline_case: false,
      is_classical_quantum_discordant: false,
      classical_prediction: pClass >= 0.5 ? 1 : 0,
      classical_probability: pClass,
      quantum_prediction: pQuant >= 0.5 ? 1 : 0,
      quantum_probability: pQuant,
      hybrid_probability: pHybrid,
      risk_tier: pHybrid >= 0.7 ? "High Risk" : "Low Risk",
      triage_recommendation: "High confidence tri-model agreement. Follow standard clinical protocols."
    },
    explainability: {
      patient_id: "preset_screening",
      predicted_class: pHybrid >= 0.5 ? 1 : 0,
      predicted_risk_probability: pHybrid,
      top_attributions: [
        { feature_name: "mean concave points", importance_score: 0.428, normalized_impact: 0.428, direction: "Increases Risk (Pathological Driver)" },
        { feature_name: "worst radius", importance_score: 0.385, normalized_impact: 0.385, direction: "Increases Risk (Pathological Driver)" },
        { feature_name: "worst perimeter", importance_score: 0.312, normalized_impact: 0.312, direction: "Increases Risk (Pathological Driver)" },
        { feature_name: "mean texture", importance_score: 0.184, normalized_impact: 0.184, direction: "Increases Risk (Pathological Driver)" },
        { feature_name: "mean smoothness", importance_score: 0.095, normalized_impact: -0.095, direction: "Decreases Risk (Protective / Baseline)" }
      ],
      quantum_kernel_sensitivity: {
        "Qubit_0_Sensitivity": 0.884,
        "Qubit_1_Sensitivity": 0.412,
        "Qubit_2_Sensitivity": 0.285,
        "Qubit_3_Sensitivity": 0.198
      },
      counterfactual: {
        dataset_key: datasetKey,
        original_risk_probability: pHybrid,
        target_risk_probability: 0.215,
        original_risk_tier: "High Risk (> 70%)",
        target_risk_tier: "Low Risk (Healthy / Baseline)",
        is_reversible: true,
        key_interventions: [
          {
            feature_name: "mean concave points",
            original_value: 0.147,
            recommended_value: 0.088,
            delta_change: -0.059,
            percentage_change: -40.1,
            clinical_rationale: "Surgical / biopsy clearance or anti-angiogenic intervention to normalize cellular border irregularity."
          },
          {
            feature_name: "worst radius",
            original_value: 25.38,
            recommended_value: 17.76,
            delta_change: -7.62,
            percentage_change: -30.0,
            clinical_rationale: "Targeted tumor debulking or neoadjuvant therapy to reduce lesion mass dimension."
          }
        ],
        clinical_takeaway: "Achieving targeted therapeutic reductions in mean concave points (-40.1%) and worst radius (-30.0%) reduces predicted clinical risk from 91.4% to 21.5%."
      },
      clinical_rationale: "Model assigned a 91.4% diagnostic risk score driven primarily by elevated nuclear irregularity (concave points) and lesion dimensions. Quantum statevector mapping reveals elevated phase rotation on Qubit 0 (Sensitivity: 0.884)."
    },
    bloch_coordinates: [
      { qubit_index: 0, theta_angle_rad: 1.25, phi_angle_rad: 0.625, x: 0.768, y: 0.554, z: 0.315, alpha_real: 0.817, beta_real: 0.576, quantum_state_str: "0.82|0⟩ + 0.58e^(i0.62)|1⟩" },
      { qubit_index: 1, theta_angle_rad: 2.80, phi_angle_rad: 1.40, x: 0.058, y: 0.334, z: -0.941, alpha_real: 0.170, beta_real: 0.985, quantum_state_str: "0.17|0⟩ + 0.99e^(i1.40)|1⟩" },
      { qubit_index: 2, theta_angle_rad: 0.65, phi_angle_rad: 0.325, x: 0.575, y: 0.193, z: 0.796, alpha_real: 0.948, beta_real: 0.319, quantum_state_str: "0.95|0⟩ + 0.32e^(i0.32)|1⟩" },
      { qubit_index: 3, theta_angle_rad: 1.95, phi_angle_rad: 0.975, x: 0.521, y: 0.772, z: -0.366, alpha_real: 0.560, beta_real: 0.828, quantum_state_str: "0.56|0⟩ + 0.83e^(i0.98)|1⟩" }
    ],
    clinical_guidance: {
      sensitivity_note: "Quantum and Classical models exhibit high diagnostic sensitivity, reducing deadly false negatives.",
      recommendation: "Review clinical findings alongside high-resolution radiological / laboratory confirmation."
    }
  };
};
