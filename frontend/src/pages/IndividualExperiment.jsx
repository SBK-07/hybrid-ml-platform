import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, ChevronUp, Plus, Zap, Database, Play, BookOpen, 
  FlaskConical, CheckCircle2, Settings, BarChart2, Cpu, FileCode, 
  HelpCircle, GraduationCap, Image, Loader2, Circle, Clock, Check 
} from 'lucide-react';
import CardActionMenu from '../components/CardActionMenu';

export default function IndividualExperiment() {
  const [selectedModel, setSelectedModel] = useState('svm');
  const [selectedDataset, setSelectedDataset] = useState('cancer');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  
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

  const models = [
    { id: 'svm', name: 'SVM (RBF Kernel)', type: 'classical' },
    { id: 'mlp', name: 'Neural Network (MLP)', type: 'classical' },
    { id: 'qsvm', name: 'Kernel SVM (QSVM)', type: 'quantum' },
    { id: 'qnn', name: 'Neural Network (QNN)', type: 'quantum' },
    { id: 'qvc', name: 'Variational Circuit (QVC)', type: 'quantum' }
  ];

  const datasets = [
    { id: 'cancer', name: 'Breast Cancer (WDBC)', features: 30, desc: 'Nuclear morphology metrics' },
    { id: 'cardiovascular', name: 'UCI Heart Disease', features: 13, desc: 'Clinical cardiac indicators' },
    { id: 'diabetes', name: 'Pima Indians Diabetes', features: 8, desc: 'Metabolic & diagnostic profile' },
    { id: 'parkinsons', name: 'Parkinson\'s Biomedical Voice', features: 22, desc: 'Phonation acoustic measures' }
  ];

  const currentModelObj = models.find(m => m.id === selectedModel);
  const currentDatasetObj = datasets.find(d => d.id === selectedDataset);

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

    if (!file.name.endsWith('.csv')) {
      setUploadMessage({ type: 'error', text: 'Please upload a valid CSV file.' });
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
        setSelectedDataset('custom');
      } else {
        setUploadMessage({
          type: 'error',
          text: data.detail || 'Upload failed. Please check your CSV file.'
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage({
        type: 'error',
        text: 'Failed to upload dataset. Please ensure the file is a valid clinical CSV.'
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
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          {/* 1. Model Selector Custom Dropdown */}
          <div ref={modelDropdownRef} style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <div
              onClick={() => !loading && setIsModelOpen(!isModelOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF',
                border: isModelOpen ? '1px solid var(--classical-color)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                height: '44px',
                padding: '0 12px',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                userSelect: 'none',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                <Zap size={18} style={{ color: currentModelObj?.type === 'classical' ? 'var(--classical-color)' : 'var(--quantum-color)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1, marginBottom: '2px' }}>Model</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentModelObj?.name}
                  </span>
                </div>
              </div>

              {/* Tag BEFORE Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span className={`badge-paradigm ${currentModelObj?.type === 'classical' ? 'badge-classical' : 'badge-quantum'}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  {currentModelObj?.type === 'classical' ? 'Classical' : 'Quantum'}
                </span>
                <ChevronDown size={16} style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s ease', transform: isModelOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </div>
            </div>

            {/* Model Dropdown Menu */}
            {isModelOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                zIndex: 100,
                padding: '6px 0',
                overflow: 'hidden'
              }}>
                {models.map((model) => {
                  const isSelected = model.id === selectedModel;
                  return (
                    <div
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setIsModelOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: isSelected ? '#F0F6FF' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
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
            <div
              onClick={() => !loading && !uploading && setIsDatasetOpen(!isDatasetOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF',
                border: isDatasetOpen ? '1px solid var(--classical-color)' : '1px solid var(--border-color)',
                borderRadius: '6px',
                height: '44px',
                padding: '0 12px',
                gap: '8px',
                cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                userSelect: 'none',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                <Database size={18} style={{ color: 'var(--classical-color)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1, marginBottom: '2px' }}>Dataset</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedDataset === 'custom' && uploadMessage?.metadata
                      ? `Uploaded: ${uploadMessage.metadata.filename || 'Custom Dataset'}`
                      : currentDatasetObj?.name}
                  </span>
                </div>
              </div>

              {/* Tag / Meta BEFORE Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <ChevronDown size={16} style={{ color: 'var(--text-secondary)', transition: 'transform 0.2s ease', transform: isDatasetOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </div>
            </div>

            {/* Dataset Dropdown Menu */}
            {isDatasetOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                zIndex: 100,
                padding: '6px 0',
                overflow: 'hidden'
              }}>
                {datasets.map((dataset) => {
                  const isSelected = dataset.id === selectedDataset;
                  return (
                    <div
                      key={dataset.id}
                      onClick={() => {
                        setSelectedDataset(dataset.id);
                        setIsDatasetOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: isSelected ? '#F0F6FF' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: isSelected ? 600 : 500, color: isSelected ? 'var(--classical-color)' : 'var(--text-primary)' }}>
                          {dataset.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {dataset.desc}
                        </div>
                      </div>

                    </div>
                  );
                })}

                {/* Uploaded Custom Dataset option */}
                {uploadMessage?.metadata && (
                  <div
                    onClick={() => {
                      setSelectedDataset('custom');
                      setIsDatasetOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderTop: '1px solid var(--border-color)',
                      background: selectedDataset === 'custom' ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--status-success)' }}>
                        Uploaded: {uploadMessage.metadata.filename || 'Custom Dataset'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {uploadMessage.metadata.total_features} features · {uploadMessage.metadata.total_samples} samples
                      </div>
                    </div>
                    <span className="badge-paradigm" style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(22, 163, 74, 0.1)', color: 'var(--status-success)', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
                      Selected
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hidden File Input for CSV Upload */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleUploadDataset}
            style={{ display: 'none' }}
          />

          {/* 3. Run Experiment Button */}
          <button
            onClick={handleRunExperiment}
            disabled={loading || uploading}
            className="btn btn-primary"
            style={{
              height: '44px',
              padding: '0 22px',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {loading ? <Loader2 size={16} className="spinner" /> : <Play size={16} fill="currentColor" />}
            {loading ? 'Executing Pipeline...' : 'Run Experiment'}
          </button>

          {/* 4. Upload Custom CSV Button (POSITIONED AFTER RUN EXPERIMENT) */}
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={loading || uploading}
            className="btn btn-outline"
            style={{
              height: '44px',
              padding: '0 18px',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {uploading ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
            {uploading ? 'Preprocessing...' : 'Upload Custom CSV'}
          </button>

        </div>

        {/* Custom Upload Banner Message */}
        {uploadMessage && (
          <div className="banner" style={{
            marginTop: '12px',
            padding: '8px 14px',
            fontSize: '0.82rem',
            background: uploadMessage.type === 'success' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)',
            border: `1px solid ${uploadMessage.type === 'success' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
            color: uploadMessage.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)'
          }}>
            {uploadMessage.text}
          </div>
        )}
      </div>

      {/* PART 2 — LIVE EXECUTION VISUALIZATION CHECKLIST */}
      {showExecutionPanel && (
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
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
                <span className="badge-paradigm" style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(22, 163, 74, 0.1)', color: 'var(--status-success)', border: '1px solid rgba(22, 163, 74, 0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={12} /> Execution Complete
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeStages.map((stage, idx) => {
              const isPending = idx > currentStageIndex;
              const isActive = idx === currentStageIndex;
              const isDone = idx < currentStageIndex || isExecutionComplete;

              return (
                <div
                  key={stage.id}
                  className="stage-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: isActive ? '#F0F6FF' : isDone ? '#F8FAFC' : '#FFFFFF',
                    border: isActive ? '1px solid var(--classical-color)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s ease',
                    opacity: isPending ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Stage State Icons */}
                    {isPending && (
                      <Circle size={18} style={{ color: '#CBD5E1', flexShrink: 0 }} />
                    )}
                    {isActive && (
                      <Loader2 size={18} className="spinner" style={{ color: 'var(--classical-color)', flexShrink: 0 }} />
                    )}
                    {isDone && (
                      <CheckCircle2 size={18} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
                    )}

                    {/* Stage Label */}
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : isDone ? 500 : 400,
                      color: isActive ? 'var(--classical-color)' : isDone ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>
                      {stage.label}
                    </span>
                  </div>

                  {/* Stage Timing & Status Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isActive && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--classical-color)', fontWeight: 500 }}>
                        In Progress...
                      </span>
                    )}
                    {isDone && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', background: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <Clock size={12} style={{ color: 'var(--status-success)' }} />
                        {stageTimings[stage.id] || 'Done'}
                      </span>
                    )}
                    {isPending && (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PART 3 — RESULTS DISPLAY */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Basic Information (Student Level) */}
          <div className="card" style={{ position: 'relative' }}>
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

              <div style={{ marginTop: '18px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={16} style={{ color: 'var(--classical-color)' }} /> Why use this model?
                </strong>
                <p style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  {results.basic_info?.why_use_this_model}
                </p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '20px' }}>
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
                <GraduationCap size={20} style={{ flexShrink: 0, color: '#92400E' }} />
                <div>
                  <strong style={{ color: '#92400E', fontSize: '0.875rem' }}>Student Diagnostic Takeaway:</strong>
                  <p style={{ marginTop: '4px', fontSize: '0.85rem', color: '#92400E' }}>
                    <strong>Graph Signal:</strong> {results.basic_info?.student_takeaway?.what_graph_indicates}
                  </p>
                  <p style={{ marginTop: '2px', fontSize: '0.85rem', color: '#78350F' }}>
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
                      <div style={{ position: 'relative', background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10 }}>
                          <CardActionMenu
                            title={`${results.basic_info?.model_name} - ROC Curve`}
                            category="plot"
                            data={{ roc_auc: results.basic_info?.key_metrics?.roc_auc }}
                            metadata={{ model_type: selectedModel, dataset: selectedDataset, plot_type: 'roc' }}
                            imageUrl={results.advanced_info.figure_artifacts.roc_curve}
                          />
                        </div>
                        <img src={results.advanced_info.figure_artifacts.roc_curve} alt="ROC Curve" style={{ width: '100%', borderRadius: '6px' }} />
                      </div>
                    )}
                    {results.advanced_info.figure_artifacts.confusion_matrix && (
                      <div style={{ position: 'relative', background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
                        <img src={results.advanced_info.figure_artifacts.confusion_matrix} alt="Confusion Matrix" style={{ width: '100%', borderRadius: '6px' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

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
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Settings size={16} /> Architectural Hyperparameters
                  </h4>
                  <pre style={{ background: '#FFFFFF', padding: '14px', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-primary)', border: '1px solid var(--border-color)', overflow: 'auto' }}>
                    {JSON.stringify(results.advanced_info?.architectural_details, null, 2)}
                  </pre>
                </div>

                {/* Cross-Validation Details */}
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={16} style={{ color: 'var(--quantum-color)' }} /> Quantum Hardware Profile (NISQ Circuit Telemetry)
                    </h4>
                    <div className="grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
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
                  <summary style={{ cursor: 'pointer', padding: '10px 14px', background: '#F8FAFC', borderRadius: '6px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    View Raw Execution Payload JSON
                  </summary>
                  <pre style={{ marginTop: '10px', background: '#FFFFFF', color: 'var(--text-secondary)', padding: '16px', borderRadius: '6px', fontSize: '0.78rem', border: '1px solid var(--border-color)', overflow: 'auto', maxHeight: '350px' }}>
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
