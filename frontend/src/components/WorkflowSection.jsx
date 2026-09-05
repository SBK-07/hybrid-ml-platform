import React from 'react';

export default function WorkflowSection() {
  return (
    <div id="workflow" className="section">
      <h2 className="section-title">🔄 How It Works - Simple Explanation</h2>

      <div className="explainer">
        <div className="explainer-title">The Process (Step-by-Step)</div>
        <ol style={{ marginLeft: '20px', marginTop: '10px', lineHeight: '2' }}>
          <li><strong>Data Collection</strong> - We use real biomedical research data (patient clinical records)</li>
          <li><strong>Data Cleaning & Scaling</strong> - Standardize attributes and compress into 4 orthogonal quantum components</li>
          <li><strong>Training</strong> - The computer learns patterns using 5-fold cross-validation</li>
          <li><strong>Testing</strong> - Evaluate model generalization on unseen test samples</li>
          <li><strong>Comparison</strong> - Rigorous quantum advantage benchmark (Statistical Parity & ROC-AUC)</li>
        </ol>
      </div>

      <div className="model-card">
        <h3>Understanding Diagnostic Metrics</h3>
        <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)', height: '36px' }}>
              <td style={{ width: '150px' }}><strong>Accuracy</strong></td>
              <td>Overall percentage of correct medical diagnoses</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)', height: '36px' }}>
              <td><strong>Sensitivity</strong></td>
              <td>Ability to correctly identify patients with actual disease (catch true positives)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)', height: '36px' }}>
              <td><strong>Specificity</strong></td>
              <td>Ability to correctly identify healthy individuals (prevent false alarms)</td>
            </tr>
            <tr style={{ height: '36px' }}>
              <td><strong>ROC-AUC</strong></td>
              <td>Overall diagnostic discrimination capability score (range 0.0 to 1.0)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="explainer" style={{ background: 'var(--banner-warn-bg)', borderLeftColor: 'var(--banner-warn-border)' }}>
        <div className="explainer-title" style={{ color: 'var(--banner-warn-text)' }}>⚠️ Why Sensitivity Matters Most in Medicine</div>
        <p>
          In clinical diagnostic systems, <strong>missing an active disease (False Negative)</strong> has life-threatening consequences compared to a false alarm. High <strong>Sensitivity</strong> ensures deadly diagnostic misses are minimized.
        </p>
      </div>
    </div>
  );
}
