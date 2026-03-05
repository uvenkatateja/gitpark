/**
 * Comparison Stats Component
 * Displays detailed stat comparison between two users
 */

import { Trophy, TrendingUp, Users, Package } from 'lucide-react';
import type { ComparisonSummary } from '@/lib/compareService';
import { formatMetricValue } from '@/lib/compareService';

interface ComparisonStatsProps {
  summary: ComparisonSummary;
}

const CATEGORY_CONFIG = {
  repos: { icon: Package, label: 'Repositories', color: '#60A5FA' },
  activity: { icon: TrendingUp, label: 'Activity', color: '#34D399' },
  social: { icon: Users, label: 'Social', color: '#F59E0B' },
  quality: { icon: Trophy, label: 'Quality', color: '#A78BFA' },
};

export default function ComparisonStats({ summary }: ComparisonStatsProps) {
  const { user1, user2, results, categories } = summary;

  return (
    <div className="space-y-6">
      {/* Category Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(categories).map(([category, stats]) => {
          const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
          const Icon = config.icon;
          const user1Percentage = stats.user1Wins + stats.user2Wins + stats.ties > 0
            ? Math.round((stats.user1Wins / (stats.user1Wins + stats.user2Wins + stats.ties)) * 100)
            : 50;

          return (
            <div
              key={category}
              className="bg-card/40 backdrop-blur-md border border-white/10 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: config.color }} />
                <span className="text-xs font-semibold text-foreground">{config.label}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>{stats.user1Wins}</span>
                <span>{stats.ties}</span>
                <span>{stats.user2Wins}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${user1Percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-2">
        {results.map((result) => {
          const { metric, value1, value2, winner, percentageDiff } = result;
          const isNumeric = typeof value1 === 'number' && typeof value2 === 'number';

          return (
            <div
              key={metric.id}
              className="bg-card/20 backdrop-blur-sm border border-white/5 rounded-lg p-3 hover:bg-card/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{metric.icon}</span>
                  <span className="text-sm font-medium text-foreground">{metric.label}</span>
                </div>
                {percentageDiff !== undefined && percentageDiff > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {percentageDiff}% diff
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                {/* User 1 Value */}
                <div
                  className={`text-center p-2 rounded ${
                    winner === 'user1'
                      ? 'bg-blue-500/20 border border-blue-500/40'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="text-xs text-muted-foreground mb-0.5">
                    {user1.user.login}
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {formatMetricValue(value1, metric.format)}
                  </div>
                </div>

                {/* VS Indicator */}
                <div className="text-center">
                  {winner === 'tie' ? (
                    <span className="text-xs text-muted-foreground">TIE</span>
                  ) : (
                    <span className="text-xs font-pixel text-primary">VS</span>
                  )}
                </div>

                {/* User 2 Value */}
                <div
                  className={`text-center p-2 rounded ${
                    winner === 'user2'
                      ? 'bg-purple-500/20 border border-purple-500/40'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="text-xs text-muted-foreground mb-0.5">
                    {user2.user.login}
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {formatMetricValue(value2, metric.format)}
                  </div>
                </div>
              </div>

              {/* Progress Bar for Numeric Values */}
              {isNumeric && value1 + value2 > 0 && (
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{
                      width: `${(value1 / (value1 + value2)) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
