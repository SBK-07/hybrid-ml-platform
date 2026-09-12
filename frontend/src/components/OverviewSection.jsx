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

/* ── Design Tokens ─────────────────────────────────────────── */
const PARADIGM = {
  brand:     { color: 'var(--brand-primary)',  bg: 'var(--brand-bg)',   glow: 'var(--brand-glow)' },
  classical: { color: 'var(--classical-color)', bg: 'var(--classical-bg)', glow: 'var(--classical-glow)' },
  quantum:   { color: 'var(--quantum-color)',  bg: 'var(--quantum-bg)', glow: 'var(--quantum-glow)' },
  hybrid:    { color: 'var(--hybrid-color)',   bg: 'var(--hybrid-bg, rgba(245, 158, 11, 0.12))', glow: 'var(--hybrid-glow, rgba(245, 158, 11, 0.25))' }
};

const eyebrowStyle = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-tertiary)'
};

/* ── Minimal Section Header ────────────────────────────────── */
function SectionHeader({ index, icon: Icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={eyebrowStyle}>{index}</span>
        <span style={{ width: '28px', height: '1px', background: 'var(--border-color)' }} />
        <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '640px' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ── Minimal Pipeline Card ─────────────────────────────────── */
function PipelineCard({ stage }) {
  const Icon = stage.icon;
  const tone = PARADIGM[stage.paradigm] || PARADIGM.brand;

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = tone.color;
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: tone.color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <span style={{ fontSize: '1.7rem', fontWeight: 700, color: tone.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {String(stage.num).padStart(2, '0')}
        </span>
        <Icon size={18} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
        {stage.title}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        {stage.desc}
      </div>
    </div>
  );
}

/* ── Minimal Hairline Divider ──────────────────────────────── */
function HairlineDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '28px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
      <span style={eyebrowStyle}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
    </div>
  );
}

export default function OverviewSection({ activeDataset }) {
  const navigate = useNavigate();

  const stats = [
    { value: '5+', label: 'Datasets Supported', color: 'var(--brand-primary)' },
    { value: '4', label: 'Models Benchmarked', color: 'var(--classical-color)' },
    { value: '4', label: 'Quantum Qubits', color: 'var(--quantum-color)' },
    { value: '7', label: 'Pipeline Stages', color: 'var(--hybrid-color)' }
  ];

  return (
    <div className="hub-section active" style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 32px 96px' }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '56px',
        flexWrap: 'wrap',
        padding: '72px 0 80px'
      }}>
        <div style={{ flex: 1, minWidth: '320px', maxWidth: '720px' }}>
          {/* Eyebrow pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', marginBottom: '28px',
            border: '1px solid var(--border-color)', borderRadius: '999px',
            background: 'var(--bg-card)'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)', boxShadow: '0 0 8px var(--brand-glow)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Hybrid Quantum–Classical Intelligence
            </span>
          </div>

          <h1 style={{
            margin: '0 0 20px',
            fontSize: 'clamp(2.1rem, 4.2vw, 3.1rem)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.08,
            color: 'var(--text-primary)'
          }}>
            Benchmarking ML against quantum circuits for{' '}
            <span style={{ color: 'var(--brand-primary)' }}>early disease detection</span>.
          </h1>

          <p style={{ margin: '0 0 36px', fontSize: '0.98rem', lineHeight: 1.75, color: 'var(--text-secondary)', maxWidth: '560px' }}>
            An end-to-end platform comparing classical algorithms with quantum ML circuits across
            tabular biomedical datasets — from ingestion through SHAP explainability to live
            patient risk scoring.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/dataset-overview')}
              style={{
                height: '46px', padding: '0 22px', borderRadius: 'var(--radius-md)', border: 'none',
                background: 'var(--brand-primary)', color: '#FFFFFF', fontSize: '0.88rem', fontWeight: 600,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 2px 8px var(--brand-glow)', transition: 'all 0.2s ease', letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--brand-primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Database size={15} /> Explore Datasets <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/individual')}
              style={{
                height: '46px', padding: '0 22px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', background: 'transparent',
                color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s ease', letterSpacing: '-0.01em'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.borderColor = 'var(--text-tertiary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <FlaskConical size={15} /> Run Experiment
            </button>
          </div>
        </div>

        {/* Orbital atom mark */}
        <div style={{ position: 'relative', width: '230px', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--border-color)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', inset: '26px', border: '1px dashed var(--border-color)', borderRadius: '50%', opacity: 0.55 }} />
          <Atom4Orbits size={120} color="var(--brand-primary)" />
        </div>
      </div>

      {/* ── Quick Stats (hairline table) ─────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '88px'
      }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ padding: '30px 28px', borderLeft: i > 0 ? '1px solid var(--border-color)' : 'none' }}>
            <div style={{ fontSize: '2.1rem', fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '10px' }}>
              {s.value}
            </div>
            <div style={eyebrowStyle}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── 01 · Pipeline Architecture ───────────────────────── */}
      <section style={{ marginBottom: '88px' }}>
        <SectionHeader
          index="01"
          icon={Layers}
          title="Clinical Pipeline Architecture"
          subtitle="Seven deterministic stages carry raw clinical records from ingestion to live inference — each auditable, leak-free, and reproducible."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {PIPELINE_STAGES.data.map(s => <PipelineCard key={s.num} stage={s} />)}
        </div>

        <HairlineDivider label="Evaluation & Inference" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {PIPELINE_STAGES.eval.map(s => <PipelineCard key={s.num} stage={s} />)}
        </div>
      </section>

      {/* ── 02 · Model Suite ─────────────────────────────────── */}
      <section style={{ marginBottom: '88px' }}>
        <SectionHeader
          index="02"
          icon={Cpu}
          title="Benchmarked Model Suite"
          subtitle="Two classical baselines and two quantum circuits, trained under identical preprocessing and validation contracts."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
          {MODELS.map(m => {
            const tone = PARADIGM[m.paradigm];
            return (
              <div
                key={m.name}
                style={{
                  position: 'relative', overflow: 'hidden',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)', padding: '22px 24px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = tone.color; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: tone.color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                    {m.name}
                  </span>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '3px 8px', borderRadius: '4px',
                    background: tone.bg, color: tone.color, border: `1px solid ${tone.glow}`
                  }}>
                    {m.paradigm === 'classical' ? 'Classical' : 'Quantum'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {m.sub}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 03 · How It Works ────────────────────────────────── */}
      <section style={{ marginBottom: '88px' }}>
        <SectionHeader
          index="03"
          icon={Microscope}
          title="How It Works"
          subtitle="A linear, reproducible research workflow — every stage versioned and every split stratified."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
          {WORKFLOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {i + 1}
                    </span>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Icon size={15} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {step.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 04 · Diagnostic Metrics ──────────────────────────── */}
      <section style={{ marginBottom: '56px' }}>
        <SectionHeader
          index="04"
          icon={Target}
          title="Diagnostic Metrics"
          subtitle="The four clinical pillars every model is judged against — interpreted for clinicians, not just engineers."
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {METRICS.map(m => (
            <div
              key={m.name}
              style={{
                padding: '22px 24px',
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-solid)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-inset)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {m.name}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {m.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Clinical callout */}
        <div style={{
          display: 'flex', gap: '16px', alignItems: 'flex-start',
          padding: '22px 26px',
          background: 'var(--banner-warn-bg)',
          border: '1px solid var(--banner-warn-border)',
          borderRadius: 'var(--radius-md)'
        }}>
          <AlertTriangle size={20} style={{ color: 'var(--banner-warn-text)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--banner-warn-text)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
              Why Sensitivity Matters Most
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--banner-warn-text)', lineHeight: 1.7 }}>
              Missing an active disease (false negative) has life-threatening consequences.
              High sensitivity ensures deadly diagnostic misses are minimized — a false alarm
              is always preferable to a missed cancer.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}