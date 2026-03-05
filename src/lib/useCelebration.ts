/**
 * useCelebration Hook
 * Easy-to-use hook for triggering celebrations
 */

import { useCallback } from 'react';
import { celebrate, celebrations, type CelebrationType, type CelebrationConfig } from './celebrationSystem';

export function useCelebration() {
  const trigger = useCallback((
    type: CelebrationType,
    overrides?: Partial<CelebrationConfig>
  ) => {
    celebrate(type, overrides);
  }, []);

  return {
    // Generic trigger
    celebrate: trigger,
    
    // Convenience methods
    achievementUnlock: celebrations.achievementUnlock,
    streakMilestone: celebrations.streakMilestone,
    firstCheckin: celebrations.firstCheckin,
    newRecord: celebrations.newRecord,
    levelUp: celebrations.levelUp,
  };
}
