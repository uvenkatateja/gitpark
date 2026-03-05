/**
 * Celebration Manager Component
 * Manages and renders celebration effects
 */

import { useEffect, useState } from 'react';
import { celebrationEmitter, type CelebrationConfig } from '@/lib/celebrationSystem';
import ConfettiEffect from './ConfettiEffect';
import FireworksEffect from './FireworksEffect';
import CelebrationSound from './CelebrationSound.tsx';

interface ActiveCelebration {
  id: string;
  config: CelebrationConfig;
}

export default function CelebrationManager() {
  const [activeCelebrations, setActiveCelebrations] = useState<ActiveCelebration[]>([]);

  useEffect(() => {
    const handleCelebration = (config: CelebrationConfig) => {
      const id = `celebration-${Date.now()}-${Math.random()}`;
      setActiveCelebrations(prev => [...prev, { id, config }]);
    };

    celebrationEmitter.on('any', handleCelebration);

    return () => {
      celebrationEmitter.off('any', handleCelebration);
    };
  }, []);

  const handleComplete = (id: string) => {
    setActiveCelebrations(prev => prev.filter(c => c.id !== id));
  };

  return (
    <>
      {activeCelebrations.map(({ id, config }) => (
        <div key={id}>
          {/* Choose effect based on intensity */}
          {config.intensity === 'epic' || config.intensity === 'large' ? (
            <FireworksEffect config={config} onComplete={() => handleComplete(id)} />
          ) : (
            <ConfettiEffect config={config} onComplete={() => handleComplete(id)} />
          )}

          {/* Play sound */}
          {config.sound && <CelebrationSound sound={config.sound} />}

          {/* Show message */}
          {config.message && (
            <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] pointer-events-none">
              <div className="animate-[bounce_0.5s_ease-out] text-center">
                <h2 
                  className="text-6xl font-bold font-pixel text-white drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]"
                  style={{
                    textShadow: '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,215,0,0.6), 0 0 30px rgba(255,215,0,0.4)',
                    animation: 'pulse 1s ease-in-out infinite',
                  }}
                >
                  {config.message}
                </h2>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
