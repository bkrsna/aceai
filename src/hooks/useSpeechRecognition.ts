import { useState, useEffect, useRef, useCallback } from 'react';

// Browser SpeechRecognition TypeScript typings
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultItem {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudiostart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onsoundstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: BrowserSpeechRecognition, ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((this: BrowserSpeechRecognition, ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  autoSendSilenceDuration?: number; // seconds of silence before optional onSilence callback
  onSilence?: () => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  fullTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  setTranscript: (text: string) => void;
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const {
    lang = 'en-US',
    continuous = true,
    interimResults = true,
    autoSendSilenceDuration,
    onSilence,
  } = options || {};

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const isListeningRef = useRef<boolean>(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const onSilenceRef = useRef(onSilence);
  onSilenceRef.current = onSilence;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Reset silence timer on new speech input
  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    if (autoSendSilenceDuration && autoSendSilenceDuration > 0 && onSilenceRef.current) {
      silenceTimerRef.current = window.setTimeout(() => {
        if (isListeningRef.current) {
          onSilenceRef.current?.();
        }
      }, autoSendSilenceDuration * 1000);
    }
  }, [autoSendSilenceDuration, clearSilenceTimer]);

  // Stop listening
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    clearSilenceTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Recognition might already be stopped
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, [clearSilenceTimer]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    // Clean previous session if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignored
      }
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentInterim = '';
        let finalizedAppend = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptChunk = result[0]?.transcript || '';

          if (result.isFinal) {
            finalizedAppend += transcriptChunk + ' ';
          } else {
            currentInterim += transcriptChunk;
          }
        }

        if (finalizedAppend.length > 0) {
          setTranscript((prev) => (prev ? `${prev} ${finalizedAppend}`.trim() : finalizedAppend.trim()));
        }

        setInterimTranscript(currentInterim);
        resetSilenceTimer();
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        // 'no-speech' is non-fatal in continuous mode
        if (event.error === 'no-speech') {
          return;
        }

        if (event.error === 'not-allowed') {
          setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'network') {
          setError('Network issue encountered during speech recognition. Reconnecting...');
        } else if (event.error !== 'aborted') {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // If user did not manually stop listening, automatically restart continuous listening
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // If starting immediately throws, toggle listening off
            setIsListening(false);
          }
        } else {
          setIsListening(false);
          setInterimTranscript('');
          clearSilenceTimer();
        }
      };

      recognitionRef.current = recognition;
      isListeningRef.current = true;
      recognition.start();
      setIsListening(true);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to initiate speech recognition: ${msg}`);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [isSupported, continuous, interimResults, lang, resetSilenceTimer, clearSilenceTimer]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    clearSilenceTimer();
  }, [clearSilenceTimer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignored
        }
        recognitionRef.current = null;
      }
    };
  }, [clearSilenceTimer]);

  const fullTranscript = (
    transcript + (interimTranscript ? (transcript ? ' ' : '') + interimTranscript : '')
  ).trim();

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    fullTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
