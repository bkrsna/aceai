import { InterviewEvaluation } from '../types/interview';

export interface GeminiModelOption {
  id: string;
  name: string;
  description: string;
  recommended?: boolean;
  badge?: string;
}

export const AVAILABLE_GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    description: 'Ultra-low latency, optimized for real-time conversational interviews',
    recommended: true,
    badge: 'Default / Fast',
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    description: 'High-speed reasoning model with rapid token generation',
    badge: 'High Speed',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Battle-tested balanced model for deep analysis and follow-ups',
    badge: 'Balanced',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Advanced reasoning and architectural evaluation capabilities',
    badge: 'Advanced',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    description: 'Next-generation preview model for cutting-edge intelligence',
    badge: 'Preview',
  },
];

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

export interface InitialGreetingAndQuestion {
  greeting: string;
  question: string;
}

export interface AnswerEvaluationAndNext {
  feedbackAck: string;
  nextQuestion: string;
  isFinal: boolean;
}

interface ChatHistoryItem {
  role?: 'ai' | 'candidate';
  sender?: 'ai' | 'candidate';
  text: string;
  questionNumber?: number;
}

/**
 * Clean and parse JSON response from Gemini, removing markdown code fences if present.
 */
function parseGeminiJson<T>(text: string, fallback: T): T {
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    clean = clean.trim();
    return JSON.parse(clean) as T;
  } catch (err) {
    console.warn('Failed to parse Gemini response as JSON. Raw text:', text, err);
    return fallback;
  }
}

/**
 * Direct call to Google Gemini generateContent REST endpoint
 */
