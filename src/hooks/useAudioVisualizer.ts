import { useState, useEffect, useRef } from 'react';

export interface UseAudioVisualizerOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  binCount?: number;
  threshold?: number; // Volume threshold to consider audio active (0-100)
  enabled?: boolean;
}

export interface UseAudioVisualizerReturn {
  volume: number; // 0 - 100
  frequencyBins: number[]; // Array of normalized bins (0 - 100)
  rawFrequencyData: Uint8Array | null;
  isAudioActive: boolean;
  isStreaming: boolean;
  error: string | null;
}

export function useAudioVisualizer(
  stream: MediaStream | null,
  options?: UseAudioVisualizerOptions
): UseAudioVisualizerReturn {
  const {
    fftSize = 128,
    smoothingTimeConstant = 0.8,
    binCount = 16,
    threshold = 6,
    enabled = true,
  } = options || {};

  const [volume, setVolume] = useState<number>(0);
  const [frequencyBins, setFrequencyBins] = useState<number[]>(() => new Array(binCount).fill(0));
  const [rawFrequencyData, setRawFrequencyData] = useState<Uint8Array | null>(null);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // If not enabled or no stream or stream has no audio tracks
    if (!enabled || !stream || stream.getAudioTracks().length === 0) {
      setIsStreaming(false);
      setVolume(0);
      setIsAudioActive(false);
      setFrequencyBins(new Array(binCount).fill(0));
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      setError('Web Audio API is not supported in this browser.');
      return;
    }

    let audioContext: AudioContext;
    try {
      audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to create AudioContext: ${msg}`);
      return;
    }

    // Auto resume if suspended (due to browser autoplay policies)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {
        // Will resume on candidate user gesture
      });
    }

    try {
      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      analyserRef.current = analyser;

      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      setRawFrequencyData(dataArray);
      setIsStreaming(true);
      setError(null);

      // Animation loop to sample frequency data
      const sampleAudio = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate root-mean-square / average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Normalize 0-255 to 0-100 with a slight perceptual curve
        const normalizedVolume = Math.min(100, Math.round((avg / 255) * 100 * 1.5));
        setVolume(normalizedVolume);
        setIsAudioActive(normalizedVolume >= threshold);

        // Bin compression into binCount buckets
        const step = Math.max(1, Math.floor(bufferLength / binCount));
        const bins: number[] = [];

        for (let b = 0; b < binCount; b++) {
          let binSum = 0;
          let count = 0;
          for (let s = 0; s < step && b * step + s < bufferLength; s++) {
            binSum += dataArray[b * step + s];
            count++;
          }
          const binAvg = count > 0 ? binSum / count : 0;
          bins.push(Math.min(100, Math.round((binAvg / 255) * 100)));
        }

        setFrequencyBins(bins);

        animFrameRef.current = requestAnimationFrame(sampleAudio);
      };

      animFrameRef.current = requestAnimationFrame(sampleAudio);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Audio visualizer stream error: ${msg}`);
    }

    // Cleanup when stream changes or unmounts
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch {
          // Ignored
        }
        sourceNodeRef.current = null;
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch {
          // Ignored
        }
        analyserRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch {
          // Ignored
        }
        audioContextRef.current = null;
      }
      setIsStreaming(false);
      setVolume(0);
      setIsAudioActive(false);
      setFrequencyBins(new Array(binCount).fill(0));
    };
  }, [stream, enabled, fftSize, smoothingTimeConstant, binCount, threshold]);

  return {
    volume,
    frequencyBins,
    rawFrequencyData,
    isAudioActive,
    isStreaming,
    error,
  };
}
