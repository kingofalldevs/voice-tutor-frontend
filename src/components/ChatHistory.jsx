import React, { useEffect, useRef } from 'react';
import './ChatHistory.css';

export default function ChatHistory({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (ts) => {
    if (!ts) return '';
    // Firestore timestamp or JS Date
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="chat-empty">
        <p>Start speaking to begin</p>
      </div>
    );
  }

  return (
    <div className="chat-history">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div key={msg.id} className={`message-wrapper ${isUser ? 'right' : 'left'}`}>
            <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
              <p>{msg.content}</p>
            </div>
            <span className="timestamp">{formatTime(msg.timestamp)}</span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
