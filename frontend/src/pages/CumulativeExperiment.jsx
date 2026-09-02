import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CardActionMenu from '../components/CardActionMenu';

export default function CumulativeExperiment() {
  const [selectedDataset, setSelectedDataset] = useState('cancer');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState({});

  useEffect(() => {
    fetchCumulativeResults();
  }, [selectedDataset]);

  const fetchCumulativeResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cumulative-experiment/${selectedDataset}`);
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error fetching cumulative experiment:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdvanced = (modelId) => {
    setShowAdvanced(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  return (
    <div className="section">
      <h2 className="section-title">📊 Cumulative Experiment & Comprehensive Benchmark</h2>

      <div className="explainer">
        <div className="explainer-title">What is Cumulative Experiment Mode?</div>
        <p>
          Compare <strong>all 5 classical and quantum models</strong> simultaneously across key clinical metrics.
          Each model card is partitioned into <strong>Basic Information</strong> (easy-to-understand metrics and explanations for students and non-technical visitors)
          and <strong>Advanced Information</strong> (deep mathematical formulations, circuit parameters, and hyperparameter grids for researchers).
        </p>
      </div>

      {/* Dataset Selector */}
      <div className="dataset-bar" style={{ borderRadius: '10px', margin: '20px 0' }}>
        <label>Selected Dataset:</label>
        <select
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
          className="dataset-select"
        >
          <option value="cancer">Breast Cancer Wisconsin Diagnostic (WDBC)</option>
          <option value="cardiovascular">UCI Heart Disease</option>
        </select>
      </div>

      {/* Comparison Visualizations */}
      {results?.comparison_figures && (
        <div style={{ margin: '30px 0' }}>
          <h3 style={{ color: '#667eea', marginBottom: '15px' }}>📈 Benchmark Visualizations</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            <div className="model-card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                <CardActionMenu
                  title="All Models Radar Chart Comparison"
                  category="plot"
                  data={{ dataset: selectedDataset, comparison_type: 'radar' }}
                  metadata={{ page: 'cumulative', chart_type: 'radar' }}
                  imageUrl={results.comparison_figures.radar_chart}
                />
              </div>
              <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>Radar Chart Comparison</h4>
              <img
                src={results.comparison_figures.radar_chart}
                alt="Radar Chart"
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div className="model-card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                <CardActionMenu
                  title="Metric Comparison Bar Chart"
                  category="plot"
                  data={{ dataset: selectedDataset, comparison_type: 'bar' }}
                  metadata={{ page: 'cumulative', chart_type: 'bar' }}
                  imageUrl={results.comparison_figures.metric_comparison}
                />
              </div>
              <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>Metric Comparison Bar Chart</h4>
              <img
                src={results.comparison_figures.metric_comparison}
                alt="Metric Comparison"
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Model Cards Grid */}
      <h3 style={{ color: '#667eea', margin: '30px 0 15px 0' }}>🤖 All 5 Models Benchmark</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {results?.models?.map(model => (
          <div key={model.id} className="model-card" style={{
            borderLeft: `6px solid ${model.type === 'classical' ? '#667eea' : '#9b59b6'}`,
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
              <CardActionMenu
                title={`${model.name} - Cumulative Benchmark`}
                category="metrics"
                data={{
                  model_name: model.name,
                  accuracy: model.accuracy,
                  sensitivity: model.sensitivity,
                  specificity: model.specificity,
                  roc_auc: model.roc_auc,
                  training_time: model.training_time,
                  qubits: model.qubits,
                  circuit_depth: model.circuit_depth
                }}
                metadata={{
                  model_type: model.id,
                  dataset: selectedDataset,
                  page: 'cumulative',
                  type: model.type
                }}
              />
            </div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#2d3748' }}>
                  {model.type === 'classical' ? '💻' : '⚛️'} {model.name}
                </h3>
                <span className={`tag ${model.type === 'classical' ? 'tag-classical' : 'tag-quantum'}`} style={{ marginTop: '5px' }}>
                  {model.tag}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                Training Time: <strong>{model.training_time}</strong>
                {model.qubits !== 'N/A' && <> | Qubits: <strong>{model.qubits}</strong></>}
              </div>
            </div>

            {/* Basic Section (Student Level) */}
            <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, color: '#667eea', marginBottom: '8px' }}>
                📚 Basic Information (Student & General Understanding)
              </div>
              <p style={{ color: '#4a5568', lineHeight: '1.6' }}>{model.basic_summary}</p>

              {/* Metric Grid */}
              <div className="metric-grid" style={{ marginTop: '15px' }}>
                <div className="metric-box">
                  <div className="metric-label">Accuracy</div>
                  <div className="metric-value">{model.accuracy}%</div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Sensitivity</div>
                  <div className="metric-value">{model.sensitivity}%</div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Specificity</div>
                  <div className="metric-value">{model.specificity}%</div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">ROC-AUC</div>
                  <div className="metric-value">{model.roc_auc}</div>
                </div>
              </div>
            </div>

            {/* Advanced Section (Researcher Level) - Collapsible */}
            <div style={{ marginTop: '15px' }}>
              <button
                onClick={() => toggleAdvanced(model.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#92400e',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 0',
                  fontSize: '0.95rem'
                }}
              >
                🔬 {showAdvanced[model.id] ? 'Hide' : 'Show'} Advanced Information (Researcher Level)
                {showAdvanced[model.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {showAdvanced[model.id] && (
                <div style={{
                  marginTop: '10px',
                  padding: '15px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  borderLeft: '4px solid #f59e0b'
                }}>
                  <p style={{ color: '#78350f', lineHeight: '1.6' }}>{model.advanced_summary}</p>
                  {model.circuit_depth !== 'N/A' && (
                    <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#92400e' }}>
                      <strong>Circuit Depth:</strong> {model.circuit_depth} | <strong>Entanglement:</strong> Linear CX gates
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Synthesis Box */}
      <div className="conclusion-box" style={{ marginTop: '30px' }}>
        <h3>🎯 Quantum vs Classical Synthesis</h3>
        <p style={{ marginTop: '10px', fontSize: '1rem' }}>{results?.basic_inference?.summary}</p>
        <p style={{ marginTop: '8px', fontSize: '0.95rem', opacity: 0.9 }}>{results?.basic_inference?.takeaway}</p>
      </div>
    </div>
  );
}
