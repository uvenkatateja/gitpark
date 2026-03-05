/**
 * Analytics Dashboard Component
 * Comprehensive analytics panel with multiple visualizations
 */

import { useState, useMemo } from 'react';
import { X, TrendingUp, BarChart3, PieChart, Calendar, Award } from 'lucide-react';
import {
  calculateLanguageStats,
  generateStarGrowth,
  generateContributionHeatmap,
  getTopRepos,
  calculateAnalyticsSummary,
  type LanguageStats,
  type StarGrowth,
  type ContributionDay,
  type RepoStats,
  type AnalyticsSummary,
} from '@/lib/analyticsService';
import LanguageBreakdownChart from './analytics/LanguageBreakdownChart';
import StarGrowthChart from './analytics/StarGrowthChart';
import ContributionHeatmap from './analytics/ContributionHeatmap';
import TopReposTable from './analytics/TopReposTable';
import AnalyticsSummaryCards from './analytics/AnalyticsSummaryCards';

interface AnalyticsDashboardProps {
  repos: any[];
  userCreatedAt: string;
  username: string;
  onClose: () => void;
}

type TabType = 'overview' | 'languages' | 'growth' | 'activity' | 'repos';

export default function AnalyticsDashboard({
  repos,
  userCreatedAt,
  username,
  onClose,
}: AnalyticsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');

  // Calculate all analytics data
  const analytics = useMemo(() => {
    const languageStats = calculateLanguageStats(repos);
    const starGrowth = generateStarGrowth(repos);
    const contributionHeatmap = generateContributionHeatmap(repos);
    const topRepos = getTopRepos(repos, 10);
    const summary = calculateAnalyticsSummary(repos, userCreatedAt);

    return {
      languageStats,
      starGrowth,
      contributionHeatmap,
      topRepos,
      summary,
    };
  }, [repos, userCreatedAt]);

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'languages', label: 'Languages', icon: PieChart },
    { id: 'growth', label: 'Growth', icon: TrendingUp },
    { id: 'activity', label: 'Activity', icon: Calendar },
    { id: 'repos', label: 'Top Repos', icon: Award },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-[fade-in_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed z-50 inset-4 sm:inset-8 animate-[slide-up_0.2s_ease-out]">
        <div className="relative bg-card/95 backdrop-blur-xl border-2 border-primary/40 rounded-xl h-full flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Analytics Dashboard
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  @{username} • {analytics.summary.totalRepos} repositories
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-white/10 overflow-x-auto">
            <div className="flex gap-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                      transition-all flex items-center gap-2
                      ${selectedTab === tab.id
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <AnalyticsSummaryCards summary={analytics.summary} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-primary" />
                      Language Distribution
                    </h3>
                    <LanguageBreakdownChart data={analytics.languageStats} />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Star Growth
                    </h3>
                    <StarGrowthChart data={analytics.starGrowth} />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Top Repositories
                  </h3>
                  <TopReposTable data={analytics.topRepos.slice(0, 5)} />
                </div>
              </div>
            )}

            {selectedTab === 'languages' && (
              <div className="max-w-4xl mx-auto">
                <LanguageBreakdownChart data={analytics.languageStats} detailed />
              </div>
            )}

            {selectedTab === 'growth' && (
              <div className="max-w-4xl mx-auto">
                <StarGrowthChart data={analytics.starGrowth} detailed />
              </div>
            )}

            {selectedTab === 'activity' && (
              <div className="max-w-6xl mx-auto">
                <ContributionHeatmap data={analytics.contributionHeatmap} />
              </div>
            )}

            {selectedTab === 'repos' && (
              <div className="max-w-4xl mx-auto">
                <TopReposTable data={analytics.topRepos} detailed />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
