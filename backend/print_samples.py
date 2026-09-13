import sys, os, joblib, numpy as np, pandas as pd
raw_cancer = 'backend/data/raw/cancer/breast_cancer_wisconsin_diagnostic.csv'
df_c = pd.read_csv(raw_cancer)
feat_c = [c for c in df_c.columns if c != 'target']
from sklearn.model_selection import train_test_split
X_c = df_c[feat_c].values
y_c = df_c['target'].values
X_tr_raw, X_te_raw, y_tr, y_te = train_test_split(X_c, y_c, test_size=0.2, random_state=42, stratify=y_c)

import pprint
print('Sample 8:')
pprint.pprint({feat_c[i]: round(float(X_tr_raw[8, i]), 5) for i in range(len(feat_c))})

print('Sample 56:')
pprint.pprint({feat_c[i]: round(float(X_tr_raw[56, i]), 5) for i in range(len(feat_c))})
