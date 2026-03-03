import { CarProps } from '@/types/car';
import { Star, GitFork, ExternalLink, Clock, Tag } from 'lucide-react';

interface CarPopupProps {
  car: CarProps;
  onClose: () => void;
}

export function CarPopup({ car, onClose }: CarPopupProps) {
  const lastPushed = new Date(car.lastPushed);
  const timeAgo = getTimeAgo(lastPushed);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-80 max-w-[90vw]">
      <div className="bg-card border border-border rounded p-4 shadow-2xl font-mono">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm border border-border"
              style={{ backgroundColor: car.color }}
            />
            <h3 className="font-pixel text-sm text-foreground truncate max-w-[180px]">
              {car.name}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs font-pixel">
            ✕
          </button>
        </div>

        {car.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{car.description}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-secondary-foreground mb-3">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-primary" /> {car.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3 h-3" /> {car.forks}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeAgo}
          </span>
          <span style={{ color: car.color }}>{car.language}</span>
        </div>

        {car.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {car.topics.slice(0, 5).map((t) => (
              <span key={t} className="bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                <Tag className="w-2 h-2" />{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 text-[10px] text-muted-foreground mb-3">
          {car.isCrooked && <span className="bg-muted px-1.5 py-0.5 rounded-sm">Forked</span>}
          {car.isCovered && <span className="bg-muted px-1.5 py-0.5 rounded-sm">Archived</span>}
          {car.isDusty && <span className="bg-muted px-1.5 py-0.5 rounded-sm">Dusty</span>}
          {car.isPinned && <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm">Pinned</span>}
        </div>

        <a
          href={car.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full bg-primary text-primary-foreground font-pixel text-xs py-2 rounded hover:opacity-90 transition-opacity"
        >
          <ExternalLink className="w-3 h-3" /> View on GitHub
        </a>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
  ];
  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) return `${count}${label} ago`;
  }
  return 'just now';
}
