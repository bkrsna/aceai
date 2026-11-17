import { InterviewConfig, InterviewTopic } from '../types/interview';

export const PRESET_TOPICS: InterviewTopic[] = [
  {
    id: 'frontend-react',
    name: 'Frontend Engineer (React & TypeScript)',
    role: 'Frontend Engineer',
    level: 'Senior',
    description: 'Modern React patterns, performance optimization, state architecture, and browser internals.',
    suggestedQuestions: [
      'Can you explain how React 18 concurrent rendering and fiber architecture improve user interface responsiveness under heavy loads?',
      'Walk me through how you diagnose and fix unnecessary re-renders in a complex React tree with deep component hierarchies.',
      'How would you architect a global state management system in TypeScript handling optimistic updates and cache invalidation?',
      'What strategies do you use for optimizing Core Web Vitals (LCP, INP, CLS) on large single-page applications?',
      'Tell me about a challenging frontend architecture bug or trade-off you had to make in production.'
    ]
  },
  {
    id: 'fullstack-web',
    name: 'Fullstack Engineer (TypeScript & Node)',
    role: 'Fullstack Engineer',
    level: 'Senior',
    description: 'End-to-end web architecture, API design, database schemas, and microservice integration.',
    suggestedQuestions: [
      'How do you design a high-throughput REST or GraphQL API that handles sudden traffic spikes safely?',
      'Compare database transaction isolation levels and explain how you handle race conditions in database mutations.',
      'How do you implement secure JWT authentication with refresh token rotation and CSRF protection?',
      'Describe your approach to designing resilient background worker queues for asynchronous task processing.',
      'Describe a real-world production outage you debugged across the full stack and what you learned.'
    ]
  },
  {
    id: 'system-design',
    name: 'System Design & Cloud Architecture',
    role: 'Cloud & Systems Architect',
    level: 'Senior',
    description: 'Distributed systems, high-availability data pipelines, sharding, and resilience.',
    suggestedQuestions: [
      'Design a globally distributed URL shortening service like Bitly handling 100M daily active users.',
      'How do you structure database sharding and consistent hashing when scaling beyond a single database cluster?',
      'Explain how you would design a real-time collaborative document editing system (like Google Docs or Figma).',
      'What patterns would you choose for cross-region data replication and disaster recovery?',
      'How do you prevent cascading failures and mitigate thundering herd problems in microservice architectures?'
    ]
  },
  {
    id: 'algorithms',
    name: 'Data Structures & Algorithms',
    role: 'Software Engineer',
    level: 'Mid-Level',
    description: 'Algorithmic complexity, graph traversals, dynamic programming, and space-time trade-offs.',
    suggestedQuestions: [
      'Explain how you would implement an LRU cache with O(1) get and put time complexity.',
      'How do you identify whether a problem can be solved with dynamic programming vs a greedy algorithm?',
      'Walk through how Dijkstra or A* search works and when you would prefer one over the other.',
      'How would you detect cycles in a directed graph and topological ordering?',
      'Explain how tries or suffix trees are used in auto-completion search engines.'
    ]
  },
  {
    id: 'behavioral',
    name: 'Behavioral & Engineering Leadership',
    role: 'Tech Lead / Staff Engineer',
    level: 'Lead / Architect',
    description: 'Conflict resolution, technical mentorship, cross-team alignment, and crisis ownership.',
    suggestedQuestions: [
      'Tell me about a time you had a strong technical disagreement with a team member or principal architect. How did you resolve it?',
      'How do you prioritize technical debt versus tight business deadlines when roadmap pressure is high?',
      'Can you describe a project that missed its deadline or failed in production? What accountability did you take?',
      'How do you mentor junior and mid-level engineers to help them level up their engineering autonomy?',
      'Describe how you convinced non-technical stakeholders to invest in a major architectural overhaul.'
    ]
  }
];

export const DEFAULT_CONFIG: InterviewConfig = {
  apiKey: '',
  model: 'gemini-3.5-flash-lite',
  topic: PRESET_TOPICS[0].name,
  role: PRESET_TOPICS[0].role,
  level: PRESET_TOPICS[0].level,
  totalQuestions: 5,
  voiceName: 'Sophia',
  speakingRate: 1.0,
  autoSendSilenceDuration: 3,
  enableLiveCaptions: true,
  videoQuality: 'high'
};

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Target Model)', badge: 'Default' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (High Speed)', badge: 'Ultra Fast' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', badge: 'Fast' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', badge: 'Standard' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Analysis)', badge: 'Deep' }
];
