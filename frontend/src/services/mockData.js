// High-Fidelity Mock Service for Offline UI Development & Live Demos

const delay = (ms = 350) => new Promise(resolve => setTimeout(resolve, ms));

export const mockGetDatasets = async () => {
  await delay(200);
  return {
    datasets: [
      {
        id: "heart.csv",
        name: "UCI Heart Disease (13 Clinical Features)",
        samples: 303,
        features: 13,
        target_column: "target"
      },
      {
        id: "diabetes.csv",
        name: "PIMA Indians Diabetes (8 Metabolic Features)",
        samples: 300,
        features: 8,
        target_column: "Outcome"
      },
      {
        id: "parkinsons.csv",
        name: "Parkinson's Voice Recording (13 Acoustic Features)",
        samples: 195,
        features: 13,
        target_column: "status"
      }
    ]
  };
};

export const mockPreprocessDataset = async (datasetId, nQubits = 4, applySmote = true) => {
  await delay(250);
  
  let featureNames = [];
  let samplePreview = [];

  if (datasetId === "heart.csv") {
    featureNames = ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"];
    samplePreview = [
      { age: 63, sex: 1, cp: 3, trestbps: 145, chol: 233, fbs: 1, restecg: 0, thalach: 150, exang: 0, oldpeak: 2.3, slope: 0, ca: 0, thal: 1, target: 1 },
      { age: 37, sex: 1, cp: 2, trestbps: 130, chol: 250, fbs: 0, restecg: 1, thalach: 187, exang: 0, oldpeak: 3.5, slope: 0, ca: 0, thal: 2, target: 1 },
      { age: 41, sex: 0, cp: 1, trestbps: 130, chol: 204, fbs: 0, restecg: 0, thalach: 172, exang: 0, oldpeak: 1.4, slope: 2, ca: 0, thal: 2, target: 1 }
    ];
  } else if (datasetId === "diabetes.csv") {
    featureNames = ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"];
    samplePreview = [
      { Pregnancies: 6, Glucose: 148, BloodPressure: 72, SkinThickness: 35, Insulin: 0, BMI: 33.6, DiabetesPedigreeFunction: 0.627, Age: 50, Outcome: 1 },
      { Pregnancies: 1, Glucose: 85, BloodPressure: 66, SkinThickness: 29, Insulin: 0, BMI: 26.6, DiabetesPedigreeFunction: 0.351, Age: 31, Outcome: 0 },
      { Pregnancies: 8, Glucose: 183, BloodPressure: 64, SkinThickness: 0, Insulin: 0, BMI: 23.3, DiabetesPedigreeFunction: 0.672, Age: 32, Outcome: 1 }
    ];
  } else {
    featureNames = ["MDVP:Fo(Hz)", "MDVP:Fhi(Hz)", "MDVP:Flo(Hz)", "MDVP:Jitter(%)", "MDVP:Shimmer", "NHR", "HNR", "RPDE", "DFA", "spread1", "spread2", "D2", "PPE"];
    samplePreview = [
      { "MDVP:Fo(Hz)": 119.992, "MDVP:Fhi(Hz)": 157.302, "MDVP:Flo(Hz)": 74.997, "MDVP:Jitter(%)": 0.00784, "MDVP:Shimmer": 0.04374, NHR: 0.02211, HNR: 21.033, RPDE: 0.414783, DFA: 0.815285, spread1: -4.813031, spread2: 0.266482, D2: 2.301442, PPE: 0.284654, status: 1 }
    ];
  }

  return {
    status: "success",
    dataset: datasetId,
    original_stats: {
      num_samples: 303,
      num_features: featureNames.length,
      class_distribution: { "0": 138, "1": 165 }
    },
    processed_stats: {
      num_samples: 330,
      num_features_compressed: nQubits,
      explained_variance_ratio: [0.38, 0.24, 0.18, 0.12],
      total_explained_variance: 0.92,
      class_distribution: { "0": 165, "1": 165 },
      scatter_2d: [
        { x: -1.2, y: 0.5, label: 0 },
        { x: -0.8, y: -0.4, label: 0 },
        { x: 1.5, y: 1.2, label: 1 },
        { x: 1.8, y: -0.9, label: 1 }
      ]
    },
    feature_names: featureNames,
    sample_preview: samplePreview
  };
};

