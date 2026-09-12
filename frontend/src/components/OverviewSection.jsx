import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, ArrowRight, Layers, Cpu, FlaskConical, BarChart3,
  ScanSearch, Activity, Shield, FileSearch, Scaling, Target,
  Microscope, BrainCircuit, GitCompareArrows, AlertTriangle
} from 'lucide-react';
import Atom4Orbits from './Atom4Orbits';

const PIPELINE_STAGES = {
  data: [
    {
      num: 1, title: 'Ingestion & Radiomics',
      desc: 'Multi-dataset loading — WDBC, Heart Disease, MRI archives, NIfTI, custom CSVs.',
      icon: Database, paradigm: 'brand'
    },
    {
      num: 2, title: 'Quantum Compression',
      desc: 'SMOTE rebalancing and zero-leakage PCA reduction to 4 qubits.',
      icon: Scaling, paradigm: 'brand'
    },
    {
      num: 3, title: 'Classical Training',
      desc: 'SVM (RBF kernel) and MLP neural network baselines with 5-fold CV.',
      icon: Cpu, paradigm: 'classical'
    },
    {
      num: 4, title: 'Quantum Training',
      desc: 'PennyLane statevector QSVM and variational QNN circuit execution.',
      icon: BrainCircuit, paradigm: 'quantum'
    }
  ],
  eval: [
    {
      num: 5, title: 'Benchmark Matrix',
      desc: 'Full comparison — Accuracy, Sensitivity, Specificity, ROC-AUC, Latency.',
      icon: BarChart3, paradigm: 'hybrid'
    },
    {
      num: 6, title: 'XAI & Explainability',
      desc: 'SHAP explainability and 3-way consensus diagnostic cards.',
      icon: ScanSearch, paradigm: 'hybrid'
    },
    {
      num: 7, title: 'Live Risk Inference',
      desc: 'Real-time patient risk evaluation and clinician report generation.',
      icon: Activity, paradigm: 'hybrid'
    }
  ]
};

const MODELS = [
  { name: 'SVM', sub: 'Classical RBF Kernel', paradigm: 'classical' },
  { name: 'MLP', sub: 'Neural Network Baseline', paradigm: 'classical' },
  { name: 'QSVM', sub: 'Quantum Kernel (ZZFeatureMap)', paradigm: 'quantum' },
  { name: 'QNN / QVC', sub: 'Variational Quantum Classifier', paradigm: 'quantum' }
];

const WORKFLOW_STEPS = [
  { icon: Database, title: 'Data Collection', desc: 'Real biomedical patient clinical records' },
  { icon: FlaskConical, title: 'Clean & Scale', desc: 'Standardize and compress into 4 quantum components' },
  { icon: BrainCircuit, title: 'Training', desc: '5-fold cross-validated pattern learning' },
  { icon: Shield, title: 'Testing', desc: 'Evaluate on unseen samples' },
  { icon: GitCompareArrows, title: 'Comparison', desc: 'Quantum advantage benchmark' }
];

const METRICS = [
  { name: 'Accuracy', desc: 'Overall percentage of correct diagnoses.', color: 'var(--brand-primary)' },
  { name: 'Sensitivity', desc: 'Ability to catch true positives — patients with disease.', color: 'var(--status-danger)' },
  { name: 'Specificity', desc: 'Ability to correctly identify healthy individuals.', color: 'var(--quantum-color)' },
  { name: 'ROC-AUC', desc: 'Diagnostic discrimination capability (0.0 – 1.0).', color: 'var(--hybrid-color)' }
];

function PipelineCard({ stage }) {
  const Icon = stage.icon;
  const numClass = stage.paradigm === 'quantum' ? 'quantum-num'
    : stage.paradigm === 'classical' ? 'classical-num'
    : stage.paradigm === 'hybrid' ? 'hybrid-num'
    : 'classical-num';

  return (
    <div className="pipeline-card" data-paradigm={stage.paradigm}>
      <div className="pipeline-card-head">
        <div className={`pipeline-card-num ${numClass}`}>{stage.num}</div>
        <span className="pipeline-card-title">{stage.title}</span>
      </div>
      <div className="pipeline-card-desc">{stage.desc}</div>
      <Icon size={32} className="pipeline-card-icon" />
    </div>
  );
}

