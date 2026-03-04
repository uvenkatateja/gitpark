export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  size: number;
  fork: boolean;
  archived: boolean;
  private: boolean;
  topics: string[];
  pushed_at: string;
  created_at: string;
  updated_at: string;
}

const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function cachedFetch<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() < cached.expiry) return cached.data as T;

  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error('User not found');
    if (res.status === 403) throw new Error('GitHub API rate limit exceeded. Try again later.');
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  cache.set(url, { data, expiry: Date.now() + CACHE_TTL });
  return data as T;
}

export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  return cachedFetch<GitHubUser>(`https://api.github.com/users/${username}`);
}

export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const maxPages = 4; // Max 400 repos

  while (page <= maxPages) {
    try {
      const repos = await cachedFetch<GitHubRepo[]>(
        `https://api.github.com/users/${username}/repos?type=all&per_page=100&sort=pushed&page=${page}`
      );
      if (!Array.isArray(repos)) break;
      allRepos.push(...repos);
      if (repos.length < 100) break;
      page++;
    } catch (e) {
      console.warn(`[GitHub] Failed to fetch page ${page}:`, e);
      break;
    }
  }

  // Filter out forks if preferred? No, let's keep them and mark them (isCrooked)
  return allRepos;
}
