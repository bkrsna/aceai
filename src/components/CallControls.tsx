import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Captions,
  CaptionsOff,
  FileText,
  PhoneOff,
  Send,
  Settings,
  X
} from 'lucide-react';

export interface CallControlsProps {
  isMicOn: boolean;
  onToggleMic: () => void;
  isCameraOn: boolean;
  onToggleCamera: () => void;
  isCaptionsEnabled: boolean;
  onToggleCaptions: () => void;
  isTranscriptOpen: boolean;
  onToggleTranscript: () => void;
  unreadTranscriptCount?: number;
  canSubmitAnswer?: boolean;
  onSubmitAnswer?: () => void;
  onOpenSettings?: () => void;
  onEndInterview: () => void;
  className?: string;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMicOn,
  onToggleMic,
  isCameraOn,
  onToggleCamera,
  isCaptionsEnabled,
  onToggleCaptions,
  isTranscriptOpen,
  onToggleTranscript,
  unreadTranscriptCount = 0,
  canSubmitAnswer = false,
  onSubmitAnswer,
  onOpenSettings,
  onEndInterview,
  className = '',
}) => {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const confirmEnd = () => {
    setShowEndConfirm(false);
    onEndInterview();
  };

  return (
    <>
      <div
        className={`max-w-fit mx-auto px-2 py-1.5 bg-white/95 backdrop-blur-xl border border-zinc-200/90 rounded-2xl shadow-elevated flex items-center gap-1.5 sm:gap-2 ${className}`}
      >
        {/* Mic Toggle */}
        <button
          onClick={onToggleMic}
          title={isMicOn ? 'Mute' : 'Unmute'}
          className={`p-2.5 rounded-xl transition active:scale-95 flex items-center justify-center ${
            isMicOn
              ? 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200/70'
              : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleCamera}
          title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
          className={`p-2.5 rounded-xl transition active:scale-95 flex items-center justify-center ${
            isCameraOn
              ? 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200/70'
              : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        <div className="h-5 w-px bg-zinc-200 mx-0.5" />

        {/* Captions Toggle */}
        <button
          onClick={onToggleCaptions}
          title={isCaptionsEnabled ? 'Hide Captions' : 'Show Captions'}
          className={`p-2.5 rounded-xl transition active:scale-95 flex items-center justify-center ${
            isCaptionsEnabled
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/70'
          }`}
        >
          {isCaptionsEnabled ? <Captions className="w-4 h-4" /> : <CaptionsOff className="w-4 h-4" />}
        </button>

        {/* Transcript Drawer Toggle */}
        <button
          onClick={onToggleTranscript}
          title="Transcript"
          className={`relative p-2.5 rounded-xl transition active:scale-95 flex items-center justify-center ${
            isTranscriptOpen
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/70'
          }`}
        >
          <FileText className="w-4 h-4" />
          {unreadTranscriptCount > 0 && !isTranscriptOpen && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Submit Answer (Prominent when speaking) */}
        {onSubmitAnswer && (
          <button
            onClick={onSubmitAnswer}
            disabled={!canSubmitAnswer}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition active:scale-95 ${
              canSubmitAnswer
                ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit Answer</span>
            <span className="sm:hidden">Submit</span>
          </button>
        )}

        <div className="h-5 w-px bg-zinc-200 mx-0.5" />

        {/* Settings Toggle */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2.5 rounded-xl bg-zinc-100 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/70 transition active:scale-95"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* End Interview Call Button */}
        <button
          onClick={() => setShowEndConfirm(true)}
          title="End Interview"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-medium text-xs transition active:scale-95"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">End</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200 shadow-float p-5 relative">
            <button
              onClick={() => setShowEndConfirm(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-semibold text-zinc-900 mb-1">End interview?</h3>
            <p className="text-xs text-zinc-500 mb-5">
              Your evaluation and scorecard will be generated now.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnd}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
              >
                End & Evaluate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
