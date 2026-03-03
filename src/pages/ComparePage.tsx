import { useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { fetchGitHubUser, fetchGitHubRepos, GitHubUser, GitHubRepo } from '@/lib/github';
import { repoToCar } from '@/lib/repoToCar';
import { ParkingLot } from '@/components/3d/ParkingLot';
import { CarProps } from '@/types/car';
import { Search, Loader2, ArrowLeft, Star, GitFork } from 'lucide-react';

interface LotData {
  user: GitHubUser;
  cars: CarProps[];
  repos: GitHubRepo[];
}

function useLotData(username: string) {
  const [data, setData] = useState<LotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) { setData(null); return; }
    setLoading(true);
    setError(null);
    Promise.all([fetchGitHubUser(username), fetchGitHubRepos(username)])
      .then(([u, repos]) => {
        setData({ user: u, cars: repos.map((r, i) => repoToCar(r, i < 6)), repos });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  return { data, loading, error };
}

export default function ComparePage() {
  const [user1, setUser1] = useState('');
  const [user2, setUser2] = useState('');
  const [submitted1, setSubmitted1] = useState('');
  const [submitted2, setSubmitted2] = useState('');

  const lot1 = useLotData(submitted1);
  const lot2 = useLotData(submitted2);

  const handleCompare = () => {
    setSubmitted1(user1.trim());
    setSubmitted2(user2.trim());
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="container max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        <h1 className="font-pixel text-2xl text-foreground text-center mb-8">Compare Parking Lots</h1>

        {/* Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto mb-8">
          <input
            value={user1}
            onChange={(e) => setUser1(e.target.value)}
            placeholder="Username 1"
            className="flex-1 w-full bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-mono rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <span className="font-pixel text-primary text-sm">VS</span>
          <input
            value={user2}
            onChange={(e) => setUser2(e.target.value)}
            placeholder="Username 2"
            className="flex-1 w-full bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-mono rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleCompare}
            className="bg-primary text-primary-foreground font-pixel text-xs px-5 py-2.5 rounded hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Compare!
          </button>
        </div>

        {/* Results */}
        {(submitted1 || submitted2) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[lot1, lot2].map((lot, idx) => {
              const name = idx === 0 ? submitted1 : submitted2;
              if (!name) return null;

              return (
                <div key={name} className="border border-border rounded overflow-hidden">
                  <div className="bg-card px-4 py-3 border-b border-border">
                    {lot.loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-muted-foreground text-xs">Loading {name}...</span>
                      </div>
                    ) : lot.error ? (
                      <span className="text-destructive text-xs">{lot.error}</span>
                    ) : lot.data ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={lot.data.user.avatar_url} className="w-6 h-6 rounded-sm" />
                          <span className="font-pixel text-sm text-foreground">{lot.data.user.login}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{lot.data.repos.length} repos</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3" />
                            {lot.data.repos.reduce((s, r) => s + r.stargazers_count, 0)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {lot.data && (
                    <div className="h-[350px] bg-asphalt">
                      <ParkingLot cars={lot.data.cars.slice(0, 30)} username={name} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
