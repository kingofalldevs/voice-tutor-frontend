import React, { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Settings, Star, TrendingUp, RefreshCw, Brain, Menu, X, Eye, EyeOff, LogOut } from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import './Dashboard.css';

export default function Dashboard({ user, profile, onSelectStandard, onSettingsClick }) {
  const [standards, setStandards] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showScore, setShowScore] = useState(true);

  const [fetchError, setFetchError] = useState(null);

  const [visibleCounts, setVisibleCounts] = useState({
    "Elementary School": 6,
    "Middle School": 6,
    "High School": 6
  });

  useEffect(() => {
    if (user?.uid) {
      fetchData();
    }
  }, [user]);

  const loadMore = (category) => {
    setVisibleCounts(prev => ({
      ...prev,
      [category]: prev[category] + 12
    }));
  const fetchData = async (isManual = false) => {
    setLoading(true);
    setFetchError(null);
    
    // Extended timeout for scraping all grades
    const timeout = setTimeout(() => {
      if (Object.keys(standards).length === 0) {
        setLoading(false);
        setFetchError("Connection timed out. Retrieving the full academy curriculum...");
      }
    }, 20000);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://voice-tutor-backend.onrender.com';
      const cacheBust = isManual ? `?t=${Date.now()}` : '';
      
      const [allResp, progResp] = await Promise.all([
        fetch(`${baseUrl}/curriculum/all${cacheBust}`),
        fetch(`${baseUrl}/progress/${user.uid}${cacheBust}`)
      ]);

      if (!allResp.ok) throw new Error(`Server returned ${allResp.status}`);
      
      const allData = await allResp.json();
      const progData = await progResp.json();
      
      setStandards(allData); // Now an object with keys: Elementary, Middle, High
      setProgress(progData);
      clearTimeout(timeout);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setFetchError(err.message);
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null;
    const visibleItems = items.slice(0, visibleCounts[title]);
    const hasMore = items.length > visibleCounts[title];

    return (
      <div className="curriculum-category-section" key={title}>
        <div className="category-header">
          <div className="cat-icon-blob"></div>
          <h2>{title}</h2>
          <span className="count-pill">{items.length} MODULES</span>
        </div>
        
        <div className="standard-grid">
          {visibleItems.map((std) => {
            const masteryVal = getStandardProgress(std);
            return (
              <div 
                key={std.id} 
                className="standard-card"
                onClick={() => onSelectStandard(std)}
              >
                <div className="card-top-info">
                  <div className="standard-tag">{std.domain}</div>
                  <div className="grade-badge">GRADE {std.grade}</div>
                </div>
                <h3>{std.title}</h3>
                <p>{std.description}</p>
                
                <footer className="standard-footer">
                  <div className="mastery-progress">
                    <div className="progress-circle" style={{ '--progress': `${masteryVal}%` }}>
                      <span className="progress-val">{masteryVal}%</span>
                    </div>
                  </div>
                  <button className="start-btn">
                    <span className="btn-text">Start Class</span>
                    <ArrowRight size={20} />
                  </button>
                </footer>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="load-more-container">
            <button className="load-more-btn" onClick={() => loadMore(title)}>
              Discover More In {title} <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const getStandardProgress = (std) => {
    // If skimming mode enabled on backend, we skip mastery in the main list for speed
    if (!std.skills || std.skills.length === 0) return 0;
    let totalMastery = 0;
    std.skills.forEach(skill => {
      if (progress[skill.id]) {
        totalMastery += (progress[skill.id].mastery || 0) * 100;
      }
    });
    return Math.round(totalMastery / std.skills.length);
  };

  if (loading) return <div className="loading-screen">Loading Curriculum...</div>;

  return (
    <div className="dashboard-container">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <nav className="dashboard-nav">
        <div className="dash-nav-left">
          <div className="dash-logo">
            <Brain size={24} className="logo-sparkle" />
            <h1>MathNova</h1>
          </div>
        </div>

        <div className="dash-nav-center">
          <div className="nav-tab active">
            <BookOpen size={18} />
            <span>Learning</span>
          </div>
          <div className="nav-tab">
            <Star size={18} />
            <span>Success</span>
          </div>
        </div>

        <div className="dash-nav-right">
          <div className="nav-settings-tab" onClick={onSettingsClick}>
            <Settings size={20} />
            <span className="hide-mobile">Settings</span>
          </div>
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsSidebarOpen(false)}>
          <div className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="dash-logo">
                <Brain className="logo-sparkle" size={24} />
                <h1>MathNova</h1>
              </div>
              <button className="close-drawer" onClick={() => setIsSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="drawer-links">
              <div className="drawer-link active" onClick={() => setIsSidebarOpen(false)}>
                <BookOpen size={20}/> <span>My Courses</span>
              </div>
              <div className="drawer-link" onClick={() => setIsSidebarOpen(false)}>
                <TrendingUp size={20}/> <span>Analytics</span>
              </div>
              <div className="drawer-link" onClick={() => setIsSidebarOpen(false)}>
                <Star size={20}/> <span>Achievements</span>
              </div>
              <div className="drawer-divider"></div>
              <div className="drawer-link" onClick={onSettingsClick}>
                <Settings size={20}/> <span>Settings</span>
              </div>
              <div className="drawer-link" onClick={() => signOut(auth)}>
                <LogOut size={20}/> <span>Sign Out</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-main-layout">

        <div className="dash-content-area">
          <header className="dash-hero">
            <div className="hero-text">
              <span className="hero-greeting">WELCOME BACK, {profile?.name?.toUpperCase() || 'STUDENT'}</span>
              <h1>Ready to master math today?</h1>
              <p>Choose a course to start a class with Professor Nova</p>
            </div>
            <div className="hero-stats-mini">
              <div className="mini-stat">
                <strong>{showScore ? '12' : '••'}</strong>
                <span>Lessons</span>
              </div>
              <div className="mini-stat privacy-stat">
                <strong>{showScore ? '85%' : '••%'}</strong>
                <span>Score</span>
                <button 
                  className="privacy-toggle" 
                  onClick={() => setShowScore(!showScore)}
                  title={showScore ? "Hide progress" : "Show progress"}
                >
                  {showScore ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </header>

          <section className="dashboard-content-grid">
            {fetchError && (
              <div className="connection-error-alert">
                <RefreshCw size={20} className="spin-slow" />
                <p><strong>Connection Issue:</strong> {fetchError}</p>
                <button onClick={() => fetchData(true)}>Try Reconnecting</button>
              </div>
            )}

            {Object.keys(standards).length > 0 ? (
              <div className="categorized-academy-view">
                {renderSection("Elementary School", standards["Elementary School"])}
                {renderSection("Middle School", standards["Middle School"])}
                {renderSection("High School", standards["High School"])}
              </div>
            ) : (
              <div className="discovery-empty-state">
                <div className="discovery-header">
                  <h3>Mastery Categories</h3>
                  <button className="refresh-min" onClick={() => fetchData(true)}><RefreshCw size={14}/> Sync</button>
                </div>
                
                <div className="placeholder-grid">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="placeholder-card-elite">
                      <div className="skeleton-tag"></div>
                      <div className="skeleton-title"></div>
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line short"></div>
                      <div className="card-badge-status">Coming Soon: {profile?.country} Level {profile?.grade}</div>
                    </div>
                  ))}
                </div>
                
                <div className="empty-action-box">
                  <div className="action-icon-wrap"><TrendingUp size={32}/></div>
                  <div className="action-text">
                    <h4>{fetchError ? 'Unable to reach Nova' : 'Tailoring your curriculum...'}</h4>
                    <p>{fetchError || `Nova is curating the perfect learning path for Grade ${profile?.grade}. We'll notify you once your custom math modules are live.`}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
