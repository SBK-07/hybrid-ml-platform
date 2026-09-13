import sys, os, joblib, numpy as np, pandas as pd
sys.path.insert(0, 'backend')
from app.main import predict_patient, PredictionRequest, get_patient_presets

presets = get_patient_presets()['presets']

for p in presets:
    pid = p['id']
    name = p['name']
    feat = p.get('cardio_features')
    req = PredictionRequest(dataset_key='cardiovascular', features=feat)
    res = predict_patient(req)
    print('=== ' + pid + ': ' + name + ' ===')
    for m, d in res['predictions'].items():
        print('  ' + str(m) + ': prob=' + str(d.get('probability')) + ', label=' + str(d.get('label')))
