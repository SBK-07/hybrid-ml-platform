import React, { useState, useEffect } from 'react';
import { predictPatient } from '../services/api';

const cancerDefaultFeatures = {
  "mean radius": 17.99,
  "mean texture": 10.38,
  "mean perimeter": 122.8,
  "mean area": 1001.0,
  "mean smoothness": 0.1184,
  "mean compactness": 0.2776,
  "mean concavity": 0.3001,
  "mean concave points": 0.1471,
  "mean symmetry": 0.2419,
  "mean fractal dimension": 0.07871,
  "radius error": 1.095,
  "texture error": 0.9053,
  "perimeter error": 8.589,
  "area error": 153.4,
  "smoothness error": 0.006399,
  "compactness error": 0.04904,
  "concavity error": 0.05373,
  "concave points error": 0.01587,
  "symmetry error": 0.03003,
  "fractal dimension error": 0.006193,
  "worst radius": 25.38,
  "worst texture": 17.33,
  "worst perimeter": 184.6,
  "worst area": 2019.0,
  "worst smoothness": 0.1622,
  "worst compactness": 0.6656,
  "worst concavity": 0.7119,
  "worst concave points": 0.2654,
  "worst symmetry": 0.4601,
  "worst fractal dimension": 0.1189
};

const cardioDefaultFeatures = {
  "age": 63,
  "sex": 1,
  "cp": 3,
  "trestbps": 145,
  "chol": 233,
  "fbs": 1,
  "restecg": 0,
  "thalach": 150,
  "exang": 0,
  "oldpeak": 2.3,
  "slope": 0,
  "ca": 0,
  "thal": 1
};

export default function LiveInferenceSection({ activeDataset }) {
  const isCancer = activeDataset === 'cancer';
  const defaultFeatures = isCancer ? cancerDefaultFeatures : cardioDefaultFeatures;

  const [features, setFeatures] = useState(defaultFeatures);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  useEffect(() => {
    setFeatures(isCancer ? cancerDefaultFeatures : cardioDefaultFeatures);
    setPredictionResult(null);
  }, [activeDataset]);

  const handleInputChange = (featureName, value) => {
    setFeatures(prev => ({
      ...prev,
      [featureName]: parseFloat(value) || 0
    }));
  };

  const handleRunInference = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await predictPatient(activeDataset, features);
      setPredictionResult(res);
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setLoading(false);
    }
  };

  const predictions = predictionResult?.predictions;

  return (
    <div id="inference" className="section">
      <h2 className="section-title">🩺 Live Patient Risk Inference Calculator</h2>

      <div className="explainer">
        <div className="explainer-title">Real-Time Patient Diagnostic Engine</div>
        <p>
          Input clinical parameters below to compute live diagnostic predictions across <strong>Classical SVM</strong>, <strong>Quantum Kernel QSVM</strong>, and <strong>Hybrid Consensus Ensemble</strong> architectures:
        </p>
      </div>

      <div className="inference-grid">
        {/* Left Side: Input Form */}
        <div className="model-card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.2em', marginBottom: '15px' }}>
            Patient Parameters ({isCancer ? 'WDBC 30 Features' : 'UCI Heart 13 Features'})
          </h3>
          <form onSubmit={handleRunInference}>
            <div className="form-grid">
              {Object.keys(features).map((feat) => (
                <div className="form-group" key={feat}>
                  <label>{feat}</label>
                  <input
                    type="number"
                    step="any"
                    value={features[feat]}
                    onChange={(e) => handleInputChange(feat, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="btn-predict" disabled={loading}>
              {loading ? '⚛️ Computing Quantum Kernel Overlaps...' : '⚡ Run Diagnostic Risk Inference'}
            </button>
          </form>
        </div>

        {/* Right Side: Prediction Output Cards */}
        <div className="model-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.2em', marginBottom: '15px' }}>
            Diagnostic Consensus & Risk Tier
          </h3>

          {predictionResult ? (
            <div className="pred-results-container">
              {/* Classical Card */}
              <div className="pred-card">
                <div className="pred-card-header">
                  <div className="pred-title">1. Classical RBF SVM</div>
                  <span className={`risk-badge`} style={{ background: predictions?.classical_rbf_svm?.prediction === 1 ? '#E74C3C' : '#27AE60' }}>
                    {predictions?.classical_rbf_svm?.label}
                  </span>
                </div>
                <div>Risk Probability: <strong>{(predictions?.classical_rbf_svm?.probability * 100).toFixed(1)}%</strong></div>
                <div style={{ fontSize: '0.85rem', color: '#718096' }}>Confidence: {predictions?.classical_rbf_svm?.confidence_pct}%</div>
              </div>

              {/* Quantum Card */}
              <div className="pred-card">
                <div className="pred-card-header">
                  <div className="pred-title">2. Quantum Kernel QSVM</div>
                  <span className={`risk-badge`} style={{ background: predictions?.quantum_kernel_svm?.prediction === 1 ? '#E74C3C' : '#27AE60' }}>
                    {predictions?.quantum_kernel_svm?.label}
                  </span>
                </div>
                <div>Risk Probability: <strong>{(predictions?.quantum_kernel_svm?.probability * 100).toFixed(1)}%</strong></div>
                <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                  4 Qubits | {predictions?.quantum_kernel_svm?.feature_map || 'ZZFeatureMap'}
                </div>
              </div>

              {/* Hybrid Card */}
              <div className="pred-card highlight">
                <div className="pred-card-header">
                  <div className="pred-title">3. Hybrid Consensus Ensemble</div>
                  <span className={`risk-badge`} style={{ background: predictions?.hybrid_consensus_ensemble?.risk_color || '#E74C3C' }}>
                    {predictions?.hybrid_consensus_ensemble?.label}
                  </span>
                </div>
                <div>Consensus Risk Score: <strong style={{ fontSize: '1.2em' }}>{(predictions?.hybrid_consensus_ensemble?.probability * 100).toFixed(1)}%</strong></div>
                <div style={{ marginTop: '8px', fontSize: '0.9rem', fontWeight: 600, color: predictions?.hybrid_consensus_ensemble?.risk_color || '#E74C3C' }}>
                  {predictions?.hybrid_consensus_ensemble?.risk_tier}
                </div>
              </div>

              {/* Guidance Note */}
              <div className="explainer" style={{ background: '#f0fdf4', borderLeftColor: '#22c55e', margin: '10px 0 0 0', padding: '12px' }}>
                <div className="explainer-title" style={{ color: '#15803d', fontSize: '0.95rem' }}>💡 Clinical Guidance</div>
                <p style={{ fontSize: '0.85rem' }}>{predictionResult?.clinical_guidance?.recommendation}</p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a0aec0' }}>
              <div style={{ fontSize: '3em', marginBottom: '10px' }}>🩺</div>
              <p>Click <strong>"Run Diagnostic Risk Inference"</strong> to execute real-time quantum-classical model inference.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
