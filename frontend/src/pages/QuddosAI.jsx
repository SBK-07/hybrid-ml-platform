import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Trash2, FileText, Image, BarChart, Microscope, Bot, Sparkles,
  Settings, BookOpen, Volume2, VolumeX, Play, Pause, Shield, Cpu,
  RefreshCw, Key, ExternalLink, ChevronDown, ChevronUp, Check,
  AlertCircle, HelpCircle, Layers, Lightbulb, Radio, CheckSquare, Square
} from 'lucide-react';

const PRESET_SOURCES = [
  { id: 'wdbc_dataset', title: 'WDBC Breast Cancer Cohort (569 Cases, 30 Features)', category: 'Dataset', description: 'Wisconsin Diagnostic Breast Cancer dataset with 4-qubit PCA (79.2% variance).' },
  { id: 'heart_dataset', title: 'UCI Heart Disease Cohort (303 Cases, 13 Biomarkers)', category: 'Dataset', description: 'Angiographic heart disease dataset with hemodynamic features.' },
  { id: 'classical_benchmarks', title: 'Classical ML Benchmark Ledger (SVM & MLP: 97.4%)', category: 'Model', description: 'StandardScaler fitted strictly on training partition (0% leakage).' },
  { id: 'quantum_circuits', title: 'Quantum QML Topology (ZZFeatureMap 4Q Depth 19)', category: 'Circuit', description: '16-dim Hilbert space embedding with 22 gates and 6 CNOTs.' },
  { id: 'noise_telemetry', title: 'NISQ Depolarizing Noise Telemetry (p=0% to 5%)', category: 'Telemetry', description: 'Hardware fidelity degradation profile on IBM Heron/Eagle.' },
  { id: 'multimodal_fusion', title: 'Multimodal Fusion Engine (Late Adaptive Consensus: 98.8%)', category: 'Fusion', description: 'Early, intermediate, and late adaptive consensus with missing-modality compensation.' }
];

