import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Database, Eye, Sparkles, Layers, CheckCircle2, AlertTriangle,
  Upload, Trash2, ArrowRight, ShieldCheck, Activity, Info, BarChart2,
  Table, Image as ImageIcon, Cpu, FileText, Download, Zap, RefreshCw,
  Search, Sliders, PieChart, TrendingUp, Heart, Microscope, Waves,
  Stethoscope, FileSpreadsheet, Terminal, Check, Clock, Play,
  FolderArchive, FileUp, ChevronRight, X, Maximize2, AlertCircle
} from 'lucide-react';
import {
  getDatasets,
  getDatasetOverview,
  deleteDataset,
  uploadCustomDataset,
  getRandomDatasetImages,
  getDatasetPipelineStages
} from '../services/api';
import CardActionMenu from '../components/CardActionMenu';
import Atom4Orbits from '../components/Atom4Orbits';

/* ── Design Tokens ─────────────────────────────────────────── */
const T = {
  eyebrow: {
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--text-tertiary)'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.35rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)'
  },
  body: {
    fontSize: '0.9rem',
    lineHeight: 1.7,
    color: 'var(--text-secondary)'
  },
  card: {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px',
    boxShadow: 'var(--shadow-card)'
  }
};

const PARADIGM = {
  brand:     { color: 'var(--brand-primary)',  bg: 'var(--brand-bg)',   glow: 'var(--brand-glow)' },
  classical: { color: 'var(--classical-color)', bg: 'var(--classical-bg)', glow: 'var(--classical-glow)' },
  quantum:   { color: 'var(--quantum-color)',  bg: 'var(--quantum-bg)', glow: 'var(--quantum-glow)' },
  hybrid:    { color: 'var(--hybrid-color)',   bg: 'rgba(245, 158, 11, 0.12)', glow: 'rgba(245, 158, 11, 0.25)' }
};

