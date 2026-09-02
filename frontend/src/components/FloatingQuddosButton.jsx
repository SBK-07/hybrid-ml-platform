import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, Sparkles } from 'lucide-react';

/**
 * Floating Quick-Access button for Quddos AI.
 * Appears across all pages, shows real-time badge count of attached artifacts,
 * and navigates directly to Page 5 (Quddos AI).
 */
export default function FloatingQuddosButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [artifactCount, setArtifactCount] = useState(0);

  // Don't render floating button when already on the Quddos page
  const isQuddosPage = location.pathname === '/quddos';

  const updateCount = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('quddos_artifacts') || '[]');
      setArtifactCount(stored.length);
    } catch (e) {
      setArtifactCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    // Periodically sync or listen to storage events
    const interval = setInterval(updateCount, 1500);
    window.addEventListener('storage', updateCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  if (isQuddosPage) return null;

  return (
    <div
      onClick={() => navigate('/quddos')}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '14px 22px',
        borderRadius: '30px',
        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.45)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 9999,
        fontWeight: 700,
        fontSize: '0.95rem',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        border: '2px solid rgba(255,255,255,0.3)',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.45)';
      }}
      title="Open Quddos AI Research Assistant"
    >
      <Bot size={22} />
      <span>Quddos AI</span>
      {artifactCount > 0 && (
        <span style={{
          background: '#ef4444',
          color: 'white',
          borderRadius: '12px',
          padding: '2px 8px',
          fontSize: '0.75rem',
          fontWeight: 800,
          marginLeft: '4px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          {artifactCount}
        </span>
      )}
      <Sparkles size={16} style={{ opacity: 0.8 }} />
    </div>
  );
}
