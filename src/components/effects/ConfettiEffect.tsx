/**
 * Confetti Effect Component
 * Canvas-based confetti particle system
 */

import { useEffect, useRef } from 'react';
import type { CelebrationConfig } from '@/lib/celebrationSystem';
import { getParticleCount, getRandomColor, getParticleVelocity } from '@/lib/celebrationSystem';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'triangle';
  opacity: number;
}

interface ConfettiEffectProps {
  config: CelebrationConfig;
  onComplete: () => void;
}

export default function ConfettiEffect({ config, onComplete }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize particles
    const particleCount = getParticleCount(config.intensity);
    const velocity = getParticleVelocity(config.intensity);
    const colors = config.colors || ['#FFD700', '#FFA500'];

    particlesRef.current = Array.from({ length: particleCount }, () => {
      const startX = config.position?.x || canvas.width / 2;
      const startY = config.position?.y || canvas.height / 2;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = velocity.min + Math.random() * (velocity.max - velocity.min);

      return {
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 3, // Upward bias
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        color: getRandomColor(colors),
        size: 8 + Math.random() * 8,
        shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as any,
        opacity: 1,
      };
    });

    startTimeRef.current = Date.now();

    // Animation loop
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = elapsed / config.duration;

      if (progress >= 1) {
        onComplete();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(particle => {
        // Update physics
        particle.vy += 0.2; // Gravity
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        particle.opacity = 1 - progress; // Fade out

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        switch (particle.shape) {
          case 'square':
            ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'triangle':
            ctx.beginPath();
            ctx.moveTo(0, -particle.size / 2);
            ctx.lineTo(particle.size / 2, particle.size / 2);
            ctx.lineTo(-particle.size / 2, particle.size / 2);
            ctx.closePath();
            ctx.fill();
            break;
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
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
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
