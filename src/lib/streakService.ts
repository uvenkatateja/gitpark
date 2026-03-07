/**
 * Streak Service
 * Handles daily check-ins and streak management
 */

import { getSupabase, isSupabaseConfigured } from './supabase';

export interface CheckinResult {
  success: boolean;
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
  checkinCount: number;
  streakBroken: boolean;
  wasFrozen: boolean;
}

export interface StreakLeaderboardEntry {
  parkerId: number;
  githubLogin: string;
  avatarUrl: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  rank: number;
}

/**
 * Perform daily check-in
 * Calls Supabase RPC function directly
 */
export async function performCheckin(parkerId: number): Promise<CheckinResult> {
  const supabase = getSupabase();
  
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  try {
    // Call the database function to handle check-in
    const { data, error } = await supabase.rpc('handle_daily_checkin', {
      p_parker_id: parkerId,
    });

    if (error) {
      console.error('Check-in error:', error);
      throw new Error(error.message || 'Check-in failed');
    }

    const result = data?.[0];
    
    if (!result) {
      throw new Error('No result returned');
    }

    return {
      success: result.success,
      currentStreak: result.current_streak,
      longestStreak: result.longest_streak,
      isNewRecord: result.is_new_record,
      checkinCount: result.checkin_count,
      streakBroken: result.streak_broken,
      wasFrozen: result.was_frozen,
    };
  } catch (error) {
    console.error('Checkin error:', error);
    throw error;
  }
}

/**
 * Check if user can check in today
 * Calls Supabase RPC function directly
 */
export async function canCheckinToday(parkerId: number): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { data, error } = await supabase.rpc('can_checkin_today', {
      p_parker_id: parkerId,
    });

    if (error) {
      console.error('Check status error:', error);
      return false;
    }

    return data ?? false;
  } catch (error) {
    console.error('Can checkin error:', error);
    return false;
  }
}

/**
 * Get streak leaderboard
 */
export async function getStreakLeaderboard(limit: number = 10): Promise<StreakLeaderboardEntry[]> {
  const response = await fetch(`/api/streaks/leaderboard?limit=${limit}`);
  
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.leaderboard || [];
}

/**
 * Freeze streak (premium feature)
 */
export async function freezeStreak(parkerId: number, days: number = 1): Promise<boolean> {
  const response = await fetch('/api/streaks/freeze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parkerId, days }),
  });

  return response.ok;
}

/**
 * Calculate streak status
 */
export function getStreakStatus(lastCheckinDate: string | null): {
  status: 'active' | 'at-risk' | 'broken' | 'new';
  message: string;
  color: string;
} {
  if (!lastCheckinDate) {
    return {
      status: 'new',
      message: 'Start your streak today!',
      color: 'text-muted-foreground',
    };
  }

  const lastCheckin = new Date(lastCheckinDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastCheckin.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    return {
      status: 'active',
      message: 'Checked in today! Come back tomorrow.',
      color: 'text-green-400',
    };
  } else if (daysDiff === 1) {
    return {
      status: 'at-risk',
      message: 'Check in now to keep your streak!',
      color: 'text-yellow-400',
    };
  } else {
    return {
      status: 'broken',
      message: 'Streak broken. Start a new one!',
      color: 'text-red-400',
    };
  }
}

/**
 * Get streak flame intensity based on streak length
 */
export function getStreakFlameIntensity(streak: number): {
  size: 'sm' | 'md' | 'lg' | 'xl';
  color: string;
  glow: string;
  emoji: string;
} {
  if (streak >= 100) {
    return {
      size: 'xl',
      color: '#FF00FF',
      glow: 'shadow-[0_0_20px_#FF00FF]',
      emoji: '🔥',
    };
  } else if (streak >= 30) {
    return {
      size: 'lg',
      color: '#FF4500',
      glow: 'shadow-[0_0_15px_#FF4500]',
      emoji: '🔥',
    };
  } else if (streak >= 7) {
    return {
      size: 'md',
      color: '#FFA500',
      glow: 'shadow-[0_0_10px_#FFA500]',
      emoji: '🔥',
    };
  } else if (streak >= 3) {
    return {
      size: 'sm',
      color: '#FFD700',
      glow: 'shadow-[0_0_5px_#FFD700]',
      emoji: '🔥',
    };
  } else {
    return {
      size: 'sm',
      color: '#FFA500',
      glow: '',
      emoji: '🔥',
    };
  }
}

/**
 * Format streak display text
 */
export function formatStreakText(streak: number): string {
  if (streak === 0) return 'No streak';
  if (streak === 1) return '1 day';
  return `${streak} days`;
}

/**
 * Get motivational message based on streak
 */
export function getStreakMotivation(streak: number): string {
  if (streak === 0) return 'Start your journey today!';
  if (streak === 1) return 'Great start! Keep it going!';
  if (streak < 7) return 'Building momentum!';
  if (streak === 7) return '🎉 One week streak!';
  if (streak < 30) return 'You\'re on fire!';
  if (streak === 30) return '🎉 30 day streak! Amazing!';
  if (streak < 100) return 'Unstoppable!';
  if (streak === 100) return '🎉 100 DAYS! LEGENDARY!';
  if (streak < 365) return 'Absolute legend!';
  return '🎉 ETERNAL PARKER! 365+ DAYS!';
}
