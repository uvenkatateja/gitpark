import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGitHubUser, fetchGitHubRepos, GitHubUser, GitHubRepo } from '@/lib/github';
import { Loader2, AlertTriangle, Star, GitFork, Calendar, ExternalLink, ArrowLeft, Car } from 'lucide-react';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);
    Promise.all([fetchGitHubUser(username), fetchGitHubRepos(username)])
      .then(([u, r]) => { setUser(u); setRepos(r); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

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
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="container max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        {/* Header */}
        <div className="flex items-start gap-5 mb-8">
          <img src={user.avatar_url} alt={user.login} className="w-20 h-20 rounded border border-border" />
          <div>
            <h1 className="font-pixel text-2xl text-foreground">{user.name || user.login}</h1>
            <p className="text-muted-foreground text-sm">@{user.login}</p>
            {user.bio && <p className="text-muted-foreground text-xs mt-2 max-w-md">{user.bio}</p>}
            <Link
              to={`/lot/${user.login}`}
              className="inline-flex items-center gap-1.5 mt-3 bg-primary text-primary-foreground font-pixel text-xs px-4 py-2 rounded hover:opacity-90 transition-opacity"
            >
              <Car className="w-3.5 h-3.5" /> View Lot
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Repos', value: repos.length },
            { label: 'Stars', value: totalStars, icon: Star },
            { label: 'Forks', value: totalForks, icon: GitFork },
            { label: 'Top Language', value: topLang },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded p-3 text-center">
              <p className="font-pixel text-lg text-primary">{s.value}</p>
              <p className="text-muted-foreground text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Repos grid */}
        <h2 className="font-pixel text-lg text-foreground mb-4">All Repositories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {repos.map((r) => (
            <a
              key={r.id}
              href={r.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border rounded p-4 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-pixel text-xs text-foreground group-hover:text-primary truncate">{r.name}</h3>
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {r.description && <p className="text-muted-foreground text-xs line-clamp-2 mb-2">{r.description}</p>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {r.language && <span>{r.language}</span>}
                <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{r.stargazers_count}</span>
                <span className="flex items-center gap-0.5"><GitFork className="w-3 h-3" />{r.forks_count}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
