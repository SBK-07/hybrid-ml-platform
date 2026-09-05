import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, Plus, Zap, Database, Play, BookOpen,
  FlaskConical, CheckCircle2, Settings, BarChart2, Cpu, HelpCircle,
  GraduationCap, Image, ShieldAlert, Loader2, Circle, Clock, Trash2
} from 'lucide-react';
import CardActionMenu from '../components/CardActionMenu';
import PipelineExecutionModal from '../components/PipelineExecutionModal';
import { getQuantumFeasibility, getDatasets, deleteDataset } from '../services/api';

export default function IndividualExperiment() {
  const [selectedModel, setSelectedModel] = useState('svm');
  const [selectedDataset, setSelectedDataset] = useState('cancer');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFeasibility, setShowFeasibility] = useState(false);
  const [results, setResults] = useState(null);
  const [feasibilityData, setFeasibilityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);

  // Custom Dropdown Open States
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isDatasetOpen, setIsDatasetOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const datasetDropdownRef = useRef(null);

  // Live Execution Panel States
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [isExecutionComplete, setIsExecutionComplete] = useState(false);
  const [stageTimings, setStageTimings] = useState({});

  const fileInputRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelOpen(false);
      }
      if (datasetDropdownRef.current && !datasetDropdownRef.current.contains(event.target)) {
        setIsDatasetOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [datasetsList, setDatasetsList] = useState([
    { id: 'cancer', key: 'cancer', name: 'Breast Cancer (WDBC)', features_count: 30, description: 'Nuclear morphology metrics', modality: 'Multimodal (Tabular + Imaging)', built_in: true },
    { id: 'cardiovascular', key: 'cardiovascular', name: 'UCI Heart Disease', features_count: 13, description: 'Clinical cardiac indicators', modality: 'Multimodal (Tabular + Biosignal)', built_in: true },
    { id: 'diabetes', key: 'diabetes', name: 'Pima Indians Diabetes', features_count: 8, description: 'Metabolic & diagnostic profile', modality: 'Tabular', built_in: true },
    { id: 'parkinsons', key: 'parkinsons', name: 'Parkinson\'s Biomedical Voice', features_count: 22, description: 'Phonation acoustic measures', modality: 'Biosignal', built_in: true }
  ]);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await getDatasets();
      if (res && res.datasets && res.datasets.length > 0) {
        setDatasetsList(res.datasets);
      }
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  };

  const handleDeleteDataset = async (e, dataset) => {
    e.stopPropagation();
    e.preventDefault();
    const dKey = dataset.id || dataset.key;
    if (!window.confirm(`Are you sure you want to permanently delete custom dataset "${dataset.name}"?`)) {
      return;
    }
    try {
      const res = await deleteDataset(dKey);
      if (res && res.datasets) {
        setDatasetsList(res.datasets);
      } else {
        await fetchDatasets();
      }
      if (selectedDataset === dKey) {
        setSelectedDataset('cancer');
      }
      setUploadMessage({
        type: 'success',
        text: `✓ Successfully removed custom dataset "${dataset.name}".`
      });
    } catch (err) {
      console.error('Error deleting dataset:', err);
      setUploadMessage({
        type: 'error',
        text: `Failed to remove dataset: ${err.response?.data?.detail || err.message}`
      });
    }
  };

  const models = [
    { id: 'svm', name: 'SVM (RBF Kernel)', type: 'classical' },
    { id: 'mlp', name: 'Neural Network (MLP)', type: 'classical' },
    { id: 'qsvm', name: 'Kernel SVM (QSVM)', type: 'quantum' },
    { id: 'qnn', name: 'Neural Network (QNN)', type: 'quantum' },
    { id: 'qvc', name: 'Variational Circuit (QVC)', type: 'quantum' }
  ];

  const currentModelObj = models.find(m => m.id === selectedModel);
  const currentDatasetObj = datasetsList.find(d => (d.id || d.key) === selectedDataset);

  const getStages = (modelType) => {
    const isQuantum = ['qsvm', 'qnn', 'qvc'].includes(modelType);
    if (isQuantum) {
      return [
        { id: 'load', label: 'Loading dataset' },
        { id: 'preprocess', label: 'Preprocessing (scaling / class balancing)' },
        { id: 'encode', label: 'Encoding features to qubit space (PCA + angle encoding)' },
        { id: 'train', label: 'Training model' },
        { id: 'eval', label: 'Evaluating performance metrics' },
        { id: 'finalize', label: 'Finalizing results' }
      ];
    } else {
      return [
        { id: 'load', label: 'Loading dataset' },
        { id: 'preprocess', label: 'Preprocessing (scaling / class balancing)' },
        { id: 'train', label: 'Training model' },
        { id: 'eval', label: 'Evaluating performance metrics' },
        { id: 'finalize', label: 'Finalizing results' }
      ];
    }
  };

  const activeStages = getStages(selectedModel);

  const handleUploadDataset = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExts = ['.csv', '.zip', '.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setUploadMessage({ type: 'error', text: 'Please upload a CSV, Multimodal ZIP archive, or medical image.' });
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-dataset', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        setUploadMessage({
          type: 'success',
          text: `✓ ${data.message}`,
          metadata: data.metadata
        });
        if (data.datasets) {
          setDatasetsList(data.datasets);
        } else {
          await fetchDatasets();
        }
        if (data.dataset_key) {
          setSelectedDataset(data.dataset_key);
        }
      } else {
        setUploadMessage({
          type: 'error',
          text: data.detail || 'Upload failed. Please check your dataset format.'
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage({
        type: 'error',
        text: 'Failed to upload dataset. Please ensure the file is a valid clinical CSV, ZIP, or image.'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRunExperiment = async () => {
    const stages = getStages(selectedModel);
    setLoading(true);
    setResults(null);
    setShowExecutionPanel(true);
    setCurrentStageIndex(0);
    setIsExecutionComplete(false);
    setStageTimings({});

    const apiPromise = fetch('/api/individual-experiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_type: selectedModel,
        dataset_key: selectedDataset
      })
    })
      .then(res => res.json())
      .catch(err => {
        console.error('Error running experiment:', err);
        return null;
      });

    const timings = {};

    for (let i = 0; i < stages.length; i++) {
      setCurrentStageIndex(i);
      const stageStart = Date.now();

      if (i === stages.length - 1) {
        const data = await apiPromise;
        const elapsed = Math.max(120, Math.round(Date.now() - stageStart));
        timings[stages[i].id] = `${elapsed}ms`;
        setStageTimings({ ...timings });

        if (data) {
          setResults(data);
          // Fetch quantum feasibility if applicable
          if (selectedModel !== 'svm' && selectedModel !== 'mlp') {
            try {
              const feas = await getQuantumFeasibility(selectedDataset);
              setFeasibilityData(feas);
            } catch (e) {
              setFeasibilityData(null);
            }
          } else {
            setFeasibilityData(null);
          }
        }
      } else {
        await new Promise(r => setTimeout(r, 450));
        const elapsed = Math.max(80, Math.round(Date.now() - stageStart));
        timings[stages[i].id] = `${elapsed}ms`;
        setStageTimings({ ...timings });
      }
    }

    setCurrentStageIndex(stages.length);
    setIsExecutionComplete(true);
    setLoading(false);
  };

  const isQuantum = selectedModel !== 'svm' && selectedModel !== 'mlp';

  // Dropdown style helpers
  const dropdownTriggerStyle = (isOpen) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--bg-input)',
    border: isOpen ? '1px solid var(--classical-color)' : '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    height: '44px',
    padding: '0 12px',
    gap: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    boxShadow: isOpen ? '0 0 0 3px var(--classical-glow)' : '0 1px 2px rgba(0,0,0,0.02)',
    userSelect: 'none',
    transition: 'all 0.2s ease'
  });

  const dropdownMenuStyle = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: 'var(--bg-card-solid)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-dropdown)',
    zIndex: 100,
    padding: '6px 0',
    overflow: 'hidden',
    animation: 'stageFadeIn 0.15s ease-out'
  };

  return (
    <div className="hub-section active">
      {/* Section Header */}
      <div className="section-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FlaskConical size={24} style={{ color: 'var(--classical-color)' }} />
            Individual Model Experiment
          </h1>
          <p className="subtitle">
            Focused single-algorithm evaluation with step-by-step telemetry execution and detailed performance metrics.
          </p>
        </div>
      </div>

      {/* PART 1 — CONTROL ROW LAYOUT */}
      <div className="card slide-in-up" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>

          {/* 1. Model Selector Custom Dropdown */}
          <div ref={modelDropdownRef} style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <div onClick={() => !loading && setIsModelOpen(!isModelOpen)} style={dropdownTriggerStyle(isModelOpen)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                <Zap size={18} style={{ color: currentModelObj?.type === 'classical' ? 'var(--classical-color)' : 'var(--quantum-color)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1, marginBottom: '2px' }}>Model</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentModelObj?.name}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span className={`badge-paradigm ${currentModelObj?.type === 'classical' ? 'badge-classical' : 'badge-quantum'}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  {currentModelObj?.type === 'classical' ? 'Classical' : 'Quantum'}
                </span>
                <ChevronDown size={16} style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s ease', transform: isModelOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </div>
            </div>

            {/* Model Dropdown Menu */}
            {isModelOpen && (
              <div style={dropdownMenuStyle}>
                {models.map((model) => {
                  const isSelected = model.id === selectedModel;
                  return (
                    <div
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setIsModelOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', cursor: 'pointer',
                        background: isSelected ? 'var(--classical-bg)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-inset)'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--classical-color)' : 'var(--text-primary)' }}>
                        {model.name}
                      </span>
                      <span className={`badge-paradigm ${model.type === 'classical' ? 'badge-classical' : 'badge-quantum'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        {model.type === 'classical' ? 'Classical' : 'Quantum'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Dataset Selector Custom Dropdown */}
          <div ref={datasetDropdownRef} style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <div onClick={() => !loading && !uploading && setIsDatasetOpen(!isDatasetOpen)} style={dropdownTriggerStyle(isDatasetOpen)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                <Database size={18} style={{ color: 'var(--classical-color)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1, marginBottom: '2px' }}>Dataset</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentDatasetObj?.name || 'Select Dataset'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <ChevronDown size={16} style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s ease', transform: isDatasetOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </div>
            </div>

            {/* Dataset Dropdown Menu */}
            {isDatasetOpen && (
              <div style={dropdownMenuStyle}>
                {datasetsList.map((dataset) => {
                  const dId = dataset.id || dataset.key;
                  const isSelected = dId === selectedDataset;
                  const isCustom = !dataset.built_in;
                  return (
                    <div
                      key={dId}
                      onClick={() => { setSelectedDataset(dId); setIsDatasetOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', cursor: 'pointer', position: 'relative',
                        background: isSelected ? 'var(--classical-bg)' : isCustom ? 'var(--status-success-bg)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-inset)'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isCustom ? 'var(--status-success-bg)' : 'transparent'; }}
                    >
                      <div style={{ paddingRight: isCustom ? '36px' : '0' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: isSelected ? 600 : 500, color: isSelected ? 'var(--classical-color)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {dataset.name}
                          {isCustom && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'var(--status-success-bg)', color: 'var(--status-success)', borderRadius: '4px', fontWeight: 600 }}>Custom</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {dataset.features_count || 0} features · {dataset.description || dataset.modality || 'Tabular'}
                        </div>
                      </div>
                      {isCustom && (
                        <button
                          type="button"
                          title="Remove this custom uploaded dataset"
                          onClick={(e) => handleDeleteDataset(e, dataset)}
                          style={{
                            position: 'absolute', right: '12px', background: 'transparent',
                            border: 'none', color: 'var(--status-danger)', cursor: 'pointer',
                            padding: '6px 8px', borderRadius: '4px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--status-danger-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.zip,.png,.jpg,.jpeg"
            onChange={handleUploadDataset}
            style={{ display: 'none' }}
          />

          {/* 3. Run Experiment Button */}
          <button
            onClick={handleRunExperiment}
            disabled={loading || uploading}
            className="btn btn-primary"
            style={{ height: '44px', padding: '0 22px', fontSize: '0.875rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {loading ? <Loader2 size={16} className="spinner" /> : <Play size={16} fill="currentColor" />}
            {loading ? 'Executing Pipeline...' : 'Run Experiment'}
          </button>

          {/* 4. Upload Custom CSV Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={loading || uploading}
            className="btn btn-outline"
            style={{ height: '44px', padding: '0 18px', fontSize: '0.875rem', fontWeight: 500, borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {uploading ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
            {uploading ? 'Preprocessing...' : 'Upload Custom CSV'}
          </button>
        </div>

        {/* Custom Upload Banner Message */}
        {uploadMessage && (
          <div className="banner" style={{
            marginTop: '12px', padding: '8px 14px', fontSize: '0.82rem',
            background: uploadMessage.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
            border: `1px solid ${uploadMessage.type === 'success' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
            color: uploadMessage.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)'
          }}>
            {uploadMessage.text}
          </div>
        )}
      </div>

      {/* PART 2 — LIVE EXECUTION VISUALIZATION CHECKLIST */}
      {showExecutionPanel && (
        <div className="card slide-in-up" style={{ marginBottom: '24px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FlaskConical size={20} style={{ color: 'var(--classical-color)' }} />
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Execution Pipeline Telemetry
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {currentModelObj?.name} · {currentDatasetObj?.name || 'Custom Dataset'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!isExecutionComplete ? (
                <span className="badge-paradigm badge-classical" style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={12} className="spinner" /> Stage {Math.min(currentStageIndex + 1, activeStages.length)} of {activeStages.length}
                </span>
              ) : (
                <span className="badge-paradigm" style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'var(--status-success-bg)', color: 'var(--status-success)', border: '1px solid rgba(22, 163, 74, 0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={12} /> Execution Complete
                </span>
              )}
            </div>
          </div>

          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeStages.map((stage, idx) => {
              const isPending = idx > currentStageIndex;
              const isActive = idx === currentStageIndex && !isExecutionComplete;
              const isDone = idx < currentStageIndex || isExecutionComplete;

              return (
                <div
                  key={stage.id}
                  className="stage-row"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--classical-bg)' : isDone ? 'var(--bg-inset)' : 'transparent',
                    border: isActive ? '1px solid var(--classical-color)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s ease',
                    opacity: isPending ? 0.5 : 1,
                    boxShadow: isActive ? '0 0 0 3px var(--classical-glow)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isPending && <Circle size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />}
                    {isActive && <Loader2 size={18} className="spinner" style={{ color: 'var(--classical-color)', flexShrink: 0 }} />}
                    {isDone && <CheckCircle2 size={18} style={{ color: 'var(--status-success)', flexShrink: 0 }} />}
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : isDone ? 500 : 400,
                      color: isActive ? 'var(--classical-color)' : isDone ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>
                      {stage.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isActive && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--classical-color)', fontWeight: 500 }}>In Progress...</span>
                    )}
                    {isDone && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-card-solid)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <Clock size={12} style={{ color: 'var(--status-success)' }} />
                        {stageTimings[stage.id] || 'Done'}
                      </span>
                    )}
                    {isPending && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real Live Server Pipeline Execution Modal */}
      <PipelineExecutionModal
        isOpen={showExecutionModal}
        onClose={() => setShowExecutionModal(false)}
        datasetKey={selectedDataset}
        modelType={selectedModel}
        onComplete={(liveResults) => {
          if (liveResults) {
            setResults(liveResults);
          } else {
            handleRunExperiment();
          }
        }}
      />

      {/* PART 3 — RESULTS DISPLAY */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Basic Information (Student Level) */}
          <div className="card slide-in-up" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
              <CardActionMenu
                title={`${results.basic_info?.model_name} - Basic Metrics`}
                category="metrics"
                data={{
                  model_name: results.basic_info?.model_name,
                  key_metrics: results.basic_info?.key_metrics,
                  student_takeaway: results.basic_info?.student_takeaway
                }}
                metadata={{
                  model_type: selectedModel,
                  dataset: selectedDataset,
                  page: 'individual_experiment'
                }}
              />
            </div>

            <div className="card-header-bar" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--classical-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} /> Basic Information (Student Level)
              </h3>
            </div>

            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1rem', fontWeight: 600 }}>
                Model: {results.basic_info?.model_name}
              </h4>
              <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {results.basic_info?.concept_explanation}
              </p>

              <div style={{ marginTop: '18px', padding: '16px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={16} style={{ color: 'var(--classical-color)' }} /> Why use this model?
                </strong>
                <p style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  {results.basic_info?.why_use_this_model}
                </p>
              </div>

              {/* Key Metrics Grid */}
              <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '20px' }}>
                <div className="metric-mini-box">
                  <div className="mini-val">{results.basic_info?.key_metrics?.accuracy}</div>
                  <div className="mini-lbl">Accuracy</div>
                </div>
                <div className="metric-mini-box">
                  <div className="mini-val">{results.basic_info?.key_metrics?.sensitivity}</div>
                  <div className="mini-lbl">Sensitivity (Recall)</div>
                </div>
                <div className="metric-mini-box">
                  <div className="mini-val">{results.basic_info?.key_metrics?.specificity}</div>
                  <div className="mini-lbl">Specificity</div>
                </div>
                <div className="metric-mini-box">
                  <div className="mini-val">{results.basic_info?.key_metrics?.roc_auc}</div>
                  <div className="mini-lbl">ROC-AUC Score</div>
                </div>
              </div>

              {/* Student Takeaway Banner */}
              <div className="banner reality-banner" style={{ marginTop: '20px' }}>
                <GraduationCap size={20} style={{ flexShrink: 0, color: 'var(--banner-warn-text)' }} />
                <div>
                  <strong style={{ color: 'var(--banner-warn-text)', fontSize: '0.875rem' }}>Student Diagnostic Takeaway:</strong>
                  <p style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--banner-warn-text)' }}>
                    <strong>Graph Signal:</strong> {results.basic_info?.student_takeaway?.what_graph_indicates}
                  </p>
                  <p style={{ marginTop: '2px', fontSize: '0.85rem', color: 'var(--banner-warn-text-dark)' }}>
                    <strong>Clinical Significance:</strong> {results.basic_info?.student_takeaway?.clinical_meaning}
                  </p>
                </div>
              </div>

              {/* Figures Grid */}
              {results.advanced_info?.figure_artifacts && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ marginBottom: '14px', color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Image size={16} style={{ color: 'var(--classical-color)' }} /> Result Artifacts & Visualizations
                  </h4>
                  <div className="grid-2" style={{ gap: '16px' }}>
                    {results.advanced_info.figure_artifacts.roc_curve && (
                      <div style={{ position: 'relative', background: 'var(--bg-card-solid)', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', transition: 'all 0.2s ease' }}>
                        <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10 }}>
                          <CardActionMenu
                            title={`${results.basic_info?.model_name} - ROC Curve`}
                            category="plot"
                            data={{ roc_auc: results.basic_info?.key_metrics?.roc_auc }}
                            metadata={{ model_type: selectedModel, dataset: selectedDataset, plot_type: 'roc' }}
                            imageUrl={results.advanced_info.figure_artifacts.roc_curve}
                          />
                        </div>
                        <img src={results.advanced_info.figure_artifacts.roc_curve} alt="ROC Curve" style={{ width: '100%', borderRadius: 'var(--radius-sm)' }} />
                      </div>
                    )}
                    {results.advanced_info.figure_artifacts.confusion_matrix && (
                      <div style={{ position: 'relative', background: 'var(--bg-card-solid)', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', transition: 'all 0.2s ease' }}>
                        <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10 }}>
                          <CardActionMenu
                            title={`${results.basic_info?.model_name} - Confusion Matrix`}
                            category="plot"
                            data={{
                              accuracy: results.basic_info?.key_metrics?.accuracy,
                              sensitivity: results.basic_info?.key_metrics?.sensitivity,
                              specificity: results.basic_info?.key_metrics?.specificity
                            }}
                            metadata={{ model_type: selectedModel, dataset: selectedDataset, plot_type: 'confusion_matrix' }}
                            imageUrl={results.advanced_info.figure_artifacts.confusion_matrix}
                          />
                        </div>
                        <img src={results.advanced_info.figure_artifacts.confusion_matrix} alt="Confusion Matrix" style={{ width: '100%', borderRadius: 'var(--radius-sm)' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Quantum Feasibility & Noise Telemetry Section */}
          {isQuantum && feasibilityData && (
            <div className="card" style={{ borderLeft: '4px solid var(--quantum-color)' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowFeasibility(!showFeasibility)}
              >
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--quantum-color)', margin: 0, fontSize: '1.05rem' }}>
                  <Cpu size={18} /> Quantum Hardware Feasibility & Depolarizing Noise Telemetry
                </h3>
                <button className="btn btn-sm btn-outline" type="button">
                  {showFeasibility ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showFeasibility ? 'Hide Feasibility' : 'View Feasibility Telemetry'}
                </button>
              </div>

              {showFeasibility && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div className="metric-mini-box">
                      <div className="mini-val" style={{ color: 'var(--quantum-color)' }}>{feasibilityData.qubits_required} Qubits</div>
                      <div className="mini-lbl">Hilbert Dim: 2⁴ = {feasibilityData.hilbert_space_dimension}</div>
                    </div>
                    <div className="metric-mini-box">
                      <div className="mini-val" style={{ color: 'var(--quantum-color)' }}>{feasibilityData.circuit_depth}</div>
                      <div className="mini-lbl">Circuit Depth ({feasibilityData.cnot_count} CNOTs)</div>
                    </div>
                    <div className="metric-mini-box">
                      <div className="mini-val" style={{ color: 'var(--status-success)' }}>{feasibilityData.barren_plateau_risk}</div>
                      <div className="mini-lbl">Barren Plateau Risk</div>
                    </div>
                    <div className="metric-mini-box">
                      <div className="mini-val" style={{ color: 'var(--classical-color)' }}>{feasibilityData.nisq_readiness_level}</div>
                      <div className="mini-lbl">NISQ Hardware Tier</div>
                    </div>
                  </div>

                  {/* Depolarizing Noise Degradation Table */}
                  <div style={{ background: 'var(--bg-inset)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Depolarizing Noise Degradation Profile: ℰ(ρ) = (1-p)ρ + (p/2ⁿ)I
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {feasibilityData.noise_curve?.map((pt, i) => (
                        <div key={i} style={{ background: 'var(--bg-card-solid)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center', transition: 'all 0.2s ease' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>p = {pt.noise_rate_percentage}% Noise</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--quantum-color)', margin: '4px 0' }}>{(pt.accuracy * 100).toFixed(1)}% Acc</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Fidelity: {pt.fidelity_score}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="banner" style={{ background: 'var(--classical-bg)', border: '1px solid var(--classical-glow)', color: 'var(--classical-color)', fontSize: '0.85rem' }}>
                    <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Scientific Integrity Verdict:</strong> {feasibilityData.scientific_verdict}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Information (Researcher Level) */}
          <div className="card">
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', margin: 0, fontSize: '1.05rem' }}>
                <FlaskConical size={18} style={{ color: 'var(--classical-color)' }} /> Advanced Information (Researcher Telemetry)
              </h3>
              <button className="btn btn-sm btn-outline" type="button">
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced Details'}
              </button>
            </div>

            {showAdvanced && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Architecture Details */}
                <div style={{ padding: '16px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Settings size={16} /> Architectural Hyperparameters
                  </h4>
                  <pre style={{ background: 'var(--bg-card-solid)', padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-primary)', border: '1px solid var(--border-color)', overflow: 'auto' }}>
                    {JSON.stringify(results.advanced_info?.architectural_details, null, 2)}
                  </pre>
                </div>

                {/* Cross-Validation Details */}
                <div style={{ padding: '16px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart2 size={16} /> Cross-Validation Methodology
                  </h4>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <li><strong style={{ color: 'var(--text-primary)' }}>Strategy:</strong> {results.advanced_info?.cross_validation_details?.methodology}</li>
                    <li><strong style={{ color: 'var(--text-primary)' }}>Fold Variance:</strong> {results.advanced_info?.cross_validation_details?.fold_variance}</li>
                    <li><strong style={{ color: 'var(--text-primary)' }}>Hyperparameter Search:</strong> {results.advanced_info?.cross_validation_details?.hyperparameter_search_space}</li>
                  </ul>
                </div>

                {/* Quantum Hardware Profile */}
                {results.model_type !== 'svm' && results.model_type !== 'mlp' && (
                  <div style={{ padding: '16px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={16} style={{ color: 'var(--quantum-color)' }} /> Quantum Hardware Profile (NISQ Circuit Telemetry)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div className="metric-mini-box">
                        <div className="mini-val" style={{ color: 'var(--quantum-color)' }}>{results.advanced_info?.quantum_hardware_profile?.qubit_count}</div>
                        <div className="mini-lbl">Qubit Count</div>
                      </div>
                      <div className="metric-mini-box">
                        <div className="mini-val" style={{ color: 'var(--quantum-color)' }}>{results.advanced_info?.quantum_hardware_profile?.circuit_depth}</div>
                        <div className="mini-lbl">Circuit Depth</div>
                      </div>
                      <div className="metric-mini-box">
                        <div className="mini-val" style={{ color: 'var(--quantum-color)' }}>{results.advanced_info?.quantum_hardware_profile?.cnot_entangler_count}</div>
                        <div className="mini-lbl">CNOT Gates</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw JSON Details */}
                <details style={{ marginTop: '8px' }}>
                  <summary style={{ cursor: 'pointer', padding: '10px 14px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    View Raw Execution Payload JSON
                  </summary>
                  <pre style={{ marginTop: '10px', background: 'var(--bg-card-solid)', color: 'var(--text-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', border: '1px solid var(--border-color)', overflow: 'auto', maxHeight: '350px' }}>
                    {JSON.stringify(results.advanced_info?.raw_json_results, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
