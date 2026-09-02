import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, FileText, Image, BarChart, Microscope, ChevronRight } from 'lucide-react';

export default function QuddosAI() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### 🤖 Welcome to Quddos AI

I am your **context-aware quantum-classical ML research assistant** embedded in the Q-Med Platform.

**How to use me effectively**:
1. Navigate to any experiment page (Individual, Cumulative, or Live Inference).
2. Click the **three-dot (⋮) menu** on plots, metrics, or results and select **"Add to Quddos AI"**.
3. Return here and ask me to interpret ROC curves, explain quantum circuit depths, compare classical vs quantum performance, or analyze patient risk predictions.

**I operate with strict scientific grounding**: I analyze your *actual* experiment results and will never fabricate metrics or claim unjustified quantum advantage.

*What would you like to explore today?*`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load artifacts from localStorage on mount
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
      // Build conversation history (last 6 messages for context)
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
        content: '⚠️ I encountered a connection error. Please check your backend server and try again.',
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
    if (window.confirm('Clear entire conversation history? This cannot be undone.')) {
      setMessages([
        {
          role: 'assistant',
          content: '🔄 **Chat cleared.** Ready for a fresh research session!',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  const handleClearArtifacts = () => {
    if (window.confirm('Remove all attached artifacts from context? You can re-add them from experiment pages.')) {
      setArtifacts([]);
      localStorage.removeItem('quddos_artifacts');
    }
  };

  const getArtifactIcon = (category) => {
    switch (category) {
      case 'plot': return <Image size={16} />;
      case 'metrics': return <BarChart size={16} />;
      case 'model': return <Microscope size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="section" style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 300px)', minHeight: '600px' }}>
      {/* Left Panel: Artifact Context Drawer */}
      <div style={{
        width: showArtifacts ? '320px' : '0',
        minWidth: showArtifacts ? '320px' : '0',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        overflow: 'hidden',
        transition: 'all 0.3s',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {showArtifacts && (
          <>
            <div style={{
              padding: '15px',
              borderBottom: '2px solid #e2e8f0',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>📎 Active Context</div>
              <div style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.25)', padding: '3px 8px', borderRadius: '10px' }}>
                {artifacts.length} item{artifacts.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {artifacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <FileText size={40} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
                  <p>No artifacts attached yet.</p>
                  <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                    Navigate to experiment pages and use the <strong>⋮ menu</strong> to add plots, metrics, or results.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {artifacts.map((artifact, idx) => (
                    <div key={idx} style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '0.85rem',
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ color: '#667eea', marginTop: '2px' }}>
                          {getArtifactIcon(artifact.category)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.9rem', lineHeight: '1.3' }}>
                            {artifact.title || `Artifact ${idx + 1}`}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '3px' }}>
                            {artifact.category || 'General'} · {artifact.metadata?.model_type || 'N/A'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveArtifact(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#cbd5e0',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.target.style.color = '#ef4444'; e.target.style.background = '#fee2e2'; }}
                          onMouseLeave={(e) => { e.target.style.color = '#cbd5e0'; e.target.style.background = 'none'; }}
                          title="Remove from context"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {artifact.image_url && (
                        <img
                          src={artifact.image_url}
                          alt={artifact.title}
                          style={{ width: '100%', borderRadius: '6px', marginTop: '8px', border: '1px solid #e2e8f0' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={handleClearArtifacts}
                disabled={artifacts.length === 0}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: artifacts.length === 0 ? '#f1f5f9' : '#fee2e2',
                  color: artifacts.length === 0 ? '#cbd5e0' : '#991b1b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: artifacts.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={14} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
                Clear All Artifacts
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right Panel: Chat Interface */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', border: '2px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '2px solid #e2e8f0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>🤖 Quddos AI</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>Context-Aware Multimodal Research Assistant</p>
          </div>
          <button
            onClick={handleClearChat}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={16} />
            Clear Chat
          </button>
        </div>

        {/* Messages Container */}
        <div
          ref={chatContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            background: '#fafafa'
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'white',
                color: msg.role === 'user' ? 'white' : '#2d3748',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none'
              }}>
                <div
                  style={{ lineHeight: '1.6', fontSize: '0.95rem' }}
                  dangerouslySetInnerHTML={{
                    __html: msg.role === 'assistant'
                      ? msg.content
                          .replace(/### (.+)/g, '<h3 style="margin: 10px 0 8px 0; color: #667eea; font-size: 1.1rem;">$1</h3>')
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>')
                          .replace(/`(.+?)`/g, '<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em;">$1</code>')
                          .replace(/\n- /g, '<br/>• ')
                          .replace(/\n\n/g, '<br/><br/>')
                      : msg.content
                  }}
                />
                <div style={{
                  fontSize: '0.75rem',
                  opacity: 0.7,
                  marginTop: '8px',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}>
                  {msg.timestamp}
                  {msg.metadata?.provider && (
                    <span style={{ marginLeft: '8px', fontSize: '0.7rem', opacity: 0.8 }}>
                      · {msg.metadata.provider}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                background: 'white',
                border: '1px solid #e2e8f0',
                color: '#667eea',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}>
                Quddos AI is analyzing your artifacts and generating response...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div style={{
          padding: '15px 20px',
          borderTop: '2px solid #e2e8f0',
          background: 'white',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about ROC curves, quantum circuits, patient risk predictions, or comparative model performance..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: '2px solid #e2e8f0',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              resize: 'none',
              minHeight: '60px',
              maxHeight: '120px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputText.trim()}
            style={{
              padding: '12px 20px',
              background: loading || !inputText.trim()
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: loading || !inputText.trim() ? '#cbd5e0' : 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              minHeight: '60px'
            }}
          >
            <Send size={18} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
