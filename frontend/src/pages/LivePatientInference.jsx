import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronDown, ChevronUp, UserCheck, ShieldAlert, Cpu, Play, BookOpen, Sliders, Stethoscope, Sparkles, Layers, AlertCircle, Compass, HelpCircle, Loader2, Bot,ArrowRight } from 'lucide-react';
import { predictPatient } from '../services/api';
import CardActionMenu from '../components/CardActionMenu';

export default function LivePatientInference() {
  const navigate = useNavigate();

  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('high_risk_malignant');
  const [activeDataset, setActiveDataset] = useState('cancer');
  const [features, setFeatures] = useState({});
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Accordion toggles
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const [showAdvancedResults, setShowAdvancedResults] = useState(false);
  const [showExplainability, setShowExplainability] = useState(true);
  const [showBlochSpheres, setShowBlochSpheres] = useState(true);
  const [showCounterfactual, setShowCounterfactual] = useState(true);

  // Counterfactual interactive simulation state
  const [simulatedDeltas, setSimulatedDeltas] = useState({});
  const [simulatedRisk, setSimulatedRisk] = useState(null);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/patient-presets');
      const data = await response.json();
      const list = data.presets || [];
      setPresets(list);
      if (list.length > 0) {
        const defaultPreset = list.find(p => p.id === 'high_risk_malignant') || list[0];
        setSelectedPresetId(defaultPreset.id);
        loadPresetFeatures(defaultPreset, activeDataset);
      }
    } catch (err) {
      console.error('Error loading patient presets:', err);
    }
  };

  const loadPresetFeatures = (preset, datasetKey) => {
    const featMap = datasetKey === 'cancer' ? preset.cancer_features : preset.cardio_features;
    setFeatures(featMap || {});
    setPredictionResult(null);
    setSimulatedDeltas({});
    setSimulatedRisk(null);
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
    setPredictionResult(null);
    setLoading(true);
    try {
      const res = await predictPatient(activeDataset, features);
      setPredictionResult(res);
      // Initialize simulated risk from prediction
      if (res?.predictions?.hybrid_consensus_ensemble?.probability !== undefined) {
        setSimulatedRisk(res.predictions.hybrid_consensus_ensemble.probability);
        setSimulatedDeltas({});
      }
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time counterfactual "What-If" slider adjustment
  const handleCounterfactualSlider = (featureName, originalVal, recommendedVal, sliderPercent) => {
    // sliderPercent in [0, 100], 0 means original value, 100 means recommended therapeutic target
    const currentDeltaPct = (sliderPercent / 100);
    const currentVal = originalVal + (recommendedVal - originalVal) * currentDeltaPct;

    setSimulatedDeltas(prev => ({
      ...prev,
      [featureName]: {
        percentAchieved: sliderPercent,
        currentVal: currentVal
      }
    }));

    // Recalculate dynamic simulated risk
    if (predictionResult?.predictions?.hybrid_consensus_ensemble) {
      const origRisk = predictionResult.predictions.hybrid_consensus_ensemble.probability;
      const targetRisk = predictionResult.explainability?.counterfactual?.target_risk_probability || (origRisk * 0.3);
      const totalDrivers = predictionResult.explainability?.counterfactual?.key_interventions?.length || 1;

      // Calculate aggregate progress across all counterfactual sliders
      const currentDeltas = { ...simulatedDeltas, [featureName]: { percentAchieved: sliderPercent } };
      let sumPct = 0;
      Object.values(currentDeltas).forEach(d => {
        sumPct += (d.percentAchieved || 0);
      });
      const avgProgress = sumPct / (totalDrivers * 100);
      const newSimRisk = origRisk - (origRisk - targetRisk) * Math.min(1.0, Math.max(0.0, avgProgress));
      setSimulatedRisk(parseFloat(newSimRisk.toFixed(4)));
    }
  };

  const handleConsultQuddos = () => {
    if (!predictionResult) return;

    // Package patient telemetry into Quddos AI artifacts
    const artifact = {
      title: `Patient Case Study (${selectedPreset?.name || 'Custom'})`,
      category: 'Patient Inference & XAI',
      data: {
        preset_name: selectedPreset?.name,
        dataset: activeDataset,
        features: features,
        predictions: predictionResult.predictions,
        uncertainty: predictionResult.uncertainty,
        explainability: predictionResult.explainability,
        bloch_coordinates: predictionResult.bloch_coordinates
      },
      metadata: {
        domain: activeDataset,
        hybrid_risk: predictionResult.predictions?.hybrid_consensus_ensemble?.probability,
        risk_tier: predictionResult.predictions?.hybrid_consensus_ensemble?.risk_tier
      },
      timestamp: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('quddos_artifacts') || '[]');
    const filtered = existing.filter(a => a.title !== artifact.title);
    filtered.unshift(artifact);
    localStorage.setItem('quddos_artifacts', JSON.stringify(filtered));

    navigate('/quddos');
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId);
  const predictions = predictionResult?.predictions;
  const uncertainty = predictionResult?.uncertainty;
  const explainability = predictionResult?.explainability;
  const blochCoords = predictionResult?.bloch_coordinates;
  const counterfactual = explainability?.counterfactual;

  return (
    <div className="hub-section active" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div className="section-header" style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.45rem', margin: 0 }}>
              <Activity size={26} style={{ color: 'var(--classical-color)' }} />
              Live Patient Inference & Explainable AI (XAI) Studio
            </h1>
            <p className="subtitle" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              Real-time clinical diagnostic simulator with 4-qubit Hilbert statevector embedding, dual-source uncertainty, 3D Bloch sphere projections, and interactive counterfactual risk reversal.
            </p>
          </div>

          {predictionResult && (
            <button
              onClick={handleConsultQuddos}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', padding: '8px 16px', background: 'var(--classical-color)' }}
            >
              <Bot size={16} /> Deep Consult with Quddos AI <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Preset & Domain Selection Grid */}
      <div className="grid-2" style={{ gap: '16px', marginBottom: '20px' }}>
        <div className="card active-control-card" style={{ margin: 0, padding: '16px 20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} style={{ color: 'var(--classical-color)' }} /> Clinical Patient Profile Archetype:
            </label>
            <select
              value={selectedPresetId}
              onChange={handlePresetChange}
              className="form-select-inline"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem' }}
            >
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.name} — [{p.risk_profile}]</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card active-control-card" style={{ margin: 0, padding: '16px 20px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} style={{ color: 'var(--classical-color)' }} /> Disease Domain:
            </label>
            <select
              value={activeDataset}
              onChange={handleDatasetChange}
              className="form-select-inline"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.88rem' }}
            >
              <option value="cancer">Breast Cancer Wisconsin Diagnostic (WDBC)</option>
              <option value="cardiovascular">UCI Heart Disease (Cardiovascular Medicine)</option>
            </select>
          </div>
        </div>
      </div>


      {/* Main Form & Predictions Grid (Equal height 520px cards) */}
      <div className="grid-2" style={{ gap: '24px', alignItems: 'stretch', marginBottom: '28px' }}>
        {/* Left Side: Parameters Form */}
        <div className="card" style={{ height: '520px', display: 'flex', flexDirection: 'column', margin: 0 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Cpu size={18} style={{ color: 'var(--classical-color)' }} /> Patient Parameters ({Object.keys(features).length} Features)
          </h3>

          <form onSubmit={handleRunInference} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="form-grid" style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '14px' }}>
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
            <button type="submit" className="btn btn-primary full-width-btn" disabled={loading} style={{ flexShrink: 0 }}>
              {loading ? <Loader2 size={16} className="spinner" /> : <Play size={16} />}
              {loading ? 'Computing Quantum Statevector Overlaps...' : 'Run Diagnostic Risk Inference'}
            </button>
          </form>
        </div>

        {/* Right Side: Prediction Output Cards (Scrollable internal view, equal height) */}
        <div className="card" style={{ height: '520px', display: 'flex', flexDirection: 'column', position: 'relative', margin: 0 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <ShieldAlert size={18} style={{ color: 'var(--classical-color)' }} /> Tri-Model Diagnostic Cards
          </h3>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '110px 20px', color: 'var(--text-secondary)' }}>
                <Loader2 size={40} className="spinner" style={{ marginBottom: '16px', color: 'var(--classical-color)' }} />
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Computing Quantum Statevector Overlaps...
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Running tri-model inference pipeline across Classical SVM, Quantum QSVM, and Hybrid Consensus Ensemble.
                </p>
              </div>
            ) : predictionResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                <div style={{ position: 'sticky', top: '0', right: '0', zIndex: 10, display: 'flex', justifyContent: 'flex-end', marginBottom: '-28px' }}>
                  <CardActionMenu
                    title={`Patient Risk Prediction - ${selectedPreset?.name}`}
                    category="prediction"
                    data={{
                      patient_profile: selectedPreset?.name,
                      dataset: activeDataset,
                      predictions: predictions,
                      consensus_risk: predictions?.hybrid_consensus_ensemble?.probability,
                      risk_tier: predictions?.hybrid_consensus_ensemble?.risk_tier,
                      uncertainty: uncertainty
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

                {/* Uncertainty Quantification & Discordance Gauge */}
                {uncertainty && (
                  <div style={{ background: 'var(--bg-inset)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={15} style={{ color: uncertainty.is_classical_quantum_discordant ? 'var(--status-danger)' : 'var(--status-success)' }} />
                        Uncertainty & Model Consensus
                      </span>
                      <span className="val-badge ready" style={{ fontSize: '0.72rem' }}>
                        Consensus: {(uncertainty.consensus_confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="grid-2" style={{ gap: '8px' }}>
                      <div className="metric-mini-box" style={{ background: 'var(--bg-card-solid)', padding: '8px' }}>
                        <div className="mini-val" style={{ fontSize: '0.95rem' }}>{uncertainty.epistemic_uncertainty}</div>
                        <div className="mini-lbl" style={{ fontSize: '0.7rem' }}>Epistemic Ambiguity</div>
                      </div>
                      <div className="metric-mini-box" style={{ background: 'var(--bg-card-solid)', padding: '8px' }}>
                        <div className="mini-val" style={{ fontSize: '0.95rem' }}>{uncertainty.aleatoric_uncertainty}</div>
                        <div className="mini-lbl" style={{ fontSize: '0.7rem' }}>Aleatoric Data Noise</div>
                      </div>
                    </div>

                    {uncertainty.is_classical_quantum_discordant && (
                      <div className="banner" style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.3)', color: 'var(--status-danger)', fontSize: '0.78rem' }}>
                        <strong>Discordance Alert:</strong> Classical and Quantum models predict opposing classes. Secondary histopathology review recommended.
                      </div>
                    )}
                  </div>
                )}

                {/* Feature Attributions & Explainability */}
                {explainability && (
                  <div>
                    <button
                      onClick={() => setShowExplainability(!showExplainability)}
                      className="btn btn-sm btn-outline full-width-btn"
                      type="button"
                    >
                      <Compass size={14} /> {showExplainability ? 'Hide' : 'Show'} Biomarker Feature Attributions (SHAP-style)
                      {showExplainability ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showExplainability && (
                      <div style={{ marginTop: '10px', padding: '14px', background: 'var(--bg-inset)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Top Biomarker Risk Contributors:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {explainability.top_attributions?.map((attr, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card-solid)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontWeight: 500 }}>{attr.feature_name}</span>
                              <span style={{ color: attr.normalized_impact > 0 ? 'var(--status-danger)' : 'var(--status-success)', fontWeight: 600 }}>
                                {attr.direction.includes('Increases') ? '+ Risk' : '- Baseline'} ({attr.importance_score})
                              </span>
                            </div>
                          ))}
                        </div>
                        <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: '1.4' }}>
                          <strong>Clinical Rationale:</strong> {explainability.clinical_rationale}
                        </p>
                      </div>
                    )}
                  </div>
                )}

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
                    <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg-inset)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      <div><strong style={{ color: 'var(--quantum-color)' }}>PCA Coordinates (4 Qubits):</strong> [{predictionResult.quantum_compressed_coordinates?.join(', ')}]</div>
                      <div style={{ marginTop: '4px' }}><strong style={{ color: 'var(--quantum-color)' }}>Bloch Angles [0, π]:</strong> [{predictionResult.quantum_rotation_angles?.join(', ')}]</div>
                      {blochCoords && (
                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <strong>Bloch 3D Coordinates (x, y, z):</strong>
                          {blochCoords.map(c => ` Q${c.qubit_index}: (${c.x}, ${c.y}, ${c.z})`).join(' | ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Guidance Note */}
                <div className="banner reality-banner" style={{ marginTop: '6px' }}>
                  <Stethoscope size={20} style={{ color: 'var(--banner-warn-text)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--banner-warn-text)', fontSize: '0.85rem' }}>Clinician Guidance:</strong>
                    <p style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--banner-warn-text)' }}>
                      {predictionResult?.clinical_guidance?.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '110px 20px', color: 'var(--text-secondary)' }}>
                <Activity size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontSize: '0.875rem' }}>
                  Select a patient profile archetype or adjust sliders, then click <strong>"Run Diagnostic Risk Inference"</strong> to execute real-time quantum statevector simulation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Preset Information Box (Separated with clean gap below grid) */}
      {selectedPreset && (
        <div className="card" style={{ marginTop: '28px', marginBottom: '24px', position: 'relative' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>
              Profile Archetype: {selectedPreset.name}
            </h4>
            <span className="val-badge ready" style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
              Expected: {selectedPreset.risk_profile}
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.45', margin: '0 0 10px 0' }}>
            {selectedPreset.description}
          </p>

          {/* Student View Summary */}
          <div style={{ marginTop: '14px', padding: '14px', background: 'var(--bg-inset)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
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
              <div style={{ marginTop: '10px', padding: '14px', background: 'var(--bg-inset)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
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
            <div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Stethoscope size={14} style={{ color: '#059669' }} /> Standard Protocol:
              </strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {selectedPreset.basic_info?.typical_action}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
