import React from 'react';
import { Sparkles, ArrowRight, Brain, Target, ShieldCheck } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onLoginClick }) {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo-section">
           <div className="nova-dot"></div>
           <h1>Nova Academy</h1>
        </div>
        <div className="nav-actions">
           <span className="nav-link" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>Features</span>
           <span className="nav-link">Pricing</span>
           <span className="nav-link">Parents</span>
           <div className="nav-divider"></div>
           <button className="nav-login-btn" onClick={onLoginClick}>Log In</button>
        </div>
      </nav>

      <main className="landing-main">
        <section className="hero-wrapper">
           <img src="/hero-bg.jpg" alt="Student learning with Nova" className="hero-bg-img" />
           <div className="hero-section">
              <div className="hero-badge">
              <Sparkles size={18} />
              <span>Built for Curious Kids & Future Geniuses</span>
           </div>
           <h1 className="hero-title">Nova makes math <span className="highlight-text">simple.</span></h1>
           <p className="hero-subtitle">
             Meet the elite AI-powered voice tutor that teaches on a live smart-board. 
             Master fractions, algebra, and geometry through a fun, interactive experience designed to wow.
           </p>
           
           <div className="hero-actions">
              <button className="primary-cta" onClick={onLoginClick}>
                 Start Learning For Free <ArrowRight size={24} />
              </button>
           </div>
           </div>
        </section>

        <section className="features-section">
           <div className="feature-card">
             <div className="f-icon"><Brain size={32} /></div>
             <h3>Smart Teacher</h3>
             <p>Nova never just lectures. She stops, checks for understanding, and uses fun analogies like pizza to guide kids to the answer.</p>
           </div>
           <div className="feature-card">
             <div className="f-icon"><Target size={32} /></div>
             <h3>Interactive Board</h3>
             <p>Visual-first learning. Every equation and step is meticulously written right in front of them as Nova speaks.</p>
           </div>
           <div className="feature-card">
             <div className="f-icon"><ShieldCheck size={32} /></div>
             <h3>100% Focused</h3>
             <p>Our Studio Monochrome design removes noisy colors and distractions, ensuring pure focus on mastering math.</p>
           </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
             <div className="logo-section">
               <div className="nova-dot"></div>
               <h2>Nova Academy</h2>
             </div>
             <p>The definitive AI-powered voice tutor built natively for ambitious kids and supportive parents.</p>
          </div>
          <div className="footer-links">
             <div className="link-column">
                <h4>Product</h4>
                <span>Features</span>
                <span>Pricing</span>
                <span>Curriculum</span>
             </div>
             <div className="link-column">
                <h4>Company</h4>
                <span>About Us</span>
                <span>Careers</span>
                <span>Contact</span>
             </div>
             <div className="link-column">
                <h4>Legal</h4>
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
             </div>
          </div>
        </div>
        <div className="footer-bottom">
           <p>&copy; 2026 Nova AI Academy. All rights reserved.</p>
           <div className="social-links">
             <span>Twitter</span>
             <span>LinkedIn</span>
             <span>Instagram</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
