/**
 * Dev Titles System
 * RPG-style titles based on user stats
 * NO HARDCODED ASSIGNMENTS - All titles are dynamically calculated
 */

import type { GitHubUser, GitHubRepo } from './github';

// Title Configuration
export interface DevTitle {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (user: GitHubUser, repos: GitHubRepo[]) => boolean;
  priority: number; // Higher priority wins if multiple match
}

// Title Registry - Dynamically evaluated
export const DEV_TITLES: DevTitle[] = [
  // Legendary Titles (highest priority)
  {
    id: 'parking_legend',
    name: 'Parking Lot Legend',
    description: 'Master of the parking arts',
    icon: '👑',
    rarity: 'legendary',
    priority: 100,
    condition: (user, repos) => {
      const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
      return totalStars >= 10000 && repos.length >= 50;
    },
  },
  {
    id: 'open_source_hero',
    name: 'Open Source Hero',
    description: 'Champion of collaboration',
    icon: '🦸',
    rarity: 'legendary',
    priority: 95,
    condition: (user, repos) => {
      const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
      return totalForks >= 1000 && user.followers >= 500;
    },
  },
  
  // Epic Titles
  {
    id: 'repo_collector',
    name: 'Repo Collector',
    description: 'Gotta catch \'em all',
    icon: '📦',
    rarity: 'epic',
    priority: 80,
    condition: (user, repos) => repos.length >= 100,
  },
  {
    id: 'star_gazer',
    name: 'Star Gazer',
    description: 'Reaching for the stars',
    icon: '⭐',
    rarity: 'epic',
    priority: 75,
    condition: (user, repos) => {
      const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
      return totalStars >= 1000;
    },
  },
  {
    id: 'polyglot_programmer',
    name: 'Polyglot Programmer',
    description: 'Master of many languages',
    icon: '🗣️',
    rarity: 'epic',
    priority: 70,
    condition: (user, repos) => {
      const languages = new Set(repos.map(r => r.language).filter(Boolean));
      return languages.size >= 10;
    },
  },
  
  // Rare Titles
  {
    id: 'git_push_enthusiast',
    name: 'Git Push Enthusiast',
    description: 'Always pushing forward',
    icon: '🚀',
    rarity: 'rare',
    priority: 60,
    condition: (user, repos) => {
      const recentRepos = repos.filter(r => {
        const pushed = new Date(r.pushed_at);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return pushed > monthAgo;
      });
      return recentRepos.length >= 5;
    },
  },
  {
    id: 'merge_conflict_survivor',
    name: 'Merge Conflict Survivor',
    description: 'Battle-tested developer',
    icon: '⚔️',
    rarity: 'rare',
    priority: 55,
    condition: (user, repos) => {
      const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
      return accountAge >= 3 && repos.length >= 20;
    },
  },
  {
    id: 'code_architect',
    name: 'Code Architect',
    description: 'Building digital empires',
    icon: '🏗️',
    rarity: 'rare',
    priority: 50,
    condition: (user, repos) => {
      const avgSize = repos.reduce((sum, r) => sum + r.size, 0) / repos.length;
      return avgSize >= 1000 && repos.length >= 10;
    },
  },
  {
    id: 'fork_master',
    name: 'Fork Master',
    description: 'Spreading the code love',
    icon: '🍴',
    rarity: 'rare',
    priority: 45,
    condition: (user, repos) => {
      const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
      return totalForks >= 100;
    },
  },
  
  // Common Titles
  {
    id: 'commit_warrior',
    name: 'Commit Warrior',
    description: 'One commit at a time',
    icon: '⚡',
    rarity: 'common',
    priority: 40,
    condition: (user, repos) => repos.length >= 20,
  },
  {
    id: 'bug_hunter',
    name: 'Bug Hunter',
    description: 'Squashing bugs daily',
    icon: '🐛',
    rarity: 'common',
    priority: 35,
    condition: (user, repos) => repos.length >= 10,
  },
  {
    id: 'code_ninja',
    name: 'Code Ninja',
    description: 'Silent but deadly',
    icon: '🥷',
    rarity: 'common',
    priority: 30,
    condition: (user, repos) => {
      const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
      return totalStars >= 50;
    },
  },
  {
    id: 'git_apprentice',
    name: 'Git Apprentice',
    description: 'Learning the ways',
    icon: '🎓',
    rarity: 'common',
    priority: 25,
    condition: (user, repos) => repos.length >= 5,
  },
  {
    id: 'readme_writer',
    name: 'README Writer',
    description: 'Documentation matters',
    icon: '📝',
    rarity: 'common',
    priority: 20,
    condition: (user, repos) => user.bio !== null && user.bio.length > 20,
  },
  {
    id: 'social_coder',
    name: 'Social Coder',
    description: 'Building connections',
    icon: '👥',
    rarity: 'common',
    priority: 15,
    condition: (user, repos) => user.followers >= 10,
  },
  {
    id: 'parking_rookie',
    name: 'Parking Rookie',
    description: 'Just getting started',
    icon: '🔰',
    rarity: 'common',
    priority: 10,
    condition: (user, repos) => repos.length >= 1,
  },
  
  // Default fallback
  {
    id: 'code_explorer',
    name: 'Code Explorer',
    description: 'Discovering new territories',
    icon: '🗺️',
    rarity: 'common',
    priority: 1,
    condition: () => true, // Always matches
  },
];

