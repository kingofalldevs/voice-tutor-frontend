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

  const speak = useCallback((text, append = false) => {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;

    // Only cancel if we are NOT appending to a stream
    if (!append) {
      synth.cancel();
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Voices
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
    utterance.onend = () => {
      // Only set isSpeaking to false if there's nothing else pending in the queue
      if (!synth.speaking && !synth.pending) {
        setIsSpeaking(false);
      }
    };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.error("Speech synthesis error", e);
      }
      setIsSpeaking(false);
    };

    // Chrome workaround delay
    setTimeout(() => {
      synth.speak(utterance);
    }, append ? 10 : 100);
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
