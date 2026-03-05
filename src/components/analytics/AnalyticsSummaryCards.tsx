/**
 * Analytics Summary Cards
 * Key metrics overview cards
 */

import { Package, Star, GitFork, Code, TrendingUp, Award, Calendar } from 'lucide-react';
import type { AnalyticsSummary } from '@/lib/analyticsService';
import { formatNumber } from '@/lib/analyticsService';

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary;
}

export default function AnalyticsSummaryCards({ summary }: AnalyticsSummaryCardsProps) {
  const cards = [
    {
      icon: Package,
      label: 'Total Repositories',
      value: summary.totalRepos,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/40',
    },
    {
      icon: Star,
      label: 'Total Stars',
      value: formatNumber(summary.totalStars),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/40',
    },
    {
      icon: GitFork,
      label: 'Total Forks',
      value: formatNumber(summary.totalForks),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/40',
    },
    {
      icon: Code,
      label: 'Languages Used',
      value: summary.languageCount,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/40',
    },
    {
      icon: TrendingUp,
      label: 'Avg Stars/Repo',
      value: summary.avgStarsPerRepo,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/40',
    },
    {
      icon: Award,
      label: 'Most Starred',
      value: summary.mostStarredRepo,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      borderColor: 'border-pink-500/40',
      isText: true,
    },
    {
      icon: Code,
      label: 'Top Language',
      value: summary.mostUsedLanguage,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-500/40',
      isText: true,
    },
    {
      icon: Calendar,
      label: 'Account Age',
      value: `${Math.floor(summary.accountAge / 365)}y ${Math.floor((summary.accountAge % 365) / 30)}m`,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/20',
      borderColor: 'border-indigo-500/40',
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-white/5 border ${card.borderColor} rounded-xl p-4 hover:scale-105 transition-transform`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.isText ? 'text-sm truncate' : ''} text-foreground`}>
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
