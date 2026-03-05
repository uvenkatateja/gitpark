/**
 * Compare Service
 * Handles comparison logic and stat calculations
 * NO HARDCODED VALUES - All metrics are dynamically calculated
 */

import type { GitHubUser, GitHubRepo } from './github';

// Comparison Metrics Configuration
export interface ComparisonMetric {
  id: string;
  label: string;
  icon: string;
  category: 'repos' | 'activity' | 'social' | 'quality';
  format: 'number' | 'percentage' | 'date' | 'text';
  higherIsBetter: boolean;
  calculate: (user: GitHubUser, repos: GitHubRepo[]) => number | string;
}

// Comparison Result
export interface ComparisonResult {
  metric: ComparisonMetric;
  value1: number | string;
  value2: number | string;
  winner: 'user1' | 'user2' | 'tie';
  difference: number | string;
  percentageDiff?: number;
}

// User Comparison Data
export interface UserComparisonData {
  user: GitHubUser;
  repos: GitHubRepo[];
  metrics: Record<string, number | string>;
  score: number;
}

// Comparison Summary
export interface ComparisonSummary {
  user1: UserComparisonData;
  user2: UserComparisonData;
  results: ComparisonResult[];
  winner: 'user1' | 'user2' | 'tie';
  winnerScore: number;
  categories: Record<string, { user1Wins: number; user2Wins: number; ties: number }>;
}

// Metric Registry - Dynamically configured
export const COMPARISON_METRICS: ComparisonMetric[] = [
  // Repository Metrics
  {
    id: 'total_repos',
    label: 'Total Repositories',
    icon: '📦',
    category: 'repos',
    format: 'number',
    higherIsBetter: true,
    calculate: (user, repos) => repos.length,
  },
  {
    id: 'public_repos',
    label: 'Public Repos',
    icon: '🌐',
    category: 'repos',
    format: 'number',
    higherIsBetter: true,
    calculate: (user) => user.public_repos,
  },
  {
    id: 'total_stars',
    label: 'Total Stars',
    icon: '⭐',
    category: 'quality',
    format: 'number',
    higherIsBetter: true,
    calculate: (user, repos) => repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
  },
  {
    id: 'total_forks',
    label: 'Total Forks',
    icon: '🍴',
    category: 'quality',
    format: 'number',
    higherIsBetter: true,
    calculate: (user, repos) => repos.reduce((sum, repo) => sum + repo.forks_count, 0),
  },
  {
    id: 'avg_stars',
    label: 'Avg Stars per Repo',
    icon: '✨',
    category: 'quality',
    format: 'number',
    higherIsBetter: true,
    calculate: (user, repos) => {
      if (repos.length === 0) return 0;
      const total = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      return Math.round((total / repos.length) * 10) / 10;
    },
  },
  {
    id: 'most_starred_repo',
    label: 'Most Starred Repo',
    icon: '🏆',
    category: 'quality',
    format: 'number',
    higherIsBetter: true,
    calculate: (user, repos) => {
      if (repos.length === 0) return 0;
      return Math.max(...repos.map(r => r.stargazers_count));
    },
  },
  
  // Activity Metrics
  {
    id: 'account_age_days',
    label: 'Account Age (days)',
    icon: '📅',
    category: 'activity',
    format: 'number',
    higherIsBetter: true,
    calculate: (user) => {
      const created = new Date(user.created_at);
      const now = new Date();
      return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    },
  },
  {
    id: 'repos_per_year',
    label: 'Repos per Year',
    icon: '📈',
    category: 'activity',
    format: 'number',
    higherIsBetter: true,
    calculate: (user, repos) => {
      const created = new Date(user.created_at);
      const now = new Date();
      const years = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (years < 0.1) return repos.length;
      return Math.round((repos.length / years) * 10) / 10;
    },
  },
  {
    id: 'recent_activity',
    label: 'Recent Repos (Last Year)',
    icon: '🔥',
    category: 'activity',
    format: 'number',
    higherIsBetter: true,
    calculate: (user, repos) => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return repos.filter(r => new Date(r.created_at) > oneYearAgo).length;
    },
  },
  
  // Social Metrics
  {
    id: 'followers',
    label: 'Followers',
    icon: '👥',
    category: 'social',
    format: 'number',
    higherIsBetter: true,
    calculate: (user) => user.followers,
  },
  {
    id: 'following',
    label: 'Following',
    icon: '➡️',
    category: 'social',
    format: 'number',
    higherIsBetter: false,
    calculate: (user) => user.following,
  },
  {
    id: 'follower_ratio',
    label: 'Follower Ratio',
    icon: '📊',
    category: 'social',
    format: 'number',
    higherIsBetter: true,
    calculate: (user) => {
      if (user.following === 0) return user.followers;
      return Math.round((user.followers / user.following) * 100) / 100;
    },
  },
  
  // Quality Metrics
  {
    id: 'languages_count',
    label: 'Languages Used',
    icon: '🔤',
    category: 'quality',
    format: 'number',
    higherIsBetter: true,
    calculate: (user, repos) => {
      const languages = new Set(repos.map(r => r.language).filter(Boolean));
      return languages.size;
    },
  },
  {
    id: 'has_bio',
    label: 'Has Bio',
    icon: '📝',
    category: 'social',
    format: 'text',
    higherIsBetter: true,
    calculate: (user) => user.bio ? 'Yes' : 'No',
  },
];

