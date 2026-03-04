import { useEffect, useState } from 'react';
import { CarProps } from '@/types/car';
import { Star, GitFork, ExternalLink, Clock, Tag, X, Archive, GitBranch, Sparkles, Pin } from 'lucide-react';

interface CarPanelProps {
    car: CarProps | null;
    onClose: () => void;
}

function timeAgo(date: Date): string {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    const intervals = [
        { l: 'y', s: 31536000 },
        { l: 'mo', s: 2592000 },
        { l: 'd', s: 86400 },
        { l: 'h', s: 3600 },
        { l: 'm', s: 60 },
    ];
    for (const { l, s: sec } of intervals) {
        const n = Math.floor(s / sec);
        if (n >= 1) return `${n}${l} ago`;
    }
    return 'just now';
}

export default function CarPanel({ car, onClose }: CarPanelProps) {
    const [visible, setVisible] = useState(false);

    // Animate in
    useEffect(() => {
        if (car) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [car]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 250);
    };

    if (!car) return null;

    const pushed = new Date(car.lastPushed);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 z-40 transition-opacity duration-250 ${visible ? 'bg-black/30' : 'bg-transparent pointer-events-none'
                    }`}
                onClick={handleClose}
            />

            {/* Panel */}
            <div
                className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] z-50 bg-card border-l border-border
          flex flex-col transition-transform duration-250 ease-out
          ${visible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2 min-w-0">
                        <div
                            className="w-3.5 h-3.5 rounded-sm border border-border flex-shrink-0"
                            style={{ backgroundColor: car.color }}
                        />
                        <h3 className="font-pixel text-sm text-foreground truncate">{car.name}</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                    {/* Description */}
                    {car.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{car.description}</p>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-secondary/50 rounded px-2.5 py-2 text-center">
                            <Star className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                            <p className="font-pixel text-xs text-foreground">{car.stars}</p>
                            <p className="text-[10px] text-muted-foreground">Stars</p>
                        </div>
                        <div className="bg-secondary/50 rounded px-2.5 py-2 text-center">
                            <GitFork className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                            <p className="font-pixel text-xs text-foreground">{car.forks}</p>
                            <p className="text-[10px] text-muted-foreground">Forks</p>
                        </div>
                        <div className="bg-secondary/50 rounded px-2.5 py-2 text-center">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                            <p className="font-pixel text-xs text-foreground">{timeAgo(pushed)}</p>
                            <p className="text-[10px] text-muted-foreground">Pushed</p>
                        </div>
                    </div>

                    {/* Language */}
                    <div className="flex items-center gap-2">
                        <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: car.color }}
                        />
                        <span className="text-xs text-foreground">{car.language}</span>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-1.5">
                        {car.isPinned && (
                            <span className="inline-flex items-center gap-1 bg-primary/15 text-primary text-[10px] px-2 py-0.5 rounded-sm font-pixel">
                                <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                        )}
                        {car.isCrooked && (
                            <span className="inline-flex items-center gap-1 bg-secondary text-muted-foreground text-[10px] px-2 py-0.5 rounded-sm">
                                <GitBranch className="w-2.5 h-2.5" /> Forked
                            </span>
                        )}
                        {car.isCovered && (
                            <span className="inline-flex items-center gap-1 bg-secondary text-muted-foreground text-[10px] px-2 py-0.5 rounded-sm">
                                <Archive className="w-2.5 h-2.5" /> Archived
                            </span>
                        )}
                        {car.isDusty && (
                            <span className="inline-flex items-center gap-1 bg-secondary text-muted-foreground text-[10px] px-2 py-0.5 rounded-sm">
                                <Sparkles className="w-2.5 h-2.5" /> Dusty
                            </span>
                        )}
                    </div>

                    {/* Car info */}
                    <div className="bg-secondary/30 rounded p-3 space-y-1.5">
                        <p className="font-pixel text-[10px] text-muted-foreground uppercase tracking-wider">
                            Car Details
                        </p>
                        <div className="grid grid-cols-2 gap-y-1 text-xs">
                            <span className="text-muted-foreground">Type</span>
                            <span className="text-foreground capitalize">{car.size}</span>
                            <span className="text-muted-foreground">Paint</span>
                            <span className="text-foreground">{car.isDusty ? 'Dusty' : 'Fresh'}</span>
                            <span className="text-muted-foreground">Parking</span>
                            <span className="text-foreground">{car.isCrooked ? 'Crooked' : 'Straight'}</span>
                            <span className="text-muted-foreground">Cover</span>
                            <span className="text-foreground">{car.isCovered ? 'Tarp' : 'Open'}</span>
                        </div>
                    </div>

                    {/* Topics */}
                    {car.topics.length > 0 && (
                        <div className="space-y-2">
                            <p className="font-pixel text-[10px] text-muted-foreground uppercase tracking-wider">
                                Bumper Stickers
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {car.topics.slice(0, 8).map((t) => (
                                    <span
                                        key={t}
                                        className="inline-flex items-center gap-0.5 bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded-sm"
                                    >
                                        <Tag className="w-2 h-2" />{t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer CTA */}
                <div className="px-4 py-3 border-t border-border">
                    <a
                        href={car.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-pixel text-xs py-2.5 rounded hover:opacity-90 transition-opacity"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View on GitHub
                    </a>
                </div>
            </div>
        </>
    );
}
