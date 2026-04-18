import React from 'react';

/**
 * MathVisuals.jsx - A high-fidelity visual engine for MathNova.
 * Provides SVG-based illustrations for counting, geometry, and number lines.
 */

// 1. Kinetic Number Line Component
export const NumberLine = ({ min = 0, max = 10, marks = [], highlight = null }) => {
  const range = max - min;
  const highlightX = 5 + ((highlight - min) * (100 / range));

  return (
    <div className="math-visual-container number-line-visual kinetic-container">
      <svg viewBox="0 -20 110 40" className="visual-svg">
        <line x1="5" y1="0" x2="105" y2="0" stroke="currentColor" strokeWidth="0.5" />
        
        {Array.from({ length: range + 1 }).map((_, i) => {
          const val = min + i;
          const x = 5 + (i * (100 / range));
          return (
            <g key={i}>
              <line x1={x} y1="-2" x2={x} y2="2" stroke="currentColor" strokeWidth="0.3" />
              <text x={x} y="10" fontSize="3" textAnchor="middle" fill="currentColor">{val}</text>
            </g>
          );
        })}

        {highlight !== null && (
          <circle 
            cx={highlightX} 
            cy="0" 
            r="1.8" 
            fill="var(--primary-accent)" 
            className="kinetic-marker"
            style={{ transition: 'cx 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
        )}

        {marks.map((m, idx) => (
          <circle key={idx} cx={5 + ((m - min) * (100 / range))} cy="0" r="1" fill="currentColor" />
        ))}
      </svg>
    </div>
  );
};

// 2. Interactive Counter Set Component
export const CounterSet = ({ count = 0, grouping = 5, icon = "dot", color = "var(--primary-accent)", interactive = false, onInteract = null, id = "c1" }) => {
  const [selected, setSelected] = React.useState(new Set());
  const [submitted, setSubmitted] = React.useState(false);

  const toggleDot = (i) => {
    if (!interactive || submitted) return;
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  return (
    <div className={`math-visual-container counter-set-visual ${interactive ? 'interactive-mode' : ''}`}>
      <div className="counters-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            onClick={() => toggleDot(i)}
            style={{ 
              cursor: interactive && !submitted ? 'pointer' : 'default',
              marginRight: (i + 1) % grouping === 0 ? '16px' : '0',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: selected.has(i) ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
              filter: selected.has(i) ? 'drop-shadow(0 8px 12px rgba(231, 76, 60, 0.3))' : 'none'
            }}
          >
            {icon === 'apple' ? (
              <svg viewBox="0 0 100 100" width="48" height="48" style={{ opacity: selected.has(i) ? 1 : 0.85 }}>
                <path d="M50 85 C20 85, 10 55, 20 35 C30 15, 45 20, 50 25 C55 20, 70 15, 80 35 C90 55, 80 85, 50 85 Z" fill={selected.has(i) ? "#E74C3C" : "#FF6B6B"} />
                <path d="M50 25 C50 15, 55 5, 60 5" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
                <path d="M55 15 C65 5, 80 10, 75 20 C70 30, 55 25, 55 15 Z" fill="#2ECC71" />
              </svg>
            ) : (
              <div 
                className={`counter-dot ${selected.has(i) ? 'dot-selected' : ''}`}
                style={{ 
                  backgroundColor: selected.has(i) ? color : '#eee',
                  width: '28px', height: '28px', borderRadius: '50%'
                }}
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="counter-controls">
        <div className="counter-label">
          {interactive ? `Selected: ${selected.size}` : `Total: ${count}`}
        </div>
        
        {interactive && !submitted && selected.size > 0 && (
          <button 
            className="interaction-done-btn"
            onClick={() => {
              setSubmitted(true);
              if (onInteract) onInteract({ id, selected: selected.size });
            }}
          >
            Confirm
          </button>
        )}
        
        {submitted && <div className="interaction-submitted">✓ Action Sent</div>}
      </div>
    </div>
  );
};

// 3. Kinetic Shape Component
export const GeometricShape = ({ type = "triangle", labels = [] }) => {
  const renderShape = () => {
    const commonProps = {
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinejoin: "round",
      className: "kinetic-path"
    };

    switch (type.toLowerCase()) {
      case 'triangle':
        return (
          <g>
            <path d="M 50,15 L 85,80 L 15,80 Z" {...commonProps} />
            <text x="50" y="8" fontSize="5" textAnchor="middle" fill="currentColor">{labels[0] || ''}</text>
            <text x="90" y="80" fontSize="5" fill="currentColor">{labels[1] || ''}</text>
            <text x="5" y="80" fontSize="5" fill="currentColor">{labels[2] || ''}</text>
          </g>
        );
      case 'rect':
      case 'rectangle':
        return (
          <g>
            <rect x="20" y="25" width="60" height="40" {...commonProps} />
            <text x="50" y="20" fontSize="5" textAnchor="middle" fill="currentColor">{labels[0] || ''}</text>
            <text x="85" y="45" fontSize="5" fill="currentColor">{labels[1] || ''}</text>
          </g>
        );
      case 'circle':
        return (
          <g>
            <circle cx="50" cy="50" r="30" {...commonProps} />
            <line x1="50" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" />
            <text x="65" y="45" fontSize="4" fill="currentColor">{labels[0] || 'r'}</text>
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div className="math-visual-container shape-visual kinetic-container">
      <svg viewBox="0 0 100 100" className="visual-svg">
        {renderShape()}
      </svg>
    </div>
  );
};

const MathVisuals = {
  NumberLine,
  CounterSet,
  GeometricShape
};

export default MathVisuals;
