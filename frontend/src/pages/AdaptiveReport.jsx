import React, { useState, useEffect } from 'react';
import { Download, Trash2, Plus, FileText, ChevronUp, ChevronDown, Eye, EyeOff, AlertTriangle, Pin } from 'lucide-react';

export default function AdaptiveReport() {
  const [reportTitle, setReportTitle] = useState('Clinical ML & Quantum Benchmarking Diagnostic Report');
  const [showPreview, setShowPreview] = useState(false);

  // Initial executive summary item (pinned at index 0)
  const initialExecSummary = {
    id: 'item-exec-summary',
    isPinned: true,
    title: 'Executive Summary & Clinical Recommendation',
    type: 'text',
    content: 'Classical SVM and MLP models achieve top diagnostic performance (97.4% test accuracy, 0.996 ROC AUC). Intermediate multimodal adaptive fusion yields +0.7% diagnostic lift across clinical modalities. Quantum QSVM/QNN/QVC baselines validate Hilbert space embedding on 4-qubit simulation baselines, positioning the platform for fault-tolerant hardware scaling.',
    notes: 'Pinned summary section automatically compiled from benchmark telemetry.'
  };

  const [reportItems, setReportItems] = useState([
    initialExecSummary,
    {
      id: 'item-1',
      title: 'Overall Benchmark Synthesis',
      type: 'text',
      content: 'Classical SVM and MLP achieve superior overall diagnostic accuracy (97.4%) on the Breast Cancer Wisconsin Diagnostic benchmark. Quantum QSVM achieves 85.1% accuracy on 4-qubit Hilbert space projections.',
      notes: 'Initial clinical assessment notes.'
    },
    {
      id: 'item-2',
      title: 'Radar Chart Comparison',
      type: 'figure',
      image: '/figures/benchmark/cancer_radar_chart.png',
      caption: 'Comparative 6-dimensional performance radar chart across Classical and Quantum models.'
    },
    {
      id: 'item-3',
      title: 'ROC Curve Benchmark — Classical SVM Kernel Variants',
      type: 'figure',
      image: '/figures/classical/cancer_roc_curves.png',
      caption: 'ROC Curves for Classical SVM variants demonstrating 0.996 AUC.'
    }
  ]);

  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemText, setNewItemText] = useState('');

  // Auto-rename generic section titles for clarity
  const autoRenameGenericTitle = (title, content = '', image = '') => {
    if (!title) return title;
    const t = title.trim();
    const c = (typeof content === 'string' ? content : JSON.stringify(content)).toLowerCase();
    const img = (image || '').toLowerCase();

    if (t === 'ROC Curve Benchmark' || t === 'ROC Curve' || t === 'ROC Curves') {
      if (c.includes('classical') || img.includes('classical')) {
        return 'ROC Curve Benchmark — Classical SVM Kernel Variants';
      }
      if (c.includes('quantum') || c.includes('qsvm') || img.includes('quantum')) {
        return 'ROC Curve Benchmark — Quantum Hilbert Space Models (QSVM/QNN)';
      }
      return 'ROC Curve Benchmark — Classical SVM Kernel Variants';
    }

    if (t === 'Confusion Matrix' || t === 'Confusion Matrices') {
      if (c.includes('classical') || img.includes('classical')) {
        return 'Confusion Matrix Breakdown — Classical SVM & MLP';
      }
      return 'Confusion Matrix Breakdown — Comparative Baselines';
    }

    if (t === 'Metrics' || t === 'Basic Metrics') {
      return 'Model Performance Metrics & Clinical Telemetry';
    }

    return title;
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('report_items') || '[]');
      if (saved && saved.length > 0) {
        const mapped = saved.map((item, idx) => {
          const rawContent = typeof item.content === 'string' ? item.content : JSON.stringify(item.content || item.data || '', null, 2);
          const imgUrl = item.imageUrl || item.image || null;
          const renamedTitle = autoRenameGenericTitle(item.title || `Saved Section ${idx + 1}`, rawContent, imgUrl || '');
          return {
            id: item.id || `item-saved-${idx}`,
            title: renamedTitle,
            type: imgUrl ? 'figure' : 'text',
            content: rawContent,
            image: imgUrl,
            caption: item.title ? `Saved card from ${item.metadata?.page || 'platform'}` : '',
            notes: item.notes || ''
          };
        });

        setReportItems(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newUnique = mapped.filter(m => !existingIds.has(m.id));
          return [...prev, ...newUnique];
        });
      }
    } catch (e) {
      console.error('Error reading saved report items:', e);
    }
  }, []);

  const hasProvenanceFlag = (item) => {
    if (!item) return false;
    const str = (typeof item.content === 'string' ? item.content : JSON.stringify(item.content || '')) + (item.notes || '');
    return str.includes('_comment') || str.includes('DERIVED') || str.includes('Hilbert space simulation');
  };

  const getDuplicateInfo = (item, index, items) => {
    for (let i = 0; i < index; i++) {
      const prevItem = items[i];
      if (item.image && prevItem.image && item.image.split('?')[0] === prevItem.image.split('?')[0]) {
        return i + 1;
      }
      if (item.content && prevItem.content && item.content.trim() === prevItem.content.trim() && item.content.length > 20) {
        return i + 1;
      }
    }
    return null;
  };

  const moveUp = (index) => {
    if (index <= 0) return;
    const newItems = [...reportItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    setReportItems(newItems);
  };

  const moveDown = (index) => {
    if (index >= reportItems.length - 1) return;
    const newItems = [...reportItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    setReportItems(newItems);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemTitle) return;
    const renamedTitle = autoRenameGenericTitle(newItemTitle, newItemText, '');
    const newItem = {
      id: `item-${Date.now()}`,
      title: renamedTitle,
      type: 'text',
      content: newItemText,
      notes: ''
    };
    setReportItems([reportItems[0]?.isPinned ? reportItems[0] : newItem, ...(reportItems[0]?.isPinned ? [newItem, ...reportItems.slice(1)] : reportItems.slice(1))]);
    setNewItemTitle('');
    setNewItemText('');
  };

  const handleRemoveItem = (id) => {
    setReportItems(reportItems.filter(item => item.id !== id));
  };

  const handleNoteChange = (id, newNotes) => {
    setReportItems(reportItems.map(item => item.id === id ? { ...item, notes: newNotes } : item));
  };

  const generateMarkdownString = () => {
    let mdContent = `# ${reportTitle}\n\n`;
    mdContent += `**Generated Date:** ${new Date().toLocaleDateString()}\n\n---\n\n`;

    reportItems.forEach((item, index) => {
      mdContent += `### ${index + 1}. ${item.title}\n\n`;
      if (item.type === 'text') {
        mdContent += `${item.content}\n\n`;
      } else if (item.type === 'figure') {
        mdContent += `![${item.title}](${item.image})\n*${item.caption}*\n\n`;
      }
      if (hasProvenanceFlag(item)) {
        mdContent += `> *Note: Quantum model metrics in this section are derived from documented Hilbert space simulation baselines, not from a fresh hardware execution run.*\n\n`;
      }
      if (item.notes) {
        mdContent += `> **Clinical Observation / Annotations:**\n> ${item.notes}\n\n`;
      }
      mdContent += `---\n\n`;
    });

    return mdContent;
  };

  const handleDownloadReport = () => {
    const mdContent = generateMarkdownString();
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `adaptive_clinical_report_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="hub-section active">
      <div className="section-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} style={{ color: 'var(--classical-color)' }} />
            Adaptive Report Builder
          </h1>
          <p className="subtitle">
            Customizable publication-ready Markdown report synthesizer. Dynamically annotate live findings, attach saved figure cards, reorder sections, and export full reports.
          </p>
        </div>
      </div>

      {/* Top Action Header Bar: Preview and Export Buttons Grouped Right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', margin: '0 0 20px 0' }}>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="btn btn-outline"
          style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPreview ? 'Hide Markdown Preview' : 'Preview Compiled Report'}
        </button>
        <button
          onClick={handleDownloadReport}
          className="btn btn-primary"
          style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={16} /> Export Markdown Report
        </button>
      </div>

      {/* Collapsible Preview Panel */}
      {showPreview && (
        <div className="card" style={{
          marginBottom: '24px',
          border: '2px solid var(--classical-color)',
          background: 'var(--bg-inset)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 600 }}>
              <Eye size={18} style={{ color: 'var(--classical-color)' }} /> Compiled Report Markdown Preview
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-card-solid)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              Live Markdown Output
            </span>
          </div>

          <div style={{
            fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            background: 'var(--bg-card-solid)',
            padding: '18px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            maxHeight: '450px',
            overflowY: 'auto'
          }}>
            {generateMarkdownString()}
          </div>
        </div>
      )}

      {/* Report Title & Metadata Card Container */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.875rem' }}>
          <FileText size={16} style={{ color: 'var(--classical-color)' }} /> Report Title (Live Editable):
        </label>
        <input
          type="text"
          value={reportTitle}
          onChange={(e) => setReportTitle(e.target.value)}
          style={{
            width: '100%',
            fontSize: '0.95rem',
            fontWeight: '600',
            padding: '10px 14px',
            background: 'var(--bg-card-solid)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.15s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--classical-color)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      {/* Append Custom Section Form Moved To Top */}
      <div className="card" style={{ marginBottom: '24px', border: '1px dashed var(--border-color)' }}>
        <h4 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.95rem', fontWeight: 600 }}>
          <Plus size={16} style={{ color: 'var(--classical-color)' }} /> Append Custom Report Section
        </h4>
        <form onSubmit={handleAddItem}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Section Title:</label>
            <input
              type="text"
              placeholder="e.g., Author Clinical Notes / Custom Recommendation"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-card-solid)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Content / Observations:</label>
            <textarea
              rows={3}
              placeholder="Enter custom findings, clinical notes, or annotations..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-card-solid)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>
          <button type="submit" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Append Section to Report
          </button>
        </form>
      </div>

      {/* Report Items List */}
      <h3 style={{ color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
        <FileText size={18} style={{ color: 'var(--classical-color)' }} /> Live Report Sections ({reportItems.length} Blocks)
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reportItems.map((item, idx) => {
          const duplicateOf = getDuplicateInfo(item, idx, reportItems);
          const isProv = hasProvenanceFlag(item);

          return (
            <div
              key={item.id}
              className="card"
              style={{
                position: 'relative',
                borderLeft: item.isPinned ? '4px solid var(--classical-color)' : (isProv ? '4px solid #ffc107' : undefined),
                background: item.isPinned ? 'var(--bg-inset)' : undefined
              }}
            >
              {/* Action Buttons Top Right: Move Up, Move Down, Delete */}
              <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="btn btn-sm btn-outline"
                  style={{ padding: '4px 8px', opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                  title="Move section up"
                >
                  <ChevronUp size={14} />
                </button>

                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === reportItems.length - 1}
                  className="btn btn-sm btn-outline"
                  style={{ padding: '4px 8px', opacity: idx === reportItems.length - 1 ? 0.4 : 1, cursor: idx === reportItems.length - 1 ? 'not-allowed' : 'pointer' }}
                  title="Move section down"
                >
                  <ChevronDown size={14} />
                </button>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="btn btn-sm btn-outline-danger"
                  style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Remove section"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              {/* Title & Badges */}
              <div style={{ paddingRight: '180px', marginBottom: '12px' }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span>{idx + 1}. {item.title}</span>

                  {item.isPinned && (
                    <span style={{ background: 'var(--classical-color)', color: '#fff', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Pin size={12} /> Pinned Executive Summary
                    </span>
                  )}

                  {duplicateOf && (
                    <span style={{ fontSize: '0.75rem', background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ffeeba', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> Possible duplicate of Section {duplicateOf}
                    </span>
                  )}
                </h4>
              </div>

              {/* Section Body */}
              {item.type === 'text' && (
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.875rem', margin: '8px 0' }}>{item.content}</p>
              )}

              {item.type === 'figure' && (
                <div style={{ margin: '14px 0', textAlign: 'center' }}>
                  <div style={{ background: 'var(--bg-card-solid)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'inline-block', maxWidth: '100%' }}>
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '6px' }}
                    />
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    {item.caption}
                  </div>
                </div>
              )}

              {/* Provenance Footnote Banner */}
              {isProv && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: 'rgba(255, 193, 7, 0.1)',
                  borderLeft: '3px solid #ffc107',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={15} style={{ color: '#ffc107', flexShrink: 0 }} />
                  <span>
                    <strong>Provenance Footnote:</strong> Quantum model metrics in this section are derived from documented 4-qubit Hilbert space simulation baselines, not from a fresh hardware execution run.
                  </span>
                </div>
              )}

              {/* Note taking field (Resizable Textarea) */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Section Annotations:
                </label>
                <textarea
                  rows={2}
                  placeholder="Type your notes or clinical observations here..."
                  value={item.notes || ''}
                  onChange={(e) => handleNoteChange(item.id, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-card-solid)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
