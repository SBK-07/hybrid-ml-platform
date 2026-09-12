import React, { useState, useEffect } from 'react';
import {
  Cpu, Key, Server, Zap, CheckCircle2, AlertCircle, Play, RotateCcw,
  Layers, Activity, Code2, ExternalLink, Shield, HelpCircle, ChevronDown,
  ChevronUp, Eye, EyeOff, Trash2, Sparkles, Info
} from 'lucide-react';
import CardActionMenu from '../components/CardActionMenu';
import Atom4Orbits from '../components/Atom4Orbits';
import {
  getRealQCStatus,
  getRealQCBackends,
  saveRealQCCredentials,
  deleteRealQCCredentials,
  runRealQCExperiment,
  getDatasets
} from '../services/api';

/* ── Minimalist Design Tokens ──────────────────────────────── */
const T = {
  eyebrow: {
    fontSize: '0.68rem',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--text-tertiary)'
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
    boxShadow: 'var(--shadow-card)'
  },
  terminal: {
    background: '#0B1020',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '0.78rem',
    lineHeight: 1.7,
    color: '#CBD5E1'
  }
};

function SectionHeader({ index, icon: Icon, title, subtitle, actions }) {
  return (
    <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: '260px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={T.eyebrow}>{index}</span>
          <span style={{ width: '28px', height: '1px', background: 'var(--border-color)' }} />
          {Icon && <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />}
        </div>
        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {subtitle && <p style={{ margin: '8px 0 0', ...T.body, maxWidth: '680px' }}>{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

function HairlineDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '64px 0 48px' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
      <span style={T.eyebrow}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
    </div>
  );
}

export default function RealQCExperiment() {
  // Connection & Auth State
  const [qcStatus, setQcStatus] = useState(null);
  const [backends, setBackends] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [authForm, setAuthForm] = useState({
    token: '',
    instance: '',
    channel: 'ibm_quantum_platform',
    name: 'default-ibm-runtime'
  });
  const [showToken, setShowToken] = useState(false);
  const [savingAuth, setSavingAuth] = useState(false);
  const [authFeedback, setAuthFeedback] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState('quantum_platform');

  // Experiment Configuration
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('cancer');
  const [selectedExperiment, setSelectedExperiment] = useState('quantum_kernel_overlap');
  const [selectedBackend, setSelectedBackend] = useState('ibm_brisbane');
  const [shots, setShots] = useState(1024);
  const [forceSimulation, setForceSimulation] = useState(false);

  // Execution & Results
  const [isExecuting, setIsExecuting] = useState(false);
  const [experimentResult, setExperimentResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);

  // Load Status and Backends on Mount
  useEffect(() => {
    loadStatusAndBackends();
    loadDatasetList();
  }, []);

  const loadStatusAndBackends = async () => {
    setLoadingStatus(true);
    try {
      const [statusRes, backendsRes] = await Promise.all([
        getRealQCStatus(),
        getRealQCBackends()
      ]);
      setQcStatus(statusRes);
      if (backendsRes && backendsRes.backends) {
        setBackends(backendsRes.backends);
        if (backendsRes.backends.length > 0 && !selectedBackend) {
          setSelectedBackend(backendsRes.backends[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load QC status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadDatasetList = async () => {
    try {
      const res = await getDatasets();
      if (res && res.datasets) {
        setDatasets(res.datasets);
      }
    } catch (err) {
      console.warn('Using default datasets');
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!authForm.token.trim()) {
      setAuthFeedback({ type: 'error', message: 'Please provide an IBM Quantum API token or IAM Key.' });
      return;
    }
    setSavingAuth(true);
    setAuthFeedback(null);
    try {
      const res = await saveRealQCCredentials({
        token: authForm.token.trim(),
        instance: authForm.instance.trim() || null,
        channel: authForm.channel,
        name: authForm.name
      });
      if (res.status === 'SUCCESS') {
        setAuthFeedback({ type: 'success', message: res.message });
        setAuthForm(prev => ({ ...prev, token: '', instance: '' }));
        await loadStatusAndBackends();
      } else {
        setAuthFeedback({ type: 'error', message: res.message });
      }
    } catch (err) {
      setAuthFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to save credentials to local Qiskit runtime.'
      });
    } finally {
      setSavingAuth(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!window.confirm('Are you sure you want to remove the saved IBM Quantum credentials from your local machine?')) {
      return;
    }
    try {
      const res = await deleteRealQCCredentials(qcStatus?.active_account?.channel, qcStatus?.active_account?.name);
      setAuthFeedback({ type: 'info', message: res.message || 'Credentials removed.' });
      await loadStatusAndBackends();
    } catch (err) {
      setAuthFeedback({ type: 'error', message: 'Failed to delete credentials.' });
    }
  };

  const handleRunExperiment = async () => {
    setIsExecuting(true);
    setExecutionError(null);
    setExperimentResult(null);
    try {
      const payload = {
        experiment_id: selectedExperiment,
        backend_name: selectedBackend,
        shots: parseInt(shots, 10),
        dataset_key: selectedDataset,
        force_simulation: forceSimulation,
        channel: qcStatus?.active_account?.channel || 'ibm_quantum_platform'
      };
      const result = await runRealQCExperiment(payload);
      if (result.status === 'SUCCESS') {
        setExperimentResult(result);
      } else {
        setExecutionError(result.error || result.message || 'Quantum circuit execution failed.');
      }
    } catch (err) {
      console.error('Experiment run error:', err);
      setExecutionError(err.response?.data?.detail || 'Execution request failed. Check your network or QPU availability.');
    } finally {
      setIsExecuting(false);
    }
  };

  const experimentsList = qcStatus?.predefined_experiments || [
    {
      id: 'quantum_kernel_overlap',
      name: 'Quantum Kernel State Overlap (ZZFeatureMap)',
      description: 'Computes transition probability |⟨ϕ(x_A)|ϕ(x_B)⟩|² between patient feature states in 2-qubit Hilbert space.',
      qubits: 2,
      category: 'Quantum Kernel Estimation (QSVM)'
    },
    {
      id: 'vqc_ansatz_execution',
      name: '4-Qubit Variational Quantum Circuit (VQC) Parameterized Ansatz',
      description: 'Runs a 4-qubit parameterized classification circuit with multi-axis rotations and full entangling ladder.',
      qubits: 4,
      category: 'Variational Quantum Classifiers (VQC)'
    },
    {
      id: 'ghz_entanglement_fidelity',
      name: '4-Qubit GHZ Hardware Coherence & Entanglement Benchmark',
      description: 'Prepares 1/√2(|0000⟩ + |1111⟩) to benchmark transmon qubit dephasing and hardware gate fidelity.',
      qubits: 4,
      category: 'Hardware Characterization'
    },
    {
      id: 'patient_biomarker_embedding',
      name: 'Patient Biomarker Hilbert Space Angle Embedding',
      description: 'Embeds actual normalized clinical patient biomarkers into quantum amplitudes using RX/RY rotation maps.',
      qubits: 4,
      category: 'State Encoding & Feature Mapping'
    }
  ];

  const currentExpDetails = experimentsList.find(e => e.id === selectedExperiment);
  const currentBackendDetails = backends.find(b => b.name === selectedBackend);

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '24px 32px 96px' }}>

      {/* ── Editorial Hero ─────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '48px', flexWrap: 'wrap', padding: '56px 0 48px' }}>
        <div style={{ flex: 1, minWidth: '320px', maxWidth: '760px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', marginBottom: '24px',
            border: '1px solid var(--border-color)', borderRadius: '999px',
            background: 'var(--bg-card)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--quantum-color)', boxShadow: '0 0 8px var(--quantum-glow)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Physical QPU Integration · IBM Quantum Runtime
            </span>
          </div>

          <h1 style={{
            margin: '0 0 18px',
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            color: 'var(--text-primary)'
          }}>
            Execute authentic circuits on{' '}
            <span style={{ color: 'var(--quantum-color)' }}>transmon QPUs</span>.
          </h1>

          <p style={{ margin: 0, ...T.body, maxWidth: '600px' }}>
            Dispatch clinical quantum circuits directly to physical superconducting
            QPUs (Eagle & Heron architectures) via IBM Quantum Runtime, or verify
            gate fidelity with Qiskit SamplerV2 primitives.
          </p>
        </div>

        <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--border-color)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', inset: '22px', border: '1px dashed var(--border-color)', borderRadius: '50%', opacity: 0.55 }} />
          <Atom4Orbits size={104} color="var(--quantum-color)" />
        </div>
      </div>

      {/* ── 01 · Runtime Authentication ────────────────────── */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader
          index="01"
          icon={Shield}
          title="Qiskit Runtime Authentication"
          subtitle="Authenticate IBM Quantum Platform or IBM Cloud IAM credentials for physical QPU access."
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '0.72rem',
                fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: qcStatus?.authenticated ? 'var(--status-success-bg)' : 'rgba(245, 158, 11, 0.12)',
                color: qcStatus?.authenticated ? 'var(--status-success)' : '#F59E0B',
                border: `1px solid ${qcStatus?.authenticated ? 'rgba(22, 163, 74, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: qcStatus?.authenticated ? 'var(--status-success)' : '#F59E0B',
                  boxShadow: qcStatus?.authenticated ? '0 0 8px var(--status-success)' : '0 0 8px #F59E0B'
                }} />
                {qcStatus?.authenticated ? `Authenticated (${qcStatus.active_account?.channel})` : 'Simulation Mode'}
              </span>
              <button
                onClick={() => setShowGuide(!showGuide)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <HelpCircle size={14} />
                {showGuide ? 'Hide' : 'Show'} Setup Guide
                {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          }
        />

        <div style={{ ...T.card, padding: '32px' }}>
          <form onSubmit={handleSaveCredentials}>
            {/* Hairline Status Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              borderTop: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '28px'
            }}>
              <div style={{ padding: '20px', borderRight: '1px solid var(--border-color)' }}>
                <div style={T.eyebrow}>Status</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: qcStatus?.authenticated ? 'var(--status-success)' : 'var(--text-tertiary)', marginTop: '6px', letterSpacing: '-0.01em' }}>
                  {qcStatus?.authenticated ? 'Authenticated' : 'Unauthenticated'}
                </div>
              </div>
              <div style={{ padding: '20px', borderRight: '1px solid var(--border-color)' }}>
                <div style={T.eyebrow}>Channel</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {qcStatus?.active_account?.channel || '—'}
                </div>
              </div>
              <div style={{ padding: '20px', borderRight: '1px solid var(--border-color)' }}>
                <div style={T.eyebrow}>Saved Accounts</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {qcStatus?.saved_accounts_count || 0}
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={T.eyebrow}>Backends Available</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--quantum-color)', marginTop: '6px', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {backends.length}
                </div>
              </div>
            </div>

            {/* Channel Selector */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ ...T.eyebrow, marginBottom: '10px' }}>Channel Type</div>
              <div style={{ display: 'inline-flex', padding: '3px', background: 'var(--bg-inset)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', gap: '2px' }}>
                {[
                  { value: 'ibm_quantum_platform', label: 'IBM Quantum Platform' },
                  { value: 'ibm_cloud', label: 'IBM Cloud (IAM)' }
                ].map((c) => (
                  <label key={c.value} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '9px 18px', fontSize: '0.82rem', fontWeight: 600,
                    borderRadius: 'calc(var(--radius-md) - 2px)', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: authForm.channel === c.value ? 'var(--bg-card-solid)' : 'transparent',
                    color: authForm.channel === c.value ? 'var(--quantum-color)' : 'var(--text-secondary)',
                    boxShadow: authForm.channel === c.value ? 'var(--shadow-card)' : 'none'
                  }}>
                    <input
                      type="radio" name="channel" value={c.value}
                      checked={authForm.channel === c.value}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, channel: e.target.value }))}
                      style={{ display: 'none' }}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Token Input */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ ...T.eyebrow, marginBottom: '10px' }}>
                {authForm.channel === 'ibm_quantum_platform' ? 'API Token' : 'IBM Cloud IAM API Key'}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder={authForm.channel === 'ibm_quantum_platform' ? 'Paste 64-char IBM Quantum Token' : 'Paste IAM API Key'}
                  value={authForm.token}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, token: e.target.value }))}
                  style={{
                    width: '100%', padding: '14px 50px 14px 16px',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)', color: 'var(--text-primary)',
                    fontSize: '0.88rem', fontFamily: 'Consolas, Monaco, monospace',
                    fontVariantNumeric: 'tabular-nums', outline: 'none',
                    transition: 'all 0.2s ease', boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--quantum-color)'; e.target.style.boxShadow = '0 0 0 3px var(--quantum-glow)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    color: 'var(--text-tertiary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', padding: '4px'
                  }}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* CRN Input (IBM Cloud only) */}
            {authForm.channel === 'ibm_cloud' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ ...T.eyebrow, marginBottom: '10px' }}>
                  Cloud Resource Name (CRN) / Instance (Optional)
                </div>
                <input
                  type="text"
                  placeholder="crn:v1:bluemix:public:quantum-computing:..."
                  value={authForm.instance}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, instance: e.target.value }))}
                  style={{
                    width: '100%', padding: '14px 16px',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-input)', color: 'var(--text-primary)',
                    fontSize: '0.88rem', fontFamily: 'Consolas, Monaco, monospace',
                    fontVariantNumeric: 'tabular-nums', outline: 'none',
                    transition: 'all 0.2s ease', boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--quantum-color)'; e.target.style.boxShadow = '0 0 0 3px var(--quantum-glow)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            )}

                        {/* Feedback Banner */}
            {authFeedback && (() => {
              const isSuccess = authFeedback.type === 'success';
              const isInfo = authFeedback.type === 'info';
              
              const bgColor = isSuccess ? 'var(--status-success-bg)' : (isInfo ? 'rgba(16, 185, 129, 0.08)' : 'var(--status-danger-bg)');
              const textColor = isSuccess ? 'var(--status-success)' : (isInfo ? 'var(--brand-primary)' : 'var(--status-danger)');
              const borderColor = isSuccess ? 'rgba(22, 163, 74, 0.25)' : (isInfo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.25)');
              const leftBorderColor = isSuccess ? 'var(--status-success)' : (isInfo ? 'var(--brand-primary)' : 'var(--status-danger)');

              return (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: bgColor,
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderLeft: `2px solid ${leftBorderColor}`
                }}>
                  {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span style={{ lineHeight: 1.55 }}>{authFeedback.message}</span>
                </div>
              );
            })()}


            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={savingAuth}
                style={{
                  height: '46px', padding: '0 24px', borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: savingAuth ? 'var(--text-tertiary)' : 'var(--quantum-color)',
                  color: '#FFFFFF', fontSize: '0.88rem', fontWeight: 600,
                  cursor: savingAuth ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  boxShadow: savingAuth ? 'none' : '0 2px 8px var(--quantum-glow)',
                  transition: 'all 0.2s ease', letterSpacing: '-0.01em'
                }}
                onMouseEnter={(e) => { if (!savingAuth) { e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={(e) => { if (!savingAuth) { e.currentTarget.style.transform = 'translateY(0)'; } }}
              >
                {savingAuth ? <RotateCcw className="spinning" size={15} /> : <Key size={15} />}
                {savingAuth ? 'Saving to Qiskit Runtime...' : 'Save & Authenticate Qiskit Runtime'}
              </button>

              {qcStatus?.authenticated && (
                <button
                  type="button"
                  onClick={handleDeleteCredentials}
                  style={{
                    height: '46px', padding: '0 20px', borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(220, 38, 38, 0.25)', background: 'transparent',
                    color: 'var(--status-danger)', fontSize: '0.85rem', fontWeight: 600,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--status-danger-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Trash2 size={14} /> Remove Saved Account
                </button>
              )}
            </div>

            {/* Active Config Info */}
            {qcStatus?.saved_accounts_count > 0 && (
              <div style={{
                marginTop: '24px', padding: '16px 20px',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.82rem', color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Active Qiskit Config:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Consolas, Monaco, monospace', fontVariantNumeric: 'tabular-nums' }}>
                    ~/.qiskit/qiskit-ibm.json
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Registered Channels:</span>
                  <span style={{ fontWeight: 600, color: 'var(--quantum-color)' }}>
                    {Object.keys(qcStatus.saved_accounts_summary || {}).join(', ') || 'ibm_quantum_platform'}
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* ── 02 · Setup Guide (Collapsible) ─────────────────── */}
      {showGuide && (
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader
            index="02"
            icon={Key}
            title="Credential Acquisition Guide"
            subtitle="Step-by-step instructions to retrieve your IBM Quantum API token or IBM Cloud IAM credentials."
          />

          <div style={{ ...T.card, padding: '28px' }}>
            <div style={{ display: 'inline-flex', padding: '3px', background: 'var(--bg-inset)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', gap: '2px', marginBottom: '24px' }}>
              <button
                onClick={() => setGuideTab('quantum_platform')}
                style={{
                  padding: '8px 18px', fontSize: '0.82rem', fontWeight: 600,
                  borderRadius: 'calc(var(--radius-md) - 2px)', border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  background: guideTab === 'quantum_platform' ? 'var(--bg-card-solid)' : 'transparent',
                  color: guideTab === 'quantum_platform' ? 'var(--quantum-color)' : 'var(--text-secondary)',
                  boxShadow: guideTab === 'quantum_platform' ? 'var(--shadow-card)' : 'none'
                }}
              >
                IBM Quantum Platform
              </button>
              <button
                onClick={() => setGuideTab('ibm_cloud')}
                style={{
                  padding: '8px 18px', fontSize: '0.82rem', fontWeight: 600,
                  borderRadius: 'calc(var(--radius-md) - 2px)', border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  background: guideTab === 'ibm_cloud' ? 'var(--bg-card-solid)' : 'transparent',
                  color: guideTab === 'ibm_cloud' ? 'var(--quantum-color)' : 'var(--text-secondary)',
                  boxShadow: guideTab === 'ibm_cloud' ? 'var(--shadow-card)' : 'none'
                }}
              >
                IBM Cloud (IAM)
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {guideTab === 'quantum_platform' ? (
                <>
                  {[
                    { num: '01', title: 'Create IBM Quantum Account', body: 'Register for a free IBM Quantum account to receive 10 free minutes of physical transmon QPU compute per month.', link: 'https://quantum.ibm.com/', linkText: 'Open quantum.ibm.com' },
                    { num: '02', title: 'Copy Your API Token', body: 'On the IBM Quantum dashboard, find the API token card. Click Generate / Copy API token.', code: 'Format: 64-character hexadecimal string' },
                    { num: '03', title: 'Save via Form Below or Python', body: 'Paste into the Credentials Manager above, or save permanently in Python via Qiskit Runtime.', code: `from qiskit_ibm_runtime import QiskitRuntimeService\nQiskitRuntimeService.save_account(\n  channel="ibm_quantum_platform",\n  token="<your-api-token>",\n  overwrite=True\n)` }
                  ].map((step) => (
                    <div key={step.num} style={{
                      padding: '22px', background: 'var(--bg-inset)',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                      position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--quantum-color)' }} />
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--quantum-color)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                          {step.num}
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {step.title}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                        {step.body}
                      </p>
                      {step.link && (
                        <a href={step.link} target="_blank" rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '0.82rem', color: 'var(--quantum-color)',
                            textDecoration: 'none', fontWeight: 600
                          }}>
                          {step.linkText} <ExternalLink size={13} />
                        </a>
                      )}
                      {step.code && (
                        <div style={{ ...T.terminal, padding: '10px 12px', whiteSpace: 'pre-wrap', color: '#5EEAD4', fontSize: '0.74rem' }}>
                          {step.code}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { num: '01', title: 'Create IBM Cloud IAM Key', body: 'Log in to IBM Cloud console → Manage → Access (IAM) → API Keys → Create an IBM Cloud API key.', link: 'https://cloud.ibm.com/iam/apikeys', linkText: 'Open IBM Cloud IAM API Keys' },
                    { num: '02', title: 'Retrieve Cloud Resource Name (CRN)', body: 'Under Resource List, find your Qiskit Runtime instance and copy its CRN.', code: 'crn:v1:bluemix:public:quantum-computing:...' },
                    { num: '03', title: 'Save via Form Below or Python', body: 'Paste into the Credentials Manager above with both the IAM key and the CRN instance identifier.', code: `from qiskit_ibm_runtime import QiskitRuntimeService\nQiskitRuntimeService.save_account(\n  channel="ibm_cloud",\n  token="<your-iam-api-key>",\n  instance="<your-instance-crn>",\n  overwrite=True\n)` }
                  ].map((step) => (
                    <div key={step.num} style={{
                      padding: '22px', background: 'var(--bg-inset)',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                      position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--quantum-color)' }} />
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--quantum-color)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                          {step.num}
                        </span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {step.title}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                        {step.body}
                      </p>
                      {step.link && (
                        <a href={step.link} target="_blank" rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '0.82rem', color: 'var(--quantum-color)',
                            textDecoration: 'none', fontWeight: 600
                          }}>
                          {step.linkText} <ExternalLink size={13} />
                        </a>
                      )}
                      {step.code && (
                        <div style={{ ...T.terminal, padding: '10px 12px', whiteSpace: 'pre-wrap', color: '#5EEAD4', fontSize: '0.74rem' }}>
                          {step.code}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 03 · QPU Backend Fleet ─────────────────────────── */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader
          index="03"
          icon={Server}
          title="IBM QPU Backend Fleet"
          subtitle="Select a physical quantum processor or high-precision simulator for job dispatch."
          actions={
            <span style={{
              padding: '4px 12px', borderRadius: '6px', fontSize: '0.72rem',
              fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'var(--quantum-bg)', color: 'var(--quantum-color)',
              border: '1px solid var(--quantum-glow)',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {backends.length} Systems Available
            </span>
          }
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {backends.map((backend) => {
            const isSelected = selectedBackend === backend.name;
            return (
              <div
                key={backend.name}
                onClick={() => setSelectedBackend(backend.name)}
                style={{
                  ...T.card,
                  padding: '20px 24px',
                  border: isSelected ? `1px solid var(--quantum-color)` : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--quantum-glow)'; } }}
                onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; } }}
              >
                {isSelected && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--quantum-color)' }} />}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: backend.status === 'active' ? 'var(--status-success)' : 'var(--status-warning)',
                      boxShadow: backend.status === 'active' ? '0 0 6px var(--status-success)' : '0 0 6px var(--status-warning)'
                    }} />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: isSelected ? 'var(--quantum-color)' : 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      {backend.name}
                    </span>
                    <span style={{
                      fontSize: '0.62rem', padding: '3px 9px', borderRadius: '4px',
                      fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      background: backend.simulator ? 'rgba(20, 184, 166, 0.12)' : 'rgba(13, 148, 136, 0.12)',
                      color: backend.simulator ? '#0D9488' : 'var(--quantum-color)',
                      border: `1px solid ${backend.simulator ? 'rgba(20, 184, 166, 0.25)' : 'var(--quantum-glow)'}`
                    }}>
                      {backend.simulator ? 'SIMULATOR' : (backend.processor_type || 'QPU')}
                    </span>
                  </div>

                  {isSelected && (
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, color: 'var(--quantum-color)',
                      letterSpacing: '0.08em', textTransform: 'uppercase'
                    }}>
                      ● Selected
                    </span>
                  )}
                </div>

                {/* Hairline Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div style={{ padding: '14px 0', borderRight: '1px solid var(--border-color)' }}>
                    <div style={{ ...T.eyebrow, fontSize: '0.62rem' }}>Qubits</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--quantum-color)', fontVariantNumeric: 'tabular-nums', marginTop: '4px', letterSpacing: '-0.02em' }}>
                      {backend.qubits}
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px', borderRight: '1px solid var(--border-color)' }}>
                    <div style={{ ...T.eyebrow, fontSize: '0.62rem' }}>Queue</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: backend.pending_jobs > 15 ? 'var(--status-warning)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: '4px', letterSpacing: '-0.02em' }}>
                      {backend.pending_jobs} <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>jobs</span>
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px', borderRight: '1px solid var(--border-color)' }}>
                    <div style={{ ...T.eyebrow, fontSize: '0.62rem' }}>Avg T1</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: '4px', letterSpacing: '-0.02em' }}>
                      {backend.avg_t1_us?.toFixed(1) || '280'}<span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}> μs</span>
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ ...T.eyebrow, fontSize: '0.62rem' }}>2Q Gate Error</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: '4px', letterSpacing: '-0.02em' }}>
                      {((backend.avg_2q_error || 0.008) * 100).toFixed(2)}<span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 04 · Medical Quantum Experiments ─────────────────── */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader
          index="04"
          icon={Sparkles}
          title="Predefined Medical Quantum Experiments"
          subtitle="Select a clinical quantum circuit formulation to transpile and execute on the selected backend."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {experimentsList.map((exp, idx) => {
            const isSelected = selectedExperiment === exp.id;
            return (
              <div
                key={exp.id}
                onClick={() => setSelectedExperiment(exp.id)}
                style={{
                  ...T.card,
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  border: isSelected ? `1px solid var(--quantum-color)` : '1px solid var(--border-color)',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--quantum-glow)'; } }}
                onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; } }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: isSelected ? 'var(--quantum-color)' : 'var(--border-color)' }} />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{ ...T.eyebrow, fontSize: '0.62rem', color: 'var(--quantum-color)' }}>
                      {String(idx + 1).padStart(2, '0')} · {exp.category}
                    </span>
                    <span style={{
                      fontSize: '0.68rem', padding: '3px 9px', borderRadius: '4px',
                      fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      background: 'var(--quantum-bg)', color: 'var(--quantum-color)',
                      border: '1px solid var(--quantum-glow)'
                    }}>
                      {exp.qubits} Qubits
                    </span>
                  </div>

                  <h3 style={{
                    margin: '0 0 10px', fontSize: '0.98rem', fontWeight: 700,
                    color: isSelected ? 'var(--quantum-color)' : 'var(--text-primary)',
                    lineHeight: 1.35, letterSpacing: '-0.01em'
                  }}>
                    {exp.name}
                  </h3>

                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {exp.description}
                  </p>
                </div>

                <div style={{
                  marginTop: '16px', display: 'flex',
                  alignItems: 'center', justifyContent: 'flex-end',
                  color: isSelected ? 'var(--quantum-color)' : 'transparent',
                  transition: 'color 0.2s ease'
                }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 05 · Job Dispatch Console ────────────────────────── */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader
          index="05"
          icon={Play}
          title="Job Dispatch Console"
          subtitle="Configure cohort dataset, measurement shots, and simulation mode before execution."
        />

        <div style={{ ...T.card, padding: '28px' }}>
          {/* Control Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '24px'
          }}>
            {/* Dataset Selector */}
            <div style={{ padding: '20px', borderRight: '1px solid var(--border-color)' }}>
              <div style={{ ...T.eyebrow, marginBottom: '8px' }}>Cohort Dataset</div>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                  color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600,
                  cursor: 'pointer', outline: 'none'
                }}
              >
                {datasets.map(ds => (
                  <option key={ds.id} value={ds.id}>{ds.name || ds.id}</option>
                ))}
              </select>
            </div>

            {/* Shots Selector */}
            <div style={{ padding: '20px', borderRight: '1px solid var(--border-color)' }}>
              <div style={{ ...T.eyebrow, marginBottom: '8px' }}>Measurement Shots</div>
              <select
                value={shots}
                onChange={(e) => setShots(Number(e.target.value))}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                  color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600,
                  cursor: 'pointer', outline: 'none', fontVariantNumeric: 'tabular-nums'
                }}
              >
                <option value={512}>512 shots</option>
                <option value={1024}>1024 shots (Standard)</option>
                <option value={2048}>2048 shots</option>
                <option value={4096}>4096 shots (High Fidelity)</option>
              </select>
            </div>

            {/* Force Simulation */}
            <div style={{ padding: '20px' }}>
              <div style={{ ...T.eyebrow, marginBottom: '8px' }}>Execution Mode</div>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '8px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: forceSimulation ? 'var(--quantum-bg)' : 'transparent',
                color: forceSimulation ? 'var(--quantum-color)' : 'var(--text-secondary)',
                cursor: 'pointer', userSelect: 'none', fontSize: '0.85rem', fontWeight: 600,
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="checkbox"
                  checked={forceSimulation}
                  onChange={(e) => setForceSimulation(e.target.checked)}
                  style={{ accentColor: 'var(--quantum-color)' }}
                />
                High-Precision Local Sim
              </label>
            </div>
          </div>

          {/* Execute Row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 24px', background: 'var(--bg-inset)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
            flexWrap: 'wrap', gap: '16px'
          }}>
            <div>
              <div style={{ ...T.eyebrow, color: 'var(--quantum-color)', marginBottom: '6px' }}>
                Ready to Dispatch
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '4px' }}>
                Job to <span style={{ color: 'var(--quantum-color)' }}>{selectedBackend}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {currentExpDetails?.name} · {shots} shots · {(datasets.find(d => d.id === selectedDataset)?.name || selectedDataset).toUpperCase()} cohort
              </div>
            </div>

            <button
              onClick={handleRunExperiment}
              disabled={isExecuting}
              style={{
                height: '52px', padding: '0 32px', borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isExecuting ? 'var(--text-tertiary)' : 'var(--quantum-color)',
                color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700,
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                boxShadow: isExecuting ? 'none' : '0 2px 8px var(--quantum-glow)',
                transition: 'all 0.2s ease', letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => { if (!isExecuting) { e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { if (!isExecuting) { e.currentTarget.style.transform = 'translateY(0)'; } }}
            >
              {isExecuting ? (
                <>
                  <RotateCcw className="spinning" size={18} />
                  <span>Transpiling & Transmitting...</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="#fff" />
                  <span>Execute Quantum Job</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Execution Error */}
      {executionError && (
        <div style={{
          padding: '18px 22px', borderRadius: 'var(--radius-md)',
          background: 'var(--status-danger-bg)', border: '1px solid rgba(220, 38, 38, 0.25)',
          borderLeft: '2px solid var(--status-danger)',
          color: 'var(--status-danger)', marginBottom: '48px',
          display: 'flex', alignItems: 'flex-start', gap: '12px'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', letterSpacing: '-0.01em' }}>
              Quantum Execution Error
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.65 }}>{executionError}</div>
          </div>
        </div>
      )}

      {/* ── 06 · Execution Results ─────────────────────────── */}
      {experimentResult && (
        <>
          <HairlineDivider label="Execution Results" />

          <section style={{ marginBottom: '48px' }}>
            <SectionHeader
              index="06"
              icon={Zap}
              title="Quantum Job Results"
              subtitle={`${experimentResult.experiment_name} executed on ${experimentResult.backend}.`}
              actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '4px 10px',
                    borderRadius: '5px', letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'var(--status-success-bg)' : 'rgba(20, 184, 166, 0.12)',
                    color: experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'var(--status-success)' : '#0D9488',
                    border: `1px solid ${experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'rgba(22, 163, 74, 0.25)' : 'rgba(20, 184, 166, 0.25)'}`
                  }}>
                    {experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'PHYSICAL QPU' : 'SAMPLERV2 SIM'}
                  </span>
                  <CardActionMenu
                    title={`Real QC: ${experimentResult.experiment_name} (${experimentResult.backend})`}
                    category="quantum_experiment"
                    data={experimentResult}
                    metadata={{
                      backend: experimentResult.backend,
                      mode: experimentResult.mode,
                      shots: experimentResult.shots,
                      top_state: experimentResult.top_state
                    }}
                  />
                </div>
              }
            />

            {/* Job Metadata Hairline */}
            <div style={{ ...T.card, padding: '0', marginBottom: '24px', overflow: 'hidden' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'
              }}>
                {[
                  { label: 'Backend', value: experimentResult.backend, mono: true },
                  { label: 'Job ID', value: experimentResult.job_id, mono: true, code: true },
                  { label: 'Shots', value: experimentResult.shots, mono: true },
                  { label: 'Circuit Depth', value: `${experimentResult.circuit_depth} gates`, mono: true }
                ].map((m, i, arr) => (
                  <div key={m.label} style={{
                    padding: '22px 24px',
                    borderRight: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}>
                    <div style={T.eyebrow}>{m.label}</div>
                    <div style={{
                      fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)',
                      marginTop: '6px', letterSpacing: '-0.01em',
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: m.mono ? 'Consolas, Monaco, monospace' : 'inherit'
                    }}>
                      {m.code ? (
                        <code style={{
                          background: 'var(--bg-inset)', padding: '2px 8px',
                          borderRadius: '4px', color: 'var(--quantum-color)',
                          fontSize: '0.82rem'
                        }}>
                          {m.value}
                        </code>
                      ) : m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>

              {/* Measurement Distribution */}
              <div style={{ ...T.card, padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
                  <div>
                    <div style={{ ...T.eyebrow, color: 'var(--quantum-color)', marginBottom: '6px' }}>
                      Measurement Distribution
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      Physical Bitstring Outcomes
                    </h3>
                  </div>
                  <span style={{ ...T.eyebrow, fontVariantNumeric: 'tabular-nums' }}>
                    {Object.keys(experimentResult.counts || {}).length} States
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {Object.entries(experimentResult.probabilities || {}).map(([state, prob]) => {
                    const count = experimentResult.counts?.[state] || 0;
                    const isTopState = state === experimentResult.top_state;
                    const percent = (prob * 100).toFixed(2);
                    return (
                      <div key={state} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{
                            fontFamily: 'Consolas, Monaco, monospace',
                            fontWeight: 700,
                            color: isTopState ? 'var(--quantum-color)' : 'var(--text-primary)',
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '-0.01em'
                          }}>
                            |{state}⟩
                            {isTopState && (
                              <span style={{
                                fontSize: '0.65rem', color: 'var(--quantum-color)',
                                marginLeft: '8px', padding: '2px 8px', borderRadius: '4px',
                                background: 'var(--quantum-bg)', border: '1px solid var(--quantum-glow)',
                                fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase'
                              }}>
                                Dominant
                              </span>
                            )}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.82rem' }}>
                            <strong>{count}</strong> shots ({percent}%)
                          </span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-inset)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${percent}%`, borderRadius: '3px',
                            background: isTopState
                              ? 'linear-gradient(90deg, var(--quantum-color), #2DD4BF)'
                              : 'rgba(13, 148, 136, 0.3)',
                            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Diagnostics Hairline */}
                {experimentResult.quantum_diagnostics && (
                  <div style={{
                    marginTop: '28px', paddingTop: '24px',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <div style={{ ...T.eyebrow, color: 'var(--quantum-color)', marginBottom: '16px' }}>
                      Quantum Diagnostics
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      borderTop: '1px solid var(--border-color)',
                      borderBottom: '1px solid var(--border-color)'
                    }}>
                      <div style={{ padding: '16px 0', borderRight: '1px solid var(--border-color)' }}>
                        <div style={{ ...T.eyebrow, fontSize: '0.62rem' }}>Shannon Entropy</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: '4px', letterSpacing: '-0.02em' }}>
                          {experimentResult.quantum_diagnostics.shannon_entropy_bits} <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>bits</span>
                        </div>
                      </div>
                      <div style={{ padding: '16px 16px', borderRight: '1px solid var(--border-color)' }}>
                        <div style={{ ...T.eyebrow, fontSize: '0.62rem' }}>Dominant Prob</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--quantum-color)', fontVariantNumeric: 'tabular-nums', marginTop: '4px', letterSpacing: '-0.02em' }}>
                          {(experimentResult.quantum_diagnostics.dominant_state_probability * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div style={{ padding: '16px 16px' }}>
                        <div style={{ ...T.eyebrow, fontSize: '0.62rem' }}>Depth</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: '4px', letterSpacing: '-0.02em' }}>
                          {experimentResult.circuit_depth} <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>gates</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Transpiled Circuit Diagram */}
              <div style={{ ...T.card, padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
                  <div>
                    <div style={{ ...T.eyebrow, color: 'var(--quantum-color)', marginBottom: '6px' }}>
                      Circuit Schematic
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      Transpiled Qiskit Diagram
                    </h3>
                  </div>
                  <span style={{ ...T.eyebrow, fontVariantNumeric: 'tabular-nums' }}>
                    {experimentResult.num_qubits}Q · Depth {experimentResult.circuit_depth}
                  </span>
                </div>

                <div style={{ ...T.terminal, padding: '20px', color: '#5EEAD4', maxHeight: '300px', overflow: 'auto', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
                  <div style={{ color: '#94A3B8', marginBottom: '12px', ...T.eyebrow, fontSize: '0.62rem' }}>
                    Transpiled Circuit Representation
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre', fontFamily: 'inherit' }}>
                    {experimentResult.circuit_ascii || '// Circuit representation available'}
                  </pre>
                </div>

                {/* Gate Decomposition */}
                {experimentResult.gate_counts && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ ...T.eyebrow, marginBottom: '12px' }}>
                      Physical Gate Decomposition
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Object.entries(experimentResult.gate_counts).map(([gate, count]) => (
                        <span key={gate} style={{
                          fontSize: '0.78rem', background: 'var(--bg-inset)',
                          border: '1px solid var(--border-color)',
                          padding: '6px 12px', borderRadius: '6px',
                          color: 'var(--text-primary)', fontWeight: 500,
                          fontVariantNumeric: 'tabular-nums',
                          fontFamily: 'Consolas, Monaco, monospace'
                        }}>
                          <strong style={{ color: 'var(--quantum-color)' }}>{gate.toUpperCase()}</strong>
                          <span style={{ color: 'var(--text-tertiary)', margin: '0 6px' }}>×</span>
                          {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── 07 · Clinical Synthesis ──────────────────────── */}
          <section style={{ marginBottom: '40px' }}>
            <SectionHeader
              index="07"
              icon={Sparkles}
              title="Clinical & Quantum Diagnostic Synthesis"
              subtitle="Interpretation of quantum circuit output in clinical biomarker context."
              actions={
                <CardActionMenu
                  title={`Clinical Interpretation: ${experimentResult.experiment_name}`}
                  category="clinical_synthesis"
                  data={{
                    interpretation: experimentResult.clinical_interpretation,
                    backend: experimentResult.backend,
                    dominant_eigenstate: experimentResult.top_state
                  }}
                />
              }
            />

            <div style={{
              ...T.card,
              padding: '32px',
              borderLeft: '2px solid var(--quantum-color)'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '16px'
              }}>
                <Sparkles size={14} style={{ color: 'var(--quantum-color)' }} />
                <span style={{ ...T.eyebrow, color: 'var(--quantum-color)' }}>
                  Diagnostic Synthesis
                </span>
              </div>
              <p style={{
                margin: 0, fontSize: '0.95rem',
                color: 'var(--text-primary)', lineHeight: 1.75,
                letterSpacing: '-0.005em'
              }}>
                {experimentResult.clinical_interpretation}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}