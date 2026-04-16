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
  currentSkillId,
  setWhiteboardBlocks,
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

      const isStartSignal = text === 'start' || text.toLowerCase().startsWith('[user_silence]');
      const recentHistory = isStartSignal ? [] : messages.slice(-15).map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user.uid,
          message: text, 
          history: recentHistory, 
          userName: user.displayName || 'Student', 
          currentSkillId: currentSkillId,
          lessonContext: activeLesson ? {
            id: activeLesson.id,
            title: activeLesson.title
          } : null
        })
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

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

        // 1. Clear Board
        if (fullReply.includes("[[CLEAR]]")) setWhiteboardBlocks([]);

        // 2. Whiteboard Writing (Resilient Parsing)
        const writeRegex = /\[\[WRITE:\s*([\s\S]*?)\]\]/g;
        const matches = [...fullReply.matchAll(writeRegex)];
        
        if (matches.length > lastMatchCount) {
          for (let i = lastMatchCount; i < matches.length; i++) {
            let content = matches[i][1].trim();
            if (content.startsWith('"') && content.endsWith('"')) content = content.slice(1, -1);
            else if (content.startsWith("'") && content.endsWith("'")) content = content.slice(1, -1);

            setWhiteboardBlocks(prev => {
              const blockId = `block_${Date.now()}_${i}`;
              return [...prev, { id: blockId, content }];
            });
          }
          lastMatchCount = matches.length;
        }

        // 3. Speech Synthesis
        const newlyAdded = fullReply.substring(spokenText.length);
        const sentences = newlyAdded.match(/[^.!?]+[.!?]/g);
        if (sentences) {
          for (const s of sentences) {
            const clean = s
              .replace(/\[\[[\s\S]*?\]\]/g, '')
              .replace(/[\\\[\]$#*_`{}|<>]/g, '')
              .replace(/\\n/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (clean && clean.length > 1) speak(clean, true);
            spokenText += newlyAdded.substring(newlyAdded.indexOf(s), newlyAdded.indexOf(s) + s.length);
          }
        }
      }

      // Final Speak
      const finalRemaining = fullReply.substring(spokenText.length)
        .replace(/\[\[[\s\S]*?\]\]/g, '')
        .replace(/[\\\[\]$#*_`{}|<>]/g, '')
        .trim();
      if (finalRemaining && finalRemaining.length > 1) speak(finalRemaining, true);

      setLastActivity(Date.now());
      await saveMessage('assistant', fullReply.replace(/\[\[[\s\S]*?\]\]/g, '').trim());

    } catch (err) {
      console.error("Chat Error:", err);
      speak(`I'm sorry, I'm having trouble connecting right now.`);
    } finally {
      setIsProcessing(false);
    }
  }, [user, messages, saveMessage, activeLesson, currentSkillId, setWhiteboardBlocks, setLastActivity, speak]);

  return { isProcessing, sendMessage };
}
