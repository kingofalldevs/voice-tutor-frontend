import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import './LessonPickerModal.css';

export default function LessonPickerModal({ onSelect, onDismiss }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_URL + '/lessons');
        const data = await response.json();
        setLessons(data);
      } catch (err) {
        console.error("Error fetching lessons:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content loading">
          <Loader2 className="spin" size={48} />
          <p>Loading Lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Mathematics Academy</h2>
          <button className="dismiss-btn" onClick={onDismiss} aria-label="Dismiss">
            <X size={20} />
          </button>
        </div>
        
        <p className="modal-desc">Select a topic to begin your masterclass with Professor Nova.</p>
        
        <div className="lessons-grid scrollbar-hide">
          {lessons.map((lesson) => (
            <div 
              key={lesson.id} 
              className="lesson-card-pro" 
              onClick={() => onSelect(lesson.id)}
            >
              <div className="card-emoji">{lesson.coverEmoji}</div>
              <div className="card-info">
                <h3>{lesson.title}</h3>
                <div className="card-meta">
                  <span>{lesson.subject}</span>
                  <span className="dot">•</span>
                  <span>{lesson.gradeLevel}</span>
                </div>
                <div className="chapter-count">
                  {lesson.chapterCount} Chapters
                </div>
              </div>
            </div>
          ))}
          
          {lessons.length === 0 && <p className="no-data">No lessons available yet.</p>}
        </div>
        
        <button className="later-btn" onClick={onDismiss}>
          I'll choose later
        </button>
      </div>
    </div>
  );
}
