# AceAI - AI Video Interview Platform

An AI-powered video interview platform built with **React**, **TypeScript**, **Tailwind CSS**, and **Google Gemini** (`gemini-3.5-flash-lite`).

AceAI simulates a real technical video call between an **AI Interviewer (Dr. Sophia Chen)** and the **Candidate**, featuring speech-to-text audio capture, live text-to-speech audio output, dynamic avatar lip-sync, real-time closed captions, and comprehensive evaluation reports.

---

## 🚀 Key Features

1. **Split-Screen Video Call Layout**:
   - **Left Partition (AI Interviewer)**: Features Dr. Sophia Chen with an animated digital avatar, audio waveform reactivity, expression states (`speaking`, `listening`, `thinking`, `idle`), volume meter, and live subtitles.
   - **Right Partition (Candidate)**: Live webcam stream (`navigator.mediaDevices.getUserMedia`), real-time microphone volume visualizer, voice activity detection, and streaming speech-to-text closed captions.
   - **Video Call Controls**: Floating toolbar with microphone mute/unmute, camera toggle, captions (CC) toggle, transcript drawer, quick answer submission, settings, and end interview button.

2. **Gemini 3.5 Flash Lite Model**:
   - Built with `gemini-3.5-flash-lite` as the primary target model for ultra-fast, low-latency processing.
   - Multi-model fallback (`gemini-2.5-flash-lite`, `gemini-2.0-flash-lite`, `gemini-1.5-flash`) ensures uninterrupted operation.
   - Built-in simulation fallback engine enables testing the interview flow without requiring an API key.

3. **Voice Audio In & Out**:
   - **Text-to-Speech (TTS)**: The AI's questions are spoken aloud using browser SpeechSynthesis with natural voice selection. Mouth movement and audio waves animate dynamically as words are spoken.
   - **Speech-to-Text (STT)**: Candidate answers are captured continuously via Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`), streaming live subtitles to the candidate screen before transmitting the response to Gemini.

4. **Structured 5-Question Interview Flow**:
   - Customizable topics: Frontend React/TypeScript, Fullstack, System Design, Data Structures & Algorithms, Behavioral Leadership, or custom topics.
   - Experience levels: Entry, Mid, Senior, Lead / Architect.
   - Top progress bar tracking Question 1 through 5, with live interview duration timer.

5. **In-Depth Evaluation & Scorecard**:
   - After question 5 (or ending early), Gemini evaluates the candidate's answers and generates:
     - Overall Score (0-100) with animated celebration.
     - Recommendation badge (Strong Hire, Hire, Borderline, No Hire).
     - Breakdown for Technical Depth, Communication, Problem Solving, and Structured Thinking.
     - Key Strengths and Growth Areas.
     - Per-question response critique and scores.
     - Exportable report and copyable transcript.

---

## 🛠️ Development & Running

### Prerequisites
- Node.js 18+ (tested on Node.js 24)
- Modern web browser (Chrome, Edge, Safari, Brave) supporting Web Speech API & MediaDevices.

### Install & Start
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Or build and preview production bundle
npm run build
npm run preview
```

Open `http://localhost:3000` or `http://localhost:3001` in your browser.
