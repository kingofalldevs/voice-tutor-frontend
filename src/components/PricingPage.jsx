import React from 'react';
import { Check, Shield, Zap, Star, ArrowLeft } from 'lucide-react';
import './PricingPage.css';

export default function PricingPage({ onBack, onSelectPlan }) {
  const plans = [
    {
      name: 'Pro',
      price: '15',
      description: 'Ideal for individual learners seeking mastery.',
      features: [
        'Unlimited AI Math Lessons',
        'Smart Whiteboard Interactivity',
        'Voice-First Teaching',
        'Global Standards Alignment',
        'Lesson History (30 Days)',
        'Basic Performance Tracking'
      ],
      icon: <Zap size={24} />,
      badge: null,
      cta: 'Start Pro Trial'
    },
    {
      name: 'Super',
      price: '20',
      description: 'For power users and ambitious families.',
      features: [
        'Everything in Pro',
        'Priority AI Voice Response',
        'Unlimited History Persistence',
        'Custom Learning Paths',
        'Parent Insight Dashboard',
        'Priority Chat Support'
      ],
      icon: <Star size={24} />,
      badge: 'Popular',
      cta: 'Get Super Now'
    }
  ];

  return (
    <div className="pricing-container animate-fade">
      <nav className="pricing-nav">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="pricing-logo">
          <img src="/logo.png" alt="Logo" />
          <span>Nova Academy</span>
        </div>
      </nav>

      <header className="pricing-header">
        <h1 className="pricing-title">Simple, Transparent Pricing</h1>
        <p className="pricing-subtitle">Invest in your child's future with the world's most advanced AI math tutor.</p>
      </header>

      <div className="pricing-grid">
        {plans.map((plan, index) => (
          <div key={index} className={`pricing-card ${plan.badge ? 'featured' : ''}`}>
            {plan.badge && <span className="card-badge">{plan.badge}</span>}
            <div className="card-icon">{plan.icon}</div>
            <h3 className="card-name">{plan.name}</h3>
            <div className="card-price">
              <span className="currency">$</span>
              <span className="amount">{plan.price}</span>
              <span className="period">/mo</span>
            </div>
            <p className="card-description">{plan.description}</p>

            <ul className="card-features">
              {plan.features.map((feature, fIndex) => (
                <li key={fIndex}>
                  <Check size={18} className="check-icon" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`card-cta ${plan.badge ? 'primary-btn' : 'secondary-btn'}`}
              onClick={() => onSelectPlan(plan.name)}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <footer className="pricing-footer">
        <div className="footer-info">
          <Shield size={20} />
          <span>Secure checkout. Cancel anytime. 14-day money-back guarantee.</span>
        </div>
      </footer>
    </div>
  );
}
