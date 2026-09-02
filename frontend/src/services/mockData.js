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
  return {
    dataset_key: datasetKey,
    input_features: features,
    quantum_compressed_coordinates: [-0.42, 1.15, -0.88, 0.31],
    quantum_rotation_angles: [1.25, 2.80, 0.65, 1.95],
    predictions: {
      classical_rbf_svm: {
        prediction: 1,
        label: "Disease Positive",
        probability: 0.942,
        confidence_pct: 94.2
      },
      quantum_kernel_svm: {
        prediction: 1,
        label: "Disease Positive",
        probability: 0.885,
        confidence_pct: 88.5,
        qubit_count: 4,
        feature_map: "ZZFeatureMap (reps=2)"
      },
      hybrid_consensus_ensemble: {
        prediction: 1,
        label: "Disease Positive",
        probability: 0.9135,
        confidence_pct: 91.35,
        risk_tier: "High Risk (Immediate Specialist Referral Recommended)",
        risk_color: "#E74C3C"
      }
    },
    clinical_guidance: {
      sensitivity_note: "Quantum and Classical models exhibit high diagnostic sensitivity, reducing deadly false negatives.",
      recommendation: "Review clinical findings alongside high-resolution radiological / laboratory confirmation."
    }
  };
};
