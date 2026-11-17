import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseCameraReturn {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: (forcedState?: boolean) => void;
  toggleMic: (forcedState?: boolean) => void;
  error: string | null;
  startCamera: (constraints?: MediaStreamConstraints) => Promise<MediaStream | null>;
  stopCamera: () => void;
  audioVolume: number; // 0 to 100
  isSpeaking: boolean;
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  selectedVideoDeviceId: string | null;
  selectedAudioDeviceId: string | null;
  setVideoDevice: (deviceId: string) => Promise<void>;
  setAudioDevice: (deviceId: string) => Promise<void>;
}

export function useCamera(autoStart: boolean = true): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(null);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Enumerate input devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vDevs = devices.filter((d) => d.kind === 'videoinput');
      const aDevs = devices.filter((d) => d.kind === 'audioinput');
      setVideoDevices(vDevs);
      setAudioDevices(aDevs);
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
    }
  }, []);

  // Teardown Web Audio analyzer
  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    setAudioVolume(0);
    setIsSpeaking(false);
  }, []);

  // Setup Web Audio Analyzer for live volume meter
  const setupAudioAnalyzer = useCallback((audioTrack: MediaStreamTrack) => {
    cleanupAudio();
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const singleTrackStream = new MediaStream([audioTrack]);
      const source = audioCtx.createMediaStreamSource(singleTrackStream);
      sourceNodeRef.current = source;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Normalize 0-100
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        setAudioVolume(normalized);
        setIsSpeaking(normalized > 12);

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Could not initialize audio visualizer node:', err);
    }
  }, [cleanupAudio]);

  // Stop camera and mic
  const stopCamera = useCallback(() => {
    cleanupAudio();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setStream(null);
  }, [cleanupAudio]);

  // Start media stream
  const startCamera = useCallback(async (customConstraints?: MediaStreamConstraints): Promise<MediaStream | null> => {
    setError(null);
    stopCamera();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const msg = 'Camera and microphone access is not supported in this environment.';
      setError(msg);
      return null;
    }

    const defaultConstraints: MediaStreamConstraints = {
      video: selectedVideoDeviceId
        ? { deviceId: { exact: selectedVideoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: selectedAudioDeviceId
        ? { deviceId: { exact: selectedAudioDeviceId }, echoCancellation: true, noiseSuppression: true }
        : { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    };

    const finalConstraints = customConstraints || defaultConstraints;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(finalConstraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      // Check track statuses
      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];

      setIsCameraOn(videoTrack ? videoTrack.enabled : false);
      setIsMicOn(audioTrack ? audioTrack.enabled : false);

      if (audioTrack) {
        setupAudioAnalyzer(audioTrack);
      }

      await updateDeviceList();
      return mediaStream;
    } catch (err: unknown) {
      let message = 'Unable to access camera or microphone.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message = 'Camera or microphone permissions were denied. Please grant permission in your browser.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = 'No camera or microphone devices were detected on your system.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = 'Camera or microphone is already in use by another application.';
        } else {
          message = `Media error: ${err.message}`;
        }
      }
      setError(message);
      console.warn('useCamera error:', message, err);
      return null;
    }
  }, [selectedVideoDeviceId, selectedAudioDeviceId, stopCamera, setupAudioAnalyzer, updateDeviceList]);

  // Toggle Camera
  const toggleCamera = useCallback((forcedState?: boolean) => {
    if (!streamRef.current) return;
    const videoTracks = streamRef.current.getVideoTracks();
    if (videoTracks.length === 0) return;

    const nextState = forcedState !== undefined ? forcedState : !videoTracks[0].enabled;
    videoTracks.forEach((track) => {
      track.enabled = nextState;
    });
    setIsCameraOn(nextState);
  }, []);

  // Toggle Mic
  const toggleMic = useCallback((forcedState?: boolean) => {
    if (!streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;

    const nextState = forcedState !== undefined ? forcedState : !audioTracks[0].enabled;
    audioTracks.forEach((track) => {
      track.enabled = nextState;
    });
    setIsMicOn(nextState);
  }, []);

  // Change video device
  const setVideoDevice = useCallback(async (deviceId: string) => {
    setSelectedVideoDeviceId(deviceId);
    await startCamera({
      video: { deviceId: { exact: deviceId } },
      audio: selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true
    });
  }, [selectedAudioDeviceId, startCamera]);

  // Change audio device
  const setAudioDevice = useCallback(async (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    await startCamera({
      video: selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : true,
      audio: { deviceId: { exact: deviceId } }
    });
  }, [selectedVideoDeviceId, startCamera]);

  // Start on mount if autoStart is requested
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  return {
    stream,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMic,
    error,
    startCamera,
    stopCamera,
    audioVolume,
    isSpeaking,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    setVideoDevice,
    setAudioDevice
  };
}
