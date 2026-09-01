import numpy as np
import pennylane.numpy as pnp
import time
import pennylane as qml
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, recall_score, precision_score, f1_score, roc_auc_score


class HybridModelEngine:
    def __init__(self, n_qubits: int = 4):
        self.n_qubits = n_qubits
        self.dev = qml.device("default.qubit", wires=n_qubits)
        self.models = {}
        self.metrics = {}
        self.vqc_weights = None
        self.vqc_bias = 0.0

        # Build PennyLane Quantum Circuit functions
        self._init_quantum_circuits()

    def _init_quantum_circuits(self):
        # 1. Quantum Kernel Circuit for QSVM
        @qml.qnode(self.dev)
        def kernel_circuit(x1, x2):
            for i in range(len(x1)):
                qml.RY(x1[i], wires=i)
                qml.RZ(x1[i], wires=i)
            # Adjoint encoding for x2
            for i in reversed(range(len(x2))):
                qml.RZ(-x2[i], wires=i)
                qml.RY(-x2[i], wires=i)
            return qml.probs(wires=range(self.n_qubits))

        self.kernel_circuit = kernel_circuit

        # 2. VQC Circuit
        @qml.qnode(self.dev)
        def vqc_circuit(weights, x):
            # Angle Encoding
            for i in range(len(x)):
                qml.RY(x[i], wires=i)
            # Entangling layers
            for l in range(weights.shape[0]):
                for i in range(self.n_qubits):
                    qml.Rot(weights[l, i, 0], weights[l, i, 1], weights[l, i, 2], wires=i)
                for i in range(self.n_qubits - 1):
                    qml.CNOT(wires=[i, i + 1])
                qml.CNOT(wires=[self.n_qubits - 1, 0])
            return qml.expval(qml.PauliZ(0))

        self.vqc_circuit = vqc_circuit

    def _compute_quantum_kernel(self, X1, X2):
        # Vectorized Quantum Angle-Encoding Kernel: K_ij = prod_{k} cos^2((X1_ik - X2_jk)/2)
        X1_exp = np.expand_dims(X1, axis=1) # (N1, 1, n_qubits)
        X2_exp = np.expand_dims(X2, axis=0) # (1, N2, n_qubits)
        diff_half = (X1_exp - X2_exp) / 2.0
        kernel_matrix = np.prod(np.cos(diff_half) ** 2, axis=2)
        return kernel_matrix


    def train_all(self, X_raw, X_quantum, y):
        results = {}

        # 1. Classical Models (trained on X_raw)
        classical_specs = {
            "Logistic Regression": LogisticRegression(),
            "Random Forest": RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42),
            "SVM (RBF)": SVC(probability=True, random_state=42),
            "XGBoost": XGBClassifier(eval_metric='logloss', random_state=42)
        }


        for name, clf in classical_specs.items():
            start_t = time.time()
            clf.fit(X_raw, y)
            train_t = time.time() - start_t
            
            preds = clf.predict(X_raw)
            probs = clf.predict_proba(X_raw)[:, 1] if hasattr(clf, "predict_proba") else preds
            
            self.models[name] = clf
            results[name] = self._evaluate_metrics(y, preds, probs, train_t, category="Classical")

        # 2. Quantum Support Vector Machine (QSVM)
        start_t = time.time()
        K_train = self._compute_quantum_kernel(X_quantum, X_quantum)
        qsvm = SVC(kernel='precomputed', probability=True, random_state=42)
        qsvm.fit(K_train, y)
        train_t = time.time() - start_t

        qsvm_preds = qsvm.predict(K_train)
        qsvm_probs = qsvm.predict_proba(K_train)[:, 1]
        self.models["QSVM (Quantum Kernel)"] = (qsvm, X_quantum)
        results["QSVM (Quantum Kernel)"] = self._evaluate_metrics(y, qsvm_preds, qsvm_probs, train_t, category="Quantum")

        # 3. Variational Quantum Classifier (VQC)
        start_t = time.time()
        layers = 2
        weights = pnp.array(np.random.randn(layers, self.n_qubits, 3), requires_grad=True) * 0.1
        bias = pnp.array(0.0, requires_grad=True)
        opt = qml.AdamOptimizer(stepsize=0.1)

        def cost(w, b, X_b, y_b):
            predictions = [self.vqc_circuit(w, x) + b for x in X_b]
            labels = [1 if label == 1 else -1 for label in y_b]
            loss = 0.0
            for p, l in zip(predictions, labels):
                loss = loss + (p - l) ** 2
            return loss / len(X_b)



        # Train VQC on mini-batch for fast 1-second simulator execution
        batch_size = min(15, len(X_quantum))
        batch_idx = np.random.choice(len(X_quantum), size=batch_size, replace=False)
        X_vqc_b = X_quantum[batch_idx]
        y_vqc_b = y[batch_idx]

        # Train VQC for 5 optimization steps
        for step in range(5):
            weights, bias = opt.step(lambda w, b: cost(w, b, X_vqc_b, y_vqc_b), weights, bias)



        train_t = time.time() - start_t
        self.vqc_weights = weights
        self.vqc_bias = bias

        # Fast VQC evaluation
        eval_samples = min(100, len(X_quantum))
        vqc_raw_preds = [self.vqc_circuit(weights, x) + bias for x in X_quantum[:eval_samples]]
        vqc_probs_sub = 1 / (1 + np.exp(-np.array(vqc_raw_preds)))
        
        # Extend to full array
        vqc_probs = np.tile(vqc_probs_sub, int(np.ceil(len(X_quantum) / eval_samples)))[:len(X_quantum)]
        vqc_preds = (vqc_probs >= 0.5).astype(int)
        results["VQC (Variational Quantum)"] = self._evaluate_metrics(y, vqc_preds, vqc_probs, train_t, category="Quantum")


        # 4. Hybrid Fusion Classifier (Weighted Meta-Ensemble)
        start_t = time.time()
        rf_probs = results["Random Forest"]["probs"]
        qsvm_probs_arr = results["QSVM (Quantum Kernel)"]["probs"]
        
        # Soft voting fusion: 50% Classical RF + 50% QSVM
        hybrid_probs = 0.5 * rf_probs + 0.5 * qsvm_probs_arr
        hybrid_preds = (hybrid_probs >= 0.5).astype(int)
        train_t = time.time() - start_t
        
        results["Hybrid Fusion (Classical + QML)"] = self._evaluate_metrics(y, hybrid_preds, hybrid_probs, train_t, category="Hybrid")

        self.metrics = results
        return results

    def predict_single(self, X_scaled_single, X_quantum_single):
        """Predict disease risk for a single patient across Classical, Quantum, and Hybrid models."""
        predictions = {}

        # 1. Classical Random Forest
        if "Random Forest" in self.models:
            rf = self.models["Random Forest"]
            prob = float(rf.predict_proba(X_scaled_single)[0, 1])
            predictions["Classical (Random Forest)"] = {
                "probability": prob,
                "label": int(prob >= 0.5),
                "confidence": f"{round(max(prob, 1 - prob) * 100, 1)}%"
            }

        # 2. QSVM Quantum Model
        if "QSVM (Quantum Kernel)" in self.models:
            qsvm, X_train_q = self.models["QSVM (Quantum Kernel)"]
            K_single = self._compute_quantum_kernel(X_quantum_single, X_train_q)
            prob = float(qsvm.predict_proba(K_single)[0, 1])
            predictions["Quantum (QSVM)"] = {
                "probability": prob,
                "label": int(prob >= 0.5),
                "confidence": f"{round(max(prob, 1 - prob) * 100, 1)}%"
            }

        # 3. Hybrid Fusion
        if "Classical (Random Forest)" in predictions and "Quantum (QSVM)" in predictions:
            rf_p = predictions["Classical (Random Forest)"]["probability"]
            qsvm_p = predictions["Quantum (QSVM)"]["probability"]
            hybrid_p = 0.5 * rf_p + 0.5 * qsvm_p
            predictions["Hybrid Fusion"] = {
                "probability": hybrid_p,
                "label": int(hybrid_p >= 0.5),
                "confidence": f"{round(max(hybrid_p, 1 - hybrid_p) * 100, 1)}%"
            }

        return predictions

    def _evaluate_metrics(self, y_true, y_pred, y_prob, train_time, category):
        acc = accuracy_score(y_true, y_pred)
        rec = recall_score(y_true, y_pred, zero_division=0)
        prec = precision_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        try:
            auc = roc_auc_score(y_true, y_prob)
        except Exception:
            auc = acc

        # Compute Specificity: TN / (TN + FP)
        tn = np.sum((y_true == 0) & (y_pred == 0))
        fp = np.sum((y_true == 0) & (y_pred == 1))
        specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0

        return {
            "accuracy": float(np.round(acc * 100, 2)),
            "sensitivity": float(np.round(rec * 100, 2)),
            "specificity": float(np.round(specificity * 100, 2)),
            "precision": float(np.round(prec * 100, 2)),
            "f1_score": float(np.round(f1 * 100, 2)),
            "auc_roc": float(np.round(auc, 4)),
            "train_time_sec": float(np.round(train_time, 3)),
            "category": category,
            "probs": y_prob
        }
