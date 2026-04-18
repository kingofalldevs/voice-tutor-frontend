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
  const [streamedReply, setStreamedReply] = useState('');
  const [lessonStage, setLessonStage] = useState('hook');
  const [turnCount, setTurnCount] = useState(0);

  const sendMessage = useCallback(async (text) => {
    if (!user || !text.trim()) return;
    
    setIsProcessing(true);
    setStreamedReply('');
    setLastActivity(Date.now());

    try {
      const isInternalSignal = text.startsWith("[") || text === "start";
      if (!isInternalSignal) await saveMessage('user', text);

      const isStartSignal = text === 'start';

      // Always send up to last 20 messages for continuity — never wipe history
      const recentHistory = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

      // On lesson start, reset stage tracking
      if (isStartSignal) {
        setLessonStage('hook');
        setTurnCount(0);
      } else {
        setTurnCount(prev => prev + 1);
      }

      // Build enriched lesson context so Nova knows exactly what to teach
      const enrichedLessonContext = activeLesson ? {
        id: activeLesson.id,
        title: activeLesson.title,
        description: activeLesson.description || '',
        grade: activeLesson.grade || '',
        domain: activeLesson.domain || '',
        skills: (activeLesson.skills || []).map(s => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
          difficulty: s.difficulty || 1
        }))
      } : null;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: user.uid,
          message: text, 
          history: recentHistory, 
          userName: user.displayName || 'Student', 
          currentSkillId: currentSkillId,
          lessonStage: isStartSignal ? 'hook' : lessonStage,
          turnCount: isStartSignal ? 0 : turnCount,
          lessonContext: enrichedLessonContext
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
        setStreamedReply(fullReply.replace(/(\[\[[\s\S]*?\]\]|\[GRAPH:[\s\S]*?\])/g, '').trim());

        // 1. Clear Board
        if (fullReply.includes("[[CLEAR]]")) setWhiteboardBlocks([]);

        // 2. Whiteboard Writing (Resilient Parsing)
        const writeRegex = /\[\[WRITE:\s*([\s\S]*?)\]\]/g;
        const matches = [...fullReply.matchAll(writeRegex)];
        
        // Also capture raw [GRAPH: ...] tags if Nova forgets to wrap them in [[WRITE: ...]]
        const rawGraphRegex = /\[GRAPH:[\s\S]*?\]/g;
        const rawGraphMatches = [...fullReply.matchAll(rawGraphRegex)];

        // Combine and map to content strings
        const allContents = [
          ...matches.map(m => m[1].trim()),
          ...rawGraphMatches.map(m => m[0].trim()) // The entire [GRAPH: ...] tag is the content here
        ];

        // Ensure we don't process the same tag twice if she nested it properly like [[WRITE: [GRAPH: ...]]]
        const uniqueContents = Array.from(new Set(allContents)).filter(c => c);

        if (uniqueContents.length > lastMatchCount) {
          for (let i = lastMatchCount; i < uniqueContents.length; i++) {
            let content = uniqueContents[i];
            if (content.startsWith('"') && content.endsWith('"')) content = content.slice(1, -1);
            else if (content.startsWith("'") && content.endsWith("'")) content = content.slice(1, -1);

            // Kinetic Logic: Check if content contains [GRAPH: ... id=XYZ]
            const idMatch = content.match(/\[GRAPH:.*id=([\w-]+).*\]/);
            const explicitId = idMatch ? idMatch[1] : null;

            setWhiteboardBlocks(prev => {
              if (explicitId) {
                const existingIndex = prev.findIndex(b => b.id === explicitId);
                if (existingIndex !== -1) {
                  const next = [...prev];
                  next[existingIndex] = { ...next[existingIndex], content };
                  return next;
                }
              }
              const blockId = explicitId || `block_${Date.now()}_${i}`;
              return [...prev, { id: blockId, content }];
            });
          }
          lastMatchCount = uniqueContents.length;
        }

        // 3. Speech Synthesis
        const newlyAdded = fullReply.substring(spokenText.length);
        const sentences = newlyAdded.match(/[^.!?]+[.!?]/g);
        if (sentences) {
          for (const s of sentences) {
            const clean = s
              .replace(/(\[\[[\s\S]*?\]\]|\[GRAPH:[\s\S]*?\])/g, '')
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
        .replace(/(\[\[[\s\S]*?\]\]|\[GRAPH:[\s\S]*?\])/g, '')
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
      setStreamedReply('');
    }
  }, [user, messages, saveMessage, activeLesson, currentSkillId, setWhiteboardBlocks, setLastActivity, speak]);

  return { isProcessing, sendMessage, streamedReply };
}
