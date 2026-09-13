/**
 * mockResearcherTelemetry.js
 * Local mock data module for Advanced Researcher Telemetry in Individual Experiment.
 * Contains mock structures for telemetry items currently missing or partially existing in the backend API.
 * Each mock field contains a one-line comment identifying what backend feature it stands in for.
 */

// MOCK — backend has no architectural_hyperparameters dict per model type yet, only text metadata
export const mockArchitecturalHyperparameters = {
  svm: {
    model_family: "Support Vector Classifier (Kernel Method)",
    kernel: "rbf (Radial Basis Function)",
    C: "1.0",
    gamma: "scale (1 / (n_features * X.var()))",
    class_weight: "balanced (SMOTE augmented)",
    probability: "true",
    random_state: "42"
  },
  mlp: {
    model_family: "Multi-Layer Perceptron (Artificial Neural Network)",
    hidden_layer_sizes: "[64, 32, 16]",
    activation: "ReLU",
    solver: "adam",
    alpha: "0.0001",
    learning_rate_init: "0.001",
    max_iter: "200",
    early_stopping: "true"
  },
  qsvm: {
    model_family: "Quantum Kernel Support Vector Machine",
    num_qubits: 4,
    feature_map: "ZZFeatureMap",
    feature_map_reps: 2,
    entanglement: "linear",
    quantum_kernel: "FidelityQuantumKernel",
    backend: "Qiskit Aer Simulator (Statevector)",
    shots: 1024
  },
  qnn: {
    model_family: "Parameterized Quantum Neural Network",
    num_qubits: 4,
    feature_map: "ZFeatureMap (reps=1)",
    ansatz: "RealAmplitudes",
    ansatz_reps: 3,
    trainable_parameters: 16,
    optimizer: "COBYLA",
    max_iterations: 100,
    shots: 2048
  },
  qvc: {
    model_family: "Variational Quantum Classifier",
    num_qubits: 4,
    feature_map: "PauliFeatureMap (reps=2, 'zy')",
    ansatz: "EfficientSU2",
    ansatz_reps: 2,
    entanglement: "full",
    trainable_parameters: 24,
    optimizer: "SPSA (Stochastic Gradient)",
    shots: 1024
  }
};

// MOCK — backend returns hyperparameter search space as a single string, no structured grid search object
export const mockHyperparameterSearch = {
  svm: {
    method: "GridSearchCV (5-Fold Cross Validation)",
    scoring_metric: "ROC-AUC",
    n_candidates_evaluated: 16,
    search_space: {
      C: "[0.01, 0.1, 1.0, 10.0, 100.0]",
      gamma: "['scale', 'auto', 0.001, 0.01, 0.1]"
    },
    best_params: {
      C: "1.0",
      gamma: "scale"
    }
  },
  mlp: {
    method: "RandomizedSearchCV (5-Fold Stratified)",
    scoring_metric: "ROC-AUC",
    n_candidates_evaluated: 20,
    search_space: {
      hidden_layer_sizes: "[(32,16), (64,32,16), (128,64)]",
      alpha: "[0.0001, 0.001, 0.01]",
      learning_rate_init: "[0.001, 0.01]"
    },
    best_params: {
      hidden_layer_sizes: "[64, 32, 16]",
      alpha: "0.0001",
      learning_rate_init: "0.001"
    }
  },
  qsvm: {
    method: "Quantum Grid Parameter Search",
    scoring_metric: "Fidelity Overlap Score",
    n_candidates_evaluated: 8,
    search_space: {
      feature_map_reps: "[1, 2, 3]",
      entanglement: "['linear', 'full', 'circular']"
    },
    best_params: {
      feature_map_reps: 2,
      entanglement: "linear"
    }
  },
  qnn: {
    method: "Variational Parameter Tuning",
    scoring_metric: "Log-Loss Loss Function",
    n_candidates_evaluated: 12,
    search_space: {
      ansatz_reps: "[1, 2, 3, 4]",
      learning_rate: "[0.01, 0.05, 0.1]"
    },
    best_params: {
      ansatz_reps: 3,
      learning_rate: "0.05"
    }
  },
  qvc: {
    method: "SPSA Stochastic Grid Search",
    scoring_metric: "Parity Expectation Value",
    n_candidates_evaluated: 10,
    search_space: {
      ansatz: "['RealAmplitudes', 'EfficientSU2']",
      entanglement: "['linear', 'full']"
    },
    best_params: {
      ansatz: "EfficientSU2",
      entanglement: "full"
    }
  }
};

// MOCK — backend returns scalar roc_auc value only, no continuous (fpr, tpr) coordinate point arrays
export const mockRocCurvePoints = {
  svm: {
    fpr: [0.0, 0.0, 0.014, 0.028, 0.055, 0.100, 0.200, 0.500, 1.0],
    tpr: [0.0, 0.928, 0.952, 0.976, 0.988, 1.0, 1.0, 1.0, 1.0]
  },
  mlp: {
    fpr: [0.0, 0.014, 0.028, 0.055, 0.090, 0.150, 0.300, 1.0],
    tpr: [0.0, 0.900, 0.940, 0.965, 0.980, 0.995, 1.0, 1.0]
  },
  qsvm: {
    fpr: [0.0, 0.040, 0.083, 0.150, 0.250, 0.400, 0.650, 1.0],
    tpr: [0.0, 0.571, 0.720, 0.830, 0.890, 0.930, 0.970, 1.0]
  },
  qnn: {
    fpr: [0.0, 0.050, 0.110, 0.200, 0.320, 0.500, 0.750, 1.0],
    tpr: [0.0, 0.520, 0.680, 0.790, 0.850, 0.910, 0.960, 1.0]
  },
  qvc: {
    fpr: [0.0, 0.060, 0.120, 0.220, 0.350, 0.520, 0.780, 1.0],
    tpr: [0.0, 0.500, 0.660, 0.770, 0.840, 0.900, 0.950, 1.0]
  }
};

