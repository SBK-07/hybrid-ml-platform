import React from 'react';

export default function Header({ timestamp = "September 02, 2026 at 18:30:00" }) {
  return (
    <div className="header">
      <h1>🔬 Hybrid Quantum-Classical ML Platform</h1>
      <p>Early Disease Detection Using Machine Learning</p>
      <div className="timestamp">📅 Generated: {timestamp}</div>
    </div>
  );
}
