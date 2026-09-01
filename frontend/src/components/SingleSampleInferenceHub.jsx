import React, { useState, useEffect } from 'react';
import { User, Activity, AlertTriangle, CheckCircle, ShieldAlert, Printer, Sparkles } from 'lucide-react';

export default function SingleSampleInferenceHub({
  activeDataset,
  datasetsList,
  featureNames,
  samplePreviewRow,
  onRunPredict,
  predictions,
  clinicianSummary
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (featureNames && featureNames.length > 0) {
      const initial = {};
      featureNames.forEach(feat => {
        initial[feat] = samplePreviewRow && samplePreviewRow[feat] !== undefined ? samplePreviewRow[feat] : 0;
      });
      setFormData(initial);
    }
  }, [featureNames, samplePreviewRow]);

  const activeDsObj = datasetsList.find(d => d.id === activeDataset);
  const activeDisplayName = activeDsObj ? activeDsObj.name : activeDataset;

  const handleInputChange = (feat, val) => {
    setFormData(prev => ({
      ...prev,
      [feat]: parseFloat(val) || 0
    }));
  };

  const handleLoadPatientProfile = (profileType) => {
    let presetValues = {};

    if (activeDataset === 'heart.csv') {
      if (profileType === 'healthy') {
        presetValues = { age: 42, sex: 0, cp: 0, trestbps: 118, chol: 185, fbs: 0, restecg: 0, thalach: 172, exang: 0, oldpeak: 0.0, slope: 2, ca: 0, thal: 2 };
      } else if (profileType === 'borderline') {
        presetValues = { age: 54, sex: 1, cp: 1, trestbps: 138, chol: 240, fbs: 0, restecg: 1, thalach: 145, exang: 0, oldpeak: 1.2, slope: 1, ca: 1, thal: 2 };
      } else {
        presetValues = { age: 64, sex: 1, cp: 3, trestbps: 165, chol: 295, fbs: 1, restecg: 1, thalach: 105, exang: 1, oldpeak: 2.8, slope: 0, ca: 2, thal: 3 };
      }
    } else if (activeDataset === 'diabetes.csv') {
      if (profileType === 'healthy') {
        presetValues = { Pregnancies: 1, Glucose: 85, BloodPressure: 66, SkinThickness: 20, Insulin: 79, BMI: 22.5, DiabetesPedigreeFunction: 0.167, Age: 24 };
      } else if (profileType === 'borderline') {
        presetValues = { Pregnancies: 3, Glucose: 125, BloodPressure: 78, SkinThickness: 28, Insulin: 110, BMI: 29.2, DiabetesPedigreeFunction: 0.450, Age: 41 };
      } else {
        presetValues = { Pregnancies: 8, Glucose: 178, BloodPressure: 90, SkinThickness: 36, Insulin: 185, BMI: 38.5, DiabetesPedigreeFunction: 0.850, Age: 54 };
      }
    } else {
      featureNames.forEach(f => {
        presetValues[f] = profileType === 'healthy' ? 10 : profileType === 'borderline' ? 45 : 85;
      });
    }

    setFormData(presetValues);
    onRunPredict(presetValues);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRunPredict(formData);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Calculate hybrid risk percentage
  const hybridProb = predictions && predictions['Hybrid Fusion'] ? predictions['Hybrid Fusion'].probability : null;
  const riskPct = hybridProb !== null ? (hybridProb * 100).toFixed(1) : 0;
  
  const riskTier = riskPct === 0 ? null :
                   riskPct >= 66 ? { label: 'High Pathology Risk', color: '#ef4444', badgeClass: 'badge-positive' } :
                   riskPct >= 36 ? { label: 'Moderate Risk (Monitoring Required)', color: '#f59e0b', badgeClass: 'val-badge running' } :
                   { label: 'Low Disease Risk (Healthy)', color: '#10b981', badgeClass: 'badge-negative' };

  return (
    <section className="hub-section active">
      <div className="section-header">
        <div>
          <h1>Live Patient Risk Predictor & Inference</h1>
          <p className="subtitle">Select or enter a patient clinical profile for real-time 3-way risk evaluation across Classical, Quantum, and Hybrid models.</p>
        </div>
        {predictions && (
          <button className="btn btn-sm btn-outline" onClick={handlePrintReport}>
            <Printer size={14} /> Export Medical Report
          </button>
        )}
      </div>

      {/* Patient Profile Quick-Load Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div
          className="card dataset-card-item"
          style={{ cursor: 'pointer', borderLeft: '4px solid #10b981' }}
          onClick={() => handleLoadPatientProfile('healthy')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '10px', color: '#10b981' }}>
              <User size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Patient #101</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Healthy Baseline (Low Risk)</div>
            </div>
          </div>
        </div>

        <div
          className="card dataset-card-item"
          style={{ cursor: 'pointer', borderLeft: '4px solid #f59e0b' }}
          onClick={() => handleLoadPatientProfile('borderline')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '10px', color: '#f59e0b' }}>
              <User size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Patient #204</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Borderline Case (Moderate Risk)</div>
            </div>
          </div>
        </div>

        <div
          className="card dataset-card-item"
          style={{ cursor: 'pointer', borderLeft: '4px solid #ef4444' }}
          onClick={() => handleLoadPatientProfile('highrisk')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '10px', borderRadius: '10px', color: '#ef4444' }}>
              <User size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Patient #309</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Acute Pathology (High Risk)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Form Inputs */}
        <div className="card">
          <h3>Patient Clinical Feature Inputs</h3>
          <p className="form-subtext">Active Dataset: {activeDisplayName}</p>
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: '15px' }}>
            {featureNames.map(feat => (
              <div key={feat} className="form-group">
                <label>{feat}</label>
                <input
                  type="number"
                  step="any"
                  value={formData[feat] !== undefined ? formData[feat] : ''}
                  onChange={(e) => handleInputChange(feat, e.target.value)}
                />
              </div>
            ))}
            <button type="submit" className="btn btn-primary full-width" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
              <Activity size={16} /> Run Patient Risk Inference
            </button>
          </form>
        </div>

        {/* Inference Results & Visual Radial Risk Gauge */}
        <div>
          {/* Radial Risk Meter & 3-Way Cards */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Diagnostic Risk Meter</h3>
              {riskTier && (
                <span className={`pred-badge ${riskTier.badgeClass}`} style={{ margin: 0 }}>
                  {riskTier.label}
                </span>
              )}
            </div>

            {hybridProb !== null ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
                {/* SVG Radial Gauge */}
                <div style={{ position: 'relative', width: '160px', height: '90px', overflow: 'hidden' }}>
                  <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%' }}>
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke={riskTier.color}
                      strokeWidth="10"
                      strokeDasharray="126"
                      strokeDashoffset={126 - (126 * riskPct) / 100}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, color: riskTier.color }}>
                    {riskPct}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="pred-placeholder" style={{ margin: '20px 0' }}>
                Select a patient profile above or click "Run Patient Risk Inference".
              </div>
            )}

            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>3-Way Model Consensus</h4>
            <div className="pred-cards-grid">
              {!predictions || Object.keys(predictions).length === 0 ? (
                <div className="pred-placeholder">Select patient sample to compute consensus.</div>
              ) : (
                Object.entries(predictions).map(([modelName, pdict]) => {
                  const isPositive = pdict.label === 1;
                  const isHybrid = modelName.includes('Hybrid');
                  return (
                    <div key={modelName} className={`pred-card ${isHybrid ? 'highlight' : ''}`}>
                      <div className="pred-title">{modelName}</div>
                      <div className={`pred-badge ${isPositive ? 'badge-positive' : 'badge-negative'}`}>
                        {isPositive ? 'High Risk (1)' : 'Healthy (0)'}
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                        Risk: <strong>{(pdict.probability * 100).toFixed(1)}%</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clinician Executive Report */}
          <div className="card">
            <h3>Clinician Executive Diagnostic Report</h3>
            <div className="report-box" style={{ marginTop: '12px' }}>
              {clinicianSummary ? (
                <span dangerouslySetInnerHTML={{ 
                  __html: clinicianSummary
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>') 
                }} />
              ) : (
                'Diagnostic executive summary report will generate here after inference.'
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