export const mockTrainModels = async () => {
  await delay(1200); // Simulate training delay
  return {
    status: "completed",
    benchmark_table: [
      { model: "Logistic Regression", category: "Classical", accuracy: 90.33, sensitivity: 96.33, specificity: 63.64, precision: 92.19, f1_score: 94.21, auc_roc: 0.9311, train_time_sec: 0.012 },
      { model: "Random Forest", category: "Classical", accuracy: 99.23, sensitivity: 100.0, specificity: 96.36, precision: 99.19, f1_score: 99.59, auc_roc: 0.9998, train_time_sec: 0.169 },
      { model: "SVM (RBF)", category: "Classical", accuracy: 96.00, sensitivity: 99.59, specificity: 80.00, precision: 95.69, f1_score: 97.60, auc_roc: 0.9923, train_time_sec: 0.029 },
      { model: "XGBoost", category: "Classical", accuracy: 100.0, sensitivity: 100.0, specificity: 100.0, precision: 100.0, f1_score: 100.0, auc_roc: 1.0000, train_time_sec: 0.100 },
      { model: "QSVM (Quantum Kernel)", category: "Quantum", accuracy: 92.66, sensitivity: 97.96, specificity: 45.45, precision: 88.89, f1_score: 93.20, auc_roc: 0.9779, train_time_sec: 0.024 },
      { model: "VQC (Variational Quantum)", category: "Quantum", accuracy: 73.67, sensitivity: 86.53, specificity: 16.36, precision: 82.17, f1_score: 84.29, auc_roc: 0.5219, train_time_sec: 5.461 },
      { model: "Hybrid Fusion (Classical + QML)", category: "Hybrid", accuracy: 95.75, sensitivity: 100.0, specificity: 69.09, precision: 93.51, f1_score: 96.65, auc_roc: 0.9968, train_time_sec: 0.050 }
    ],
    reality_check: {
      backend: "PennyLane Quantum Simulator (default.qubit)",
      qubit_count: 4,
      encoding: "Angle Encoding (RY + RZ)",
      shots: "Statevector Exact Analytical Simulator",
      limitation_note: "Simulated quantum circuit. Real quantum hardware execution requires IBM Quantum or AWS Braket API key."
    }
  };
};

export const mockGetExplainability = async () => {
  await delay(200);
  return {
    feature_importances: [
      { feature: "cp", importance: 28.5 },
      { feature: "oldpeak", importance: 22.1 },
      { feature: "age", importance: 18.4 },
      { feature: "thalach", importance: 16.2 },
      { feature: "ca", importance: 14.8 }
    ],
    sample_size: 50
  };
};

export const mockPredictPatient = async (patientData) => {
  await delay(350);

  // Dynamic mock risk probability based on inputs (e.g. cp, age, oldpeak)
  let riskScore = 0.15; // default low risk
  
  if (patientData.cp !== undefined && patientData.cp > 0) riskScore += 0.35;
  if (patientData.oldpeak !== undefined && patientData.oldpeak > 1.5) riskScore += 0.30;
  if (patientData.age !== undefined && patientData.age > 55) riskScore += 0.15;
  if (patientData.Glucose !== undefined && patientData.Glucose > 140) riskScore += 0.50;
  if (patientData.BMI !== undefined && patientData.BMI > 30) riskScore += 0.25;

  riskScore = Math.min(0.98, Math.max(0.05, riskScore));
  
  const classicalProb = Math.min(0.99, Math.max(0.02, riskScore * 0.95));
  const quantumProb = Math.min(0.99, Math.max(0.05, riskScore * 1.05));
  const hybridProb = (classicalProb + quantumProb) / 2;

  const isPositive = hybridProb >= 0.5;

  return {
    status: "success",
    predictions: {
      "Classical (Random Forest)": {
        probability: classicalProb,
        label: classicalProb >= 0.5 ? 1 : 0,
        confidence: `${(Math.max(classicalProb, 1 - classicalProb) * 100).toFixed(1)}%`
      },
      "Quantum (QSVM)": {
        probability: quantumProb,
        label: quantumProb >= 0.5 ? 1 : 0,
        confidence: `${(Math.max(quantumProb, 1 - quantumProb) * 100).toFixed(1)}%`
      },
      "Hybrid Fusion": {
        probability: hybridProb,
        label: isPositive ? 1 : 0,
        confidence: `${(Math.max(hybridProb, 1 - hybridProb) * 100).toFixed(1)}%`
      }
    },
    top_features: [
      { feature: "cp", importance: 28.5 },
      { feature: "oldpeak", importance: 22.1 },
      { feature: "age", importance: 18.4 }
    ],
    clinician_summary: `**Diagnostic Assessment**: ${isPositive ? 'POSITIVE (High Disease Risk)' : 'NEGATIVE (Low Disease Risk)'} with ${(Math.max(hybridProb, 1 - hybridProb) * 100).toFixed(1)}% confidence.\n` +
      `**Key Clinical Risk Drivers**: The primary features contributing to this prediction are **cp** (${patientData.cp || 0}), **oldpeak** (${patientData.oldpeak || 0}), **age** (${patientData.age || 0}).\n` +
      `**Quantum-Classical Consensus**: Classical model probability = ${(classicalProb * 100).toFixed(1)}%, Quantum model probability = ${(quantumProb * 100).toFixed(1)}%.`
  };
};

export const mockUploadDataset = async (file) => {
  await delay(400);
  const cleanName = file.name.replace(" ", "_");
  return {
    status: "success",
    message: `Dataset '${cleanName}' uploaded successfully.`,
    dataset: {
      id: cleanName,
      name: cleanName.replace(".csv", "").replace("_", " ").toUpperCase(),
      samples: 250,
      features: 10,
      target_column: "target"
    }
  };
};
