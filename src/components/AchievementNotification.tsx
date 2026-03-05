/**
 * Achievement Notification Component
 * Shows a toast notification when an achievement is unlocked
 */

import { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { TIER_STYLES, type Achievement } from '@/lib/achievements';
import { useCelebration } from '@/lib/useCelebration';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementNotification({
  achievement,
  onClose,
}: AchievementNotificationProps) {
  const [visible, setVisible] = useState(false);
  const { achievementUnlock } = useCelebration();

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      // Trigger celebration effect
      achievementUnlock(achievement.tier);
      
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose, achievementUnlock]);

  if (!achievement) return null;

  const tierStyle = TIER_STYLES[achievement.tier];

  return (
    <div
      className={`
        fixed top-6 right-6 z-[100]
        transition-all duration-300 ease-out
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}
      `}
    >
      <div
        className={`
          bg-card/95 backdrop-blur-xl
          border-2 rounded-xl
          shadow-2xl ${tierStyle.glow}
          p-4 pr-12
          min-w-[320px] max-w-[400px]
          animate-[bounce_0.5s_ease-out]
        `}
        style={{ borderColor: tierStyle.color }}
      >
        {/* Close button */}
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`
              w-12 h-12 rounded-xl
              flex items-center justify-center
              bg-gradient-to-br ${tierStyle.gradient}
              shadow-lg
            `}
          >
            <span className="text-2xl drop-shadow-lg">{achievement.icon}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: tierStyle.color }} />
              <span className="text-xs font-pixel uppercase tracking-wider text-muted-foreground">
                Achievement Unlocked!
              </span>
            </div>
            <h3 className="font-bold text-foreground mt-0.5">{achievement.name}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>

        {/* Tier badge */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-pixel uppercase tracking-wider px-2 py-1 rounded"
            style={{
              color: tierStyle.color,
              backgroundColor: `${tierStyle.color}20`,
            }}
          >
            {achievement.tier} tier
          </span>
          <span className="text-xs text-muted-foreground">
            +{achievement.tier === 'bronze' ? 10 : achievement.tier === 'silver' ? 25 : achievement.tier === 'gold' ? 50 : 100} XP
          </span>
        </div>
      </div>
    </div>
  );
}
