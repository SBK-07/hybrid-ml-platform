import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ModelStudioHub from './components/ModelStudioHub';
import DatasetsHub from './components/DatasetsHub';
import ModelLibraryHub from './components/ModelLibraryHub';
import SingleSampleInferenceHub from './components/SingleSampleInferenceHub';
import UploadModal from './components/UploadModal';
import ModelDetailModal from './components/ModelDetailModal';
import DataPreviewModal from './components/DataPreviewModal';

import {
  getDatasets,
  preprocessDataset,
  trainModels,
  getExplainability,
  predictPatient,
  uploadDataset
} from './services/api';

export default function App() {
  const [activeHub, setActiveHub] = useState('studio');
  const [activeDataset, setActiveDataset] = useState('heart.csv');
  const [datasetsList, setDatasetsList] = useState([]);
  
  const [benchmarkTable, setBenchmarkTable] = useState([]);
  const [shapImportances, setShapImportances] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [realityCheck, setRealityCheck] = useState({});

  const [trainedModelRuns, setTrainedModelRuns] = useState([]);
  const [featureNames, setFeatureNames] = useState([]);
  const [samplePreviewData, setSamplePreviewData] = useState([]);

  const [predictions, setPredictions] = useState(null);
  const [clinicianSummary, setClinicianSummary] = useState('');

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDatasetId, setPreviewDatasetId] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [selectedModelDetail, setSelectedModelDetail] = useState(null);

  // Initial load
  useEffect(() => {
    fetchDatasetsList();
    loadSavedModelLibrary();
  }, []);

  // Whenever active dataset changes, run preprocess to get feature names & sample preview
  useEffect(() => {
    if (activeDataset) {
      loadActiveDatasetData(activeDataset);
    }
  }, [activeDataset]);

  const fetchDatasetsList = async () => {
    try {
      const data = await getDatasets();
      if (data.datasets) {
        setDatasetsList(data.datasets);
      }
    } catch (err) {
      console.error('Error fetching datasets list:', err);
    }
  };

  const loadActiveDatasetData = async (datasetId) => {
    try {
      const data = await preprocessDataset(datasetId, 4, true);
      setFeatureNames(data.feature_names || []);
      setSamplePreviewData(data.sample_preview || []);
    } catch (err) {
      console.error('Error preprocessing dataset:', err);
    }
  };

  const loadSavedModelLibrary = () => {
    const stored = localStorage.getItem('qmed_model_library');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored records are old format (individual model cards), migrate to session cards
          if (parsed[0].model && !parsed[0].models) {
            const migratedRun = {
              id: 'session_migrated_1',
              runTitle: 'UCI Heart Disease Benchmark Run',
              datasetId: 'heart.csv',
              datasetName: 'UCI Heart Disease (13 Clinical Features)',
              savedAt: 'Initial Run',
              modelsCount: parsed.length,
              topModelName: 'XGBoost',
              topAccuracy: 100,
              topAuc: 1.0,
              topCategory: 'Classical',
              models: parsed,
              featureImportances: parsed[0].featureImportances || []
            };
            setTrainedModelRuns([migratedRun]);
            localStorage.setItem('qmed_model_library', JSON.stringify([migratedRun]));
            return;
          }
          setTrainedModelRuns(parsed);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Default Seed Run Session
    const seedSession = [
      {
        id: 'session_seed_heart',
        runTitle: 'UCI Heart Disease Benchmark Run',
        datasetId: 'heart.csv',
        datasetName: 'UCI Heart Disease (13 Clinical Features)',
        savedAt: new Date().toLocaleString(),
        modelsCount: 7,
        topModelName: 'XGBoost',
        topAccuracy: 100,
        topAuc: 1.0,
        topCategory: 'Classical',
        models: [
          { model: 'Logistic Regression', category: 'Classical', accuracy: 94.98, sensitivity: 93.82, specificity: 96.14, precision: 96.05, f1_score: 94.92, auc_roc: 0.9909, train_time_sec: 0.141 },
          { model: 'Random Forest', category: 'Classical', accuracy: 99.23, sensitivity: 99.23, specificity: 99.23, precision: 99.23, f1_score: 99.23, auc_roc: 0.9998, train_time_sec: 0.25 },
          { model: 'SVM (RBF)', category: 'Classical', accuracy: 98.26, sensitivity: 97.3, specificity: 99.23, precision: 99.21, f1_score: 98.25, auc_roc: 0.9994, train_time_sec: 0.101 },
          { model: 'XGBoost', category: 'Classical', accuracy: 100, sensitivity: 100, specificity: 100, precision: 100, f1_score: 100, auc_roc: 1.0, train_time_sec: 0.365 },
          { model: 'QSVM (Quantum Kernel)', category: 'Quantum', accuracy: 92.66, sensitivity: 90.35, specificity: 94.98, precision: 94.74, f1_score: 92.49, auc_roc: 0.9779, train_time_sec: 0.093 },
          { model: 'VQC (Variational Quantum)', category: 'Quantum', accuracy: 50.19, sensitivity: 89.58, specificity: 10.81, precision: 50.11, f1_score: 64.27, auc_roc: 0.5219, train_time_sec: 7.165 },
          { model: 'Hybrid Fusion (Classical + QML)', category: 'Hybrid', accuracy: 95.75, sensitivity: 94.59, specificity: 96.91, precision: 96.84, f1_score: 95.70, auc_roc: 0.9966, train_time_sec: 0.05 }
        ],
        featureImportances: [
          { feature: 'cp', importance: 28.5 },
          { feature: 'oldpeak', importance: 22.1 },
          { feature: 'age', importance: 18.4 },
          { feature: 'thalach', importance: 16.2 }
        ]
      }
    ];
    setTrainedModelRuns(seedSession);
  };

  const handleTrainPipeline = async () => {
    setIsTraining(true);
    try {
      const trainData = await trainModels();
      setBenchmarkTable(trainData.benchmark_table || []);
      setRealityCheck(trainData.reality_check || {});

      // Fetch SHAP feature importances
      const shapData = await getExplainability();
      setShapImportances(shapData.feature_importances || []);
    } catch (err) {
      console.error('Error training models:', err);
      alert('Training failed. Check backend logs.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleSaveToLibrary = () => {
    if (benchmarkTable.length === 0) return;

    const dsObj = datasetsList.find(d => d.id === activeDataset);
    const dsName = dsObj ? dsObj.name : activeDataset;

    // Find top performing model by accuracy
    const sorted = [...benchmarkTable].sort((a, b) => b.accuracy - a.accuracy);
    const topModel = sorted[0];

    const runSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      runTitle: `${dsName} Benchmark Run`,
      datasetId: activeDataset,
      datasetName: dsName,
      savedAt: new Date().toLocaleString(),
      modelsCount: benchmarkTable.length,
      topModelName: topModel ? topModel.model : 'Hybrid Ensemble',
      topAccuracy: topModel ? topModel.accuracy : 0,
      topAuc: topModel ? topModel.auc_roc : 0,
      topCategory: topModel ? topModel.category : 'Hybrid',
      models: benchmarkTable,
      featureImportances: shapImportances
    };

    const updated = [runSession, ...trainedModelRuns];
    setTrainedModelRuns(updated);
    localStorage.setItem('qmed_model_library', JSON.stringify(updated));
  };

  const handleRunPredict = async (patientData) => {
    try {
      const res = await predictPatient(patientData);
      setPredictions(res.predictions);
      setClinicianSummary(res.clinician_summary);
    } catch (err) {
      console.error('Prediction error:', err);
      alert('Error running inference. Ensure models are trained first in Model Studio.');
    }
  };

  const handleOpenPreviewModal = async (datasetId) => {
    try {
      const data = await preprocessDataset(datasetId, 4, false);
      setPreviewDatasetId(datasetId);
      setPreviewData(data.sample_preview || []);
    } catch (err) {
      console.error('Failed to preview dataset:', err);
    }
  };

  const handleUploadSuccess = async (file) => {
    const res = await uploadDataset(file);
    await fetchDatasetsList();
    if (res.dataset && res.dataset.id) {
      setActiveDataset(res.dataset.id);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeHub={activeHub}
        setActiveHub={setActiveHub}
        activeDataset={activeDataset}
        datasetsList={datasetsList}
      />

      <main className="main-content">
        {activeHub === 'studio' && (
          <ModelStudioHub
            activeDataset={activeDataset}
            setActiveDataset={setActiveDataset}
            datasetsList={datasetsList}
            onTrainPipeline={handleTrainPipeline}
            benchmarkTable={benchmarkTable}
            shapImportances={shapImportances}
            isTraining={isTraining}
            realityCheck={realityCheck}
            onSaveToLibrary={handleSaveToLibrary}
          />
        )}

        {activeHub === 'datasets' && (
          <DatasetsHub
            datasetsList={datasetsList}
            activeDataset={activeDataset}
            onSelectDataset={setActiveDataset}
            onOpenPreviewModal={handleOpenPreviewModal}
            onOpenUploadModal={() => setUploadModalOpen(true)}
          />
        )}

        {activeHub === 'library' && (
          <ModelLibraryHub
            trainedModelRuns={trainedModelRuns}
            onOpenDetailModal={setSelectedModelDetail}
          />
        )}

        {activeHub === 'inference' && (
          <SingleSampleInferenceHub
            activeDataset={activeDataset}
            datasetsList={datasetsList}
            featureNames={featureNames}
            samplePreviewRow={samplePreviewData[0]}
            onRunPredict={handleRunPredict}
            predictions={predictions}
            clinicianSummary={clinicianSummary}
          />
        )}
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <ModelDetailModal
        run={selectedModelDetail}
        onClose={() => setSelectedModelDetail(null)}
      />

      <DataPreviewModal
        datasetId={previewDatasetId}
        previewData={previewData}
        onClose={() => setPreviewDatasetId(null)}
      />
    </div>
  );
}
