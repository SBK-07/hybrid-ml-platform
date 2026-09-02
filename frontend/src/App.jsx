import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import DatasetSelector from './components/DatasetSelector';
import OverviewSection from './components/OverviewSection';
import WorkflowSection from './components/WorkflowSection';
import ClassicalSection from './components/ClassicalSection';
import QuantumSection from './components/QuantumSection';
import ComparisonSection from './components/ComparisonSection';
import VisualGallerySection from './components/VisualGallerySection';
import LiveInferenceSection from './components/LiveInferenceSection';
import ConclusionsSection from './components/ConclusionsSection';

import { getClassicalReport, getQuantumReport } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeDataset, setActiveDataset] = useState('cancer');
  const [classicalData, setClassicalData] = useState(null);
  const [quantumData, setQuantumData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const classRes = await getClassicalReport(activeDataset);
        setClassicalData(classRes);
        const quantRes = await getQuantumReport(activeDataset);
        setQuantumData(quantRes);
      } catch (err) {
        console.error('Failed to load metrics:', err);
      }
    }
    fetchData();
  }, [activeDataset]);

  return (
    <div className="container">
      {/* Header */}
      <Header />

      {/* Dataset Selection Bar */}
      <DatasetSelector
        activeDataset={activeDataset}
        setActiveDataset={setActiveDataset}
      />

      {/* Sticky Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Tab Sections */}
      {activeTab === 'overview' && (
        <OverviewSection activeDataset={activeDataset} />
      )}

      {activeTab === 'workflow' && (
        <WorkflowSection />
      )}

      {activeTab === 'classical' && (
        <ClassicalSection activeDataset={activeDataset} classicalData={classicalData} />
      )}

      {activeTab === 'quantum' && (
        <QuantumSection activeDataset={activeDataset} quantumData={quantumData} />
      )}

      {activeTab === 'comparison' && (
        <ComparisonSection />
      )}

      {activeTab === 'visuals' && (
        <VisualGallerySection activeDataset={activeDataset} />
      )}

      {activeTab === 'inference' && (
        <LiveInferenceSection activeDataset={activeDataset} />
      )}

      {activeTab === 'conclusions' && (
        <ConclusionsSection />
      )}

      {/* Footer */}
      <div className="footer">
        <p>SIH 2026 PS 139 - Hybrid Quantum-Classical ML Platform for Early Disease Detection</p>
        <p>Built with React, Vite, Scikit-learn, Qiskit, and Qiskit Machine Learning</p>
      </div>
    </div>
  );
}
