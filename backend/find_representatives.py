import sys, os, joblib, numpy as np, pandas as pd
sys.path.insert(0, 'backend')

scaler = joblib.load('backend/data/processed/cancer/classical/scaler.joblib')
svm = joblib.load('backend/models/cancer/classical_svm_full_svm.joblib')
mlp = joblib.load('backend/models/cancer/classical_mlp_model.joblib')

raw_cancer = 'backend/data/raw/cancer/breast_cancer_wisconsin_diagnostic.csv'
df = pd.read_csv(raw_cancer)
feats = [c for c in df.columns if c != 'target']
X = df[feats].values
y = df['target'].values
from sklearn.model_selection import train_test_split
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
X_tr_s = scaler.transform(X_tr)

svm_probs = svm.predict_proba(X_tr_s)[:, 1]
mlp_probs = mlp.predict_proba(X_tr_s)[:, 1]

# Find representative samples:
# 1. Healthy: prob < 0.05
# 2. Borderline: 0.45 <= prob <= 0.55
# 3. Young Atypical: 0.60 <= prob <= 0.72
# 4. Elderly Comorbid: 0.75 <= prob <= 0.85
# 5. Critical High Risk: prob > 0.95

h_idx = np.where(svm_probs < 0.01)[0][0]
b_idx = np.where((svm_probs >= 0.45) & (svm_probs <= 0.55))[0][0]
ya_idx = np.where((svm_probs >= 0.60) & (svm_probs <= 0.72))[0][0]
ec_idx = np.where((svm_probs >= 0.75) & (svm_probs <= 0.88))[0][0]
hr_idx = np.where(svm_probs > 0.99)[0][0]

indices = [('healthy', h_idx), ('borderline', b_idx), ('young_atypical', ya_idx), ('elderly_comorbid', ec_idx), ('high_risk', hr_idx)]

for label, idx in indices:
    s_prob = svm_probs[idx]
    m_prob = mlp_probs[idx]
    print(label, f'idx={idx}: svm={s_prob:.4f}, mlp={m_prob:.4f}, avg={(s_prob+m_prob)/2:.4f}, y={y_tr[idx]}')