async function callGeminiApi(
  apiKey: string,
  model: string,
  prompt: string,
  systemInstruction?: string,
  expectJson: boolean = true
): Promise<string> {
  const cleanModel = (model || DEFAULT_GEMINI_MODEL).trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    cleanModel
  )}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  if (systemInstruction) {
    contents.push({
      role: 'user',
      parts: [{ text: `[System Instructions / Persona]:\n${systemInstruction}` }],
    });
    contents.push({
      role: 'model',
      parts: [
        {
          text: 'Understood. I will act strictly as Ace, the empathetic yet rigorous technical interviewer, and format my responses as instructed.',
        },
      ],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.65,
      topP: 0.95,
      maxOutputTokens: 2048,
      ...(expectJson ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status} ${response.statusText}): ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const outputText = candidate?.content?.parts?.[0]?.text;

  if (!outputText) {
    throw new Error('Gemini API returned an empty response.');
  }

  return outputText;
}

// ============================================================================
// FALLBACK INTELLIGENT SIMULATION REPOSITORY
// Used seamlessly when API key is not yet configured or during offline testing
// ============================================================================

interface TopicQuestions {
  greetings: string[];
  questions: string[];
  followUps: string[];
}

const TOPIC_PRESETS: Record<string, TopicQuestions> = {
  frontend: {
    greetings: [
      "Hello and welcome! I'm Ace, your AI technical interviewer today. We're going to dive into frontend architecture, state management, and web performance. I want this to be an engaging conversation, so feel free to explain your thought process and any trade-offs you consider along the way.",
      "Hi there! Welcome to AceAI. Today we'll explore frontend engineering, from component design to browser internals. Whenever you are ready, let's get started with our first question.",
    ],
    questions: [
      "Could you explain the core reconciliation process in modern UI frameworks like React? Specifically, how does the virtual DOM or Fiber architecture identify updates, and what strategies do you employ to prevent unnecessary re-renders in complex dashboards?",
      "State management often dictates how easily a frontend codebase scales. How do you decide between local component state, React Context, and external state stores like Zustand or Redux? What architectural pitfalls have you encountered with global state?",
      "Web performance and Core Web Vitals (LCP, INP, CLS) are crucial for user experience. If a complex web application is experiencing sluggish interactions and high input delay, what systematic steps and browser tooling do you use to diagnose and fix it?",
      "Modern web apps must handle asynchronous operations, optimistic UI updates, and offline resilience. How do you design client-side caching and data-fetching pipelines to avoid race conditions and stale data?",
      "Let's look at frontend system architecture. How would you design a reusable, themeable Design System or Component Library meant to be consumed across dozens of micro-frontends or independent teams?",
    ],
    followUps: [
      "That's a very solid breakdown of the reconciliation cycle and memoization techniques.",
      "I appreciate your pragmatic take on state boundaries and minimizing re-render cascades.",
      "Great insights on profiling with Chrome DevTools and tackling JavaScript main-thread contention.",
      "Excellent explanation of managing concurrent network requests and maintaining optimistic UI integrity.",
      "Superb architectural design. You clearly understand modularity and design system governance.",
    ],
  },
  backend: {
    greetings: [
      "Welcome! I'm Ace, your AI interviewer. Today we'll be discussing backend engineering, distributed systems, database design, and scalability. Treat this like a collaborative architecture discussion with a fellow engineer.",
      "Hi! Welcome to your technical interview session. We'll explore backend architecture, concurrency, and resilient system design. Let's start with our first question.",
    ],
    questions: [
      "When designing public and internal APIs, how do you evaluate the trade-offs between RESTful HTTP, gRPC/Protobuf, and GraphQL? In what production scenario would you strictly favor one over the others?",
      "Database performance is often the primary bottleneck in scaling services. How do you approach query optimization, index design (B-Trees vs Hash indexes), and connection pooling when handling millions of concurrent reads and writes?",
      "In distributed architectures, caching with Redis or Memcached is ubiquitous. How do you safeguard against cache stampedes (dog-piling), cache penetration, and ensure consistent cache invalidation across distributed nodes?",
      "How do you handle distributed transactions and maintain data consistency across microservices? Could you explain how you might implement the Saga pattern or two-phase commit, and how you handle compensations when a step fails?",
      "Let's do a system design scenario: How would you architect a real-time event ingestion and notification engine capable of processing 100,000 events per second with guaranteed at-least-once delivery?",
    ],
    followUps: [
      "Great point regarding protocol efficiency and schema enforcement in microservice communication.",
      "You have a very sound grasp of index selectivity and connection lifecycle management.",
      "I like how you addressed cache stampedes with probabilistic early expiration and distributed mutexes.",
      "Very lucid explanation of the Saga pattern and designing idempotent compensation handlers.",
      "Strong architectural breakdown of partitioning, consumer groups, and dead-letter queue strategies.",
    ],
  },
  fullstack: {
    greetings: [
      "Hello and welcome! I'm Ace, your technical interviewer. Today we'll cover end-to-end full stack development, spanning user interfaces, backend APIs, data modeling, and production deployment.",
      "Hi there! Welcome to your AceAI interview session. We will touch both client-side and server-side engineering today. Let's begin with our first question.",
    ],
    questions: [
      "When architecting a full-stack feature from scratch, how do you establish end-to-end type safety between client and server (e.g., tRPC, OpenAPI code generation, or GraphQL codegen)? What are the productivity vs flexibility trade-offs?",
      "Authentication and authorization are critical. How would you design a secure session management and authentication flow supporting both browser web clients (SPAs) and mobile native apps, mitigating XSS and CSRF risks?",
      "How do you approach database schema migrations in zero-downtime production environments? What steps do you take when renaming columns or altering tables with hundreds of millions of records?",
      "Real-time bidirectional synchronization is becoming a requirement for modern apps. How would you choose between WebSockets, Server-Sent Events (SSE), and long-polling for a collaborative workspace application?",
      "Imagine you need to deploy and monitor a high-traffic full stack application. What is your strategy for CI/CD pipelines, containerization, observability (metrics, logs, traces), and incident rollback?",
    ],
    followUps: [
      "That is a great perspective on sharing schemas and maintaining strict contract validation across tiers.",
      "Excellent breakdown of HttpOnly cookies, refresh token rotation, and threat mitigation.",
      "Your multi-step schema expansion and contraction strategy for zero downtime is spot-on.",
      "Very clear comparison between WebSockets full-duplex overhead and Server-Sent Events efficiency.",
      "Comprehensive approach to canary deployments, OpenTelemetry tracing, and automated health checks.",
    ],
  },
};

function getPresetCategory(topic: string, role: string): TopicQuestions {
  const combined = `${topic} ${role}`.toLowerCase();
  if (combined.includes('front') || combined.includes('react') || combined.includes('ui') || combined.includes('web')) {
    return TOPIC_PRESETS.frontend;
  }
  if (combined.includes('back') || combined.includes('system') || combined.includes('database') || combined.includes('cloud') || combined.includes('devops') || combined.includes('api')) {
    return TOPIC_PRESETS.backend;
  }
  return TOPIC_PRESETS.fullstack;
}

// ============================================================================
// EXPORTED CORE API FUNCTIONS
// ============================================================================

/**
 * Validates Gemini API Key by sending a lightweight minimal query.
 */
export async function testGeminiConnection(
  apiKey: string,
  model: string = DEFAULT_GEMINI_MODEL
): Promise<{ success: boolean; message: string }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { success: false, message: 'No API key provided.' };
  }

  try {
    const text = await callGeminiApi(
      apiKey,
      model,
      'Respond with a JSON object: {"status":"connected","model":"' + model + '"}',
      'You are a status checking utility. Always output strict JSON.',
      true
    );
    const parsed = parseGeminiJson<{ status?: string }>(text, {});
    if (parsed.status === 'connected') {
      return { success: true, message: `Successfully connected to Gemini API (${model}).` };
    }
    return { success: true, message: `Connected to Gemini API (${model}).` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: msg };
  }
}

