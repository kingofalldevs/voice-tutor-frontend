import React, { useState } from 'react';
import MathRenderer from './MathRenderer';
import './MathChallenge.css';

export default function MathChallenge({ question, correctAnswer, onResult }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer) return;

    const correct = answer.trim() === correctAnswer.toString().trim();
    setIsCorrect(correct);
    setSubmitted(true);
    
    // Notify parent to send feedback to AI
    if (onResult) {
      onResult(correct, answer);
    }
  };

  return (
    <div className={`math-challenge-container ${submitted ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
      <div className="challenge-label">Interactive Challenge</div>
      
      <div className="math-display">
        <MathRenderer math={question} block={true} />
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="challenge-form">
          <input 
            type="text" 
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer..."
            className="math-input"
            autoFocus
          />
          <button type="submit" className="submit-answer-btn">
            Check Answer
          </button>
        </form>
      ) : (
        <div className="result-feedback">
          {isCorrect ? (
            <div className="feedback-text correct">✨ Brilliant! That's correct.</div>
          ) : (
            <div className="feedback-text incorrect">
              Not quite. Let's look at the explanation again.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
