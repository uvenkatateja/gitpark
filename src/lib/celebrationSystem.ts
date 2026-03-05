/**
 * Celebration System
 * Event-driven celebration effects with confetti, fireworks, and sounds
 */

export type CelebrationType = 
  | 'achievement_unlock'
  | 'streak_milestone'
  | 'level_up'
  | 'first_checkin'
  | 'new_record'
  | 'rare_unlock'
  | 'epic_unlock'
  | 'legendary_unlock';

export type CelebrationIntensity = 'small' | 'medium' | 'large' | 'epic';

export interface CelebrationConfig {
  type: CelebrationType;
  intensity: CelebrationIntensity;
  duration: number; // milliseconds
  colors?: string[];
  sound?: string;
  message?: string;
  position?: { x: number; y: number };
}

export interface CelebrationEffect {
  id: string;
  config: CelebrationConfig;
  startTime: number;
  active: boolean;
}

/**
 * Celebration presets based on event type
 */
export const CELEBRATION_PRESETS: Record<CelebrationType, Partial<CelebrationConfig>> = {
  achievement_unlock: {
    intensity: 'medium',
    duration: 3000,
    colors: ['#FFD700', '#FFA500', '#FF6347'],
    sound: 'achievement',
  },
  streak_milestone: {
    intensity: 'large',
    duration: 4000,
    colors: ['#FF4500', '#FFA500', '#FFD700'],
    sound: 'streak',
  },
  level_up: {
    intensity: 'large',
    duration: 3500,
    colors: ['#00FF00', '#00FFFF', '#0080FF'],
    sound: 'levelup',
  },
  first_checkin: {
    intensity: 'medium',
    duration: 2500,
    colors: ['#FF69B4', '#FFB6C1', '#FFC0CB'],
    sound: 'welcome',
  },
  new_record: {
    intensity: 'epic',
    duration: 5000,
    colors: ['#FFD700', '#FFA500', '#FF0000', '#FF00FF'],
    sound: 'record',
  },
  rare_unlock: {
    intensity: 'medium',
    duration: 3000,
    colors: ['#3B82F6', '#60A5FA', '#93C5FD'],
    sound: 'rare',
  },
  epic_unlock: {
    intensity: 'large',
    duration: 4000,
    colors: ['#A855F7', '#C084FC', '#E9D5FF'],
    sound: 'epic',
  },
  legendary_unlock: {
    intensity: 'epic',
    duration: 5000,
    colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'],
    sound: 'legendary',
  },
};

/**
 * Particle count based on intensity
 */
export function getParticleCount(intensity: CelebrationIntensity): number {
  const counts = {
    small: 30,
    medium: 60,
    large: 100,
    epic: 150,
  };
  return counts[intensity];
}

/**
 * Get celebration config with defaults
 */
export function getCelebrationConfig(
  type: CelebrationType,
  overrides?: Partial<CelebrationConfig>
): CelebrationConfig {
  const preset = CELEBRATION_PRESETS[type];
  return {
    type,
    intensity: preset.intensity || 'medium',
    duration: preset.duration || 3000,
    colors: preset.colors || ['#FFD700', '#FFA500'],
    sound: preset.sound,
    ...overrides,
  };
}

/**
 * Generate random position within bounds
 */
export function getRandomPosition(
  bounds: { width: number; height: number },
  margin: number = 50
): { x: number; y: number } {
  return {
    x: margin + Math.random() * (bounds.width - margin * 2),
    y: margin + Math.random() * (bounds.height - margin * 2),
  };
}

/**
 * Get random color from array
 */
export function getRandomColor(colors: string[]): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Calculate particle velocity based on intensity
 */
export function getParticleVelocity(intensity: CelebrationIntensity): { min: number; max: number } {
  const velocities = {
    small: { min: 2, max: 5 },
    medium: { min: 3, max: 7 },
    large: { min: 4, max: 9 },
    epic: { min: 5, max: 12 },
  };
  return velocities[intensity];
}

/**
 * Celebration event emitter
 */
class CelebrationEmitter {
  private listeners: Map<string, Set<(config: CelebrationConfig) => void>> = new Map();

  on(event: CelebrationType | 'any', callback: (config: CelebrationConfig) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: CelebrationType | 'any', callback: (config: CelebrationConfig) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(config: CelebrationConfig) {
    // Emit to specific type listeners
    this.listeners.get(config.type)?.forEach(callback => callback(config));
    // Emit to 'any' listeners
    this.listeners.get('any')?.forEach(callback => callback(config));
  }

  clear() {
    this.listeners.clear();
  }
}

export const celebrationEmitter = new CelebrationEmitter();

/**
 * Trigger a celebration
 */
export function celebrate(
  type: CelebrationType,
  overrides?: Partial<CelebrationConfig>
) {
  const config = getCelebrationConfig(type, overrides);
  celebrationEmitter.emit(config);
}

/**
 * Celebration helper functions
 */
export const celebrations = {
  achievementUnlock: (rarity?: string) => {
    const type = rarity === 'legendary' 
      ? 'legendary_unlock' 
      : rarity === 'epic' 
      ? 'epic_unlock' 
      : rarity === 'rare'
      ? 'rare_unlock'
      : 'achievement_unlock';
    celebrate(type);
  },

  streakMilestone: (days: number) => {
    const intensity: CelebrationIntensity = 
      days >= 365 ? 'epic' :
      days >= 100 ? 'large' :
      days >= 30 ? 'medium' : 'small';
    
    celebrate('streak_milestone', { 
      intensity,
      message: `${days} Day Streak!` 
    });
  },

  firstCheckin: () => {
    celebrate('first_checkin', {
      message: 'Welcome to Repo-Ridez!'
    });
  },

  newRecord: (recordType: string) => {
    celebrate('new_record', {
      message: `New ${recordType} Record!`
    });
  },

  levelUp: (level: number) => {
    celebrate('level_up', {
      message: `Level ${level}!`
    });
  },
};
