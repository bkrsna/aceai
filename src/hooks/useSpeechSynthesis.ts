import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechSynthesisOptions {
  defaultRate?: number;
  defaultPitch?: number;
  defaultVolume?: number;
  preferredVoiceNames?: string[];
}

export interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  currentWord: string;
  speechProgress: number; // 0 - 100
  audioLevel: number; // 0 - 100 for avatar lip-sync
  frequencyBins: number[]; // Array of 16 values (0-100) for audio visualizer
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
  speak: (text: string, onEnd?: () => void) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setVoice: (voiceOrName: SpeechSynthesisVoice | string) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
}

const PREFERRED_VOICE_SUBSTRINGS = [
  'Google US English',
  'Samantha',
  'Natural',
  'Ava',
  'Jenny',
  'Zira',
  'Daniel',
  'Karen',
  'Alex',
  'Victoria',
];

export function useSpeechSynthesis(options?: UseSpeechSynthesisOptions): UseSpeechSynthesisReturn {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [speechProgress, setSpeechProgress] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyBins, setFrequencyBins] = useState<number[]>(() => new Array(16).fill(0));

  const [rate, setRate] = useState<number>(options?.defaultRate ?? 1.0);
  const [pitch, setPitch] = useState<number>(options?.defaultPitch ?? 1.0);
  const [volume, setVolume] = useState<number>(options?.defaultVolume ?? 1.0);

  const animFrameRef = useRef<number | null>(null);
  const chromeKeepAliveRef = useRef<number | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);
  const wordBurstRef = useRef<number>(0);

  // Pick the best natural English voice available
  const chooseBestVoice = useCallback(
    (availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
      if (!availableVoices || availableVoices.length === 0) return null;

      // 1. Try preferred voice substrings
      for (const pref of options?.preferredVoiceNames || PREFERRED_VOICE_SUBSTRINGS) {
        const found = availableVoices.find(
          (v) => v.name.toLowerCase().includes(pref.toLowerCase()) && v.lang.startsWith('en')
        );
        if (found) return found;
      }

      // 2. Fall back to any US English voice
      const usEnglish = availableVoices.find((v) => v.lang === 'en-US');
      if (usEnglish) return usEnglish;

      // 3. Any English voice
      const anyEnglish = availableVoices.find((v) => v.lang.startsWith('en'));
      if (anyEnglish) return anyEnglish;

      // 4. Default voice
      const defaultVoice = availableVoices.find((v) => v.default);
      return defaultVoice || availableVoices[0];
    },
    [options?.preferredVoiceNames]
  );

  // Initialize and listen for available voices
  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      const loaded = window.speechSynthesis.getVoices();
      if (loaded.length > 0) {
        setVoices(loaded);
        setSelectedVoice((prev) => prev || chooseBestVoice(loaded));
      }
    };

    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, [isSupported, chooseBestVoice]);

  // Lip-sync & Frequency Animation Loop while speaking
  const startLipSyncAnimation = useCallback(() => {
    let phase = 0;

    const animate = () => {
      phase += 0.15;
      const burst = wordBurstRef.current;
      wordBurstRef.current = Math.max(0, burst * 0.88); // Decay burst

      // Base speech wave rhythm (combination of sine harmonics)
      const baseWave =
        Math.sin(phase * 1.8) * 0.35 +
        Math.cos(phase * 3.4) * 0.25 +
        Math.sin(phase * 0.7) * 0.2;

      // Combined dynamic audio level (0 to 100)
      const dynamicLevel = Math.min(
        100,
        Math.max(15, Math.round((baseWave + 0.6) * 45 + burst * 45))
      );
      setAudioLevel(dynamicLevel);

      // 16 Frequency visualizer bins
      const bins = new Array(16).fill(0).map((_, i) => {
        const harmonic = Math.sin(phase * 2.2 + i * 0.45) * 0.5 + 0.5;
        const binVal = Math.round(dynamicLevel * 0.65 * harmonic + burst * 30 * (1 - i / 16));
        return Math.min(100, Math.max(5, binVal));
      });
      setFrequencyBins(bins);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const stopLipSyncAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);
    setFrequencyBins(new Array(16).fill(0));
    wordBurstRef.current = 0;
  }, []);

  // Cleanup helper
  const cleanUpUtterance = useCallback(() => {
    stopLipSyncAnimation();
    if (chromeKeepAliveRef.current) {
      clearInterval(chromeKeepAliveRef.current);
      chromeKeepAliveRef.current = null;
    }
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentWord('');
    setSpeechProgress(0);
  }, [stopLipSyncAnimation]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
      cleanUpUtterance();
    };
  }, [isSupported, cleanUpUtterance]);

  /**
   * Speak given text using Web Speech API
   */
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isSupported) {
        console.warn('SpeechSynthesis is not supported in this browser.');
        onEnd?.();
        return;
      }

      if (!text || text.trim().length === 0) {
        onEnd?.();
        return;
      }

      // Stop any existing utterance
      window.speechSynthesis.cancel();
      cleanUpUtterance();

      onEndCallbackRef.current = onEnd || null;

      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setSpeechProgress(0);
        startLipSyncAnimation();

        // Chromium long-speech bug workaround: keep synthesis active
        if (chromeKeepAliveRef.current) clearInterval(chromeKeepAliveRef.current);
        chromeKeepAliveRef.current = window.setInterval(() => {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 12000);
      };

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          const charLength = event.charLength || 6;
          const word = text.substring(charIndex, charIndex + charLength).trim();
          setCurrentWord(word);

          // Pulse audio amplitude on new word boundary for avatar lip movement
          wordBurstRef.current = 1.0;

          const progress = Math.min(100, Math.round((charIndex / Math.max(1, text.length)) * 100));
          setSpeechProgress(progress);
        }
      };

      utterance.onpause = () => {
        setIsPaused(true);
        stopLipSyncAnimation();
      };

      utterance.onresume = () => {
        setIsPaused(false);
        startLipSyncAnimation();
      };

      utterance.onend = () => {
        setSpeechProgress(100);
        const cb = onEndCallbackRef.current;
        cleanUpUtterance();
        cb?.();
      };

      utterance.onerror = (event) => {
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.warn('SpeechSynthesis error:', event.error);
        }
        const cb = onEndCallbackRef.current;
        cleanUpUtterance();
        cb?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, selectedVoice, rate, pitch, volume, cleanUpUtterance, startLipSyncAnimation, stopLipSyncAnimation]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    cleanUpUtterance();
  }, [isSupported, cleanUpUtterance]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    stopLipSyncAnimation();
  }, [isSupported, stopLipSyncAnimation]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
    startLipSyncAnimation();
  }, [isSupported, startLipSyncAnimation]);

  const setVoice = useCallback(
    (voiceOrName: SpeechSynthesisVoice | string) => {
      if (typeof voiceOrName === 'string') {
        const found = voices.find((v) => v.name === voiceOrName);
        if (found) setSelectedVoice(found);
      } else {
        setSelectedVoice(voiceOrName);
      }
    },
    [voices]
  );

  return {
    isSpeaking,
    isPaused,
    isSupported,
    currentWord,
    speechProgress,
    audioLevel,
    frequencyBins,
    voices,
    selectedVoice,
    rate,
    pitch,
    volume,
    speak,
    stop,
    pause,
    resume,
    setVoice,
    setRate,
    setPitch,
    setVolume,
  };
}
