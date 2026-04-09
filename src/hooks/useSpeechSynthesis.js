import { useState, useCallback, useEffect } from 'react';

export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const loadVoices = () => {
      setVoices(synth.getVoices());
    };

    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text) => {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;

    // Cancel current speech correctly
    synth.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Voices can change/load late; get fresh list
    const availableVoices = synth.getVoices();
    let englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
    
    let chosenVoice = englishVoices.find(v => v.name.includes('Google US English')) 
      || englishVoices.find(v => v.name.toLowerCase().includes('female')) 
      || englishVoices[0];
      
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.error("Speech synthesis error", e);
      }
      setIsSpeaking(false);
    };

    // ⚠️ CRITICAL FIX: Chrome requires a delay after cancel() for speak() to work
    setTimeout(() => {
      synth.speak(utterance);
    }, 100);
  }, []);

  const cancel = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, isSpeaking, cancel };
}
