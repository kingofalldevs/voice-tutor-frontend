import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, User, Globe, GraduationCap, MapPin } from 'lucide-react';
import './OnboardingWizard.css';

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    age: '',
    country: 'US',
    state: '',
    grade: '6'
  });

  const nextStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(prev => prev + 1);
      setIsTransitioning(false);
    }, 300);
  };

  const prevStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(prev => prev - 1);
      setIsTransitioning(false);
    }, 300);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, ...formData })
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      if (data.status === "success") {
        onComplete(data.profile);
      } else {
        throw new Error(data.error || "Submission failed");
      }
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(err.message || "Something went wrong. Is your backend running?");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className={`step-container ${isTransitioning ? 'fade-out' : ''}`}>
            <header>
              <h2>Welcome to Nova</h2>
              <p>Let's start with your basics.</p>
            </header>
            <div className="form-group">
              <label>What's your name?</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Full Name"
              />
            </div>
            <div className="form-group">
              <label>How old are you?</label>
              <input 
                type="number" 
                value={formData.age} 
                onChange={e => setFormData({...formData, age: e.target.value})}
                placeholder="Age"
                min="5"
                max="100"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className={`step-container ${isTransitioning ? 'fade-out' : ''}`}>
            <header>
              <h2>Your Region</h2>
              <p>Tell us where you are learning from.</p>
            </header>
            <div className="options-grid">
              <div 
                className={`option-btn ${formData.country === 'US' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, country: 'US'})}
              >
                <div className="icon-badge"><Globe size={24} /></div>
                <span>United States</span>
              </div>
              <div 
                className={`option-btn ${formData.country === 'INTERNATIONAL' ? 'selected' : ''}`}
                onClick={() => setFormData({...formData, country: 'INTERNATIONAL'})}
              >
                <div className="icon-badge"><Globe size={24} /></div>
                <span>International</span>
              </div>
            </div>
            {formData.country === 'US' && (
              <div className="form-group" style={{ marginTop: '2rem' }}>
                <label>Select State</label>
                <select 
                  value={formData.state} 
                  onChange={e => setFormData({...formData, state: e.target.value})}
                >
                  <option value="">Select a state</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                  <option value="OTHER">Other State</option>
                </select>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className={`step-container ${isTransitioning ? 'fade-out' : ''}`}>
            <header>
              <h2>Academic Level</h2>
              <p>Setting up your Grade {formData.grade} curriculum.</p>
            </header>
            <div className="form-group">
              <label>What grade are you in?</label>
              <select 
                value={formData.grade} 
                onChange={e => setFormData({...formData, grade: e.target.value})}
              >
                {[6, 7, 8, 9, 10, 11, 12].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div className="info-box" style={{ background: '#f8f8f8', padding: '1.5rem', borderRadius: '20px', marginTop: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
                Nova will automatically load the appropriate <strong>{formData.country === 'US' ? 'Common Core' : 'International'}</strong> standards for Grade {formData.grade}.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.name && formData.age;
    if (step === 2) return formData.country === 'INTERNATIONAL' || (formData.country === 'US' && formData.state);
    if (step === 3) return formData.grade;
    return false;
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="wizard-progress">
          <div className={`progress-dot ${step >= 1 ? 'active' : ''}`} />
          <div className={`progress-dot ${step >= 2 ? 'active' : ''}`} />
          <div className={`progress-dot ${step >= 3 ? 'active' : ''}`} />
        </div>

        {renderStep()}

        <footer className="wizard-footer">
          {step > 1 ? (
            <button className="wizard-back" onClick={prevStep} disabled={loading}>
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
          ) : <div />}
          
          <div className="wizard-actions">
            {error && <p className="wizard-error-text">{error}</p>}
            <button 
              className="wizard-next" 
              onClick={step === 3 ? handleSubmit : nextStep}
              disabled={!isStepValid() || loading}
            >
              <span>{loading ? "Saving..." : (step === 3 ? "Complete" : "Next Step")}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