/**
 * 1. Generates the initial interview greeting and Question 1 based on topic, role, and level.
 */
export async function generateInitialGreetingAndQuestion(
  topic: string,
  role: string,
  level: string,
  apiKey?: string,
  model?: string
): Promise<InitialGreetingAndQuestion> {
  const targetModel = model || DEFAULT_GEMINI_MODEL;

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const prompt = `
Generate an initial greeting and the first interview question for a candidate.
Role: ${role}
Seniority Level: ${level}
Topic / Focus Area: ${topic}

Requirements:
1. "greeting": A warm, encouraging, and professional opening statement from "Ace", the AI technical interviewer (2 to 3 sentences). Welcome the candidate, mention their target role (${level} ${role}), and invite them to share their thought process.
2. "question": The first technical question (Question 1 of 5). It should test core foundational principles relevant to ${topic} at a ${level} level. It should be open-ended enough for the candidate to demonstrate depth.

Output strictly as a JSON object with this exact shape:
{
  "greeting": "...",
  "question": "..."
}
`;

      const systemPrompt = `You are Ace, an elite, friendly, and perceptive AI technical interviewer conducting a mock interview for high-growth tech companies. Speak naturally, professionally, and concisely. Output valid JSON only.`;

      const responseText = await callGeminiApi(apiKey, targetModel, prompt, systemPrompt, true);
      const parsed = parseGeminiJson<InitialGreetingAndQuestion>(responseText, {
        greeting: '',
        question: '',
      });

      if (parsed.greeting && parsed.question) {
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini API call failed for initial question, using simulated engine fallback:', err);
    }
  }

  // Fallback realistic simulation
  const preset = getPresetCategory(topic, role);
  const greeting =
    preset.greetings[Math.floor(Math.random() * preset.greetings.length)]
      .replace('{role}', role)
      .replace('{level}', level)
      .replace('{topic}', topic);

  const question = preset.questions[0];

  return { greeting, question };
}

/**
 * 2. Evaluates the candidate's answer to the current question, provides brief encouraging feedback,
 * and asks the next question (or concludes if final question reached).
 */
