import { CarProps, CarSize } from '@/types/car';
import { GitHubRepo } from '@/lib/github';

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#7c4dff',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Ruby: '#CC342D',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Lua: '#000080',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

function getCarSize(sizeKB: number): CarSize {
  if (sizeKB < 100) return 'compact';
  if (sizeKB < 1000) return 'sedan';
  if (sizeKB < 10000) return 'suv';
  return 'truck';
}

function getCarColor(language: string | null): string {
  if (!language) return '#888899';
  return LANGUAGE_COLORS[language] || '#888899';
}

function isDusty(lastPushed: string): boolean {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return new Date(lastPushed) < oneYearAgo;
}

export function repoToCar(repo: GitHubRepo, isPinned = false): CarProps {
  return {
    id: repo.id,
    name: repo.name,
    color: getCarColor(repo.language),
    size: getCarSize(repo.size),
    isCrooked: repo.fork,
    isCovered: repo.archived,
    isDusty: isDusty(repo.pushed_at),
    stars: repo.stargazers_count,
    topics: repo.topics || [],
    isPinned,
    url: repo.html_url,
    description: repo.description || '',
    language: repo.language || 'Unknown',
    lastPushed: repo.pushed_at,
    forks: repo.forks_count,
  };
}

export function getCarDimensions(size: CarSize): [number, number, number] {
  switch (size) {
    case 'compact': return [1.2, 0.5, 2.0];
    case 'sedan': return [1.4, 0.55, 2.6];
    case 'suv': return [1.6, 0.7, 2.8];
    case 'truck': return [1.8, 0.75, 3.2];
  }
}
