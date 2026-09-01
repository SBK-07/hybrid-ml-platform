import React, { useState } from 'react';
import { Play, Bookmark, Check, Info, Eye, Cpu, Layers } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ModelStudioHub({
  activeDataset,
  setActiveDataset,
  datasetsList,
  onTrainPipeline,
  benchmarkTable,
  shapImportances,
  isTraining,
  realityCheck,
  onSaveToLibrary
}) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showFullMatrixModal, setShowFullMatrixModal] = useState(false);

  // Quantum Circuit Tuning State
  const [nQubits, setNQubits] = useState(4);
  const [circuitLayers, setCircuitLayers] = useState(2);

  const handleSaveClick = () => {
    onSaveToLibrary();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Benchmark Bar Chart Data
  const benchmarkChartData = {
    labels: benchmarkTable.map(r => r.model),
    datasets: [
      {
        label: 'Accuracy (%)',
        data: benchmarkTable.map(r => r.accuracy),
        backgroundColor: '#00f2fe'
      },
      {
        label: 'AUC-ROC (%)',
        data: benchmarkTable.map(r => (r.auc_roc * 100).toFixed(1)),
        backgroundColor: '#a855f7'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { min: 40, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
    },
    plugins: { legend: { labels: { color: '#94a3b8' } } }
  };

  // SHAP Chart Data
  const shapChartData = {
    labels: shapImportances.map(i => i.feature),
    datasets: [
      {
        label: 'SHAP Feature Attribution (%)',
        data: shapImportances.map(i => i.importance),
        backgroundColor: 'rgba(0, 242, 254, 0.6)',
        borderColor: '#00f2fe',
        borderWidth: 1
      }
    ]
  };

  const shapOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
    },
    plugins: { legend: { labels: { color: '#94a3b8' } } }
  };

  return (
    <section className="hub-section active">
      <div className="section-header">
        <div>
          <h1>Model Studio & Interactive Dashboard</h1>
          <p className="subtitle">Select your tabular dataset, execute Classical, Quantum (PennyLane QSVM/VQC), and Hybrid pipelines, and benchmark performance in real-time.</p>
        </div>
        <button
          className="btn btn-accent pulse-btn"
          onClick={onTrainPipeline}
          disabled={isTraining}
        >
          <Play size={16} fill="currentColor" /> {isTraining ? 'Training Pipeline...' : 'Start Training Pipeline'}
        </button>
      </div>

      {/* Active Control Banner */}
      <div className="card active-control-card">
        <div className="control-row">
          <div className="control-info">
            <span className="label">Target Dataset:</span>
            <select
              className="form-select-inline"
              value={activeDataset}
              onChange={(e) => setActiveDataset(e.target.value)}
            >
              {datasetsList.map(ds => (
                <option key={ds.id} value={ds.id}>{ds.name}</option>
              ))}
            </select>
          </div>

          <div className="control-info" style={{ gap: '6px' }}>
            <Cpu size={16} style={{ color: 'var(--accent-purple)' }} />
            <span className="label">Qubits:</span>
            <select
              className="form-select-inline"
              value={nQubits}
              onChange={(e) => setNQubits(parseInt(e.target.value))}
            >
              <option value={2}>2 Qubits</option>
              <option value={4}>4 Qubits</option>
              <option value={6}>6 Qubits</option>
            </select>
          </div>

          <div className="control-info" style={{ gap: '6px' }}>
            <Layers size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span className="label">Entanglement Layers:</span>
            <select
              className="form-select-inline"
              value={circuitLayers}
              onChange={(e) => setCircuitLayers(parseInt(e.target.value))}
            >
              <option value={1}>1 Layer</option>
              <option value={2}>2 Layers</option>
              <option value={3}>3 Layers</option>
            </select>
          </div>

          <div className="control-info">
            <span className="label">Engine Status:</span>
            <span className={`val-badge ${isTraining ? 'running' : 'ready'}`}>
              {isTraining ? 'Training...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Box */}
      {isTraining && (
        <div className="progress-box">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: '75%' }}></div>
          </div>
          <p>Training PennyLane Quantum Kernel (QSVM) & Variational Quantum Circuit (VQC)...</p>
        </div>
      )}

      {/* Benchmarking Matrix Table */}
      <div className="card full-width">
        <div className="card-header-bar">
          <h3>Performance Benchmarking Matrix</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setShowFullMatrixModal(true)}
              disabled={benchmarkTable.length === 0}
            >
              <Eye size={14} /> View Full Matrix
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={handleSaveClick}
              disabled={benchmarkTable.length === 0}
            >
              {saveSuccess ? (
                <><Check size={14} /> Saved to Library!</>
              ) : (
                <><Bookmark size={14} /> Save Run to Library</>
              )}
            </button>
          </div>
        </div>
        <div className="table-container" style={{ marginTop: '15px' }}>
          <table className="data-table">
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Model Name</th>
                <th>Category</th>
                <th>Accuracy</th>
                <th>Sensitivity (Recall)</th>
                <th>AUC-ROC</th>
                <th>Train Time</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkTable.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#718096' }}>
                    No trained model results yet. Click "Start Training Pipeline" above.
                  </td>
                </tr>
              ) : (
                benchmarkTable.map((row, idx) => (
                  <tr key={idx}>
                    <td><strong>{row.model}</strong></td>
                    <td>
                      <span className={`badge-paradigm ${
                        row.category === 'Quantum' ? 'badge-quantum' :
                        row.category === 'Hybrid' ? 'badge-hybrid' : 'badge-classical'
                      }`}>
                        {row.category}
                      </span>
                    </td>
                    <td><span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{row.accuracy}%</span></td>
                    <td>{row.sensitivity}%</td>
                    <td><span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{row.auc_roc}</span></td>
                    <td>{row.train_time_sec}s</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid-2" style={{ marginTop: '20px' }}>
        <div className="card">
          <h3>Comparative Metrics Visualization</h3>
          <div className="chart-box">
            {benchmarkTable.length > 0 ? (
              <Bar data={benchmarkChartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#718096' }}>
                Run training to generate benchmark charts.
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>SHAP Feature Importance (Explainable AI)</h3>
          <div className="chart-box">
            {shapImportances.length > 0 ? (
              <Bar data={shapChartData} options={shapOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#718096' }}>
                Run training to analyze feature attributions.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hardware Disclosure Banner */}
      <div className="banner reality-banner" style={{ marginTop: '20px' }}>
        <div className="banner-icon"><Info size={20} /></div>
        <div>
          <strong>Honest Hardware Disclosure (Literature Gap Solution)</strong>
          <p>
            {realityCheck.backend ? (
              `${realityCheck.backend} with ${realityCheck.qubit_count} qubits using ${realityCheck.encoding}. ${realityCheck.limitation_note}`
            ) : (
              "Models execute on PennyLane statevector simulator backend ('default.qubit'). High simulated metrics reflect quantum Hilbert space expressivity on noiseless states."
            )}
          </p>
        </div>
      </div>

      {/* Full Matrix Popup Modal */}
      {showFullMatrixModal && (
        <div className="modal-overlay">
          <div className="modal-card modal-large">
            <div className="modal-header">
              <h3>Full Performance Evaluation Matrix ({benchmarkTable.length} Models)</h3>
              <button className="modal-close" onClick={() => setShowFullMatrixModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Model Name</th>
                      <th>Category</th>
                      <th>Accuracy</th>
                      <th>Sensitivity</th>
                      <th>Specificity</th>
                      <th>Precision</th>
                      <th>F1-Score</th>
                      <th>AUC-ROC</th>
                      <th>Train Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkTable.map((row, idx) => (
                      <tr key={idx}>
                        <td><strong>{row.model}</strong></td>
                        <td>
                          <span className={`badge-paradigm ${
                            row.category === 'Quantum' ? 'badge-quantum' :
                            row.category === 'Hybrid' ? 'badge-hybrid' : 'badge-classical'
                          }`}>
                            {row.category}
                          </span>
                        </td>
                        <td><span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{row.accuracy}%</span></td>
                        <td>{row.sensitivity}%</td>
                        <td>{row.specificity}%</td>
                        <td>{row.precision}%</td>
                        <td>{row.f1_score}%</td>
                        <td>{row.auc_roc}</td>
                        <td>{row.train_time_sec}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
