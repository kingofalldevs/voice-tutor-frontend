import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase/config'
import LoginScreen from './components/LoginScreen'
import VoiceOrb from './components/VoiceOrb'
import ChatHistory from './components/ChatHistory'
import LessonPickerModal from './components/LessonPickerModal'
import LessonNotesPanel from './components/LessonNotesPanel'
import useSpeechRecognition from './hooks/useSpeechRecognition'
import useSpeechSynthesis from './hooks/useSpeechSynthesis'
import useChat from './hooks/useChat'
import MathRenderer from './components/MathRenderer'
import MathChallenge from './components/MathChallenge'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [persistenceMode, setPersistenceMode] = useState('firebase') // 'firebase' or 'local'
  const [isProcessingLocal, setIsProcessingLocal] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  // Lesson & Challenge State
  const [activeLesson, setActiveLesson] = useState(null)
  const [currentChapterId, setCurrentChapterId] = useState(1)
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [whiteboardBlocks, setWhiteboardBlocks] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())

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
    activeLesson,
    currentChapterId,
    setCurrentChapterId,
    setWhiteboardBlocks,
    setActiveChallenge,
    setLastActivity,
    speak
  });

  // Silence Monitor
  useEffect(() => {
    if (!activeLesson || isProcessing || isSpeaking || isListening || activeChallenge) return;
    const silenceCheck = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      if (idleTime > 15000) {
        setLastActivity(Date.now());
        handleUserSpeechContent("[USER_SILENCE]");
      }
    }, 5000);
    return () => clearInterval(silenceCheck);
  }, [activeLesson, isProcessing, isSpeaking, isListening, lastActivity, activeChallenge]);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
      if (currentUser) setShowPicker(true);
    })
    return () => unsub()
  }, [])

  // Messages Sync - Handles both Firebase and Local fallback (Isolated by Lesson)
  useEffect(() => {
    if (!user || !activeLesson) {
      setMessages([]);
      return;
    }

    if (persistenceMode === 'firebase') {
      const q = query(
        collection(db, `chats/${user.uid}/lessons/${activeLesson.id}/messages`),
        orderBy('timestamp', 'desc'),
        limit(50)
      )
      const unsub = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setMessages(msgs.reverse())
      }, (error) => {
        if (error.code === 'permission-denied') {
          console.warn("Firestore permissions denied. Switching to Local Storage fallback.");
          setPersistenceMode('local');
        }
      });
      return () => unsub()
    } else {
      // Local Storage Fallback
      const localKey = `nova_chat_${user.uid}_${activeLesson.id}`;
      const saved = localStorage.getItem(localKey);
      setMessages(saved ? JSON.parse(saved) : []);
    }
  }, [user, activeLesson, persistenceMode])

  const saveMessage = async (role, content) => {
    if (!user || !activeLesson) return;
    const msgData = { role, content, timestamp: serverTimestamp() };

    if (persistenceMode === 'firebase') {
      try {
        await addDoc(collection(db, `chats/${user.uid}/lessons/${activeLesson.id}/messages`), msgData);
      } catch (err) {
        if (err.code === 'permission-denied' || err.message.includes('permission')) {
          setPersistenceMode('local');
          saveToLocal(role, content);
        }
      }
    } else {
      saveToLocal(role, content);
    }
  };

  const saveToLocal = (role, content) => {
    if (!activeLesson) return;
    const localKey = `nova_chat_${user.uid}_${activeLesson.id}`;
    const msg = { role, content, timestamp: new Date().toISOString(), id: Date.now() };
    setMessages(prev => {
      const updated = [...prev, msg];
      localStorage.setItem(localKey, JSON.stringify(updated.slice(-50)));
      return updated;
    });
  };

  const handleLessonSelect = async (lessonId) => {
    setShowPicker(false)
    setActiveChallenge(null)
    setWhiteboardBlocks([])
    setMessages([]) // Immediate local cleanup
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/lessons/${lessonId}`)
      const data = await resp.json()
      setActiveLesson(data)
      setCurrentChapterId(1)
      setLastActivity(Date.now())
      setTimeout(() => sendMessage("start"), 800);
    } catch (err) {
      console.error("Error loading lesson:", err)
    }
  }

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
  if (!user) return <LoginScreen />;

  return (
    <div className="app-container">
      {showPicker && <LessonPickerModal onSelect={handleLessonSelect} onDismiss={() => setShowPicker(false)} />}

      <header className="app-header">
        <h1 className="logo"
          onMouseEnter={() => setShowDiagnostics(true)}
          onMouseLeave={() => setShowDiagnostics(false)}>
          Nova AI
        </h1>
        {showDiagnostics && (
          <div className="diagnostic-popup">
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Project:</strong> {db.app.options.projectId}</p>
            <p><strong>Storage:</strong> {persistenceMode}</p>
          </div>
        )}
        <div className="user-section">
          {persistenceMode === 'local' && <span className="local-badge" title="Firestore Permissions Denied. Using Local memory.">Local Sync</span>}
          <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="Avatar" className="avatar" />
          <button className="signout-btn" onClick={() => { cancelSpeak(); signOut(auth); }}>Sign Out</button>
        </div>
      </header>

      <main className={`main-content ${activeLesson ? 'split-view' : ''}`}>
        {activeLesson ? (
          <>
            {/* PART A: Left 75% */}
            <section className={`part-a ${activeChallenge ? 'has-challenge' : 'no-challenge'}`}>
              <div className="row-c">
                <LessonNotesPanel
                  lesson={activeLesson}
                  whiteboardBlocks={whiteboardBlocks}
                  currentChapterId={currentChapterId}
                  onChapterChange={setCurrentChapterId}
                />
              </div>
              {activeChallenge && (
                <div className="row-d">
                  <MathChallenge
                    question={activeChallenge.question}
                    correctAnswer={activeChallenge.answer}
                    onResult={handleChallengeResult}
                  />
                </div>
              )}
            </section>

            {/* PART B: Right 25% */}
            <section className="part-b">
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
          </>
        ) : (
          <div className="welcome-placeholder">
            <h2>Akwaaba! Select a lesson to begin.</h2>
            <button className="primary-btn" onClick={() => setShowPicker(true)}>Open Lesson Catalog</button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
