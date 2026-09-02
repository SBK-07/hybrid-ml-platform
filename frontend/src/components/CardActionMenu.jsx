import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Bot, FileText, Check } from 'lucide-react';

/**
 * Reusable three-dot (⋮) action menu component for all result cards, plots, and metrics.
 * Provides two critical platform actions:
 *   1. "Add to Quddos AI" -> Saves artifact with data + visuals to Quddos AI context.
 *   2. "Add to Report" -> Saves artifact to Adaptive Report builder (Page 4).
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

      // Avoid exact duplicates by title
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
          color: '#718096',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#edf2f7'; e.currentTarget.style.color = '#2d3748'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#718096'; }}
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
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
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
              fontWeight: 600,
              color: addedToQuddos ? '#10b981' : '#4a5568',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {addedToQuddos ? <Check size={16} color="#10b981" /> : <Bot size={16} color="#667eea" />}
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
              fontWeight: 600,
              color: addedToReport ? '#10b981' : '#4a5568',
              borderTop: '1px solid #edf2f7',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {addedToReport ? <Check size={16} color="#10b981" /> : <FileText size={16} color="#f59e0b" />}
            {addedToReport ? 'Added to Report!' : 'Add to Report'}
          </button>
        </div>
      )}
    </div>
  );
}
