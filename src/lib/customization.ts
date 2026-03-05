/**
 * Car Customization System
 * Types and utilities for car customization
 */

export type CustomizationCategory = 'color' | 'decal' | 'underglow' | 'exhaust' | 'plate_style';
export type CustomizationRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type UnlockType = 'free' | 'achievement' | 'streak' | 'premium' | 'event';

export interface CarCustomization {
  repoId: number;
  repoName: string;
  color?: string;
  decals?: string[];
  underglow?: string;
  exhaust?: string;
  plate?: string;
}

export interface CustomizationItem {
  id: string;
  category: CustomizationCategory;
  name: string;
  description: string;
  value: string;
  rarity: CustomizationRarity;
  isUnlocked: boolean;
  unlockType: UnlockType;
  unlockRequirement?: string;
  previewUrl?: string;
  priceCoins?: number;
}

// Rarity colors and styles
export const RARITY_STYLES: Record<CustomizationRarity, { color: string; gradient: string; glow: string }> = {
  common: {
    color: '#9CA3AF',
    gradient: 'from-gray-400 to-gray-600',
    glow: 'shadow-gray-500/30',
  },
  rare: {
    color: '#3B82F6',
    gradient: 'from-blue-400 to-blue-600',
    glow: 'shadow-blue-500/50',
  },
  epic: {
    color: '#A855F7',
    gradient: 'from-purple-400 to-purple-600',
    glow: 'shadow-purple-500/50',
  },
  legendary: {
    color: '#F59E0B',
    gradient: 'from-amber-400 to-orange-600',
    glow: 'shadow-amber-500/70',
  },
};

// Category icons
export const CATEGORY_ICONS: Record<CustomizationCategory, string> = {
  color: '🎨',
  decal: '⭐',
  underglow: '💡',
  exhaust: '💨',
  plate_style: '🔢',
};

// Category labels
export const CATEGORY_LABELS: Record<CustomizationCategory, string> = {
  color: 'Paint Color',
  decal: 'Decals',
  underglow: 'Underglow',
  exhaust: 'Exhaust',
  plate_style: 'License Plate',
};

/**
 * Validate license plate text
 */
export function validatePlateText(text: string): { valid: boolean; error?: string } {
  if (!text) {
    return { valid: true }; // Empty is valid (uses default)
  }

  if (text.length > 8) {
    return { valid: false, error: 'Max 8 characters' };
  }

  if (!/^[A-Z0-9\s-]+$/i.test(text)) {
    return { valid: false, error: 'Only letters, numbers, spaces, and hyphens' };
  }

  // Check for inappropriate content (basic filter)
  const inappropriate = ['FUCK', 'SHIT', 'DAMN', 'HELL'];
  if (inappropriate.some(word => text.toUpperCase().includes(word))) {
    return { valid: false, error: 'Inappropriate content' };
  }

  return { valid: true };
}

/**
 * Get rarity display name
 */
export function getRarityDisplayName(rarity: CustomizationRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

/**
 * Check if item is unlocked based on requirements
 */
export function checkUnlockRequirement(
  item: CustomizationItem,
  userStats: {
    achievements: string[];
    currentStreak: number;
    totalStars: number;
  }
): { unlocked: boolean; reason?: string } {
  if (item.unlockType === 'free') {
    return { unlocked: true };
  }

  if (item.unlockType === 'achievement' && item.unlockRequirement) {
    const hasAchievement = userStats.achievements.includes(item.unlockRequirement);
    return {
      unlocked: hasAchievement,
      reason: hasAchievement ? undefined : `Unlock achievement: ${item.unlockRequirement}`,
    };
  }

  if (item.unlockType === 'streak' && item.unlockRequirement) {
    const requiredStreak = parseInt(item.unlockRequirement);
    const hasStreak = userStats.currentStreak >= requiredStreak;
    return {
      unlocked: hasStreak,
      reason: hasStreak ? undefined : `Reach ${requiredStreak} day streak`,
    };
  }

  if (item.unlockType === 'premium') {
    return {
      unlocked: false,
      reason: item.priceCoins ? `Purchase for ${item.priceCoins} coins` : 'Premium item',
    };
  }

  return { unlocked: false, reason: 'Locked' };
}

/**
 * Group items by category
 */
export function groupItemsByCategory(items: CustomizationItem[]): Record<CustomizationCategory, CustomizationItem[]> {
  const grouped: Record<CustomizationCategory, CustomizationItem[]> = {
    color: [],
    decal: [],
    underglow: [],
    exhaust: [],
    plate_style: [],
  };

  items.forEach(item => {
    grouped[item.category].push(item);
  });

  return grouped;
}

/**
 * Sort items by rarity and unlock status
 */
export function sortItems(items: CustomizationItem[]): CustomizationItem[] {
  const rarityOrder: Record<CustomizationRarity, number> = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
  };

  return [...items].sort((a, b) => {
    // Unlocked items first
    if (a.isUnlocked !== b.isUnlocked) {
      return a.isUnlocked ? -1 : 1;
    }
    // Then by rarity
    if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    }
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get default customization
 */
export function getDefaultCustomization(repoId: number, repoName: string): CarCustomization {
  return {
    repoId,
    repoName,
    color: undefined,
    decals: [],
    underglow: undefined,
    exhaust: undefined,
    plate: undefined,
  };
}

/**
 * Apply rainbow effect (for special items)
 */
export function getRainbowColor(time: number): string {
  const hue = (time * 50) % 360;
  return `hsl(${hue}, 100%, 50%)`;
}
