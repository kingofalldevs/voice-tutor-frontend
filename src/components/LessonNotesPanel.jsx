import React, { useEffect, useRef } from 'react';
import MathRenderer from './MathRenderer';
import { Download, Share2 } from 'lucide-react';
import './LessonNotesPanel.css';

export default function LessonNotesPanel({ lesson, whiteboardBlocks = [], onBoardInteract }) {
  const boardEndRef = useRef(null);

  useEffect(() => {
    boardEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [whiteboardBlocks]);

  if (!lesson) return null;

  const skills = lesson.skills || [];
  const totalSkills = skills.length || 1;
  const completedCount = Math.min(Math.floor(whiteboardBlocks.length / 3), totalSkills);
  const progressPct = totalSkills > 0 ? Math.round((Math.max(completedCount, whiteboardBlocks.length > 0 ? 1 : 0) / totalSkills) * 100) : 0;

  return (
    <aside className="lesson-notes-sidebar">
      {/* Live Board */}
      <div className="board-container">
        <div className="whiteboard-section">
          <div className="whiteboard-header">
            <span>Nova's Live Board</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="premium-actions">
                <button className="icon-btn" title="Download board"><Download size={14} /></button>
                <button className="icon-btn" title="Share"><Share2 size={14} /></button>
              </div>
              <div className="live-indicator">Live</div>
            </div>
          </div>

          {/* Skill chips */}
          {skills.length > 0 && (
            <div className="skill-chips-list">
              {skills.map((skill, idx) => (
                <div key={skill.id || idx} className="skill-chip">
                  <span className="skill-chip-number">{idx + 1}</span>
                  <span className="skill-chip-label">{skill.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Whiteboard canvas */}
          <div className="whiteboard-canvas">
            {whiteboardBlocks.length === 0 ? (
              <div className="empty-board">
                <p>Nova will write here as she teaches. Just say hello or ask a question!</p>
              </div>
            ) : (
              whiteboardBlocks.map((block) => (
                <div key={block.id} className="board-entry entry-animate">
                  <MathRenderer content={block.content} onInteract={onBoardInteract} />
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
