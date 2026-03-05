/**
 * Analytics Service
 * Handles data fetching and processing for analytics visualizations
 */

export interface LanguageStats {
  language: string;
  count: number;
  percentage: number;
  color: string;
}

export interface StarGrowth {
  date: string;
  stars: number;
  repos: number;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface RepoStats {
  name: string;
  stars: number;
  forks: number;
  language: string;
  lastPushed: string;
}

export interface ActivityStats {
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
}

export interface AnalyticsSummary {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  languageCount: number;
  avgStarsPerRepo: number;
  mostStarredRepo: string;
  mostUsedLanguage: string;
  accountAge: number; // days
}

/**
 * Language color mapping (GitHub standard colors)
 */
export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Scala: '#c22d40',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  React: '#61dafb',
  Svelte: '#ff3e00',
  Other: '#8b8b8b',
};

/**
 * Get language color
 */
export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other;
}

/**
 * Calculate language statistics from repos
 */
export function calculateLanguageStats(repos: any[]): LanguageStats[] {
  const languageCounts = new Map<string, number>();
  
  repos.forEach(repo => {
    if (repo.language) {
      languageCounts.set(repo.language, (languageCounts.get(repo.language) || 0) + 1);
    }
  });

  const total = repos.length;
  const stats: LanguageStats[] = Array.from(languageCounts.entries())
    .map(([language, count]) => ({
      language,
      count,
      percentage: Math.round((count / total) * 100),
      color: getLanguageColor(language),
    }))
    .sort((a, b) => b.count - a.count);

  return stats;
}

/**
 * Generate star growth timeline
 */
export function generateStarGrowth(repos: any[]): StarGrowth[] {
  // Sort repos by creation date
  const sortedRepos = [...repos].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const timeline: StarGrowth[] = [];
  let cumulativeStars = 0;
  let repoCount = 0;

  sortedRepos.forEach(repo => {
    cumulativeStars += repo.stars || 0;
    repoCount++;
    
    timeline.push({
      date: new Date(repo.created_at).toISOString().split('T')[0],
      stars: cumulativeStars,
      repos: repoCount,
    });
  });

  // Group by month for cleaner visualization
  const monthlyData = new Map<string, StarGrowth>();
  
  timeline.forEach(point => {
    const monthKey = point.date.substring(0, 7); // YYYY-MM
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, point);
    } else {
      const existing = monthlyData.get(monthKey)!;
      if (point.stars > existing.stars) {
        monthlyData.set(monthKey, point);
      }
    }
  });

  return Array.from(monthlyData.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );
}

/**
 * Generate contribution heatmap data
 */
export function generateContributionHeatmap(repos: any[]): ContributionDay[] {
  const days: ContributionDay[] = [];
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  // Create map of dates to contribution counts
  const contributionMap = new Map<string, number>();

  repos.forEach(repo => {
    const pushedDate = new Date(repo.pushed_at);
    if (pushedDate >= oneYearAgo) {
      const dateKey = pushedDate.toISOString().split('T')[0];
      contributionMap.set(dateKey, (contributionMap.get(dateKey) || 0) + 1);
    }
  });

  // Generate all days in the past year
  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    const count = contributionMap.get(dateKey) || 0;
    
    // Calculate level (0-4) based on contribution count
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) level = 1;
    if (count >= 3) level = 2;
    if (count >= 6) level = 3;
    if (count >= 10) level = 4;

    days.push({
      date: dateKey,
      count,
      level,
    });
  }

  return days;
}

/**
 * Get top repos by stars
 */
export function getTopRepos(repos: any[], limit: number = 5): RepoStats[] {
  return repos
    .map(repo => ({
      name: repo.name,
      stars: repo.stars || 0,
      forks: repo.forks || 0,
      language: repo.language || 'Unknown',
      lastPushed: repo.pushed_at,
    }))
    .sort((a, b) => b.stars - a.stars)
    .slice(0, limit);
}

/**
 * Calculate analytics summary
 */
export function calculateAnalyticsSummary(repos: any[], createdAt: string): AnalyticsSummary {
  const totalRepos = repos.length;
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stars || 0), 0);
  const totalForks = repos.reduce((sum, repo) => sum + (repo.forks || 0), 0);
  
  const languages = new Set(repos.map(r => r.language).filter(Boolean));
  const languageCount = languages.size;

  const avgStarsPerRepo = totalRepos > 0 ? Math.round(totalStars / totalRepos) : 0;

  const mostStarred = repos.reduce((max, repo) => 
    (repo.stars || 0) > (max.stars || 0) ? repo : max
  , { stars: 0, name: 'N/A' });

  const languageStats = calculateLanguageStats(repos);
  const mostUsedLanguage = languageStats[0]?.language || 'N/A';

  const accountAge = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    totalRepos,
    totalStars,
    totalForks,
    languageCount,
    avgStarsPerRepo,
    mostStarredRepo: mostStarred.name,
    mostUsedLanguage,
    accountAge,
  };
}

/**
 * Format large numbers
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Get contribution level color
 */
export function getContributionColor(level: 0 | 1 | 2 | 3 | 4, theme: 'light' | 'dark' = 'dark'): string {
  if (theme === 'dark') {
    const colors = {
      0: '#161b22',
      1: '#0e4429',
      2: '#006d32',
      3: '#26a641',
      4: '#39d353',
    };
    return colors[level];
  } else {
    const colors = {
      0: '#ebedf0',
      1: '#9be9a8',
      2: '#40c463',
      3: '#30a14e',
      4: '#216e39',
    };
    return colors[level];
  }
}
