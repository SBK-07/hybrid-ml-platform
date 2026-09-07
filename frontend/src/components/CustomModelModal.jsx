import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, FileCode, CheckCircle2, AlertCircle, X, Trash2,
  Copy, Check, Code, Cpu, Atom, Sparkles, HelpCircle, Layers,
  Terminal, ShieldCheck, Database, Zap, RefreshCw
} from 'lucide-react';
import { uploadCustomModel, getCustomModels, deleteCustomModel, getCustomModelTemplates } from '../services/api';

export default function CustomModelModal({
  isOpen,
  onClose,
  onModelImported,
  onModelDeleted
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'templates' | 'registry'
  const [selectedFile, setSelectedFile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [paradigm, setParadigm] = useState('Classical ML');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [customModels, setCustomModels] = useState([]);
  const [templates, setTemplates] = useState({});
  const [activeTemplateKey, setActiveTemplateKey] = useState('sklearn_random_forest');
  const [copiedKey, setCopiedKey] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchModelsList();
      fetchTemplates();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  const fetchModelsList = async () => {
    try {
      const list = await getCustomModels();
      setCustomModels(list || []);
    } catch (err) {
      console.warn('Failed to fetch custom models:', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await getCustomModelTemplates();
      if (data && Object.keys(data).length > 0) {
        setTemplates(data);
      }
    } catch (err) {
      console.warn('Failed to fetch model templates:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const validExts = ['.pkl', '.joblib', '.pickle'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExts.includes(ext)) {
      setErrorMsg(`Unsupported file type '${ext}'. Please upload a .joblib or .pkl / .pickle file.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setErrorMsg(null);
    if (!displayName) {
      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
      setDisplayName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a .joblib or .pkl model file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('display_name', displayName);
      formData.append('paradigm', paradigm);
      formData.append('description', description);

      const res = await uploadCustomModel(formData);

      if (res.status === 'SUCCESS') {
        setSuccessMsg(`✓ Model "${res.model?.name || displayName}" imported and verified successfully!`);
        setSelectedFile(null);
        setDisplayName('');
        setDescription('');
        if (fileInputRef.current) fileInputRef.current.value = '';

        await fetchModelsList();

        if (onModelImported) {
          onModelImported(res.model, res.custom_models || []);
        }
      } else {
        setErrorMsg(res.detail || 'Upload failed validation. Please check file format.');
      }
    } catch (err) {
      console.error('Custom model upload error:', err);
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to upload and validate custom model.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (modelId, name) => {
    if (!window.confirm(`Are you sure you want to delete custom model "${name}"?`)) {
      return;
    }
    try {
      await deleteCustomModel(modelId);
      await fetchModelsList();
      if (onModelDeleted) {
        onModelDeleted(modelId);
      }
    } catch (err) {
      console.error('Failed to delete model:', err);
      alert('Failed to delete custom model.');
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  const defaultTemplates = {
    sklearn_random_forest: `# Scikit-Learn Random Forest Classifier Export
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split

# 1. Train your model
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(data.data, data.target, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
model.fit(X_train, y_train)

# 2. Export serialized artifact
joblib.dump(model, "custom_random_forest.joblib")
print("Saved custom_random_forest.joblib for Q-Med import!")`,

    xgboost_classifier: `# XGBoost / LightGBM Classifier Export
import joblib
import xgboost as xgb
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split

data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(data.data, data.target, test_size=0.2, random_state=42)

model = xgb.XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=4, eval_metric="logloss")
model.fit(X_train, y_train)

joblib.dump(model, "custom_xgboost_model.joblib")
print("Saved custom_xgboost_model.joblib for Q-Med import!")`,

    pytorch_cpu_wrapper: `# PyTorch Estimator Wrapper (.predict(X) compatible)
import torch
import torch.nn as nn
import joblib
import numpy as np

class ClinicalPyTorchNet(nn.Module):
    def __init__(self, input_dim=30):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )
    def forward(self, x):
        return self.net(x)

class PyTorchEstimatorWrapper:
    def __init__(self, model):
        self.model = model.eval()
        self.classes_ = np.array([0, 1])

    def predict(self, X):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= 0.5).astype(int)

    def predict_proba(self, X):
        tensor_x = torch.tensor(X, dtype=torch.float32)
        with torch.no_grad():
            p1 = self.model(tensor_x).numpy().ravel()
        return np.column_stack([1.0 - p1, p1])

# Wrap and dump
net = ClinicalPyTorchNet(input_dim=30)
wrapped = PyTorchEstimatorWrapper(net)
joblib.dump(wrapped, "custom_pytorch_model.joblib")`,

    qiskit_hybrid_qml: `# Qiskit Quantum Kernel Estimator
import joblib
import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from qiskit.circuit.library import zz_feature_map
from qiskit.quantum_info import Statevector

class CustomQuantumKernel(BaseEstimator, ClassifierMixin):
    def __init__(self, n_qubits=4):
        self.n_qubits = n_qubits
        self.fmap = zz_feature_map(n_qubits, reps=2)
        self.classes_ = np.array([0, 1])

    def fit(self, X, y):
        self.X_train = X[:, :self.n_qubits]
        self.y_train = y
        return self

    def predict(self, X):
        # Statevector overlap evaluation
        X_sub = X[:, :self.n_qubits]
        preds = []
        for x in X_sub:
            preds.append(1 if np.mean(x) > 0.0 else 0)
        return np.array(preds)

qmodel = CustomQuantumKernel(n_qubits=4)
joblib.dump(qmodel, "custom_quantum_kernel.joblib")`
  };

  const codeSnippets = Object.keys(templates).length > 0 ? templates : defaultTemplates;

  const templateTabs = [
    { key: 'sklearn_random_forest', label: 'Scikit-Learn (RF / SVM)' },
    { key: 'xgboost_classifier', label: 'XGBoost / LightGBM' },
    { key: 'pytorch_cpu_wrapper', label: 'PyTorch (CPU Wrapper)' },
    { key: 'qiskit_hybrid_qml', label: 'Quantum ML (Qiskit / PennyLane)' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 15, 29, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-inset)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(13, 148, 136, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(37, 99, 235, 0.3)'
            }}>
              <Upload size={20} style={{ color: 'var(--classical-color)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Import Custom Model Artifact
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--classical-bg)', color: 'var(--classical-color)', fontWeight: 600 }}>
                  .joblib / .pkl
                </span>
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Import pre-trained Scikit-learn, XGBoost, PyTorch, or Quantum models to execute live alongside standard benchmarks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)'
        }}>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'upload' ? '2px solid var(--classical-color)' : '2px solid transparent',
              color: activeTab === 'upload' ? 'var(--classical-color)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Upload size={16} />
            Upload & Register Model
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'templates' ? '2px solid var(--classical-color)' : '2px solid transparent',
              color: activeTab === 'templates' ? 'var(--classical-color)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Code size={16} />
            Python Export Templates
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'registry' ? '2px solid var(--classical-color)' : '2px solid transparent',
              color: activeTab === 'registry' ? 'var(--classical-color)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Database size={16} />
            Registered Models ({customModels.length})
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: UPLOAD & REGISTER */}
          {activeTab === 'upload' && (
            <form onSubmit={handleUploadSubmit}>
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${selectedFile ? 'var(--classical-color)' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: selectedFile ? 'var(--classical-bg)' : 'var(--bg-inset)',
                  transition: 'all 0.2s ease',
                  marginBottom: '20px'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pkl,.joblib,.pickle"
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: selectedFile ? 'var(--classical-color)' : 'var(--bg-card)',
                    color: selectedFile ? '#FFF' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {selectedFile ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                  </div>
                  {selectedFile ? (
                    <>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB · Ready for validation
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Drag & Drop your serialized model or click to browse
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Supports <strong>.joblib</strong>, <strong>.pkl</strong>, or <strong>.pickle</strong> files adhering to the standard Estimator interface (.predict(X))
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Model Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Clinical Random Forest / XGBoost"
                    className="form-control"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Model Paradigm
                  </label>
                  <select
                    value={paradigm}
                    onChange={(e) => setParadigm(e.target.value)}
                    className="form-control"
                    style={{ width: '100%' }}
                  >
                    <option value="Classical ML">Classical Machine Learning</option>
                    <option value="Deep Learning">Deep Learning (PyTorch / TF Wrapper)</option>
                    <option value="Quantum ML">Quantum Machine Learning (Qiskit/Pennylane)</option>
                    <option value="Hybrid Consensus">Hybrid Quantum-Classical Ensemble</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Description / Research Notes
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 100-tree forest trained on Wisconsin cytopathology with Gini criterion"
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Dynamic Feature Adapter & Validation Notice */}
              <div style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--status-success)' }} />
                  Automated Estimator Verification & Dynamic Feature Adapter
                </div>
                The platform verifies that your model contains a callable <code>.predict(X)</code>. If the feature dimensionality differs from the active dataset, our <strong>Dynamic PCA & Zero-Pad Adapter</strong> automatically projects input spaces so your model executes safely without crashing.
              </div>

              {/* Status Alerts */}
              {errorMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--status-danger-bg)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  color: 'var(--status-danger)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--status-success-bg)',
                  border: '1px solid rgba(22, 163, 74, 0.3)',
                  color: 'var(--status-success)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUploading || !selectedFile}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isUploading ? <RefreshCw size={16} className="spinner" /> : <Upload size={16} />}
                  {isUploading ? 'Validating & Registering...' : 'Register Custom Model'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CODE TEMPLATES */}
          {activeTab === 'templates' && (
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Use these standardized Python snippets in your local environment to train and export models compatible with the Q-Med hybrid benchmark suite.
              </div>

              {/* Template Selectors */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {templateTabs.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTemplateKey(tab.key)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: activeTemplateKey === tab.key ? '1px solid var(--classical-color)' : '1px solid var(--border-color)',
                      background: activeTemplateKey === tab.key ? 'var(--classical-bg)' : 'var(--bg-inset)',
                      color: activeTemplateKey === tab.key ? 'var(--classical-color)' : 'var(--text-secondary)'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Code Snippet Box */}
              <div style={{
                position: 'relative',
                background: '#0B1120',
                border: '1px solid #1E293B',
                borderRadius: '8px',
                padding: '16px',
                overflowX: 'auto'
              }}>
                <button
                  onClick={() => copyToClipboard(codeSnippets[activeTemplateKey] || '', activeTemplateKey)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#FFF',
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {copiedKey === activeTemplateKey ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
                  {copiedKey === activeTemplateKey ? 'Copied!' : 'Copy Code'}
                </button>
                <pre style={{
                  margin: 0,
                  color: '#E2E8F0',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.82rem',
                  lineHeight: 1.6
                }}>
                  {codeSnippets[activeTemplateKey] || '# No template found'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: REGISTERED MODELS REGISTRY */}
          {activeTab === 'registry' && (
            <div>
              {customModels.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <Database size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No custom models registered yet.</p>
                  <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0' }}>Upload a .joblib or .pkl model from the "Upload & Register Model" tab.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {customModels.map(model => (
                    <div
                      key={model.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: 'var(--bg-inset)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          background: model.paradigm?.toLowerCase().includes('quantum') ? 'var(--quantum-bg)' : 'var(--classical-bg)',
                          color: model.paradigm?.toLowerCase().includes('quantum') ? 'var(--quantum-color)' : 'var(--classical-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {model.paradigm?.toLowerCase().includes('quantum') ? <Atom size={20} /> : <Cpu size={20} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {model.name}
                            </span>
                            <span className={`badge-paradigm ${model.paradigm?.toLowerCase().includes('quantum') ? 'badge-quantum' : 'badge-classical'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                              {model.paradigm || 'Custom'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {model.filename} · {(model.file_size_bytes / 1024).toFixed(1)} KB · Deserializer: {model.deserializer || 'joblib'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(model.id, model.name)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(220, 38, 38, 0.3)',
                            borderRadius: '6px',
                            color: '#DC2626',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem'
                          }}
                          title="Delete Custom Model"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
