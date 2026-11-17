import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  VideoOff,
  Send,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  User
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

export interface CandidatePartitionProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  candidateName?: string;
  audioVolume?: number;
  isSpeaking?: boolean;
  liveTranscript?: string;
  isCaptionsEnabled?: boolean;
  canSubmitAnswer?: boolean;
  onSubmitAnswer?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  className?: string;
}

export const CandidatePartition: React.FC<CandidatePartitionProps> = ({
  stream,
  isCameraOn,
  isMicOn,
  candidateName = 'You',
  audioVolume = 0,
  isSpeaking = false,
  liveTranscript = '',
  isCaptionsEnabled = true,
  canSubmitAnswer = false,
  onSubmitAnswer,
  isExpanded = false,
  onToggleExpand,
  onToggleMic,
  onToggleCamera,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream && isCameraOn) {
      videoElement.srcObject = stream;
      videoElement.play().catch((err) => {
        console.warn('Video element play() was prevented:', err);
      });
    } else {
      videoElement.srcObject = null;
    }
  }, [stream, isCameraOn]);

  return (
    <div
      className={`relative flex flex-col h-full w-full rounded-2xl overflow-hidden border border-zinc-200/80 bg-white shadow-sm transition-all duration-300 ${
        isSpeaking && isMicOn ? 'ring-1 ring-emerald-500/50' : ''
      } ${className}`}
    >
      {/* Top Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Name and Mic Status Badge */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-zinc-200/80 shadow-xs">
            <span className="text-xs font-medium text-zinc-800">{candidateName}</span>
            <button
              onClick={onToggleMic}
              title={isMicOn ? 'Mute' : 'Unmute'}
              className={`flex items-center justify-center w-4 h-4 rounded-full transition-colors ${
                isMicOn ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Right Controls: Mirror & Expand */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            title="Mirror video"
            className="p-1.5 rounded-lg bg-white/90 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 border border-zinc-200/80 backdrop-blur-md transition shadow-xs active:scale-95"
          >
            <FlipHorizontal className={`w-3.5 h-3.5 ${isMirrored ? 'text-zinc-900' : ''}`} />
          </button>

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title={isExpanded ? 'Restore' : 'Expand'}
              className="p-1.5 rounded-lg bg-white/90 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 border border-zinc-200/80 backdrop-blur-md transition shadow-xs active:scale-95"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Video or Fallback Area */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-zinc-100 flex items-center justify-center overflow-hidden">
        {isCameraOn && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform duration-200 ${
              isMirrored ? 'scale-x-[-1]' : ''
            }`}
          />
        ) : (
          /* Minimalist Camera Off State */
          <div className="flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="w-20 h-20 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-xs mb-3">
              <User className="w-8 h-8 text-zinc-400" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-2">
              <VideoOff className="w-3.5 h-3.5" />
              <span>Camera off</span>
            </div>
            {onToggleCamera && (
              <button
                onClick={onToggleCamera}
                className="text-xs px-3 py-1 rounded-lg bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-xs transition font-medium"
              >
                Turn On
              </button>
            )}
          </div>
        )}

        {/* Voice Activity Indicator (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-zinc-200/80 shadow-xs pointer-events-none">
          <div className="w-12">
            <AudioVisualizer
              isActive={isMicOn && (isSpeaking || audioVolume > 8)}
              volume={isMicOn ? audioVolume : 0}
              color="emerald"
              barCount={8}
              height={14}
            />
          </div>
          {isMicOn && isSpeaking && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>

        {/* Minimalist Submit Answer Button (Bottom-Right) */}
        {onSubmitAnswer && canSubmitAnswer && (
          <div className="absolute bottom-3 right-3 z-30 pointer-events-auto">
            <button
              onClick={onSubmitAnswer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-md transition active:scale-95"
            >
              <Send className="w-3 h-3" />
              <span>Submit Answer</span>
            </button>
          </div>
        )}

        {/* Live Speech Captions */}
        {isCaptionsEnabled && liveTranscript && (
          <div className="absolute bottom-12 left-3 right-3 z-20 flex justify-center pointer-events-none">
            <div className="max-w-md px-3.5 py-1.5 rounded-xl bg-white/95 border border-zinc-200/80 backdrop-blur-md shadow-elevated text-center">
              <p className="text-xs text-zinc-800 font-medium leading-relaxed line-clamp-2">
                "{liveTranscript}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
