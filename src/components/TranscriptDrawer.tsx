import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types/interview';
import { X, Copy, Check, ArrowDown } from 'lucide-react';

export interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  candidateName?: string;
  className?: string;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  messages = [],
  candidateName = 'You',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setAutoScroll(true);
    }
  };

  const handleCopyTranscript = async () => {
    if (messages.length === 0) return;
    const textContent = messages
      .map((m) => {
        const sender = m.sender === 'ai' ? 'Interviewer' : candidateName;
        const qTag = m.questionNumber ? `[Q${m.questionNumber}] ` : '';
        return `[${m.timestamp}] ${qTag}${sender}: ${m.text}`;
      })
      .join('\n');

    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy transcript:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex max-w-full">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-xs transition-opacity"
      />

      <aside
        className={`relative w-screen max-w-sm bg-white border-l border-zinc-200 shadow-float flex flex-col z-10 animate-in slide-in-from-right duration-200 ${className}`}
      >
        {/* Header */}
        <div className="h-14 px-4 border-b border-zinc-200 flex items-center justify-between bg-white">
          <h2 className="text-sm font-semibold text-zinc-900">Transcript</h2>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyTranscript}
              disabled={messages.length === 0}
              title="Copy"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition active:scale-95 disabled:opacity-40"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="Close"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 p-4 overflow-y-auto space-y-3.5"
        >
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-400">
              No messages yet
            </div>
          ) : (
            messages.map((msg) => {
              const isAI = msg.sender === 'ai';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-medium text-zinc-500">
                      {isAI ? 'Interviewer' : candidateName}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  <div
                    className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isAI
                        ? 'bg-zinc-100 text-zinc-900 rounded-tl-sm'
                        : 'bg-zinc-900 text-white rounded-tr-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Scroll to bottom button */}
        {!autoScroll && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-white border border-zinc-200 shadow-md text-zinc-600 hover:text-zinc-900 transition"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </aside>
    </div>
  );
};
