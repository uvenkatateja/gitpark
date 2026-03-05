/**
 * Achievement Badge Component
 * Displays a single achievement badge with tier styling
 */

import { TIER_STYLES, type Achievement, type AchievementTier } from '@/lib/achievements';
import { Lock } from 'lucide-react';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
}

export default function AchievementBadge({
  achievement,
  unlocked,
  progress = 0,
  size = 'md',
  showProgress = false,
  onClick,
}: AchievementBadgeProps) {
  const tierStyle = TIER_STYLES[achievement.tier];
  
  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  return (
    <div
      className={`relative group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Badge container */}
      <div
        className={`
          ${sizeClasses[size]}
          rounded-xl
          flex items-center justify-center
          transition-all duration-300
          ${
            unlocked
              ? `bg-gradient-to-br ${tierStyle.gradient} shadow-lg ${tierStyle.glow} hover:scale-110`
              : 'bg-white/5 border border-white/10 grayscale opacity-40'
          }
        `}
      >
        {unlocked ? (
          <span className="drop-shadow-lg">{achievement.icon}</span>
        ) : (
          <Lock className="w-1/2 h-1/2 text-white/30" />
        )}
      </div>

      {/* Progress ring for locked achievements */}
      {!unlocked && showProgress && progress > 0 && (
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={tierStyle.color}
            strokeWidth="4"
            strokeDasharray={`${progress * 2.827} 282.7`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-card/95 backdrop-blur-xl border border-white/20 rounded-lg px-3 py-2 shadow-xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{achievement.icon}</span>
            <span className="font-bold text-sm text-foreground">{achievement.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">{achievement.description}</p>
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-pixel uppercase tracking-wider`}
              style={{ color: tierStyle.color }}
            >
              {achievement.tier}
            </span>
            {!unlocked && showProgress && (
              <span className="text-[10px] text-muted-foreground">
                {progress}%
              </span>
            )}
          </div>
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="border-8 border-transparent border-t-card/95" />
        </div>
      </div>
    </div>
  );
}
