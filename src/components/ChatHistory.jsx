import React, { useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import NovaAvatar from './NovaAvatar';
import './ChatHistory.css';

const QUICK_REPLIES = [
  { label: 'Show me again', text: 'Can you show me that again?' },
  { label: 'Hint please', text: 'Can you give me a hint?' },
  { label: 'I got it!', text: "I understand! Let's continue." },
];

export default function ChatHistory({ messages, isSpeaking, isListening, isProcessing, streamedReply, onSend, onToggleMic }) {
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedReply]);

  const getStatus = () => {
    if (isProcessing) return { label: 'Thinking...', cls: 'thinking', avatarState: 'thinking', showBars: false };
    if (isSpeaking)   return { label: 'Speaking...', cls: 'speaking', avatarState: 'speaking', showBars: true };
    if (isListening)  return { label: 'Listening...', cls: 'listening', avatarState: 'listening', showBars: false };
    return { label: 'Ready to help', cls: '', avatarState: 'idle', showBars: false };
  };

  const status = getStatus();

  const handleSend = () => {
    const val = inputRef.current?.value?.trim();
    if (val) { onSend(val); inputRef.current.value = ''; }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(date.getTime())) return 'Just now';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="nova-chat-panel">
      {/* Nova Header */}
      <div className="nova-chat-header">
        <div className="nova-avatar-container">
          <NovaAvatar state={status.avatarState} size={40} />
        </div>
        <div className="nova-header-info">
          <div className="nova-name">Nova</div>
          <div className={`nova-status ${status.cls}`}>
            {status.showBars && (
              <div className="status-bars">
                <span /><span /><span /><span />
              </div>
            )}
            {status.label}
          </div>
        </div>
        <button
          className={`nova-mic-btn ${isListening ? 'listening' : ''}`}
          onClick={onToggleMic}
          title={isListening ? 'Stop listening' : 'Speak to Nova'}
        >
          {isListening ? <Square size={16} /> : <Mic size={16} />}
        </button>
      </div>

      {/* Intro */}
      <div className="nova-intro-msg">
        Your AI math tutor — ask me anything about today's lesson!
      </div>

      {/* Messages */}
      <div className="chat-history">
        {(!messages || messages.length === 0) && !streamedReply ? (
          <div className="chat-empty">Nova is ready. Say hello or tap the mic! 🎤</div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`message-wrapper ${isUser ? 'right' : 'left'}`}>
                <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
                  <p>{msg.content}</p>
                </div>
                <span className="timestamp">{formatTime(msg.timestamp)}</span>
              </div>
            );
          })
        )}
        
        {/* Streamed Reply Bubble */}
        {streamedReply && (
          <div className="message-wrapper left">
            <div className="message-bubble assistant-bubble">
              <p>{streamedReply}</p>
              <span className="streaming-cursor"></span>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      {messages && messages.length > 0 && !isProcessing && (
        <div className="quick-replies">
          {QUICK_REPLIES.map((qr) => (
            <button key={qr.label} className="quick-chip" onClick={() => onSend(qr.text)}>
              {qr.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-row">
          <input
            ref={inputRef}
            type="text"
            className="chat-text-input"
            placeholder="Type your answer..."
            onKeyDown={handleKey}
          />
          <button className="chat-send-btn" onClick={handleSend}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