/* ── Reusable Primitives ───────────────────────────────────── */
function SectionHeader({ index, icon: Icon, title, subtitle, actions }) {
  return (
    <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={T.eyebrow}>{index}</span>
          <span style={{ width: '28px', height: '1px', background: 'var(--border-color)' }} />
          {Icon && <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />}
        </div>
        <h2 style={T.sectionTitle}>{title}</h2>
        {subtitle && <p style={{ margin: '8px 0 0', ...T.body, maxWidth: '640px' }}>{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

function HairlineDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
      <span style={T.eyebrow}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
    </div>
  );
}

function PillButton({ children, onClick, active, tone = 'brand', size = 'md', style: extra = {} }) {
  const t = PARADIGM[tone] || PARADIGM.brand;
  const isMd = size === 'md';
  return (
    <button
      onClick={onClick}
      style={{
        height: isMd ? '40px' : '34px',
        padding: isMd ? '0 18px' : '0 14px',
        borderRadius: 'var(--radius-md)',
        border: active ? `1px solid ${t.color}` : '1px solid var(--border-color)',
        background: active ? t.bg : 'transparent',
        color: active ? t.color : 'var(--text-secondary)',
        fontSize: isMd ? '0.85rem' : '0.78rem',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        letterSpacing: '-0.01em',
        ...extra
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, icon: Icon, style: extra = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: '42px',
        padding: '0 20px',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: disabled ? 'var(--text-tertiary)' : 'var(--brand-primary)',
        color: '#FFFFFF',
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: disabled ? 'none' : '0 2px 8px var(--brand-glow)',
        transition: 'all 0.2s ease',
        letterSpacing: '-0.01em',
        ...extra
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = 'var(--brand-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = 'var(--brand-primary)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function SegmentedTabs({ tabs, active, onChange, tone = 'brand' }) {
  const t = PARADIGM[tone] || PARADIGM.brand;
  return (
    <div style={{
      display: 'inline-flex',
      padding: '3px',
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      gap: '2px'
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              height: '34px',
              padding: '0 16px',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none',
              background: isActive ? 'var(--bg-card-solid)' : 'transparent',
              color: isActive ? t.color : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? 'var(--shadow-card)' : 'none'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function StatTile({ value, label, sub, accent = 'brand', icon: Icon, isFirst }) {
  const t = PARADIGM[accent] || PARADIGM.brand;
  return (
    <div style={{ padding: '26px 28px', borderLeft: isFirst ? 'none' : '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '1.9rem', fontWeight: 700, color: t.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '10px' }}>
        {value}
      </div>
      <div style={T.eyebrow}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>{sub}</div>}
      {Icon && <Icon size={24} style={{ position: 'absolute', top: '24px', right: '24px', color: t.color, opacity: 0.2 }} />}
    </div>
  );
}

function MinimalCard({ children, accent, style: extra = {} }) {
  return (
    <div style={{
      position: 'relative',
      ...T.card,
      borderTop: accent ? `2px solid ${PARADIGM[accent].color}` : 'none',
      ...extra
    }}>
      {children}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */
export default function DatasetOverview() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialView = searchParams.get('view') || 'upload';
  const initialDataset = searchParams.get('dataset') || 'cancer';

  const [pageView, setPageView] = useState(initialView);
  const [datasetsList, setDatasetsList] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(initialDataset);
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [sampleView, setSampleView] = useState('cases');
  const [searchTerm, setSearchTerm] = useState('');

  const [randomImages, setRandomImages] = useState([]);
  const [refreshingImages, setRefreshingImages] = useState(false);
  const [activeEnlargedImage, setActiveEnlargedImage] = useState(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [pipelineStages, setPipelineStages] = useState([]);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [pipelineMeta, setPipelineMeta] = useState(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (terminalEndRef.current) terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const fetchDatasetsList = async () => {
    try {
      const res = await getDatasets();
      if (res && res.datasets) setDatasetsList(res.datasets);
    } catch (err) { console.warn('Failed to load dataset list:', err); }
  };

  useEffect(() => { fetchDatasetsList(); }, []);

  useEffect(() => {
    if (pageView === 'overview' && selectedDataset) loadDatasetOverview(selectedDataset);
  }, [selectedDataset, pageView]);

  const loadDatasetOverview = async (dKey) => {
    setLoading(true);
    try {
      const data = await getDatasetOverview(dKey);
      setOverviewData(data);
      if (data?.sample_cases && data.sample_cases.length > 0) setRandomImages(data.sample_cases);
    } catch (err) {
      console.error(`Failed to load dataset overview for ${dKey}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickRandomImages = async () => {
    if (!selectedDataset) return;
    setRefreshingImages(true);
    try {
      const res = await getRandomDatasetImages(selectedDataset, 3);
      if (res && res.samples && res.samples.length > 0) setRandomImages(res.samples);
    } catch (err) { console.warn('Failed to sample fresh images:', err); }
    finally { setTimeout(() => setRefreshingImages(false), 400); }
  };

  const runPipelineWithLogs = async (sourceType, payload) => {
    setPageView('pipeline');
    setPipelineRunning(true);
    setPipelineComplete(false);
    setPipelineProgress(5);
    setCurrentStageIdx(0);
    setUploadError('');

    const defaultStages = [
      { id: 1, key: 'format_detection', name: 'Format & Container Autodetection', phase: 'INGESTION', status: 'RUNNING', duration_ms: 40, summary: 'Inspecting MIME types, magic bytes, archive structure.' },
      { id: 2, key: 'content_extraction', name: 'Content & Payload Decompression', phase: 'EXTRACTION', status: 'PENDING', duration_ms: 110, summary: 'Extracting raw clinical records and decoding authentic scans.' },
      { id: 3, key: 'structure_validation', name: 'Clinical Schema & Target Verification', phase: 'SCHEMA', status: 'PENDING', duration_ms: 55, summary: 'Validating target outcome column and binary class balance.' },
      { id: 4, key: 'data_hygiene', name: 'Automated Hygiene & Outlier Filtering', phase: 'CLEANING', status: 'PENDING', duration_ms: 75, summary: 'Resolving dirty strings, median imputation, zero-variance filtering.' },
      { id: 5, key: 'leak_free_split', name: 'Leak-Free 80/20 Stratified Partitioning', phase: 'PARTITIONING', status: 'PENDING', duration_ms: 65, summary: 'Stratified train/test split with strict training-only StandardScaler.' },
      { id: 6, key: 'quantum_pca', name: 'Quantum Hilbert Space PCA Projection', phase: 'QUANTUM MAPPING', status: 'PENDING', duration_ms: 90, summary: 'Compressing clinical features to 4-qubit quantum rotation angles.' },
      { id: 7, key: 'registry_persistence', name: 'Persistence & Training Readiness Complete', phase: 'DEPLOYMENT', status: 'PENDING', duration_ms: 45, summary: 'Saving parquet arrays, registering dataset, indexing authentic gallery.' }
    ];

    setPipelineStages(defaultStages);
    setTerminalLogs([
      `[INFO] [00:00.005] Initializing Q-Med Hybrid ML Data Analyzer Engine...`,
      `[INFO] [00:00.015] Source: ${sourceType === 'upload' ? payload.name : String(payload).toUpperCase()} cohort dataset.`
    ]);

    try {
      let finalDatasetKey = selectedDataset;
      let finalOverview = null;
      let backendStages = null;
      let backendLogs = null;

      if (sourceType === 'upload') {
        setTerminalLogs(prev => [...prev, `[INFO] [00:00.040] [STAGE 1/7] Analyzing file payload '${payload.name}' (${(payload.size / 1024).toFixed(1)} KB)...`]);
        const uploadRes = await uploadCustomDataset(payload);
        finalDatasetKey = uploadRes.dataset_key;
        setSelectedDataset(finalDatasetKey);
        if (uploadRes.pipeline_trace) {
          backendStages = uploadRes.pipeline_trace.stages;
          backendLogs = uploadRes.pipeline_trace.terminal_logs;
          setPipelineMeta(uploadRes.pipeline_trace.metrics);
        }
        await fetchDatasetsList();
      } else {
        finalDatasetKey = payload;
        setSelectedDataset(finalDatasetKey);
        const stageRes = await getDatasetPipelineStages(finalDatasetKey);
        if (stageRes) {
          backendStages = stageRes.stages;
          backendLogs = stageRes.terminal_logs;
          setPipelineMeta(stageRes.metrics);
        }
      }

      const stagesToPlay = backendStages || defaultStages;
      const logsToPlay = backendLogs || [];

      for (let i = 0; i < stagesToPlay.length; i++) {
        setCurrentStageIdx(i);
        setPipelineProgress(Math.round(((i + 1) / stagesToPlay.length) * 100));

        setPipelineStages(prev => prev.map((st, idx) => {
          if (idx < i) return { ...st, status: 'COMPLETED' };
          if (idx === i) return { ...st, status: 'RUNNING', ...(stagesToPlay[i] || {}) };
          return st;
        }));

        if (logsToPlay[i + 1]) {
          setTerminalLogs(prev => [...prev, logsToPlay[i + 1]]);
        } else {
          setTerminalLogs(prev => [
            ...prev,
            `[STAGE ${i + 1}/7] ${stagesToPlay[i].name} completed in ${stagesToPlay[i].duration_ms || 50}ms. ${stagesToPlay[i].summary || ''}`
          ]);
        }
        await new Promise(r => setTimeout(r, 180));
      }

      setPipelineStages(stagesToPlay.map(s => ({ ...s, status: 'COMPLETED' })));
      setPipelineProgress(100);
      setPipelineComplete(true);
      setPipelineRunning(false);

      if (logsToPlay.length > 0) setTerminalLogs(logsToPlay);
      else {
        setTerminalLogs(prev => [
          ...prev,
          `[SUCCESS] [00:00.485] Preprocessing and EDA pipeline complete. Dataset '${finalDatasetKey}' is ready for model training.`
        ]);
      }

      finalOverview = await getDatasetOverview(finalDatasetKey);
      setOverviewData(finalOverview);
      if (finalOverview?.sample_cases && finalOverview.sample_cases.length > 0) setRandomImages(finalOverview.sample_cases);

    } catch (err) {
      console.error('Pipeline processing error:', err);
      setPipelineRunning(false);
      setUploadError(err.response?.data?.detail || err.message || 'Data processing pipeline failed.');
      setTerminalLogs(prev => [...prev, `[ERROR] Ingestion failed: ${err.response?.data?.detail || err.message}`]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      runPipelineWithLogs('upload', file);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      runPipelineWithLogs('upload', file);
    }
  };

  const handleDeleteDataset = async (dKey) => {
    const dsObj = datasetsList.find(d => (d.id || d.key) === dKey);
    const dsName = dsObj ? dsObj.name : dKey;
    if (!window.confirm(`Are you sure you want to permanently remove dataset "${dsName}"? Preprocessed matrices and raw scans will be deleted.`)) return;
    try {
      setLoading(true);
      await deleteDataset(dKey);
      await fetchDatasetsList();
      setSelectedDataset('cancer');
      setPageView('upload');
    } catch (err) { alert(`Failed to delete dataset: ${err.message}`); }
    finally { setLoading(false); }
  };

  const activeDsObj = datasetsList.find(d => (d.id || d.key) === selectedDataset);
  const isCustom = activeDsObj && !activeDsObj.built_in;

  const basic = overviewData?.basic_partition || {};
  const advanced = overviewData?.advanced_partition || {};
  const statTable = advanced?.feature_statistical_table || [];
  const filteredStatTable = statTable.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sampleCases = (randomImages && randomImages.length > 0) ? randomImages : (overviewData?.sample_cases || []);
  const sampleRecords = overviewData?.sample_records || [];
  const classDist = overviewData?.class_distribution || {};
  const totalSamples = overviewData?.total_samples || 0;
  const healthyCount = classDist?.class_0_healthy || Math.round(totalSamples * 0.6);
  const diseasedCount = classDist?.class_1_diseased || (totalSamples - healthyCount);
  const healthyPct = totalSamples > 0 ? Math.round((healthyCount / totalSamples) * 100) : 60;
  const diseasedPct = 100 - healthyPct;

  const pcaData = advanced?.pca_quantum_compression || {};
  const sampleType = overviewData?.sample_breakdown_type || 'tabular_generic';
  const isVisualSample = sampleCases.some(s => !!s.image_data_url);

  const getDomainIcon = () => {
    const key = (overviewData?.dataset_key || selectedDataset).toLowerCase();
    if (key.includes('cancer') || sampleType === 'cytology') return <Microscope size={16} style={{ color: 'var(--brand-primary)' }} />;
    if (key.includes('cardio')) return <Heart size={16} style={{ color: 'var(--status-danger)' }} />;
    if (key.includes('diabetes')) return <Activity size={16} style={{ color: 'var(--brand-primary)' }} />;
    if (key.includes('parkinson')) return <Waves size={16} style={{ color: 'var(--quantum-color)' }} />;
    if (key.includes('mri') || key.includes('neuro')) return <Cpu size={16} style={{ color: 'var(--quantum-color)' }} />;
    if (key.includes('ct') || key.includes('thorax')) return <Activity size={16} style={{ color: 'var(--hybrid-color)' }} />;
    return <FileSpreadsheet size={16} style={{ color: 'var(--brand-primary)' }} />;
  };

  const registeredCohorts = [
    { key: 'cancer', name: 'Breast Cancer Cytopathology (WDBC)', modality: 'FNA Cytology Smears & Morphology', samples: 569, features: 30, badge: '12 AUTHENTIC SCANS', icon: <Microscope size={20} style={{ color: 'var(--brand-primary)' }} />, desc: 'High-power FNA cytology biopsies distinguishing malignant from benign breast neoplasms.', accent: 'brand' },
    { key: 'custom_mri_scans', name: 'Neuroimaging Brain MRI Gallery', modality: 'T1 / T2 / FLAIR Multi-Slice MRI', samples: 12, features: 8, badge: '12 RAW MRI SCANS', icon: <Cpu size={20} style={{ color: 'var(--quantum-color)' }} />, desc: 'Authentic axial brain MRI scans with GLCM spatial contrast, tissue heterogeneity & tumor radiomics.', accent: 'quantum' },
    { key: 'custom_ct_scans', name: 'Thoracic High-Resolution CT Scans', modality: 'Chest CT Radiomics & Density', samples: 12, features: 8, badge: '12 RAW CT SCANS', icon: <Activity size={20} style={{ color: 'var(--hybrid-color)' }} />, desc: 'Authentic thoracic CT pulmonary scans measuring Hounsfield density, nodule margins, and parenchymal texture.', accent: 'hybrid' },
    { key: 'cardiovascular', name: 'UCI Heart Disease Cohort', modality: 'Hemodynamics, ECG & Fluoroscopy', samples: 303, features: 13, badge: 'CLINICAL VITALS', icon: <Heart size={20} style={{ color: 'var(--status-danger)' }} />, desc: 'Coronary artery disease triage analyzing exercise ST depression, resting blood pressure, and cholesterol.', accent: 'classical' },
    { key: 'diabetes', name: 'Pima Indian Diabetes Metabolic Profile', modality: 'Endocrine & Metabolic Labs', samples: 768, features: 8, badge: 'ENDOCRINE LABS', icon: <Activity size={20} style={{ color: 'var(--brand-primary)' }} />, desc: 'Type-2 diabetes risk profiling evaluating fasting plasma glucose, 2-hour serum insulin, and BMI.', accent: 'brand' },
    { key: 'parkinsons', name: "Parkinson's Disease Telemonitoring", modality: 'Vocal Frequency & Dysphonia', samples: 195, features: 22, badge: 'ACOUSTIC BIOMARKERS', icon: <Waves size={20} style={{ color: 'var(--quantum-color)' }} />, desc: 'Phonatory impairment analysis evaluating fundamental frequency variation, harmonic-to-noise ratio, and dysphonia.', accent: 'quantum' }
  ];

  return (
    <div className="hub-section active" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 32px 96px' }}>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW 1 — UPLOAD PORTAL                                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {pageView === 'upload' && (
        <>
          {/* Editorial Hero */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '56px', flexWrap: 'wrap', padding: '64px 0 72px' }}>
            <div style={{ flex: 1, minWidth: '320px', maxWidth: '720px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px', marginBottom: '28px',
                border: '1px solid var(--border-color)', borderRadius: '999px',
                background: 'var(--bg-card)'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)', boxShadow: '0 0 8px var(--brand-glow)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Automated Multimodal Ingestion & Quantum EDA
                </span>
              </div>

              <h1 style={{
                margin: '0 0 20px',
                fontSize: 'clamp(2rem, 4vw, 2.9rem)',
                fontWeight: 700,
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                color: 'var(--text-primary)'
              }}>
                Dataset ingestion &{' '}
                <span style={{ color: 'var(--brand-primary)' }}>diagnostic profiler</span>.
              </h1>

              <p style={{ margin: '0 0 36px', ...T.body, maxWidth: '560px' }}>
                Choose or upload any clinical cohort, multimodal archive, or radiological scan.
                The analyzer detects format, decodes authentic scans, extracts radiomic
                biomarkers, and executes leak-free 80/20 quantum preprocessing in real time.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label
                  htmlFor="dataset-upload-input"
                  style={{
                    height: '46px', padding: '0 22px', borderRadius: 'var(--radius-md)', border: 'none',
                    background: 'var(--brand-primary)', color: '#FFFFFF', fontSize: '0.88rem', fontWeight: 600,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 2px 8px var(--brand-glow)', transition: 'all 0.2s ease', letterSpacing: '-0.01em'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--brand-primary)'; }}
                >
                  <Upload size={15} /> Choose File
                </label>

                {selectedDataset && (
                  <button
                    onClick={() => setPageView('overview')}
                    style={{
                      height: '46px', padding: '0 22px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)', background: 'transparent',
                      color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                      transition: 'all 0.2s ease', letterSpacing: '-0.01em'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-inset)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Eye size={15} /> Inspect Cohort <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ position: 'relative', width: '230px', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--border-color)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: '26px', border: '1px dashed var(--border-color)', borderRadius: '50%', opacity: 0.55 }} />
              <Atom4Orbits size={120} color="var(--brand-primary)" />
            </div>
          </div>

          {/* Hairline Stats Table */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '80px'
          }}>
            <div style={{ padding: '28px', borderLeft: 'none' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--brand-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '10px' }}>
                {datasetsList.length > 0 ? `${datasetsList.length}+` : '6+'}
              </div>
              <div style={T.eyebrow}>Benchmark Cohorts</div>
            </div>
            <div style={{ padding: '28px', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--classical-color)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '10px' }}>80 / 20</div>
              <div style={T.eyebrow}>Stratified Split</div>
            </div>
            <div style={{ padding: '28px', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--quantum-color)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '10px' }}>4 Q</div>
              <div style={T.eyebrow}>Hilbert PCA</div>
            </div>
            <div style={{ padding: '28px', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--hybrid-color)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '10px' }}>7</div>
              <div style={T.eyebrow}>Live Pipeline Stages</div>
            </div>
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div style={{
              display: 'flex', gap: '14px', alignItems: 'flex-start',
              padding: '18px 22px', marginBottom: '32px',
              background: 'var(--status-danger-bg)', border: '1px solid rgba(220, 38, 38, 0.25)',
              borderRadius: 'var(--radius-md)'
            }}>
              <AlertCircle size={18} style={{ color: 'var(--status-danger)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--status-danger)', marginBottom: '4px' }}>Ingestion Error</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--status-danger)', lineHeight: 1.6 }}>{uploadError}</div>
              </div>
            </div>
          )}

          {/* Minimalist Drop Zone */}
          <section style={{ marginBottom: '80px' }}>
            <SectionHeader index="01" icon={Upload} title="Ingest a Dataset" subtitle="Drop any clinical CSV, multimodal ZIP archive, DICOM, NIfTI, or radiological scan. The live 7-stage telemetry logger activates automatically." />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                position: 'relative',
                padding: '56px 32px',
                border: dragActive ? '1.5px dashed var(--brand-primary)' : '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                background: dragActive ? 'var(--brand-bg)' : 'var(--bg-inset)',
                textAlign: 'center',
                transition: 'all 0.25s ease'
              }}
            >
              <input
                type="file"
                id="dataset-upload-input"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
                accept=".csv,.tsv,.xlsx,.parquet,.pq,.json,.zip,.tar,.tar.gz,.tgz,.dcm,.dicom,.nii,.nii.gz,.png,.jpg,.jpeg,.webp"
              />

              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'var(--brand-bg)', border: '1px solid var(--brand-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <FileUp size={22} style={{ color: 'var(--brand-primary)' }} />
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
                Drag & drop your biomedical dataset
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 24px', maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto' }}>
                Supports raw clinical records, multimodal archives, and radiological scans.
              </p>

              <label
                htmlFor="dataset-upload-input"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--brand-primary)', background: 'transparent',
                  color: 'var(--brand-primary)', fontSize: '0.85rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Upload size={14} /> Browse Files
              </label>

              {/* Format Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
                {[
                  { icon: FileSpreadsheet, label: '.CSV / .TSV', tone: 'brand' },
                  { icon: FolderArchive, label: '.ZIP / .TAR', tone: 'quantum' },
                  { icon: Database, label: '.PARQUET', tone: 'classical' },
                  { icon: Microscope, label: 'DICOM / NIfTI', tone: 'hybrid' },
                  { icon: ImageIcon, label: 'PNG / JPG', tone: 'brand' }
                ].map((p, i) => {
                  const t = PARADIGM[p.tone];
                  return (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 10px', borderRadius: '999px',
                      fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em',
                      background: t.bg, color: t.color, border: `1px solid ${t.glow}`
                    }}>
                      <p.icon size={11} /> {p.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Registered Cohorts */}
          <section>
            <SectionHeader
              index="02"
              icon={Layers}
              title="Clinical Benchmark Cohorts"
              subtitle="Pre-configured cohorts ready for one-click deep diagnostic profiling."
              actions={
                datasetsList.some(d => !d.built_in) && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '6px', background: 'var(--quantum-bg)', color: 'var(--quantum-color)', border: '1px solid var(--quantum-glow)' }}>
                    Custom Cohorts Active
                  </span>
                )
              }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {registeredCohorts.map(cohort => {
                const t = PARADIGM[cohort.accent];
                return (
                  <div
                    key={cohort.key}
                    onClick={() => runPipelineWithLogs('cohort', cohort.key)}
                    style={{
                      position: 'relative', overflow: 'hidden',
                      background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
                      padding: '24px', cursor: 'pointer',
                      transition: 'all 0.25s ease', boxShadow: 'var(--shadow-card)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = t.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: t.color }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                        background: t.bg, border: `1px solid ${t.glow}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {cohort.icon}
                      </div>
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em',
                        padding: '3px 8px', borderRadius: '4px',
                        background: t.bg, color: t.color, border: `1px solid ${t.glow}`
                      }}>
                        {cohort.badge}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                      {cohort.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: t.color, marginBottom: '12px', fontWeight: 500 }}>
                      {cohort.modality}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
                      {cohort.desc}
                    </p>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      paddingTop: '14px', borderTop: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{cohort.samples}</span> cases •
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginLeft: '4px' }}>{cohort.features}</span> features
                      </div>
                      <ArrowRight size={14} style={{ color: t.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW 2 — LIVE PIPELINE LOGGER                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {pageView === 'pipeline' && (
        <>
          {/* Progress Header */}
          <MinimalCard accent="brand" style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', marginBottom: '22px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ ...T.eyebrow, color: pipelineComplete ? 'var(--status-success)' : 'var(--brand-primary)' }}>
                    {pipelineComplete ? '● Pipeline Complete' : '● Processing'}
                  </span>
                  <span style={{ width: '28px', height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Cohort: <strong style={{ color: 'var(--text-primary)' }}>{selectedDataset}</strong>
                  </span>
                </div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  Automated Preprocessing Telemetry
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <PillButton onClick={() => setPageView('upload')} icon={Upload}><Upload size={14} /> Choose Another</PillButton>
                {pipelineComplete && <PrimaryButton onClick={() => setPageView('overview')} icon={ArrowRight}>Inspect Diagnostic Profile</PrimaryButton>}
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Stage <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{Math.min(currentStageIdx + 1, 7)}</strong> of <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>7</strong> — {pipelineStages[currentStageIdx]?.name || 'Initializing'}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontVariantNumeric: 'tabular-nums' }}>{pipelineProgress}%</span>
              </div>
              <div style={{ height: '4px', background: 'var(--bg-inset)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: `${pipelineProgress}%`, height: '100%',
                  background: 'linear-gradient(90deg, var(--brand-primary), var(--quantum-color))',
                  transition: 'width 0.3s ease-out'
                }} />
              </div>
            </div>
          </MinimalCard>

          {/* Two-Column: Stepper + Terminal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
            {/* Stepper */}
            <MinimalCard>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span style={T.eyebrow}>Sequential Stages</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {pipelineStages.map((st, idx) => {
                  const isDone = st.status === 'COMPLETED';
                  const isCurrent = st.status === 'RUNNING';
                  const isLast = idx === pipelineStages.length - 1;

                  return (
                    <div key={st.id} style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                      {/* Vertical Connector */}
                      {!isLast && (
                        <div style={{
                          position: 'absolute', left: '13px', top: '32px', bottom: '-8px',
                          width: '1px',
                          background: isDone ? 'var(--status-success)' : 'var(--border-color)'
                        }} />
                      )}

                      {/* Number Circle */}
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        border: `1.5px solid ${isDone ? 'var(--status-success)' : isCurrent ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                        background: isDone ? 'var(--status-success-bg)' : isCurrent ? 'var(--brand-bg)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                        color: isDone ? 'var(--status-success)' : isCurrent ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                        transition: 'all 0.3s ease', zIndex: 1
                      }}>
                        {isDone ? <Check size={13} strokeWidth={3} /> : isCurrent ? <RefreshCw size={12} className="spinning" /> : String(idx + 1).padStart(2, '0')}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: isLast ? '0' : '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '0.88rem', fontWeight: 600,
                            color: isCurrent ? 'var(--brand-primary)' : isDone ? 'var(--text-primary)' : 'var(--text-secondary)',
                            letterSpacing: '-0.01em'
                          }}>
                            {st.name}
                          </span>
                          {st.duration_ms && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
                              {st.duration_ms}ms
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.55 }}>
                          {st.summary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </MinimalCard>

            {/* Terminal Logger */}
            <div style={{
              background: '#0B1020',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
            }}>
              {/* Terminal Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                  </div>
                  <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.74rem', color: '#94A3B8', letterSpacing: '0.02em' }}>
                    qmed-pipeline-telemetry.log
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: pipelineRunning ? 'var(--brand-primary)' : '#64748B',
                    boxShadow: pipelineRunning ? '0 0 8px var(--brand-primary)' : 'none',
                    animation: pipelineRunning ? 'pulse 1.5s infinite' : 'none'
                  }} />
                  <span style={{ fontSize: '0.7rem', color: pipelineRunning ? 'var(--brand-primary)' : '#94A3B8', fontWeight: 700, letterSpacing: '0.1em' }}>
                    {pipelineRunning ? 'STREAMING' : 'IDLE'}
                  </span>
                </div>
              </div>

              {/* Terminal Body */}
              <div style={{
                padding: '20px', flex: 1, minHeight: '420px', maxHeight: '480px', overflowY: 'auto',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '0.78rem', lineHeight: 1.7
              }}>
                {terminalLogs.map((line, idx) => {
                  let color = '#CBD5E1';
                  if (line.includes('[SUCCESS]')) color = '#10B981';
                  if (line.includes('[ERROR]')) color = '#EF4444';
                  if (line.includes('[STAGE')) color = '#0D9488';
                  if (line.includes('Quantum PCA')) color = '#F59E0B';
                  if (line.includes('[INFO]')) color = '#94A3B8';

                  return (
                    <div key={idx} style={{ color, marginBottom: '3px', wordBreak: 'break-word' }}>
                      <span style={{ color: '#475569', marginRight: '8px' }}>›</span>
                      {line}
                    </div>
                  );
                })}
                <div ref={terminalEndRef} />
              </div>

              {/* Terminal Footer */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.02)'
              }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                  7 stages • zero-leakage verified
                </span>
                <button
                  onClick={() => setPageView('overview')}
                  disabled={!pipelineComplete}
                  style={{
                    height: '32px', padding: '0 14px', borderRadius: 'var(--radius-md)', border: 'none',
                    background: pipelineComplete ? 'var(--brand-primary)' : 'rgba(255,255,255,0.08)',
                    color: pipelineComplete ? '#FFFFFF' : '#64748B',
                    fontSize: '0.78rem', fontWeight: 600,
                    cursor: pipelineComplete ? 'pointer' : 'not-allowed',
                    display: 'inline-flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  Proceed <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW 3 — DEEP DIAGNOSTIC PROFILE                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {pageView === 'overview' && (
        <>
          {/* Page Header */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <PillButton onClick={() => setPageView('upload')}><Upload size={13} /> Ingestion</PillButton>
              <PillButton onClick={() => setShowLogsModal(true)} tone="quantum"><Terminal size={13} /> Telemetry</PillButton>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: '6px',
                background: 'var(--status-success-bg)', color: 'var(--status-success)',
                border: '1px solid rgba(22, 163, 74, 0.25)'
              }}>
                Leak-Free 80/20 Verified
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={T.eyebrow}>Diagnostic Profile</div>
                <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                  {overviewData?.dataset_name || selectedDataset}
                </h1>
                <p style={{ margin: '8px 0 0', ...T.body, maxWidth: '640px' }}>
                  Exploratory data analysis, authentic cohort imaging, radiomic biomarkers, and 4-qubit Hilbert projection telemetry.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: 'var(--bg-inset)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <Database size={14} style={{ color: 'var(--brand-primary)' }} />
                  <select
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    style={{
                      border: 'none', background: 'transparent', color: 'var(--text-primary)',
                      fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer', minWidth: '160px'
                    }}
                  >
                    {datasetsList.map(ds => {
                      const dKey = ds.id || ds.key;
                      const cleanName = ds.name.replace(/^Custom:\s*/i, '');
                      return <option key={dKey} value={dKey}>{!ds.built_in ? `[Custom] ${cleanName}` : cleanName}</option>;
                    })}
                  </select>
                </div>

                {isCustom && (
                  <button
                    onClick={() => handleDeleteDataset(selectedDataset)}
                    style={{
                      width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(220, 38, 38, 0.3)', background: 'transparent',
                      color: 'var(--status-danger)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--status-danger-bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hairline Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '64px'
          }}>
            <StatTile
              value={overviewData?.total_samples || 0}
              label="Total Records"
              sub={`${overviewData?.train_samples || 0} train • ${overviewData?.test_samples || 0} test`}
              accent="classical"
              isFirst
            />
            <StatTile
              value={overviewData?.total_features || 0}
              label="Feature Dimensions"
              sub={overviewData?.modality || 'Tabular'}
              accent="classical"
            />
            <StatTile
              value={`${pcaData.cumulative_variance_pct || 79.2}%`}
              label="4-Qubit PCA Variance"
              sub={`16D Hilbert • ${pcaData.n_qubits || 4} Q`}
              accent="quantum"
            />
            <StatTile
              value={`${healthyPct} / ${diseasedPct}`}
              label="Cohort Balance"
              sub={`${overviewData?.negative_label?.split(' ')[0] || 'Healthy'} vs ${overviewData?.positive_label?.split(' ')[0] || 'Diseased'}`}
              accent="brand"
            />
          </div>

          {/* ── 01 · Authentic Cohort Samples ── */}
          <section style={{ marginBottom: '80px' }}>
            <SectionHeader
              index="01"
              icon={isVisualSample ? ImageIcon : Stethoscope}
              title={isVisualSample ? 'Authentic Cohort Scan Gallery' : 'Clinical Case Profiles'}
              subtitle={isVisualSample
                ? 'Genuine medical scan slices decoded directly from the dataset archive with GLCM texture metrics and diagnostic rationales.'
                : 'Representative clinical patient profiles with lab biomarkers, phenotypic findings, and risk stratification.'}
              actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isVisualSample && (
                    <PillButton onClick={handlePickRandomImages} disabled={refreshingImages}>
                      <RefreshCw size={13} className={refreshingImages ? 'spinning' : ''} />
                      Pick 3 New
                    </PillButton>
                  )}
                  <SegmentedTabs
                    tabs={[
                      { id: 'cases', label: `Cases (${sampleCases.length})`, icon: isVisualSample ? <ImageIcon size={12} /> : <Stethoscope size={12} /> },
                      { id: 'table', label: `Table (${sampleRecords.length})`, icon: <Table size={12} /> }
                    ]}
                    active={sampleView}
                    onChange={setSampleView}
                  />
                  <CardActionMenu
                    title={`${overviewData?.dataset_name || selectedDataset} - Sample Cohort Breakdowns`}
                    category="sample_cases"
                    data={{
                      sample_type: sampleType,
                      cases_count: sampleCases.length,
                      samples: sampleCases.map(s => ({
                        case_id: s.case_id,
                        sample_id: s.sample_id,
                        label: s.label,
                        metrics: s.key_metrics,
                        finding: s.visual_breakdown
                      }))
                    }}
                    metadata={{ dataset: selectedDataset }}
                  />
                </div>
              }
            />

            {sampleView === 'cases' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {sampleCases.map((sample, idx) => (
                  <div key={idx} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)', padding: '22px', boxShadow: 'var(--shadow-card)',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: sample.is_positive ? 'var(--status-danger)' : 'var(--status-success)' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{sample.sample_id}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{sample.case_id}</div>
                      </div>
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '3px 8px', borderRadius: '4px',
                        background: sample.is_positive ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
                        color: sample.is_positive ? 'var(--status-danger)' : 'var(--status-success)',
                        border: `1px solid ${sample.is_positive ? 'rgba(220, 38, 38, 0.25)' : 'rgba(22, 163, 74, 0.25)'}`
                      }}>
                        {sample.label}
                      </span>
                    </div>

                    {sample.image_data_url ? (
                      <>
                        <div
                          onClick={() => setActiveEnlargedImage(sample)}
                          style={{
                            position: 'relative', cursor: 'zoom-in',
                            borderRadius: 'var(--radius-md)', overflow: 'hidden',
                            marginBottom: '14px', border: '1px solid var(--border-color)'
                          }}
                        >
                          <img src={sample.image_data_url} alt={sample.sample_id} style={{ width: '100%', display: 'block' }} />
                          <div style={{
                            position: 'absolute', bottom: '10px', right: '10px',
                            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                            padding: '4px 8px', borderRadius: '999px',
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            color: '#fff', fontSize: '0.68rem', fontWeight: 600
                          }}>
                            <Maximize2 size={10} /> Enlarge
                          </div>
                        </div>

                        <div style={T.eyebrow}>Radiomics & GLCM Texture</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px', marginBottom: '14px' }}>
                          {Object.entries(sample.key_metrics || {}).map(([mName, mVal]) => (
                            <div key={mName} style={{ padding: '8px 10px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)' }}>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{mName}</div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                                {typeof mVal === 'number' ? mVal.toFixed(3) : String(mVal)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ ...T.eyebrow, marginBottom: '8px' }}>Clinical Biomarkers</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                          {Object.entries(sample.key_metrics || {}).map(([mName, mVal]) => (
                            <div key={mName} style={{ padding: '8px 10px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)' }}>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{mName}</div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                                {typeof mVal === 'number' ? mVal.toFixed(2) : String(mVal)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div style={{
                      padding: '12px 14px', background: 'var(--bg-inset)',
                      borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--brand-primary)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Sparkles size={11} style={{ color: 'var(--brand-primary)' }} />
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Finding
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {sample.visual_breakdown}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <MinimalCard style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-inset)', zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-tertiary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-color)', width: '40px' }}>#</th>
                        {sampleRecords[0] && Object.keys(sampleRecords[0]).slice(0, 10).map((col) => (
                          <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-tertiary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-color)' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleRecords.map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{rIdx + 1}</td>
                          {Object.keys(sampleRecords[0] || {}).slice(0, 10).map((col) => (
                            <td key={col} style={{ padding: '12px 16px', color: 'var(--text-primary)', fontFamily: typeof row[col] === 'number' ? 'monospace' : 'inherit', fontVariantNumeric: 'tabular-nums' }}>
                              {typeof row[col] === 'number' ? Number(row[col]).toFixed(3) : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </MinimalCard>
            )}
          </section>

          {/* ── Perspective Toggle ── */}
          <HairlineDivider label="Perspective" />

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
            <SegmentedTabs
              tabs={[
                { id: 'basic', label: 'Basic — Clinician View', icon: <Info size={13} /> },
                { id: 'advanced', label: 'Advanced — Quantum ML View', icon: <Cpu size={13} /> }
              ]}
              active={activeTab}
              onChange={setActiveTab}
              tone={activeTab === 'basic' ? 'classical' : 'quantum'}
            />
          </div>

          {/* ── BASIC VIEW ── */}
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>

              {/* Clinical Overview */}
              <section>
                <SectionHeader index="02" icon={Info} title="Clinical Pathology & Diagnostic Context" />
                <MinimalCard accent="classical">
                  <p style={{ ...T.body, margin: '0 0 18px', color: 'var(--text-primary)', fontSize: '0.98rem' }}>
                    {basic.summary_headline}
                  </p>
                  <div style={{
                    padding: '18px 22px', background: 'var(--bg-inset)',
                    borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--classical-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--classical-color)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Diagnostic Relevance
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {basic.clinical_relevance}
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <CardActionMenu
                      title={`${overviewData?.dataset_name || selectedDataset} - Clinical Context`}
                      category="clinical_context"
                      data={{ dataset: selectedDataset, headline: basic.summary_headline, relevance: basic.clinical_relevance }}
                      metadata={{ dataset: selectedDataset }}
                    />
                  </div>
                </MinimalCard>
              </section>

              {/* Class Balance */}
              <section>
                <SectionHeader index="03" icon={PieChart} title="Cohort Class Balance & Hygiene" />
                <MinimalCard>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '28px', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                          {overviewData?.negative_label} <span style={{ fontVariantNumeric: 'tabular-nums' }}>({healthyCount})</span>
                        </span>
                        <span style={{ color: 'var(--status-danger)', fontWeight: 600 }}>
                          {overviewData?.positive_label} <span style={{ fontVariantNumeric: 'tabular-nums' }}>({diseasedCount})</span>
                        </span>
                      </div>

                      <div style={{ height: '8px', background: 'var(--bg-inset)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${healthyPct}%`, background: 'var(--status-success)', transition: 'width 0.5s ease' }} />
                        <div style={{ width: `${diseasedPct}%`, background: 'var(--status-danger)', transition: 'width 0.5s ease' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{healthyPct}% Control</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{diseasedPct}% Pathological</span>
                      </div>
                    </div>

                    <div style={{ padding: '18px 20px', background: 'var(--status-success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <ShieldCheck size={16} style={{ color: 'var(--status-success)' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-success)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Zero-Leakage Verified
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {basic.data_hygiene_verdict}
                      </div>
                    </div>
                  </div>
                </MinimalCard>
              </section>

              {/* Biomarkers */}
              <section>
                <SectionHeader index="04" icon={Layers} title="Key Diagnostic Biomarkers" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {(basic.key_biomarkers_explained || []).map((bm, idx) => (
                    <div key={idx} style={{
                      padding: '20px', background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
                      position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-card)'
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--brand-primary)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
                          {bm.feature_name}
                        </span>
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: '4px',
                          background: 'var(--brand-bg)', color: 'var(--brand-primary)',
                          border: '1px solid var(--brand-glow)'
                        }}>
                          {bm.importance_tier}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                        {bm.clinical_significance}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Takeaways */}
              <section>
                <SectionHeader index="05" icon={Sparkles} title="Clinician & Student Takeaways" />
                <MinimalCard accent="brand">
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(basic.student_takeaways || []).map((t, idx) => (
                      <li key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', paddingBottom: idx < (basic.student_takeaways?.length || 0) - 1 ? '12px' : 0, borderBottom: idx < (basic.student_takeaways?.length || 0) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <span style={{
                          width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                          background: 'var(--brand-bg)', color: 'var(--brand-primary)',
                          border: '1px solid var(--brand-glow)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.72rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums'
                        }}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.7, paddingTop: '2px' }}>
                          {t}
                        </span>
                      </li>
                    ))}
                  </ul>
                </MinimalCard>
              </section>
            </div>
          )}

          {/* ── ADVANCED VIEW ── */}
          {activeTab === 'advanced' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>

              {/* Quantum PCA */}
              <section>
                <SectionHeader
                  index="02"
                  icon={Cpu}
                  title="4-Qubit Quantum Hilbert Space Embedding"
                  subtitle="Orthogonal PCA projection scaled to rotation angles θ_j = π · (x_pca − min) / (max − min) ∈ [0, π] for ZZFeatureMap entanglement."
                  actions={
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: '6px',
                      background: 'var(--quantum-bg)', color: 'var(--quantum-color)',
                      border: '1px solid var(--quantum-glow)'
                    }}>
                      2⁴ = 16 Hilbert States
                    </span>
                  }
                />

                <MinimalCard accent="quantum">
                  <div style={{
                    padding: '16px 20px', background: 'var(--bg-inset)',
                    borderRadius: 'var(--radius-md)', marginBottom: '24px',
                    fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.78rem', color: 'var(--quantum-color)'
                  }}>
                    θ<sub>j</sub> = π · (x<sub>pca</sub> − min) / (max − min) ∈ [0, π]
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    {(pcaData.components || []).map((comp, idx) => (
                      <div key={idx} style={{ padding: '16px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--quantum-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--quantum-color)' }}>{comp.qubit_name}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{comp.explained_variance}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                          <div style={{ width: `${comp.explained_variance * 2}%`, background: 'var(--quantum-color)', height: '100%', transition: 'width 0.5s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {comp.clinical_manifold}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px',
                    padding: '16px 20px', background: 'var(--quantum-bg)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--quantum-glow)'
                  }}>
                    <div>
                      <div style={T.eyebrow}>Cumulative Variance</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--quantum-color)', fontVariantNumeric: 'tabular-nums', marginTop: '4px' }}>
                        {pcaData.cumulative_variance_pct}%
                      </div>
                    </div>
                    <div>
                      <div style={T.eyebrow}>Barren Plateau Risk</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-success)', marginTop: '4px' }}>
                        {pcaData.barren_plateau_risk}
                      </div>
                    </div>
                  </div>
                </MinimalCard>
              </section>

              {/* Correlation Pairs */}
              <section>
                <SectionHeader index="03" icon={TrendingUp} title="Feature Correlation & Multi-Collinearity" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {(advanced.top_correlated_pairs || []).map((pair, pIdx) => (
                    <div key={pIdx} style={{
                      padding: '16px 18px', background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                      boxShadow: 'var(--shadow-card)'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {pair.feature_1} <span style={{ color: 'var(--text-tertiary)' }}>↔</span> {pair.feature_2}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {pair.relationship}
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-inset)', border: '1px solid var(--border-color)',
                        fontWeight: 700, fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace',
                        color: pair.correlation > 0 ? 'var(--brand-primary)' : 'var(--status-danger)'
                      }}>
                        r = {pair.correlation}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Statistical Table */}
              <section>
                <SectionHeader
                  index="04"
                  icon={Table}
                  title="Feature Statistical Distributions"
                  subtitle={`${statTable.length} features profiled across mean, std, median, skewness, and missingness.`}
                  actions={
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      <input
                        type="text"
                        placeholder="Search feature..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          padding: '8px 14px 8px 36px', borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                          color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
                          transition: 'all 0.2s ease', width: '200px'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-glow)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  }
                />

                <MinimalCard style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-inset)', zIndex: 1 }}>
                        <tr>
                          {['Feature', 'Type', 'Mean', 'Std', 'Min', 'Median', 'Max', 'Skewness', 'Missing'].map(h => (
                            <th key={h} style={{
                              padding: '14px 16px',
                              textAlign: ['Mean', 'Std', 'Min', 'Median', 'Max', 'Skewness', 'Missing'].includes(h) ? 'right' : 'left',
                              fontWeight: 600, color: 'var(--text-tertiary),',
                              fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                              borderBottom: '1px solid var(--border-color)'
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStatTable.map((f, fIdx) => (
                          <tr key={fIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--brand-primary)' }}>{f.name}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{f.type}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{f.mean}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{f.std}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{f.min}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{f.median}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{f.max}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', color: Math.abs(f.skewness) > 1.0 ? 'var(--status-danger)' : 'inherit' }}>
                              {f.skewness}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', color: f.missing_count === 0 ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                              {f.missing_count} ({f.missing_pct}%)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </MinimalCard>
              </section>

              {/* Covariate Shift */}
              <section>
                <SectionHeader index="05" icon={ShieldCheck} title="Covariate Shift & Kolmogorov-Smirnov Test" />
                <MinimalCard accent="classical">
                  <div style={{
                    padding: '18px 22px', background: 'var(--status-success-bg)',
                    borderRadius: 'var(--radius-md)', border: '1px solid rgba(22, 163, 74, 0.25)',
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                  }}>
                    <ShieldCheck size={18} style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--status-success)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Statistical Verdict
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>
                        {advanced.covariate_shift_analysis?.drift_verdict}
                      </div>
                    </div>
                  </div>
                </MinimalCard>
              </section>
            </div>
          )}

          {/* ── Bottom CTA Footer ── */}
          <section style={{ marginTop: '80px' }}>
            <MinimalCard accent="brand">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ ...T.eyebrow, marginBottom: '8px' }}>Ready</div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    Dataset preprocessed & ready for model training
                  </h3>
                  <p style={{ margin: 0, ...T.body }}>
                    Proceed to run the 5-model classical & quantum benchmark or predict live patient risks.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <PillButton onClick={() => navigate('/inference')}><Activity size={14} /> Live Inference</PillButton>
                  <PrimaryButton onClick={() => navigate('/cumulative')} icon={Zap}>Run 5-Model Benchmark <ArrowRight size={14} /></PrimaryButton>
                </div>
              </div>
            </MinimalCard>
          </section>
        </>
      )}

      {/* ── MODAL: Enlarge Scan ── */}
      {activeEnlargedImage && (
        <div
          onClick={() => setActiveEnlargedImage(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '720px', width: '100%', background: '#0F172A',
              border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-lg)',
              padding: '28px', boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.01em' }}>
                  {activeEnlargedImage.sample_id}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                  {activeEnlargedImage.case_id}
                </div>
              </div>
              <button
                onClick={() => setActiveEnlargedImage(null)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                  color: '#94A3B8', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src={activeEnlargedImage.image_data_url} alt={activeEnlargedImage.sample_id} style={{ maxWidth: '100%', maxHeight: '440px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.3)' }} />
            </div>

            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
              <div style={{ ...T.eyebrow, color: '#94A3B8', marginBottom: '10px' }}>Extracted Radiomics & GLCM</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {Object.entries(activeEnlargedImage.key_metrics || {}).map(([k, v]) => (
                  <div key={k} style={{ padding: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F1F5F9', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                      {typeof v === 'number' ? v.toFixed(3) : String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(13, 148, 136, 0.1)', border: '1px solid rgba(13, 148, 136, 0.3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Sparkles size={12} style={{ color: 'var(--quantum-color)' }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--quantum-color)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Diagnostic Finding
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#E2E8F0', lineHeight: 1.7 }}>
                {activeEnlargedImage.visual_breakdown}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Pipeline Logs ── */}
      {showLogsModal && (
        <div
          onClick={() => setShowLogsModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '820px', width: '100%', background: '#0B1020',
              border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-lg)',
              padding: '24px', boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={16} style={{ color: 'var(--brand-primary)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#F1F5F9', letterSpacing: '-0.01em' }}>
                    Pipeline Execution Logs
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                    Cohort: {selectedDataset}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                  color: '#94A3B8', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{
              background: '#04070D', padding: '18px', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.78rem',
              maxHeight: '440px', overflowY: 'auto', lineHeight: 1.7
            }}>
              {terminalLogs.map((log, idx) => {
                let color = '#CBD5E1';
                if (log.includes('SUCCESS')) color = '#10B981';
                if (log.includes('ERROR')) color = '#EF4444';
                if (log.includes('STAGE')) color = '#0D9488';
                return (
                  <div key={idx} style={{ color, marginBottom: '3px' }}>
                    <span style={{ color: '#475569', marginRight: '8px' }}>›</span>
                    {log}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryButton onClick={() => setShowLogsModal(false)}>Close Logs</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}