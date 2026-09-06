import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ChevronDown, ChevronUp, UserCheck, ShieldAlert, Cpu, Play,
  BookOpen, Sliders, Stethoscope, Sparkles, Layers, AlertCircle, Compass,
  HelpCircle, Bot, ArrowRight, RefreshCw, BarChart2, ShieldCheck,
  TrendingDown, CheckCircle2, RotateCcw, Zap
} from 'lucide-react';
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
    if (e) e.preventDefault();
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

      {/* Patient Archetype Details Box */}
      {selectedPreset && (
        <div className="card" style={{ marginBottom: '20px', position: 'relative', border: '1px solid var(--border-color)' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BookOpen size={14} style={{ color: 'var(--classical-color)' }} /> Clinical Presentation:
              </strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                {selectedPreset.basic_info?.clinical_notes}
              </div>
            </div>
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

      {/* Main Grid: Parameters Form (Left) & Tri-Model Diagnostic (Right) */}
      <div className="grid-2" style={{ gap: '20px', alignItems: 'start', marginBottom: '24px' }}>
        {/* Left: Input Biomarkers */}
        <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={17} style={{ color: 'var(--classical-color)' }} /> Patient Biomarker Vector ({Object.keys(features).length} Features)
            </h3>
            <button
              onClick={() => {
                const preset = presets.find(p => p.id === selectedPresetId);
                if (preset) loadPresetFeatures(preset, activeDataset);
              }}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.74rem', padding: '3px 8px' }}
              title="Reset to selected archetype default values"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          <form onSubmit={handleRunInference}>
            <div className="form-grid" style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '6px', marginBottom: '16px' }}>
              {Object.keys(features).map((feat) => (
                <div className="form-group" key={feat}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{feat}</label>
                  <input
                    type="number"
                    step="any"
                    value={features[feat]}
                    onChange={(e) => handleInputChange(feat, e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                  />
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary full-width-btn" disabled={loading} style={{ padding: '10px' }}>
              <Play size={16} />
              {loading ? 'Simulating Quantum Statevector Overlaps...' : 'Run Diagnostic Risk Inference'}
            </button>
          </form>
        </div>

        {/* Right: Tri-Model Diagnostic Output */}
        <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={17} style={{ color: 'var(--classical-color)' }} /> Tri-Model Diagnostic Output
            </h3>
            {predictionResult && (
              <span className="val-badge ready" style={{ fontSize: '0.72rem' }}>
                Inference Complete
              </span>
            )}
          </div>

          {predictionResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Classical SVM Card */}
              <div className="pred-card" style={{ textAlign: 'left', borderLeft: '4px solid var(--classical-color)', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>1. Classical RBF Support Vector Machine</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0' }}>
                  <span className={`pred-badge ${predictions?.classical_rbf_svm?.prediction === 1 ? 'badge-positive' : 'badge-negative'}`} style={{ fontSize: '0.75rem' }}>
                    {predictions?.classical_rbf_svm?.label}
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--classical-color)' }}>
                    {(predictions?.classical_rbf_svm?.probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  StandardScaler fitted strictly on training partition (0% leakage)
                </div>
              </div>

              {/* Quantum Kernel QSVM Card */}
              <div className="pred-card" style={{ textAlign: 'left', borderLeft: '4px solid var(--quantum-color)', padding: '12px 14px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>2. Quantum Kernel QSVM (ZZFeatureMap)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0' }}>
                  <span className={`pred-badge ${predictions?.quantum_kernel_svm?.prediction === 1 ? 'badge-positive' : 'badge-negative'}`} style={{ fontSize: '0.75rem' }}>
                    {predictions?.quantum_kernel_svm?.label}
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--quantum-color)' }}>
                    {(predictions?.quantum_kernel_svm?.probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  4 Qubits | 16-Dim Hilbert Space | |⟨ψ(x)|ψ(x_train)⟩|² Overlap
                </div>
              </div>

              {/* Hybrid Consensus Centerpiece */}
              <div className="pred-card highlight" style={{ textAlign: 'left', borderLeft: '4px solid var(--hybrid-color)', padding: '12px 14px', background: '#FFFDF5' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--hybrid-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> 3. Hybrid Consensus Ensemble (Centerpiece)
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0' }}>
                  <span className="badge-paradigm badge-hybrid" style={{ fontSize: '0.78rem' }}>
                    {predictions?.hybrid_consensus_ensemble?.label}
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--hybrid-color)' }}>
                    {(predictions?.hybrid_consensus_ensemble?.probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hybrid-color)' }}>
                  {predictions?.hybrid_consensus_ensemble?.risk_tier}
                </div>
              </div>

              {/* Dual-Source Uncertainty & Consensus Gauge */}
              {uncertainty && (
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={14} style={{ color: uncertainty.is_classical_quantum_discordant ? 'var(--status-danger)' : '#16A34A' }} />
                      Dual-Source Clinical Uncertainty
                    </span>
                    <span className="val-badge ready" style={{ fontSize: '0.7rem' }}>
                      Consensus: {(uncertainty.consensus_confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="grid-2" style={{ gap: '8px' }}>
                    <div className="metric-mini-box" style={{ background: '#FFFFFF', padding: '8px', border: '1px solid var(--border-color)' }}>
                      <div className="mini-val" style={{ fontSize: '0.92rem', color: 'var(--classical-color)' }}>{uncertainty.epistemic_uncertainty}</div>
                      <div className="mini-lbl" style={{ fontSize: '0.68rem' }}>Epistemic (Model Ambiguity)</div>
                    </div>
                    <div className="metric-mini-box" style={{ background: '#FFFFFF', padding: '8px', border: '1px solid var(--border-color)' }}>
                      <div className="mini-val" style={{ fontSize: '0.92rem', color: '#D97706' }}>{uncertainty.aleatoric_uncertainty}</div>
                      <div className="mini-lbl" style={{ fontSize: '0.68rem' }}>Aleatoric (Biomarker Noise)</div>
                    </div>
                  </div>

                  {uncertainty.is_classical_quantum_discordant && (
                    <div style={{ marginTop: '8px', padding: '8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px', color: '#DC2626', fontSize: '0.75rem', fontWeight: 600 }}>
                      ⚠️ Discordance Alert: Classical & Quantum models predict opposing classes. Histopathology review required.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
              <Activity size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                Select a profile or customize values, then click <strong>"Run Diagnostic Risk Inference"</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SOTA Explainable AI (XAI) Suite (Displayed when prediction is ready) */}
      {predictionResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. SHAP-Style Feature Attribution Waterfall */}
          <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={18} style={{ color: 'var(--classical-color)' }} /> 1. SHAP-Style Biomarker Feature Attribution Waterfall
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Margin-weighted gradient contribution indicating which clinical biomarkers push risk upward vs protective baseline.
                </p>
              </div>
              <button
                onClick={() => setShowExplainability(!showExplainability)}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                {showExplainability ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showExplainability && explainability && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                  {explainability.top_attributions?.map((attr, idx) => {
                    const isRisk = attr.normalized_impact > 0;
                    const barWidth = Math.min(100, Math.max(8, Math.abs(attr.normalized_impact) * 100));

                    return (
                      <div key={idx} style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        display: 'grid',
                        gridTemplateColumns: '180px 1fr 140px',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          {attr.feature_name}
                        </div>

                        {/* Impact Bar */}
                        <div style={{ background: '#F1F5F9', borderRadius: '4px', height: '10px', overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            width: `${barWidth}%`,
                            height: '100%',
                            background: isRisk ? 'linear-gradient(90deg, #F87171, #DC2626)' : 'linear-gradient(90deg, #34D399, #059669)',
                            borderRadius: '4px',
                            transition: 'width 0.3s'
                          }} />
                        </div>

                        <div style={{ textAlign: 'right', fontSize: '0.78rem', fontWeight: 600, color: isRisk ? '#DC2626' : '#059669' }}>
                          {isRisk ? '+ Risk' : '- Baseline'} (Score: {attr.importance_score})
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Clinical Rationale & Interpretation:</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.45' }}>
                    {explainability.clinical_rationale}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Interactive 3D Bloch Sphere Visualizer */}
          <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} style={{ color: 'var(--quantum-color)' }} /> 2. 4-Qubit 3D Bloch Sphere Projections & Quantum Statevectors
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Statevector mapping |ψ(θ,φ)⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩ on the unit sphere with analytical kernel sensitivity gradients.
                </p>
              </div>
              <button
                onClick={() => setShowBlochSpheres(!showBlochSpheres)}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                {showBlochSpheres ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showBlochSpheres && blochCoords && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  {blochCoords.map((coord) => {
                    const qSens = explainability?.quantum_kernel_sensitivity?.[`Qubit_${coord.qubit_index}_Sensitivity`] || 0.0;
                    // Project 3D (x, y, z) to 2D SVG canvas
                    // Center at (70, 70), radius 45
                    const cx = 70;
                    const cy = 70;
                    const r = 45;
                    const px = cx + coord.x * r * 0.85 + coord.y * r * 0.3;
                    const py = cy - coord.z * r * 0.85 + coord.y * r * 0.2;

                    return (
                      <div key={coord.qubit_index} style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--quantum-color)', marginBottom: '8px' }}>
                          Qubit q[{coord.qubit_index}] Statevector
                        </div>

                        {/* Interactive SVG Bloch Sphere */}
                        <svg width="140" height="140" viewBox="0 0 140 140" style={{ margin: '0 auto', display: 'block' }}>
                          {/* Sphere background & border */}
                          <circle cx="70" cy="70" r="45" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="1.5" />
                          {/* Equator ellipse */}
                          <ellipse cx="70" cy="70" rx="45" ry="14" fill="none" stroke="#CCFBF1" strokeWidth="1" strokeDasharray="3 3" />
                          {/* Z-Axis */}
                          <line x1="70" y1="20" x2="70" y2="120" stroke="#CBD5E1" strokeWidth="1" />
                          {/* North Pole |0> */}
                          <text x="70" y="15" textAnchor="middle" fontSize="9" fill="#0F766E" fontWeight="bold">|0⟩</text>
                          {/* South Pole |1> */}
                          <text x="70" y="132" textAnchor="middle" fontSize="9" fill="#0F766E" fontWeight="bold">|1⟩</text>
                          {/* Statevector Line */}
                          <line x1="70" y1="70" x2={px} y2={py} stroke="#0D9488" strokeWidth="2.5" />
                          {/* Statevector Pointer Tip */}
                          <circle cx={px} cy={py} r="4.5" fill="#0F766E" stroke="#FFFFFF" strokeWidth="1.5" />
                        </svg>

                        <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                          {coord.quantum_state_str}
                        </div>

                        <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          θ: {coord.theta_angle_rad} rad • φ: {coord.phi_angle_rad} rad
                        </div>

                        <div style={{ marginTop: '6px', background: '#F8FAFC', padding: '4px 6px', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Kernel Sensitivity:</span>
                          <strong style={{ color: 'var(--quantum-color)' }}>{qSens}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Interactive Counterfactual "What-If" Risk Reversal Simulator */}
          <div className="card" style={{ border: '1px solid var(--border-color)', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingDown size={18} style={{ color: '#16A34A' }} /> 3. Interactive Counterfactual "What-If" Risk Reversal Simulator
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Clinically actionable biomarker modifications to reverse patient status into the low-risk healthy baseline tier (&lt; 35%).
                </p>
              </div>
              <button
                onClick={() => setShowCounterfactual(!showCounterfactual)}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                {showCounterfactual ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showCounterfactual && counterfactual && (
              <div>
                {/* Dynamic Simulated Risk Gauge */}
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ⚡ Live Counterfactual Risk Reversal Projection
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: simulatedRisk >= 0.7 ? '#DC2626' : (simulatedRisk >= 0.35 ? '#D97706' : '#16A34A') }}>
                        {((simulatedRisk ?? counterfactual.original_risk_probability) * 100).toFixed(1)}% Risk
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#15803D' }}>
                        (Original: {(counterfactual.original_risk_probability * 100).toFixed(1)}% → Target: {(counterfactual.target_risk_probability * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <span className="val-badge ready" style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', fontWeight: 600 }}>
                    {counterfactual.is_reversible ? '✨ Clinically Reversible' : 'Irreversible'}
                  </span>
                </div>

                {/* Interactive Modification Sliders */}
                {counterfactual.key_interventions && counterfactual.key_interventions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                    {counterfactual.key_interventions.map((item, idx) => {
                      const currentProgress = simulatedDeltas[item.feature_name]?.percentAchieved || 0;
                      const currentVal = simulatedDeltas[item.feature_name]?.currentVal || item.original_value;

                      return (
                        <div key={idx} style={{
                          background: '#FFFFFF',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px 16px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {item.feature_name}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: '#15803D', fontWeight: 600 }}>
                              Current: {typeof currentVal === 'number' ? currentVal.toFixed(2) : currentVal} (Target: {item.recommended_value} • {item.percentage_change}%)
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Baseline</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={currentProgress}
                              onChange={(e) => handleCounterfactualSlider(item.feature_name, item.original_value, item.recommended_value, parseFloat(e.target.value))}
                              style={{ flex: 1, accentColor: '#16A34A', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 600 }}>Target ({currentProgress}%)</span>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: '#F8FAFC', padding: '6px 10px', borderRadius: '4px' }}>
                            <strong>Clinical Action:</strong> {item.clinical_rationale}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '6px', fontSize: '0.82rem', color: '#15803D' }}>
                    <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    {counterfactual.clinical_takeaway}
                  </div>
                )}

                {counterfactual.key_interventions && counterfactual.key_interventions.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45', background: '#F8FAFC', padding: '10px 14px', borderRadius: '6px' }}>
                    <strong>Synthesis:</strong> {counterfactual.clinical_takeaway}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
