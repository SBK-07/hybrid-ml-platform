import sys, os
sys.path.insert(0, 'backend')
from app.main import get_patient_presets
res = get_patient_presets()
print(type(res), len(res) if isinstance(res, list) else res.keys())
