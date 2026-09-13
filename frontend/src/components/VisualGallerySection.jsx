import React, { useState } from 'react';

export default function VisualGallerySection({ activeDataset }) {
  const [filterCategory, setFilterCategory] = useState('all');

  const figures = [
    // EDA
    { category: 'eda', key: 'cancer', name: 'Cancer Correlation Matrix', path: '/figures/eda/cancer_correlation_matrix.png' },
    { category: 'eda', key: 'cancer', name: 'Cancer Feature Distributions', path: '/figures/eda/cancer_feature_distributions.png' },
    { category: 'eda', key: 'cancer', name: 'Cancer PCA Variance', path: '/figures/eda/cancer_pca_variance.png' },
    { category: 'eda', key: 'cardiovascular', name: 'Cardiovascular Correlation Matrix', path: '/figures/eda/cardiovascular_correlation_matrix.png' },
    { category: 'eda', key: 'cardiovascular', name: 'Cardiovascular Feature Distributions', path: '/figures/eda/cardiovascular_feature_distributions.png' },
    { category: 'eda', key: 'cardiovascular', name: 'Cardiovascular PCA Variance', path: '/figures/eda/cardiovascular_pca_variance.png' },

    // CLASSICAL
    { category: 'classical', key: 'cancer', name: 'Cancer Confusion Matrices', path: '/figures/classical/cancer_confusion_matrices.png' },
    { category: 'classical', key: 'cancer', name: 'Cancer CV Performance', path: '/figures/classical/cancer_cv_performance.png' },
    { category: 'classical', key: 'cancer', name: 'Cancer MLP Confusion Matrices', path: '/figures/classical/cancer_mlp_confusion_matrices.png' },
    { category: 'classical', key: 'cancer', name: 'Cancer MLP ROC Curves', path: '/figures/classical/cancer_mlp_roc_curves.png' },
    { category: 'classical', key: 'cancer', name: 'Cancer ROC Curves', path: '/figures/classical/cancer_roc_curves.png' },
    { category: 'classical', key: 'cardiovascular', name: 'Cardiovascular Confusion Matrices', path: '/figures/classical/cardiovascular_confusion_matrices.png' },

    // QUANTUM
    { category: 'quantum', key: 'cancer', name: 'Cancer Quantum Kernel Heatmaps', path: '/figures/quantum/cancer_kernel_heatmaps.png' },
    { category: 'quantum', key: 'cancer', name: 'Cancer Noise Sensitivity', path: '/figures/quantum/cancer_noise_sensitivity.png' },
    { category: 'quantum', key: 'cancer', name: 'Cancer Qubit Scaling', path: '/figures/quantum/cancer_qubit_scaling.png' },
    { category: 'quantum', key: 'cardiovascular', name: 'Cardiovascular Quantum Kernel Heatmaps', path: '/figures/quantum/cardiovascular_kernel_heatmaps.png' },
    { category: 'quantum', key: 'cardiovascular', name: 'Cardiovascular Noise Sensitivity', path: '/figures/quantum/cardiovascular_noise_sensitivity.png' },
    { category: 'quantum', key: 'cardiovascular', name: 'Cardiovascular Qubit Scaling', path: '/figures/quantum/cardiovascular_qubit_scaling.png' },

    // BENCHMARK
    { category: 'benchmark', key: 'cancer', name: 'Cancer Side-by-Side Confusion Matrix', path: '/figures/benchmark/cancer_confusion_matrix_side_by_side.png' },
    { category: 'benchmark', key: 'cancer', name: 'Cancer Metric Comparison', path: '/figures/benchmark/cancer_metric_comparison.png' },
    { category: 'benchmark', key: 'cancer', name: 'Cancer Quantum Advantage Radar Chart', path: '/figures/benchmark/cancer_radar_chart.png' },
    { category: 'benchmark', key: 'cardiovascular', name: 'Cardiovascular Side-by-Side Confusion Matrix', path: '/figures/benchmark/cardiovascular_confusion_matrix_side_by_side.png' },
    { category: 'benchmark', key: 'cardiovascular', name: 'Cardiovascular Metric Comparison', path: '/figures/benchmark/cardiovascular_metric_comparison.png' },
    { category: 'benchmark', key: 'cardiovascular', name: 'Cardiovascular Quantum Advantage Radar Chart', path: '/figures/benchmark/cardiovascular_radar_chart.png' }
  ];

  const filteredFigures = figures.filter(fig => {
    const matchesDataset = fig.key === activeDataset;
    const matchesCategory = filterCategory === 'all' || fig.category === filterCategory;
    return matchesDataset && matchesCategory;
  });

  return (
    <div id="visuals" className="section">
      <h2 className="section-title">📊 Visual Results & Generated Plots</h2>
      <div className="explainer">
        <div className="explainer-title">Understanding the Visualizations</div>
        <p>
          Generated research plots including exploratory correlation heatmaps, ROC curves, confusion matrices, quantum kernel overlaps, qubit scaling profiles, and multi-metric radar charts:
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'eda', 'classical', 'quantum', 'benchmark'].map(cat => (
          <button
            key={cat}
            className={`nav-button ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(cat)}
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
          >
            {cat.toUpperCase()} Plots
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' }}>
        {filteredFigures.map((fig, idx) => (
          <div key={idx} className="figure-container" style={{ margin: 0 }}>
            <img
              src={fig.path}
              alt={fig.name}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML += `<div style="padding:40px;background:#f8fafc;border-radius:10px;color:#64748b;border:1px dashed #cbd5e1;">📊 Plot <strong>${fig.name}</strong> (Path: <code>${fig.path}</code>) will render when FastAPI server is active.</div>`;
              }}
            />
            <div className="figure-caption">{fig.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
