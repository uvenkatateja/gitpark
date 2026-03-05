/**
 * Top Repos Table
 * Table showing top repositories by stars
 */

import { Star, GitFork, ExternalLink } from 'lucide-react';
import type { RepoStats } from '@/lib/analyticsService';
import { formatNumber, getLanguageColor } from '@/lib/analyticsService';

interface TopReposTableProps {
  data: RepoStats[];
  detailed?: boolean;
}

export default function TopReposTable({ data, detailed = false }: TopReposTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p className="text-sm">No repository data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((repo, index) => (
        <div
          key={index}
          className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all group"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Rank & Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">#{index + 1}</span>
              </div>

              {/* Repo Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-mono text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {repo.name}
                </h4>
                
                {/* Language */}
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getLanguageColor(repo.language) }}
                  />
                  <span className="text-xs text-muted-foreground">{repo.language}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-yellow-400">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{formatNumber(repo.stars)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-blue-400">
                    <GitFork className="w-3 h-3" />
                    <span>{formatNumber(repo.forks)}</span>
                  </div>
                  {detailed && (
                    <div className="text-xs text-muted-foreground">
                      Updated {new Date(repo.lastPushed).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* View Link */}
            <a
              href={`https://github.com/${repo.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
