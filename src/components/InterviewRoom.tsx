import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  InterviewConfig,
  ChatMessage,
  InterviewEvaluation,
  InterviewState
} from '../types/interview';
import { DEFAULT_CONFIG } from '../constants/topics';
import { useCamera } from '../hooks/useCamera';
import { useSpeech } from '../hooks/useSpeech';
import { Header } from './Header';
import { AIPartition } from './AIPartition';
import { CandidatePartition } from './CandidatePartition';
import { CallControls } from './CallControls';
import { TranscriptDrawer } from './TranscriptDrawer';
import { SetupModal } from './SetupModal';
import { InterviewSummaryModal } from './InterviewSummaryModal';
import { askGeminiQuestion, evaluateInterview } from '../services/geminiService';

export const InterviewRoom: React.FC = () => {
  // App configurations and modal states
  const [config, setConfig] = useState<InterviewConfig>(DEFAULT_CONFIG);
  const [isSetupOpen, setIsSetupOpen] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  // Split-screen expansion state: null = split 50-50, 'ai' = AI full, 'candidate' = Candidate full
  const [pinnedPartition, setPinnedPartition] = useState<'ai' | 'candidate' | null>(null);

  // Audio / Captions UI preferences
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(true);
  const [isAIMuted, setIsAIMuted] = useState(false);

  // Interview Progression
  const [interviewState, setInterviewState] = useState<InterviewState>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Conversation history & evaluation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [qaHistory, setQaHistory] = useState<{ question: string; answer: string }[]>([]);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Camera & Mic Hook
  const {
    stream,
    isCameraOn,
    isMicOn,
    toggleCamera,
    toggleMic,
    audioVolume,
    isSpeaking: isUserSpeaking
  } = useCamera(true);

  // Speech Recognition & Speech Synthesis Hook
  const {
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSpeakingAI,
    speakAI,
    stopSpeakingAI
  } = useSpeech(isMicOn);

  // Conversation history for Gemini API context
  const geminiHistoryRef = useRef<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);

  // Timer counter
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (interviewState !== 'idle' && interviewState !== 'setup' && interviewState !== 'completed') {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [interviewState]);

  // Handle asking a new question
  const presentQuestion = useCallback(
    async (qNum: number) => {
      setInterviewState('ai_thinking');

      // Fetch or generate question
      const question = await askGeminiQuestion(config, qNum, geminiHistoryRef.current);
      setCurrentQuestionText(question);

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: question,
        timestamp,
        questionNumber: qNum
      };

      setMessages((prev) => [...prev, newMsg]);
      setUnreadCount((prev) => prev + 1);

      // Add to gemini context history
      geminiHistoryRef.current.push({
        role: 'model',
        parts: [{ text: question }]
      });

      // AI speaks the question aloud
      setInterviewState('interviewer_speaking');
      if (!isAIMuted) {
        speakAI(question, () => {
          setInterviewState('candidate_speaking');
          resetTranscript();
          startListening();
        });
      } else {
        setInterviewState('candidate_speaking');
        resetTranscript();
        startListening();
      }
    },
    [config, isAIMuted, resetTranscript, speakAI, startListening]
  );

  // Start interview from setup
  const handleStartInterview = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
    setIsSetupOpen(false);
    setInterviewState('connecting');
    setElapsedSeconds(0);
    setCurrentQuestionIndex(1);
    setMessages([]);
    setQaHistory([]);
    geminiHistoryRef.current = [];

    setTimeout(() => {
      presentQuestion(1);
    }, 800);
  };

  // Submit Candidate Answer
  const handleSubmitAnswer = async () => {
    stopListening();
    const candidateAnswer = transcript.trim() || 'I have completed my answer to this question.';
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newAnswerMsg: ChatMessage = {
      id: `candidate-${Date.now()}`,
      sender: 'candidate',
      text: candidateAnswer,
      timestamp,
      questionNumber: currentQuestionIndex
    };

    setMessages((prev) => [...prev, newAnswerMsg]);
    setUnreadCount((prev) => prev + 1);

    const updatedQA = [
      ...qaHistory,
      { question: currentQuestionText, answer: candidateAnswer }
    ];
    setQaHistory(updatedQA);

    geminiHistoryRef.current.push({
      role: 'user',
      parts: [{ text: candidateAnswer }]
    });

    resetTranscript();

    // Check if interview is finished
    if (currentQuestionIndex >= config.totalQuestions) {
      setInterviewState('ai_thinking');
      const evalReport = await evaluateInterview(config, updatedQA);
      setEvaluation(evalReport);
      setInterviewState('completed');
      setIsSummaryOpen(true);
    } else {
      const nextQ = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQ);
      presentQuestion(nextQ);
    }
  };

  // End interview early and evaluate
  const handleEndInterview = async () => {
    stopSpeakingAI();
    stopListening();
    setInterviewState('ai_thinking');

    const historyToEval = qaHistory.length > 0
      ? qaHistory
      : [{ question: currentQuestionText || 'Technical Overview', answer: transcript || 'No full answer recorded' }];

    const evalReport = await evaluateInterview(config, historyToEval);
    setEvaluation(evalReport);
    setInterviewState('completed');
    setIsSummaryOpen(true);
  };

  // Retake interview
  const handleRetake = () => {
    setIsSummaryOpen(false);
    setIsSetupOpen(true);
    setInterviewState('idle');
    setElapsedSeconds(0);
    resetTranscript();
  };

  // Avatar state mapping
  const getAvatarState = () => {
    if (interviewState === 'interviewer_speaking' || isSpeakingAI) return 'speaking';
    if (interviewState === 'candidate_speaking') return 'listening';
    if (interviewState === 'ai_thinking') return 'thinking';
    return 'idle';
  };

  // Keyboard shortcut: Enter to submit answer when candidate is answering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || interviewState === 'candidate_speaking')) {
        // If not typing in an input
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
          return;
        }
        if (interviewState === 'candidate_speaking') {
          e.preventDefault();
          handleSubmitAnswer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interviewState, transcript]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-50 text-zinc-900 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Header Bar */}
      <Header
        topic={config.topic}
        level={config.level}
        currentQuestion={currentQuestionIndex}
        totalQuestions={config.totalQuestions}
        elapsedSeconds={elapsedSeconds}
        modelName={config.model}
        isConnected={interviewState !== 'idle' && interviewState !== 'setup'}
        onOpenInfo={() => setIsSetupOpen(true)}
      />

      {/* 2. Main Center Video Partition Grid */}
      <main className="flex-1 w-full min-h-0 p-3 sm:p-4 overflow-hidden flex flex-col justify-center">
        <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch">
          {/* Left Partition: AI Interviewer */}
          <div
            className={`transition-all duration-300 flex flex-col ${
              pinnedPartition === 'ai'
                ? 'w-full h-full md:w-full'
                : pinnedPartition === 'candidate'
                ? 'hidden'
                : 'w-full md:w-1/2 h-1/2 md:h-full'
            }`}
          >
            <AIPartition
              avatarState={getAvatarState()}
              currentSpeechText={currentQuestionText}
              isCaptionsEnabled={isCaptionsEnabled}
              volume={isSpeakingAI ? 70 : 0}
              isMuted={isAIMuted}
              onToggleMute={() => setIsAIMuted(!isAIMuted)}
              isExpanded={pinnedPartition === 'ai'}
              onToggleExpand={() =>
                setPinnedPartition(pinnedPartition === 'ai' ? null : 'ai')
              }
            />
          </div>

          {/* Right Partition: Interviewee / Candidate Screen */}
          <div
            className={`transition-all duration-300 flex flex-col ${
              pinnedPartition === 'candidate'
                ? 'w-full h-full md:w-full'
                : pinnedPartition === 'ai'
                ? 'hidden'
                : 'w-full md:w-1/2 h-1/2 md:h-full'
            }`}
          >
            <CandidatePartition
              stream={stream}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              candidateName="You"
              audioVolume={audioVolume}
              isSpeaking={isUserSpeaking}
              liveTranscript={transcript}
              isCaptionsEnabled={isCaptionsEnabled}
              canSubmitAnswer={interviewState === 'candidate_speaking'}
              onSubmitAnswer={handleSubmitAnswer}
              isExpanded={pinnedPartition === 'candidate'}
              onToggleExpand={() =>
                setPinnedPartition(pinnedPartition === 'candidate' ? null : 'candidate')
              }
              onToggleMic={toggleMic}
              onToggleCamera={toggleCamera}
            />
          </div>
        </div>
      </main>

      {/* 3. Bottom Toolbar Call Controls */}
      <footer className="w-full px-4 pb-3 pt-1 shrink-0 z-30">
        <CallControls
          isMicOn={isMicOn}
          onToggleMic={toggleMic}
          isCameraOn={isCameraOn}
          onToggleCamera={toggleCamera}
          isCaptionsEnabled={isCaptionsEnabled}
          onToggleCaptions={() => setIsCaptionsEnabled(!isCaptionsEnabled)}
          isTranscriptOpen={isTranscriptOpen}
          onToggleTranscript={() => {
            setIsTranscriptOpen(!isTranscriptOpen);
            setUnreadCount(0);
          }}
          unreadTranscriptCount={unreadCount}
          canSubmitAnswer={interviewState === 'candidate_speaking'}
          onSubmitAnswer={handleSubmitAnswer}
          onOpenSettings={() => setIsSetupOpen(true)}
          onEndInterview={handleEndInterview}
        />
      </footer>

      {/* 4. Slide-out Transcript Drawer */}
      <TranscriptDrawer
        isOpen={isTranscriptOpen}
        onClose={() => setIsTranscriptOpen(false)}
        messages={messages}
        candidateName="You"
      />

      {/* 5. Setup Modal */}
      <SetupModal
        isOpen={isSetupOpen}
        initialConfig={config}
        onStartInterview={handleStartInterview}
        stream={stream}
        audioVolume={audioVolume}
        isCameraOn={isCameraOn}
        isMicOn={isMicOn}
        onToggleCamera={toggleCamera}
        onToggleMic={toggleMic}
      />

      {/* 6. Scorecard & Summary Evaluation Modal */}
      {evaluation && (
        <InterviewSummaryModal
          isOpen={isSummaryOpen}
          evaluation={evaluation}
          messages={messages}
          topic={config.topic}
          role={config.role}
          level={config.level}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
};
