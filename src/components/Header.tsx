import React from 'react';
import { Clock, Settings } from 'lucide-react';

export interface HeaderProps {
  topic?: string;
  level?: string;
  currentQuestion?: number;
  totalQuestions?: number;
  elapsedSeconds?: number;
  modelName?: string;
  isConnected?: boolean;
  onOpenInfo?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  topic = 'Frontend Engineer',
  level = 'Senior',
  currentQuestion = 1,
  totalQuestions = 5,
  elapsedSeconds = 0,
  isConnected = true,
  onOpenInfo,
  className = '',
}) => {
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header
      className={`h-14 w-full px-4 sm:px-6 flex items-center justify-between border-b border-zinc-200/80 bg-white/80 backdrop-blur-md select-none z-30 ${className}`}
    >
      {/* Left: Minimal Wordmark & Role */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-xs">
            A
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            AceAI
          </span>
        </div>

        <span className="text-zinc-300">/</span>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 max-w-[200px] sm:max-w-xs truncate">
          <span className="truncate font-medium text-zinc-700">{topic}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60">
            {level}
          </span>
        </div>
      </div>

      {/* Center: Minimalist Step Tracker */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-medium text-zinc-500">
          {Math.min(currentQuestion, totalQuestions)} / {totalQuestions}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const questionIdx = idx + 1;
            const isCompleted = questionIdx < currentQuestion;
            const isCurrent = questionIdx === currentQuestion;

            return (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'w-4 bg-zinc-900'
                    : isCurrent
                    ? 'w-6 bg-zinc-800'
                    : 'w-2 bg-zinc-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Right: Timer & Settings */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100/80 text-zinc-600 font-mono text-xs border border-zinc-200/50">
          <Clock className="w-3 h-3 text-zinc-400" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>

        <span
          title={isConnected ? 'Connected' : 'Connecting'}
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
          }`}
        />

        {onOpenInfo && (
          <button
            onClick={onOpenInfo}
            title="Setup"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition active:scale-95"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
