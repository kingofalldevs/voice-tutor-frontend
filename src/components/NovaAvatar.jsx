import React from 'react';
import './NovaAvatar.css';

/**
 * Nova — animated golden star with eyes.
 * States: idle | speaking | listening | thinking
 */
export default function NovaAvatar({ state = 'idle', size = 40 }) {
  const isSpeaking  = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking  = state === 'thinking';

  return (
    <div
      className={`nova-star-wrap nova-star--${state}`}
      style={{ width: size, height: size }}
      aria-label={`Nova is ${state}`}
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="nova-star-svg"
      >
        <defs>
          {/* Gold gradient */}
          <radialGradient id="starGold" cx="40%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#FFE566" />
            <stop offset="55%"  stopColor="#FFB800" />
            <stop offset="100%" stopColor="#E07B00" />
          </radialGradient>

          {/* Shine spot */}
          <radialGradient id="starShine" cx="35%" cy="28%" r="30%">
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="starGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── STAR BODY ── */}
        {/* 5-point star path centered at 50,50 */}
        <path
          className={`nova-star-body ${isSpeaking ? 'nova-body-speaking' : ''}`}
          d="M50 8
             L61 36 L91 36 L68 54 L77 82
             L50 65 L23 82 L32 54 L9  36 L39 36 Z"
          fill="url(#starGold)"
          filter="url(#starGlow)"
        />

        {/* Shine overlay */}
        <path
          d="M50 8
             L61 36 L91 36 L68 54 L77 82
             L50 65 L23 82 L32 54 L9  36 L39 36 Z"
          fill="url(#starShine)"
        />

        {/* ── EYES ── */}
        {/* Left eye */}
        <g className={`nova-eye nova-eye-left ${isThinking ? 'nova-eye-thinking' : ''}`}>
          {/* eye white */}
          <ellipse cx="38" cy="51" rx="6.5" ry="7" fill="#fff" opacity="0.95" />
          {/* pupil */}
          <ellipse
            className={`nova-pupil ${isSpeaking ? 'nova-pupil-happy' : ''}`}
            cx="38.5" cy="52" rx="3.8" ry="4.2"
            fill="#3A2000"
          />
          {/* highlight */}
          <circle cx="40" cy="50" r="1.5" fill="#fff" opacity="0.9" />
        </g>

        {/* Right eye */}
        <g className={`nova-eye nova-eye-right ${isThinking ? 'nova-eye-thinking' : ''}`}>
          <ellipse cx="62" cy="51" rx="6.5" ry="7" fill="#fff" opacity="0.95" />
          <ellipse
            className={`nova-pupil ${isSpeaking ? 'nova-pupil-happy' : ''}`}
            cx="62.5" cy="52" rx="3.8" ry="4.2"
            fill="#3A2000"
          />
          <circle cx="64" cy="50" r="1.5" fill="#fff" opacity="0.9" />
        </g>

        {/* ── MOUTH (only when speaking) ── */}
        {isSpeaking && (
          <ellipse
            className="nova-mouth"
            cx="50" cy="63"
            rx="5" ry="3"
            fill="#3A2000"
            opacity="0.7"
          />
        )}

        {/* ── BLUSH (listening) ── */}
        {isListening && (
          <>
            <ellipse cx="29" cy="58" rx="5" ry="3" fill="#FF9FC3" opacity="0.45" />
            <ellipse cx="71" cy="58" rx="5" ry="3" fill="#FF9FC3" opacity="0.45" />
          </>
        )}
      </svg>

      {/* Speaking sound-wave rings */}
      {isSpeaking && (
        <div className="nova-rings">
          <span className="nova-ring nova-ring-1" />
          <span className="nova-ring nova-ring-2" />
          <span className="nova-ring nova-ring-3" />
        </div>
      )}
    </div>
  );
}
