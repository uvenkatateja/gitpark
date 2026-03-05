/**
 * Streak Leaderboard Component
 * Shows top users by current streak
 */

import { useEffect, useState } from 'react';
import { Flame, Trophy, TrendingUp } from 'lucide-react';
import { getStreakLeaderboard, type StreakLeaderboardEntry } from '@/lib/streakService';

interface StreakLeaderboardProps {
  limit?: number;
  currentUserId?: number;
}

export default function StreakLeaderboard({ limit = 10, currentUserId }: StreakLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<StreakLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [limit]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getStreakLeaderboard(limit);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-xl p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-pixel text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Streak Leaders
          </span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="divide-y divide-white/5">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.parkerId === currentUserId;
          const isTop3 = index < 3;

          return (
            <div
              key={entry.parkerId}
              className={`
                px-4 py-3 flex items-center gap-3
                transition-colors
                ${isCurrentUser ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-white/5'}
              `}
            >
              {/* Rank */}
              <div className="w-8 flex-shrink-0 text-center">
                {isTop3 ? (
                  <span className="text-xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    #{entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <img
                src={entry.avatarUrl}
                alt={entry.githubLogin}
                className="w-8 h-8 rounded-lg border border-white/10"
              />

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-foreground truncate">
                  {entry.githubLogin}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-primary">(You)</span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {entry.totalCheckins} total check-ins
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1.5">
                <Flame 
                  className={`w-4 h-4 ${
                    entry.currentStreak >= 100 
                      ? 'text-purple-400' 
                      : entry.currentStreak >= 30 
                      ? 'text-orange-400' 
                      : 'text-yellow-400'
                  }`}
                />
                <span className="font-bold text-foreground">
                  {entry.currentStreak}
                </span>
              </div>

              {/* Best Streak Badge */}
              {entry.longestStreak > entry.currentStreak && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Trophy className="w-3 h-3" />
                  <span className="text-xs">{entry.longestStreak}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="px-4 py-8 text-center text-muted-foreground">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No active streaks yet</p>
          <p className="text-xs mt-1">Be the first to start a streak!</p>
        </div>
      )}
    </div>
  );
}