export default function QuddosAI() {
  // Messages & conversation
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### 🔬 Welcome to Quddos AI Research Assistant
I am your **360-Degree Context-Aware Research Assistant & NotebookLM Studio** for the Q-Med Hybrid Biomedical Intelligence Platform (SIH 2026 PS 139).

#### 💡 How to Conduct Deep Research:
1. **Studio Quick Actions**: Click any action button above (e.g. **📘 Study Guide**, **🎙️ Audio Overview**, **🩺 Clinical XAI Briefing**) to generate publication-grade syntheses.
2. **360° Source Grounding**: Select active platform sources in the left drawer or pin live experiment cards via the **⋮ menu**.
3. **Reasoning Models**: Powered by **Google Gemini 2.5 / Thinking**, **Groq DeepSeek-R1**, or our built-in **360° Grounded Core** with deep mathematical and clinical precision.

*What hypothesis or dataset would you like to investigate today?*`,
      timestamp: new Date().toLocaleTimeString(),
      metadata: { provider: 'Quddos 360° Grounded Core', model: 'qmed-grounded-reasoning-v2.5' }
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [studioLoading, setStudioLoading] = useState(null);

  // Context & Sources
  const [artifacts, setArtifacts] = useState([]);
  const [selectedPresetSourceIds, setSelectedPresetSourceIds] = useState(['wdbc_dataset', 'classical_benchmarks', 'quantum_circuits']);
  const [showSources, setShowSources] = useState(true);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    geminiKey: '',
    groqKey: ''
  });
  const [testConnStatus, setTestConnStatus] = useState(null);

  // Audio Podcast Player State
  const [activePodcastScript, setActivePodcastScript] = useState(null);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [podcastSpeakerIndex, setPodcastSpeakerIndex] = useState(0);

  // Chain-of-thought expand state
  const [expandedThoughts, setExpandedThoughts] = useState({});

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Load stored artifacts and AI config on mount
  useEffect(() => {
    const storedArtifacts = localStorage.getItem('quddos_artifacts');
    if (storedArtifacts) {
      try {
        setArtifacts(JSON.parse(storedArtifacts));
      } catch (e) {
        console.error('Failed to parse artifacts:', e);
      }
    }

    const storedConfig = localStorage.getItem('quddos_ai_config');
    if (storedConfig) {
      try {
        setAiConfig(prev => ({ ...prev, ...JSON.parse(storedConfig) }));
      } catch (e) {
        console.error('Failed to parse AI config:', e);
      }
    }
  }, []);

  const saveAiConfig = (newConfig) => {
    setAiConfig(newConfig);
    localStorage.setItem('quddos_ai_config', JSON.stringify(newConfig));
  };

  const getActiveApiKey = () => {
    if (aiConfig.provider === 'gemini') return aiConfig.geminiKey;
    if (aiConfig.provider === 'groq') return aiConfig.groqKey;
    return '';
  };

  const buildActivePayloadContext = () => {
    // Collect active preset sources
    const activePresets = PRESET_SOURCES.filter(s => selectedPresetSourceIds.includes(s.id)).map(s => ({
      title: s.title,
      category: s.category,
      metadata: { description: s.description }
    }));
    return [...activePresets, ...artifacts];
  };

  const handleSendMessage = async (customPrompt = null) => {
    const query = customPrompt || inputText;
    if (!query.trim()) return;

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setInputText('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const payloadContext = buildActivePayloadContext();
      const apiKey = getActiveApiKey();

      const response = await fetch('/api/quddos/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          artifacts: payloadContext,
          conversation_history: history,
          provider: aiConfig.provider,
          model: aiConfig.model,
          api_key: apiKey
        })
      });

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.reply || 'I encountered an issue generating a grounded response.',
        timestamp: new Date().toLocaleTimeString(),
        reasoning_trace: data.reasoning_trace,
        citations: data.citations || [],
        metadata: {
          provider: data.provider || 'Built-in Quddos Engine',
          model: data.model || aiConfig.model,
          artifacts_used: data.attached_artifacts_count || payloadContext.length,
          fallback_reason: data.fallback_reason
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'assistant',
        content: `### ⚠️ Connection Notice\nCould not reach the AI backend endpoint. Operating with offline grounded knowledge. Details: ${err.message}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudioAction = async (actionType, title) => {
    setStudioLoading(actionType);
    const userPrompt = `[Studio Action Triggered: ${title}]`;

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: `⚡ **Studio Action Requested**: *${title}*`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    try {
      const payloadContext = buildActivePayloadContext();
      const apiKey = getActiveApiKey();

      const response = await fetch('/api/quddos/studio-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType,
          artifacts: payloadContext,
          provider: aiConfig.provider,
          model: aiConfig.model,
          api_key: apiKey
        })
      });

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.reply || 'Failed to synthesize studio action document.',
        timestamp: new Date().toLocaleTimeString(),
        reasoning_trace: data.reasoning_trace,
        citations: data.citations || [],
        isStudioAction: true,
        actionType: actionType,
        metadata: {
          provider: data.provider || 'Built-in Quddos Studio Engine',
          model: data.model || aiConfig.model,
          artifacts_used: data.attached_artifacts_count || payloadContext.length
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If audio script was requested, prepare Web Speech Synthesis
      if (actionType === 'audio_script' || actionType === 'podcast') {
        parseAndPreparePodcast(data.reply);
      }
    } catch (err) {
      console.error('Studio action error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `### ⚠️ Studio Generation Notice\nUnable to generate ${title} due to: ${err.message}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setStudioLoading(null);
    }
  };

  const parseAndPreparePodcast = (scriptText) => {
    // Parse lines like **Dr. Elena Vance**: ... or **Prof. Marcus Chen**: ...
    const lines = scriptText.split('\n');
    const dialogue = [];
    let currentSpeaker = 'Dr. Elena Vance';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('**Dr. Elena Vance**') || trimmed.includes('Elena:')) {
        currentSpeaker = 'Dr. Elena Vance';
        const clean = trimmed.replace(/\*\*Dr\. Elena Vance\*\*:?/g, '').replace(/Elena:/g, '').trim();
        if (clean) dialogue.push({ speaker: 'Dr. Elena Vance', text: clean });
      } else if (trimmed.includes('**Prof. Marcus Chen**') || trimmed.includes('Marcus:')) {
        currentSpeaker = 'Prof. Marcus Chen';
        const clean = trimmed.replace(/\*\*Prof\. Marcus Chen\*\*:?/g, '').replace(/Marcus:/g, '').trim();
        if (clean) dialogue.push({ speaker: 'Prof. Marcus Chen', text: clean });
      } else if (trimmed.length > 20 && !trimmed.startsWith('#')) {
        dialogue.push({ speaker: currentSpeaker, text: trimmed });
      }
    }

    if (dialogue.length > 0) {
      setActivePodcastScript(dialogue);
    }
  };

  const togglePlayPodcast = () => {
    if (!('speechSynthesis' in window)) {
      alert('Web Speech API is not supported in this browser.');
      return;
    }

    if (isPlayingPodcast) {
      window.speechSynthesis.cancel();
      setIsPlayingPodcast(false);
      return;
    }

    if (!activePodcastScript || activePodcastScript.length === 0) return;

    setIsPlayingPodcast(true);
    playPodcastLine(0);
  };

  const playPodcastLine = (index) => {
    if (!activePodcastScript || index >= activePodcastScript.length) {
      setIsPlayingPodcast(false);
      setPodcastSpeakerIndex(0);
      return;
    }

    setPodcastSpeakerIndex(index);
    const item = activePodcastScript[index];
    const utterance = new SpeechSynthesisUtterance(item.text);

    // Adjust pitch/rate per speaker
    if (item.speaker.includes('Elena')) {
      utterance.pitch = 1.15;
      utterance.rate = 1.05;
    } else {
      utterance.pitch = 0.85;
      utterance.rate = 1.0;
    }

    utterance.onend = () => {
      playPodcastLine(index + 1);
    };

    utterance.onerror = () => {
      setIsPlayingPodcast(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTestConnection = async () => {
    setTestConnStatus({ testing: true, message: 'Testing connection to provider...' });
    try {
      const apiKey = getActiveApiKey();
      const res = await fetch('/api/quddos/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Ping test. Confirm connection status and model identification.',
          artifacts: [],
          conversation_history: [],
          provider: aiConfig.provider,
          model: aiConfig.model,
          api_key: apiKey
        })
      });
      const data = await res.json();
      if (data.fallback_reason) {
        setTestConnStatus({
          success: false,
          message: `⚠️ Notice: ${data.fallback_reason}`
        });
      } else if (data.status === 'SUCCESS') {
        setTestConnStatus({
          success: true,
          message: `✅ Live AI Connected! Provider: ${data.provider} (${data.model})`
        });
      } else {
        setTestConnStatus({
          success: false,
          message: data.fallback_reason || 'Connected via Grounded Fallback Engine.'
        });
      }
    } catch (err) {
      setTestConnStatus({ success: false, message: `Connection failed: ${err.message}` });
    }
  };

  const handleRemoveArtifact = (index) => {
    const updated = artifacts.filter((_, i) => i !== index);
    setArtifacts(updated);
    localStorage.setItem('quddos_artifacts', JSON.stringify(updated));
  };

  const handleTogglePresetSource = (sourceId) => {
    setSelectedPresetSourceIds(prev =>
      prev.includes(sourceId) ? prev.filter(id => id !== sourceId) : [...prev, sourceId]
    );
  };

  const toggleThought = (idx) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getProviderBadge = (provider, model) => {
    if (provider?.includes('Gemini') || aiConfig.provider === 'gemini') {
      return <span className="val-badge ready" style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD', fontWeight: 600 }}>✨ Google Gemini ({model || aiConfig.model})</span>;
    }
    if (provider?.includes('Groq') || aiConfig.provider === 'groq') {
      return <span className="val-badge ready" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', fontWeight: 600 }}>⚡ Groq DeepSeek-R1</span>;
    }
    return <span className="val-badge ready" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', fontWeight: 600 }}>🔬 360° Grounded Core</span>;
  };

  return (
    <div className="hub-section active" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* Top Header */}
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.45rem', margin: 0 }}>
              <Bot size={26} style={{ color: 'var(--classical-color)' }} />
              Quddos AI Research Studio
            </h1>
            <p className="subtitle" style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              NotebookLM-grade 360° Multimodal & Quantum Clinical Intelligence. Powered by SOTA reasoning models with citation grounding.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {getProviderBadge(aiConfig.provider, aiConfig.model)}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="btn btn-sm btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
              title="Configure Reasoning Model & Free API Keys"
            >
              <Settings size={15} /> Model & Keys
            </button>
            <button
              onClick={() => {
                if (window.confirm('Clear entire research conversation?')) {
                  setMessages([{
                    role: 'assistant',
                    content: 'Research workspace cleared. Ready for a fresh investigation.',
                    timestamp: new Date().toLocaleTimeString()
                  }]);
                  setActivePodcastScript(null);
                }
              }}
              className="btn btn-sm btn-outline-danger"
              style={{ padding: '6px 10px' }}
              title="Clear Session"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* NotebookLM Studio Quick Actions Toolbar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} style={{ color: 'var(--hybrid-color)' }} /> NotebookLM Studio Quick Synthesizers
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>One-click publication-grade research generation</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
          <button
            onClick={() => handleStudioAction('study_guide', 'Comprehensive Research Study Guide')}
            disabled={studioLoading !== null}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.8rem', background: '#FAFAFA' }}
          >
            <BookOpen size={15} style={{ color: '#2563EB' }} />
            <span>{studioLoading === 'study_guide' ? 'Synthesizing...' : '📘 Study Guide'}</span>
          </button>

          <button
            onClick={() => handleStudioAction('audio_script', '2-Expert Audio Overview / Podcast')}
            disabled={studioLoading !== null}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.8rem', background: '#FAFAFA' }}
          >
            <Volume2 size={15} style={{ color: '#059669' }} />
            <span>{studioLoading === 'audio_script' ? 'Scripting...' : '🎙️ Audio Overview'}</span>
          </button>

          <button
            onClick={() => handleStudioAction('clinical_briefing', 'Clinical XAI & Triage Briefing')}
            disabled={studioLoading !== null}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.8rem', background: '#FAFAFA' }}
          >
            <Microscope size={15} style={{ color: '#D97706' }} />
            <span>{studioLoading === 'clinical_briefing' ? 'Analyzing...' : '🩺 Clinical XAI Brief'}</span>
          </button>

          <button
            onClick={() => handleStudioAction('quantum_audit', 'Quantum Hardware & Noise Audit')}
            disabled={studioLoading !== null}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.8rem', background: '#FAFAFA' }}
          >
            <Cpu size={15} style={{ color: '#7C3AED' }} />
            <span>{studioLoading === 'quantum_audit' ? 'Auditing...' : '⚛️ Quantum Audit'}</span>
          </button>

          <button
            onClick={() => handleStudioAction('defense_faq', 'Research Defense & Viva FAQ')}
            disabled={studioLoading !== null}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.8rem', background: '#FAFAFA' }}
          >
            <Shield size={15} style={{ color: '#DC2626' }} />
            <span>{studioLoading === 'defense_faq' ? 'Formulating...' : '🛡️ Defense FAQ'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showSources ? '320px 1fr' : '1fr',
        gap: '16px',
        minHeight: '650px',
        height: 'calc(100vh - 270px)'
      }}>
        {/* Left Panel: 360-Degree Source Manager */}
        {showSources && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '14px', border: '1px solid var(--border-color)', margin: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} style={{ color: 'var(--classical-color)' }} /> 360° Source Corpus
              </span>
              <span className="val-badge ready" style={{ fontSize: '0.7rem' }}>
                {selectedPresetSourceIds.length + artifacts.length} Active
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Preset Grounded Sources */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Platform Knowledge Base
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {PRESET_SOURCES.map((source) => {
                    const isChecked = selectedPresetSourceIds.includes(source.id);
                    return (
                      <div
                        key={source.id}
                        onClick={() => handleTogglePresetSource(source.id)}
                        style={{
                          background: isChecked ? '#F0FDF4' : '#F8FAFC',
                          border: `1px solid ${isChecked ? '#BBF7D0' : 'var(--border-color)'}`,
                          borderRadius: '6px',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: isChecked ? '#16A34A' : '#94A3B8', marginTop: '1px' }}>
                            {isChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: isChecked ? '#15803D' : 'var(--text-primary)', lineHeight: '1.2' }}>
                              {source.title}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {source.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Attached Artifacts */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Pinned Telemetry ({artifacts.length})
                  </span>
                  {artifacts.length > 0 && (
                    <button
                      onClick={() => {
                        setArtifacts([]);
                        localStorage.removeItem('quddos_artifacts');
                      }}
                      style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {artifacts.length === 0 ? (
                  <div style={{ background: '#F8FAFC', border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '14px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <FileText size={22} style={{ margin: '0 auto 6px', opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No cards pinned yet.</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem' }}>Use <strong>⋮ → Add to Quddos AI</strong> on any plot or table.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {artifacts.map((art, idx) => (
                      <div key={idx} style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '0.78rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <BarChart size={13} style={{ color: 'var(--classical-color)' }} /> {art.title || `Artifact ${idx+1}`}
                          </span>
                          <button
                            onClick={() => handleRemoveArtifact(idx)}
                            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '2px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {art.image_url && (
                          <img src={art.image_url} alt={art.title} style={{ width: '100%', borderRadius: '4px', marginTop: '4px' }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Panel: Interactive Research Workspace */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', margin: 0 }}>
          {/* Header Bar */}
          <div style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-color)',
            background: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setShowSources(!showSources)}
                className="btn btn-sm btn-outline"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                title="Toggle Source Manager Drawer"
              >
                <Layers size={13} /> {showSources ? 'Hide Sources' : 'Show Sources'}
              </button>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Research Dialogue & Synthesis</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>Grounded in {selectedPresetSourceIds.length + artifacts.length} active sources</span>
              </div>
            </div>

            {activePodcastScript && (
              <button
                onClick={togglePlayPodcast}
                className="btn btn-sm"
                style={{
                  background: isPlayingPodcast ? '#DC2626' : '#059669',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem'
                }}
              >
                {isPlayingPodcast ? <Pause size={14} /> : <Play size={14} />}
                {isPlayingPodcast ? 'Pause Podcast' : 'Play Audio Overview (TTS)'}
              </button>
            )}
          </div>

          {/* Audio Overview Podcast Highlight Player Banner */}
          {activePodcastScript && (
            <div style={{
              background: '#ECFDF5',
              borderBottom: '1px solid #A7F3D0',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Radio size={18} style={{ color: '#059669', animation: isPlayingPodcast ? 'pulse 1.5s infinite' : 'none' }} />
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#065F46' }}>
                    🎙️ Active Audio Overview Podcast: "The Quantum Clinical Frontier"
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                    {isPlayingPodcast ? `Currently speaking: ${activePodcastScript[podcastSpeakerIndex]?.speaker}` : 'Click Play to listen with dual synthesized clinician & physicist voices.'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsPlayingPodcast(false);
                  setActivePodcastScript(null);
                }}
                style={{ background: 'none', border: 'none', color: '#047857', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                Close Player
              </button>
            </div>
          )}

          {/* Messages Window */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: '#F8FAFC'
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
                  maxWidth: msg.isStudioAction ? '92%' : '82%',
                  padding: '14px 18px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? 'var(--classical-color)' : '#FFFFFF',
                  color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                  border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.875rem',
                  lineHeight: '1.55',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  {/* Chain-of-Thought Reasoning Accordion for Assistant */}
                  {msg.role === 'assistant' && msg.reasoning_trace && (
                    <div style={{
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      overflow: 'hidden'
                    }}>
                      <div
                        onClick={() => toggleThought(idx)}
                        style={{
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#475569'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Lightbulb size={13} style={{ color: '#EAB308' }} />
                          🧠 Deep Chain-of-Thought Reasoning Trace
                        </span>
                        {expandedThoughts[idx] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>

                      {expandedThoughts[idx] && (
                        <div style={{
                          padding: '10px 12px',
                          borderTop: '1px solid #E2E8F0',
                          fontSize: '0.78rem',
                          color: '#334155',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          background: '#F8FAFC',
                          lineHeight: '1.4'
                        }}>
                          {msg.reasoning_trace}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Markdown Content */}
                  <div
                    dangerouslySetInnerHTML={{
                      __html: msg.role === 'assistant'
                        ? msg.content
                            .replace(/### (.+)/g, '<h4 style="margin: 12px 0 6px 0; color: var(--text-primary); font-size: 0.98rem; font-weight: 700; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">$1</h4>')
                            .replace(/#### (.+)/g, '<h5 style="margin: 10px 0 4px 0; color: #1E293B; font-size: 0.9rem; font-weight: 600;">$1</h5>')
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em>$1</em>')
                            .replace(/`([^`]+)`/g, '<code style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px; color: var(--classical-color); font-size: 0.85em; font-family: monospace;">$1</code>')
                            .replace(/\n- /g, '<br/>• ')
                            .replace(/\n\n/g, '<br/><br/>')
                        : msg.content
                    }}
                  />

                  {/* Citations & Source Badges */}
                  {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Grounded References:</span>
                      {msg.citations.map((c, cIdx) => (
                        <span key={cIdx} style={{
                          background: '#EFF6FF',
                          border: '1px solid #DBEAFE',
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: '#1D4ED8'
                        }}>
                          📌 {c.type}: {c.reference}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div style={{
                    fontSize: '0.7rem',
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'space-between',
                    alignItems: 'center'
                  }}>
                    {msg.metadata && (
                      <span style={{ color: '#64748B' }}>
                        {msg.metadata.provider} • {msg.metadata.model}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '12px 18px',
                  background: '#FFFFFF',
                  borderRadius: '12px 12px 12px 2px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}>
                  <RefreshCw size={16} className="spinner" style={{ color: 'var(--classical-color)' }} />
                  <span>Quddos AI is formulating researcher-grade synthesis...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Research Prompt Suggestions Bar */}
          <div style={{
            padding: '8px 16px',
            background: '#FFFFFF',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            <button
              onClick={() => handleSendMessage('Compare Classical SVM (97.4%) vs Quantum QSVM (85.1%) on Breast Cancer WDBC.')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '12px', background: '#F8FAFC' }}
            >
              💡 Compare SVM vs QSVM on Cancer
            </button>
            <button
              onClick={() => handleSendMessage('Explain 3D Bloch sphere projections and why Qubit 0 sensitivity matters for risk.')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '12px', background: '#F8FAFC' }}
            >
              🌐 3D Bloch Coordinates & XAI
            </button>
            <button
              onClick={() => handleSendMessage('Explain how depolarizing noise p=1% to 5% impacts NISQ circuit fidelity.')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '12px', background: '#F8FAFC' }}
            >
              ⚛️ NISQ Depolarizing Noise Curves
            </button>
            <button
              onClick={() => handleSendMessage('What is the difference between Epistemic vs Aleatoric clinical uncertainty?')}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '12px', background: '#F8FAFC' }}
            >
              ⚖️ Epistemic vs Aleatoric Uncertainty
            </button>
          </div>

          {/* Chat Input Box */}
          <div style={{
            padding: '12px 16px',
            background: '#FFFFFF',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask any research, circuit, or clinical question (e.g., 'Derive ZZFeatureMap statevector equation')..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
              className="btn btn-primary"
              style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={15} /> Send
            </button>
          </div>
        </div>
      </div>

      {/* AI Model & Free API Key Configuration Modal */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '580px',
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            margin: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} style={{ color: 'var(--classical-color)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Quddos AI Reasoning Model & Free API Keys</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Provider Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Reasoning AI Provider:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setAiConfig(prev => ({ ...prev, provider: 'gemini', model: 'gemini-3.6-flash' }))}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: `2px solid ${aiConfig.provider === 'gemini' ? 'var(--classical-color)' : 'var(--border-color)'}`,
                      background: aiConfig.provider === 'gemini' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1D4ED8' }}>✨ Google Gemini</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>1M Ctx • 100% Free</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiConfig(prev => ({ ...prev, provider: 'groq', model: 'qwen/qwen3.8-27b' }))}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: `2px solid ${aiConfig.provider === 'groq' ? 'var(--classical-color)' : 'var(--border-color)'}`,
                      background: aiConfig.provider === 'groq' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#B45309' }}>⚡ Groq Cloud</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Ultra-Fast • 300 t/s</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiConfig(prev => ({ ...prev, provider: 'builtin', model: 'qmed-grounded-reasoning-v2.5' }))}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: `2px solid ${aiConfig.provider === 'builtin' ? 'var(--classical-color)' : 'var(--border-color)'}`,
                      background: aiConfig.provider === 'builtin' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#475569' }}>🔬 360° Grounded</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Zero Setup • Offline</div>
                  </button>
                </div>
              </div>

              {/* Model Choice */}
              {aiConfig.provider === 'gemini' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Google Gemini Model:
                  </label>
                  <select
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recommended - Ultra-Fast & Grounded)</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (High Speed Multimodal)</option>
                    <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Elite Deep Research)</option>
                  </select>
                </div>
              )}

              {aiConfig.provider === 'groq' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Groq Model:
                  </label>
                  <select
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="qwen/qwen3.8-27b">Qwen 3.8 27B (Recommended - Deep Multimodal & Reasoning)</option>
                    <option value="openai/gpt-oss-120b">OpenAI GPT-OSS 120B (Flagship Deep Reasoning)</option>
                    <option value="openai/gpt-oss-20b">OpenAI GPT-OSS 20B (High-Speed Reasoning)</option>
                    <option value="groq/compound">Groq Compound Architecture</option>
                  </select>
                </div>
              )}

              {/* API Key Input Section */}
              {aiConfig.provider === 'gemini' && (
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Google AI Studio API Key:</label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                    >
                      Get 100% Free Key <ExternalLink size={12} />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={aiConfig.geminiKey}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, geminiKey: e.target.value }))}
                    placeholder="AIzaSy..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    No credit card required. Free tier includes 15 RPM, 1M TPM, 1,500 RPD.
                  </div>
                </div>
              )}

              {aiConfig.provider === 'groq' && (
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Groq Cloud API Key:</label>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: '#B45309', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                    >
                      Get 100% Free Key <ExternalLink size={12} />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={aiConfig.groqKey}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, groqKey: e.target.value }))}
                    placeholder="gsk_..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Instant key generation with 30 RPM and 14,400 RPD free tier.
                  </div>
                </div>
              )}

              {/* Test Status */}
              {testConnStatus && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: testConnStatus.success ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${testConnStatus.success ? '#BBF7D0' : '#FECACA'}`,
                  color: testConnStatus.success ? '#15803D' : '#B91C1C',
                  fontSize: '0.78rem'
                }}>
                  {testConnStatus.message}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.8rem' }}
                >
                  Test Connection
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      saveAiConfig(aiConfig);
                      setShowSettingsModal(false);
                    }}
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
