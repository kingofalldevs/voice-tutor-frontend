import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase/config'
import LoginScreen from './components/LoginScreen'
import VoiceOrb from './components/VoiceOrb'
import ChatHistory from './components/ChatHistory'
import useSpeechRecognition from './hooks/useSpeechRecognition'
import useSpeechSynthesis from './hooks/useSpeechSynthesis'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  const { isListening, transcript, startListening, stopListening, error: recogError, setTranscript } = useSpeechRecognition();
  const { isSpeaking, speak, cancel: cancelSpeak } = useSpeechSynthesis();

  // Handle Authentication
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // Handle Fetching Messages
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `chats/${user.uid}/messages`),
      orderBy('timestamp', 'desc'),
      limit(20)
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // Reverse to show chronological
      setMessages(msgs.reverse())
    })
    return () => unsub()
  }, [user])

  // Handle voice transcript finish — fires when recognition ends with a result
  useEffect(() => {
    if (!isListening && transcript.trim() !== '' && !isProcessing) {
      handleUserSpeechContent(transcript);
      setTranscript('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript]);

  const handleUserSpeechContent = async (text) => {
    if (!user || !text.trim()) return;
    setIsProcessing(true);
    console.log("User said:", text);

    try {
      // 1. NON-BLOCKING: Save user message to Firestore
      // We don't await this so the conversation can proceed even if DB is slow
      addDoc(collection(db, `chats/${user.uid}/messages`), {
        role: 'user',
        content: text,
        timestamp: serverTimestamp()
      }).catch(err => console.error("Firestore Error (User Msg):", err));

      // 2. Prepare history for API (last 10 msgs)
      const recentHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // 3. Call backend AI
      console.log("Calling AI API...");
      const apiUrl = import.meta.env.VITE_API_URL + '/chat';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: recentHistory })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply;
      console.log("AI Replied:", reply);

      // 4. Speak IMMEDIATELY
      speak(reply);

      // 5. NON-BLOCKING: Save assistant reply to Firestore
      addDoc(collection(db, `chats/${user.uid}/messages`), {
        role: 'assistant',
        content: reply,
        timestamp: serverTimestamp()
      }).catch(err => console.error("Firestore Error (AI Msg):", err));

    } catch (err) {
      console.error("Conversation Error:", err);
      // More descriptive fallback errors help debugging
      const errorMessage = err.message.includes('Failed to fetch') 
        ? "I can't reach the server. Is the backend running?" 
        : "I'm having trouble thinking right now.";
      speak(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrbClick = () => {
    if (isSpeaking) {
      cancelSpeak();
    } else if (isListening) {
      stopListening();
    } else {
      if (isProcessing) return; // Prevent new recording while processing
      cancelSpeak(); // Ensure any queued speech stops
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
      <header className="app-header">
        <h1 className="logo">Voice Chat AI</h1>
        <div className="user-section">
          <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="User Avatar" className="avatar" />
          <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
        </div>
      </header>

      <main className="main-content">
        <div className="orb-section">
          <VoiceOrb
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
            onClick={handleOrbClick}
            error={recogError}
          />
        </div>
        <div className="chat-section">
          <ChatHistory messages={messages} />
        </div>
      </main>
    </div>
  )
}

export default App
