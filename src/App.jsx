import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase/config'
import { seedLessons } from './firebase/seed' // Import seeder
import LoginScreen from './components/LoginScreen'
import VoiceOrb from './components/VoiceOrb'
import ChatHistory from './components/ChatHistory'
import LessonSelector from './components/LessonSelector' // Import Selector
import useSpeechRecognition from './hooks/useSpeechRecognition'
import useSpeechSynthesis from './hooks/useSpeechSynthesis'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Lesson Logic State
  const [activeLesson, setActiveLesson] = useState(null)
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    error: recogError, 
    setTranscript 
  } = useSpeechRecognition((finalText) => {
    // This callback fires exactly when a final result is ready
    if (finalText.trim() !== '' && !isProcessing) {
      handleUserSpeechContent(finalText);
      setTranscript('');
    }
  });

  const { isSpeaking, speak, cancel: cancelSpeak } = useSpeechSynthesis();

  // Handle Authentication
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
      // Auto-seed for development
      if (currentUser) seedLessons()
    })
    return () => unsub()
  }, [])

  // Handle Fetching Messages
  useEffect(() => {
    if (!user) return;
    // Increased limit to 50 for better context retention
    const q = query(
      collection(db, `chats/${user.uid}/messages`),
      orderBy('timestamp', 'desc'),
      limit(50)
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // Reverse to show chronological: [oldest ... newest]
      setMessages(msgs.reverse())
    })
    return () => unsub()
  }, [user])

  const handleUserSpeechContent = async (text) => {
    if (!user || !text.trim()) return;
    setIsProcessing(true);

    try {
      // 1. Background save user message
      addDoc(collection(db, `chats/${user.uid}/messages`), {
        role: 'user',
        content: text,
        timestamp: serverTimestamp()
      }).catch(err => console.error("Firestore Error:", err));

      // 2. Prepare context for token-efficient teaching
      const currentSection = activeLesson?.sections[currentSectionIdx];
      const lessonContext = activeLesson ? {
        lessonTitle: activeLesson.title,
        sectionTitle: currentSection.title,
        sectionContent: currentSection.content,
        isLast: currentSectionIdx === activeLesson.sections.length - 1
      } : null;

      // 3. Fetch with streaming support
      const apiUrl = import.meta.env.VITE_API_URL + '/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          history: recentHistory,
          userName: user.displayName || 'Student',
          lessonContext
        })
      });

      if (!response.ok) throw new Error('API Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      let spokenText = ''; // Track already spoken text to find new sentences

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullReply += chunk;

        // Process new speakable sentences from the buffer
        // match all sentences ending in punctuation
        const newlyAdded = fullReply.substring(spokenText.length);
        const sentenceMatch = newlyAdded.match(/[^.!?]+[.!?]/g);
        
        if (sentenceMatch) {
          for (const sentence of sentenceMatch) {
            const cleanSentence = sentence.trim();
            if (cleanSentence) {
              speak(cleanSentence, true); // Append to queue
              spokenText += newlyAdded.substring(0, newlyAdded.indexOf(sentence) + sentence.length);
            }
          }
        }
      }

      // Final check for any dangling text without punctuation
      const remaining = fullReply.substring(spokenText.length).trim();
      if (remaining) {
        speak(remaining, true);
      }

      // 3. Background save AI reply
      addDoc(collection(db, `chats/${user.uid}/messages`), {
        role: 'assistant',
        content: fullReply,
        timestamp: serverTimestamp()
      }).catch(err => console.error("Firestore Error:", err));

    } catch (err) {
      console.error("Conversation Error:", err);
      speak("I encountered a connection error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = () => {
    cancelSpeak();
    speak("Yeah you can ask your question but it must be on the topic plants");
    // Trigger listening briefly after notice
    setTimeout(() => startListening(), 2500);
  };

  const handleOrbClick = () => {
    if (isSpeaking) {
      cancelSpeak();
    } else if (isListening) {
      stopListening();
    } else {
      if (isProcessing) return;
      cancelSpeak();
      startListening();
    }
  };

  const handleSignOut = () => {
    cancelSpeak();
    signOut(auth);
  };

  if (authLoading) return <div className="loading-screen">Loading...</div>;

  if (!user) return <LoginScreen />;

  return (
    <div className="app-container">
      {!activeLesson && <LessonSelector onSelect={(l) => setActiveLesson(l)} />}
      
      <header className="app-header">
        <h1 className="logo">Nova Science</h1>
        <div className="user-section">
          <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="User Avatar" className="avatar" />
          <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
        </div>
      </header>

      <main className={`main-content ${activeLesson ? 'split-view' : ''}`}>
        {activeLesson && (
          <aside className="lesson-panel">
            <div className="lesson-header">
              <span className="badge">Lesson Mode</span>
              <h2>{activeLesson.title}</h2>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((currentSectionIdx + 1) / activeLesson.sections.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="lesson-notes scrollbar-hide">
              {activeLesson.sections.map((section, idx) => (
                <div 
                  key={section.id} 
                  className={`section-note ${idx === currentSectionIdx ? 'active' : ''}`}
                  onClick={() => setCurrentSectionIdx(idx)}
                >
                  <h4>{section.title}</h4>
                  <p>{section.content}</p>
                </div>
              ))}
            </div>
          </aside>
        )}

        <div className="chat-interface">
          <div className="orb-section">
            <VoiceOrb
              isListening={isListening}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
              transcript={transcript}
              onClick={handleOrbClick}
              error={recogError}
            />
            {activeLesson && (
              <div className="lesson-controls">
                <button className="ask-btn" onClick={handleAskQuestion}>Ask Question</button>
                <div className="nav-buttons">
                  <button disabled={currentSectionIdx === 0} onClick={() => setCurrentSectionIdx(p => p - 1)}>Back</button>
                  <button disabled={currentSectionIdx === activeLesson.sections.length - 1} onClick={() => setCurrentSectionIdx(p => p + 1)}>Next</button>
                </div>
              </div>
            )}
          </div>
          <div className="chat-section">
            <ChatHistory messages={messages} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
