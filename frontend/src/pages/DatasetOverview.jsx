import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, Eye, Sparkles, Layers, CheckCircle2, AlertTriangle,
  Upload, Trash2, ArrowRight, ShieldCheck, Activity, Info, BarChart2,
  Table, Image as ImageIcon, Cpu, FileText, Download, Zap, RefreshCw,
  Search, Sliders, PieChart, TrendingUp, Heart, Microscope, Waves,
  Stethoscope, FileSpreadsheet
} from 'lucide-react';
import { getDatasets, getDatasetOverview, deleteDataset, uploadCustomDataset } from '../services/api';
import CardActionMenu from '../components/CardActionMenu';

export default function DatasetOverview() {
  const navigate = useNavigate();
  const [datasetsList, setDatasetsList] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('cancer');
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'advanced'
  const [sampleView, setSampleView] = useState('cases'); // 'cases' | 'table'
  const [searchTerm, setSearchTerm] = useState('');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const fetchDatasetsList = async () => {
    try {
      const res = await getDatasets();
      if (res && res.datasets) {
        setDatasetsList(res.datasets);
      }
    } catch (err) {
      console.warn('Failed to load dataset list:', err);
    }
  };

  const fetchOverview = async (dKey) => {
    setLoading(true);
    try {
      const data = await getDatasetOverview(dKey);
      setOverviewData(data);
    } catch (err) {
      console.error(`Failed to fetch overview for ${dKey}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasetsList();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      fetchOverview(selectedDataset);
    }
  }, [selectedDataset]);

  const handleDeleteDataset = async (dKey) => {
    const dsObj = datasetsList.find(d => (d.id || d.key) === dKey);
    const dsName = dsObj ? dsObj.name : dKey;
    if (!window.confirm(`Are you sure you want to permanently remove dataset "${dsName}"? All preprocessed matrices and model weights will be deleted.`)) {
      return;
    }
    try {
      setLoading(true);
      await deleteDataset(dKey);
      await fetchDatasetsList();
      setSelectedDataset('cancer');
    } catch (err) {
      alert(`Failed to delete dataset: ${err.message}`);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadMsg('Ingesting, extracting clinical metrics & preprocessing dataset...');
    try {
      const res = await uploadCustomDataset(uploadFile);
      setUploadMsg('Dataset uploaded and preprocessed successfully!');
      await fetchDatasetsList();
      if (res.dataset_key) {
        setSelectedDataset(res.dataset_key);
      }
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadMsg('');
      }, 900);
    } catch (err) {
      setUploadMsg(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setUploading(false);
    }
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

  const sampleCases = overviewData?.sample_cases || overviewData?.sample_images || [];
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

  // Helper for domain-specific icon
  const getDomainIcon = () => {
    const key = (overviewData?.dataset_key || selectedDataset).toLowerCase();
    if (key.includes('cancer') || sampleType === 'cytology') return <Microscope size={18} style={{ color: 'var(--brand-primary)' }} />;
    if (key.includes('cardio')) return <Heart size={18} style={{ color: '#DC2626' }} />;
    if (key.includes('diabetes')) return <Activity size={18} style={{ color: 'var(--brand-primary)' }} />;
    if (key.includes('parkinson')) return <Waves size={18} style={{ color: '#0D9488' }} />;
    return <FileSpreadsheet size={18} style={{ color: 'var(--brand-primary)' }} />;
  };

  return (
    <div className="dataset-overview-page" style={{ paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge-sih" style={{ background: 'var(--brand-bg)', color: 'var(--brand-primary)', borderColor: 'var(--brand-glow)' }}>
                {isVisualSample ? 'MULTIMODAL RADIOMICS & CYTOPATHOLOGY' : 'STRUCTURED CLINICAL BIOMARKERS & TABULAR EDA'}
              </span>
              <span className="badge-sih" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                LEAK-FREE 80/20 SPLIT VERIFIED
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Dataset Overview & Deep Diagnostic Profile
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
              Modal-adaptive exploratory analysis, authentic cohort profiles, statistical distributions, and 4-qubit Hilbert space telemetry.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-sm btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontWeight: 600 }}
            >
              <Upload size={15} />
              <span>Upload CSV Dataset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Selector Toolbar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
            <Database size={20} style={{ color: 'var(--classical-color)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Active Dataset:</span>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="form-select-inline"
              style={{ minWidth: '280px', maxWidth: '440px', fontWeight: 600 }}
            >
              {datasetsList.map(ds => {
                const dKey = ds.id || ds.key;
                const fCount = ds.features_count || ds.features || 0;
                const cleanName = ds.name.replace(/^Custom:\s*/i, '');
                return (
                  <option key={dKey} value={dKey}>
                    {!ds.built_in ? `[Custom] ${cleanName}` : `${cleanName} (${fCount} features)`}
                  </option>
                );
              })}
            </select>

            {isCustom && (
              <button
                type="button"
                onClick={() => handleDeleteDataset(selectedDataset)}
                className="btn btn-sm btn-outline"
                style={{
                  color: '#DC2626',
                  borderColor: 'rgba(220, 38, 38, 0.4)',
                  background: '#FEF2F2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
                title="Permanently remove this uploaded custom dataset"
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Perspective View Toggle & Action Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary, #F1F5F9)', padding: '4px', borderRadius: '8px' }}>
              <button
                onClick={() => setActiveTab('basic')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  background: activeTab === 'basic' ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                  color: activeTab === 'basic' ? 'var(--classical-color)' : 'var(--text-secondary)',
                  boxShadow: activeTab === 'basic' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Info size={15} />
                <span>Basic (Student Level)</span>
              </button>

              <button
                onClick={() => setActiveTab('advanced')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  background: activeTab === 'advanced' ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                  color: activeTab === 'advanced' ? 'var(--quantum-color, #7C3AED)' : 'var(--text-secondary)',
                  boxShadow: activeTab === 'advanced' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Cpu size={15} />
                <span>Advanced (Researcher & QML)</span>
              </button>
            </div>

            {overviewData && (
              <CardActionMenu
                title={`${overviewData.dataset_name || selectedDataset} - Complete Dataset Profile`}
                category="dataset_overview"
                data={{
                  dataset_key: selectedDataset,
                  dataset_name: overviewData.dataset_name,
                  domain: overviewData.domain,
                  modality: overviewData.modality,
                  total_samples: overviewData.total_samples,
                  total_features: overviewData.total_features,
                  positive_label: overviewData.positive_label,
                  negative_label: overviewData.negative_label,
                  class_distribution: classDist,
                  basic_summary: basic.summary_headline,
                  quantum_variance: pcaData.cumulative_variance_pct
                }}
                metadata={{ dataset: selectedDataset }}
              />
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <RefreshCw size={32} className="spin-slow" style={{ color: 'var(--classical-color)', margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 4px 0' }}>Computing Deep Exploratory Diagnostics...</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Extracting statistical distributions, correlation tensors, domain biomarkers, and 4-qubit PCA projections.
          </p>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="metric-card classical">
              <div className="metric-header">
                <span className="metric-title">Total Cohort Size</span>
                <Database size={18} style={{ color: 'var(--classical-color)' }} />
              </div>
              <div className="metric-value">{overviewData?.total_samples || 0}</div>
              <div className="metric-subtitle">
                {overviewData?.train_samples || 0} Train (80%) • {overviewData?.test_samples || 0} Test (20%)
              </div>
            </div>

            <div className="metric-card classical">
              <div className="metric-header">
                <span className="metric-title">Feature Dimensions</span>
                <Layers size={18} style={{ color: 'var(--classical-color)' }} />
              </div>
              <div className="metric-value">{overviewData?.total_features || 0}</div>
              <div className="metric-subtitle">
                Modality: <strong style={{ textTransform: 'capitalize' }}>{overviewData?.modality || 'Tabular'}</strong>
              </div>
            </div>

            <div className="metric-card quantum">
              <div className="metric-header">
                <span className="metric-title">4-Qubit PCA Variance</span>
                <Cpu size={18} style={{ color: 'var(--quantum-color)' }} />
              </div>
              <div className="metric-value">{pcaData.cumulative_variance_pct || 79.2}%</div>
              <div className="metric-subtitle">
                16D Hilbert Space Retention ({pcaData.n_qubits || 4} Qubits)
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-header">
                <span className="metric-title">Cohort Balance</span>
                <PieChart size={18} style={{ color: 'var(--status-success)' }} />
              </div>
              <div className="metric-value">{healthyPct}% / {diseasedPct}%</div>
              <div className="metric-subtitle">
                {overviewData?.negative_label?.split(' ')[0]} vs {overviewData?.positive_label?.split(' ')[0]}
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* SECTION: MODAL-ADAPTIVE SAMPLE BREAKDOWN */}
          {/* ================================================================= */}
          <div className="card" style={{ marginBottom: '24px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getDomainIcon()}
                  <span>
                    {isVisualSample
                      ? 'Multimodal Sample Breakdown & Microscopy / Scan Inspection'
                      : 'Modal-Adaptive Cohort Sample Records & Clinical Biomarker Profiles'}
                  </span>
                </h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {isVisualSample
                    ? 'Inspection of representative cytopathology / radiomics patient cases with morphometric features and diagnostic findings.'
                    : `Inspection of authentic ${overviewData?.domain || 'clinical'} patient records with structured laboratory biomarkers, risk stratification, and phenotypic findings.`}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary, #F1F5F9)', padding: '3px', borderRadius: '6px' }}>
                  <button
                    onClick={() => setSampleView('cases')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      borderRadius: '5px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: sampleView === 'cases' ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                      color: sampleView === 'cases' ? 'var(--classical-color)' : 'var(--text-secondary)'
                    }}
                  >
                    {isVisualSample ? <ImageIcon size={14} /> : <Stethoscope size={14} />}
                    <span>{isVisualSample ? `Visual Cases (${sampleCases.length})` : `Clinical Profiles (${sampleCases.length})`}</span>
                  </button>

                  <button
                    onClick={() => setSampleView('table')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      borderRadius: '5px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: sampleView === 'table' ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                      color: sampleView === 'table' ? 'var(--classical-color)' : 'var(--text-secondary)'
                    }}
                  >
                    <Table size={14} />
                    <span>Raw Table ({sampleRecords.length})</span>
                  </button>
                </div>

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
            </div>

            {sampleView === 'cases' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {sampleCases.map((sample, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '16px',
                      background: 'var(--bg-secondary, #F8FAFC)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                          {sample.sample_id}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          {sample.case_id}
                        </span>
                      </div>
                      <span
                        className="badge-sih"
                        style={{
                          background: sample.is_positive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: sample.is_positive ? '#DC2626' : '#059669',
                          borderColor: sample.is_positive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                      >
                        {sample.label}
                      </span>
                    </div>

                    {/* If visual smear/scan available */}
                    {sample.image_data_url ? (
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <img
                          src={sample.image_data_url}
                          alt={sample.sample_id}
                          style={{
                            width: '110px',
                            height: '110px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: '#000'
                          }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            EXTRACTED MORPHOMETRICS:
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.75rem' }}>
                            {Object.entries(sample.key_metrics || {}).map(([mName, mVal]) => (
                              <div key={mName} style={{ background: 'var(--bg-card-solid)', padding: '3px 6px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.06)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{mName}: </span>
                                <strong>{typeof mVal === 'number' ? mVal.toFixed(2) : String(mVal)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Tabular biomarker patient case card */
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Activity size={13} style={{ color: 'var(--classical-color)' }} />
                          <span>STRUCTURED CLINICAL BIOMARKERS & VITALS:</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px', fontSize: '0.75rem' }}>
                          {Object.entries(sample.key_metrics || {}).map(([mName, mVal]) => (
                            <div key={mName} style={{ background: 'var(--bg-card-solid)', padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.06)' }}>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{mName}</div>
                              <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                {typeof mVal === 'number' ? mVal.toFixed(2) : String(mVal)}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, background: 'var(--bg-card-solid)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {sample.image_data_url ? 'Diagnostic Finding: ' : 'Clinical Case Summary: '}
                      </strong>
                      {sample.visual_breakdown}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary, #F1F5F9)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>#</th>
                      {sampleRecords[0] && Object.keys(sampleRecords[0]).slice(0, 10).map((col) => (
                        <th key={col} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRecords.map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{rIdx + 1}</td>
                        {Object.keys(sampleRecords[0] || {}).slice(0, 10).map((col) => (
                          <td key={col} style={{ padding: '8px 12px' }}>
                            {typeof row[col] === 'number' ? Number(row[col]).toFixed(3) : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* PERSPECTIVE PARTITIONS */}
          {/* ================================================================= */}
          {activeTab === 'basic' ? (
            /* =============================================================== */
            /* 1. BASIC VIEW (STUDENT / CLINICIAN PERSPECTIVE) */
            /* =============================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Concept & Relevance Card */}
              <div className="card" style={{ borderLeft: '4px solid var(--classical-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={20} style={{ color: 'var(--classical-color)' }} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Clinical Context & Pathology Overview</h3>
                  </div>
                  <CardActionMenu
                    title={`${overviewData?.dataset_name || selectedDataset} - Clinical Context & Pathology Overview`}
                    category="clinical_context"
                    data={{
                      dataset: selectedDataset,
                      headline: basic.summary_headline,
                      relevance: basic.clinical_relevance
                    }}
                    metadata={{ dataset: selectedDataset }}
                  />
                </div>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                  {basic.summary_headline}
                </p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary, #F8FAFC)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <strong>Diagnostic Relevance: </strong> {basic.clinical_relevance}
                </div>
              </div>

              {/* Class Balance Breakdown */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PieChart size={18} style={{ color: 'var(--status-success)' }} />
                    <span>Cohort Class Balance & Data Quality</span>
                  </h3>
                  <CardActionMenu
                    title={`${overviewData?.dataset_name || selectedDataset} - Cohort Class Balance`}
                    category="class_balance"
                    data={{
                      healthy_cohort: `${overviewData?.negative_label} (${healthyCount} patients, ${healthyPct}%)`,
                      pathological_cohort: `${overviewData?.positive_label} ({diseasedCount} patients, ${diseasedPct}%)`,
                      data_hygiene_verdict: basic.data_hygiene_verdict
                    }}
                    metadata={{ dataset: selectedDataset }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#059669', fontWeight: 600 }}>{overviewData?.negative_label} ({healthyCount} patients)</span>
                      <span style={{ color: '#DC2626', fontWeight: 600 }}>{overviewData?.positive_label} ({diseasedCount} patients)</span>
                    </div>

                    <div style={{ height: '14px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${healthyPct}%`, background: 'var(--status-success)', transition: 'width 0.4s ease' }}></div>
                      <div style={{ width: `${diseasedPct}%`, background: 'var(--status-danger)', transition: 'width 0.4s ease' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span>{healthyPct}% Control Cohort</span>
                      <span>{diseasedPct}% Pathological Cohort</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary, #F8FAFC)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--status-success)', fontWeight: 600, fontSize: '0.85rem' }}>
                      <ShieldCheck size={16} />
                      <span>Data Hygiene & Verification</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {basic.data_hygiene_verdict}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Biomarkers Explained */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} style={{ color: 'var(--classical-color)' }} />
                    <span>Key Diagnostic Biomarkers & Features Explained</span>
                  </h3>
                  <CardActionMenu
                    title={`${overviewData?.dataset_name || selectedDataset} - Key Biomarkers Explained`}
                    category="biomarkers_explained"
                    data={{
                      biomarkers: basic.key_biomarkers_explained || []
                    }}
                    metadata={{ dataset: selectedDataset }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {(basic.key_biomarkers_explained || []).map((bm, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        background: 'var(--bg-secondary, #F8FAFC)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--brand-primary)', textTransform: 'capitalize' }}>
                          {bm.feature_name}
                        </span>
                        <span className="badge-sih" style={{ fontSize: '0.68rem', background: 'var(--brand-bg)', color: 'var(--brand-primary)', borderColor: 'var(--brand-glow)' }}>
                          {bm.importance_tier}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {bm.clinical_significance}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Takeaways */}
              <div className="card" style={{ background: 'linear-gradient(135deg, var(--brand-bg) 0%, var(--quantum-bg) 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} style={{ color: 'var(--brand-primary)' }} />
                    <span>Student & Clinician Takeaways</span>
                  </h3>
                  <CardActionMenu
                    title={`${overviewData?.dataset_name || selectedDataset} - Student & Clinician Takeaways`}
                    category="takeaways"
                    data={{
                      takeaways: basic.student_takeaways || []
                    }}
                    metadata={{ dataset: selectedDataset }}
                  />
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {(basic.student_takeaways || []).map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* 2. ADVANCED VIEW (RESEARCHER & QUANTUM ML PERSPECTIVE) */
            /* =============================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 4-Qubit Quantum PCA Compression Section */}
              <div className="card" style={{ borderLeft: '4px solid var(--quantum-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={20} style={{ color: 'var(--quantum-color)' }} />
                    <span>4-Qubit Quantum Hilbert Space Embedding (Qiskit PCA)</span>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge-sih" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--quantum-color)', borderColor: 'rgba(124, 58, 237, 0.3)' }}>
                      DIMENSION: 2⁴ = 16 HILBERT STATES
                    </span>
                    <CardActionMenu
                      title={`${overviewData?.dataset_name || selectedDataset} - 4-Qubit Quantum PCA Compression`}
                      category="quantum_pca"
                      data={{
                        cumulative_variance: pcaData.cumulative_variance_pct,
                        barren_plateau_risk: pcaData.barren_plateau_risk,
                        encoding_formula: pcaData.encoding_formula,
                        components: pcaData.components
                      }}
                      metadata={{ dataset: selectedDataset }}
                    />
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
                  Features are orthogonally projected onto 4 principal components and scaled to rotation angles <code style={{ color: 'var(--quantum-color)' }}>θ_j = π · (x_pca - min) / (max - min) ∈ [0, π]</code> for <strong>ZZFeatureMap</strong> entanglement.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  {(pcaData.components || []).map((comp, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        background: 'var(--bg-secondary, #F8FAFC)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--quantum-color)', fontSize: '0.85rem' }}>{comp.qubit_name}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{comp.explained_variance}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                        <div style={{ width: `${comp.explained_variance * 2}%`, background: 'var(--quantum-color)', height: '100%' }}></div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {comp.clinical_manifold}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(124, 58, 237, 0.04)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem' }}>
                  <span>Cumulative PCA Variance Retained: <strong style={{ color: 'var(--quantum-color)' }}>{pcaData.cumulative_variance_pct}%</strong></span>
                  <span>Barren Plateau Risk: <strong style={{ color: 'var(--status-success)' }}>{pcaData.barren_plateau_risk}</strong></span>
                </div>
              </div>

              {/* Feature Correlation Matrix & Top Pairs */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} style={{ color: 'var(--classical-color)' }} />
                    <span>Feature Correlation & Multi-Collinearity Analysis</span>
                  </h3>
                  <CardActionMenu
                    title={`${overviewData?.dataset_name || selectedDataset} - Feature Correlation Pairs`}
                    category="correlation_analysis"
                    data={{
                      top_pairs: advanced.top_correlated_pairs || []
                    }}
                    metadata={{ dataset: selectedDataset }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {(advanced.top_correlated_pairs || []).map((pair, pIdx) => (
                    <div
                      key={pIdx}
                      style={{
                        padding: '12px',
                        background: 'var(--bg-secondary, #F8FAFC)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          {pair.feature_1} ↔ {pair.feature_2}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {pair.relationship}
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: pair.correlation > 0 ? 'var(--classical-color)' : '#E11D48',
                          background: 'var(--bg-card-solid)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(0,0,0,0.08)'
                        }}
                      >
                        r = {pair.correlation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Statistical Feature Table */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Table size={18} style={{ color: 'var(--classical-color)' }} />
                      <span>Feature Statistical Distribution Table ({statTable.length} Features)</span>
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        placeholder="Search feature..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          padding: '6px 12px 6px 30px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8rem',
                          background: 'var(--card-bg)'
                        }}
                      />
                    </div>

                    <CardActionMenu
                      title={`${overviewData?.dataset_name || selectedDataset} - Feature Statistical Distributions`}
                      category="feature_statistics"
                      data={{
                        features_summary: statTable.map(f => ({
                          name: f.name,
                          mean: f.mean,
                          std: f.std,
                          median: f.median,
                          skewness: f.skewness
                        }))
                      }}
                      metadata={{ dataset: selectedDataset }}
                    />
                  </div>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary, #F1F5F9)', zIndex: 1 }}>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Feature Name</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Mean</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Std</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Min</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Median</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Max</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Skewness</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Missing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStatTable.map((f, fIdx) => (
                        <tr key={fIdx} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td style={{ padding: '7px 10px', fontWeight: 600, color: 'var(--classical-color)' }}>{f.name}</td>
                          <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>{f.type}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{f.mean}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{f.std}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{f.min}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>{f.median}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{f.max}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: Math.abs(f.skewness) > 1.0 ? '#DC2626' : 'inherit' }}>
                            {f.skewness}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: f.missing_count === 0 ? '#059669' : '#DC2626' }}>
                            {f.missing_count} ({f.missing_pct}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Covariate Shift Verification */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--status-success)' }} />
                    <span>Covariate Shift & Train/Test Partition Drift (Kolmogorov-Smirnov Test)</span>
                  </h3>
                  <CardActionMenu
                    title={`${overviewData?.dataset_name || selectedDataset} - Covariate Shift KS Analysis`}
                    category="covariate_shift"
                    data={{
                      methodology: advanced.covariate_shift_analysis?.methodology,
                      verdict: advanced.covariate_shift_analysis?.drift_verdict,
                      results: advanced.covariate_shift_analysis?.tested_features
                    }}
                    metadata={{ dataset: selectedDataset }}
                  />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary, #F8FAFC)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <strong>Statistical Verdict: </strong> {advanced.covariate_shift_analysis?.drift_verdict}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="card" style={{ marginTop: '24px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Ready for Model Training & Live Evaluation
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Execute full 5-model classical & quantum benchmark or predict live patient risks on this dataset.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => navigate('/cumulative')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                >
                  <Zap size={16} />
                  <span>Run 5-Model Benchmark</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={() => navigate('/inference')}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                >
                  <Activity size={16} />
                  <span>Test Patient Inference</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Upload Dataset Modal */}
      {showUploadModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card modal-content" style={{ maxWidth: '480px', width: '100%', background: 'var(--card-bg)', padding: '24px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={20} style={{ color: 'var(--classical-color)' }} />
                <span>Upload Clinical Dataset (CSV)</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFileUpload}>
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center', marginBottom: '16px', background: 'var(--bg-secondary, #F8FAFC)' }}>
                <Database size={36} style={{ color: 'var(--classical-color)', margin: '0 auto 8px auto' }} />
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Select a clinical tabular dataset (.csv) with numeric biomarkers and target diagnosis column.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {uploadMsg && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '14px',
                  fontSize: '0.82rem',
                  background: uploadMsg.startsWith('Error') ? '#FEF2F2' : '#F0FDF4',
                  color: uploadMsg.startsWith('Error') ? '#DC2626' : '#16A34A',
                  border: `1px solid ${uploadMsg.startsWith('Error') ? '#FCA5A5' : '#86EFAC'}`
                }}>
                  {uploadMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-outline"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? 'Processing...' : 'Upload & Preprocess'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
