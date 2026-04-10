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
import MathRenderer from './components/MathRenderer'
import MathChallenge from './components/MathChallenge'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [persistenceMode, setPersistenceMode] = useState('firebase') // 'firebase' or 'local'
  const [isProcessing, setIsProcessing] = useState(false)
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
      handleUserSpeechContent(finalText);
      setTranscript('');
    }
  });

  const { isSpeaking, speak, cancel: cancelSpeak } = useSpeechSynthesis();

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

  // Messages Sync - Handles both Firebase and Local fallback
  useEffect(() => {
    if (!user) return;

    if (persistenceMode === 'firebase') {
      const q = query(
        collection(db, `chats/${user.uid}/messages`),
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
      const localKey = `nova_chat_${user.uid}`;
      const saved = localStorage.getItem(localKey);
      if (saved) setMessages(JSON.parse(saved));
    }
  }, [user, persistenceMode])

  const saveMessage = async (role, content) => {
    if (!user) return;
    const msgData = { role, content, timestamp: serverTimestamp() };

    if (persistenceMode === 'firebase') {
      try {
        await addDoc(collection(db, `chats/${user.uid}/messages`), msgData);
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
    const localKey = `nova_chat_${user.uid}`;
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
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/lessons/${lessonId}`)
      const data = await resp.json()
      setActiveLesson(data)
      setCurrentChapterId(1)
      setLastActivity(Date.now())
      setTimeout(() => handleUserSpeechContent("start"), 800);
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
      handleUserSpeechContent(signal);
    }, 600);
  };

  const handleUserSpeechContent = async (text) => {
    if (!user || !text.trim()) return;
    setIsProcessing(true);
    setLastActivity(Date.now());

    try {
      const isInternalSignal = text.startsWith("[") || text === "start";
      if (!isInternalSignal) await saveMessage('user', text);

      const recentHistory = messages.slice(-15).map(m => ({ role: m.role, content: m.content }));
      const lessonContext = activeLesson ? {
        title: activeLesson.title,
        chapters: activeLesson.chapters.map(c => ({ id: c.id, title: c.title, summary: c.summary }))
      } : null;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: recentHistory, userName: user.displayName || 'Student', lessonContext })
      });

      if (!response.ok) {
        if (response.status === 403) throw new Error("Backend Access Denied (403). Possible Groq API Key issue.");
        throw new Error(`Server Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      let spokenText = '';
      let processedWriteIdx = -1;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullReply += chunk;

        const chapterMatch = fullReply.match(/\[\[CHAPTER:(\d+)\]\]/);
        if (chapterMatch) {
          const newId = parseInt(chapterMatch[1]);
          if (newId !== currentChapterId) setCurrentChapterId(newId);
        }

        if (fullReply.includes("[[CLEAR]]")) setWhiteboardBlocks([]);

        const mathMatch = fullReply.match(/\[\[MATH_QUESTION:\s*"([^"]+)",\s*"([^"]+)"\]\]/);
        if (mathMatch && !activeChallenge) {
          setActiveChallenge({ question: mathMatch[1], answer: mathMatch[2] });
        }

        const writeMatches = [...fullReply.matchAll(/\[\[WRITE:\s*"([^"]+)"\]\]/g)];
        if (writeMatches.length > processedWriteIdx + 1) {
          processedWriteIdx = writeMatches.length - 1;
          setWhiteboardBlocks(prev => [...prev, { id: Date.now(), content: writeMatches[processedWriteIdx][1] }]);
        }

        const newlyAdded = fullReply.substring(spokenText.length);
        const sentenceMatch = newlyAdded.match(/[^.!?]+[.!?]/g);
        if (sentenceMatch) {
          for (const sentence of sentenceMatch) {
            const cleanSentence = sentence.replace(/\[\[.*?\]\]/g, '').trim();
            if (cleanSentence) speak(cleanSentence, true);
            spokenText += newlyAdded.substring(0, newlyAdded.indexOf(sentence) + sentence.length);
          }
        }
      }

      const remaining = fullReply.substring(spokenText.length).replace(/\[\[.*?\]\]/g, '').trim();
      if (remaining) speak(remaining, true);

      setLastActivity(Date.now());
      await saveMessage('assistant', fullReply.replace(/\[\[.*?\]\]/g, '').trim());

    } catch (err) {
      console.error("Chat Error:", err);
      speak(`I encountered an error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
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
            <section className="part-a">
              <div className="row-c">
                <LessonNotesPanel 
                  lesson={activeLesson} 
                  whiteboardBlocks={whiteboardBlocks}
                  currentChapterId={currentChapterId}
                  onChapterChange={setCurrentChapterId}
                />
              </div>
              <div className="row-d">
                {activeChallenge ? (
                  <MathChallenge 
                    question={activeChallenge.question} 
                    correctAnswer={activeChallenge.answer}
                    onResult={handleChallengeResult}
                  />
                ) : (
                  <div className="interaction-placeholder">
                    <div className="status-badge">Nova is Active</div>
                    <p>Listen to Nova's instructions. When she has a question for you, it will appear here.</p>
                  </div>
                )}
              </div>
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
