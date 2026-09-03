import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, FileText, Image, BarChart, Microscope, Bot, Sparkles } from 'lucide-react';

export default function QuddosAI() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### Welcome to Quddos AI Assistant

I am your **context-aware quantum-classical ML research assistant** embedded in the Q-Med Platform.

**How to use effectively**:
1. Navigate to any experiment page (Individual, Cumulative, or Live Inference).
2. Click the **three-dot (⋮) menu** on plots, metrics, or results and select **"Add to Quddos AI"**.
3. Return here and ask me to interpret ROC curves, explain quantum circuit depths, compare classical vs quantum performance, or analyze patient risk predictions.

*What would you like to explore today?*`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const storedArtifacts = localStorage.getItem('quddos_artifacts');
    if (storedArtifacts) {
      try {
        const parsed = JSON.parse(storedArtifacts);
        setArtifacts(parsed);
      } catch (e) {
        console.error('Failed to parse stored artifacts:', e);
      }
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/quddos/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: inputText,
          artifacts: artifacts,
          conversation_history: history
        })
      });

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.reply || 'I encountered an issue processing your request.',
        timestamp: new Date().toLocaleTimeString(),
        metadata: {
          provider: data.provider,
          model: data.model,
          artifacts_used: data.attached_artifacts_count
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'assistant',
        content: 'Connection error. Please verify backend server on http://127.0.0.1:8000 and try again.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRemoveArtifact = (index) => {
    const updated = artifacts.filter((_, i) => i !== index);
    setArtifacts(updated);
    localStorage.setItem('quddos_artifacts', JSON.stringify(updated));
  };

  const handleClearChat = () => {
    if (window.confirm('Clear entire conversation history?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Chat cleared. Ready for a fresh research session.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  const handleClearArtifacts = () => {
    if (window.confirm('Remove all attached artifacts from context?')) {
      setArtifacts([]);
      localStorage.removeItem('quddos_artifacts');
    }
  };

  const getArtifactIcon = (category) => {
    switch (category) {
      case 'plot': return <Image size={15} />;
      case 'metrics': return <BarChart size={15} />;
      case 'model': return <Microscope size={15} />;
      default: return <FileText size={15} />;
    }
  };

  return (
    <div className="hub-section active">
      <div className="section-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={24} style={{ color: 'var(--classical-color)' }} />
            Quddos AI Assistant
          </h1>
          <p className="subtitle">
            Ground-truth diagnostic & research AI. Attach telemetry artifacts, plots, and patient profiles to perform context-aware research synthesis.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showArtifacts ? '300px 1fr' : '1fr', gap: '20px', minHeight: '600px', height: 'calc(100vh - 220px)' }}>
        {/* Left Panel: Context Drawer */}
        {showArtifacts && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: 'var(--classical-color)' }} /> Active Context
              </span>
              <span className="val-badge ready" style={{ fontSize: '0.7rem' }}>
                {artifacts.length} item{artifacts.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {artifacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <FileText size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p>No telemetry artifacts attached yet.</p>
                  <p style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Use the <strong>⋮ menu</strong> on experiment cards to attach context.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {artifacts.map((artifact, idx) => (
                    <div key={idx} style={{
                      background: '#F8FAFC',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '10px',
                      fontSize: '0.82rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--classical-color)' }}>
                          {getArtifactIcon(artifact.category)}
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{artifact.title || `Artifact ${idx + 1}`}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveArtifact(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: '2px' }}
                          title="Remove artifact"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {artifact.image_url && (
                        <img
                          src={artifact.image_url}
                          alt={artifact.title}
                          style={{ width: '100%', borderRadius: '4px', marginTop: '6px' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleClearArtifacts}
              disabled={artifacts.length === 0}
              className="btn btn-sm btn-outline-danger full-width-btn"
              style={{ marginTop: '12px' }}
            >
              <Trash2 size={14} /> Clear Context
            </button>
          </div>
        )}

        {/* Right Panel: Chat Interface */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: '#FFFFFF',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={20} style={{ color: 'var(--classical-color)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>Quddos AI Intelligence</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scientific Multimodal Grounding</span>
              </div>
            </div>
            <button onClick={handleClearChat} className="btn btn-sm btn-outline-danger">
              <Trash2 size={14} /> Clear Chat
            </button>
          </div>

          {/* Messages Window */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: '#F7F8FA'
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user'
                    ? 'var(--classical-color)'
                    : '#FFFFFF',
                  color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                  border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: msg.role === 'assistant'
                        ? msg.content
                            .replace(/### (.+)/g, '<h4 style="margin: 8px 0 6px 0; color: var(--text-primary); font-size: 0.95rem; font-weight: 600;">$1</h4>')
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em>$1</em>')
                            .replace(/`(.+?)`/g, '<code style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px; color: var(--classical-color); font-size: 0.85em;">$1</code>')
                            .replace(/\n- /g, '<br/>• ')
                            .replace(/\n\n/g, '<br/><br/>')
                        : msg.content
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', marginTop: '6px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div className="card" style={{ padding: '12px 16px', color: 'var(--classical-color)', fontSize: '0.85rem', fontStyle: 'italic', background: '#FFFFFF' }}>
                  Quddos AI is evaluating context artifacts & generating grounded answer...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div style={{ padding: '14px', borderTop: '1px solid var(--border-color)', background: '#FFFFFF', display: 'flex', gap: '10px' }}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Quddos AI about ROC curves, quantum kernel mechanics, patient risk levels, or circuit depth..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'none',
                height: '50px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputText.trim()}
              className="btn btn-primary"
              style={{ padding: '0 18px', height: '50px' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
