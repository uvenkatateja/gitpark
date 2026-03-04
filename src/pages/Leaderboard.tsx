import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Star, GitFork, Crown, Users, Heart, Trophy, Medal } from 'lucide-react';
import { fetchAllParkers, type ParkerRecord } from '@/lib/parkerService';

export default function LeaderboardPage() {
    const [parkers, setParkers] = useState<ParkerRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllParkers().then((data) => {
            // Sort by stars descending (rank logic)
            const sorted = [...data].sort((a, b) => b.total_stars - a.total_stars);
            setParkers(sorted);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 font-mono">
            <div className="container max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        </Link>
                        <div>
                            <h1 className="font-pixel text-4xl text-foreground tracking-tight">CITY HALL</h1>
                            <p className="text-muted-foreground text-xs uppercase tracking-widest opacity-60 flex items-center gap-2">
                                <Trophy className="w-3 h-3 text-primary" />
                                Official Rankings • {parkers.length} Citizens
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground font-pixel tracking-tighter">TOTAL STARS RECOGNIZED</span>
                        <span className="text-2xl text-primary font-pixel">
                            {parkers.reduce((s, p) => s + p.total_stars, 0).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Top 3 Spotlight */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    {[1, 0, 2].map((idx) => {
                        const p = parkers[idx];
                        if (!p) return null;
                        const orderMap = [2, 1, 3]; // 1st is middle, 2nd is left, 3rd is right
                        const rank = idx + 1;

                        return (
                            <Link
                                key={p.id}
                                to={`/profile/${p.github_login}`}
                                className={`relative group transition-all hover:scale-105 ${rank === 1 ? 'sm:-translate-y-4 order-1 sm:order-2' : rank === 2 ? 'order-2 sm:order-1' : 'order-3'}`}
                            >
                                <div className={`h-full bg-card/60 backdrop-blur-xl border-2 rounded-2xl p-6 text-center ${rank === 1 ? 'border-primary/50 shadow-2xl shadow-primary/10' : 'border-white/5'}`}>
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Medal className={`w-8 h-8 ${rank === 1 ? 'text-primary' : rank === 2 ? 'text-gray-400' : 'text-orange-400'}`} />
                                    </div>
                                    <div className="relative mx-auto mb-4 w-20 h-20">
                                        <img
                                            src={p.avatar_url ?? ''}
                                            onError={(e) => (e.currentTarget.src = `https://unavatar.io/github/${p.github_login}`)}
                                            className="w-full h-full rounded-full border-2 border-primary/20 p-1 group-hover:border-primary transition-all bg-background object-cover"
                                        />
                                        {p.claimed && (
                                            <div className="absolute -top-1 -right-1 bg-primary p-1 rounded-full shadow-lg border border-background">
                                                <Crown className="w-3 h-3 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-pixel text-lg truncate mb-1">@{p.github_login}</h3>
                                    <div className="flex flex-col gap-1.5 opacity-80">
                                        <span className="flex items-center justify-center gap-1.5 text-primary text-xs font-pixel">
                                            <Star className="w-3.5 h-3.5 fill-primary" /> {p.total_stars.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{p.public_repos} REPOS</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Regular List */}
                <div className="bg-card/20 rounded-3xl border border-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-12 px-8 py-5 border-b border-white/5 font-pixel text-[10px] text-muted-foreground uppercase opacity-50 tracking-widest">
                        <div className="col-span-1">Rank</div>
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Citizen</div>
                        <div className="col-span-2 text-center">Stars</div>
                        <div className="col-span-2 text-center">Kudos</div>
                        <div className="col-span-2 text-right">Repos</div>
                    </div>

                    <div className="divide-y divide-white/5">
                        {parkers.map((p, idx) => (
                            <Link
                                key={p.id}
                                to={`/profile/${p.github_login}`}
                                className="grid grid-cols-12 items-center px-8 py-5 hover:bg-white/5 transition-all group relative overflow-hidden"
                            >
                                {p.claimed && <div className="absolute inset-y-0 left-0 w-1 bg-primary" />}

                                <div className="col-span-1 font-pixel text-lg text-muted-foreground group-hover:text-primary transition-colors">
                                    {idx + 1}
                                </div>
                                <div className="col-span-1">
                                    <img
                                        src={p.avatar_url ?? ''}
                                        onError={(e) => (e.currentTarget.src = `https://unavatar.io/github/${p.github_login}`)}
                                        className="w-10 h-10 rounded-xl border border-white/10 p-0.5 group-hover:scale-110 transition-transform bg-card object-cover"
                                    />
                                </div>
                                <div className="col-span-4 pl-4 flex flex-col">
                                    <span className="font-pixel text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                                        @{p.github_login}
                                        {p.claimed && <Crown className="w-3 h-3 text-primary" />}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-mono">{p.primary_language || 'UNKNOWN'}</span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <div className="flex items-center justify-center gap-2 font-pixel text-sm text-primary group-hover:text-glow-yellow">
                                        <Star className="w-3 h-3 fill-primary/20 group-hover:fill-primary transition-all" />
                                        {p.total_stars.toLocaleString()}
                                    </div>
                                </div>
                                <div className="col-span-2 text-center">
                                    <div className="flex items-center justify-center gap-2 font-pixel text-sm text-primary/80">
                                        <Heart className="w-3 h-3 fill-primary/10 group-hover:fill-primary/30 transition-all" />
                                        {p.kudos_count.toLocaleString()}
                                    </div>
                                </div>
                                <div className="col-span-2 text-right font-pixel text-sm text-muted-foreground">
                                    {p.public_repos}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
