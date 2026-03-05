/**
 * Achievements Panel Component
 * Displays all achievements grouped by category with progress
 */

import { useState, useMemo } from 'react';
import { X, Trophy, Lock } from 'lucide-react';
import AchievementBadge from './AchievementBadge';
import {
  groupAchievementsByCategory,
  CATEGORY_LABELS,
  calculateProgress,
  type Achievement,
  type ParkerAchievement,
  type AchievementCategory,
} from '@/lib/achievements';

interface AchievementsPanelProps {
  achievements: Achievement[];
  parkerAchievements: ParkerAchievement[];
  stats: {
    totalCheckins: number;
    repoCount: number;
    totalStars: number;
    currentStreak: number;
    kudosGiven: number;
    kudosReceived: number;
    languageCount: number;
  };
  onClose: () => void;
}

export default function AchievementsPanel({
  achievements,
  parkerAchievements,
  stats,
  onClose,
}: AchievementsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  const unlockedIds = useMemo(
    () => new Set(parkerAchievements.map((pa) => pa.achievementId)),
    [parkerAchievements]
  );

  const grouped = useMemo(
    () => groupAchievementsByCategory(achievements),
    [achievements]
  );

  const categoryStats = useMemo(() => {
    const stats: Record<AchievementCategory, { total: number; unlocked: number }> = {
      parking: { total: 0, unlocked: 0 },
      repos: { total: 0, unlocked: 0 },
      stars: { total: 0, unlocked: 0 },
      streak: { total: 0, unlocked: 0 },
      social: { total: 0, unlocked: 0 },
      language: { total: 0, unlocked: 0 },
    };

    achievements.forEach((achievement) => {
      stats[achievement.category].total++;
      if (unlockedIds.has(achievement.id)) {
        stats[achievement.category].unlocked++;
      }
    });

    return stats;
  }, [achievements, unlockedIds]);

  const totalUnlocked = parkerAchievements.length;
  const totalAchievements = achievements.length;
  const completionPercentage = Math.floor((totalUnlocked / totalAchievements) * 100);

  const displayedAchievements =
    selectedCategory === 'all'
      ? achievements
      : grouped[selectedCategory];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-[fade-in_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed z-50 inset-4 sm:inset-auto sm:right-6 sm:top-6 sm:bottom-6 sm:w-[600px] animate-[slide-left_0.2s_ease-out]">
        <div className="relative bg-card/95 backdrop-blur-xl border-2 border-primary/40 rounded-xl h-full flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Achievements</h2>
                <p className="text-sm text-muted-foreground">
                  {totalUnlocked} of {totalAchievements} unlocked ({completionPercentage}%)
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="px-6 py-3 border-b border-white/10 overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-pixel uppercase tracking-wider whitespace-nowrap
                  transition-all
                  ${
                    selectedCategory === 'all'
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                  }
                `}
              >
                All ({totalUnlocked}/{totalAchievements})
              </button>
              {(Object.keys(CATEGORY_LABELS) as AchievementCategory[]).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-pixel uppercase tracking-wider whitespace-nowrap
                    transition-all
                    ${
                      selectedCategory === category
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }
                  `}
                >
                  {CATEGORY_LABELS[category]} ({categoryStats[category].unlocked}/{categoryStats[category].total})
                </button>
              ))}
            </div>
          </div>

          {/* Achievements grid */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
              {displayedAchievements.map((achievement) => {
                const unlocked = unlockedIds.has(achievement.id);
                const progress = calculateProgress(achievement, stats);

                return (
                  <div key={achievement.id} className="flex flex-col items-center gap-2">
                    <AchievementBadge
                      achievement={achievement}
                      unlocked={unlocked}
                      progress={progress}
                      size="md"
                      showProgress={true}
                    />
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground line-clamp-2">
                        {achievement.name}
                      </p>
                      {!unlocked && progress > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {progress}%
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {displayedAchievements.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Lock className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No achievements in this category yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
