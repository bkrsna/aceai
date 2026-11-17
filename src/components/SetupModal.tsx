import React, { useState, useEffect, useRef } from 'react';
import { InterviewConfig } from '../types/interview';
import { PRESET_TOPICS } from '../constants/topics';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Play,
  Check
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

export interface SetupModalProps {
  isOpen: boolean;
  initialConfig: InterviewConfig;
  onStartInterview: (config: InterviewConfig) => void;
  stream: MediaStream | null;
  audioVolume?: number;
  isCameraOn: boolean;
  isMicOn: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  className?: string;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  initialConfig,
  onStartInterview,
  stream,
  audioVolume = 0,
  isCameraOn,
  isMicOn,
  onToggleCamera,
  onToggleMic,
  className = '',
}) => {
  const [config, setConfig] = useState<InterviewConfig>(initialConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (previewVideoRef.current) {
      if (stream && isCameraOn) {
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.play().catch(() => {});
      } else {
        previewVideoRef.current.srcObject = null;
      }
    }
  }, [stream, isCameraOn, isOpen]);

  if (!isOpen) return null;

  const handleSelectTopic = (topic: typeof PRESET_TOPICS[0]) => {
    setConfig((prev) => ({
      ...prev,
      topic: topic.name,
      role: topic.role,
      level: topic.level,
    }));
  };

  const handleStart = () => {
    onStartInterview(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl shadow-float overflow-hidden flex flex-col my-auto max-h-[90vh] ${className}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-zinc-900 flex items-center justify-center text-white font-bold text-[10px]">
              A
            </div>
            <h2 className="text-sm font-semibold text-zinc-900">Setup</h2>
          </div>
          <div className="text-xs text-zinc-400 font-mono">
            {config.level}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Role Picker */}
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-2 block">
              Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_TOPICS.map((topic) => {
                const isSelected = config.topic === topic.name;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleSelectTopic(topic)}
                    className={`p-3 rounded-xl text-left border transition active:scale-[0.99] flex items-center justify-between ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-50/80 shadow-xs'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-zinc-900 truncate">
                        {topic.role}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {topic.name}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count & Hardware Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Questions count */}
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-2 block">
                Questions
              </label>
              <div className="flex items-center gap-2">
                {[3, 5, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, totalQuestions: num }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition ${
                      config.totalQuestions === num
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key Toggle/Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-500">
                  Gemini API Key
                </label>
                <span className="text-[10px] text-zinc-400">Optional</span>
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Paste key to use live Gemini"
                  value={config.apiKey}
                  onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 placeholder:text-zinc-400 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[10px] font-medium"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          {/* Camera & Mic Test Box */}
          <div className="p-3 rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center gap-4">
            {/* Preview Thumbnail */}
            <div className="w-24 h-16 rounded-xl overflow-hidden bg-zinc-200 relative shrink-0 flex items-center justify-center">
              {isCameraOn && stream ? (
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <VideoOff className="w-5 h-5 text-zinc-400" />
              )}
            </div>

            {/* Controls & Level */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={onToggleMic}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                    isMicOn
                      ? 'bg-white border border-zinc-200 text-zinc-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-600'
                  }`}
                >
                  {isMicOn ? <Mic className="w-3 h-3 text-emerald-600" /> : <MicOff className="w-3 h-3" />}
                  <span>{isMicOn ? 'Mic On' : 'Muted'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleCamera}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                    isCameraOn
                      ? 'bg-white border border-zinc-200 text-zinc-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-600'
                  }`}
                >
                  {isCameraOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                  <span>{isCameraOn ? 'Cam On' : 'Off'}</span>
                </button>
              </div>

              <div className="w-full max-w-[180px]">
                <AudioVisualizer
                  isActive={isMicOn}
                  volume={audioVolume}
                  color="zinc"
                  barCount={14}
                  height={14}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end">
          <button
            type="button"
            onClick={handleStart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-sm transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Start Interview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
