import React from 'react';
import { Database, Calendar, Award, Cpu } from 'lucide-react';

export default function ModelDetailModal({ run, onClose }) {
  if (!run) return null;

  // Handle single model legacy record or session record
  const modelsList = run.models || [
    {
      model: run.model || 'Trained Model',
      category: run.category || 'Classical',
      accuracy: run.accuracy || 0,
      sensitivity: run.sensitivity || 0,
      specificity: run.specificity || 0,
      precision: run.precision || 0,
      f1_score: run.f1_score || 0,
      auc_roc: run.auc_roc || 0,
      train_time_sec: run.train_time_sec || 0
    }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-large">
        <div className="modal-header">
          <div>
            <h3>{run.runTitle || run.datasetName}</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)' }}>
                <Database size={14} /> {run.datasetName}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {run.savedAt || 'Saved Session'}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Winner Highlight */}
          <div className="card inner-card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={24} style={{ color: 'var(--accent-green)' }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>TOP PERFORMER</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{run.topModelName || 'Evaluated Models'}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)' }}>{run.topAccuracy}% Accuracy</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>AUC Score: {run.topAuc}</div>
            </div>
          </div>

          <h4 style={{ marginBottom: '12px' }}>Benchmarked Models Performance Matrix ({modelsList.length} Models)</h4>
          <div className="table-container" style={{ marginBottom: '20px' }}>
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
                {modelsList.map((m, idx) => {
                  const badgeClass = m.category === 'Quantum' ? 'badge-quantum' :
                                     m.category === 'Hybrid' ? 'badge-hybrid' : 'badge-classical';
                  return (
                    <tr key={idx}>
                      <td><strong>{m.model}</strong></td>
                      <td><span className={`badge-paradigm ${badgeClass}`}>{m.category}</span></td>
                      <td><span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{m.accuracy}%</span></td>
                      <td>{m.sensitivity}%</td>
                      <td>{m.specificity}%</td>
                      <td>{m.precision}%</td>
                      <td>{m.f1_score}%</td>
                      <td>{m.auc_roc}</td>
                      <td>{m.train_time_sec}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h4 style={{ marginBottom: '10px' }}>Quantum Circuit & Architecture Specs</h4>
          <div className="card inner-card" style={{ marginBottom: '20px', fontSize: '0.88rem', lineHeight: '1.6' }}>
            <div><strong>Simulator Backend:</strong> PennyLane <code>default.qubit</code> Statevector Simulator</div>
            <div><strong>Quantum Encoding:</strong> 4 Qubits (Angle RY-RZ Feature Mapping)</div>
            <div><strong>Circuit Depth:</strong> 2 Parameterized Entanglement Layers</div>
          </div>

          <h4 style={{ marginBottom: '10px' }}>SHAP Feature Importances</h4>
          <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
            {run.featureImportances && run.featureImportances.length > 0 ? (
              run.featureImportances.map((f, idx) => (
                <li key={idx}><strong>{f.feature}</strong>: {f.importance}% attribution score</li>
              ))
            ) : (
              <li>Standard clinical feature importance mapping</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
