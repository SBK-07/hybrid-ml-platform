import React, { useState, useEffect } from 'react';
import {
  Cpu, Key, Server, Zap, CheckCircle2, AlertCircle, Play, RotateCcw,
  Layers, Activity, Code2, ExternalLink, Shield, HelpCircle, ChevronDown,
  ChevronUp, Eye, EyeOff, Trash2, Sparkles, Info, Database, Settings, BarChart2
} from 'lucide-react';
import CardActionMenu from '../components/CardActionMenu';
import {
  getRealQCStatus,
  getRealQCBackends,
  saveRealQCCredentials,
  deleteRealQCCredentials,
  runRealQCExperiment,
  getDatasets
} from '../services/api';

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
  const [guideTab, setGuideTab] = useState('quantum_platform'); // 'quantum_platform' | 'ibm_cloud'

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
    <div className="hub-section active" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Banner & Header */}
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        border: '1px solid var(--border-color)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, var(--quantum-color), transparent)',
          animation: 'pulse 2s ease-in-out infinite'
        }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'var(--quantum-bg)', border: '1px solid var(--quantum-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Cpu size={24} style={{ color: 'var(--quantum-color)' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  IBM Quantum Hardware & Runtime Engine
                </h1>
                <span style={{
                  display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px',
                  background: 'rgba(13, 148, 136, 0.12)', color: 'var(--quantum-color)',
                  border: '1px solid rgba(13, 148, 136, 0.25)', borderRadius: '6px', marginTop: '6px'
                }}>
                  PHYSICAL QPU INTEGRATION
                </span>
              </div>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '800px', lineHeight: '1.6' }}>
              Execute authentic clinical quantum circuits directly on physical superconducting transmon QPUs (Eagle & Heron architectures) via IBM Quantum Runtime, or verify gate fidelity with high-precision Qiskit SamplerV2 primitives.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{
              padding: '8px 14px', borderRadius: '8px',
              background: qcStatus?.authenticated ? 'var(--status-success-bg)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${qcStatus?.authenticated ? 'rgba(22, 163, 74, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '0.82rem', fontWeight: '600',
              color: qcStatus?.authenticated ? 'var(--status-success)' : '#F59E0B'
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: qcStatus?.authenticated ? 'var(--status-success)' : '#F59E0B',
                boxShadow: qcStatus?.authenticated ? '0 0 8px var(--status-success)' : '0 0 8px #F59E0B'
              }} />
              {qcStatus?.authenticated ? (
                <span>Authenticated ({qcStatus.active_account?.channel})</span>
              ) : (
                <span>Simulation / Unauthenticated</span>
              )}
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-inset)', color: 'var(--text-primary)',
                fontSize: '0.82rem', cursor: 'pointer', fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-solid)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-inset)'}
            >
              <HelpCircle size={15} />
              <span>Setup Guide</span>
              {showGuide ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Step-by-Step Setup Guide */}
      {showGuide && (
        <div style={{
          background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
          borderRadius: 'var(--radius-lg)', padding: '28px',
          border: '1px solid var(--quantum-glow)', marginBottom: '24px',
          boxShadow: 'var(--shadow-card)', animation: 'stageFadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={20} style={{ color: 'var(--quantum-color)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                Step-by-Step IBM Quantum Setup & Credential Acquisition
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-inset)', padding: '4px', borderRadius: '8px' }}>
              <button
                onClick={() => setGuideTab('quantum_platform')}
                style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none',
                  background: guideTab === 'quantum_platform' ? 'var(--quantum-color)' : 'transparent',
                  color: guideTab === 'quantum_platform' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                IBM Quantum Platform
              </button>
              <button
                onClick={() => setGuideTab('ibm_cloud')}
                style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none',
                  background: guideTab === 'ibm_cloud' ? 'var(--quantum-color)' : 'transparent',
                  color: guideTab === 'ibm_cloud' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                IBM Cloud (IAM)
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {guideTab === 'quantum_platform' ? (
              <>
                <div style={{ background: 'var(--bg-inset)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: '600', color: 'var(--quantum-color)', marginBottom: '8px', fontSize: '0.9rem' }}>1. Create IBM Quantum Account</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                    Register for a free IBM Quantum account at the official portal to receive 10 free minutes of physical transmon QPU quantum compute time per month.
                  </p>
                  <a href="https://quantum.ibm.com/" target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--quantum-color)', textDecoration: 'none', fontWeight: '600' }}>
                    Go to quantum.ibm.com <ExternalLink size={13} />
                  </a>
                </div>
                <div style={{ background: 'var(--bg-inset)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: '600', color: 'var(--quantum-color)', marginBottom: '8px', fontSize: '0.9rem' }}>2. Copy Your API Token</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                    On the IBM Quantum dashboard, find the <strong>API token</strong> card. Click <strong>Generate / Copy API token</strong>.
                  </p>
                  <code style={{ fontSize: '0.78rem', background: 'var(--bg-card-solid)', padding: '6px 10px', borderRadius: '6px', display: 'block', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                    Format: 64-character hexadecimal string
                  </code>
                </div>
                <div style={{ background: 'var(--bg-inset)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: '600', color: 'var(--quantum-color)', marginBottom: '8px', fontSize: '0.9rem' }}>3. Save via Python or Form</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                    Paste into the Credentials Manager below, or save permanently in Python:
                  </p>
                  <pre style={{ margin: 0, fontSize: '0.75rem', background: 'var(--bg-card-solid)', padding: '10px', borderRadius: '6px', overflowX: 'auto', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
{`from qiskit_ibm_runtime import QiskitRuntimeService
QiskitRuntimeService.save_account(
    channel="ibm_quantum_platform",
    token="<your-api-token>",
    overwrite=True
)`}
                  </pre>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: 'var(--bg-inset)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: '600', color: 'var(--quantum-color)', marginBottom: '8px', fontSize: '0.9rem' }}>1. Create IBM Cloud IAM Key</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                    Log in to IBM Cloud console → <strong>Manage</strong> → <strong>Access (IAM)</strong> → <strong>API Keys</strong> → <strong>Create an IBM Cloud API key</strong>.
                  </p>
                  <a href="https://cloud.ibm.com/iam/apikeys" target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--quantum-color)', textDecoration: 'none', fontWeight: '600' }}>
                    Open IBM Cloud IAM API Keys <ExternalLink size={13} />
                  </a>
                </div>
                <div style={{ background: 'var(--bg-inset)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: '600', color: 'var(--quantum-color)', marginBottom: '8px', fontSize: '0.9rem' }}>2. Retrieve Cloud Resource Name (CRN)</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                    Under <strong>Resource List</strong>, find your Qiskit Runtime instance and copy its CRN.
                  </p>
                  <code style={{ fontSize: '0.78rem', background: 'var(--bg-card-solid)', padding: '6px 10px', borderRadius: '6px', display: 'block', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                    crn:v1:bluemix:public:quantum-computing:...
                  </code>
                </div>
                <div style={{ background: 'var(--bg-inset)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: '600', color: 'var(--quantum-color)', marginBottom: '8px', fontSize: '0.9rem' }}>3. Save via Python or Form</div>
                  <pre style={{ margin: 0, fontSize: '0.75rem', background: 'var(--bg-card-solid)', padding: '10px', borderRadius: '6px', overflowX: 'auto', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
{`from qiskit_ibm_runtime import QiskitRuntimeService
QiskitRuntimeService.save_account(
    channel="ibm_cloud",
    token="<your-iam-api-key>",
    instance="<your-instance-crn>",
    overwrite=True
)`}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Credentials Manager & Backend Fleet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Credentials Manager Card */}
        <div style={{
          background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
          borderRadius: 'var(--radius-lg)', padding: '28px',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} style={{ color: 'var(--quantum-color)' }} />
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Qiskit Runtime Credentials
              </h2>
            </div>
            {qcStatus?.authenticated && (
              <button
                onClick={handleDeleteCredentials}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent',
                  border: '1px solid rgba(220, 38, 38, 0.2)', color: 'var(--status-danger)',
                  fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600', padding: '6px 12px',
                  borderRadius: '6px', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--status-danger-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Trash2 size={14} /> Remove Saved Account
              </button>
            )}
          </div>

          <form onSubmit={handleSaveCredentials}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Channel Type
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['ibm_quantum_platform', 'ibm_cloud'].map((channel) => (
                  <label key={channel} style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem',
                    border: `1px solid ${authForm.channel === channel ? 'var(--quantum-glow)' : 'var(--border-color)'}`,
                    background: authForm.channel === channel ? 'var(--quantum-bg)' : 'var(--bg-inset)',
                    color: authForm.channel === channel ? 'var(--quantum-color)' : 'var(--text-primary)',
                    transition: 'all 0.2s ease', fontWeight: 500
                  }}>
                    <input
                      type="radio" name="channel" value={channel}
                      checked={authForm.channel === channel}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, channel: e.target.value }))}
                      style={{ accentColor: 'var(--quantum-color)' }}
                    />
                    <span>{channel === 'ibm_quantum_platform' ? 'IBM Quantum Platform' : 'IBM Cloud (IAM)'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {authForm.channel === 'ibm_quantum_platform' ? 'API Token' : 'IBM Cloud IAM API Key'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder={authForm.channel === 'ibm_quantum_platform' ? 'Paste 64-char IBM Quantum Token' : 'Paste IAM API Key'}
                  value={authForm.token}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, token: e.target.value }))}
                  style={{
                    width: '100%', padding: '12px 44px 12px 14px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box',
                    transition: 'all 0.2s ease', outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--quantum-color)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
                <button
                  type="button" onClick={() => setShowToken(!showToken)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-tertiary)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {authForm.channel === 'ibm_cloud' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cloud Resource Name (CRN) / Instance (Optional)
                </label>
                <input
                  type="text" placeholder="crn:v1:bluemix:public:quantum-computing:..."
                  value={authForm.instance}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, instance: e.target.value }))}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box',
                    transition: 'all 0.2s ease', outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--quantum-color)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                />
              </div>
            )}

            {authFeedback && (
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px',
                fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px',
                background: authFeedback.type === 'success' ? 'var(--status-success-bg)' : (authFeedback.type === 'info' ? 'rgba(16, 185, 129, 0.12)' : 'var(--status-danger-bg)'),
                color: authFeedback.type === 'success' ? 'var(--status-success)' : (authFeedback.type === 'info' ? 'var(--brand-primary)' : 'var(--status-danger)'),
                border: `1px solid ${authFeedback.type === 'success' ? 'rgba(22, 163, 74, 0.25)' : (authFeedback.type === 'info' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(220, 38, 38, 0.25)')}`
              }}>
                {authFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{authFeedback.message}</span>
              </div>
            )}

            <button
              type="submit" disabled={savingAuth}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: 'none',
                background: savingAuth ? 'var(--quantum-color-dim)' : 'var(--quantum-color)',
                color: '#fff', fontWeight: '600', fontSize: '0.9rem', cursor: savingAuth ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)', transition: 'all 0.2s ease'
              }}
            >
              {savingAuth ? <RotateCcw className="spinning" size={16} /> : <Key size={16} />}
              <span>{savingAuth ? 'Saving to Qiskit Runtime...' : 'Save & Authenticate Qiskit Runtime'}</span>
            </button>
          </form>

          {qcStatus?.saved_accounts_count > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Active Qiskit Config:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'monospace' }}>~/.qiskit/qiskit-ibm.json</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Registered Channels:</span>
                <span style={{ fontWeight: '600', color: 'var(--quantum-color)' }}>
                  {Object.keys(qcStatus.saved_accounts_summary || {}).join(', ') || 'ibm_quantum_platform'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Backend Fleet Monitor */}
        <div style={{
          background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
          borderRadius: 'var(--radius-lg)', padding: '28px',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={20} style={{ color: 'var(--quantum-color)' }} />
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                IBM QPU Backend Fleet
              </h2>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', background: 'var(--bg-inset)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              {backends.length} Systems Available
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
            {backends.map((backend) => {
              const isSelected = selectedBackend === backend.name;
              return (
                <div
                  key={backend.name}
                  onClick={() => setSelectedBackend(backend.name)}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${isSelected ? 'var(--quantum-glow)' : 'var(--border-color)'}`,
                    background: isSelected ? 'var(--quantum-bg)' : 'var(--bg-inset)',
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-solid)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-inset)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: backend.status === 'active' ? 'var(--status-success)' : 'var(--status-warning)',
                        boxShadow: backend.status === 'active' ? '0 0 6px var(--status-success)' : '0 0 6px var(--status-warning)'
                      }} />
                      <span style={{ fontWeight: '700', fontSize: '0.92rem', color: isSelected ? 'var(--quantum-color)' : 'var(--text-primary)' }}>
                        {backend.name}
                      </span>
                      <span style={{
                        fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px',
                        background: backend.simulator ? 'rgba(20, 184, 166, 0.15)' : 'rgba(13, 148, 136, 0.15)',
                        color: backend.simulator ? '#0D9488' : 'var(--quantum-color)', fontWeight: '600'
                      }}>
                        {backend.simulator ? 'SIMULATOR' : (backend.processor_type || 'QPU')}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                      {backend.qubits} Qubits
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <div>
                      <span>Queue: </span>
                      <strong style={{ color: backend.pending_jobs > 15 ? 'var(--status-warning)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {backend.pending_jobs} jobs
                      </strong>
                    </div>
                    <div>
                      <span>Avg T1: </span>
                      <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {backend.avg_t1_us?.toFixed(1) || '280'} μs
                      </strong>
                    </div>
                    <div>
                      <span>2Q Err: </span>
                      <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {((backend.avg_2q_error || 0.008) * 100).toFixed(2)}%
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Predefined Medical Experiments & Job Control */}
      <div style={{
        background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
        borderRadius: 'var(--radius-lg)', padding: '32px',
        border: '1px solid var(--border-color)', marginBottom: '24px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Predefined Medical Quantum Experiments
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Select a clinical quantum circuit formulation to transpile and execute on <strong style={{ color: 'var(--quantum-color)' }}>{selectedBackend}</strong>.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cohort Dataset</label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.88rem',
                  cursor: 'pointer', outline: 'none', minWidth: '180px'
                }}
              >
                {datasets.map(ds => (
                  <option key={ds.id} value={ds.id}>{ds.name || ds.id}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Measurement Shots</label>
              <select
                value={shots}
                onChange={(e) => setShots(Number(e.target.value))}
                style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.88rem',
                  cursor: 'pointer', outline: 'none', minWidth: '160px'
                }}
              >
                <option value={512}>512 shots</option>
                <option value={1024}>1024 shots (Standard)</option>
                <option value={2048}>2048 shots</option>
                <option value={4096}>4096 shots (High Fidelity)</option>
              </select>
            </div>

            <label style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
              background: forceSimulation ? 'var(--quantum-bg)' : 'var(--bg-inset)',
              color: forceSimulation ? 'var(--quantum-color)' : 'var(--text-secondary)',
              cursor: 'pointer', userSelect: 'none', fontSize: '0.85rem', fontWeight: '500',
              transition: 'all 0.2s ease', marginBottom: '1px'
            }}>
              <input
                type="checkbox" checked={forceSimulation}
                onChange={(e) => setForceSimulation(e.target.checked)}
                style={{ accentColor: 'var(--quantum-color)' }}
              />
              <span>High-Precision Local Sim</span>
            </label>
          </div>
        </div>

        {/* Experiment Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {experimentsList.map((exp) => {
            const isSelected = selectedExperiment === exp.id;
            return (
              <div
                key={exp.id}
                onClick={() => setSelectedExperiment(exp.id)}
                style={{
                  padding: '20px', borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${isSelected ? 'var(--quantum-glow)' : 'var(--border-color)'}`,
                  background: isSelected ? 'var(--quantum-bg)' : 'var(--bg-inset)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'all 0.2s ease', minHeight: '160px'
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-solid)'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-inset)'; }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '0.68rem', padding: '3px 8px', borderRadius: '4px',
                      background: 'rgba(13, 148, 136, 0.15)', color: 'var(--quantum-color)', fontWeight: '700'
                    }}>
                      {exp.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                      {exp.qubits} Qubits
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '0.98rem', fontWeight: '700', color: isSelected ? 'var(--quantum-color)' : 'var(--text-primary)', lineHeight: '1.3' }}>
                    {exp.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {exp.description}
                  </p>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: isSelected ? 'var(--quantum-color)' : 'transparent' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Run Experiment Action Trigger */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', background: 'var(--bg-inset)',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
          flexWrap: 'wrap', gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Ready to dispatch job to {selectedBackend}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {currentExpDetails?.name} • {shots} shots • {datasets.find(d => d.id === selectedDataset)?.name?.toUpperCase() || selectedDataset.toUpperCase()} cohort
            </div>
          </div>
          <button
            onClick={handleRunExperiment}
            disabled={isExecuting}
            style={{
              padding: '0 32px', height: '52px', borderRadius: 'var(--radius-md)', border: 'none',
              background: isExecuting ? 'var(--quantum-color-dim)' : 'var(--quantum-color)',
              color: '#fff', fontSize: '0.95rem', fontWeight: '700', cursor: isExecuting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 4px 16px rgba(13, 148, 136, 0.3)', transition: 'all 0.2s ease',
              letterSpacing: '-0.01em'
            }}
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

      {/* Execution Error Alert */}
      {executionError && (
        <div style={{
          padding: '16px 20px', borderRadius: 'var(--radius-md)',
          background: 'var(--status-danger-bg)', border: '1px solid rgba(220, 38, 38, 0.25)',
          color: 'var(--status-danger)', marginBottom: '24px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px' }}>Quantum Execution Error</div>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>{executionError}</div>
          </div>
        </div>
      )}

      {/* Experiment Results Section */}
      {experimentResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'stageFadeIn 0.3s ease-out' }}>
          
          {/* Top Results Metrics Bar */}
          <div style={{
            background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-lg)', padding: '24px 32px',
            border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'var(--status-success-bg)' : 'rgba(20, 184, 166, 0.15)',
                color: experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'var(--status-success)' : '#0D9488',
                padding: '12px', borderRadius: '12px',
                border: `1px solid ${experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'rgba(22, 163, 74, 0.25)' : 'rgba(20, 184, 166, 0.25)'}`
              }}>
                <Zap size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Job Results: {experimentResult.experiment_name}
                  </span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: '700', padding: '3px 10px', borderRadius: '6px',
                    background: experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'var(--status-success-bg)' : 'rgba(20, 184, 166, 0.15)',
                    color: experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'var(--status-success)' : '#0D9488',
                    border: `1px solid ${experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'rgba(22, 163, 74, 0.25)' : 'rgba(20, 184, 166, 0.25)'}`
                  }}>
                    {experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'PHYSICAL QPU EXECUTED' : 'QISKIT SAMPLERV2 SIMULATION'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                  Backend: <strong style={{ color: 'var(--text-primary)' }}>{experimentResult.backend}</strong> • Job ID: <code style={{ background: 'var(--bg-inset)', padding: '2px 6px', borderRadius: '4px', color: 'var(--quantum-color)' }}>{experimentResult.job_id}</code> • Shots: <strong style={{ color: 'var(--text-primary)' }}>{experimentResult.shots}</strong>
                </div>
              </div>
            </div>
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

          {/* Results Grid: Bitstring Histogram & Circuit Diagram */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
            
            {/* Measurement Bitstrings & Probabilities */}
            <div style={{
              background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-lg)', padding: '28px',
              border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Activity size={20} style={{ color: 'var(--quantum-color)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Physical Measurement Distribution
                  </h3>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                  Total States: {Object.keys(experimentResult.counts || {}).length}
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
                          fontFamily: 'monospace', fontWeight: '700', 
                          color: isTopState ? 'var(--quantum-color)' : 'var(--text-primary)',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          |{state}⟩ {isTopState && <span style={{ fontSize: '0.7rem', color: 'var(--quantum-color)', marginLeft: '6px' }}>(Dominant Eigenstate)</span>}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                          <strong>{count}</strong> shots ({percent}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-inset)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${percent}%`, borderRadius: '4px',
                          background: isTopState ? 'linear-gradient(90deg, var(--quantum-color), #2DD4BF)' : 'rgba(13, 148, 136, 0.4)',
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quantum Diagnostics Summary */}
              {experimentResult.quantum_diagnostics && (
                <div style={{
                  marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)',
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px'
                }}>
                  {[
                    { label: 'Shannon Entropy', value: `${experimentResult.quantum_diagnostics.shannon_entropy_bits} bits`, color: 'var(--text-primary)' },
                    { label: 'Dominant State Prob', value: `${(experimentResult.quantum_diagnostics.dominant_state_probability * 100).toFixed(1)}%`, color: 'var(--quantum-color)' },
                    { label: 'Circuit Depth', value: `${experimentResult.circuit_depth} gates`, color: 'var(--text-primary)' }
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'var(--bg-inset)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>{item.label}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Circuit Schematic & Execution Diagnostics */}
            <div style={{
              background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
              borderRadius: 'var(--radius-lg)', padding: '28px',
              border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Code2 size={20} style={{ color: 'var(--quantum-color)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Transpiled Qiskit Circuit Diagram
                  </h3>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                  {experimentResult.num_qubits} Qubits • {experimentResult.circuit_depth} Depth
                </span>
              </div>
              
              <pre style={{
                background: '#0F172A', padding: '20px', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(20, 184, 166, 0.3)', color: '#5EEAD4',
                fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.78rem',
                overflowX: 'auto', lineHeight: '1.5', maxHeight: '280px', margin: 0
              }}>
                {experimentResult.circuit_ascii || '// Circuit representation available'}
              </pre>

              {/* Gate Count Breakdown */}
              {experimentResult.gate_counts && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Physical Gate Decomposition:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(experimentResult.gate_counts).map(([gate, count]) => (
                      <span key={gate} style={{
                        fontSize: '0.78rem', background: 'var(--bg-inset)', border: '1px solid var(--border-color)',
                        padding: '6px 12px', borderRadius: '6px', color: 'var(--text-primary)', fontWeight: 500,
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        <strong style={{ color: 'var(--quantum-color)' }}>{gate.toUpperCase()}</strong>: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Interpretation & Quantum Meaning Card */}
          <div style={{
            background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-lg)', padding: '28px',
            border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} style={{ color: 'var(--quantum-color)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Clinical & Quantum Diagnostic Synthesis
                </h3>
              </div>
              <CardActionMenu
                title={`Clinical Interpretation: ${experimentResult.experiment_name}`}
                category="clinical_synthesis"
                data={{
                  interpretation: experimentResult.clinical_interpretation,
                  backend: experimentResult.backend,
                  dominant_eigenstate: experimentResult.top_state
                }}
              />
            </div>
            <div style={{
              padding: '20px', background: 'rgba(13, 148, 136, 0.08)',
              border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: 'var(--radius-md)',
              fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.7'
            }}>
              {experimentResult.clinical_interpretation}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}