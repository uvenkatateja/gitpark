/**
 * Celebration Sound Component
 * Plays celebration sound effects
 */

import { useEffect, useRef } from 'react';

interface CelebrationSoundProps {
  sound: string;
  volume?: number;
}

// Sound file mappings
const SOUND_FILES: Record<string, string> = {
  achievement: '/sounds/achievement.mp3',
  streak: '/sounds/streak.mp3',
  levelup: '/sounds/levelup.mp3',
  welcome: '/sounds/welcome.mp3',
  record: '/sounds/record.mp3',
  rare: '/sounds/rare.mp3',
  epic: '/sounds/epic.mp3',
  legendary: '/sounds/legendary.mp3',
};

export default function CelebrationSound({ sound, volume = 0.5 }: CelebrationSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const soundFile = SOUND_FILES[sound];
    if (!soundFile) return;

    // Create and play audio
    const audio = new Audio(soundFile);
    audio.volume = volume;
    audioRef.current = audio;

    // Play with error handling
    audio.play().catch(error => {
      console.warn('Failed to play celebration sound:', error);
    });

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [sound, volume]);

  return null;
}
