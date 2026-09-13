import React from 'react';

export default function ConclusionsSection() {
  return (
    <div id="conclusions" className="section">
      <h2 className="section-title">🎯 Key Findings & Conclusions</h2>

      <div className="conclusion-box">
        <h3 style={{ marginBottom: '15px' }}>🏆 Main Takeaway</h3>
        <p>
          Both classical and quantum approaches achieved high accuracy for disease detection. Classical models are currently more practical due to speed and availability, while quantum models show promise for future applications as quantum hardware improves.
        </p>
      </div>

      <div className="model-card">
        <h3>Strengths of Classical ML</h3>
        <ul style={{ marginLeft: '20px', lineHeight: '2' }}>
          <li>✅ Very fast training and prediction (&lt; 0.5s execution)</li>
          <li>✅ High accuracy and reliability across diagnostic splits</li>
          <li>✅ Easy to deploy on regular digital hardware</li>
          <li>✅ Well-understood, proven medical ML technology</li>
        </ul>
      </div>

      <div className="model-card">
        <h3>Potential of Quantum ML</h3>
        <ul style={{ marginLeft: '20px', lineHeight: '2' }}>
          <li>⚛️ Can explore complex high-dimensional Hilbert correlation spaces</li>
          <li>⚛️ Comparable sensitivity to classical methods</li>
          <li>⚛️ Potential advantage on complex multi-disease feature topologies</li>
          <li>⚛️ Valuable for quantum hardware benchmarking and research</li>
        </ul>
      </div>

      <div className="explainer" style={{ background: '#e7f3ff', borderLeftColor: '#2196F3' }}>
        <div className="explainer-title" style={{ color: '#1976D2' }}>💡 For Non-Technical Readers</div>
        <p>
          <strong>In simple terms:</strong> Our research shows that current AI models on regular computers work very well for detecting diseases like cancer and heart disease. Quantum computers are still in early stages but show promise. For now, classical machine learning is the practical choice for medical diagnosis, achieving over 95% accuracy on our test datasets.
        </p>
      </div>

      <div className="explainer" style={{ background: '#fff8e1', borderLeftColor: '#FFC107' }}>
        <div className="explainer-title" style={{ color: '#F57C00' }}>🔬 For Researchers</div>
        <p>
          This platform demonstrates rigorous benchmarking across classical SVM, MLP, QSVM, and VQC architectures on clinical datasets. All models underwent 5-fold cross-validation with proper train-test splitting to prevent data leakage. Quantum models achieved statistical parity with classical baselines but with higher computational overhead. Future work may explore larger quantum circuits and hybrid quantum-classical architectures.
        </p>
      </div>
    </div>
  );
}