export async function evaluateAnswerAndAskNext(
  topic: string,
  role: string,
  level: string,
  questionNumber: number,
  totalQuestions: number,
  currentQuestion: string,
  candidateAnswer: string,
  history: ChatHistoryItem[],
  apiKey?: string,
  model?: string
): Promise<AnswerEvaluationAndNext> {
  const isFinal = questionNumber >= totalQuestions;
  const targetModel = model || DEFAULT_GEMINI_MODEL;

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const formattedHistory = history
        .map((h) => `${(h.role || h.sender || 'ai').toUpperCase()}: ${h.text}`)
        .slice(-6)
        .join('\n');

      const prompt = `
You are conducting a technical interview for:
Role: ${level} ${role}
Focus: ${topic}
Current Question Index: Question ${questionNumber} of ${totalQuestions}
Is Final Question: ${isFinal ? 'YES' : 'NO'}

Current Question Asked:
"${currentQuestion}"

Candidate's Answer:
"${candidateAnswer}"

Recent Conversation Context:
${formattedHistory}

Your task:
1. "feedbackAck": A 1-2 sentence conversational acknowledgment of the candidate's answer. Highlight something specific they said (e.g. "I like your point on...", "That is a practical trade-off regarding..."). Keep it positive, conversational, and realistic. Do NOT reveal numeric scores or hire decisions here.
2. "nextQuestion":
   - If this is NOT the final question (questionNumber < ${totalQuestions}): Ask Question ${questionNumber + 1}. Progress naturally into the next dimension of ${topic} (e.g. edge cases, scalability, fault tolerance, system design, or architectural trade-offs suitable for ${level} level).
   - If this IS the final question (questionNumber >= ${totalQuestions}): Provide a warm closing remark thanking them for their time and stating that you will now generate their detailed interview scorecard and evaluation report.
3. "isFinal": boolean (${isFinal})

Return strictly a JSON object:
{
  "feedbackAck": "string",
  "nextQuestion": "string",
  "isFinal": ${isFinal}
}
`;

      const systemPrompt = `You are Ace, an experienced engineering interviewer. Maintain an empathetic, professional tone. Avoid robotic language. Output strict JSON.`;

      const responseText = await callGeminiApi(apiKey, targetModel, prompt, systemPrompt, true);
      const parsed = parseGeminiJson<AnswerEvaluationAndNext>(responseText, {
        feedbackAck: '',
        nextQuestion: '',
        isFinal,
      });

      if (parsed.feedbackAck && parsed.nextQuestion) {
        return {
          feedbackAck: parsed.feedbackAck,
          nextQuestion: parsed.nextQuestion,
          isFinal,
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed for next question, using fallback simulation:', err);
    }
  }

  // Fallback realistic simulation
  const preset = getPresetCategory(topic, role);
  const ackIndex = Math.min(questionNumber - 1, preset.followUps.length - 1);
  let feedbackAck = preset.followUps[ackIndex] || 'Thank you for explaining your thought process in such detail.';

  // Personalize acknowledgment based on candidate answer keywords
  const lowerAns = candidateAnswer.toLowerCase();
  if (lowerAns.includes('trade-off') || lowerAns.includes('tradeoff')) {
    feedbackAck = `I appreciate how you weighed the trade-offs there. That shows strong engineering maturity.`;
  } else if (lowerAns.includes('performance') || lowerAns.includes('bottleneck') || lowerAns.includes('cache')) {
    feedbackAck = `Great focus on latency and performance implications. Those details make a huge difference in production.`;
  } else if (candidateAnswer.trim().length < 30) {
    feedbackAck = `Thanks for that concise overview. Let's move into our next topic to explore further.`;
  }

  if (isFinal) {
    return {
      feedbackAck,
      nextQuestion:
        "That wraps up all our questions for today! You did a fantastic job navigating through each problem. I am now compiling our conversation into your comprehensive technical evaluation and performance breakdown.",
      isFinal: true,
    };
  }

  const nextQIndex = questionNumber;
  const nextQuestion =
    preset.questions[nextQIndex] ||
    `Building on your points, how would you design a scalable telemetry and monitoring strategy for ${topic} to detect regressions early in a production CI/CD environment?`;

  return {
    feedbackAck,
    nextQuestion,
    isFinal: false,
  };
}

