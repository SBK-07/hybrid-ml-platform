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
I am your **360-Degree Context-Aware Research Assistant & NotebookLM Studio** for the Quddos Hybrid Biomedical Intelligence Platform (SIH 2026 PS 139).

#### 💡 How to Conduct Deep Research:
1. **Studio Quick Actions**: Click any action button above (e.g. **📘 Study Guide**, **🎙️ Audio Overview**, **🩺 Clinical XAI Briefing**) to generate publication-grade syntheses.
2. **360° Source Grounding**: Select active platform sources in the left drawer or pin live experiment cards via the **⋮ menu**.
3. **Reasoning Models**: Powered by **Google Gemini 2.5 / Thinking**, **Groq DeepSeek-R1**, or our built-in **360° Grounded Core** with deep mathematical and clinical precision.

*What hypothesis or dataset would you like to investigate today?*`,
      timestamp: new Date().toLocaleTimeString(),
      metadata: { provider: 'Quddos 360° Grounded Core', model: 'quddos-grounded-reasoning-v2.5' }
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
      return <span style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px', background: 'var(--brand-bg)', color: 'var(--brand-primary)', border: '1px solid var(--brand-glow)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>✨ Google Gemini ({model || aiConfig.model})</span>;
    }
    if (provider?.includes('Groq') || aiConfig.provider === 'groq') {
      return <span style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.25)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>⚡ Groq DeepSeek-R1</span>;
    }
    return <span style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-inset)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>🔬 360° Grounded Core</span>;
  };

  return (
    <div className="hub-section active" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              <Bot size={26} style={{ color: 'var(--classical-color)' }} />
              Quddos AI Research Studio
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '800px', lineHeight: '1.6' }}>
              NotebookLM-grade 360° Multimodal & Quantum Clinical Intelligence. Powered by SOTA reasoning models with citation grounding.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {getProviderBadge(aiConfig.provider, aiConfig.model)}
            <button
              onClick={() => setShowSettingsModal(true)}
              style={{
                height: '40px', padding: '0 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', background: 'transparent',
                color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
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
              style={{
                height: '40px', padding: '0 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(220, 38, 38, 0.2)', background: 'transparent',
                color: 'var(--status-danger)', fontSize: '0.82rem', fontWeight: '600',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--status-danger-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              title="Clear Session"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* NotebookLM Studio Quick Actions Toolbar */}
      <div style={{
        background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
        borderRadius: 'var(--radius-lg)', padding: '24px',
        border: '1px solid var(--border-color)', marginBottom: '24px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} style={{ color: 'var(--hybrid-color)' }} /> NotebookLM Studio Quick Synthesizers
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>One-click publication-grade research generation</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { action: 'study_guide', title: '📘 Study Guide', icon: BookOpen, color: 'var(--brand-primary)' },
            { action: 'audio_script', title: '🎙️ Audio Overview', icon: Volume2, color: '#059669' },
            { action: 'clinical_briefing', title: '🩺 Clinical XAI Brief', icon: Microscope, color: '#D97706' },
            { action: 'quantum_audit', title: '⚛️ Quantum Audit', icon: Cpu, color: '#7C3AED' },
            { action: 'defense_faq', title: '🛡️ Defense FAQ', icon: Shield, color: '#DC2626' }
          ].map(({ action, title, icon: Icon, color }) => (
            <button
              key={action}
              onClick={() => handleStudioAction(action, title)}
              disabled={studioLoading !== null}
              style={{
                height: '44px', padding: '0 16px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', background: 'var(--bg-inset)',
                color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600',
                cursor: studioLoading !== null ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { if (studioLoading === null) { e.currentTarget.style.background = 'var(--bg-card-solid)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
              onMouseLeave={(e) => { if (studioLoading === null) { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >
              <Icon size={15} style={{ color: studioLoading === action ? color : 'var(--text-tertiary)', transition: 'color 0.2s ease' }} />
              <span>{studioLoading === action ? 'Synthesizing...' : title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showSources ? '320px 1fr' : '1fr',
        gap: '24px',
        minHeight: '650px'
      }}>
        
        {/* Left Panel: 360-Degree Source Manager */}
        {showSources && (
          <div style={{
            background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-lg)', padding: '24px',
            border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} style={{ color: 'var(--classical-color)' }} /> 360° Source Corpus
              </span>
              <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--status-success-bg)', color: 'var(--status-success)', border: '1px solid rgba(22, 163, 74, 0.25)', fontWeight: '600' }}>
                {selectedPresetSourceIds.length + artifacts.length} Active
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Preset Grounded Sources */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  Platform Knowledge Base
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PRESET_SOURCES.map((source) => {
                    const isChecked = selectedPresetSourceIds.includes(source.id);
                    return (
                      <div
                        key={source.id}
                        onClick={() => handleTogglePresetSource(source.id)}
                        style={{
                          background: isChecked ? 'var(--classical-bg)' : 'var(--bg-inset)',
                          border: `1px solid ${isChecked ? 'var(--classical-glow)' : 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '12px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = 'var(--bg-card-solid)'; }}
                        onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = 'var(--bg-inset)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span style={{ color: isChecked ? 'var(--classical-color)' : 'var(--text-tertiary)', marginTop: '2px', transition: 'color 0.2s ease' }}>
                            {isChecked ? <CheckSquare size={15} /> : <Square size={15} />}
                          </span>
                          <div>
                            <div style={{ fontWeight: '600', color: isChecked ? 'var(--classical-color)' : 'var(--text-primary)', lineHeight: '1.3', transition: 'color 0.2s ease' }}>
                              {source.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Pinned Telemetry ({artifacts.length})
                  </span>
                  {artifacts.length > 0 && (
                    <button
                      onClick={() => {
                        setArtifacts([]);
                        localStorage.removeItem('quddos_artifacts');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--status-danger)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {artifacts.length === 0 ? (
                  <div style={{ background: 'var(--bg-inset)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <FileText size={24} style={{ margin: '0 auto 8px', opacity: 0.4, color: 'var(--text-tertiary)' }} />
                    <p style={{ margin: 0, fontWeight: '500' }}>No cards pinned yet.</p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Use <strong>⋮ → Add to Quddos AI</strong> on any plot or table.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {artifacts.map((art, idx) => (
                      <div key={idx} style={{
                        background: 'var(--bg-card-solid)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                        fontSize: '0.82rem',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <BarChart size={14} style={{ color: 'var(--classical-color)' }} /> {art.title || `Artifact ${idx+1}`}
                          </span>
                          <button
                            onClick={() => handleRemoveArtifact(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--status-danger)'; e.currentTarget.style.background = 'var(--status-danger-bg)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'none'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {art.image_url && (
                          <img src={art.image_url} alt={art.title} style={{ width: '100%', borderRadius: '6px', marginTop: '8px', border: '1px solid var(--border-color)' }} />
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
        <div style={{
          background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Header Bar */}
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-inset)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setShowSources(!showSources)}
                style={{
                  height: '36px', padding: '0 12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', background: 'var(--bg-card-solid)',
                  color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card-solid)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                title="Toggle Source Manager Drawer"
              >
                <Layers size={14} /> {showSources ? 'Hide Sources' : 'Show Sources'}
              </button>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>Research Dialogue & Synthesis</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>Grounded in {selectedPresetSourceIds.length + artifacts.length} active sources</span>
              </div>
            </div>

            {activePodcastScript && (
              <button
                onClick={togglePlayPodcast}
                style={{
                  height: '36px', padding: '0 14px', borderRadius: 'var(--radius-md)', border: 'none',
                  background: isPlayingPodcast ? 'var(--status-danger)' : 'var(--status-success)',
                  color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                  boxShadow: isPlayingPodcast ? '0 2px 8px rgba(220, 38, 38, 0.25)' : '0 2px 8px rgba(22, 163, 74, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isPlayingPodcast ? <Pause size={14} /> : <Play size={14} fill="#fff" />}
                {isPlayingPodcast ? 'Pause Podcast' : 'Play Audio Overview'}
              </button>
            )}
          </div>

          {/* Audio Overview Podcast Highlight Player Banner */}
          {activePodcastScript && (
            <div style={{
              background: 'var(--status-success-bg)', borderBottom: '1px solid rgba(22, 163, 74, 0.25)',
              padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Radio size={18} style={{ color: 'var(--status-success)', animation: isPlayingPodcast ? 'pulse 1.5s infinite' : 'none' }} />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--status-success)' }}>
                    🎙️ Active Audio Overview Podcast: "The Quantum Clinical Frontier"
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
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
                style={{ background: 'none', border: 'none', color: 'var(--status-success)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                Close Player
              </button>
            </div>
          )}

          {/* Messages Window */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '20px',
            background: 'var(--bg-card)'
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
                  padding: '18px 22px',
                  borderRadius: msg.role === 'user' ? 'var(--radius-lg) 12px 12px 12px' : '12px var(--radius-lg) 12px 12px',
                  background: msg.role === 'user' ? 'var(--brand-primary)' : 'var(--bg-card-solid)',
                  color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                  border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.9rem',
                  lineHeight: '1.65',
                  boxShadow: msg.role === 'user' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'var(--shadow-card)'
                }}>
                  {/* Chain-of-Thought Reasoning Accordion for Assistant */}
                  {msg.role === 'assistant' && msg.reasoning_trace && (
                    <div style={{
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '14px',
                      overflow: 'hidden'
                    }}>
                      <div
                        onClick={() => toggleThought(idx)}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          color: 'var(--text-secondary)',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-solid)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Lightbulb size={14} style={{ color: '#EAB308' }} />
                          🧠 Deep Chain-of-Thought Reasoning Trace
                        </span>
                        {expandedThoughts[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>

                      {expandedThoughts[idx] && (
                        <div style={{
                          padding: '14px',
                          borderTop: '1px solid var(--border-color)',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          fontFamily: 'Consolas, Monaco, monospace',
                          whiteSpace: 'pre-wrap',
                          background: 'var(--bg-card)',
                          lineHeight: '1.5'
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
                            .replace(/### (.+)/g, '<h4 style="margin: 14px 0 8px 0; color: var(--text-primary); font-size: 1rem; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">$1</h4>')
                            .replace(/#### (.+)/g, '<h5 style="margin: 12px 0 6px 0; color: var(--text-primary); font-size: 0.92rem; font-weight: 600;">$1</h5>')
                            .replace(/\*\*(.+?)\*\*/g, '<strong style="color: inherit;">$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em>$1</em>')
                            .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; color: var(--classical-color); font-size: 0.85em; font-family: Consolas, monospace;">$1</code>')
                            .replace(/\n- /g, '<br/>• ')
                            .replace(/\n\n/g, '<br/><br/>')
                        : msg.content
                    }}
                  />

                  {/* Citations & Source Badges */}
                  {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.2)' : 'var(--border-color)'}`, display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '600', color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)' }}>Grounded References:</span>
                      {msg.citations.map((c, cIdx) => (
                        <span key={cIdx} style={{
                          background: msg.role === 'user' ? 'rgba(255,255,255,0.15)' : 'var(--brand-bg)',
                          border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.2)' : 'var(--brand-glow)'}`,
                          borderRadius: '12px',
                          padding: '3px 10px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          color: msg.role === 'user' ? '#FFFFFF' : 'var(--brand-primary)'
                        }}>
                          📌 {c.type}: {c.reference}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div style={{
                    fontSize: '0.72rem',
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)',
                    marginTop: '12px',
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {msg.metadata && (
                      <span>
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
                  padding: '14px 20px', borderRadius: '12px var(--radius-lg) 12px 12px',
                  background: 'var(--bg-card-solid)', border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic',
                  display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-card)'
                }}>
                  <RefreshCw size={16} className="spinning" style={{ color: 'var(--brand-primary)' }} />
                  Quddos AI is evaluating context artifacts & generating grounded answer...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div style={{
            padding: '20px 24px', borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-inset)', display: 'flex', gap: '12px', alignItems: 'flex-end'
          }}>
            <textarea
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
                flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
                resize: 'none', transition: 'all 0.2s ease', minHeight: '48px', maxHeight: '120px',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-glow)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputText.trim()}
              style={{
                height: '48px', padding: '0 24px', borderRadius: 'var(--radius-md)', border: 'none',
                background: loading || !inputText.trim() ? 'var(--brand-hover)' : 'var(--brand-primary)',
                color: '#fff', fontSize: '0.9rem', fontWeight: '600', cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { if (!loading && inputText.trim()) e.currentTarget.style.background = 'var(--brand-hover)'; }}
              onMouseLeave={(e) => { if (!loading && inputText.trim()) e.currentTarget.style.background = 'var(--brand-primary)'; }}
            >
              <Send size={16} fill="#fff" /> Send
            </button>
          </div>
        </div>
      </div>

      {/* AI Model & Free API Key Configuration Modal */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '24px'
        }}>
          <div style={{
            width: '100%', maxWidth: '600px', background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)', borderRadius: 'var(--radius-lg)',
            padding: '28px', border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-card)', animation: 'stageFadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Key size={20} style={{ color: 'var(--classical-color)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>Quddos AI Reasoning Model & Free API Keys</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-inset)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'none'; }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Provider Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Reasoning AI Provider
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[
                    { id: 'gemini', label: '✨ Google Gemini', sub: '1M Ctx • 100% Free', color: 'var(--brand-primary)', bg: 'var(--brand-bg)' },
                    { id: 'groq', label: '⚡ Groq Cloud', sub: 'Ultra-Fast • 300 t/s', color: '#B45309', bg: 'rgba(245, 158, 11, 0.12)' },
                    { id: 'builtin', label: '🔬 360° Grounded', sub: 'Zero Setup • Offline', color: 'var(--text-secondary)', bg: 'var(--bg-inset)' }
                  ].map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setAiConfig(prev => ({ ...prev, provider: provider.id, model: provider.id === 'gemini' ? 'gemini-3.6-flash' : provider.id === 'groq' ? 'qwen/qwen3.8-27b' : 'quddos-grounded-reasoning-v2.5' }))}
                      style={{
                        padding: '16px 12px', borderRadius: 'var(--radius-md)',
                        border: aiConfig.provider === provider.id ? `2px solid ${provider.color}` : '1px solid var(--border-color)',
                        background: aiConfig.provider === provider.id ? provider.bg : 'var(--bg-inset)',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { if (aiConfig.provider !== provider.id) e.currentTarget.style.background = 'var(--bg-card-solid)'; }}
                      onMouseLeave={(e) => { if (aiConfig.provider !== provider.id) e.currentTarget.style.background = 'var(--bg-inset)'; }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '0.85rem', color: provider.color, marginBottom: '4px' }}>{provider.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{provider.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Choice */}
              {aiConfig.provider === 'gemini' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Google Gemini Model
                  </label>
                  <select
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
                      transition: 'all 0.2s ease', cursor: 'pointer'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-glow)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
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
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Groq Model
                  </label>
                  <select
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
                      transition: 'all 0.2s ease', cursor: 'pointer'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.2)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
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
                <div style={{ background: 'var(--bg-inset)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)' }}>Google AI Studio API Key:</label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '600' }}
                    >
                      Get 100% Free Key <ExternalLink size={12} />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={aiConfig.geminiKey}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, geminiKey: e.target.value }))}
                    placeholder="AIzaSy..."
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
                      transition: 'all 0.2s ease', boxSizing: 'border-box'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-glow)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    No credit card required. Free tier includes 15 RPM, 1M TPM, 1,500 RPD.
                  </div>
                </div>
              )}

              {aiConfig.provider === 'groq' && (
                <div style={{ background: 'var(--bg-inset)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)' }}>Groq Cloud API Key:</label>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: '#B45309', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '600' }}
                    >
                      Get 100% Free Key <ExternalLink size={12} />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={aiConfig.groqKey}
                    onChange={(e) => setAiConfig(prev => ({ ...prev, groqKey: e.target.value }))}
                    placeholder="gsk_..."
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)', background: 'var(--bg-input)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
                      transition: 'all 0.2s ease', boxSizing: 'border-box'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.2)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Instant key generation with 30 RPM and 14,400 RPD free tier.
                  </div>
                </div>
              )}

              {/* Test Status */}
              {testConnStatus && (
                <div style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: testConnStatus.success ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                  border: `1px solid ${testConnStatus.success ? 'rgba(22, 163, 74, 0.25)' : 'rgba(220, 38, 38, 0.25)'}`,
                  color: testConnStatus.success ? 'var(--status-success)' : 'var(--status-danger)',
                  fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  {testConnStatus.success ? <Check size={16} /> : <AlertCircle size={16} />}
                  {testConnStatus.message}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  style={{
                    height: '40px', padding: '0 16px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)', background: 'var(--bg-inset)',
                    color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-solid)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <RefreshCw size={15} /> Test Connection
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    style={{
                      height: '40px', padding: '0 18px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)', background: 'transparent',
                      color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      saveAiConfig(aiConfig);
                      setShowSettingsModal(false);
                    }}
                    style={{
                      height: '40px', padding: '0 18px', borderRadius: 'var(--radius-md)', border: 'none',
                      background: 'var(--brand-primary)', color: '#fff', fontSize: '0.85rem', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--brand-primary)'; }}
                  >
                    <Check size={15} /> Save & Apply
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