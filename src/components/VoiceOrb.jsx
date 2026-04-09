import React from 'react';
import { Mic, Square, Volume2, Loader2 } from 'lucide-react';
import './VoiceOrb.css';

export default function VoiceOrb({ isListening, isSpeaking, isProcessing, onClick, error, transcript }) {
  let stateClass = 'idle';
  let Icon = Mic;
  let statusText = 'Tap to speak';

  if (isProcessing) {
    stateClass = 'thinking';
    Icon = Loader2;
    statusText = 'Thinking...';
  } else if (isSpeaking) {
    stateClass = 'speaking';
    Icon = Volume2;
    statusText = 'Speaking...';
  } else if (isListening) {
    stateClass = 'listening';
    Icon = Square;
    statusText = 'Listening...';
  }

  if (error) {
    statusText = 'Microphone Error. Tap to retry.';
  }

  return (
    <div className="voice-orb-container">
      <button 
        className={`voice-orb ${stateClass}`} 
        onClick={onClick}
        aria-label="Voice control"
        disabled={isProcessing}
      >
        <div className="orb-content">
          <Icon size={48} className={`orb-icon ${isProcessing ? 'spin' : ''}`} />
        </div>
        {/* Decorative rings for animation */}
        <div className="ring ring-1"></div>
        <div className="ring ring-2"></div>
        <div className="ring ring-3"></div>
      </button>
      <div className="text-feedback">
        <p className="status-text">{statusText}</p>
        {isListening && transcript && (
          <p className="live-transcript">"{transcript}..."</p>
        )}
      </div>
    </div>
  );
}
