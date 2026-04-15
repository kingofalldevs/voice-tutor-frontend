import React, { useEffect } from 'react';
import './PrivacyPolicy.css';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy({ onBackClick }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="privacy-container">
      <nav className="privacy-nav">
        <div className="nav-content">
          <button className="back-btn" onClick={onBackClick}>
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <div className="logo-section">
            <span className="logo-text">Nova AI</span>
          </div>
        </div>
      </nav>

      <main className="privacy-main">
        <header className="privacy-header">
          <div className="shield-icon">
            <ShieldCheck size={48} />
          </div>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: April 15, 2026</p>
        </header>

        <section className="privacy-content">
          <div className="policy-intro">
            <p>At Nova AI Academy, we are committed to protecting the privacy and security of our students and users. This Privacy Policy explains how we collect, use, and safeguard information when you use our AI math tutoring platform.</p>
          </div>

          <div className="policy-card">
            <div className="card-icon"><Eye size={24} /></div>
            <h2>Information We Collect</h2>
            <p>To provide a personalized learning experience, we collect the following types of information:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, and account preferences when you sign up.</li>
              <li><strong>Voice Data:</strong> Temporary audio processing to convert speech to text for interacting with Nova. We do not store raw audio files indefinitely.</li>
              <li><strong>Learning Progress:</strong> Data about lessons completed, math problems solved, and areas where a student may need more help.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with the platform to help us improve the tutor's effectiveness.</li>
            </ul>
          </div>

          <div className="policy-card">
            <div className="card-icon"><Lock size={24} /></div>
            <h2>How We Use Your Data</h2>
            <p>Your data is used strictly to enhance the learning journey:</p>
            <ul>
              <li>Personalizing math lessons to the student's current skill level.</li>
              <li>Providing real-time feedback and hints during problem-solving.</li>
              <li>Generating progress reports for parents and teachers.</li>
              <li>Improving our AI models to better understand mathematical explanations.</li>
            </ul>
          </div>

          <div className="policy-card">
            <div className="card-icon"><ShieldCheck size={24} /></div>
            <h2>Data Protection & Security</h2>
            <p>We implement industry-standard security measures to ensure your data remains private:</p>
            <ul>
              <li>All data transmission is encrypted using SSL/TLS technology.</li>
              <li>Voice processing occurs in secure, ephemeral environments.</li>
              <li>We never sell student data to third-party advertisers.</li>
              <li>Access to student data is strictly limited to authorized personnel only.</li>
            </ul>
          </div>

          <div className="policy-card">
            <div className="card-icon"><FileText size={24} /></div>
            <h2>Your Rights</h2>
            <p>As a user of Nova AI, you have the following rights regarding your information:</p>
            <ul>
              <li>The right to access and download a copy of your learning data.</li>
              <li>The right to request the deletion of your account and all associated data.</li>
              <li>The right to opt-out of optional data collection for model improvement.</li>
              <li>Parental control over child accounts and progress tracking.</li>
            </ul>
          </div>

          <div className="contact-footer">
            <h3>Questions about our privacy?</h3>
            <p>Contact our Data Protection Officer at <strong>privacy@nova-tutor-ai.com</strong></p>
          </div>
        </section>
      </main>

      <footer className="privacy-footer-simple">
        <p>&copy; 2026 Nova AI Academy. Standardized under Global Privacy Regulations.</p>
      </footer>
    </div>
  );
}
