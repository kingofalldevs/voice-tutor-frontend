import React, { useEffect, useRef } from 'react';
import MathRenderer from './MathRenderer';
import { Download, Share2 } from 'lucide-react';
import './LessonNotesPanel.css';

export default function LessonNotesPanel({ lesson, whiteboardBlocks = [] }) {
  const boardEndRef = useRef(null);

  useEffect(() => {
    boardEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [whiteboardBlocks]);

  if (!lesson) return null;

  return (
    <aside className="lesson-notes-sidebar">
      <div className="panel-header">
        <div className="header-top">
          <div className="topic-label">Active Lesson Topic</div>
          <div className="premium-actions">
            <button className="icon-btn" title="Export Board"><Download size={14} /></button>
            <button className="icon-btn" title="Share with Parents"><Share2 size={14} /></button>
          </div>
        </div>
        <h2>{lesson.title}</h2>
      </div>

      <div className="board-container">
        {/* NOVA'S LIVE WHITEBOARD - THE MAIN FOCUS */}
        <div className="whiteboard-section">
          <div className="whiteboard-header">
            <span>Nova's Live Board</span>
            <div className="live-indicator">● LIVE</div>
          </div>
          <div className="whiteboard-canvas">
            {whiteboardBlocks.length === 0 ? (
              <div className="empty-board">
                <p>Welcome! Ask Nova a question and she will write the steps here.</p>
              </div>
            ) : (
              whiteboardBlocks.map((block) => (
                <div key={block.id} className="board-entry entry-animate">
                  <MathRenderer content={block.content} />
                </div>
              ))
            )}
            <div ref={boardEndRef} />
          </div>
        </div>
      </div>
    </aside>
  );
}
