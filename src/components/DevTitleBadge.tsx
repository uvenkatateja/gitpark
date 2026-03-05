/**
 * Dev Title Badge Component
 * Displays user's RPG-style title
 */

import type { GitHubUser, GitHubRepo } from '@/lib/github';
import { getUserTitle, getTitleColor, getTitleGlow } from '@/lib/devTitles';

interface DevTitleBadgeProps {
  user: GitHubUser;
  repos: GitHubRepo[];
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export default function DevTitleBadge({
  user,
  repos,
  size = 'md',
  showDescription = false,
}: DevTitleBadgeProps) {
  const title = getUserTitle(user, repos);
  const color = getTitleColor(title.rarity);
  const glow = getTitleGlow(title.rarity);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <div
        className={`inline-flex items-center gap-2 rounded-full backdrop-blur-md border ${sizeClasses[size]} ${glow}`}
        style={{
          backgroundColor: `${color}20`,
          borderColor: `${color}40`,
        }}
      >
        <span className={iconSizes[size]}>{title.icon}</span>
        <span
          className="font-pixel uppercase tracking-wider"
          style={{ color }}
        >
          {title.name}
        </span>
      </div>
      
      {showDescription && (
        <p className="text-xs text-muted-foreground italic text-center">
          {title.description}
        </p>
      )}
    </div>
  );
}
