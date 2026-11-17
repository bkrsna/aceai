import React, { useEffect, useRef } from 'react';

export interface AudioVisualizerProps {
  isActive?: boolean;
  volume?: number; // 0 to 100
  color?: 'blue' | 'purple' | 'emerald' | 'amber' | 'cyan' | 'zinc';
  mode?: 'bars' | 'wave' | 'dots';
  barCount?: number;
  height?: number;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive = false,
  volume = 0,
  color = 'zinc',
  mode = 'bars',
  barCount = 16,
  height = 20,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  // High contrast color palettes designed for white/light minimalist background
  const colorPalettes = {
    zinc: {
      from: '#18181b',
      to: '#52525b',
      dim: '#e4e4e7',
    },
    blue: {
      from: '#2563eb',
      to: '#60a5fa',
      dim: '#e2e8f0',
    },
    purple: {
      from: '#7c3aed',
      to: '#a78bfa',
      dim: '#f3e8ff',
    },
    emerald: {
      from: '#059669',
      to: '#34d399',
      dim: '#e2e8f0',
    },
    amber: {
      from: '#d97706',
      to: '#fbbf24',
      dim: '#fef3c7',
    },
    cyan: {
      from: '#0891b2',
      to: '#38bdf8',
      dim: '#e2e8f0',
    },
  };

  const palette = colorPalettes[color] || colorPalettes.zinc;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      phaseRef.current += 0.08;

      const width = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, width, ch);

      const effectiveVolume = isActive ? Math.max(volume, 25) : 0;
      const normalizedVol = effectiveVolume / 100;

      if (mode === 'bars') {
        const gap = 2.5;
        const totalBarWidth = (width - gap * (barCount - 1)) / barCount;
        const barWidth = Math.max(2, totalBarWidth);

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap);
          let barHeightRatio = 0.12;

          if (isActive) {
            const wave1 = Math.sin(phaseRef.current * 1.5 + i * 0.45);
            const wave2 = Math.cos(phaseRef.current * 2.1 + i * 0.3);
            const wave = (wave1 + wave2) / 2;

            const centerWeight = Math.sin((i / (barCount - 1)) * Math.PI);
            barHeightRatio = Math.max(
              0.12,
              (0.2 + 0.8 * normalizedVol) * (0.3 + 0.7 * centerWeight) * (0.4 + 0.6 * ((wave + 1) / 2))
            );
          }

          const barH = Math.max(3, barHeightRatio * (ch - 4));
          const y = (ch - barH) / 2;

          if (isActive) {
            const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
            gradient.addColorStop(0, palette.to);
            gradient.addColorStop(1, palette.from);
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = palette.dim;
          }

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, barWidth / 2);
          ctx.fill();
        }
      } else if (mode === 'wave') {
        ctx.beginPath();
        const midY = ch / 2;
        ctx.moveTo(0, midY);

        for (let x = 0; x <= width; x += 2) {
          let y = midY;
          if (isActive) {
            const wave =
              Math.sin(x * 0.05 + phaseRef.current * 2) *
              Math.cos(x * 0.02 - phaseRef.current) *
              normalizedVol *
              (ch * 0.4);
            y = midY + wave;
          }
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = isActive ? palette.from : palette.dim;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isActive, volume, barCount, mode, palette]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={barCount * 7 + 10}
        height={height}
        className="block w-full max-w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};
