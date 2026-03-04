import { useMemo } from 'react';
import type { UserSection } from '@/lib/districtLayout';

interface ParkingEvent {
    id: string;
    text: string;
    time: number;
}

interface ActivityTickerProps {
    sections: UserSection[];
}

function generateEvents(sections: UserSection[]): ParkingEvent[] {
    const events: ParkingEvent[] = [];

    for (const section of sections) {
        // Section added event
        events.push({
            id: `join-${section.username}`,
            text: `🚗 @${section.username} parked ${section.cars.length} cars`,
            time: Date.now(),
        });

        // Top starred car
        const topStarCar = [...section.cars].sort((a, b) => b.stars - a.stars)[0];
        if (topStarCar && topStarCar.stars > 0) {
            events.push({
                id: `star-${section.username}-${topStarCar.id}`,
                text: `⭐ ${topStarCar.name} by @${section.username} — ${topStarCar.stars.toLocaleString()} stars`,
                time: Date.now(),
            });
        }

        // Fork count
        const totalForks = section.cars.reduce((s, c) => s + c.forks, 0);
        if (totalForks > 10) {
            events.push({
                id: `forks-${section.username}`,
                text: `🔀 @${section.username}'s repos have ${totalForks.toLocaleString()} forks`,
                time: Date.now(),
            });
        }

        // Languages
        const langs = new Set(section.cars.map((c) => c.language).filter(Boolean));
        if (langs.size >= 3) {
            events.push({
                id: `lang-${section.username}`,
                text: `💻 @${section.username} codes in ${[...langs].slice(0, 4).join(', ')}`,
                time: Date.now(),
            });
        }
    }

    // Shuffle deterministically
    return events.sort((a, b) => {
        let h = 0;
        for (let i = 0; i < a.id.length; i++) h = ((h << 5) - h + a.id.charCodeAt(i)) | 0;
        return h - b.id.charCodeAt(0);
    });
}

export default function ActivityTicker({ sections }: ActivityTickerProps) {
    const events = useMemo(() => generateEvents(sections), [sections]);

    if (events.length < 1) return null;

    const duration = Math.max(30, events.length * 4);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex h-7 items-center border-t border-border/30 bg-card/90 backdrop-blur-sm">
            <div className="min-w-0 flex-1 overflow-hidden">
                <div
                    className="ticker-scroll flex whitespace-nowrap"
                    style={{ '--ticker-duration': `${duration}s` } as React.CSSProperties}
                >
                    {[...events, ...events].map((item, i) => (
                        <span
                            key={`${item.id}-${i}`}
                            className="mx-6 text-[10px] text-muted-foreground font-mono"
                        >
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
