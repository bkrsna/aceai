import { useState, useEffect, useRef, useCallback } from 'react';

// Speech Recognition interface definitions for TS
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export interface UseSpeechReturn {
  // Recognition
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isRecognitionSupported: boolean;

  // Synthesis
  isSpeakingAI: boolean;
  speakAI: (text: string, onEnd?: () => void) => void;
  stopSpeakingAI: () => void;
}

export function useSpeech(isMicOn: boolean = true): UseSpeechReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingAI, setIsSpeakingAI] = useState(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn('SpeechRecognition API not available in this browser.');
      setIsRecognitionSupported(false);
      return;
    }

    setIsRecognitionSupported(true);
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript + ' ';
        } else {
          interim += item[0].transcript;
        }
      }

      setTranscript(final + interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn('SpeechRecognition error:', event.error);
      }
    };

    recognition.onend = () => {
      if (!isManuallyStoppedRef.current && isMicOn) {
        // Auto-restart if unexpectedly ended
        try {
          recognition.start();
        } catch (e) {
          // ignore
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [isMicOn]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      isManuallyStoppedRef.current = false;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // already started or busy
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      isManuallyStoppedRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (e) {
      // ignore
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  // AI Speech Synthesis
  const speakAI = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1.05;

    // Try finding a natural female English voice (e.g., Google UK/US, Samantha, Victoria, Serena)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Female') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Google US English') ||
          v.name.includes('Karen') ||
          v.name.includes('Victoria') ||
          v.name.includes('Zira'))
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeakingAI(true);
    };

    utterance.onend = () => {
      setIsSpeakingAI(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      setIsSpeakingAI(false);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeakingAI = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingAI(false);
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isRecognitionSupported,
    isSpeakingAI,
    speakAI,
    stopSpeakingAI,
  };
}
