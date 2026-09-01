import React from 'react';
import { Atom, Zap, Database, BookOpen, Activity, Radio } from 'lucide-react';

export default function Sidebar({ activeHub, setActiveHub, activeDataset, datasetsList }) {
  const activeDsObj = datasetsList.find(d => d.id === activeDataset);
  const displayName = activeDsObj ? activeDsObj.name : activeDataset;

  const navItems = [
    { id: 'studio', icon: <Zap size={18} />, label: 'Model Studio' },
    { id: 'datasets', icon: <Database size={18} />, label: 'Datasets Hub' },
    { id: 'library', icon: <BookOpen size={18} />, label: 'Model Library' },
    { id: 'inference', icon: <Activity size={18} />, label: 'Live Patient Risk Predictor', badge: 'LIVE DEMO' }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo-icon" style={{ display: 'flex', alignItems: 'center' }}>
          <Atom size={28} />
        </div>
        <div>
          <h2>Q-Med AI Studio</h2>
          <span className="badge-sih">SIH 2026 PS 139</span>
        </div>
      </div>

      <div className="active-dataset-pill">
        <span className="pill-label">Active Dataset:</span>
        <span className="pill-value">{displayName}</span>
      </div>

      <nav className="nav-menu">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeHub === item.id ? 'active' : ''}`}
            onClick={() => setActiveHub(item.id)}
            style={{ position: 'relative' }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span className="badge-sih" style={{ marginLeft: 'auto', fontSize: '0.62rem', background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent-pink)', borderColor: 'rgba(236, 72, 153, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Radio size={10} className="pulse-btn" /> {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="quantum-status">
          <span className="status-dot"></span> PennyLane QML Simulator
        </div>
      </div>
    </aside>
  );
}
