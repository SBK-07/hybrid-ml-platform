import React, { useState, useEffect } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Database, CheckCircle2, Cpu, ShieldCheck, Zap, Atom } from 'lucide-react';
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
    <div className="hub-section active">
      <div className="section-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={24} style={{ color: 'var(--classical-color)' }} />
            Cumulative Experiment & Comprehensive Benchmark
          </h1>
          <p className="subtitle">
            Side-by-side comparative analysis of all 5 classical and quantum models across diagnostic accuracy, sensitivity, specificity, ROC-AUC, and latency.
          </p>
        </div>
      </div>

      {/* Dataset Selector Banner */}
      <div className="card active-control-card" style={{ marginBottom: '24px' }}>
        <div className="control-row">
          <div className="control-info">
            <Database size={18} style={{ color: 'var(--classical-color)' }} />
            <span className="label">Benchmark Dataset:</span>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="form-select-inline"
            >
              <option value="cancer">Breast Cancer Wisconsin Diagnostic (WDBC - 30 features)</option>
              <option value="cardiovascular">UCI Heart Disease (Cardiovascular - 13 features)</option>
            </select>
          </div>
          <div className="val-badge ready">
            {loading ? 'Evaluating Models...' : '5 Models Synchronized'}
          </div>
        </div>
      </div>

      {/* Comparison Visualizations Grid */}
      {results?.comparison_figures && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--classical-color)' }} /> Benchmark Visualizations & Performance Overlays
          </h3>
          <div className="grid-2" style={{ gap: '24px' }}>
            <div className="card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
                <CardActionMenu
                  title="All Models Radar Chart Comparison"
                  category="plot"
                  data={{ dataset: selectedDataset, comparison_type: 'radar' }}
                  metadata={{ page: 'cumulative', chart_type: 'radar' }}
                  imageUrl={results.comparison_figures.radar_chart}
                />
              </div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '0.95rem', fontWeight: 600 }}>Multi-Metric Radar Chart Overview</h4>
              <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <img
                  src={results.comparison_figures.radar_chart}
                  alt="Radar Chart"
                  style={{ width: '100%', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div className="card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
                <CardActionMenu
                  title="Metric Comparison Bar Chart"
                  category="plot"
                  data={{ dataset: selectedDataset, comparison_type: 'bar' }}
                  metadata={{ page: 'cumulative', chart_type: 'bar' }}
                  imageUrl={results.comparison_figures.metric_comparison}
                />
              </div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '0.95rem', fontWeight: 600 }}>Comparative Accuracy & Sensitivity Breakdown</h4>
              <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <img
                  src={results.comparison_figures.metric_comparison}
                  alt="Metric Comparison"
                  style={{ width: '100%', borderRadius: '6px' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Cards */}
      <h3 style={{ color: 'var(--text-primary)', margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Cpu size={20} style={{ color: 'var(--classical-color)' }} /> 5-Model Performance Matrix
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {results?.models?.map(model => (
          <div key={model.id} className="card" style={{
            borderLeft: `4px solid ${model.type === 'classical' ? 'var(--classical-color)' : 'var(--quantum-color)'}`,
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
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

            {/* Header Bar */}
            <div className="card-header-bar" style={{ marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {model.type === 'classical' ? <Zap size={16} style={{ color: 'var(--classical-color)' }} /> : <Atom size={16} style={{ color: 'var(--quantum-color)' }} />}
                  {model.name}
                </h3>
                <span className={`badge-paradigm ${model.type === 'classical' ? 'badge-classical' : 'badge-quantum'}`} style={{ marginTop: '6px' }}>
                  {model.tag}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginRight: '36px' }}>
                Latency: <strong style={{ color: 'var(--text-primary)' }}>{model.training_time}</strong>
                {model.qubits !== 'N/A' && <> | Qubits: <strong style={{ color: 'var(--quantum-color)' }}>{model.qubits}</strong></>}
              </div>
            </div>

            {/* Basic Section (Student Level) */}
            <div style={{ marginTop: '14px', padding: '14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', fontSize: '0.85rem' }}>
                Basic Information (Student & General Understanding)
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.85rem' }}>{model.basic_summary}</p>

              {/* Metric Grid */}
              <div className="grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px' }}>
                <div className="metric-mini-box">
                  <div className="mini-val" style={{ color: model.type === 'classical' ? 'var(--classical-color)' : 'var(--quantum-color)' }}>{model.accuracy}%</div>
                  <div className="mini-lbl">Accuracy</div>
                </div>
                <div className="metric-mini-box">
                  <div className="mini-val">{model.sensitivity}%</div>
                  <div className="mini-lbl">Sensitivity</div>
                </div>
                <div className="metric-mini-box">
                  <div className="mini-val">{model.specificity}%</div>
                  <div className="mini-lbl">Specificity</div>
                </div>
                <div className="metric-mini-box">
                  <div className="mini-val">{model.roc_auc}</div>
                  <div className="mini-lbl">ROC-AUC Score</div>
                </div>
              </div>
            </div>

            {/* Advanced Section (Researcher Level) */}
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={() => toggleAdvanced(model.id)}
                className="btn btn-sm btn-outline"
                type="button"
              >
                {showAdvanced[model.id] ? 'Hide' : 'Show'} Advanced Telemetry
                {showAdvanced[model.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvanced[model.id] && (
                <div style={{
                  marginTop: '10px',
                  padding: '14px',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.5', fontSize: '0.85rem' }}>{model.advanced_summary}</p>
                  {model.circuit_depth !== 'N/A' && (
                    <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--quantum-color)' }}>Circuit Depth:</strong> {model.circuit_depth} | <strong style={{ color: 'var(--quantum-color)' }}>Entanglement:</strong> Linear CX gate mapping
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Synthesis Box */}
      <div className="card reality-banner" style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
        <ShieldCheck size={24} style={{ color: '#92400E', flexShrink: 0 }} />
        <div>
          <h3 style={{ color: '#92400E', fontSize: '1rem', margin: '0 0 6px 0', fontWeight: 600 }}>
            Quantum vs Classical Diagnostic Verdict
          </h3>
          <p style={{ color: '#92400E', fontSize: '0.875rem', lineHeight: '1.5' }}>
            {results?.basic_inference?.summary}
          </p>
          <p style={{ color: '#78350F', fontSize: '0.85rem', marginTop: '6px', lineHeight: '1.5' }}>
            {results?.basic_inference?.takeaway}
          </p>
        </div>
      </div>
    </div>
  );
}
