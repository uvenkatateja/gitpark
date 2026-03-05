/**
 * Comparison Header Component
 * Shows winner and overall scores
 */

import { Trophy, Zap } from 'lucide-react';
import type { ComparisonSummary } from '@/lib/compareService';

interface ComparisonHeaderProps {
  summary: ComparisonSummary;
}

export default function ComparisonHeader({ summary }: ComparisonHeaderProps) {
  const { user1, user2, winner } = summary;
  
  const winnerUser = winner === 'user1' ? user1 : winner === 'user2' ? user2 : null;
  const user1Wins = summary.results.filter(r => r.winner === 'user1').length;
  const user2Wins = summary.results.filter(r => r.winner === 'user2').length;
  const ties = summary.results.filter(r => r.winner === 'tie').length;

  return (
    <div className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl">
      {/* Winner Announcement */}
      {winner !== 'tie' && winnerUser && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-full mb-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="font-pixel text-sm text-yellow-400">WINNER</span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src={winnerUser.user.avatar_url}
              alt={winnerUser.user.login}
              className="w-16 h-16 rounded-full border-2 border-yellow-400 shadow-lg"
            />
            <div className="text-left">
              <h2 className="text-2xl font-bold text-foreground">
                {winnerUser.user.login}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Score: {winnerUser.score.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tie */}
      {winner === 'tie' && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-3">
            <span className="font-pixel text-sm text-foreground">IT'S A TIE!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Both users have equal scores
          </p>
        </div>
      )}

      {/* Score Comparison */}
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* User 1 */}
        <div className="text-center">
          <img
            src={user1.user.avatar_url}
            alt={user1.user.login}
            className={`w-12 h-12 rounded-full mx-auto mb-2 ${
              winner === 'user1' ? 'ring-2 ring-blue-500' : ''
            }`}
          />
          <div className="font-semibold text-foreground text-sm mb-1">
            {user1.user.login}
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {user1.score.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {user1Wins} wins
          </div>
        </div>

        {/* VS */}
        <div className="text-center">
          <div className="font-pixel text-3xl text-primary mb-2">VS</div>
          <div className="text-xs text-muted-foreground">
            {ties} ties
          </div>
        </div>

        {/* User 2 */}
        <div className="text-center">
          <img
            src={user2.user.avatar_url}
            alt={user2.user.login}
            className={`w-12 h-12 rounded-full mx-auto mb-2 ${
              winner === 'user2' ? 'ring-2 ring-purple-500' : ''
            }`}
          />
          <div className="font-semibold text-foreground text-sm mb-1">
            {user2.user.login}
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {user2.score.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {user2Wins} wins
          </div>
        </div>
      </div>

      {/* Score Bar */}
      <div className="mt-4">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
            style={{
              width: `${(user1.score / (user1.score + user2.score)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
