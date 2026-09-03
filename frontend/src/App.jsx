import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import OverviewSection from './components/OverviewSection';
import IndividualExperiment from './pages/IndividualExperiment';
import CumulativeExperiment from './pages/CumulativeExperiment';
import LivePatientInference from './pages/LivePatientInference';
import AdaptiveReport from './pages/AdaptiveReport';
import QuddosAI from './pages/QuddosAI';
import FloatingQuddosButton from './components/FloatingQuddosButton';

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    switch (location.pathname) {
      case '/overview': return 'overview';
      case '/individual': return 'individual';
      case '/cumulative': return 'cumulative';
      case '/inference': return 'inference';
      case '/report': return 'report';
      case '/quddos': return 'quddos';
      default: return 'overview';
    }
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tabId) => {
    if (tabId === 'overview') navigate('/overview');
    else if (tabId === 'individual') navigate('/individual');
    else if (tabId === 'cumulative') navigate('/cumulative');
    else if (tabId === 'inference') navigate('/inference');
    else if (tabId === 'report') navigate('/report');
    else if (tabId === 'quddos') navigate('/quddos');
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<OverviewSection activeDataset="cancer" />} />
          <Route path="/overview" element={<OverviewSection activeDataset="cancer" />} />
          <Route path="/individual" element={<IndividualExperiment />} />
          <Route path="/cumulative" element={<CumulativeExperiment />} />
          <Route path="/inference" element={<LivePatientInference />} />
          <Route path="/report" element={<AdaptiveReport />} />
          <Route path="/quddos" element={<QuddosAI />} />
        </Routes>
      </main>

      <FloatingQuddosButton />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}
