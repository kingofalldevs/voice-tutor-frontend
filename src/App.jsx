import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import LandingPage from './components/LandingPage'
import PricingPage from './components/PricingPage'
import LoginScreen from './components/LoginScreen'
import PrivacyPolicy from './components/PrivacyPolicy'
import SettingsPage from './components/SettingsPage'
import CourseExplorerModal from './components/CourseExplorerModal'
import ChatHistory from './components/ChatHistory'
import LessonNotesPanel from './components/LessonNotesPanel'
import useSpeechRecognition from './hooks/useSpeechRecognition'
import useSpeechSynthesis from './hooks/useSpeechSynthesis'
import useChat from './hooks/useChat'
import { BookOpen, MessageSquare, ChevronRight, ChevronDown } from 'lucide-react'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [currentView, setCurrentView] = useState('landing')

  // Curriculum & Lesson State
  const [activeStandard, setActiveStandard] = useState(null)
  const [activeSkill, setActiveSkill] = useState(null)
  const [whiteboardBlocks, setWhiteboardBlocks] = useState([])
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [pendingLessonStart, setPendingLessonStart] = useState(false)
  const [activeTab, setActiveTab] = useState('board')
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  const { isListening, transcript, startListening, stopListening, error: recogError, setTranscript } = useSpeechRecognition((finalText) => {
    if (finalText.trim() !== '' && !isProcessing) {
      setLastActivity(Date.now());
      sendMessage(finalText);
      setTranscript('');
    }
  });

  const { isSpeaking, speak, cancel: cancelSpeak } = useSpeechSynthesis();

  const [messages, setMessages] = useState([]);

  const { isProcessing, sendMessage, streamedReply } = useChat({
    user,
    messages,
    saveMessage: (role, content) => saveMessage(role, content),
    activeLesson: activeStandard,
    currentSkillId: activeSkill?.id,
    setWhiteboardBlocks,
    setLastActivity,
    speak
  });

  // Auth Listener + Profile Fetch
  useEffect(() => {
    const safetyValve = setTimeout(() => {
      setAuthLoading(false);
      setProfileLoading(false);
    }, 3000);

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setProfileLoading(true);
      try {
        if (currentUser) {
          const profDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (profDoc.exists()) setUserProfile(profDoc.data());
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setProfileLoading(false);
        setAuthLoading(false);
        clearTimeout(safetyValve);
      }
    });

    return () => { unsub(); clearTimeout(safetyValve); };
  }, []);

  // Messages Sync (Isolated by Skill)
  useEffect(() => {
    setMessages([]);
    if (!user || !activeSkill) return;

    const q = query(
      collection(db, `chats/${user.uid}/skills/${activeSkill.id}/messages`),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs.reverse());
    });
    return () => unsub();
  }, [user, activeSkill]);

  const saveMessage = async (role, content) => {
    if (!user || !activeSkill) return;
    try {
      await addDoc(
        collection(db, `chats/${user.uid}/skills/${activeSkill.id}/messages`),
        { role, content, timestamp: serverTimestamp() }
      );
    } catch (err) {
      console.error('Save message error:', err);
    }
  };

  const handleSelectStandard = (std) => {
    const firstSkill = (std.skills && std.skills.length > 0) ? std.skills[0] : { id: std.id, title: std.title };
    setActiveStandard(std);
    setActiveSkill(firstSkill);
    setWhiteboardBlocks([]);
    setMessages([]);
    setPendingLessonStart(true);
    setIsCourseMenuOpen(false); // Close modal when a course is chosen
  };

  // Auto-start lesson
  useEffect(() => {
    if (pendingLessonStart && activeSkill) {
      const timer = setTimeout(() => {
        sendMessage('start');
        setPendingLessonStart(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pendingLessonStart, activeSkill, sendMessage]);

  const handleBoardInteraction = (data) => {
    const { id, selected } = data;
    sendMessage(`[ACTION: id=${id}, selected=${selected}]`);
  };

  const handleOrbClick = () => {
    setLastActivity(Date.now());
    if (isSpeaking) cancelSpeak();
    else if (isListening) stopListening();
    else {
      if (isProcessing) return;
      cancelSpeak();
      startListening();
    }
  };

  if (authLoading) return <div className="loading-screen">Loading Nova...</div>;

  // Unauthenticated routing
  if (!user) {
    if (currentView === 'login')   return <LoginScreen onBack={() => setCurrentView('landing')} />;
    if (currentView === 'pricing') return <PricingPage onBack={() => setCurrentView('landing')} onSelectPlan={() => setCurrentView('login')} />;
    if (currentView === 'privacy') return <PrivacyPolicy onBackClick={() => setCurrentView('landing')} />;
    return (
      <LandingPage
        onLoginClick={() => setCurrentView('login')}
        onPricingClick={() => setCurrentView('pricing')}
        onPrivacyClick={() => setCurrentView('privacy')}
      />
    );
  }

  const effectiveProfile = userProfile || {
    name: user.displayName || 'Student',
    country: 'US',
    grade: '6',
    learning_path_id: 'us_grade_6'
  };

  // Settings page
  if (currentView === 'settings') {
    return (
      <SettingsPage
        user={user}
        profile={effectiveProfile}
        onBack={() => setCurrentView('dashboard')}
        onUpdateProfile={(newProfile) => setUserProfile(newProfile)}
      />
    );
  }

  // ── TUTOR VIEW ──
    const firstName = (effectiveProfile.name || 'Student').split(' ')[0];
    const initials = firstName.charAt(0).toUpperCase();

    return (
      <div className="app-container">
        {/* OVERLAYS */}
        {(!activeStandard || isCourseMenuOpen) && (
          <CourseExplorerModal 
            user={user}
            onClose={() => setIsCourseMenuOpen(false)}
            onSelectCourse={handleSelectStandard}
          />
        )}

        {/* HEADER */}
        <header className="app-header">
          <div className="header-left">
            <span className="header-brand">MathNova</span>
            <div className="header-divider" />
            <button className="courses-nav-btn" onClick={() => setIsCourseMenuOpen(true)}>
              <BookOpen size={16} /> Courses
            </button>
            {activeStandard && (
              <>
                <ChevronRight size={14} className="header-crumb-sep" />
                <span className="info-badge">Grade {activeStandard.grade || '1'}</span>
                <span className="header-crumb">{activeStandard.title}</span>
              </>
            )}
          </div>

          <div className="header-right">
            <div 
              className={`user-account-switcher ${isAccountMenuOpen ? 'open' : ''}`} 
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            >
              <div className="student-avatar-pill">
                <div className="student-initials">{initials}</div>
                <span className="user-name-label hide-mobile">{firstName}</span>
              </div>
              <ChevronDown size={14} className="account-chevron" />
              
              {isAccountMenuOpen && (
                <div className="account-dropdown">
                  <button className="dropdown-action danger" onClick={() => { cancelSpeak(); signOut(auth); }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN SPLIT */}
        <main className="main-content split-view">
          {/* LEFT — Whiteboard */}
          <section className={`part-a ${activeTab === 'board' ? 'tab-active' : ''}`}>
            <div className="row-c">
              <LessonNotesPanel
                lesson={activeStandard}
                whiteboardBlocks={whiteboardBlocks}
                onBoardInteract={handleBoardInteraction}
              />
            </div>
          </section>

          {/* RIGHT — Nova Chat */}
          <section className={`part-b ${activeTab === 'chat' ? 'tab-active' : ''}`}>
            <ChatHistory
              messages={messages}
              isSpeaking={isSpeaking}
              isListening={isListening}
              isProcessing={isProcessing}
              streamedReply={streamedReply}
              onSend={(text) => {
                if (text !== 'start' && !text.startsWith('[')) {
                  setMessages(prev => [...prev, { 
                    id: `opt_${Date.now()}`, 
                    role: 'user', 
                    content: text, 
                    timestamp: new Date() 
                  }]);
                }
                sendMessage(text);
              }}
              onToggleMic={handleOrbClick}
            />
          </section>

          {/* Mobile tab bar */}
          <nav className="mobile-tab-bar">
            <button
              className={`tab-btn ${activeTab === 'board' ? 'active' : ''}`}
              onClick={() => setActiveTab('board')}
            >
              <BookOpen size={20} /> Board
            </button>
            <button
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={20} /> Chat
            </button>
          </nav>
        </main>
      </div>

    );
}

export default App;
