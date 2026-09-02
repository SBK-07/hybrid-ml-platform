import React from 'react';

const tabs = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'workflow', label: '🔄 Workflow' },
  { id: 'classical', label: '💻 Classical Models' },
  { id: 'quantum', label: '⚛️ Quantum Models' },
  { id: 'comparison', label: '⚖️ Comparison' },
  { id: 'visuals', label: '🖼️ Visual Results' },
  { id: 'inference', label: '🩺 Live Inference' },
  { id: 'conclusions', label: '🎯 Conclusions' },
];

export default function Navigation({ activeTab, setActiveTab }) {
  return (
    <div className="nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
