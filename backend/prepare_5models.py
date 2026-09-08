import os, json, joblib, numpy as np, pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from scipy.optimize import minimize
from qiskit.circuit.library import zz_feature_map, real_amplitudes, efficient_su2
from qiskit.quantum_info import Statevector

print('=== 1. PREPARING CANCER PREPROCESSORS & 5 MODELS ===')
raw_cancer = 'backend/data/raw/cancer/breast_cancer_wisconsin_diagnostic.csv'
df_c = pd.read_csv(raw_cancer)
feat_c = [c for c in df_c.columns if c != 'target']
X_c = df_c[feat_c].values
y_c = df_c['target'].values
X_tr_c, X_te_c, y_tr_c, y_te_c = train_test_split(X_c, y_c, test_size=0.2, random_state=42, stratify=y_c)

# Scaler
scaler_c = StandardScaler()
X_tr_c_scaled = scaler_c.fit_transform(X_tr_c)
joblib.dump(scaler_c, 'backend/data/processed/cancer/classical/scaler.joblib')

# PCA & Angle Scaler
pca_c = PCA(n_components=4, random_state=42)
X_tr_c_pca = pca_c.fit_transform(X_tr_c_scaled)
joblib.dump(pca_c, 'backend/data/processed/cancer/quantum/pca_model.joblib')

angle_scaler_c = MinMaxScaler(feature_range=(0, np.pi))
X_tr_c_q = angle_scaler_c.fit_transform(X_tr_c_pca)
joblib.dump(angle_scaler_c, 'backend/data/processed/cancer/quantum/angle_scaler.joblib')

# Model 1: Classical SVM (RBF)
if not os.path.exists('backend/models/cancer/classical_svm_full_svm.joblib'):
    svm_c = SVC(kernel='rbf', probability=True, random_state=42)
    svm_c.fit(X_tr_c_scaled, y_tr_c)
    joblib.dump(svm_c, 'backend/models/cancer/classical_svm_full_svm.joblib')

# Model 2: Classical MLP
mlp_c = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=600, random_state=42, alpha=0.001)
mlp_c.fit(X_tr_c_scaled, y_tr_c)
joblib.dump(mlp_c, 'backend/models/cancer/classical_mlp_model.joblib')

# Model 3: Quantum QSVM
n_sub_c = 100
X_sub_c = X_tr_c_q[:n_sub_c]
y_sub_c = y_tr_c[:n_sub_c]
fm = zz_feature_map(feature_dimension=4, reps=2, entanglement='linear')
svs_c = np.array([Statevector.from_instruction(fm.assign_parameters(x)).data for x in X_sub_c])
K_tr_c = np.abs(svs_c @ svs_c.conj().T) ** 2
qsvm_c = SVC(kernel='precomputed', probability=True, random_state=42)
qsvm_c.fit(K_tr_c, y_sub_c)
joblib.dump({'qsvm_clf': qsvm_c, 'X_train_quantum': X_sub_c}, 'backend/models/cancer/qsvm_zz_model.joblib')

# Model 4 & 5: QNN and QVC Variational Parameters
ansatz_qnn = real_amplitudes(num_qubits=4, reps=3)
qnn_c = fm.compose(ansatz_qnn)
def loss_qnn_c(theta):
    preds = []
    for x in X_sub_c[:30]:
        qc = qnn_c.assign_parameters(np.concatenate([x, theta]))
        sv = Statevector.from_instruction(qc)
        p_odd = sum(sv.probabilities()[i] for i in range(16) if bin(i).count('1') % 2 == 1)
        preds.append(p_odd)
    preds = np.clip(np.array(preds), 1e-4, 1 - 1e-4)
    return -np.mean(y_sub_c[:30] * np.log(preds) + (1 - y_sub_c[:30]) * np.log(1 - preds))

res_qnn = minimize(loss_qnn_c, np.random.RandomState(42).normal(0, 0.5, 16), method='COBYLA', options={'maxiter': 35})
joblib.dump({'theta': res_qnn.x, 'num_qubits': 4, 'reps': 3}, 'backend/models/cancer/qnn_weights.joblib')

ansatz_qvc = efficient_su2(num_qubits=4, reps=2)
qvc_c = fm.compose(ansatz_qvc)
def loss_qvc_c(theta):
    preds = []
    for x in X_sub_c[:30]:
        qc = qvc_c.assign_parameters(np.concatenate([x, theta]))
        sv = Statevector.from_instruction(qc)
        p_odd = sum(sv.probabilities()[i] for i in range(16) if bin(i).count('1') % 2 == 1)
        preds.append(p_odd)
    preds = np.clip(np.array(preds), 1e-4, 1 - 1e-4)
    return -np.mean(y_sub_c[:30] * np.log(preds) + (1 - y_sub_c[:30]) * np.log(1 - preds))

