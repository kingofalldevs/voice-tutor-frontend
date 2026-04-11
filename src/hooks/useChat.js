import { useState, useCallback } from 'react';

/**
 * useChat Hook
 * Handles streaming communication with Nova backend and parses special commands.
 * Robust parsing for [[WRITE: "content"]], [[CHAPTER: n]], [[CLEAR]], [[MATH_QUESTION: "q", "a"]]
 */
export default function useChat({ 
  user, 
  messages, 
  saveMessage, 
  activeLesson, 
  currentChapterId,
  setCurrentChapterId,
  setWhiteboardBlocks,
  setActiveChallenge,
  setLastActivity,
  speak
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = useCallback(async (text) => {
    if (!user || !text.trim()) return;
    
    setIsProcessing(true);
    setLastActivity(Date.now());

    try {
      const isInternalSignal = text.startsWith("[") || text === "start";
      if (!isInternalSignal) await saveMessage('user', text);

      const recentHistory = messages.slice(-15).map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          history: recentHistory, 
          userName: user.displayName || 'Student', 
          lessonContext: activeLesson ? {
            title: activeLesson.title,
            chapters: activeLesson.chapters.map(c => ({ id: c.id, title: c.title, summary: c.summary }))
          } : null
        })
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      let spokenText = '';
      let lastMatchCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullReply += chunk;

        // 1. Chapter Detection
        const chapterMatch = fullReply.match(/\[\[CHAPTER:(\d+)\]\]/);
        if (chapterMatch) {
          const newId = parseInt(chapterMatch[1]);
          if (newId !== currentChapterId) setCurrentChapterId(newId);
        }

        // 2. Clear Board
        if (fullReply.includes("[[CLEAR]]")) {
          setWhiteboardBlocks([]);
          // To prevent infinite clearing in the loop, we could strip it, 
          // but usually it's followed by new WRITE commands.
        }

        // 3. Math Challenges
        const mathMatch = fullReply.match(/\[\[MATH_QUESTION:\s*"([^"]+)",\s*"([^"]+)"\]\]/);
        if (mathMatch) {
          setActiveChallenge({ question: mathMatch[1], answer: mathMatch[2] });
        }

        // 4. Whiteboard Writing (Resilient Parsing)
        // We match all completed [[WRITE: "..."]] commands
        const writeRegex = /\[\[WRITE:\s*"([\s\S]*?)"\]\]/g;
        const matches = [...fullReply.matchAll(writeRegex)];
        
        if (matches.length > lastMatchCount) {
          for (let i = lastMatchCount; i < matches.length; i++) {
            const content = matches[i][1];
            setWhiteboardBlocks(prev => {
              // Avoid duplicate adds if the state update is delayed
              const blockId = `block_${Date.now()}_${i}`;
              return [...prev, { id: blockId, content }];
            });
          }
          lastMatchCount = matches.length;
        }

        // 5. Speech Synthesis (Sentence by Sentence)
        const newlyAdded = fullReply.substring(spokenText.length);
        const sentences = newlyAdded.match(/[^.!?]+[.!?]/g);
        if (sentences) {
          for (const s of sentences) {
            // Clean out commands for speech
            const clean = s.replace(/\[\[.*?\]\]/g, '').trim();
            if (clean) speak(clean, true);
            spokenText += newlyAdded.substring(newlyAdded.indexOf(s), newlyAdded.indexOf(s) + s.length);
          }
        }
      }

      // Final Speak
      const remaining = fullReply.substring(spokenText.length).replace(/\[\[.*?\]\]/g, '').trim();
      if (remaining) speak(remaining, true);

      setLastActivity(Date.now());
      await saveMessage('assistant', fullReply.replace(/\[\[.*?\]\]/g, '').trim());

    } catch (err) {
      console.error("Chat Error:", err);
      speak(`I'm sorry, I'm having trouble connecting right now.`);
    } finally {
      setIsProcessing(false);
    }
  }, [
    user, messages, saveMessage, activeLesson, currentChapterId, 
    setCurrentChapterId, setWhiteboardBlocks, setActiveChallenge, 
    setLastActivity, speak
  ]);

  return { isProcessing, sendMessage };
}
