import React, { useEffect, useState, useRef } from 'react';

export type AIAvatarState = 'idle' | 'speaking' | 'listening' | 'thinking';

export interface AIAvatarProps {
  state?: AIAvatarState;
  volume?: number; // 0 to 100
  className?: string;
  name?: string;
}

export const AIAvatar: React.FC<AIAvatarProps> = ({
  state = 'idle',
  volume = 0,
  className = '',
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthPhase, setMouthPhase] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Periodic natural blinking
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
      const nextBlink = Math.random() * 4000 + 2500;
      timeout = setTimeout(triggerBlink, nextBlink);
    };

    timeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // Continuous animation frame for mouth movement & subtle halo rotation
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (state === 'speaking') {
        setMouthPhase((prev) => (prev + delta * 12) % (Math.PI * 2));
      } else {
        setMouthPhase(0);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state]);

  const getMouthHeight = () => {
    if (state !== 'speaking') return 4;
    const baseWave = (Math.sin(mouthPhase) + 1) / 2;
    const harmonic = (Math.sin(mouthPhase * 2.3) + 1) / 4;
    const volFactor = volume > 0 ? (volume / 100) * 0.7 + 0.3 : 0.6;
    return 4 + (baseWave * 16 + harmonic * 8) * volFactor;
  };

  const getMouthWidth = () => {
    if (state !== 'speaking') return 28;
    const wave = (Math.cos(mouthPhase * 1.5) + 1) / 2;
    return 26 + wave * 8;
  };

  // State accents for light background
  const stateThemes = {
    speaking: {
      accent: '#2563eb',
      halo: 'rgba(37, 99, 235, 0.08)',
      ring: '#93c5fd',
    },
    listening: {
      accent: '#059669',
      halo: 'rgba(5, 150, 105, 0.08)',
      ring: '#86efac',
    },
    thinking: {
      accent: '#7c3aed',
      halo: 'rgba(124, 58, 237, 0.08)',
      ring: '#c4b5fd',
    },
    idle: {
      accent: '#71717a',
      halo: 'rgba(113, 113, 122, 0.04)',
      ring: '#e4e4e7',
    },
  };

  const theme = stateThemes[state];
  const mouthH = getMouthHeight();
  const mouthW = getMouthWidth();

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none bg-gradient-to-b from-white via-zinc-50/80 to-zinc-100/60 ${className}`}
    >
      {/* Subtle modern light studio backdrop */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#e4e4e7 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Gentle ambient halo behind avatar */}
      <div
        className="absolute w-[380px] h-[380px] rounded-full pointer-events-none transition-all duration-700 blur-3xl"
        style={{
          background: theme.halo,
        }}
      />

      {/* Halo ring for thinking / speaking */}
      {state === 'thinking' && (
        <div
          className="absolute w-[310px] h-[310px] rounded-full border border-dashed border-purple-300 pointer-events-none animate-spin"
          style={{ animationDuration: '10s' }}
        />
      )}

      {/* Main Avatar Illustration Canvas */}
      <div className="relative z-10 flex items-center justify-center w-full h-full max-w-md max-h-[440px] p-2">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72">
          {/* Subtle drop shadow beneath portrait */}
          <div className="absolute inset-x-8 bottom-2 h-10 bg-zinc-900/5 rounded-full blur-xl pointer-events-none" />

          <svg
            viewBox="0 0 240 240"
            className="w-full h-full filter drop-shadow-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="skinGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff1eb" />
                <stop offset="60%" stopColor="#fed7aa" />
                <stop offset="100%" stopColor="#fbcfe8" />
              </linearGradient>

              <linearGradient id="blazerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#18181b" />
                <stop offset="100%" stopColor="#27272a" />
              </linearGradient>
            </defs>

            {/* Torso / Blazer */}
            <path
              d="M35 240 C35 185 75 168 120 168 C165 168 205 185 205 240 Z"
              fill="url(#blazerGrad)"
            />

            {/* Inner White Shirt V-Neck */}
            <path
              d="M102 170 L120 200 L138 170 Z"
              fill="#ffffff"
            />
            {/* Subtle collar shadow */}
            <path
              d="M102 170 L120 192 L138 170 Z"
              fill="#f1f5f9"
            />

            {/* Blazer Lapels */}
            <path
              d="M86 172 L120 216 L108 240 L65 240 Z"
              fill="#0f172a"
              opacity="0.8"
            />
            <path
              d="M154 172 L120 216 L132 240 L175 240 Z"
              fill="#0f172a"
              opacity="0.8"
            />

            {/* Neck */}
            <path
              d="M105 130 C105 155 135 155 135 130 Z"
              fill="#fed7aa"
            />
            <path
              d="M106 135 C114 146 126 146 134 135 Z"
              fill="#fbcfe8"
              opacity="0.4"
            />

            {/* Head Silhouette */}
            <ellipse
              cx="120"
              cy="108"
              rx="46"
              ry="54"
              fill="url(#skinGradLight)"
            />

            {/* Hair - Back Layer */}
            <path
              d="M68 112 C64 65 80 42 120 42 C160 42 176 65 172 112 C172 136 178 160 178 172 C164 172 160 148 160 134 C160 85 156 68 120 68 C84 68 80 85 80 134 C80 148 76 172 62 172 C62 160 68 136 68 112 Z"
              fill="url(#hairGrad)"
            />

            {/* Ears */}
            <ellipse cx="73" cy="112" rx="6" ry="10" fill="#fed7aa" />
            <ellipse cx="167" cy="112" rx="6" ry="10" fill="#fed7aa" />

            {/* Minimalist Ear Studs */}
            <circle cx="73" cy="116" r="1.8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />
            <circle cx="167" cy="116" r="1.8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />

            {/* Hair Front Bangs / Modern Bob Style */}
            <path
              d="M72 96 C78 64 96 52 120 52 C148 52 164 64 168 96 C162 76 146 64 120 64 C92 64 78 76 72 96 Z"
              fill="url(#hairGrad)"
            />
            <path
              d="M72 96 C76 80 92 68 114 68 C124 68 130 72 138 78 C130 74 122 72 114 72 C96 72 82 82 72 96 Z"
              fill="#27272a"
            />

            {/* Eyebrows */}
            <path
              d="M88 94 Q100 90 108 93"
              stroke="#27272a"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M132 93 Q140 90 152 94"
              stroke="#27272a"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Eyes */}
            {isBlinking ? (
              // Blink state (soft closed lines)
              <g>
                <path
                  d="M89 107 Q98 111 107 107"
                  stroke="#18181b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M133 107 Q142 111 151 107"
                  stroke="#18181b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            ) : (
              // Open natural expressive eyes
              <g>
                {/* Left Eye */}
                <ellipse cx="98" cy="106" rx="8" ry="5.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />
                <circle cx="98" cy="106" r="4.2" fill="#1e293b" />
                <circle cx="99.5" cy="104.5" r="1.5" fill="#ffffff" />

                {/* Right Eye */}
                <ellipse cx="142" cy="106" rx="8" ry="5.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />
                <circle cx="142" cy="106" r="4.2" fill="#1e293b" />
                <circle cx="143.5" cy="104.5" r="1.5" fill="#ffffff" />
              </g>
            )}

            {/* Minimalist Eyeglasses (Titanium Frame) */}
            <rect
              x="86"
              y="97"
              width="24"
              height="18"
              rx="5"
              fill="none"
              stroke="#475569"
              strokeWidth="1.2"
              opacity="0.85"
            />
            <rect
              x="130"
              y="97"
              width="24"
              height="18"
              rx="5"
              fill="none"
              stroke="#475569"
              strokeWidth="1.2"
              opacity="0.85"
            />
            {/* Bridge */}
            <path
              d="M110 104 Q120 102 130 104"
              fill="none"
              stroke="#475569"
              strokeWidth="1.2"
            />

            {/* Refined Nose */}
            <path
              d="M120 107 L117 122 Q120 124 123 122"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Dynamic Mouth */}
            {state === 'speaking' ? (
              <g>
                <ellipse
                  cx="120"
                  cy="138"
                  rx={mouthW / 2}
                  ry={mouthH / 2}
                  fill="#7f1d1d"
                  stroke="#e11d48"
                  strokeWidth="1"
                />
                <rect
                  x={120 - mouthW / 3}
                  y={138 - mouthH / 2 + 1}
                  width={(mouthW / 3) * 2}
                  height={Math.min(mouthH * 0.35, 3)}
                  rx="1"
                  fill="#ffffff"
                />
              </g>
            ) : (
              <path
                d="M111 138 Q120 142 129 138"
                fill="none"
                stroke="#e11d48"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.75"
              />
            )}

            {/* Subtle natural blush */}
            <circle cx="94" cy="118" r="6" fill="#f43f5e" opacity="0.06" />
            <circle cx="146" cy="118" r="6" fill="#f43f5e" opacity="0.06" />
          </svg>
        </div>
      </div>
    </div>
  );
};
