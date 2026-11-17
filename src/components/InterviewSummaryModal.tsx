import React, { useState } from 'react';
import { InterviewEvaluation, ChatMessage } from '../types/interview';
import {
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface InterviewSummaryModalProps {
  isOpen: boolean;
  evaluation: InterviewEvaluation;
  messages: ChatMessage[];
  topic: string;
  role: string;
  level: string;
  onRetake: () => void;
  className?: string;
}

export const InterviewSummaryModal: React.FC<InterviewSummaryModalProps> = ({
  isOpen,
  evaluation,
  onRetake,
  className = '',
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full max-w-3xl bg-white border border-zinc-200 rounded-3xl shadow-float overflow-hidden flex flex-col my-auto max-h-[90vh] ${className}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">Evaluation</h2>
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                evaluation.overallScore >= 80
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : evaluation.overallScore >= 68
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {evaluation.recommendation}
            </span>
          </div>

          <div className="text-sm font-bold font-mono text-zinc-900">
            {evaluation.overallScore}/100
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Executive Summary */}
          {evaluation.summary && (
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
              <p className="text-xs text-zinc-700 leading-relaxed">
                {evaluation.summary}
              </p>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Technical Depth', val: evaluation.scores.technicalDepth },
              { label: 'Problem Solving', val: evaluation.scores.problemSolving },
              { label: 'Communication', val: evaluation.scores.communication },
              { label: 'System Thinking', val: evaluation.scores.structuredThinking },
            ].map((metric, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl border border-zinc-200 bg-white shadow-xs text-center"
              >
                <div className="text-lg font-bold font-mono text-zinc-900 mb-0.5">
                  {metric.val}%
                </div>
                <div className="text-[11px] text-zinc-500 font-medium">
                  {metric.label}
                </div>
                <div className="w-full bg-zinc-100 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 rounded-full"
                    style={{ width: `${metric.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-2xl border border-zinc-200 bg-white">
              <h3 className="text-xs font-semibold text-zinc-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Strengths
              </h3>
              <ul className="space-y-1.5 text-xs text-zinc-600">
                {evaluation.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-zinc-300">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="p-4 rounded-2xl border border-zinc-200 bg-white">
              <h3 className="text-xs font-semibold text-zinc-900 mb-2">
                Areas to Improve
              </h3>
              <ul className="space-y-1.5 text-xs text-zinc-600">
                {evaluation.improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-zinc-300">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Questions Analysis */}
          {evaluation.questionFeedback.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-900 mb-2">
                Question Breakdown
              </h3>

              <div className="space-y-2">
                {evaluation.questionFeedback.map((item, idx) => {
                  const isExpanded = expandedQuestion === idx;

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                        className="w-full p-3 text-left flex items-center justify-between gap-2 hover:bg-zinc-50 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-zinc-100 text-zinc-700 text-[11px] font-mono font-medium flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-medium text-zinc-800 truncate">
                            {item.question}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-semibold text-zinc-700">
                            {item.score}%
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-zinc-100 space-y-2 text-xs">
                          {item.answer && (
                            <div className="p-2.5 rounded-lg bg-zinc-50 text-zinc-600 italic">
                              "{item.answer}"
                            </div>
                          )}
                          <div className="p-2.5 rounded-lg bg-zinc-100/70 text-zinc-800 leading-relaxed">
                            {item.critique}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end">
          <button
            onClick={onRetake}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-xs transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
