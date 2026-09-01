import React from 'react';
import { Search, Calendar, Database, Cpu, Award } from 'lucide-react';

export default function ModelLibraryHub({ trainedModelRuns, onOpenDetailModal }) {
  if (trainedModelRuns.length === 0) {
    return (
      <section className="hub-section active">
        <div className="section-header">
          <div>
            <h1>Trained Model Library</h1>
            <p className="subtitle">Repository of saved benchmark sessions. Click any run card to inspect full 7-model performance matrices, hyperparameter specs, and dataset provenance.</p>
          </div>
        </div>
        <div className="card full-width" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          No saved benchmark runs in library yet. Train models in Model Studio and click "Save Run to Library".
        </div>
      </section>
    );
  }

  return (
    <section className="hub-section active">
      <div className="section-header">
        <div>
          <h1>Trained Model Library</h1>
          <p className="subtitle">Repository of saved benchmark sessions. Click any run card to inspect full 7-model performance matrices, hyperparameter specs, and dataset provenance.</p>
        </div>
      </div>

      <div className="grid-2">
        {trainedModelRuns.map(run => {
          const topBadgeClass = run.topCategory === 'Quantum' ? 'badge-quantum' :
                                run.topCategory === 'Hybrid' ? 'badge-hybrid' : 'badge-classical';

          return (
            <div key={run.id} className="card model-card-item" style={{ gap: '16px' }}>
              <div>
                <div className="dataset-header">
                  <span className="dataset-title" style={{ fontSize: '1.15rem' }}>{run.runTitle || run.datasetName}</span>
                  <span className={`badge-paradigm ${topBadgeClass}`}>
                    Best: {run.topModelName || 'Evaluated'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '8px 0 14px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={14} style={{ color: 'var(--accent-cyan)' }} />
                    <span><strong>{run.datasetName}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    <span>{run.savedAt || 'Initial Run'}</span>
                  </div>
                </div>

                <div className="model-metrics-grid">
                  <div className="metric-mini-box">
                    <div className="mini-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={16} style={{ color: 'var(--accent-cyan)' }} />
                      {run.modelsCount || (run.models ? run.models.length : 7)} Models
                    </div>
                    <div className="mini-lbl">Evaluated Algorithms</div>
                  </div>
                  <div className="metric-mini-box">
                    <div className="mini-val" style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} />
                      {run.topAccuracy}%
                    </div>
                    <div className="mini-lbl">Peak Accuracy ({run.topModelName})</div>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-sm btn-outline full-width-btn"
                onClick={() => onOpenDetailModal(run)}
              >
                <Search size={14} /> Inspect Full Benchmark Run & Models
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
