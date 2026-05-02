import { useEffect, useRef, useCallback } from 'react';
import { Universe } from '../simulation/universe';
import { ParticleType, PARTICLE_COLORS, PARTICLE_GLOW } from '../simulation/types';

interface Props {
  universe: Universe;
  cellSize: number;
  running: boolean;
  speed: number;
  onTick: () => void;
}

export function UniverseCanvas({ universe, cellSize, running, speed, onTick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, cells, physics } = universe;
    const cw = canvas.width;
    const ch = canvas.height;
    const imgData = ctx.createImageData(cw, ch);
    const data = imgData.data;

    const glowMap = new Float32Array(width * height).fill(0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const ci = y * width + x;
        const cell = cells[ci];
        const glow = PARTICLE_GLOW[cell.type];
        if (glow > 0.3) {
          const r = Math.min(3, Math.ceil(glow * 3));
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
              const dist = Math.sqrt(dx * dx + dy * dy) + 0.5;
              glowMap[ny * width + nx] += glow / (dist * dist * 2);
            }
          }
        }
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const ci = y * width + x;
        const cell = cells[ci];
        let [r, g, b] = PARTICLE_COLORS[cell.type];

        const tempFactor = Math.min(1, cell.temperature / 1200);
        if (cell.type === ParticleType.STAR || cell.type === ParticleType.PROTOSTAR) {
          r = Math.min(255, r + tempFactor * 30);
          g = Math.min(255, g + tempFactor * 30);
          b = Math.min(255, b + tempFactor * 20);
        } else if (cell.type === ParticleType.PLASMA) {
          r = Math.min(255, r + tempFactor * 40);
          g = Math.min(255, g + tempFactor * 20);
        } else if (cell.type === ParticleType.BLACK_HOLE) {
          const glowVal = Math.min(1, glowMap[ci]) * 60;
          r = Math.min(60, r + glowVal * 0.4);
          g = 0;
          b = Math.min(40, b + glowVal * 0.8);
        }

        const glow = Math.min(1, glowMap[ci]);
        r = Math.min(255, Math.round(r + glow * 80));
        g = Math.min(255, Math.round(g + glow * 60));
        b = Math.min(255, Math.round(b + glow * 40));

        const startPx = (y * cellSize) * cw + (x * cellSize);
        for (let py = 0; py < cellSize; py++) {
          for (let px = 0; px < cellSize; px++) {
            const pi = ((startPx + py * cw + px) * 4);
            const flicker = cell.type === ParticleType.STAR ||
                            cell.type === ParticleType.PLASMA ||
                            cell.type === ParticleType.GIANT
              ? (Math.random() - 0.5) * 10 : 0;
            data[pi] = Math.min(255, r + flicker);
            data[pi + 1] = Math.min(255, g + flicker * 0.5);
            data[pi + 2] = Math.min(255, b);
            data[pi + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [universe, cellSize]);

  useEffect(() => {
    const loop = (time: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const elapsed = time - lastTimeRef.current;
      const frameMs = 1000 / 30;
      if (elapsed < frameMs) return;
      lastTimeRef.current = time;

      if (running) {
        const steps = speed;
        for (let i = 0; i < steps; i++) universe.step();
        onTick();
      }
      render();
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, speed, universe, render, onTick]);

  const cw = universe.width * cellSize;
  const ch = universe.height * cellSize;

  return (
    <canvas
      ref={canvasRef}
      width={cw}
      height={ch}
      style={{
        imageRendering: 'pixelated',
        display: 'block',
        border: '1px solid rgba(100,120,255,0.2)',
        borderRadius: 4,
      }}
    />
  );
}
