import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Key,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Layers,
  Activity,
  Code2,
  ExternalLink,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Radio,
  Eye,
  EyeOff,
  Trash2,
  Share2,
  Sparkles,
  Info
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
    <div className="real-qc-page" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner & Header */}
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid var(--border-color)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--primary-color)',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Cpu size={24} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                IBM Quantum Hardware & Runtime Engine
              </h1>
              <span className="badge-sih" style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}>
                PHYSICAL QPU INTEGRATION
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '900px', lineHeight: '1.5' }}>
              Execute authentic clinical quantum circuits directly on physical superconducting transmon QPUs (Eagle & Heron architectures) via IBM Quantum Runtime or verify gate fidelity with high-precision Qiskit SamplerV2 primitives.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: qcStatus?.authenticated ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${qcStatus?.authenticated ? 'var(--status-success)' : 'var(--status-warning)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: qcStatus?.authenticated ? 'var(--status-success)' : 'var(--status-warning)'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: qcStatus?.authenticated ? 'var(--status-success)' : 'var(--status-warning)'
              }} />
              {qcStatus?.authenticated ? (
                <span>IBM Runtime: Authenticated ({qcStatus.active_account?.channel})</span>
              ) : (
                <span>IBM Runtime: Simulation / Unauthenticated</span>
              )}
            </div>

            <button
              onClick={() => setShowGuide(!showGuide)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              <HelpCircle size={15} />
              <span>IBM Cloud / IAM Guide</span>
              {showGuide ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Step-by-Step Setup Guide */}
      {showGuide && (
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--primary-color)',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} color="var(--primary-color)" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                Step-by-Step IBM Quantum Setup & Credential Acquisition
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setGuideTab('quantum_platform')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: guideTab === 'quantum_platform' ? 'var(--primary-color)' : 'var(--bg-secondary)',
                  color: guideTab === 'quantum_platform' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '600'
                }}
              >
                IBM Quantum Platform (Free Open Plan)
              </button>
              <button
                onClick={() => setGuideTab('ibm_cloud')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: guideTab === 'ibm_cloud' ? 'var(--primary-color)' : 'var(--bg-secondary)',
                  color: guideTab === 'ibm_cloud' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '600'
                }}
              >
                IBM Cloud (IAM API Key & CRN)
              </button>
            </div>
          </div>

          {guideTab === 'quantum_platform' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '6px' }}>1. Create IBM Quantum Account</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                  Register for a free IBM Quantum account at the official portal to receive 10 free minutes of physical transmon QPU quantum compute time per month.
                </p>
                <a
                  href="https://quantum.ibm.com/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}
                >
                  Go to quantum.ibm.com <ExternalLink size={13} />
                </a>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '6px' }}>2. Copy Your API Token</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                  On the IBM Quantum dashboard, find the <strong>API token</strong> card. Click <strong>Generate / Copy API token</strong>.
                </p>
                <code style={{ fontSize: '0.78rem', background: 'var(--card-bg)', padding: '4px 8px', borderRadius: '4px', display: 'block', color: 'var(--text-primary)' }}>
                  Format: 64-character hexadecimal string
                </code>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '6px' }}>3. Save via Python or Form Below</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                  Paste into the Credentials Manager below, or save permanently in Python via Qiskit Runtime:
                </p>
                <pre style={{ margin: 0, fontSize: '0.75rem', background: 'var(--card-bg)', padding: '8px', borderRadius: '4px', overflowX: 'auto', color: 'var(--text-primary)' }}>
{`from qiskit_ibm_runtime import QiskitRuntimeService
QiskitRuntimeService.save_account(
    channel="ibm_quantum_platform",
    token="<your-api-token>",
    overwrite=True,
    set_as_default=True
)`}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '6px' }}>1. Create IBM Cloud IAM Key</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                  Log in to IBM Cloud console → <strong>Manage</strong> → <strong>Access (IAM)</strong> → <strong>API Keys</strong> → <strong>Create an IBM Cloud API key</strong>.
                </p>
                <a
                  href="https://cloud.ibm.com/iam/apikeys"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}
                >
                  Open IBM Cloud IAM API Keys <ExternalLink size={13} />
                </a>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '6px' }}>2. Retrieve Cloud Resource Name (CRN)</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                  Under <strong>Resource List</strong>, find your Qiskit Runtime instance and copy its CRN (starts with <code>crn:v1:bluemix:public:quantum-computing...</code>).
                </p>
                <code style={{ fontSize: '0.78rem', background: 'var(--card-bg)', padding: '4px 8px', borderRadius: '4px', display: 'block', color: 'var(--text-primary)' }}>
                  crn:v1:bluemix:public:quantum-computing:us-east:...
                </code>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '6px' }}>3. Save via Python or Form Below</div>
                <pre style={{ margin: 0, fontSize: '0.75rem', background: 'var(--card-bg)', padding: '8px', borderRadius: '4px', overflowX: 'auto', color: 'var(--text-primary)' }}>
{`from qiskit_ibm_runtime import QiskitRuntimeService
QiskitRuntimeService.save_account(
    channel="ibm_cloud",
    token="<your-iam-api-key>",
    instance="<your-instance-crn>",
    overwrite=True,
    set_as_default=True
)`}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Credentials Manager & Backend Fleet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>

        {/* Credentials Manager Card */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="var(--primary-color)" />
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Qiskit Runtime Credentials
              </h2>
            </div>
            {qcStatus?.authenticated && (
              <button
                onClick={handleDeleteCredentials}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--status-danger)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                <Trash2 size={14} /> Remove Saved Account
              </button>
            )}
          </div>

          <form onSubmit={handleSaveCredentials}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Channel Type
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${authForm.channel === 'ibm_quantum_platform' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  background: authForm.channel === 'ibm_quantum_platform' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)'
                }}>
                  <input
                    type="radio"
                    name="channel"
                    value="ibm_quantum_platform"
                    checked={authForm.channel === 'ibm_quantum_platform'}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, channel: e.target.value }))}
                  />
                  <span>IBM Quantum Platform (Open Plan)</span>
                </label>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${authForm.channel === 'ibm_cloud' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  background: authForm.channel === 'ibm_cloud' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)'
                }}>
                  <input
                    type="radio"
                    name="channel"
                    value="ibm_cloud"
                    checked={authForm.channel === 'ibm_cloud'}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, channel: e.target.value }))}
                  />
                  <span>IBM Cloud (IAM)</span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {authForm.channel === 'ibm_quantum_platform' ? 'API Token' : 'IBM Cloud IAM API Key'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder={authForm.channel === 'ibm_quantum_platform' ? 'Paste 64-char IBM Quantum Token' : 'Paste IAM API Key'}
                  value={authForm.token}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, token: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {authForm.channel === 'ibm_cloud' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Cloud Resource Name (CRN) / Instance (Optional)
                </label>
                <input
                  type="text"
                  placeholder="crn:v1:bluemix:public:quantum-computing:..."
                  value={authForm.instance}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, instance: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {authFeedback && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: authFeedback.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : (authFeedback.type === 'info' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'),
                color: authFeedback.type === 'success' ? 'var(--status-success)' : (authFeedback.type === 'info' ? 'var(--brand-primary)' : 'var(--status-danger)'),
                border: `1px solid ${authFeedback.type === 'success' ? 'var(--status-success)' : (authFeedback.type === 'info' ? 'var(--brand-primary)' : 'var(--status-danger)')}`
              }}>
                {authFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{authFeedback.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="submit"
                disabled={savingAuth}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary-color)',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: savingAuth ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: savingAuth ? 0.7 : 1
                }}
              >
                <Key size={16} />
                <span>{savingAuth ? 'Saving to Qiskit Runtime...' : 'Save & Authenticate Qiskit Runtime'}</span>
              </button>
            </div>
          </form>

          {qcStatus?.saved_accounts_count > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Active Qiskit Config:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>~/.qiskit/qiskit-ibm.json</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Registered Channels:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {Object.keys(qcStatus.saved_accounts_summary || {}).join(', ') || 'ibm_quantum_platform'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Backend Fleet Monitor */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={20} color="var(--primary-color)" />
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                IBM QPU Backend Fleet
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {backends.length} Systems Available
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '330px', overflowY: 'auto' }}>
            {backends.map((backend) => {
              const isSelected = selectedBackend === backend.name;
              return (
                <div
                  key={backend.name}
                  onClick={() => setSelectedBackend(backend.name)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: backend.status === 'active' ? 'var(--status-success)' : 'var(--status-warning)'
                      }} />
                      <span style={{ fontWeight: '700', fontSize: '0.92rem', color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                        {backend.name}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: backend.simulator ? 'rgba(20, 184, 166, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: backend.simulator ? '#0D9488' : 'var(--primary-color)',
                        fontWeight: '600'
                      }}>
                        {backend.simulator ? 'SIMULATOR' : backend.processor_type}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {backend.qubits} Qubits
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div>
                      <span>Queue: </span>
                      <strong style={{ color: backend.pending_jobs > 15 ? 'var(--status-warning)' : 'var(--text-primary)' }}>
                        {backend.pending_jobs} jobs
                      </strong>
                    </div>
                    <div>
                      <span>Avg T1: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{backend.avg_t1_us?.toFixed(1) || '280'} μs</strong>
                    </div>
                    <div>
                      <span>2Q Gate Err: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{((backend.avg_2q_error || 0.008) * 100).toFixed(2)}%</strong>
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
        background: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid var(--border-color)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Predefined Medical Quantum Experiments
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Select a clinical quantum circuit formulation to transpile and execute on <strong>{selectedBackend}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Dataset Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Cohort:</label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                {datasets.map(ds => (
                  <option key={ds.id} value={ds.id}>{ds.name || ds.id}</option>
                ))}
              </select>
            </div>

            {/* Shots Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Shots:</label>
              <select
                value={shots}
                onChange={(e) => setShots(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <option value={512}>512 shots</option>
                <option value={1024}>1024 shots (Standard)</option>
                <option value={2048}>2048 shots</option>
                <option value={4096}>4096 shots (High Fidelity)</option>
              </select>
            </div>

            {/* Force Simulation Toggle */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={forceSimulation}
                onChange={(e) => setForceSimulation(e.target.checked)}
              />
              <span>High-Precision Local Sim</span>
            </label>
          </div>
        </div>

        {/* Experiment Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {experimentsList.map((exp) => {
            const isSelected = selectedExperiment === exp.id;
            return (
              <div
                key={exp.id}
                onClick={() => setSelectedExperiment(exp.id)}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--primary-color)',
                      fontWeight: '700'
                    }}>
                      {exp.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      {exp.qubits} Qubits
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '0.98rem', fontWeight: '700', color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                    {exp.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {exp.description}
                  </p>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: isSelected ? 'var(--primary-color)' : 'transparent' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Run Experiment Action Trigger */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Ready to dispatch job to {selectedBackend}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {currentExpDetails?.name} • {shots} shots • {selectedDataset.toUpperCase()} cohort
            </div>
          </div>

          <button
            onClick={handleRunExperiment}
            disabled={isExecuting}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--primary-color)',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              opacity: isExecuting ? 0.7 : 1
            }}
          >
            {isExecuting ? (
              <>
                <RotateCcw className="spinning" size={18} />
                <span>Transpiling & Transmitting to QPU...</span>
              </>
            ) : (
              <>
                <Play size={18} fill="#fff" />
                <span>Execute Quantum Job on {selectedBackend}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Execution Error Alert */}
      {executionError && (
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--status-danger)',
          color: 'var(--status-danger)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px' }}>Quantum Execution Error</div>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{executionError}</div>
          </div>
        </div>
      )}

      {/* Experiment Results Section */}
      {experimentResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Top Results Metrics Bar */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            padding: '20px 24px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(20, 184, 166, 0.15)',
                color: experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'var(--status-success)' : '#0D9488',
                padding: '8px',
                borderRadius: '8px'
              }}>
                <Zap size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Job Results: {experimentResult.experiment_name}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(20, 184, 166, 0.2)',
                    color: experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'var(--status-success)' : '#0D9488'
                  }}>
                    {experimentResult.mode === 'REAL_IBM_HARDWARE' ? 'PHYSICAL QPU EXECUTED' : 'QISKIT SAMPLERV2 SIMULATION'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Backend: <strong>{experimentResult.backend}</strong> • Job ID: <code>{experimentResult.job_id}</code> • Shots: <strong>{experimentResult.shots}</strong>
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
              background: 'var(--card-bg)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="var(--primary-color)" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Physical Measurement Distribution (Bitstrings)
                  </h3>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Total States Sampled: {Object.keys(experimentResult.counts || {}).length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(experimentResult.probabilities || {}).map(([state, prob]) => {
                  const count = experimentResult.counts?.[state] || 0;
                  const isTopState = state === experimentResult.top_state;
                  const percent = (prob * 100).toFixed(2);

                  return (
                    <div key={state} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: isTopState ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                          |{state}⟩ {isTopState && <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)' }}>(Dominant Eigenstate)</span>}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <strong>{count}</strong> shots ({percent}%)
                        </span>
                      </div>
                      <div style={{
                        height: '10px',
                        borderRadius: '5px',
                        background: 'var(--bg-secondary)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${percent}%`,
                          borderRadius: '5px',
                          background: isTopState
                            ? 'linear-gradient(90deg, var(--primary-color), #818cf8)'
                            : 'rgba(99, 102, 241, 0.4)',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quantum Diagnostics Summary */}
              {experimentResult.quantum_diagnostics && (
                <div style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px'
                }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Shannon Entropy</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {experimentResult.quantum_diagnostics.shannon_entropy_bits} bits
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Dominant State Prob</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                      {(experimentResult.quantum_diagnostics.dominant_state_probability * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Circuit Depth</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {experimentResult.circuit_depth} gates
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Circuit Schematic & Execution Diagnostics */}
            <div style={{
              background: 'var(--card-bg)',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code2 size={18} color="var(--primary-color)" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Transpiled Qiskit Circuit Diagram
                  </h3>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {experimentResult.num_qubits} Qubits • {experimentResult.circuit_depth} Depth
                </span>
              </div>

              <pre style={{
                background: 'var(--bg-secondary)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                overflowX: 'auto',
                lineHeight: '1.4',
                maxHeight: '260px'
              }}>
                {experimentResult.circuit_ascii || '// Circuit representation available'}
              </pre>

              {/* Gate Count Breakdown */}
              {experimentResult.gate_counts && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Physical Gate Decomposition:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(experimentResult.gate_counts).map(([gate, count]) => (
                      <span
                        key={gate}
                        style={{
                          fontSize: '0.75rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <strong>{gate.toUpperCase()}</strong>: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Interpretation & Quantum Meaning Card */}
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--primary-color)" />
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

            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              {experimentResult.clinical_interpretation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
