import React from 'react';

/**
 * 4-Orbit Quantum Atom SVG Icon.
 * Features 4 symmetrical rotated orbits (0°, 45°, 90°, 135°) around a central nucleus circle.
 */
export default function Atom4Orbits({ size = 28, color = 'currentColor', style = {}, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      className={className}
    >
      {/* Central nucleus */}
      <circle cx="12" cy="12" r="2.2" fill={color} stroke="none" />

      {/* Orbit 1: Vertical 0° */}
      <ellipse cx="12" cy="12" rx="3.2" ry="10" />

      {/* Orbit 2: Diagonal 45° */}
      <ellipse cx="12" cy="12" rx="3.2" ry="10" transform="rotate(45 12 12)" />

     {/* Orbit 3: Horizontal 90° */}
      <ellipse cx="12" cy="12" rx="3.2" ry="10" transform="rotate(90 12 12)" />

      {/* Orbit 4: Diagonal 135° */}
      <ellipse cx="12" cy="12" rx="3.2" ry="10" transform="rotate(135 12 12)" />
    </svg>
  );
}
