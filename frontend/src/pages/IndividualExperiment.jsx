import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
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
    <div className="section">
      <h2 className="section-title">🔬 Individual Model Experiment</h2>

      <div className="explainer">
        <div className="explainer-title">What is Individual Experiment Mode?</div>
        <p>
          Select <strong>one model</strong> and <strong>one dataset</strong> to run a focused experiment.
          Results are partitioned into <strong>Basic Information</strong> (for students learning ML concepts)
          and <strong>Advanced Information</strong> (for researchers analyzing hyperparameters, cross-validation, and circuit architecture).
        </p>
      </div>

      {/* Selection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '25px' }}>
        {/* Model Selection */}
        <div className="model-card">
          <h3 style={{ fontSize: '1.3em', marginBottom: '15px' }}>1️⃣ Select Model</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {models.map(model => (
              <label key={model.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: selectedModel === model.id ? '3px solid #667eea' : '2px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedModel === model.id ? '#f0f4ff' : 'white',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="model"
                  value={model.id}
                  checked={selectedModel === model.id}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{ marginRight: '10px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#2d3748' }}>{model.name}</div>
                  <span className={`tag ${model.type === 'classical' ? 'tag-classical' : 'tag-quantum'}`} style={{ marginTop: '5px', display: 'inline-block' }}>
                    {model.type === 'classical' ? 'Classical' : 'Quantum'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Dataset Selection */}
        <div className="model-card">
          <h3 style={{ fontSize: '1.3em', marginBottom: '15px' }}>2️⃣ Select Dataset</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {datasets.map(dataset => (
              <label key={dataset.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: selectedDataset === dataset.id ? '3px solid #667eea' : '2px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedDataset === dataset.id ? '#f0f4ff' : 'white',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="dataset"
                  value={dataset.id}
                  checked={selectedDataset === dataset.id}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  style={{ marginRight: '10px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#2d3748' }}>{dataset.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '3px' }}>{dataset.features} features · {dataset.desc}</div>
                </div>
              </label>
            ))}

            {/* Custom Uploaded Dataset option if uploaded */}
            {uploadMessage?.metadata && (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: selectedDataset === 'custom' ? '3px solid #10b981' : '2px solid #a7f3d0',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedDataset === 'custom' ? '#ecfdf5' : '#f0fdf4',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="dataset"
                  value="custom"
                  checked={selectedDataset === 'custom'}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  style={{ marginRight: '10px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#065f46' }}>Uploaded: {uploadMessage.metadata.filename || 'Custom Dataset'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '3px' }}>
                    {uploadMessage.metadata.total_features} features · {uploadMessage.metadata.total_samples} samples (Target: {uploadMessage.metadata.target_column})
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
            <div
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px',
                border: '2px dashed #667eea',
                borderRadius: '8px',
                cursor: uploading ? 'wait' : 'pointer',
                background: '#f8faff',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={20} style={{ marginRight: '8px', color: '#667eea' }} />
              <div style={{ color: '#667eea', fontWeight: 600, fontSize: '0.95rem' }}>
                {uploading ? '⏳ Universal Preprocessor Working...' : '📁 Browse & Upload Custom Clinical CSV'}
              </div>
            </div>

            {uploadMessage && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                background: uploadMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: uploadMessage.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${uploadMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
              }}>
                {uploadMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={handleRunExperiment}
        disabled={loading}
        className="btn-predict"
        style={{ maxWidth: '400px', margin: '25px auto', display: 'block' }}
      >
        {loading ? '⚙️ Running Experiment...' : '▶️ Run Experiment'}
      </button>

      {/* Results Section */}
      {results && (
        <div style={{ marginTop: '30px' }}>
          {/* Basic Information (Student Level) */}
          <div className="model-card" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 100%)', border: '2px solid #667eea', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
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
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#667eea' }}>
              📚 Basic Information (Student Level)
            </h3>

            <div style={{ marginTop: '15px' }}>
              <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>Model: {results.basic_info?.model_name}</h4>
              <p style={{ lineHeight: '1.7', color: '#4a5568' }}>{results.basic_info?.concept_explanation}</p>

              <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '8px' }}>
                <strong style={{ color: '#667eea' }}>💡 Why use this model?</strong>
                <p style={{ marginTop: '8px', color: '#4a5568' }}>{results.basic_info?.why_use_this_model}</p>
              </div>

              {/* Key Metrics */}
              <div className="metric-grid" style={{ marginTop: '20px' }}>
                <div className="metric-box">
                  <div className="metric-label">Accuracy</div>
                  <div className="metric-value">{results.basic_info?.key_metrics?.accuracy}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Sensitivity</div>
                  <div className="metric-value">{results.basic_info?.key_metrics?.sensitivity}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Specificity</div>
                  <div className="metric-value">{results.basic_info?.key_metrics?.specificity}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">ROC-AUC</div>
                  <div className="metric-value">{results.basic_info?.key_metrics?.roc_auc}</div>
                </div>
              </div>

              {/* Student Takeaway */}
              <div style={{ marginTop: '20px', padding: '15px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <strong style={{ color: '#92400e' }}>🎓 Student Takeaway:</strong>
                <p style={{ marginTop: '8px', color: '#78350f' }}>
                  <strong>What the graph indicates:</strong> {results.basic_info?.student_takeaway?.what_graph_indicates}
                </p>
                <p style={{ marginTop: '8px', color: '#78350f' }}>
                  <strong>Clinical meaning:</strong> {results.basic_info?.student_takeaway?.clinical_meaning}
                </p>
              </div>

              {/* Figures */}
              {results.advanced_info?.figure_artifacts && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#2d3748' }}>📊 Result Visualizations</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {results.advanced_info.figure_artifacts.roc_curve && (
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                          <CardActionMenu
                            title={`${results.basic_info?.model_name} - ROC Curve`}
                            category="plot"
                            data={{ roc_auc: results.basic_info?.key_metrics?.roc_auc }}
                            metadata={{ model_type: selectedModel, dataset: selectedDataset, plot_type: 'roc' }}
                            imageUrl={results.advanced_info.figure_artifacts.roc_curve}
                          />
                        </div>
                        <img src={results.advanced_info.figure_artifacts.roc_curve} alt="ROC Curve" style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      </div>
                    )}
                    {results.advanced_info.figure_artifacts.confusion_matrix && (
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
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
                        <img src={results.advanced_info.figure_artifacts.confusion_matrix} alt="Confusion Matrix" style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Information (Researcher Level) - Collapsible */}
          <div className="model-card" style={{ marginTop: '20px', background: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)', border: '2px solid #f59e0b' }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#92400e', margin: 0 }}>
                🔬 Advanced Information (Researcher Level)
              </h3>
              {showAdvanced ? <ChevronUp size={24} color="#92400e" /> : <ChevronDown size={24} color="#92400e" />}
            </div>

            {showAdvanced && (
              <div style={{ marginTop: '20px' }}>
                {/* Architecture Details */}
                <div style={{ padding: '15px', background: 'white', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>⚙️ Architectural Details</h4>
                  <pre style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', overflow: 'auto' }}>
                    {JSON.stringify(results.advanced_info?.architectural_details, null, 2)}
                  </pre>
                </div>

                {/* Cross-Validation Details */}
                <div style={{ padding: '15px', background: 'white', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>📊 Cross-Validation Methodology</h4>
                  <ul style={{ marginLeft: '20px', lineHeight: '1.8', color: '#4a5568' }}>
                    <li><strong>Strategy:</strong> {results.advanced_info?.cross_validation_details?.methodology}</li>
                    <li><strong>Variance:</strong> {results.advanced_info?.cross_validation_details?.fold_variance}</li>
                    <li><strong>Hyperparameter Search:</strong> {results.advanced_info?.cross_validation_details?.hyperparameter_search_space}</li>
                  </ul>
                </div>

                {/* Quantum Hardware Profile (if quantum) */}
                {results.model_type !== 'svm' && results.model_type !== 'mlp' && (
                  <div style={{ padding: '15px', background: 'white', borderRadius: '8px', marginBottom: '15px' }}>
                    <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>⚛️ Quantum Hardware Profile</h4>
                    <div className="metric-grid">
                      <div style={{ padding: '10px', background: '#f0f4ff', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#667eea' }}>Qubit Count</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>{results.advanced_info?.quantum_hardware_profile?.qubit_count}</div>
                      </div>
                      <div style={{ padding: '10px', background: '#f0f4ff', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#667eea' }}>Circuit Depth</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>{results.advanced_info?.quantum_hardware_profile?.circuit_depth}</div>
                      </div>
                      <div style={{ padding: '10px', background: '#f0f4ff', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#667eea' }}>CNOT Gates</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>{results.advanced_info?.quantum_hardware_profile?.cnot_entangler_count}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw JSON Results */}
                <details style={{ marginTop: '15px' }}>
                  <summary style={{ cursor: 'pointer', padding: '10px', background: '#f7fafc', borderRadius: '6px', fontWeight: 600, color: '#4a5568' }}>
                    🗂️ View Raw JSON Results
                  </summary>
                  <pre style={{ marginTop: '10px', background: '#1a202c', color: '#e2e8f0', padding: '15px', borderRadius: '6px', fontSize: '0.75rem', overflow: 'auto', maxHeight: '400px' }}>
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
