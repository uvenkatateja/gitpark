import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGitHubUser, fetchGitHubRepos, GitHubUser, GitHubRepo } from '@/lib/github';
import { repoToCar } from '@/lib/repoToCar';
import { ParkingLot } from '@/components/3d/ParkingLot';
import { CarProps } from '@/types/car';
import { Loader2, AlertTriangle, ArrowLeft, User } from 'lucide-react';

export default function LotPage() {
  const { username } = useParams<{ username: string }>();
  const [cars, setCars] = useState<CarProps[]>([]);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);

    Promise.all([fetchGitHubUser(username), fetchGitHubRepos(username)])
      .then(([u, repos]) => {
        setUser(u);
        // First 6 repos are "pinned" (most recently updated)
        const mapped = repos.map((r, i) => repoToCar(r, i < 6));
        setCars(mapped);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="font-pixel text-sm text-muted-foreground">Loading {username}'s lot...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4 px-4">
        <AlertTriangle className="w-12 h-12 text-primary" />
        <h1 className="font-pixel text-xl text-foreground">Lot Not Found</h1>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          No cars registered under "{username}". {error}
        </p>
        <Link to="/" className="bg-primary text-primary-foreground font-pixel text-xs px-4 py-2 rounded hover:opacity-90 transition-opacity">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur border-b border-border z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          {user && (
            <div className="flex items-center gap-2">
              <img src={user.avatar_url} alt={user.login} className="w-6 h-6 rounded-sm" />
              <span className="font-pixel text-sm text-foreground">{user.login}</span>
              <span className="text-muted-foreground text-xs">{cars.length} repos</span>
            </div>
          )}
        </div>
        <Link
          to={`/profile/${username}`}
          className="flex items-center gap-1.5 text-xs font-pixel text-muted-foreground hover:text-foreground transition-colors"
        >
          <User className="w-3.5 h-3.5" /> Profile
        </Link>
      </div>

      {/* 3D Lot */}
      <div className="flex-1">
        <ParkingLot cars={cars} username={username || ''} />
      </div>
    </div>
  );
}
