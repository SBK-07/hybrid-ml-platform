import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Microscope, BarChart3, Activity, FileText, Bot } from 'lucide-react';

// Import the 5 main pages
import IndividualExperiment from './pages/IndividualExperiment';
import CumulativeExperiment from './pages/CumulativeExperiment';
import LivePatientInference from './pages/LivePatientInference';
import AdaptiveReport from './pages/AdaptiveReport';
import QuddosAI from './pages/QuddosAI';

// Import floating button component
import FloatingQuddosButton from './components/FloatingQuddosButton';

export default function App() {
  return (
    <Router>
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1>🔬 Hybrid Quantum-Classical ML Platform</h1>
          <p>Clinical Early Disease Detection & Diagnostic Intelligence System</p>
          <div className="timestamp">📅 SIH 2026 · Problem Statement 139</div>
        </div>

        {/* Navigation Bar with React Router */}
        <nav className="nav">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}
            end
          >
            <Microscope size={18} />
            Individual Experiment
          </NavLink>
          <NavLink
            to="/cumulative"
            className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}
          >
            <BarChart3 size={18} />
            Cumulative Experiment
          </NavLink>
          <NavLink
            to="/inference"
            className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}
          >
            <Activity size={18} />
            Live Patient Inference
          </NavLink>
          <NavLink
            to="/report"
            className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} />
            Adaptive Report Builder
          </NavLink>
          <NavLink
            to="/quddos"
            className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`}
          >
            <Bot size={18} />
            Quddos AI
          </NavLink>
        </nav>

        {/* Floating Quddos Button (appears on all pages except /quddos) */}
        <FloatingQuddosButton />

        {/* Main Routes */}
        <Routes>
          <Route path="/" element={<IndividualExperiment />} />
          <Route path="/cumulative" element={<CumulativeExperiment />} />
          <Route path="/inference" element={<LivePatientInference />} />
          <Route path="/report" element={<AdaptiveReport />} />
          <Route path="/quddos" element={<QuddosAI />} />
        </Routes>

        {/* Footer */}
        <div className="footer">
          <p>🎓 Educational Platform: From Students to Researchers</p>
          <p>Built with React, React Router, FastAPI, Scikit-learn, Qiskit & Qiskit Machine Learning</p>
          <p style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.8 }}>
            💡 Basic Info (📚) for conceptual learning · Advanced Info (🔬) for research-grade analysis · 🤖 Quddos AI for grounded experiment interpretation
          </p>
        </div>
      </div>
    </Router>
  );
}
