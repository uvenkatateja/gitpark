/**
 * Ambience Manager Component
 * Automatically manages ambient sounds based on context
 */

import { useEffect, useState } from 'react';
import { useAudio } from '@/lib/useAudio';
import { useTheme } from '@/lib/useTheme';

interface AmbienceManagerProps {
  enabled?: boolean;
  timeBasedAmbience?: boolean;
}

export default function AmbienceManager({
  enabled = true,
  timeBasedAmbience = true,
}: AmbienceManagerProps) {
  const { play, pause, isCategoryMuted } = useAudio();
  const { themeId } = useTheme();
  const [currentAmbience, setCurrentAmbience] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || isCategoryMuted('ambience')) {
      if (currentAmbience) {
        pause(currentAmbience, { fadeOut: 2000 });
        setCurrentAmbience(null);
      }
      return;
    }

    // Determine which ambience to play
    let targetAmbience: string;

    if (timeBasedAmbience) {
      // Time-based ambience
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour >= 20;
      targetAmbience = isNight ? 'parking_lot_night' : 'parking_lot_day';
    } else {
      // Theme-based ambience
      targetAmbience = themeId.includes('dark') || themeId === 'midnight' || themeId === 'neon_nights' 
        ? 'parking_lot_night' 
        : 'parking_lot_day';
    }

    // Switch ambience if needed
    if (currentAmbience !== targetAmbience) {
      if (currentAmbience) {
        pause(currentAmbience, { fadeOut: 2000 });
      }
      
      setTimeout(() => {
        play(targetAmbience, { fadeIn: 2000 });
        setCurrentAmbience(targetAmbience);
      }, currentAmbience ? 2000 : 0);
    }
  }, [enabled, timeBasedAmbience, themeId, isCategoryMuted, currentAmbience]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAmbience) {
        pause(currentAmbience, { fadeOut: 1000 });
      }
    };
  }, []);

  return null; // This is a logic-only component
}
