import React from 'react';
import { Brain, Monitor, Mic, PlayCircle, UserPlus, Globe, Menu } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onLoginClick, onPricingClick }) {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="logo-section">
            <img src="/logo.png" alt="Nova Logo" className="logo-img" />
            <span className="logo-text">Nova</span>
          </div>
          <div className="nav-links">
            <span className="nav-link" onClick={() => window.scrollTo({ top: document.getElementById('features').offsetTop - 120, behavior: 'smooth' })}>Features</span>
            <span className="nav-link" onClick={onPricingClick}>Pricing</span>
            <span className="nav-link">About</span>
          </div>
          <div className="nav-actions">
            <button className="nav-login-btn" onClick={onLoginClick}>Sign In</button>
            <div className="mobile-menu-btn">
              <Menu size={24} />
            </div>
          </div>
        </div>
      </nav>

      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <img src="/hero-bg.jpg" alt="" className="hero-bg-img" />
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="hero-title">
              Meet <span className="highlight-text">Nova.</span><br />
              The World's Most Advanced<br />
              AI Math Tutor.
            </h1>
            <p className="hero-subtitle">
              A voice-powered learning experience that feels like magic. Nova teaches on a live interactive board,
              adapting to your child's pace with Ghanaian curriculum mastery.
            </p>
            <div className="hero-actions">
              <button className="hero-btn-watch" onClick={() => {}}>
                <PlayCircle size={20} /> Watch Demo
              </button>
              <button className="hero-btn-signup" onClick={onLoginClick}>
                <UserPlus size={20} /> Sign Up Free
              </button>
            </div>
          </div>
        </section>

        {/* App Preview Section */}
        <section className="preview-section">
          <div className="preview-wrap">
            <div className="preview-label">SEE IT IN ACTION</div>
            <h2 className="preview-title">The Nova Learning Interface</h2>
            <p className="preview-subtitle">A clean, distraction-free environment built for deep focus and real understanding.</p>
            
            <div className="mockups-container">
              {/* Desktop Mockup */}
              <div className="app-mockup desktop-mockup">
                {/* Left — Whiteboard Panel */}
                <div className="mockup-board-panel">
                  <div className="mockup-topbar">
                    <span className="mockup-lesson-label">ACTIVE LESSON TOPIC</span>
                    <div className="mockup-actions">
                      <span className="mockup-icon-btn">↓</span>
                      <span className="mockup-icon-btn">⇄</span>
                    </div>
                  </div>
                  <h3 className="mockup-lesson-title">Basic Operations</h3>
                  <div className="mockup-board">
                    <div className="mockup-board-header">
                      <span>NOVA'S LIVE BOARD</span>
                      <span className="live-dot">● LIVE</span>
                    </div>
                    <div className="mockup-board-body">
                      <div className="board-line accent-line"></div>
                      <div className="board-content">
                        <p className="board-text bold">BASIC OPERATIONS</p>
                        <p className="board-text">Ch 1: Addition and Subtraction</p>
                        <p className="board-text">Ch 2: Multiplication and Division</p>
                        <p className="board-text">Ch 3: Word Problems</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right — Voice + Chat Panel */}
                <div className="mockup-voice-panel">
                  <div className="mockup-orb">
                    <div className="orb-ring">
                      <Mic size={32} />
                    </div>
                    <span className="tap-label">TAP TO SPEAK</span>
                  </div>
                  <div className="mockup-chat">
                    <div className="chat-bubble">
                      Welcome to Basic Operations, Grace. Our curriculum covers three chapters: Addition &amp; Subtraction, Multiplication &amp; Division, and Word Problems. Shall we dive into Chapter 1?
                      <span className="chat-time">3:54 AM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Mockup Overlay */}
              <div className="app-mockup mobile-mockup">
                <div className="mobile-status-bar">
                  <span>9:41</span>
                  <div className="mobile-sys-icons">
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>
                <div className="mobile-topbar">
                  <span className="mockup-lesson-label">ACTIVE LESSON TOPIC</span>
                  <div className="mockup-actions">
                    <span className="mockup-icon-btn">↓</span>
                    <span className="mockup-icon-btn">⇄</span>
                  </div>
                </div>
                <div className="mobile-content-wrap">
                  <h3 className="mockup-lesson-title">Basic Operations</h3>
                  <div className="mockup-board">
                    <div className="mockup-board-header">
                      <span>NOVA'S LIVE BOARD</span>
                      <span className="live-dot">● LIVE</span>
                    </div>
                    <div className="mockup-board-body">
                      <div className="board-line accent-line"></div>
                      <div className="board-content">
                        <p className="board-text bold">BASIC OPERATIONS</p>
                        <p className="board-text">Ch 1: Addition and Subtraction</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mobile-fab">
                  <Mic size={24} />
                </div>
                <div className="mobile-home-indicator"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
          <div className="features-content-wrap">
            <div className="section-header">
              <h2 className="section-title">Features</h2>
              <p className="section-subtitle">
                Nova isn't just a chatbot — it's a full learning companion. It listens, teaches, writes on a live board, and adapts to your child's exact pace. Every session is structured, voice-driven, and built around the Ghanaian school curriculum.
              </p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="f-icon-wrap"><Brain size={28} /></div>
                <h3>Adaptive AI Tutor</h3>
                <p>Nova understands where your child is struggling and adjusts in real-time — asking questions, giving hints, and celebrating progress without ever losing patience.</p>
              </div>
              <div className="feature-card">
                <div className="f-icon-wrap"><Monitor size={28} /></div>
                <h3>Live Whiteboard</h3>
                <p>Every lesson unfolds on a live board. Nova writes out equations, steps, and explanations visually as she speaks — just like a real classroom teacher would.</p>
              </div>
              <div className="feature-card">
                <div className="f-icon-wrap"><Mic size={28} /></div>
                <h3>Voice Tutor</h3>
                <p>Tap to speak and Nova listens. Students answer questions, ask for help, and navigate lessons entirely by voice — making learning feel natural and effortless.</p>
              </div>
              <div className="feature-card">
                <div className="f-icon-wrap"><Globe size={28} /></div>
                <h3>Global Curriculums Integrated</h3>
                <p>Pre-loaded and adapted to major world standards including the US Common Core, UK National Curriculum (KS1-KS4), Singapore Math, and the formal Ghanaian GES syllabus.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo-section">
              <img src="/logo.png" alt="Nova Logo" className="logo-img" />
              <span className="logo-text">Nova Academy</span>
            </div>
            <p>Redefining how the world learns math through voice and AI interaction.</p>
          </div>
          <div className="footer-links-grid">
            <div className="link-group">
              <h4>Product</h4>
              <span onClick={onPricingClick}>Pricing</span>
              <span>Features</span>
              <span>Security</span>
            </div>
            <div className="link-group">
              <h4>Resources</h4>
              <span>Curriculum</span>
              <span>Help Center</span>
              <span>Parent Guide</span>
            </div>
            <div className="link-group">
              <h4>Legal</h4>
              <span>Privacy</span>
              <span>Terms</span>
              <span>Security</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Nova AI Academy. All rights reserved.</p>
          <div className="social-links">
            <span>Twitter</span>
            <span>LinkedIn</span>
            <span>GitHub</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
