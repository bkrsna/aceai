import React from 'react';
import { AIAvatar, AIAvatarState } from './AIAvatar';
import { AudioVisualizer } from './AudioVisualizer';
import { Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';

export interface AIPartitionProps {
  avatarState?: AIAvatarState;
  currentSpeechText?: string;
  isCaptionsEnabled?: boolean;
  volume?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

export const AIPartition: React.FC<AIPartitionProps> = ({
  avatarState = 'idle',
  currentSpeechText = '',
  isCaptionsEnabled = true,
  volume = 0,
  isMuted = false,
  onToggleMute,
  isExpanded = false,
  onToggleExpand,
  className = '',
}) => {
  // Ultra-minimal status label & dot
  const getStatus = () => {
    switch (avatarState) {
      case 'speaking':
        return { label: 'Speaking', dot: 'bg-blue-600 animate-pulse' };
      case 'listening':
        return { label: 'Listening', dot: 'bg-emerald-500 animate-pulse' };
      case 'thinking':
        return { label: 'Thinking', dot: 'bg-purple-600 animate-pulse' };
      default:
        return { label: 'Interviewer', dot: 'bg-zinc-400' };
    }
  };

  const status = getStatus();

  return (
    <div
      className={`relative flex flex-col h-full w-full rounded-2xl overflow-hidden border border-zinc-200/80 bg-white shadow-sm transition-all duration-300 ${className}`}
    >
      {/* Top Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Status Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-xs pointer-events-auto">
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span className="text-xs font-medium text-zinc-700">{status.label}</span>
        </div>

        {/* Minimal Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-1.5 rounded-lg bg-white/90 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 border border-zinc-200/80 backdrop-blur-md transition shadow-xs active:scale-95"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

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

      {/* Main Avatar Area */}
      <div className="relative flex-1 w-full h-full min-h-0">
        <AIAvatar
          state={avatarState}
          volume={volume}
        />

        {/* Minimal Audio Visualizer Bar */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 w-36 pointer-events-none opacity-80">
          <AudioVisualizer
            isActive={avatarState === 'speaking'}
            volume={volume > 0 ? volume : avatarState === 'speaking' ? 60 : 0}
            color="blue"
            mode="bars"
            barCount={16}
            height={16}
          />
        </div>

        {/* Clean Live Closed Caption Subtitle */}
        {isCaptionsEnabled && currentSpeechText && (
          <div className="absolute bottom-3 left-3 right-3 z-30 flex justify-center pointer-events-none">
            <div className="max-w-xl px-4 py-2 rounded-xl bg-white/95 border border-zinc-200/80 backdrop-blur-md shadow-elevated pointer-events-auto">
              <p className="text-xs sm:text-sm text-zinc-800 font-medium leading-relaxed text-center">
                {currentSpeechText}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
