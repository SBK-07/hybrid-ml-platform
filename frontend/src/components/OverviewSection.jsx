import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Cpu, LayoutGrid, Database, ArrowRight } from 'lucide-react';
import Atom4Orbits from './Atom4Orbits';

export default function OverviewSection({ activeDataset }) {
  const navigate = useNavigate();
  const stages = [
    {
      number: 1,
      title: 'Landing & Overview',
      desc: 'Platform context setting and interactive 7-stage architecture map.'
    },
    {
      number: 2,
      title: 'Biomedical Ingestion & Radiomics',
      desc: "Multi-dataset loading (WDBC Cancer, Heart Disease, MRI Archives, NIfTI, Custom CSVs)."
    },
    {
      number: 3,
      title: 'Quantum Compression',
      desc: 'SMOTE rebalance and zero-leakage PCA feature reduction down to 4 qubits.'
    },
    {
      number: 4,
      title: 'Hybrid Model Training',
      desc: 'Execution of Classical baselines & PennyLane statevector quantum circuits.'
    },
    {
      number: 5,
      title: 'Benchmark Matrix',
      desc: 'Full matrix comparison across Accuracy, Sensitivity, Specificity, ROC-AUC, and Latency.'
    },
    {
      number: 6,
      title: 'XAI & Explainability',
      desc: 'SHAP explainability and 3-way consensus diagnostic cards.'
    },
    {
      number: 7,
      title: 'Live Risk Inference',
      desc: 'Automated clinician report generation and real-time patient risk evaluation.'
    }
  ];

  return (
    <div className="hub-section active">
      <div className="section-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutGrid size={24} style={{ color: 'var(--brand-primary)' }} />
            Platform Overview & 7-Stage Workflow Architecture
          </h1>
          <p className="subtitle">
            Quddos is an end-to-end benchmarkable intelligence platform comparing classical machine learning algorithms with quantum machine learning (QML) circuits for early disease detection across tabular biomedical datasets.
          </p>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="card active-control-card slide-in-up" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--brand-bg), var(--quantum-bg))', borderColor: 'var(--brand-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
            <Atom4Orbits size={32} color="var(--brand-primary)" />
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>SIH 2026 Problem Statement 139 Implementation</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Bridging classical feature preprocessing, SMOTE class balancing, zero-data-leakage PCA feature compression down to 4 qubits, PennyLane quantum circuit statevector simulation, and real-time patient risk inference.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dataset-overview')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, padding: '10px 20px', whiteSpace: 'nowrap' }}
          >
            <Database size={16} />
            <span>Explore Deep Dataset EDA & Radiomics</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 7-Stage Narrative Clinical Pipeline - Vertical Roadmap */}
      <h3 style={{ color: 'var(--text-primary)', margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Layers size={18} style={{ color: 'var(--brand-primary)' }} /> 7-Stage Narrative Clinical Pipeline
      </h3>

      <div className="card" style={{ marginBottom: '28px', padding: '28px 32px' }}>
        <div className="stagger-children" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Continuous Vertical Line */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              bottom: '14px',
              left: '13px',
              width: '2px',
              background: 'linear-gradient(180deg, var(--brand-primary), var(--quantum-color))',
              zIndex: 1,
              borderRadius: '1px'
            }}
          />

          {stages.map((stage) => (
            <div
              key={stage.number}
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                cursor: 'default'
              }}
            >
              {/* Numbered Circular Dot */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: stage.number <= 4
                    ? 'linear-gradient(135deg, #059669, #10B981)'
                    : 'linear-gradient(135deg, #0D9488, #14B8A6)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: stage.number <= 4
                    ? '0 2px 8px var(--brand-glow)'
                    : '0 2px 8px var(--quantum-glow)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {stage.number}
              </div>

              {/* Title & Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {stage.title}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {stage.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Models Grid */}
      <div className="card">
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} style={{ color: 'var(--brand-primary)' }} /> Benchmarked Model Suite
        </h3>
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div className="metric-mini-box">
            <div className="mini-val" style={{ color: 'var(--text-primary)' }}>SVM</div>
            <div className="mini-lbl">Classical RBF Kernel</div>
          </div>
          <div className="metric-mini-box">
            <div className="mini-val" style={{ color: 'var(--text-primary)' }}>MLP</div>
            <div className="mini-lbl">Neural Network</div>
          </div>
          <div className="metric-mini-box">
            <div className="mini-val" style={{ color: 'var(--brand-primary)' }}>QSVM</div>
            <div className="mini-lbl">Quantum Kernel (ZZMap)</div>
          </div>
          <div className="metric-mini-box">
            <div className="mini-val" style={{ color: 'var(--brand-primary)' }}>QNN / QVC</div>
            <div className="mini-lbl">Variational Quantum</div>
          </div>
        </div>
      </div>
    </div>
  );
}
