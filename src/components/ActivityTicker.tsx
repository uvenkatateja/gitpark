import { useMemo } from 'react';
import { useActivityFeed, type FeedEvent } from '@/lib/useActivityFeed';

interface ActivityTickerProps {
    sections?: any[]; // legacy fallback
}

function formatFeedEvent(event: FeedEvent): string {
    const actor = event.actor_login ? `@${event.actor_login}` : 'Someone';
    const target = event.target_login ? `@${event.target_login}` : 'a section';

    switch (event.event_type) {
        case 'parked':
            return `🚗 ${actor} just parked in the district! (${event.metadata.stars || 0} stars collected)`;
        case 'claimed':
            return `👑 ${actor} just CLAIMED their spot permanently!`;
        case 'visited':
            return `👀 ${actor} is checking out ${target}'s repo-ridez.`;
        case 'starred':
            return `❤️ ${actor} gave kudos to ${target}!`;
        default:
            return `✨ ${actor} did something in the district...`;
    }
}

export default function ActivityTicker({ sections }: ActivityTickerProps) {
    const { events } = useActivityFeed(true);

    const displayEvents = useMemo(() => {
        if (events.length > 0) {
            return events.map(e => ({
                id: e.id,
                text: formatFeedEvent(e)
            }));
        }

        // Fallback: simple welcome messages if feed is empty
        return [
            { id: 'w1', text: 'Welcome to the GitPark Shared District!' },
            { id: 'w2', text: 'Search any GitHub user to see their repos as low-poly cars.' },
            { id: 'w3', text: 'Sign in with GitHub to claim your own parking space.' },
            { id: 'w4', text: 'Navigate the lot with your mouse or touch.' },
        ];
    }, [events]);

    const duration = Math.max(30, displayEvents.length * 5);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex h-8 items-center border-t border-white/5 bg-background/40 backdrop-blur-2xl">
            <div className="flex items-center px-4 border-r border-white/5 h-full bg-primary/10">
                <span className="font-pixel text-[9px] text-primary tracking-widest animate-pulse">LIVE FEED</span>
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
                <div
                    className="ticker-scroll flex whitespace-nowrap"
                    style={{ '--ticker-duration': `${duration}s` } as React.CSSProperties}
                >
                    {[...displayEvents, ...displayEvents].map((item, i) => (
                        <span
                            key={`${item.id}-${i}`}
                            className="mx-10 text-[10px] text-muted-foreground font-mono flex items-center gap-2"
                        >
                            <span className="w-1 h-1 bg-primary/30 rounded-full" />
                            {item.text}
                        </span>
                    ))}
                </div>
            </div>

            <style>{`
        .ticker-scroll {
          animation: ticker var(--ticker-duration, 60s) linear infinite;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
}