// Calculate all metrics for a user
export function calculateUserMetrics(
  user: GitHubUser,
  repos: GitHubRepo[]
): Record<string, number | string> {
  const metrics: Record<string, number | string> = {};
  
  COMPARISON_METRICS.forEach(metric => {
    metrics[metric.id] = metric.calculate(user, repos);
  });
  
  return metrics;
}

// Calculate user score based on metrics
export function calculateUserScore(
  user: GitHubUser,
  repos: GitHubRepo[]
): number {
  let score = 0;
  
  // Weight different metrics
  const weights: Record<string, number> = {
    total_stars: 3,
    total_forks: 2,
    followers: 2,
    public_repos: 1,
    avg_stars: 2,
    languages_count: 1,
    recent_activity: 1.5,
  };
  
  COMPARISON_METRICS.forEach(metric => {
    const value = metric.calculate(user, repos);
    if (typeof value === 'number' && metric.higherIsBetter) {
      const weight = weights[metric.id] || 1;
      score += value * weight;
    }
  });
  
  return Math.round(score);
}

// Compare two users
export function compareUsers(
  user1: GitHubUser,
  repos1: GitHubRepo[],
  user2: GitHubUser,
  repos2: GitHubRepo[]
): ComparisonSummary {
  const metrics1 = calculateUserMetrics(user1, repos1);
  const metrics2 = calculateUserMetrics(user2, repos2);
  const score1 = calculateUserScore(user1, repos1);
  const score2 = calculateUserScore(user2, repos2);
  
  const results: ComparisonResult[] = COMPARISON_METRICS.map(metric => {
    const value1 = metrics1[metric.id];
    const value2 = metrics2[metric.id];
    
    let winner: 'user1' | 'user2' | 'tie' = 'tie';
    let difference: number | string = 0;
    let percentageDiff: number | undefined;
    
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      difference = Math.abs(value1 - value2);
      
      if (value1 > value2) {
        winner = metric.higherIsBetter ? 'user1' : 'user2';
      } else if (value2 > value1) {
        winner = metric.higherIsBetter ? 'user2' : 'user1';
      }
      
      // Calculate percentage difference
      const max = Math.max(value1, value2);
      if (max > 0) {
        percentageDiff = Math.round((difference / max) * 100);
      }
    } else if (value1 !== value2) {
      winner = metric.higherIsBetter && value1 === 'Yes' ? 'user1' : 
               metric.higherIsBetter && value2 === 'Yes' ? 'user2' : 'tie';
      difference = 'N/A';
    }
    
    return {
      metric,
      value1,
      value2,
      winner,
      difference,
      percentageDiff,
    };
  });
  
  // Calculate category wins
  const categories: Record<string, { user1Wins: number; user2Wins: number; ties: number }> = {
    repos: { user1Wins: 0, user2Wins: 0, ties: 0 },
    activity: { user1Wins: 0, user2Wins: 0, ties: 0 },
    social: { user1Wins: 0, user2Wins: 0, ties: 0 },
    quality: { user1Wins: 0, user2Wins: 0, ties: 0 },
  };
  
  results.forEach(result => {
    const cat = categories[result.metric.category];
    if (result.winner === 'user1') cat.user1Wins++;
    else if (result.winner === 'user2') cat.user2Wins++;
    else cat.ties++;
  });
  
  // Determine overall winner
  const user1Wins = results.filter(r => r.winner === 'user1').length;
  const user2Wins = results.filter(r => r.winner === 'user2').length;
  const overallWinner = score1 > score2 ? 'user1' : score2 > score1 ? 'user2' : 'tie';
  
  return {
    user1: {
      user: user1,
      repos: repos1,
      metrics: metrics1,
      score: score1,
    },
    user2: {
      user: user2,
      repos: repos2,
      metrics: metrics2,
      score: score2,
    },
    results,
    winner: overallWinner,
    winnerScore: Math.max(score1, score2),
    categories,
  };
}

// Format metric value for display
export function formatMetricValue(
  value: number | string,
  format: ComparisonMetric['format']
): string {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'number':
      return value.toLocaleString();
    case 'percentage':
      return `${value}%`;
    case 'date':
      return new Date(value).toLocaleDateString();
    default:
      return String(value);
  }
}

// Get comparison insights
export function getComparisonInsights(summary: ComparisonSummary): string[] {
  const insights: string[] = [];
  const { user1, user2, results } = summary;
  
  // Find biggest differences
  const numericResults = results.filter(r => 
    typeof r.value1 === 'number' && typeof r.value2 === 'number' && r.percentageDiff
  );
  
  numericResults.sort((a, b) => (b.percentageDiff || 0) - (a.percentageDiff || 0));
  
  // Top 3 differences
  numericResults.slice(0, 3).forEach(result => {
    const winner = result.winner === 'user1' ? user1.user.login : user2.user.login;
    insights.push(
      `${winner} has ${result.percentageDiff}% more ${result.metric.label.toLowerCase()}`
    );
  });
  
  // Category dominance
  Object.entries(summary.categories).forEach(([category, stats]) => {
    if (stats.user1Wins > stats.user2Wins * 1.5) {
      insights.push(`${user1.user.login} dominates in ${category}`);
    } else if (stats.user2Wins > stats.user1Wins * 1.5) {
      insights.push(`${user2.user.login} dominates in ${category}`);
    }
  });
  
  return insights.slice(0, 5);
}
