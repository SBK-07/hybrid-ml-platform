import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Zap, Database, Play, BookOpen, FlaskConical, CheckCircle2, Settings, BarChart2, Cpu, FileCode, HelpCircle, GraduationCap, Image } from 'lucide-react';
import CardActionMenu from '../components/CardActionMenu';

export default function IndividualExperiment() {
  const [selectedModel, setSelectedModel] = useState('svm');
  const [selectedDataset, setSelectedDataset] = useState('cancer');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const fileInputRef = React.useRef(null);

  const models = [
    { id: 'svm', name: 'Classical SVM (RBF Kernel)', type: 'classical' },
    { id: 'mlp', name: 'Classical Neural Network (MLP)', type: 'classical' },
    { id: 'qsvm', name: 'Quantum Kernel SVM (QSVM)', type: 'quantum' },
    { id: 'qnn', name: 'Quantum Neural Network (QNN)', type: 'quantum' },
    { id: 'qvc', name: 'Quantum Variational Circuit (QVC)', type: 'quantum' }
  ];

  const datasets = [
    { id: 'cancer', name: 'Breast Cancer (WDBC)', features: 30, desc: 'Nuclear morphology metrics' },
    { id: 'cardiovascular', name: 'UCI Heart Disease', features: 13, desc: 'Clinical cardiac indicators' },
    { id: 'diabetes', name: 'Pima Indians Diabetes', features: 8, desc: 'Metabolic & diagnostic profile' },
    { id: 'parkinsons', name: 'Parkinson\'s Biomedical Voice', features: 22, desc: 'Phonation acoustic measures' }
  ];

  const handleUploadDataset = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadMessage({ type: 'error', text: 'Please upload a valid CSV file.' });
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-dataset', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        setUploadMessage({
          type: 'success',
          text: `✓ ${data.message}`,
          metadata: data.metadata
        });
        setSelectedDataset('custom');
      } else {
        setUploadMessage({
          type: 'error',
          text: data.detail || 'Upload failed. Please check your CSV file.'
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage({
        type: 'error',
        text: 'Failed to upload dataset. Please ensure the file is a valid clinical CSV.'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRunExperiment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/individual-experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_type: selectedModel,
          dataset_key: selectedDataset
        })
      });
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error running experiment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hub-section active">
      <div className="section-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FlaskConical size={24} style={{ color: 'var(--classical-color)' }} />
            Individual Model Experiment
          </h1>
          <p className="subtitle">
            Focused single-algorithm evaluation. Partitioned into Basic Conceptual Learning and Advanced Researcher-grade Quantum/Classical Telemetry.
          </p>
        </div>
      </div>

      <div className="card active-control-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap size={20} style={{ color: 'var(--classical-color)', flexShrink: 0 }} />
          <div>
            <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Individual Experiment Workflow</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              Select <strong>one model architecture</strong> and <strong>one clinical dataset</strong> below, then trigger live execution.
            </p>
          </div>
        </div>
      </div>

      {/* Selection Grid */}
      <div className="grid-2" style={{ gap: '24px', marginBottom: '24px' }}>
        {/* Model Selection */}
        <div className="card">
          <div className="card-header-bar" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: 'var(--classical-color)' }} /> 1. Select Model
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {models.map(model => {
              const isSelected = selectedModel === model.id;
              return (
                <label key={model.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 14px',
                  border: isSelected ? '1px solid var(--classical-color)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isSelected ? '#F0F6FF' : '#FFFFFF',
                  transition: 'all 0.15s ease'
                }}>
                  <input
                    type="radio"
                    name="model"
                    value={model.id}
                    checked={isSelected}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    style={{ marginRight: '12px', accentColor: 'var(--classical-color)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{model.name}</div>
                    <span className={`badge-paradigm ${model.type === 'classical' ? 'badge-classical' : 'badge-quantum'}`} style={{ marginTop: '4px' }}>
                      {model.type === 'classical' ? 'Classical Algorithm' : 'Quantum Simulator (PennyLane/Qiskit)'}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Dataset Selection */}
        <div className="card">
          <div className="card-header-bar" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} style={{ color: 'var(--classical-color)' }} /> 2. Select Dataset
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {datasets.map(dataset => {
              const isSelected = selectedDataset === dataset.id;
              return (
                <label key={dataset.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 14px',
                  border: isSelected ? '1px solid var(--classical-color)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isSelected ? '#F0F6FF' : '#FFFFFF',
                  transition: 'all 0.15s ease'
                }}>
                  <input
                    type="radio"
                    name="dataset"
                    value={dataset.id}
                    checked={isSelected}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    style={{ marginRight: '12px', accentColor: 'var(--classical-color)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{dataset.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {dataset.features} attributes · {dataset.desc}
                    </div>
                  </div>
                </label>
              );
            })}

            {/* Custom Uploaded Dataset option */}
            {uploadMessage?.metadata && (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 14px',
                border: selectedDataset === 'custom' ? '1px solid var(--status-success)' : '1px solid rgba(22, 163, 74, 0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedDataset === 'custom' ? 'rgba(22, 163, 74, 0.08)' : '#FFFFFF',
                transition: 'all 0.15s ease'
              }}>
                <input
                  type="radio"
                  name="dataset"
                  value="custom"
                  checked={selectedDataset === 'custom'}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  style={{ marginRight: '12px', accentColor: 'var(--status-success)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--status-success)', fontSize: '0.875rem' }}>
                    Uploaded: {uploadMessage.metadata.filename || 'Custom Dataset'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {uploadMessage.metadata.total_features} features · {uploadMessage.metadata.total_samples} samples
                  </div>
                </div>
              </label>
            )}

            {/* File upload trigger */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleUploadDataset}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="btn btn-outline full-width-btn"
              disabled={uploading}
              style={{ marginTop: '6px' }}
            >
              <Plus size={16} />
              {uploading ? 'Preprocessing CSV Pipeline...' : 'Upload Custom Biomedical CSV'}
            </button>

            {uploadMessage && (
              <div className="banner" style={{
                marginTop: '6px',
                padding: '10px 14px',
                background: uploadMessage.type === 'success' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                border: `1px solid ${uploadMessage.type === 'success' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                color: uploadMessage.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)'
              }}>
                {uploadMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Run Button */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <button
          onClick={handleRunExperiment}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '12px 32px', fontSize: '0.95rem' }}
        >
          <Play size={18} />
          {loading ? 'Executing Model Pipeline...' : 'Run Experiment'}
        </button>
      </div>

      {/* Results Section */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Basic Information (Student Level) */}
          <div className="card" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
              <CardActionMenu
                title={`${results.basic_info?.model_name} - Basic Metrics`}
                category="metrics"
                data={{
                  model_name: results.basic_info?.model_name,
                  key_metrics: results.basic_info?.key_metrics,
                  student_takeaway: results.basic_info?.student_takeaway
                }}
                metadata={{
                  model_type: selectedModel,
                  dataset: selectedDataset,
                  page: 'individual_experiment'
                }}
              />
            </div>

            <div className="card-header-bar" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--classical-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} /> Basic Information (Student Level)
              </h3>
            </div>

            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1rem', fontWeight: 600 }}>
                Model: {results.basic_info?.model_name}
              </h4>
              <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {results.basic_info?.concept_explanation}
              </p>

              <div style={{ marginTop: '18px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={16} style={{ color: 'var(--classical-color)' }} /> Why use this model?
                </strong>
                <p style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  {results.basic_info?.why_use_this_model}
                </p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '20px' }}>
                <div className="metric-mini-box">
                  <div className="mini-val">{results.basic_info?.key_metrics?.accuracy}</div>
                  <div className="mini-lbl">Accuracy</div>
                </div>
                <div className="metric-mini-box">
                  <div className="mini-val">{results.basic_info?.key_metrics?.sensitivity}</div>
                  <div className="mini-lbl">Sensitivity (Recall)</div>
                </div>
                <div className="metric-mini-box">
                  <div className="mini-val">{results.basic_info?.key_metrics?.specificity}</div>
                  <div className="mini-lbl">Specificity</div>
                </div>
                <div className="metric-mini-box">
                  <div className="mini-val">{results.basic_info?.key_metrics?.roc_auc}</div>
                  <div className="mini-lbl">ROC-AUC Score</div>
                </div>
              </div>

              {/* Student Takeaway Banner */}
              <div className="banner reality-banner" style={{ marginTop: '20px' }}>
                <GraduationCap size={20} style={{ flexShrink: 0, color: '#92400E' }} />
                <div>
                  <strong style={{ color: '#92400E', fontSize: '0.875rem' }}>Student Diagnostic Takeaway:</strong>
                  <p style={{ marginTop: '4px', fontSize: '0.85rem', color: '#92400E' }}>
                    <strong>Graph Signal:</strong> {results.basic_info?.student_takeaway?.what_graph_indicates}
                  </p>
                  <p style={{ marginTop: '2px', fontSize: '0.85rem', color: '#78350F' }}>
                    <strong>Clinical Significance:</strong> {results.basic_info?.student_takeaway?.clinical_meaning}
                  </p>
                </div>
              </div>

              {/* Figures Grid */}
              {results.advanced_info?.figure_artifacts && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '14px', color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Image size={16} style={{ color: 'var(--classical-color)' }} /> Result Artifacts & Visualizations
                  </h4>
                  <div className="grid-2" style={{ gap: '16px' }}>
                    {results.advanced_info.figure_artifacts.roc_curve && (
                      <div style={{ position: 'relative', background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10 }}>
                          <CardActionMenu
                            title={`${results.basic_info?.model_name} - ROC Curve`}
                            category="plot"
                            data={{ roc_auc: results.basic_info?.key_metrics?.roc_auc }}
                            metadata={{ model_type: selectedModel, dataset: selectedDataset, plot_type: 'roc' }}
                            imageUrl={results.advanced_info.figure_artifacts.roc_curve}
                          />
                        </div>
                        <img src={results.advanced_info.figure_artifacts.roc_curve} alt="ROC Curve" style={{ width: '100%', borderRadius: '6px' }} />
                      </div>
                    )}
                    {results.advanced_info.figure_artifacts.confusion_matrix && (
                      <div style={{ position: 'relative', background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10 }}>
                          <CardActionMenu
                            title={`${results.basic_info?.model_name} - Confusion Matrix`}
                            category="plot"
                            data={{
                              accuracy: results.basic_info?.key_metrics?.accuracy,
                              sensitivity: results.basic_info?.key_metrics?.sensitivity,
                              specificity: results.basic_info?.key_metrics?.specificity
                            }}
                            metadata={{ model_type: selectedModel, dataset: selectedDataset, plot_type: 'confusion_matrix' }}
                            imageUrl={results.advanced_info.figure_artifacts.confusion_matrix}
                          />
                        </div>
                        <img src={results.advanced_info.figure_artifacts.confusion_matrix} alt="Confusion Matrix" style={{ width: '100%', borderRadius: '6px' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Information (Researcher Level) */}
          <div className="card">
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', margin: 0, fontSize: '1.05rem' }}>
                <FlaskConical size={18} style={{ color: 'var(--classical-color)' }} /> Advanced Information (Researcher Telemetry)
              </h3>
              <button className="btn btn-sm btn-outline" type="button">
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced Details'}
              </button>
            </div>

            {showAdvanced && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Architecture Details */}
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Settings size={16} /> Architectural Hyperparameters
                  </h4>
                  <pre style={{ background: '#FFFFFF', padding: '14px', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-primary)', border: '1px solid var(--border-color)', overflow: 'auto' }}>
                    {JSON.stringify(results.advanced_info?.architectural_details, null, 2)}
                  </pre>
                </div>

                {/* Cross-Validation Details */}
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart2 size={16} /> Cross-Validation Methodology
                  </h4>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <li><strong style={{ color: 'var(--text-primary)' }}>Strategy:</strong> {results.advanced_info?.cross_validation_details?.methodology}</li>
                    <li><strong style={{ color: 'var(--text-primary)' }}>Fold Variance:</strong> {results.advanced_info?.cross_validation_details?.fold_variance}</li>
                    <li><strong style={{ color: 'var(--text-primary)' }}>Hyperparameter Search:</strong> {results.advanced_info?.cross_validation_details?.hyperparameter_search_space}</li>
                  </ul>
                </div>

                {/* Quantum Hardware Profile */}
                {results.model_type !== 'svm' && results.model_type !== 'mlp' && (
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={16} style={{ color: 'var(--quantum-color)' }} /> Quantum Hardware Profile (NISQ Circuit Telemetry)
                    </h4>
                    <div className="grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div className="metric-mini-box">
                        <div className="mini-val" style={{ color: 'var(--quantum-color)' }}>{results.advanced_info?.quantum_hardware_profile?.qubit_count}</div>
                        <div className="mini-lbl">Qubit Count</div>
                      </div>
                      <div className="metric-mini-box">
                        <div className="mini-val" style={{ color: 'var(--quantum-color)' }}>{results.advanced_info?.quantum_hardware_profile?.circuit_depth}</div>
                        <div className="mini-lbl">Circuit Depth</div>
                      </div>
                      <div className="metric-mini-box">
                        <div className="mini-val" style={{ color: 'var(--quantum-color)' }}>{results.advanced_info?.quantum_hardware_profile?.cnot_entangler_count}</div>
                        <div className="mini-lbl">CNOT Gates</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw JSON Details */}
                <details style={{ marginTop: '8px' }}>
                  <summary style={{ cursor: 'pointer', padding: '10px 14px', background: '#F8FAFC', borderRadius: '6px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    View Raw Execution Payload JSON
                  </summary>
                  <pre style={{ marginTop: '10px', background: '#FFFFFF', color: 'var(--text-secondary)', padding: '16px', borderRadius: '6px', fontSize: '0.78rem', border: '1px solid var(--border-color)', overflow: 'auto', maxHeight: '350px' }}>
                    {JSON.stringify(results.advanced_info?.raw_json_results, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