// MOCK — backend returns no precision-recall curve coordinate point arrays
export const mockPrCurvePoints = {
  svm: {
    recall: [0.0, 0.2, 0.4, 0.6, 0.8, 0.928, 1.0],
    precision: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.65]
  },
  mlp: {
    recall: [0.0, 0.2, 0.4, 0.6, 0.8, 0.910, 1.0],
    precision: [1.0, 1.0, 0.98, 0.96, 0.94, 0.91, 0.60]
  },
  qsvm: {
    recall: [0.0, 0.2, 0.4, 0.571, 0.75, 0.90, 1.0],
    precision: [1.0, 0.92, 0.88, 0.80, 0.72, 0.60, 0.45]
  },
  qnn: {
    recall: [0.0, 0.2, 0.4, 0.540, 0.70, 0.88, 1.0],
    precision: [1.0, 0.90, 0.85, 0.78, 0.68, 0.55, 0.40]
  },
  qvc: {
    recall: [0.0, 0.2, 0.4, 0.520, 0.68, 0.85, 1.0],
    precision: [1.0, 0.88, 0.83, 0.76, 0.66, 0.52, 0.38]
  }
};

// MOCK — backend returns qubit_count & depth scalars, but no visual quantum circuit ASCII/SVG schematic layout structure
export const mockQuantumCircuitSchematic = {
  qsvm: {
    type: "Quantum Kernel ZZFeatureMap",
    qubits: 4,
    reps: 2,
    entanglement: "linear",
    layers: [
      { name: "Hadamard Layer", symbol: "H", target: "All Qubits [q0..q3]" },
      { name: "Phase Rotation Rz(2θ)", symbol: "Rz", target: "Data Angle Encoding" },
      { name: "Entangling CNOT Gates", symbol: "CX", target: "Linear Nearest-Neighbor" },
      { name: "Fidelity Measurement", symbol: "M", target: "Quantum State Vector Inner Product" }
    ],
    ascii_diagram: [
      "|q0⟩ ──[ H ]──[ Rz(2x₁) ]──■──────────[ Rz(2(π-x₁)(π-x₂)) ]── M ",
      "                           │                                   ",
      "|q1⟩ ──[ H ]──[ Rz(2x₂) ]──┼───■──────[ Rz(2(π-x₂)(π-x₃)) ]── M ",
      "                           │   │                               ",
      "|q2⟩ ──[ H ]──[ Rz(2x₃) ]──X───┼──────[ Rz(2(π-x₃)(π-x₄)) ]── M ",
      "                               │                               ",
      "|q3⟩ ──[ H ]──[ Rz(2x₄) ]──────X───────────────────────────── M "
    ]
  },
  qnn: {
    type: "Variational Quantum Circuit (RealAmplitudes)",
    qubits: 4,
    reps: 3,
    entanglement: "full",
    layers: [
      { name: "Feature Encoding", symbol: "Ry", target: "Data Features [q0..q3]" },
      { name: "Parameterized Rotations", symbol: "Ry(θ)", target: "16 Trainable Weights" },
      { name: "All-to-All Entanglement", symbol: "CX", target: "Full Quantum Correlations" },
      { name: "Parity Expectation Z", symbol: "⟨Z⟩", target: "Class Probability Output" }
    ],
    ascii_diagram: [
      "|q0⟩ ──[ Ry(x₁) ]──[ Ry(θ₁) ]──■────■────■──[ Ry(θ₅) ]── ⟨Z₀⟩",
      "                               │    │    │                   ",
      "|q1⟩ ──[ Ry(x₂) ]──[ Ry(θ₂) ]──X────┼────┼──[ Ry(θ₆) ]── ⟨Z₁⟩",
      "                                    │    │                   ",
      "|q2⟩ ──[ Ry(x₃) ]──[ Ry(θ₃) ]───────X────┼──[ Ry(θ₇) ]── ⟨Z₂⟩",
      "                                         │                   ",
      "|q3⟩ ──[ Ry(x₄) ]──[ Ry(θ₄) ]────────────X──[ Ry(θ₈) ]── ⟨Z₃⟩"
    ]
  },
  qvc: {
    type: "Noise-Robust Variational Circuit (EfficientSU2)",
    qubits: 4,
    reps: 2,
    entanglement: "full",
    layers: [
      { name: "Single-Qubit Rotations", symbol: "Ry/Rz", target: "SU(2) Single-Qubit Gates" },
      { name: "Entangling CX Block", symbol: "CX", target: "Full Entanglement" },
      { name: "Measurement", symbol: "M", target: "Bitstring Counts (1024 Shots)" }
    ],
    ascii_diagram: [
      "|q0⟩ ──[ Rz(θ₁) ]──[ Ry(θ₂) ]──■────────────────────────────── M ",
      "                               │                                 ",
      "|q1⟩ ──[ Rz(θ₃) ]──[ Ry(θ₄) ]──X──■─────────────────────────── M ",
      "                                  │                              ",
      "|q2⟩ ──[ Rz(θ₅) ]──[ Ry(θ₆) ]─────X──■──────────────────────── M ",
      "                                     │                           ",
      "|q3⟩ ──[ Rz(θ₇) ]──[ Ry(θ₈) ]────────X──────────────────────── M "
    ]
  }
};
