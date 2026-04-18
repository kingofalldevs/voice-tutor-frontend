import React, { useState, useEffect } from 'react';
import { BookOpen, X, ChevronRight } from 'lucide-react';
import './CourseExplorerModal.css';

export default function CourseExplorerModal({ user, onClose, onSelectCourse }) {
  const [courses, setCourses] = useState({
    "Elementary School": [],
    "Middle School": [],
    "High School": []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Middle School");

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://voice-tutor-backend.onrender.com';
      const resp = await fetch(`${baseUrl}/curriculum/all`);
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const data = await resp.json();
      
      // Assume grouped by standard levels
      setCourses(data);
      setLoading(false);
    } catch (err) {
      console.error("Course fetch error:", err);
      setError("Trouble connecting to the curriculum database. Please try again.");
      setLoading(false);
    }
  };

  const renderGrid = (level) => {
    const list = courses[level] || [];
    if (loading) return <div className="course-loader">Loading {level} courses...</div>;
    if (list.length === 0) return <div className="course-empty">No courses available for {level} yet.</div>;

    return (
      <div className="course-grid">
        {list.map((std) => (
          <div key={std.id} className="course-card" onClick={() => onSelectCourse(std)}>
            <div className="course-top">
              <span className="course-domain">{std.domain}</span>
              <span className="course-grade">Grade {std.grade}</span>
            </div>
            <h3>{std.title}</h3>
            <p>{std.description}</p>
            <div className="course-bottom">
              <div className="course-skills">{std.skills?.length || 0} Modules</div>
              <button className="start-class-btn">
                Start Class <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="course-explorer-overlay">
      <div className="course-explorer-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-brand-block">
            <BookOpen size={24} className="brand-icon" />
            <h2>MathNova Curriculum</h2>
          </div>
          <button className="close-action-btn" onClick={onClose} aria-label="Close menus">
            <X size={20} />
          </button>
        </div>

        {/* Level Tabs */}
        <div className="modal-tabs">
          {["Elementary School", "Middle School", "High School"].map(level => (
            <button 
              key={level}
              className={`level-tab ${activeTab === level ? 'active' : ''}`}
              onClick={() => setActiveTab(level)}
            >
              {level}
              <span className="tab-badge">{(courses[level] || []).length}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="modal-body">
          {error ? (
            <div className="course-error">
              <p>{error}</p>
              <button onClick={fetchCourses} className="retry-btn">Retry</button>
            </div>
          ) : (
            renderGrid(activeTab)
          )}
        </div>
      </div>
    </div>
  );
}
