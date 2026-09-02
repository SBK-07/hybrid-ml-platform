import React from 'react';

export default function OverviewSection({ activeDataset }) {
  return (
    <div id="overview" className="section">
      <h2 className="section-title">📊 Project Overview</h2>

      <div className="explainer">
        <div className="explainer-title">What is this project about?</div>
        <p>This platform compares <strong>traditional computer algorithms</strong> with <strong>quantum computer algorithms</strong> to see which works better for detecting diseases early. We tested these algorithms on two medical datasets:</p>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li><strong>Breast Cancer (WDBC)</strong> - Detecting if a tumor is cancerous (Malignant) or benign</li>
          <li><strong>Heart Disease (UCI)</strong> - Predicting angiographic presence of cardiovascular disease</li>
        </ul>
      </div>

      <div className="model-card">
        <h3>Models We Benchmark</h3>
        <div className="metric-grid">
          <div className="metric-box">
            <div className="metric-label">Classical SVM</div>
            <div className="metric-value">✓</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Classical Neural Net (MLP)</div>
            <div className="metric-value">✓</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Quantum SVM (QSVM)</div>
            <div className="metric-value">✓</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Quantum Neural Net (QNN)</div>
            <div className="metric-value">✓</div>
          </div>
        </div>
      </div>
    </div>
  );
}
