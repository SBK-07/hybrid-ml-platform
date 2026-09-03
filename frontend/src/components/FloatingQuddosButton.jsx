import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';

/**
 * Floating Quick-Access button for Quddos AI.
 * Minimal, circular icon button in dark navy, positioned bottom-right.
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
        bottom: '24px',
        right: '24px',
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        background: '#101828',
        color: '#FFFFFF',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'background-color 0.15s ease',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#1E293B';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#101828';
      }}
      title="Open Quddos AI Research Assistant"
    >
      <Bot size={22} />
      {artifactCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          background: '#DC2626',
          color: '#FFFFFF',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.68rem',
          fontWeight: 700
        }}>
          {artifactCount}
        </span>
      )}
    </div>
  );
}
