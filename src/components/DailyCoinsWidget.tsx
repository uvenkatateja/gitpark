/**
 * Daily Coins Widget
 * Allows users to claim free daily coins
 */

import { useState } from 'react';
import { Gift, Coins, Loader2, Sparkles } from 'lucide-react';
import { claimDailyCoins, canClaimDaily, calculateDailyReward, formatCoins } from '@/lib/shopService';

interface DailyCoinsWidgetProps {
  parkerId: number;
  lastClaimDate: string | null;
  currentStreak: number;
  onClaimSuccess: (coinsAwarded: number, newBalance: number) => void;
}

export default function DailyCoinsWidget({
  parkerId,
  lastClaimDate,
  currentStreak,
  onClaimSuccess,
}: DailyCoinsWidgetProps) {
  const [claiming, setClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastReward, setLastReward] = useState<number>(0);

  const canClaim = canClaimDaily(lastClaimDate);
  const reward = calculateDailyReward(currentStreak);

  const handleClaim = async () => {
    if (!canClaim || claiming) return;

    setClaiming(true);
    try {
      const result = await claimDailyCoins(parkerId);
      
      if (result.success) {
        setLastReward(result.coinsAwarded);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        onClaimSuccess(result.coinsAwarded, result.newBalance);
      }
    } catch (error) {
      console.error('Failed to claim daily coins:', error);
      alert('Failed to claim coins');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-primary/20 to-primary/10">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          <span className="font-pixel text-[10px] text-primary uppercase tracking-[0.2em]">
            Daily Coins
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {canClaim ? (
          <>
            {/* Reward Display */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="w-8 h-8 text-primary animate-pulse" />
                <span className="text-3xl font-bold text-primary">{formatCoins(reward.total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {reward.base} base + {reward.bonus} streak bonus
              </p>
            </div>

            {/* Claim Button */}
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-3 rounded-lg font-semibold text-sm
                bg-gradient-to-r from-primary/80 to-primary
                hover:from-primary hover:to-primary/80
                text-white shadow-lg hover:shadow-xl
                transition-all duration-200 hover:scale-[1.02]
                flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Claiming...</span>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  <span>Claim Daily Coins</span>
                </>
              )}
            </button>

            {showSuccess && (
              <div className="mt-3 p-2 bg-green-500/20 border border-green-500/40 rounded-lg text-center animate-[bounce_0.5s_ease-out]">
                <p className="text-xs text-green-400 font-semibold flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  +{formatCoins(lastReward)} coins claimed!
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
              <Gift className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Already claimed today!</p>
            <p className="text-xs text-muted-foreground/70">Come back tomorrow for more coins</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-[10px] text-muted-foreground text-center">
            💡 Maintain your streak to earn bonus coins!
          </p>
        </div>
      </div>
    </div>
  );
}
