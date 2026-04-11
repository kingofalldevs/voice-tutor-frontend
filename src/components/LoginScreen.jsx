import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase/config';
import { ArrowLeft } from 'lucide-react';
import './LoginScreen.css';

export default function LoginScreen({ onBack }) {
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-backdrop"></div>
      
      <button className="back-btn" onClick={onBack}>
         <ArrowLeft size={20} /> Back to Home
      </button>

      <div className="login-card glass-panel">
        <div className="login-header">
          <img src="/logo.png" alt="Nova Logo" className="login-logo-img" />
          <h1>Nova AI</h1>
          <p>Guided Intelligence for the Curious Mind</p>
        </div>
        
        <div className="login-actions">
          <button className="google-btn" onClick={handleLogin}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" />
            Continue with Google
          </button>
          
          <div className="login-footer">
            <p>By continuing, you agree to enter a world of masterclass education.</p>
          </div>
        </div>
        
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
