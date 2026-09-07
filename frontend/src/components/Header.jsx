import React from 'react';

export default function Header({ timestamp = "September 02, 2026 at 18:30:00" }) {
  return (
    <div className="header">
      <h1>🔬 Quddos — Hybrid Quantum-Classical ML Platform</h1>
      <p>Precision Early Disease Detection Using Quantum-Classical Machine Learning</p>
      <div className="timestamp">📅 Generated: {timestamp}</div>
    </div>
  );
}
