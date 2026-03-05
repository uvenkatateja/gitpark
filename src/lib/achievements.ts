/**
 * Achievement System
 * Handles achievement definitions, checking, and awarding
 */

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type AchievementCategory = 'parking' | 'repos' | 'stars' | 'streak' | 'social' | 'language';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  icon: string;
  category: AchievementCategory;
  requirementValue?: number;
  sortOrder: number;
}

export interface ParkerAchievement {
  parkerId: number;
  achievementId: string;
  unlockedAt: string;
  seen: boolean;
  progress?: number;
  achievement?: Achievement;
}

// Tier colors and styles
export const TIER_STYLES: Record<AchievementTier, { color: string; gradient: string; glow: string }> = {
  bronze: {
    color: '#CD7F32',
    gradient: 'from-amber-700 to-amber-900',
    glow: 'shadow-amber-500/50',
  },
  silver: {
    color: '#C0C0C0',
    gradient: 'from-gray-300 to-gray-500',
    glow: 'shadow-gray-400/50',
  },
  gold: {
    color: '#FFD700',
    gradient: 'from-yellow-400 to-yellow-600',
    glow: 'shadow-yellow-500/50',
  },
  diamond: {
    color: '#B9F2FF',
    gradient: 'from-cyan-300 to-blue-500',
    glow: 'shadow-cyan-400/50',
  },
};

// Category labels
export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  parking: 'Parking',
  repos: 'Repositories',
  stars: 'Stars',
  streak: 'Streaks',
  social: 'Social',
  language: 'Languages',
};

/**
 * Calculate progress towards an achievement
 */
export function calculateProgress(
  achievement: Achievement,
  stats: {
    totalCheckins: number;
    repoCount: number;
    totalStars: number;
    currentStreak: number;
    kudosGiven: number;
    kudosReceived: number;
    languageCount: number;
  }
): number {
  if (!achievement.requirementValue) return 0;

  let current = 0;
  switch (achievement.category) {
    case 'parking':
      current = stats.totalCheckins;
      break;
    case 'repos':
      current = stats.repoCount;
      break;
    case 'stars':
      current = stats.totalStars;
      break;
    case 'streak':
      current = stats.currentStreak;
      break;
    case 'social':
      current = achievement.id.includes('gave') ? stats.kudosGiven : stats.kudosReceived;
      break;
    case 'language':
      current = stats.languageCount;
      break;
  }

  return Math.min(100, Math.floor((current / achievement.requirementValue) * 100));
}

/**
 * Group achievements by category
 */
export function groupAchievementsByCategory(achievements: Achievement[]): Record<AchievementCategory, Achievement[]> {
  const grouped: Record<AchievementCategory, Achievement[]> = {
    parking: [],
    repos: [],
    stars: [],
    streak: [],
    social: [],
    language: [],
  };

  achievements.forEach((achievement) => {
    grouped[achievement.category].push(achievement);
  });

  return grouped;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: AchievementTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * Sort achievements by tier and sort order
 */
export function sortAchievements(achievements: Achievement[]): Achievement[] {
  const tierOrder: Record<AchievementTier, number> = {
    bronze: 1,
    silver: 2,
    gold: 3,
    diamond: 4,
  };

  return [...achievements].sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    if (tierOrder[a.tier] !== tierOrder[b.tier]) {
      return tierOrder[a.tier] - tierOrder[b.tier];
    }
    return a.sortOrder - b.sortOrder;
  });
}
