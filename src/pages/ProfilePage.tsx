import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGitHubUser, fetchGitHubRepos, type GitHubUser, type GitHubRepo } from '@/lib/github';
import { Loader2, AlertTriangle, Star, GitFork, Crown, ExternalLink, ArrowLeft, Car, BarChart, Users, Heart } from 'lucide-react';
import { getParker, giveKudos } from '@/lib/parkerService';
import { useAuth } from '@/lib/useAuth';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { githubLogin } = useAuth();
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [parker, setParker] = useState<any>(null);
  const [givingKudos, setGivingKudos] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchGitHubUser(username),
      fetchGitHubRepos(username),
      getParker(username)
    ])
      .then(([u, r, p]) => {
        setUser(u);
        setRepos(r);
        setParker(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  const handleGiveKudos = useCallback(async () => {
    if (!githubLogin || !parker) {
      toast.error('You must be signed in to give kudos.');
      return;
    }
    setGivingKudos(true);
    const result = await giveKudos(githubLogin, parker.id);
    if (result.success) {
      toast.success('Kudos sent! Your support has been recorded.');
      setParker((prev: any) => ({ ...prev, kudos_count: (prev.kudos_count || 0) + 1 }));
    } else {
      toast.error(result.error || 'Failed to give kudos');
    }
    setGivingKudos(false);
  }, [githubLogin, parker]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <AlertTriangle className="w-12 h-12 text-primary" />
        <p className="font-pixel text-foreground">User not found</p>
        <Link to="/" className="bg-primary text-primary-foreground font-pixel text-xs px-4 py-2 rounded">Home</Link>
      </div>
    );
  }

  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
  const langCounts: Record<string, number> = {};
  repos.forEach((r) => { if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1; });
  const topLang = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4 font-mono">
      <div className="container max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to District
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-10 bg-card/20 p-6 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
          <div className="relative">
            <img src={user.avatar_url} alt={user.login} className="w-24 h-24 rounded-xl border-2 border-primary/20 p-1 shadow-2xl bg-card" />
            {parker?.claimed && (
              <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg border-2 border-background animate-bounce-subtle">
                <Crown className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-pixel text-3xl text-foreground tracking-tight">{user.name || user.login}</h1>
              {parker?.claimed && <span className="text-[10px] bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-pixel">CLAIMED</span>}
            </div>
            <p className="text-muted-foreground text-sm font-mono mt-1 opacity-80 flex items-center gap-2">
              @{user.login}
              {parker && (
                <span className="text-primary/40">• Joined {new Date(parker.created_at).toLocaleDateString()}</span>
              )}
            </p>
            {user.bio && <p className="text-muted-foreground text-sm mt-3 leading-relaxed max-w-md italic opacity-70">"{user.bio}"</p>}

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Link
                to={`/lot/${user.login}`}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-pixel text-xs px-5 py-2.5 rounded hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                <Car className="w-4 h-4" /> PARK HERE
              </Link>

              <button
                onClick={handleGiveKudos}
                disabled={givingKudos || !githubLogin}
                className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded font-pixel text-[10px] text-primary hover:bg-primary/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none group"
                title={!githubLogin ? "Sign in to give kudos" : "Give kudos"}
              >
                {givingKudos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Heart className={`w-3.5 h-3.5 group-hover:fill-primary transition-colors ${parker?.kudos_count > 0 ? 'fill-primary/20' : ''}`} />}
                <span>{parker?.kudos_count || 0} KUDOS</span>
              </button>

              {parker && (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-4 py-2.5 rounded text-[10px] text-muted-foreground font-pixel">
                  <Users className="w-3.5 h-3.5" />
                  <span>{parker.visit_count} VISITS</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Repos', value: repos.length, icon: GitFork },
            { label: 'Stars', value: totalStars, icon: Star },
            { label: 'Global Rank', value: parker?.rank ? `#${parker.rank}` : 'UNRANKED', icon: BarChart },
            { label: 'Top Lang', value: topLang, icon: BarChart },
          ].map((s) => (
            <div key={s.label} className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center group hover:border-primary/40 transition-all hover:-translate-y-1 shadow-xl">
              <div className="flex justify-center mb-2 opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all">
                {s.icon && <s.icon className="w-4 h-4" />}
              </div>
              <p className="font-pixel text-2xl text-primary mb-1">{s.value}</p>
              <p className="text-muted-foreground text-[9px] uppercase tracking-widest opacity-60 font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Repos grid */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-pixel text-lg text-foreground tracking-tight">Active Repositories</h2>
          <span className="text-[10px] text-muted-foreground font-mono bg-white/5 px-3 py-1 rounded-full border border-white/5">TOTAL: {repos.length}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {repos.map((r) => (
            <a
              key={r.id}
              href={r.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card/40 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-primary/50 hover:bg-card/60 transition-all group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
              </div>

              <div>
                <h3 className="font-pixel text-sm text-foreground group-hover:text-primary transition-colors mb-2 pr-4">{r.name}</h3>
                {r.description && <p className="text-muted-foreground text-xs font-mono line-clamp-2 mb-4 opacity-70 leading-relaxed">{r.description}</p>}
              </div>

              <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono mt-auto pt-2 border-t border-white/5 uppercase tracking-tighter">
                {r.language && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    {r.language}
                  </span>
                )}
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary/40" />{r.stargazers_count}</span>
                <span className="flex items-center gap-1"><GitFork className="w-3 h-3 text-primary/40" />{r.forks_count}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