export default function OverviewSection({ activeDataset }) {
  const navigate = useNavigate();

  return (
    <div className="hub-section active">
      {/* ── Hero Banner ── */}
      <div className="overview-hero">
        <div className="overview-hero-content">
          <div className="overview-hero-eyebrow">
            <span className="dot" />
            Hybrid Quantum-Classical Intelligence
          </div>
          <h1>Benchmarking ML Against Quantum Circuits for Early Disease Detection</h1>
          <p className="overview-hero-desc">
            End-to-end platform comparing classical algorithms with quantum ML circuits across tabular biomedical datasets — from ingestion through SHAP explainability to live patient risk scoring.
          </p>
          <div className="overview-hero-actions">
            <button
              onClick={() => navigate('/dataset-overview')}
              className="btn btn-primary"
              style={{ gap: '6px' }}
            >
              <Database size={15} />
              Explore Datasets
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/individual')}
              className="btn btn-outline"
              style={{ gap: '6px' }}
            >
              <FlaskConical size={15} />
              Run Experiment
            </button>
          </div>
        </div>
        <div className="overview-hero-atom">
          <Atom4Orbits size={160} color="var(--brand-primary)" />
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="overview-stats-row">
        <div className="overview-stat-tile" data-accent="brand">
          <div className="stat-tile-value" style={{ color: 'var(--brand-primary)' }}>5+</div>
          <div className="stat-tile-label">Datasets Supported</div>
          <Database size={28} className="stat-tile-icon" />
        </div>
        <div className="overview-stat-tile" data-accent="classical">
          <div className="stat-tile-value">4</div>
          <div className="stat-tile-label">Models Benchmarked</div>
          <Cpu size={28} className="stat-tile-icon" />
        </div>
        <div className="overview-stat-tile" data-accent="quantum">
          <div className="stat-tile-value" style={{ color: 'var(--quantum-color)' }}>4</div>
          <div className="stat-tile-label">Quantum Qubits</div>
          <BrainCircuit size={28} className="stat-tile-icon" />
        </div>
        <div className="overview-stat-tile" data-accent="hybrid">
          <div className="stat-tile-value" style={{ color: 'var(--hybrid-color)' }}>7</div>
          <div className="stat-tile-label">Pipeline Stages</div>
          <Layers size={28} className="stat-tile-icon" />
        </div>
      </div>

      {/* ── 7-Stage Pipeline Bento ── */}
      <div className="pipeline-section-title">
        <Layers size={20} className="pipe-icon" />
        Clinical Pipeline Architecture
      </div>

      <div className="pipeline-bento">
        <div className="pipeline-bento-row data-row">
          {PIPELINE_STAGES.data.map(s => <PipelineCard key={s.num} stage={s} />)}
        </div>

        <div className="pipeline-divider">
          <div className="pipeline-divider-line" />
          <span className="pipeline-divider-label">Evaluation & Inference</span>
          <div className="pipeline-divider-line" />
        </div>

        <div className="pipeline-bento-row eval-row">
          {PIPELINE_STAGES.eval.map(s => <PipelineCard key={s.num} stage={s} />)}
        </div>
      </div>

      {/* ── Model Suite Bento ── */}
      <div className="pipeline-section-title" style={{ marginTop: '28px' }}>
        <Cpu size={20} className="pipe-icon" />
        Benchmarked Model Suite
      </div>

      <div className="model-bento">
        {MODELS.map(m => (
          <div key={m.name} className="model-bento-card">
            <div className="model-bento-card-head">
              <span className={`model-bento-name ${m.paradigm}-text`}>{m.name}</span>
              <span className={`badge-paradigm badge-${m.paradigm}`}>
                {m.paradigm === 'classical' ? 'Classical' : 'Quantum'}
              </span>
            </div>
            <div className="model-bento-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Workflow: How It Works ── */}
      <div className="workflow-section">
        <div className="pipeline-section-title">
          <Microscope size={20} className="pipe-icon" />
          How It Works
        </div>

        <div className="workflow-process-grid">
          {WORKFLOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="workflow-step-card">
                <div className="workflow-step-num">{i + 1}</div>
                <Icon size={20} className="workflow-step-icon" />
                <div className="workflow-step-title">{step.title}</div>
                <div className="workflow-step-desc">{step.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Diagnostic Metrics Reference */}
        <div className="pipeline-section-title">
          <Target size={20} className="pipe-icon" />
          Diagnostic Metrics
        </div>

        <div className="metrics-ref-grid">
          {METRICS.map(m => (
            <div key={m.name} className="metric-ref-card">
              <div className="metric-ref-name">
                <span className="metric-ref-dot" style={{ background: m.color }} />
                {m.name}
              </div>
              <div className="metric-ref-desc">{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Clinical Callout */}
        <div className="clinical-callout">
          <AlertTriangle size={20} className="clinical-callout-icon" />
          <div>
            <div className="clinical-callout-title">Why Sensitivity Matters Most</div>
            <div className="clinical-callout-text">
              Missing an active disease (false negative) has life-threatening consequences.
              High sensitivity ensures deadly diagnostic misses are minimized — a false alarm
              is always preferable to a missed cancer.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
