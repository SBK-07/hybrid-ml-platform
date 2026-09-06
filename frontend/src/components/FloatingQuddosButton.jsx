import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';

/**
 * Floating Quick-Access button for Quddos AI.
 * Premium circular button with glow animation, positioned bottom-right.
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
        bottom: '28px',
        right: '28px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--classical-color), #2563EB)',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px var(--classical-glow), 0 2px 6px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'all 0.25s ease',
        userSelect: 'none',
        animation: 'floatIn 0.4s ease-out'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 24px var(--classical-glow), 0 4px 10px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px var(--classical-glow), 0 2px 6px rgba(0, 0, 0, 0.15)';
      }}
      title="Open Quddos AI Research Assistant"
    >
      <Bot size={22} />
      {artifactCount > 0 && (
        <>
          {/* Pulsing ring */}
          <span style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: '50%',
            border: '2px solid var(--classical-color)',
            animation: 'ringPulse 1.5s ease-out infinite',
            pointerEvents: 'none'
          }} />
          {/* Badge */}
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.68rem',
            fontWeight: 700,
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
          }}>
            {artifactCount}
          </span>
        </>
      )}
    </div>
  );
}
