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
import Dashboard from './components/Dashboard'
import VoiceOrb from './components/VoiceOrb'
import ChatHistory from './components/ChatHistory'
import LessonNotesPanel from './components/LessonNotesPanel'
import useSpeechRecognition from './hooks/useSpeechRecognition'
import useSpeechSynthesis from './hooks/useSpeechSynthesis'
import useChat from './hooks/useChat'
import MathRenderer from './components/MathRenderer'
import MathChallenge from './components/MathChallenge'
import { BookOpen, Mic, Square, Volume2, MessageSquare, ChevronLeft } from 'lucide-react'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [persistenceMode, setPersistenceMode] = useState('firebase') 
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [currentView, setCurrentView] = useState('landing') // 'landing' | 'pricing' | 'login' | 'privacy'

  // Curriculum & Lesson State
  const [activeStandard, setActiveStandard] = useState(null)
  const [activeSkill, setActiveSkill] = useState(null)
  const [whiteboardBlocks, setWhiteboardBlocks] = useState([])
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [pendingLessonStart, setPendingLessonStart] = useState(false)
  const [activeTab, setActiveTab] = useState('board') // 'board' | 'chat'

  const { isListening, transcript, startListening, stopListening, error: recogError, setTranscript } = useSpeechRecognition((finalText) => {
    if (finalText.trim() !== '' && !isProcessing) {
      setLastActivity(Date.now());
      sendMessage(finalText);
      setTranscript('');
    }
  });

  const { isSpeaking, speak, cancel: cancelSpeak } = useSpeechSynthesis();

  // Chat Logic Hook
  const { isProcessing, sendMessage } = useChat({
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
    // 1. GLOBAL SAFETY VALVE: Never hang more than 3s
    const safetyValve = setTimeout(() => {
      console.warn("Safety valve triggered: Force clearing loading states.");
      setAuthLoading(false);
      setProfileLoading(false);
    }, 3000);

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setProfileLoading(true)
      
      try {
        if (currentUser) {
          const profDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (profDoc.exists()) {
            setUserProfile(profDoc.data())
          }
        } else {
          setUserProfile(null)
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setProfileLoading(false)
        setAuthLoading(false)
        clearTimeout(safetyValve);
      }
    });

    return () => {
      unsub();
      clearTimeout(safetyValve);
    }
  }, [])

  // Messages Sync (Isolated by Skill)
  useEffect(() => {
    setMessages([]);
    if (!user || !activeSkill) return;

    const q = query(
      collection(db, `chats/${user.uid}/skills/${activeSkill.id}/messages`),
      orderBy('timestamp', 'desc'),
      limit(50)
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setMessages(msgs.reverse())
    });
    return () => unsub()
  }, [user, activeSkill])

  const saveMessage = async (role, content) => {
    if (!user || !activeSkill) return;
    const msgData = { role, content, timestamp: serverTimestamp() };
    try {
      await addDoc(collection(db, `chats/${user.uid}/skills/${activeSkill.id}/messages`), msgData);
    } catch (err) {
      console.error("Save message error:", err);
    }
  };

  const handleSelectStandard = (std) => {
    const firstSkill = std.skills?.[0];
    setActiveStandard(std);
    setActiveSkill(firstSkill);
    setWhiteboardBlocks([]);
    setMessages([]);
    setPendingLessonStart(true);
  }

  // Handle Lesson Start
  useEffect(() => {
    if (pendingLessonStart && activeSkill) {
      const timer = setTimeout(() => {
        sendMessage("start");
        setPendingLessonStart(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pendingLessonStart, activeSkill, sendMessage])

  const handleChallengeResult = (isCorrect, userAnswer) => {
    setLastActivity(Date.now());
    const signal = isCorrect
      ? `[CHALLENGE_RESULT: CORRECT, answer: ${userAnswer}]`
      : `[CHALLENGE_RESULT: INCORRECT, answer: ${userAnswer}]`;
    setTimeout(() => {
      setActiveChallenge(null);
      sendMessage(signal);
    }, 600);
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

  // VIEW ROUTING
  if (!user) {
    if (currentView === 'login') return <LoginScreen onBack={() => setCurrentView('landing')} />;
    if (currentView === 'pricing') return <PricingPage onBack={() => setCurrentView('landing')} onSelectPlan={() => setCurrentView('login')} />;
    if (currentView === 'privacy') return <PrivacyPolicy onBackClick={() => setCurrentView('landing')} />;
    return <LandingPage 
      onLoginClick={() => setCurrentView('login')} 
      onPricingClick={() => setCurrentView('pricing')} 
      onPrivacyClick={() => setCurrentView('privacy')} 
    />;
  }

  // Authenticated State Preparation
  const effectiveProfile = userProfile || {
    name: user.displayName || 'Student',
    country: 'US',
    grade: '6',
    learning_path_id: 'us_grade_6'
  };

  // Authenticated: Dashboard or Tutor
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

  if (activeStandard) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="logo-section" onClick={() => setActiveStandard(null)}>
            <ChevronLeft size={24} style={{ cursor: 'pointer' }} />
            <span className="skill-tag">{activeStandard.id}</span>
            <h1 className="logo-compact">{activeSkill?.title || 'Learning'}</h1>
          </div>
          <div className="user-section">
            <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="Avatar" className="avatar" />
            <button className="signout-btn" onClick={() => { cancelSpeak(); signOut(auth); }}>Sign Out</button>
          </div>
        </header>

        <main className="main-content split-view">
          <section className={`part-a ${activeTab === 'board' ? 'tab-active' : ''}`}>
            <div className="row-c">
              <LessonNotesPanel
                lesson={activeStandard}
                whiteboardBlocks={whiteboardBlocks}
                currentChapterId={1}
                onChapterChange={() => {}}
              />
            </div>
          </section>

          <section className={`part-b ${activeTab === 'chat' ? 'tab-active' : ''}`}>
            <div className="row-e">
              <div className="orb-section">
                <VoiceOrb isListening={isListening} isSpeaking={isSpeaking} isProcessing={isProcessing} transcript={transcript} onClick={handleOrbClick} error={recogError} />
              </div>
            </div>
            <div className="row-f">
              <div className="chat-section">
                <ChatHistory messages={messages} />
              </div>
            </div>
          </section>

          <nav className="mobile-tab-bar">
            <button className={`tab-btn ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}><BookOpen size={20} />Board</button>
            <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}><MessageSquare size={20} />Chat</button>
          </nav>
        </main>
      </div>
    );
  }

  return (
    <Dashboard 
      user={user} 
      profile={effectiveProfile} 
      onSelectStandard={handleSelectStandard}
      onSettingsClick={() => setCurrentView('settings')}
    />
  );
}

export default App;
