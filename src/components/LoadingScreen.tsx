import { useState, useEffect, useRef } from 'react';

export type LoadingStage = 'connect' | 'repos' | 'build' | 'park' | 'done';

const STAGES: { key: LoadingStage; label: string; icon: string }[] = [
    { key: 'connect', label: 'Connecting to GitHub...', icon: '🔌' },
    { key: 'repos', label: 'Loading repositories...', icon: '📦' },
    { key: 'build', label: 'Building cars...', icon: '🔧' },
    { key: 'park', label: 'Parking the lot...', icon: '🅿️' },
    { key: 'done', label: 'Ready!', icon: '🚗' },
];

interface LoadingScreenProps {
    stage: LoadingStage;
    username: string;
}

export default function LoadingScreen({ stage, username }: LoadingScreenProps) {
    const [dots, setDots] = useState('');
    const currentIdx = STAGES.findIndex((s) => s.key === stage);
    const progress = Math.min(((currentIdx + 1) / STAGES.length) * 100, 100);

    // Animated dots
    useEffect(() => {
        if (stage === 'done') return;
        const id = setInterval(() => {
            setDots((d) => (d.length >= 3 ? '' : d + '.'));
        }, 400);
        return () => clearInterval(id);
    }, [stage]);

    // Car animation position
    const carRef = useRef(0);
    const [carPos, setCarPos] = useState(0);
    useEffect(() => {
        const id = setInterval(() => {
            carRef.current = (carRef.current + 2) % 100;
            setCarPos(carRef.current);
        }, 50);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            {/* Pixel car animation */}
            <div className="relative w-64 h-8 mb-8 overflow-hidden">
                <div className="absolute bottom-0 w-full h-px bg-border" />
                <div
                    className="absolute bottom-1 text-2xl transition-none"
                    style={{ left: `${carPos}%`, transform: 'translateX(-50%)' }}
                >
                    🚗
                </div>
                {/* Road dashes */}
                <div className="absolute bottom-0 w-full flex gap-3 justify-center">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-3 h-px bg-muted-foreground/30"
                            style={{ transform: `translateX(${-carPos * 0.5}px)` }}
                        />
                    ))}
                </div>
            </div>

            {/* Title */}
            <h2 className="font-pixel text-lg text-primary mb-2 text-glow-yellow">
                REPO RIDEZ
            </h2>
            <p className="font-pixel text-xs text-muted-foreground mb-8">
                Loading {username}'s parking lot
            </p>

            {/* Progress bar */}
            <div className="w-64 h-3 bg-secondary rounded-sm border border-border overflow-hidden mb-6">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Stages list */}
            <div className="flex flex-col gap-2 w-64">
                {STAGES.map((s, i) => {
                    const isDone = i < currentIdx;
                    const isCurrent = i === currentIdx;
                    const isPending = i > currentIdx;

                    return (
                        <div
                            key={s.key}
                            className={`flex items-center gap-2 text-xs font-mono transition-opacity duration-300 ${isPending ? 'opacity-25' : 'opacity-100'
                                }`}
                        >
                            <span className="w-5 text-center">
                                {isDone ? '✓' : isCurrent ? s.icon : '○'}
                            </span>
                            <span
                                className={
                                    isDone
                                        ? 'text-muted-foreground line-through'
                                        : isCurrent
                                            ? 'text-primary'
                                            : 'text-muted-foreground'
                                }
                            >
                                {s.label}
                                {isCurrent && stage !== 'done' ? dots : ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