res_qvc = minimize(loss_qvc_c, np.random.RandomState(42).normal(0, 0.5, 24), method='COBYLA', options={'maxiter': 35})
joblib.dump({'theta': res_qvc.x, 'num_qubits': 4, 'reps': 2}, 'backend/models/cancer/qvc_weights.joblib')

print('Cancer 5 models generated and persisted successfully.')

print('=== 2. PREPARING CARDIOVASCULAR PREPROCESSORS & 5 MODELS ===')
raw_cardio = 'backend/data/raw/cardiovascular/uci_heart_disease.csv'
df_h = pd.read_csv(raw_cardio)
feat_h = [c for c in df_h.columns if c != 'target']
for col in feat_h:
    if df_h[col].isnull().any():
        df_h[col].fillna(df_h[col].median(), inplace=True)
X_h = df_h[feat_h].values
y_h = df_h['target'].values
X_tr_h, X_te_h, y_tr_h, y_te_h = train_test_split(X_h, y_h, test_size=0.2, random_state=42, stratify=y_h)

scaler_h = StandardScaler()
X_tr_h_scaled = scaler_h.fit_transform(X_tr_h)
joblib.dump(scaler_h, 'backend/data/processed/cardiovascular/classical/scaler.joblib')

pca_h = PCA(n_components=4, random_state=42)
X_tr_h_pca = pca_h.fit_transform(X_tr_h_scaled)
joblib.dump(pca_h, 'backend/data/processed/cardiovascular/quantum/pca_model.joblib')

angle_scaler_h = MinMaxScaler(feature_range=(0, np.pi))
X_tr_h_q = angle_scaler_h.fit_transform(X_tr_h_pca)
joblib.dump(angle_scaler_h, 'backend/data/processed/cardiovascular/quantum/angle_scaler.joblib')

svm_h = SVC(kernel='rbf', probability=True, class_weight='balanced', random_state=42)
svm_h.fit(X_tr_h_scaled, y_tr_h)
joblib.dump(svm_h, 'backend/models/cardiovascular/classical_svm_full_svm.joblib')

mlp_h = MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=600, random_state=42, alpha=0.001)
mlp_h.fit(X_tr_h_scaled, y_tr_h)
joblib.dump(mlp_h, 'backend/models/cardiovascular/classical_mlp_model.joblib')

idx_0 = np.where(y_tr_h == 0)[0][:25]
idx_1 = np.where(y_tr_h == 1)[0][:25]
sub_indices = np.concatenate([idx_0, idx_1])
np.random.RandomState(42).shuffle(sub_indices)
X_sub_h = X_tr_h_q[sub_indices]
y_sub_h = y_tr_h[sub_indices]

svs_h = np.array([Statevector.from_instruction(fm.assign_parameters(x)).data for x in X_sub_h])
K_tr_h = np.abs(svs_h @ svs_h.conj().T) ** 2
qsvm_h = SVC(kernel='precomputed', probability=True, random_state=42)
qsvm_h.fit(K_tr_h, y_sub_h)
joblib.dump({'qsvm_clf': qsvm_h, 'X_train_quantum': X_sub_h}, 'backend/models/cardiovascular/qsvm_zz_model.joblib')

def loss_qnn_h(theta):
    preds = []
    for x in X_sub_h[:24]:
        qc = qnn_c.assign_parameters(np.concatenate([x, theta]))
        sv = Statevector.from_instruction(qc)
        p_odd = sum(sv.probabilities()[i] for i in range(16) if bin(i).count('1') % 2 == 1)
        preds.append(p_odd)
    preds = np.clip(np.array(preds), 1e-4, 1 - 1e-4)
    return -np.mean(y_sub_h[:24] * np.log(preds) + (1 - y_sub_h[:24]) * np.log(1 - preds))

res_qnn_h = minimize(loss_qnn_h, np.random.RandomState(42).normal(0, 0.5, 16), method='COBYLA', options={'maxiter': 30})
joblib.dump({'theta': res_qnn_h.x, 'num_qubits': 4, 'reps': 3}, 'backend/models/cardiovascular/qnn_weights.joblib')

def loss_qvc_h(theta):
    preds = []
    for x in X_sub_h[:24]:
        qc = qvc_c.assign_parameters(np.concatenate([x, theta]))
        sv = Statevector.from_instruction(qc)
        p_odd = sum(sv.probabilities()[i] for i in range(16) if bin(i).count('1') % 2 == 1)
        preds.append(p_odd)
    preds = np.clip(np.array(preds), 1e-4, 1 - 1e-4)
    return -np.mean(y_sub_h[:24] * np.log(preds) + (1 - y_sub_h[:24]) * np.log(1 - preds))

res_qvc_h = minimize(loss_qvc_h, np.random.RandomState(42).normal(0, 0.5, 24), method='COBYLA', options={'maxiter': 30})
joblib.dump({'theta': res_qvc_h.x, 'num_qubits': 4, 'reps': 2}, 'backend/models/cardiovascular/qvc_weights.joblib')

print('Cardiovascular 5 models generated and persisted successfully.')
