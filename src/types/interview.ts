export type InterviewState = 
  | 'idle' 
  | 'setup' 
  | 'connecting' 
  | 'interviewer_speaking' 
  | 'candidate_speaking' 
  | 'ai_thinking' 
  | 'completed';

export interface InterviewTopic {
  id: string;
  name: string;
  role: string;
  level: 'Entry' | 'Mid-Level' | 'Senior' | 'Lead / Architect';
  description: string;
  suggestedQuestions?: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'candidate';
  text: string;
  timestamp: string;
  questionNumber?: number;
  audioFeedback?: {
    confidence?: number;
    durationSeconds?: number;
  };
}

export interface InterviewEvaluation {
  overallScore: number; // 0 - 100
  recommendation: 'Strong Hire' | 'Hire' | 'Borderline' | 'No Hire';
  summary: string;
  scores: {
    technicalDepth: number;
    communication: number;
    problemSolving: number;
    structuredThinking: number;
  };
  strengths: string[];
  improvements: string[];
  questionFeedback: {
    question: string;
    answer: string;
    critique: string;
    score: number;
  }[];
}

export interface InterviewConfig {
  apiKey: string;
  model: string;
  topic: string;
  role: string;
  level: string;
  totalQuestions: number;
  voiceName: string;
  speakingRate: number;
  autoSendSilenceDuration: number; // in seconds
  enableLiveCaptions: boolean;
  videoQuality: 'standard' | 'high';
}
