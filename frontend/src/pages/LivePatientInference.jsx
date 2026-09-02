import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { predictPatient } from '../services/api';
import CardActionMenu from '../components/CardActionMenu';

export default function LivePatientInference() {
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('healthy_screening');
  const [activeDataset, setActiveDataset] = useState('cancer');
  const [features, setFeatures] = useState({});
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [showAdvancedResults, setShowAdvancedResults] = useState(false);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/patient-presets');
      const data = await response.json();
      setPresets(data.presets || []);
      if (data.presets && data.presets.length > 0) {
        loadPresetFeatures(data.presets[0], activeDataset);
      }
    } catch (err) {
      console.error('Error loading patient presets:', err);
    }
  };

  const loadPresetFeatures = (preset, datasetKey) => {
    const featMap = datasetKey === 'cancer' ? preset.cancer_features : preset.cardio_features;
    setFeatures(featMap || {});
    setPredictionResult(null);
  };

  const handlePresetChange = (e) => {
    const presetId = e.target.value;
    setSelectedPresetId(presetId);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      loadPresetFeatures(preset, activeDataset);
    }
  };

  const handleDatasetChange = (e) => {
    const newDs = e.target.value;
    setActiveDataset(newDs);
    const preset = presets.find(p => p.id === selectedPresetId);
    if (preset) {
      loadPresetFeatures(preset, newDs);
    }
  };

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

  const selectedPreset = presets.find(p => p.id === selectedPresetId);
  const predictions = predictionResult?.predictions;

  return (
    <div className="section">
      <h2 className="section-title">🩺 Live Patient Risk Inference</h2>

      <div className="explainer">
        <div className="explainer-title">Patient Diagnostic Simulator</div>
        <p>
          Select from <strong>5 clinically curated patient profile categories</strong> from the dropdown to automatically load representative biomarkers.
          Inputs and outputs are partitioned into <strong>Basic</strong> and <strong>Advanced</strong> tiers for student and researcher workflows.
        </p>
      </div>

      {/* Preset Dropdown & Dataset Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', margin: '20px 0' }}>
        <div className="model-card" style={{ margin: 0 }}>
          <label style={{ fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '8px' }}>
            👤 Select Patient Profile Category (5 Archetypes):
          </label>
          <select
            value={selectedPresetId}
            onChange={handlePresetChange}
            className="dataset-select"
            style={{ width: '100%', padding: '12px' }}
          >
            {presets.map(p => (
              <option key={p.id} value={p.id}>{p.name} — [{p.risk_profile}]</option>
            ))}
          </select>
        </div>

        <div className="model-card" style={{ margin: 0 }}>
          <label style={{ fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '8px' }}>
            🏥 Disease Domain:
          </label>
          <select
            value={activeDataset}
            onChange={handleDatasetChange}
            className="dataset-select"
            style={{ width: '100%', padding: '12px' }}
          >
            <option value="cancer">Breast Cancer (WDBC - 30 Features)</option>
            <option value="cardiovascular">Cardiovascular Heart Disease (13 Features)</option>
          </select>
        </div>
      </div>

      {/* Selected Preset Information Box */}
      {selectedPreset && (
        <div className="model-card" style={{ background: '#f8fafc', borderLeft: '5px solid #667eea', marginBottom: '25px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
            <CardActionMenu
              title={`Patient Profile: ${selectedPreset.name}`}
              category="patient_profile"
              data={{
                preset_name: selectedPreset.name,
                risk_profile: selectedPreset.risk_profile,
                description: selectedPreset.description,
                basic_info: selectedPreset.basic_info,
                advanced_info: selectedPreset.advanced_info
              }}
              metadata={{
                page: 'live_inference',
                preset_id: selectedPreset.id,
                domain: activeDataset
              }}
            />
          </div>
          <h4 style={{ color: '#2d3748', marginBottom: '5px' }}>📋 Category Profile: {selectedPreset.name}</h4>
          <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>{selectedPreset.description}</p>

          {/* Basic Preset Info (Student Level) */}
          <div style={{ marginTop: '12px', padding: '10px 15px', background: '#e0f2fe', borderRadius: '6px' }}>
            <strong style={{ color: '#0369a1' }}>📚 Student View (Basic Clinical Summary):</strong>
            <p style={{ color: '#0c4a6e', fontSize: '0.9rem', marginTop: '4px' }}>
              <strong>Clinical Presentation:</strong> {selectedPreset.basic_info?.clinical_notes}
            </p>
            <p style={{ color: '#0c4a6e', fontSize: '0.9rem', marginTop: '4px' }}>
              <strong>Standard Clinical Protocol:</strong> {selectedPreset.basic_info?.typical_action}
            </p>
          </div>

          {/* Advanced Preset Info (Researcher Level) */}
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
              style={{
                background: 'none',
                border: 'none',
                color: '#92400e',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 0',
                fontSize: '0.9rem'
              }}
            >
              🔬 {showAdvancedInputs ? 'Hide' : 'Show'} Advanced Biomarker Specifications (Researcher Level)
              {showAdvancedInputs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAdvancedInputs && (
              <div style={{ marginTop: '8px', padding: '10px 15px', background: '#fef3c7', borderRadius: '6px' }}>
                <p style={{ color: '#78350f', fontSize: '0.85rem' }}>
                  <strong>Cellular Morphology:</strong> {selectedPreset.advanced_info?.cellular_morphology}
                </p>
                <p style={{ color: '#78350f', fontSize: '0.85rem', marginTop: '4px' }}>
                  <strong>Hemodynamics:</strong> {selectedPreset.advanced_info?.hemodynamics}
                </p>
                <p style={{ color: '#78350f', fontSize: '0.85rem', marginTop: '4px' }}>
                  <strong>Theoretical Risk Score:</strong> {selectedPreset.advanced_info?.risk_score_expected}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inference Input & Output Grid */}
      <div className="inference-grid">
        {/* Left Side: Parameters Form */}
        <div className="model-card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.2em', marginBottom: '15px' }}>
            Patient Parameters ({Object.keys(features).length} Features)
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
        <div className="model-card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.2em', marginBottom: '15px' }}>
            Diagnostic Consensus & Risk Tier
          </h3>

          {predictionResult ? (
            <div className="pred-results-container" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '0', right: '0', zIndex: 10 }}>
                <CardActionMenu
                  title={`Tri-Model Patient Risk Prediction - ${selectedPreset?.name}`}
                  category="prediction"
                  data={{
                    patient_profile: selectedPreset?.name,
                    dataset: activeDataset,
                    predictions: predictions,
                    consensus_risk: predictions?.hybrid_consensus_ensemble?.probability,
                    risk_tier: predictions?.hybrid_consensus_ensemble?.risk_tier
                  }}
                  metadata={{
                    page: 'live_inference',
                    preset_id: selectedPresetId,
                    quantum_coordinates: predictionResult.quantum_compressed_coordinates
                  }}
                />
              </div>
              {/* Basic Results (Student Level) */}
              <div style={{ padding: '12px', background: '#e0f2fe', borderRadius: '8px', marginBottom: '10px' }}>
                <strong style={{ color: '#0369a1' }}>📚 Basic Diagnostic Summary:</strong>
                <p style={{ color: '#0c4a6e', fontSize: '0.9rem', marginTop: '5px' }}>
                  The models have analyzed the patient's features and generated a unified risk estimate.
                </p>
              </div>

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

              {/* Advanced Results (Researcher Level) - Collapsible */}
              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => setShowAdvancedResults(!showAdvancedResults)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#92400e',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 0',
                    fontSize: '0.9rem'
                  }}
                >
                  🔬 {showAdvancedResults ? 'Hide' : 'Show'} Advanced Quantum State Coordinates (Researcher Level)
                  {showAdvancedResults ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showAdvancedResults && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#fef3c7', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <div><strong>PCA Coordinates (4 Qubits):</strong> [{predictionResult.quantum_compressed_coordinates?.join(', ')}]</div>
                    <div style={{ marginTop: '5px' }}><strong>Bloch Sphere Rotation Angles [0, π]:</strong> [{predictionResult.quantum_rotation_angles?.join(', ')}]</div>
                  </div>
                )}
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
