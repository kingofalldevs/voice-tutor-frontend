import React, { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Settings, Star, TrendingUp, RefreshCw, Brain, Menu, X, Eye, EyeOff } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard({ user, profile, onSelectStandard, onSettingsClick }) {
  const [standards, setStandards] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showScore, setShowScore] = useState(true);

  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (profile?.learning_path_id && user?.uid) {
      fetchData();
    }
  }, [profile, user]);

  const fetchData = async (isManual = false) => {
    setLoading(true);
    setFetchError(null);
    
    // Safety timeout for the loading screen (extended for mobile/cold starts)
    const timeout = setTimeout(() => {
      if (standards.length === 0) {
        setLoading(false);
        setFetchError("Connection timed out. Render server might be waking up. Please click Sync again in 10 seconds.");
      }
    }, 15000);

    try {
      // Use the ENV URL or fallback to the known production URL
      const baseUrl = import.meta.env.VITE_API_URL || 'https://voice-tutor-backend.onrender.com';
      console.log(`Nova Debug: Fetching from ${baseUrl} for path ${profile.learning_path_id}`);

      // Add a cache-buster if manual sync
      const cacheBust = isManual ? `?t=${Date.now()}` : '';
      
      const [stdResp, progResp] = await Promise.all([
        fetch(`${baseUrl}/curriculum/${profile.learning_path_id}${cacheBust}`),
        fetch(`${baseUrl}/progress/${user.uid}${cacheBust}`)
      ]);

      if (!stdResp.ok) throw new Error(`Server returned ${stdResp.status}`);
      
      const [stdData, progData] = await Promise.all([stdResp.json(), progResp.json()]);
      
      if (Array.isArray(stdData)) {
        setStandards(stdData);
      } else {
        throw new Error("Invalid curriculum data format received.");
      }
      
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

  const getStandardProgress = (std) => {
    if (!std.skills || std.skills.length === 0) return 0;
    let totalMastery = 0;
    std.skills.forEach(skill => {
      const skillProg = progress[skill.id];
      if (skillProg) totalMastery += skillProg.mastery || 0;
    });
    return Math.round((totalMastery / std.skills.length) * 100);
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
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
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
        </div>
      </nav>

      <main className="dashboard-main-layout">
        <aside className={`dash-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-links">
            <div className="side-link active"><BookOpen size={18}/> My Courses</div>
            <div className="side-link"><TrendingUp size={18}/> Analytics</div>
            <div className="side-link"><Star size={18}/> Achievements</div>
          </div>
        </aside>

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

            {standards.length > 0 ? (
              <div className="standard-grid">
                {standards.map((std) => {
                  const masteryVal = getStandardProgress(std);
                  return (
                    <div 
                      key={std.id} 
                      className="standard-card"
                      onClick={() => onSelectStandard(std)}
                    >
                      <div className="standard-tag">{std.domain}</div>
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
