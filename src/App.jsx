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

    try {
      // 1. Background save user message
      addDoc(collection(db, `chats/${user.uid}/messages`), {
        role: 'user',
        content: text,
        timestamp: serverTimestamp()
      }).catch(err => console.error("Firestore Error:", err));

      // 2. Prepare history for API (last 30 msgs for deep context)
      const recentHistory = messages.slice(-30).map(m => ({
        role: m.role,
        content: m.content
      }));

      // 3. Fetch with streaming support - passing username for personalization
      const apiUrl = import.meta.env.VITE_API_URL + '/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          history: recentHistory,
          userName: user.displayName || 'Friend'
        })
      });

      if (!response.ok) throw new Error('API Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      let hasSpokenFirstSentence = false;

      // 3. Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullReply += chunk;

        // HIGH EFFICIENCY: Speak as soon as we have a full sentence or enough text
        // This dramatically reduces perceived latency
        if (!hasSpokenFirstSentence) {
          const sentenceMatch = fullReply.match(/[^.!?]+[.!?]/);
          if (sentenceMatch) {
            speak(sentenceMatch[0].trim());
            hasSpokenFirstSentence = true;
          }
        }
      }

      // 4. If it was too short for a sentence or we missed it, speak the whole thing
      if (!hasSpokenFirstSentence && fullReply) {
        speak(fullReply);
      }

      // 5. Background save AI reply
      addDoc(collection(db, `chats/${user.uid}/messages`), {
        role: 'assistant',
        content: fullReply,
        timestamp: serverTimestamp()
      }).catch(err => console.error("Firestore Error:", err));

    } catch (err) {
      console.error("Conversation Error:", err);
      speak("I encountered a connection error.");
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
