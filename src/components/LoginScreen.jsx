import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, provider } from '../firebase/config';
import { ArrowLeft, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import './LoginScreen.css';

export default function LoginScreen({ onBack }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
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
          <p>{isLogin ? 'Welcome back to masterclass learning.' : 'Begin your personalized learning journey.'}</p>
        </div>

        <form className="email-form" onSubmit={handleEmailAuth}>
          {!isLogin && (
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                placeholder="Full Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? (
              <span className="loader"></span>
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        <div className="auth-separator">
          <span>OR</span>
        </div>
        
        <div className="login-actions">
          <button className="google-btn" onClick={handleGoogleLogin}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" />
            Continue with Google
          </button>
          
          <div className="auth-toggle">
            {isLogin ? (
              <p>Don't have an account? <span onClick={() => setIsLogin(false)}>Sign Up</span></p>
            ) : (
              <p>Already have an account? <span onClick={() => setIsLogin(true)}>Sign In</span></p>
            )}
          </div>

          <div className="login-footer">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
        
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
