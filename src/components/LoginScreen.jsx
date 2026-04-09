import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase/config';
import './LoginScreen.css';

export default function LoginScreen() {
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
      <div className="login-card">
        <h1>Voice Chat</h1>
        <p>A ChatGPT-style voice assistant</p>
        <button className="google-btn" onClick={handleLogin}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" />
          Sign in with Google
        </button>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
