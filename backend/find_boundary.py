import sys, os, joblib, numpy as np, pandas as pd
sys.path.insert(0, 'backend')

scaler = joblib.load('backend/data/processed/cancer/classical/scaler.joblib')
svm = joblib.load('backend/models/cancer/classical_svm_full_svm.joblib')
X_train = np.load('backend/data/processed/cancer/classical/X_train.npy')
y_train = np.load('backend/data/processed/cancer/classical/y_train.npy')

probs = svm.predict_proba(X_train)[:, 1]

boundary_indices = np.where((probs >= 0.35) & (probs <= 0.65))[0]
print('Found boundary samples:', len(boundary_indices))
for idx in boundary_indices[:5]:
    print('  idx:', idx, 'prob:', round(probs[idx], 4), 'y:', y_train[idx])

raw_cancer = 'backend/data/raw/cancer/breast_cancer_wisconsin_diagnostic.csv'
df_c = pd.read_csv(raw_cancer)
feat_c = [c for c in df_c.columns if c != 'target']
from sklearn.model_selection import train_test_split
X_c = df_c[feat_c].values
y_c = df_c['target'].values
X_tr_raw, X_te_raw, y_tr, y_te = train_test_split(X_c, y_c, test_size=0.2, random_state=42, stratify=y_c)

if len(boundary_indices) > 0:
    best_boundary_idx = boundary_indices[np.argmin(np.abs(probs[boundary_indices] - 0.50))]
    print('Best boundary sample idx:', best_boundary_idx, 'prob:', round(probs[best_boundary_idx], 4))
    sample_feat = {feat_c[i]: round(float(X_tr_raw[best_boundary_idx, i]), 5) for i in range(len(feat_c))}
    print('Feature dict:')
    import pprint
    pprint.pprint(sample_feat)
