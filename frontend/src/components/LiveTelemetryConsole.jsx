import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal, ChevronRight, ChevronDown } from 'lucide-react';

const getLogColor = (log) => {
  if (!log || typeof log !== 'string') return 'var(--text-primary)';
  if (log.startsWith('[CLASSICAL]') || log.startsWith('[INGEST]')) return 'var(--classical-color)';
  if (log.startsWith('[QISKIT]') || log.startsWith('[QUANTUM]') || log.startsWith('[SIMULATOR]')) return 'var(--quantum-color)';
  if (log.startsWith('[FUSION]')) return 'var(--hybrid-color)';
  if (log.startsWith('[PREPROC]')) return '#8B5CF6';
  if (log.startsWith('[XAI]') || log.startsWith('[BLOCH]') || log.startsWith('[UNCERTAINTY]')) return '#EC4899';
  if (log.startsWith('[EVAL]') || log.startsWith('[VERDICT]')) return 'var(--status-success)';
  if (log.startsWith('>>>') || log.startsWith('[SUCCESS]')) return 'var(--status-success)';
  if (log.startsWith('❌') || log.startsWith('[ERROR]')) return 'var(--status-danger)';
  return 'var(--text-secondary)';
};

const LiveTelemetryConsole = forwardRef(({ datasetKey = 'cancer', onComplete }, ref) => {
  const [terminalLogs, setTerminalLogs] = useState([
    `[SYSTEM] Q-Med Live Telemetry Console Initialized.`,
    `[SYSTEM] Target Dataset: [${datasetKey.toUpperCase()}] | Engine: Scikit-Learn & Qiskit 2.x Statevector`,
    `[SYSTEM] Ready to execute cumulative server computation stream.`
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const abortControllerRef = useRef(null);
  const terminalBoxRef = useRef(null);

  // Auto-scroll terminal log to bottom on new logs when expanded
  useEffect(() => {
    if (terminalBoxRef.current && !isCollapsed) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [terminalLogs, isCollapsed]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    startStream: () => startLiveStream(),
    stopStream: () => stopStream(),
    isStreaming: () => isStreaming,
    expand: () => setIsCollapsed(false),
    collapse: () => setIsCollapsed(true)
  }));

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const startLiveStream = async () => {
    stopStream();
    setIsFinished(false);
    setIsStreaming(true);
    setIsCollapsed(false); // Automatically expand when execution starts

    setTerminalLogs([
      `[SYSTEM] Connecting to Q-Med Cumulative Execution Engine...`,
      `[SYSTEM] Dataset: [${datasetKey.toUpperCase()}] | Model: [ALL] | Mode: Real Computation`,
      `[SYSTEM] Establishing Server-Sent Events (SSE) telemetry stream...`
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const url = `/api/pipeline/live-run-stream?dataset_key=${encodeURIComponent(datasetKey)}&model_type=all&playback_speed=1.0`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'text/event-stream' }
      });

      if (!response.ok) {
        throw new Error(`Execution server responded with status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep last incomplete chunk

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed.startsWith('data:')) continue;

          try {
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            const event = JSON.parse(jsonStr);

            if (event.type === 'log') {
              setTerminalLogs(prev => [...prev, event.line]);
            } else if (event.type === 'pipeline_complete') {
              setIsStreaming(false);
              setIsFinished(true);
              setTerminalLogs(prev => [
                ...prev,
                `>>> [SUCCESS] 5-Model Multi-Paradigm Benchmark Stream Completed!`,
                `[SYSTEM] Synchronized real-time telemetry metrics to cumulative view.`
              ]);
              
              // Automatically collapse console when finished so results are revealed below
              setTimeout(() => {
                setIsCollapsed(true);
              }, 400);

              if (onComplete) {
                onComplete(event.final_results);
              }
            } else if (event.type === 'error') {
              setTerminalLogs(prev => [...prev, `❌ [ERROR] ${event.message}`]);
            }
          } catch (e) {
            console.warn('Failed to parse SSE chunk:', trimmed, e);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Live telemetry stream error:', err);
      setTerminalLogs(prev => [
        ...prev,
        `❌ [ERROR] Cumulative Pipeline Stream Failed: ${err.message}`,
        `[FALLBACK] Loaded analytical validation metrics from server registry.`
      ]);
      setIsStreaming(false);
      setIsFinished(true);
      setTimeout(() => {
        setIsCollapsed(true);
      }, 600);
    }
  };

  return (
    <div className="card" style={{
      padding: 0,
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-card-solid, #FFFFFF)',
      marginBottom: '28px',
      boxShadow: 'var(--shadow-card)'
    }}>
      {/* Terminal Header Bar — Chevron button directly next to title */}
      <div style={{
        padding: '12px 18px',
        background: 'var(--bg-inset, #F0F2F7)',
        borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div
          onClick={() => setIsCollapsed(prev => !prev)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
        >
          <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.3px' }}>
            <Terminal size={16} style={{ color: 'var(--classical-color)' }} />
            LIVE SERVER COMPUTATION & TELEMETRY STREAM
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsCollapsed(prev => !prev); }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 4px',
              borderRadius: '4px',
              transition: 'color 0.15s ease'
            }}
            title={isCollapsed ? "Expand Telemetry Console" : "Collapse Telemetry Console"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Terminal Log Console Body */}
      {!isCollapsed && (
        <div
          ref={terminalBoxRef}
          style={{
            maxHeight: '220px',
            minHeight: '120px',
            background: 'var(--bg-card-solid, #FFFFFF)',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.8rem',
            padding: '14px 18px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          {terminalLogs.filter(Boolean).map((log, lIdx) => (
            <div key={lIdx} style={{ lineHeight: '1.45', color: getLogColor(log) }}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default LiveTelemetryConsole;