/**
 * 3. Generates a comprehensive final evaluation report and scorecard across all answered questions.
 */
export async function generateComprehensiveEvaluation(
  topic: string,
  role: string,
  level: string,
  history: ChatHistoryItem[],
  apiKey?: string,
  model?: string
): Promise<InterviewEvaluation> {
  const targetModel = model || DEFAULT_GEMINI_MODEL;

  // Extract Question & Answer pairs from history
  const qaPairs: Array<{ question: string; answer: string }> = [];
  let currentQ = '';

  for (const item of history) {
    const isAi = (item.role || item.sender) === 'ai';
    if (isAi) {
      currentQ = item.text;
    } else if (currentQ) {
      qaPairs.push({
        question: currentQ,
        answer: item.text,
      });
      currentQ = '';
    }
  }

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const fullTranscript = history
        .map((h) => `[${(h.role || h.sender || 'ai').toUpperCase()}]: ${h.text}`)
        .join('\n\n');

      const prompt = `
Analyze this completed technical interview transcript and generate an exhaustive, high-caliber evaluation scorecard.

Candidate Profile:
- Target Role: ${role}
- Seniority Level: ${level}
- Primary Topic: ${topic}

Full Interview Transcript:
${fullTranscript}

Requirements for the JSON response:
1. "overallScore": integer between 0 and 100 representing composite performance.
2. "recommendation": exactly one of ["Strong Hire", "Hire", "Borderline", "No Hire"].
   - 88-100: "Strong Hire"
   - 74-87: "Hire"
   - 58-73: "Borderline"
   - 0-57: "No Hire"
3. "summary": A cohesive 3-4 sentence executive overview summarizing the candidate's core competencies, depth of technical discussion, communication style, and readiness for a ${level} ${role}.
4. "scores": An object with individual integer ratings (0 to 100) for:
   - "technicalDepth": understanding of core principles, edge cases, algorithms, and system mechanics.
   - "communication": clarity, conciseness, articulation of ideas, and structuring of explanations.
   - "problemSolving": analytical thinking, approach to trade-offs, and troubleshooting logic.
   - "structuredThinking": methodical breakdown, architectural hygiene, and handling ambiguity.
5. "strengths": An array of 3 to 4 specific, actionable bullet points highlighting what the candidate did exceptionally well.
6. "improvements": An array of 2 to 4 actionable, constructive suggestions on what the candidate could improve or dive deeper into.
7. "questionFeedback": An array of feedback objects corresponding to each question asked:
   [
     {
       "question": "string (the interview question asked)",
       "answer": "string (brief summary or candidate response snippet)",
       "critique": "string (2-3 sentences evaluating the candidate's specific answer, noting strong points and missing nuances)",
       "score": integer (0 to 100)
     }
   ]

Return strictly valid JSON matching this schema with no extra wrapping.
`;

      const systemPrompt = `You are a Principal Engineering Director and Hiring Committee Chair at a Tier-1 tech company. Provide rigorous, fair, and constructive evaluations with realistic metrics. Output valid JSON only.`;

      const responseText = await callGeminiApi(apiKey, targetModel, prompt, systemPrompt, true);
      const parsed = parseGeminiJson<InterviewEvaluation>(responseText, null as unknown as InterviewEvaluation);

      if (parsed && typeof parsed.overallScore === 'number' && parsed.scores && Array.isArray(parsed.strengths)) {
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini API call failed for evaluation scorecard, using fallback simulation:', err);
    }
  }

  // Fallback realistic simulation
  return generateSimulatedEvaluation(topic, role, level, qaPairs);
}

/**
 * Deterministic, intelligent simulation for interview evaluation when API key is offline
 */
