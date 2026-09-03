import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Bot, FileText, Check } from 'lucide-react';

/**
 * Reusable three-dot (⋮) action menu component for all result cards, plots, and metrics.
 * Updated with clinical light theme tokens.
 */
export default function CardActionMenu({
  title,
  category = 'plot',
  data = {},
  metadata = {},
  imageUrl = null,
  onAdded = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [addedToQuddos, setAddedToQuddos] = useState(false);
  const [addedToReport, setAddedToReport] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddToQuddos = (e) => {
    e.stopPropagation();
    try {
      const existing = JSON.parse(localStorage.getItem('quddos_artifacts') || '[]');
      const newArtifact = {
        title,
        category,
        data,
        metadata,
        image_url: imageUrl,
        timestamp: new Date().toISOString()
      };

      const filtered = existing.filter(item => item.title !== title);
      filtered.push(newArtifact);

      localStorage.setItem('quddos_artifacts', JSON.stringify(filtered));
      setAddedToQuddos(true);
      setTimeout(() => setAddedToQuddos(false), 2000);
      setIsOpen(false);
      if (onAdded) onAdded('quddos', newArtifact);
    } catch (err) {
      console.error('Error adding to Quddos:', err);
    }
  };

  const handleAddToReport = (e) => {
    e.stopPropagation();
    try {
      const existing = JSON.parse(localStorage.getItem('report_items') || '[]');
      const newReportItem = {
        id: `rep_${Date.now()}`,
        title,
        type: category,
        content: JSON.stringify(data, null, 2),
        imageUrl: imageUrl,
        notes: '',
        timestamp: new Date().toISOString()
      };

      existing.push(newReportItem);
      localStorage.setItem('report_items', JSON.stringify(existing));
      setAddedToReport(true);
      setTimeout(() => setAddedToReport(false), 2000);
      setIsOpen(false);
      if (onAdded) onAdded('report', newReportItem);
    } catch (err) {
      console.error('Error adding to Report:', err);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        title="More options (Add to Quddos AI / Add to Report)"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: '4px',
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          zIndex: 1000,
          minWidth: '180px',
          overflow: 'hidden'
        }}>
          <button
            onClick={handleAddToQuddos}
            style={{
              width: '100%',
              padding: '10px 14px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: addedToQuddos ? 'var(--status-success)' : 'var(--text-primary)',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {addedToQuddos ? <Check size={16} color="var(--status-success)" /> : <Bot size={16} color="var(--classical-color)" />}
            {addedToQuddos ? 'Added to Quddos!' : 'Add to Quddos AI'}
          </button>

          <button
            onClick={handleAddToReport}
            style={{
              width: '100%',
              padding: '10px 14px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: addedToReport ? 'var(--status-success)' : 'var(--text-primary)',
              borderTop: '1px solid var(--border-color)',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {addedToReport ? <Check size={16} color="var(--status-success)" /> : <FileText size={16} color="var(--hybrid-color)" />}
            {addedToReport ? 'Added to Report!' : 'Add to Report'}
          </button>
        </div>
      )}
    </div>
  );
}
