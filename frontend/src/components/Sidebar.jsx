import React, { useState, useEffect } from 'react';
import { Compass, Database, Zap, BarChart3, Activity, FileText, Bot, Radio, Sun, Moon } from 'lucide-react';
import Atom4Orbits from './Atom4Orbits';

export default function Sidebar({ activeTab, setActiveTab, isBackendOnline = true }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('qmed-theme');
    return stored === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('qmed-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const navItems = [
    { id: 'overview', icon: <Compass size={18} />, label: 'Overview & Workflow' },
    { id: 'dataset-overview', icon: <Database size={18} />, label: 'Dataset Overview & EDA', badge: 'DEEP EDA' },
    { id: 'individual', icon: <Zap size={18} />, label: 'Individual Experiment' },
    { id: 'cumulative', icon: <BarChart3 size={18} />, label: 'Cumulative Benchmark' },
    { id: 'inference', icon: <Activity size={18} />, label: 'Live Patient Risk Predictor', badge: 'LIVE DEMO' },
    { id: 'report', icon: <FileText size={18} />, label: 'Adaptive Report Builder' },
    { id: 'quddos', icon: <Bot size={18} />, label: 'Quddos AI Assistant' }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo-icon" style={{ display: 'flex', alignItems: 'center' }}>
          <Atom4Orbits size={28} color="var(--classical-color)" animated />
        </div>
        <div>
          <h2>Q-Med AI Studio</h2>
        </div>
      </div>
      <div className="brand-tagline">Hybrid Quantum-Classical ML Platform</div>

      <nav className="nav-menu">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span className="badge-sih" style={{ marginLeft: 'auto', fontSize: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Radio size={9} /> {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="theme-toggle">
          <span className="theme-toggle-label">
            {isDark ? <Moon size={14} /> : <Sun size={14} />}
            <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </span>
          <label className="theme-switch">
            <input
              type="checkbox"
              checked={isDark}
              onChange={() => setIsDark(!isDark)}
            />
            <span className="theme-slider" />
          </label>
        </div>
        <div className="quantum-status">
          <span className="status-dot" style={{ backgroundColor: isBackendOnline ? 'var(--status-success)' : 'var(--status-danger)' }}></span>
          {isBackendOnline ? 'Qiskit / PennyLane Online' : 'Backend Disconnected'}
        </div>
      </div>
    </aside>
  );
}
