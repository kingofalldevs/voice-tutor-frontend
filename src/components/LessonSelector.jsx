import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './LessonSelector.css';

export default function LessonSelector({ onSelect }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      const querySnapshot = await getDocs(collection(db, 'lessons'));
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLessons(list);
      setLoading(false);
    };
    fetchLessons();
  }, []);

  if (loading) return null;

  return (
    <div className="modal-overlay">
      <div className="lesson-modal">
        <h2>Welcome Back!</h2>
        <p>Choose a lesson to start your science journey today:</p>
        <div className="lesson-grid">
          {lessons.map(lesson => (
            <button 
              key={lesson.id} 
              className="lesson-card"
              onClick={() => onSelect(lesson)}
            >
              <h3>{lesson.title}</h3>
              <p>{lesson.description}</p>
            </button>
          ))}
          {lessons.length === 0 && <p>No lessons found. Please seed the database.</p>}
        </div>
      </div>
    </div>
  );
}
