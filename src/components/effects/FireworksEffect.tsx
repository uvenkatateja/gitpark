/**
 * Fireworks Effect Component
 * Canvas-based fireworks particle system
 */

import { useEffect, useRef } from 'react';
import type { CelebrationConfig } from '@/lib/celebrationSystem';
import { getRandomColor } from '@/lib/celebrationSystem';

interface Firework {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  exploded: boolean;
  particles: FireworkParticle[];
  color: string;
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface FireworksEffectProps {
  config: CelebrationConfig;
  onComplete: () => void;
}

export default function FireworksEffect({ config, onComplete }: FireworksEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  const lastSpawnRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = config.colors || ['#FFD700', '#FFA500', '#FF6347'];
    startTimeRef.current = Date.now();

    const spawnFirework = () => {
      const x = canvas.width * (0.2 + Math.random() * 0.6);
      const targetY = canvas.height * (0.2 + Math.random() * 0.3);
      
      fireworksRef.current.push({
        x,
        y: canvas.height,
        targetY,
        vx: (Math.random() - 0.5) * 2,
        vy: -15 - Math.random() * 5,
        exploded: false,
        particles: [],
        color: getRandomColor(colors),
      });
    };

    const explodeFirework = (firework: Firework) => {
      const particleCount = 50 + Math.random() * 50;
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 2 + Math.random() * 4;
        
        firework.particles.push({
          x: firework.x,
          y: firework.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 60 + Math.random() * 40,
          color: firework.color,
        });
      }
      
      firework.exploded = true;
    };

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = elapsed / config.duration;

      if (progress >= 1 && fireworksRef.current.length === 0) {
        onComplete();
        return;
      }

      // Spawn new fireworks
      if (progress < 0.8 && elapsed - lastSpawnRef.current > 400) {
        spawnFirework();
        lastSpawnRef.current = elapsed;
      }

      // Clear with trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw fireworks
      fireworksRef.current = fireworksRef.current.filter(firework => {
        if (!firework.exploded) {
          // Update rocket
          firework.vy += 0.3; // Gravity
          firework.x += firework.vx;
          firework.y += firework.vy;

          // Draw rocket
          ctx.beginPath();
          ctx.arc(firework.x, firework.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = firework.color;
          ctx.fill();

          // Explode at target
          if (firework.y <= firework.targetY) {
            explodeFirework(firework);
          }

          return true;
        } else {
          // Update and draw particles
          firework.particles = firework.particles.filter(particle => {
            particle.vy += 0.1; // Gravity
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;

            if (particle.life <= 0) return false;

            const alpha = particle.life / particle.maxLife;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
            ctx.globalAlpha = 1;

            return true;
          });

          return firework.particles.length > 0;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
}
