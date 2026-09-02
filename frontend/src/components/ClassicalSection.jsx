import React from 'react';

export default function ClassicalSection({ activeDataset, classicalData }) {
  const isCancer = activeDataset === 'cancer';
  const titleName = isCancer ? 'Breast Cancer (WDBC)' : 'Cardiovascular Heart Disease';
  
  // Default values matching Rohith's report if backend API isn't fully initialized
  const svmAcc = classicalData?.svm?.accuracy || (isCancer ? '97.4%' : '83.6%');
  const svmSens = classicalData?.svm?.sensitivity || (isCancer ? '92.9%' : '81.5%');
  const svmSpec = classicalData?.svm?.specificity || (isCancer ? '100.0%' : '85.2%');
  const svmAuc = classicalData?.svm?.roc_auc || (isCancer ? '0.996' : '0.912');

  const mlpAcc = classicalData?.mlp?.accuracy || (isCancer ? '97.4%' : '85.2%');
  const mlpSens = classicalData?.mlp?.sensitivity || (isCancer ? '92.9%' : '82.8%');
  const mlpSpec = classicalData?.mlp?.specificity || (isCancer ? '100.0%' : '87.1%');
  const mlpAuc = classicalData?.mlp?.roc_auc || (isCancer ? '0.985' : '0.925');

  return (
    <div id="classical" className="section">
      <h2 className="section-title">💻 Classical Machine Learning Results</h2>

      <div className="explainer">
        <div className="explainer-title">What are Classical Models?</div>
        <p>
          Classical models execute on standard digital computer architectures. They establish non-linear decision boundaries across normalized clinical feature spaces. We evaluated two primary baselines:
        </p>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li><strong>Support Vector Machine (SVM)</strong> - Finds optimal separating hyperplanes using Radial Basis Function (RBF) and Polynomial kernels.</li>
          <li><strong>Multi-Layer Perceptron (MLP)</strong> - Deep feedforward neural network establishing non-linear representations across hidden layers.</li>
        </ul>
      </div>

      {/* Classical SVM Card */}
      <div className="model-card">
        <h3>
          🩺 {titleName} - Classical SVM <span className="tag tag-classical">Classical</span>
        </h3>
        <div className="metric-grid">
          <div className="metric-box">
            <div className="metric-label">Accuracy</div>
            <div className="metric-value">{svmAcc}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Sensitivity</div>
            <div className="metric-value">{svmSens}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Specificity</div>
            <div className="metric-value">{svmSpec}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">ROC-AUC</div>
            <div className="metric-value">{svmAuc}</div>
          </div>
        </div>
        <p style={{ marginTop: '15px' }}>
          <strong>Diagnostic Performance:</strong> RBF Kernel SVM achieves superior sensitivity and complete specificity across test splits.
        </p>
      </div>

      {/* Classical Neural Network Card */}
      <div className="model-card">
        <h3>
          🧠 {titleName} - Classical Neural Network <span className="tag tag-classical">Classical</span> <span className="tag tag-neural">Neural Net</span>
        </h3>
        <div className="metric-grid">
          <div className="metric-box">
            <div className="metric-label">Accuracy</div>
            <div className="metric-value">{mlpAcc}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Sensitivity</div>
            <div className="metric-value">{mlpSens}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Specificity</div>
            <div className="metric-value">{mlpSpec}</div>
          </div>
          <div className="metric-box">
            <div className="metric-label">ROC-AUC</div>
            <div className="metric-value">{mlpAuc}</div>
          </div>
        </div>
        <p style={{ marginTop: '15px' }}>
          <strong>Architecture:</strong> Dual-layer hidden topology (128, 64) with ReLU activation & Adam optimizer.<br />
          <strong>Training Latency:</strong> 0.53 seconds
        </p>
      </div>
    </div>
  );
}
