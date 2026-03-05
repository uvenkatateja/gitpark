/**
 * Streak Widget Component
 * Displays current streak with check-in button
 */

import { useState } from 'react';
import { Flame, Loader2, Trophy, Zap, Snowflake } from 'lucide-react';
import { performCheckin, getStreakStatus, getStreakFlameIntensity, formatStreakText, getStreakMotivation } from '@/lib/streakService';
import type { CheckinResult } from '@/lib/streakService';
import { useCelebration } from '@/lib/useCelebration';

interface StreakWidgetProps {
  parkerId: number;
  currentStreak: number;
  longestStreak: number;
  lastCheckinDate: string | null;
  totalCheckins: number;
  streakFrozenUntil?: string | null;
  onCheckinSuccess?: (result: CheckinResult) => void;
  compact?: boolean;
}

export default function StreakWidget({
  parkerId,
  currentStreak,
  longestStreak,
  lastCheckinDate,
  totalCheckins,
  streakFrozenUntil,
  onCheckinSuccess,
  compact = false,
}: StreakWidgetProps) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { streakMilestone, firstCheckin } = useCelebration();

  const streakStatus = getStreakStatus(lastCheckinDate);
  const flameIntensity = getStreakFlameIntensity(currentStreak);
  const canCheckin = streakStatus.status !== 'active';
  const isFrozen = streakFrozenUntil && new Date(streakFrozenUntil) >= new Date();

  const handleCheckin = async () => {
    if (!canCheckin || checking) return;

    setChecking(true);
    setError(null);

    try {
      const result = await performCheckin(parkerId);
      
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Trigger celebration for milestones
        if (result.currentStreak === 1 && totalCheckins === 0) {
          firstCheckin();
        } else if ([7, 30, 100, 365].includes(result.currentStreak)) {
          streakMilestone(result.currentStreak);
        }
        
        onCheckinSuccess?.(result);
      } else {
        setError('Already checked in today!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setChecking(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleCheckin}
        disabled={!canCheckin || checking}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          backdrop-blur-md transition-all
          ${canCheckin
            ? 'bg-white/5 border border-white/10 hover:bg-primary/10 hover:border-primary/40 hover:scale-105'
            : 'bg-green-500/20 border border-green-500/40 cursor-not-allowed'
          }
        `}
      >
        {checking ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <Flame 
            className={`w-4 h-4 ${flameIntensity.glow}`}
            style={{ color: flameIntensity.color }}
          />
        )}
        <span className="font-pixel text-[10px] text-foreground tracking-tighter uppercase">
          {currentStreak > 0 ? `${currentStreak}🔥` : 'CHECK IN'}
        </span>
      </button>
    );
  }

  return (
    <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame 
              className={`w-5 h-5 ${flameIntensity.glow} animate-pulse`}
              style={{ color: flameIntensity.color }}
            />
            <span className="font-pixel text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              Daily Streak
            </span>
          </div>
          {isFrozen && (
            <div className="flex items-center gap-1 text-cyan-400">
              <Snowflake className="w-3 h-3" />
              <span className="text-[9px] font-pixel">FROZEN</span>
            </div>
          )}
        </div>
      </div>

      {/* Streak Display */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-4xl font-bold"
                style={{ color: flameIntensity.color }}
              >
                {currentStreak}
              </span>
              <span className="text-2xl">{flameIntensity.emoji}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatStreakText(currentStreak)} streak
            </p>
          </div>

          {longestStreak > currentStreak && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-400">
                <Trophy className="w-4 h-4" />
                <span className="text-lg font-bold">{longestStreak}</span>
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">
                Best
              </p>
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className={`text-xs mb-3 ${streakStatus.color}`}>
          {streakStatus.message}
        </div>

        {/* Motivation */}
        <div className="text-xs text-muted-foreground mb-4 italic">
          "{getStreakMotivation(currentStreak)}"
        </div>

        {/* Check-in Button */}
        <button
          onClick={handleCheckin}
          disabled={!canCheckin || checking}
          className={`
            w-full py-3 rounded-lg font-semibold text-sm
            transition-all duration-200
            flex items-center justify-center gap-2
            ${canCheckin
              ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
              : 'bg-green-500/20 text-green-400 border border-green-500/40 cursor-not-allowed'
            }
          `}
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking in...</span>
            </>
          ) : canCheckin ? (
            <>
              <Zap className="w-4 h-4" />
              <span>Check In Today</span>
            </>
          ) : (
            <>
              <span>✓</span>
              <span>Checked In!</span>
            </>
          )}
        </button>

        {error && (
          <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
        )}

        {showSuccess && (
          <div className="mt-3 p-2 bg-green-500/20 border border-green-500/40 rounded-lg text-center">
            <p className="text-xs text-green-400 font-semibold">
              🎉 Streak updated! Keep it going!
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground">Total Check-ins:</span>
            <span className="ml-2 font-bold text-foreground">{totalCheckins}</span>
          </div>
          {currentStreak > 0 && (
            <div className="text-muted-foreground">
              Day {currentStreak}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
