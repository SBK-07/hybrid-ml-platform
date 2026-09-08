import sys, os
sys.path.insert(0, 'backend')
from app.main import predict_patient, PredictionRequest, get_patient_presets

presets = get_patient_presets()['presets']

for p in presets:
    pid = p['id']
    name = p['name']
    feat = p.get('cancer_features')
    req = PredictionRequest(dataset_key='cancer', features=feat)
    res = predict_patient(req)
    print('=== ' + pid + ': ' + name + ' ===')
    print('  Expected:', p.get('advanced_info', {}).get('risk_score_expected'))
    for m, d in res['predictions'].items():
        print('  ' + str(m) + ': prob=' + str(d.get('probability')) + ', label=' + str(d.get('label')))