// Get user's title
export function getUserTitle(user: GitHubUser, repos: GitHubRepo[]): DevTitle {
  // Find all matching titles
  const matchingTitles = DEV_TITLES.filter(title => title.condition(user, repos));
  
  // Sort by priority (highest first)
  matchingTitles.sort((a, b) => b.priority - a.priority);
  
  // Return highest priority match
  return matchingTitles[0];
}

// Get all titles user qualifies for
export function getUserTitles(user: GitHubUser, repos: GitHubRepo[]): DevTitle[] {
  return DEV_TITLES.filter(title => title.condition(user, repos))
    .sort((a, b) => b.priority - a.priority);
}

// Get title color based on rarity
export function getTitleColor(rarity: DevTitle['rarity']): string {
  const colors = {
    common: '#9CA3AF',
    rare: '#60A5FA',
    epic: '#A78BFA',
    legendary: '#FBBF24',
  };
  return colors[rarity];
}

// Get title glow based on rarity
export function getTitleGlow(rarity: DevTitle['rarity']): string {
  const glows = {
    common: 'drop-shadow-sm',
    rare: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]',
    epic: 'drop-shadow-[0_0_12px_rgba(167,139,250,0.6)]',
    legendary: 'drop-shadow-[0_0_16px_rgba(251,191,36,0.8)]',
  };
  return glows[rarity];
}

// Get progress to next title
export function getNextTitle(user: GitHubUser, repos: GitHubRepo[]): {
  current: DevTitle;
  next: DevTitle | null;
  progress: number;
  requirement: string;
} {
  const current = getUserTitle(user, repos);
  
  // Find next higher priority title that user doesn't have
  const nextTitle = DEV_TITLES
    .filter(title => title.priority > current.priority && !title.condition(user, repos))
    .sort((a, b) => a.priority - b.priority)[0];
  
  if (!nextTitle) {
    return {
      current,
      next: null,
      progress: 100,
      requirement: 'Max title achieved!',
    };
  }
  
  // Calculate progress (simplified)
  const progress = Math.min(95, (current.priority / nextTitle.priority) * 100);
  
  // Generate requirement hint
  let requirement = 'Keep coding!';
  if (nextTitle.id.includes('repo')) {
    requirement = `Create more repositories (${repos.length} current)`;
  } else if (nextTitle.id.includes('star')) {
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    requirement = `Earn more stars (${totalStars} current)`;
  } else if (nextTitle.id.includes('fork')) {
    const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
    requirement = `Get more forks (${totalForks} current)`;
  }
  
  return {
    current,
    next: nextTitle,
    progress,
    requirement,
  };
}
