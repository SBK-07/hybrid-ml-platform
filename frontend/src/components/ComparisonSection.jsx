import React from 'react';

export default function ComparisonSection() {
  return (
    <div id="comparison" className="section">
      <h2 className="section-title">⚖️ Side-by-Side Benchmark Comparison</h2>

      <div className="explainer">
        <div className="explainer-title">Which Model Performed Best?</div>
        <p>
          Comprehensive comparative evaluation across Classical, Quantum, Neural Network, and Hybrid Ensemble architectures on identical test splits with zero data leakage:
        </p>
      </div>

      <table className="comparison-table">
        <thead>
          <tr>
            <th>Model Architecture</th>
            <th>Type</th>
            <th>Accuracy</th>
            <th>Sensitivity</th>
            <th>Specificity</th>
            <th>Execution Speed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Classical SVM (RBF Kernel)</strong></td>
            <td><span className="tag tag-classical">Classical</span></td>
            <td>97.4%</td>
            <td>92.9%</td>
            <td>100.0%</td>
            <td>⚡ Fast (&lt; 0.1s)</td>
          </tr>
          <tr>
            <td><strong>Classical Neural Net (MLP)</strong></td>
            <td><span className="tag tag-classical">Classical</span> <span className="tag tag-neural">NN</span></td>
            <td>97.4%</td>
            <td>92.9%</td>
            <td>100.0%</td>
            <td>⚡ Fast (&lt; 0.5s)</td>
          </tr>
          <tr>
            <td><strong>Quantum Kernel SVM (QSVM)</strong></td>
            <td><span className="tag tag-quantum">Quantum</span></td>
            <td>85.1%</td>
            <td>76.2%</td>
            <td>90.3%</td>
            <td>🐌 Slower (~0.61s)</td>
          </tr>
          <tr>
            <td><strong>Variational Quantum Neural Net (QNN)</strong></td>
            <td><span className="tag tag-quantum">Quantum</span> <span className="tag tag-neural">NN</span></td>
            <td>82.5%</td>
            <td>74.0%</td>
            <td>88.0%</td>
            <td>🐌 Much Slower (~12s)</td>
          </tr>
          <tr style={{ background: '#f0f4ff', fontWeight: 'bold' }}>
            <td><strong>Hybrid Consensus Ensemble</strong></td>
            <td><span className="tag tag-hybrid">Hybrid</span></td>
            <td>98.1%</td>
            <td>95.2%</td>
            <td>99.1%</td>
            <td>⚡ Real-time (&lt; 0.15s)</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
