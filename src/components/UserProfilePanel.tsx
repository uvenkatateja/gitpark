/**
 * User Profile Panel Component
 * Shows GitHub user profile when clicking on their parking section
 * Similar to git-city's building profile card
 */

import { X, Github, Star, GitFork, MapPin, ExternalLink, Trophy, BarChart3 } from 'lucide-react';
import type { UserSection } from '@/lib/districtLayout';
import AchievementBadge from './AchievementBadge';
import { useState, useEffect } from 'react';
import type { Achievement, ParkerAchievement } from '@/lib/achievements';

interface UserProfilePanelProps {
  section: UserSection | null;
  onClose: () => void;
  onViewAchievements?: () => void;
  onViewAnalytics?: () => void;
}

export default function UserProfilePanel({ section, onClose, onViewAchievements, onViewAnalytics }: UserProfilePanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [parkerAchievements, setParkerAchievements] = useState<ParkerAchievement[]>([]);

  useEffect(() => {
    if (section) {
      // Fetch achievements for this user
      // For now, we'll show placeholder - integrate with API later
      setAchievements([]);
      setParkerAchievements([]);
    }
  }, [section]);

  if (!section) return null;

  const totalStars = section.cars.reduce((sum, car) => sum + (car.stars || 0), 0);
  const totalForks = section.cars.reduce((sum, car) => sum + (car.forks || 0), 0);
  const topRepos = section.cars.slice(0, 6);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-[fade-in_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Profile Card - Desktop: right side, Mobile: bottom sheet */}
      <div className="fixed z-50 
        bottom-0 left-0 right-0
        sm:bottom-auto sm:left-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2
        animate-[slide-up_0.2s_ease-out] sm:animate-[slide-left_0.2s_ease-out]"
      >
        <div className="relative bg-card/95 backdrop-blur-xl border-t-2 border-primary/40
          sm:border-2 sm:rounded-xl
          w-full max-h-[70vh] overflow-y-auto sm:w-[380px] sm:max-h-[85vh]
          shadow-2xl
          scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            title="Close (ESC)"
          >
            <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </button>

          {/* Drag Handle (Mobile) */}
          <div className="flex justify-center py-2 sm:hidden">
            <div className="h-1 w-12 rounded-full bg-white/20" />
          </div>

          {/* Header with Avatar */}
          <div className="px-5 py-4 sm:pt-5">
            <div className="flex items-start gap-4">
              {section.avatarUrl && (
                <img
                  src={section.avatarUrl}
                  alt={section.username}
                  className="w-16 h-16 rounded-xl border-2 border-primary/30 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">
                  @{section.username}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  GitHub Developer
                </p>
                {section.isClaimed && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-pixel bg-primary/20 text-primary border border-primary/40 rounded tracking-wider">
                    ✓ CLAIMED
                  </span>
                )}
                {section.rank && (
                  <span className="inline-block mt-2 ml-2 px-2 py-0.5 text-[10px] font-pixel bg-white/5 text-muted-foreground border border-white/10 rounded tracking-wider">
                    RANK #{section.rank}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-primary">
                  {section.cars.length}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                  Repos
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-yellow-400">
                  {totalStars.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                  Stars
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-400">
                  {totalForks.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                  Forks
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Preview */}
          {parkerAchievements.length > 0 && (
            <div className="px-5 pb-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="font-pixel text-[10px] uppercase tracking-wider text-muted-foreground">
                      Achievements
                    </span>
                  </div>
                  {onViewAchievements && (
                    <button
                      onClick={onViewAchievements}
                      className="text-xs text-primary hover:underline"
                    >
                      View All
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {parkerAchievements.slice(0, 6).map((pa) => {
                    const achievement = achievements.find((a) => a.id === pa.achievementId);
                    if (!achievement) return null;
                    return (
                      <AchievementBadge
                        key={pa.achievementId}
                        achievement={achievement}
                        unlocked={true}
                        size="sm"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Section Info */}
          <div className="px-5 pb-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span className="font-pixel text-[10px] uppercase tracking-wider">
                  Parking Section
                </span>
              </div>
              <div className="text-xs text-foreground/80">
                Section #{section.sectionIndex + 1} • {section.cars.length} vehicles parked
              </div>
            </div>
          </div>

          {/* Top Repositories */}
          {topRepos.length > 0 && (
            <div className="px-5 pb-5">
              <h3 className="text-xs font-pixel text-muted-foreground uppercase tracking-wider mb-3">
                Top Repositories
              </h3>
              <div className="space-y-2">
                {topRepos.map((car) => (
                  <div
                    key={car.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm text-foreground truncate">
                          {car.name}
                        </div>
                        {car.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {car.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {car.stars > 0 && (
                            <div className="flex items-center gap-1 text-xs text-yellow-400">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{car.stars.toLocaleString()}</span>
                            </div>
                          )}
                          {car.forks > 0 && (
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                              <GitFork className="w-3 h-3" />
                              <span>{car.forks.toLocaleString()}</span>
                            </div>
                          )}
                          {car.language && (
                            <div className="text-xs text-muted-foreground">
                              {car.language}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-2">
            {onViewAnalytics && (
              <button
                onClick={onViewAnalytics}
                className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-foreground font-semibold py-3 rounded-lg transition-all hover:scale-[1.02]"
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Analytics</span>
              </button>
            )}
            <a
              href={`https://github.com/${section.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-semibold py-3 rounded-lg transition-all hover:scale-[1.02] group"
            >
              <Github className="w-4 h-4" />
              <span>View GitHub Profile</span>
              <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
