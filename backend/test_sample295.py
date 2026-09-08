import sys, os, joblib, numpy as np
sys.path.insert(0, 'backend')
from app.main import predict_patient, PredictionRequest

sample_feat = {'area error': 23.11,
 'compactness error': 0.04653,
 'concave points error': 0.01162,
 'concavity error': 0.03829,
 'fractal dimension error': 0.00611,
 'mean area': 656.4,
 'mean compactness': 0.123,
 'mean concave points': 0.0389,
 'mean concavity': 0.1009,
 'mean fractal dimension': 0.06341,
 'mean perimeter': 95.81,
 'mean radius': 14.47,
 'mean smoothness': 0.08837,
 'mean symmetry': 0.1872,
 'mean texture': 24.99,
 'perimeter error': 2.615,
 'radius error': 0.2542,
 'smoothness error': 0.00714,
 'symmetry error': 0.02068,
 'texture error': 1.079,
 'worst area': 808.9,
 'worst compactness': 0.4202,
 'worst concave points': 0.1205,
 'worst concavity': 0.404,
 'worst fractal dimension': 0.1023,
 'worst perimeter': 113.5,
 'worst radius': 16.22,
 'worst smoothness': 0.134,
 'worst symmetry': 0.3187,
 'worst texture': 31.73}

req = PredictionRequest(dataset_key='cancer', features=sample_feat)
res = predict_patient(req)
for m, d in res['predictions'].items():
    print(m, ':', d['probability'], d['label'])
