import React, { useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronUp, UserCheck, ShieldAlert, Cpu, Play, BookOpen, Sliders, Stethoscope } from 'lucide-react';
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
    <div className="hub-section active">
      <div className="section-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={24} style={{ color: 'var(--classical-color)' }} />
            Live Patient Risk Inference
          </h1>
          <p className="subtitle">
            Real-time clinical patient diagnostic simulator. Features automated 4-qubit PCA projection, zero-data-leakage scaling, and 3-way consensus evaluation.
          </p>
        </div>
      </div>

      {/* Preset & Dataset Selection Bar */}
      <div className="grid-2" style={{ gap: '16px', marginBottom: '20px' }}>
        <div className="card active-control-card" style={{ margin: 0, padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} style={{ color: 'var(--classical-color)' }} /> Select Clinical Patient Profile Category:
            </label>
            <select
              value={selectedPresetId}
              onChange={handlePresetChange}
              className="form-select-inline"
              style={{ width: '100%', padding: '8px 12px' }}
            >
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.name} — [{p.risk_profile}]</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card active-control-card" style={{ margin: 0, padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} style={{ color: 'var(--classical-color)' }} /> Disease Domain:
            </label>
            <select
              value={activeDataset}
              onChange={handleDatasetChange}
              className="form-select-inline"
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="cancer">Breast Cancer Wisconsin Diagnostic (WDBC)</option>
              <option value="cardiovascular">UCI Heart Disease (Cardiovascular)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Preset Information Box */}
      {selectedPreset && (
        <div className="card" style={{ marginBottom: '24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
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

          <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px', fontSize: '1rem', fontWeight: 600 }}>
            Profile Archetype: {selectedPreset.name}
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
            {selectedPreset.description}
          </p>

          {/* Student View Summary */}
          <div style={{ marginTop: '14px', padding: '14px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} style={{ color: 'var(--classical-color)' }} /> Student View (Basic Clinical Summary):
            </strong>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '4px' }}>
              <strong>Clinical Presentation:</strong> {selectedPreset.basic_info?.clinical_notes}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
              <strong>Standard Protocol:</strong> {selectedPreset.basic_info?.typical_action}
            </p>
          </div>

          {/* Advanced Preset Info */}
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
              className="btn btn-sm btn-outline"
              type="button"
            >
              <Sliders size={14} /> {showAdvancedInputs ? 'Hide' : 'Show'} Advanced Biomarker Telemetry
              {showAdvancedInputs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvancedInputs && (
              <div style={{ marginTop: '10px', padding: '14px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <p style={{ color: 'var(--text-primary)' }}>
                  <strong style={{ color: 'var(--classical-color)' }}>Cellular Morphology:</strong> {selectedPreset.advanced_info?.cellular_morphology}
                </p>
                <p style={{ color: 'var(--text-primary)', marginTop: '4px' }}>
                  <strong style={{ color: 'var(--quantum-color)' }}>Hemodynamics:</strong> {selectedPreset.advanced_info?.hemodynamics}
                </p>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <strong style={{ color: 'var(--hybrid-color)' }}>Theoretical Risk Range:</strong> {selectedPreset.advanced_info?.risk_score_expected}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Form & Predictions Grid */}
      <div className="grid-2" style={{ gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Parameters Form */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} style={{ color: 'var(--classical-color)' }} /> Patient Parameters ({Object.keys(features).length} Features)
          </h3>

          <form onSubmit={handleRunInference}>
            <div className="form-grid" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '6px', marginBottom: '16px' }}>
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
            <button type="submit" className="btn btn-primary full-width-btn" disabled={loading}>
              <Play size={16} />
              {loading ? 'Computing Quantum Statevector Overlaps...' : 'Run Diagnostic Risk Inference'}
            </button>
          </form>
        </div>

        {/* Right Side: Prediction Output Cards */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: 'var(--classical-color)' }} /> Tri-Model Diagnostic Cards
          </h3>

          {predictionResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-44px', right: '0', zIndex: 10 }}>
                <CardActionMenu
                  title={`Patient Risk Prediction - ${selectedPreset?.name}`}
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

              {/* Classical Card - Blue Color Token */}
              <div className="pred-card" style={{ textAlign: 'left', borderLeft: '4px solid var(--classical-color)' }}>
                <div className="pred-title">1. Classical RBF Support Vector Machine</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                  <span className={`pred-badge ${predictions?.classical_rbf_svm?.prediction === 1 ? 'badge-positive' : 'badge-negative'}`}>
                    {predictions?.classical_rbf_svm?.label}
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--classical-color)' }}>
                    {(predictions?.classical_rbf_svm?.probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Confidence: {predictions?.classical_rbf_svm?.confidence_pct}%
                </div>
              </div>

              {/* Quantum Card - Teal Color Token */}
              <div className="pred-card" style={{ textAlign: 'left', borderLeft: '4px solid var(--quantum-color)' }}>
                <div className="pred-title">2. Quantum Kernel QSVM (ZZFeatureMap)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                  <span className={`pred-badge ${predictions?.quantum_kernel_svm?.prediction === 1 ? 'badge-positive' : 'badge-negative'}`}>
                    {predictions?.quantum_kernel_svm?.label}
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--quantum-color)' }}>
                    {(predictions?.quantum_kernel_svm?.probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  4 Qubits | {predictions?.quantum_kernel_svm?.feature_map || 'ZZFeatureMap (reps=2)'}
                </div>
              </div>

              {/* Hybrid Consensus Ensemble Card - Amber Color Token */}
              <div className="pred-card highlight" style={{ textAlign: 'left', borderLeft: '4px solid var(--hybrid-color)' }}>
                <div className="pred-title" style={{ color: 'var(--hybrid-color)', fontWeight: 600 }}>3. Hybrid Consensus Ensemble (Centerpiece)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                  <span className="badge-paradigm badge-hybrid">
                    {predictions?.hybrid_consensus_ensemble?.label}
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--hybrid-color)' }}>
                    {(predictions?.hybrid_consensus_ensemble?.probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--hybrid-color)' }}>
                  {predictions?.hybrid_consensus_ensemble?.risk_tier}
                </div>
              </div>

              {/* Advanced Quantum State Coordinates */}
              <div>
                <button
                  onClick={() => setShowAdvancedResults(!showAdvancedResults)}
                  className="btn btn-sm btn-outline"
                  type="button"
                >
                  {showAdvancedResults ? 'Hide' : 'Show'} Quantum Hilbert State Telemetry
                  {showAdvancedResults ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAdvancedResults && (
                  <div style={{ marginTop: '10px', padding: '12px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    <div><strong style={{ color: 'var(--quantum-color)' }}>PCA Coordinates (4 Qubits):</strong> [{predictionResult.quantum_compressed_coordinates?.join(', ')}]</div>
                    <div style={{ marginTop: '4px' }}><strong style={{ color: 'var(--quantum-color)' }}>Bloch Angles [0, π]:</strong> [{predictionResult.quantum_rotation_angles?.join(', ')}]</div>
                  </div>
                )}
              </div>

              {/* Guidance Note */}
              <div className="banner reality-banner" style={{ marginTop: '6px' }}>
                <Stethoscope size={20} style={{ color: '#92400E', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#92400E', fontSize: '0.85rem' }}>Clinician Guidance:</strong>
                  <p style={{ marginTop: '4px', fontSize: '0.85rem', color: '#92400E' }}>
                    {predictionResult?.clinical_guidance?.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <Activity size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem' }}>
                Select a patient profile archetype or adjust sliders, then click <strong>"Run Diagnostic Risk Inference"</strong> to execute real-time quantum statevector simulation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