function generateSimulatedEvaluation(
  topic: string,
  role: string,
  level: string,
  qaPairs: Array<{ question: string; answer: string }>
): InterviewEvaluation {
  const answerCount = qaPairs.length;
  let totalLength = 0;
  let technicalTermHits = 0;

  const keyWords = [
    'performance', 'scalability', 'trade-off', 'latency', 'cache', 'architecture',
    'security', 'database', 'asynchronous', 'concurrency', 'state', 'optimization',
    'index', 'component', 'lifecycle', 'reconciliation', 'distributed', 'resilience'
  ];

  qaPairs.forEach((pair) => {
    totalLength += pair.answer.length;
    const lower = pair.answer.toLowerCase();
    keyWords.forEach((kw) => {
      if (lower.includes(kw)) technicalTermHits++;
    });
  });

  const avgLength = answerCount > 0 ? totalLength / answerCount : 0;

  // Compute realistic scores based on response depth and breadth
  let technicalDepth = Math.min(94, Math.max(62, Math.round(68 + (technicalTermHits * 2.5) + (avgLength > 150 ? 8 : 0))));
  let communication = Math.min(96, Math.max(65, Math.round(72 + (avgLength > 100 ? 10 : 0) + (avgLength > 250 ? 5 : -4))));
  let problemSolving = Math.min(92, Math.max(60, Math.round(70 + (technicalTermHits * 2))));
  let structuredThinking = Math.min(95, Math.max(64, Math.round(74 + (answerCount >= 4 ? 10 : 0))));

  const overallScore = Math.round(
    technicalDepth * 0.35 +
    communication * 0.25 +
    problemSolving * 0.25 +
    structuredThinking * 0.15
  );

  let recommendation: 'Strong Hire' | 'Hire' | 'Borderline' | 'No Hire';
  if (overallScore >= 87) {
    recommendation = 'Strong Hire';
  } else if (overallScore >= 74) {
    recommendation = 'Hire';
  } else if (overallScore >= 60) {
    recommendation = 'Borderline';
  } else {
    recommendation = 'No Hire';
  }

  const questionFeedback = qaPairs.map((pair, idx) => {
    const qScore = Math.min(98, Math.max(55, Math.round(overallScore + (idx % 2 === 0 ? 3 : -2))));
    return {
      question: pair.question,
      answer: pair.answer.length > 180 ? `${pair.answer.substring(0, 180)}...` : pair.answer,
      critique: `Demonstrated solid foundational awareness in Question ${idx + 1}. The response highlighted key trade-offs and practical architectural choices, though diving deeper into concrete edge cases and failure modes would elevate it further.`,
      score: qScore,
    };
  });

  // Default if no questions answered yet
  if (questionFeedback.length === 0) {
    questionFeedback.push({
      question: `Core architectural review on ${topic}`,
      answer: 'Standard interview completion sample response.',
      critique: 'Clear and structured articulation of system design principles and runtime trade-offs.',
      score: 82,
    });
  }

  return {
    overallScore,
    recommendation,
    summary: `The candidate demonstrated commendable engineering aptitude throughout this ${level} ${role} technical interview on ${topic}. They articulated concepts with clarity, showed strong intuition around system performance and trade-offs, and navigated problem decomposition effectively. Overall, a promising technical profile ready for high-impact production contributions.`,
    scores: {
      technicalDepth,
      communication,
      problemSolving,
      structuredThinking,
    },
    strengths: [
      `Strong foundational knowledge of ${topic} and pragmatic understanding of production trade-offs.`,
      'Methodical approach to problem-solving, breaking complex requirements into manageable components.',
      'Clear, articulate verbal communication style with proactive consideration of latency and scalability.',
      'Solid command of architectural patterns and ability to explain the "why" behind technical decisions.',
    ],
    improvements: [
      'Could delve deeper into specific edge cases, failure domains, and distributed fault tolerance scenarios.',
      'Consider referencing concrete telemetry metrics (e.g. p99 latencies, cache hit ratios, error budgets) to substantiate architectural choices.',
      'Practice formulating structured opening hypotheses before diving straight into technical implementation details.',
    ],
    questionFeedback,
  };
}
