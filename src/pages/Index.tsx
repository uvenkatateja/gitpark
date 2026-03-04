import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, Users, X, Car, Github, LogOut, MapPin } from 'lucide-react';
import { fetchGitHubUser, fetchGitHubRepos } from '@/lib/github';
import { repoToCar } from '@/lib/repoToCar';
import {
  generateDistrictLayout,
  getCachedUsers,
  setCachedUsers,
  type UserData,
  type DistrictLayout,
} from '@/lib/districtLayout';
import type { PositionedCar } from '@/components/3d/InstancedCars';
import DistrictScene from '@/components/3d/DistrictScene';
import MiniMap from '@/components/MiniMap';
import ActivityTicker from '@/components/ActivityTicker';
import { useAuth } from '@/lib/useAuth';
import { useLiveUsers } from '@/lib/useLiveUsers';
import { upsertParker, claimSection } from '@/lib/parkerService';
import { insertFeedEvent } from '@/lib/useActivityFeed';

// ─── Popular Users ───────────────────────────────────────────

const SUGGESTIONS = ['torvalds', 'sindresorhus', 'tj', 'gaearon', 'yyx990803'];

// ─── Main Page ───────────────────────────────────────────────

export default function DistrictPage() {
  // ── State ──
  const [users, setUsers] = useState<UserData[]>(() => getCachedUsers());
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<PositionedCar | null>(null);
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Supabase: Auth + Live Users ──
  const { session, user, githubLogin, signIn, signOut, loading: authLoading } = useAuth();
  const { count: liveCount, status: liveStatus } = useLiveUsers();

  // Claim state
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // ── Layout ──
  const layout = useMemo<DistrictLayout>(() => generateDistrictLayout(users), [users]);

  // Persist to localStorage
  useEffect(() => {
    setCachedUsers(users);
  }, [users]);

  // Camera position for minimap
  const [camPos, setCamPos] = useState<{ x: number; z: number }>({ x: 0, z: 35 });
  const camPosRef = useRef(camPos);

  const handleCameraMove = useCallback((x: number, z: number) => {
    camPosRef.current = { x, z };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCamPos({ ...camPosRef.current });
    }, 250);
    return () => clearInterval(id);
  }, []);

  // ── Search ──
  const handleSearch = useCallback(
    async (username?: string) => {
      const trimmed = (username || searchInput).trim().toLowerCase();
      if (!trimmed) return;

      // Already in district? Just fly there
      const existingIdx = users.findIndex((u) => u.username.toLowerCase() === trimmed);
      if (existingIdx >= 0) {
        const section = generateDistrictLayout(users).sections[existingIdx];
        setCameraTarget(section.center);
        setSearchInput('');
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [ghUser, repos] = await Promise.all([
          fetchGitHubUser(trimmed),
          fetchGitHubRepos(trimmed),
        ]);

        const cars = repos.map((r, i) => repoToCar(r, i < 6));

        const newUser: UserData = {
          username: ghUser.login,
          avatarUrl: ghUser.avatar_url,
          cars,
          fetchedAt: Date.now(),
        };

        setUsers((prev) => {
          const next = [...prev, newUser];
          const newLayout = generateDistrictLayout(next);
          const newSection = newLayout.sections[newLayout.sections.length - 1];
          setCameraTarget(newSection.center);
          return next;
        });

        setSearchInput('');

        // ── Supabase: upsert parker record + insert feed event ──
        const totalStars = repos.reduce((s, r) => s + (r.stargazers_count ?? 0), 0);
        const totalForks = repos.reduce((s, r) => s + (r.forks_count ?? 0), 0);
        const topLang = repos
          .map((r) => r.language)
          .filter(Boolean)
          .reduce<Record<string, number>>((acc, lang) => {
            acc[lang!] = (acc[lang!] ?? 0) + 1;
            return acc;
          }, {});
        const primaryLang = Object.entries(topLang).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        upsertParker({
          github_login: ghUser.login,
          github_id: ghUser.id,
          display_name: ghUser.name ?? null,
          avatar_url: ghUser.avatar_url ?? null,
          bio: ghUser.bio ?? null,
          public_repos: ghUser.public_repos ?? repos.length,
          total_stars: totalStars,
          total_forks: totalForks,
          primary_language: primaryLang,
        }).then((parker) => {
          if (parker) {
            insertFeedEvent('parked', parker.id, null, {
              login: parker.github_login,
              repo_count: repos.length,
              stars: totalStars,
            });
          }
        });

      } catch (e: any) {
        setError(e.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    },
    [searchInput, users],
  );

  // ── Claim section ──
  const handleClaim = useCallback(async () => {
    if (!user || !githubLogin) return;
    setClaiming(true);
    try {
      const result = await claimSection(githubLogin, user.id);
      if (result.success) {
        setClaimed(true);
        // Make sure the claimed user's section is in the district
        handleSearch(githubLogin);
      } else {
        setError(result.error ?? 'Claim failed');
      }
    } finally {
      setClaiming(false);
    }
  }, [user, githubLogin, handleSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleCarClick = useCallback((car: PositionedCar) => {
    setSelectedCar((prev) => (prev?.id === car.id ? null : car));
  }, []);

  const handleCarClose = useCallback(() => setSelectedCar(null), []);

  const handleRemoveUser = useCallback((username: string) => {
    setUsers((prev) => prev.filter((u) => u.username !== username));
    setSelectedCar(null);
  }, []);

  const handleFlyTo = useCallback(
    (idx: number) => {
      const section = layout.sections[idx];
      if (section) setCameraTarget(section.center);
    },
    [layout],
  );

  const isEmpty = users.length === 0;

  return (
    <div className="fixed inset-0 bg-background">
      {/* ─── 3D Canvas ───────────────────────────────────── */}
      <DistrictScene
        layout={layout}
        selectedCar={selectedCar}
        onCarClick={handleCarClick}
        onCarClose={handleCarClose}
        cameraTarget={cameraTarget}
        onBackgroundClick={() => {
          setSelectedCar(null);
          setCameraTarget(null);
        }}
        onCameraMove={handleCameraMove}
      />

      {/* ─── HUD: Top Bar ─────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="flex items-center justify-between px-4 py-3 pointer-events-auto">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            <span className="font-pixel text-sm text-primary text-glow-yellow hidden sm:inline">
              REPO RIDEZ
            </span>
          </div>

          {/* Search */}
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2 max-w-sm w-full mx-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search GitHub username..."
                className="w-full bg-card/80 backdrop-blur-md border border-border text-foreground placeholder:text-muted-foreground font-mono text-sm rounded pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="bg-primary text-primary-foreground font-pixel text-xs px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'PARK IT!'}
            </button>
          </form>

          {/* Right side: live users + auth */}
          <div className="flex items-center gap-3">
            {/* Live user count (Supabase presence) */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={`w-1.5 h-1.5 rounded-full ${liveStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                    liveStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                  }`}
              />
              <Users className="w-3.5 h-3.5" />
              <span className="font-pixel">{liveCount}</span>
            </div>

            {/* Auth button */}
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-2">
                  {/* Claim button (if signed in but section not claimed) */}
                  {githubLogin && !claimed && (
                    <button
                      onClick={handleClaim}
                      disabled={claiming}
                      className="bg-primary/20 border border-primary/50 text-primary font-pixel text-[10px] px-2 py-1 rounded hover:bg-primary/30 transition-colors whitespace-nowrap"
                    >
                      {claiming ? <Loader2 className="w-3 h-3 animate-spin inline" /> : '🅿 CLAIM'}
                    </button>
                  )}
                  {claimed && (
                    <span className="text-green-400 font-pixel text-[10px]">✓ CLAIMED</span>
                  )}
                  <img
                    src={user.user_metadata?.avatar_url}
                    alt={githubLogin ?? ''}
                    className="w-6 h-6 rounded-full border border-border"
                  />
                  <button
                    onClick={signOut}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signIn}
                  className="flex items-center gap-1.5 bg-card/80 backdrop-blur-md border border-border text-foreground font-pixel text-[10px] px-3 py-1.5 rounded hover:bg-secondary/80 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SIGN IN</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Error toast */}
        {error && (
          <div className="flex justify-center pointer-events-auto">
            <div className="bg-destructive/90 text-destructive-foreground text-xs font-mono px-4 py-2 rounded mx-4 flex items-center gap-2 backdrop-blur-sm">
              <span>{error}</span>
              <button onClick={() => setError(null)}>
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Empty State ──────────────────────────────────── */}
      {isEmpty && !loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
          <div className="pointer-events-auto text-center px-4">
            <h1 className="font-pixel text-3xl sm:text-4xl text-foreground mb-3 leading-tight">
              Your GitHub repos,
              <br />
              <span className="text-primary text-glow-yellow">parked in style.</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Search any GitHub username to add their repos as cars on the map.
              Keep searching — everyone shares the same parking district.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="bg-secondary/80 backdrop-blur-sm text-foreground font-mono text-xs px-3 py-1.5 rounded hover:bg-secondary transition-colors border border-border"
                >
                  @{s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Sections List (bottom-left) ──────────────────── */}
      {users.length > 0 && (
        <div className="absolute bottom-8 left-4 z-30 max-h-48 overflow-y-auto pointer-events-auto">
          <div className="bg-card/80 backdrop-blur-md border border-border rounded w-52">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="font-pixel text-[10px] text-muted-foreground uppercase tracking-wider">
                Parking Sections
              </span>
              <span className="text-[10px] text-muted-foreground">{users.length}</span>
            </div>
            {layout.sections.map((section, idx) => (
              <div
                key={section.username}
                role="button"
                tabIndex={0}
                onClick={() => handleFlyTo(idx)}
                onKeyDown={(e) => e.key === 'Enter' && handleFlyTo(idx)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-secondary/50 transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img src={section.avatarUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />
                  <span className="text-xs text-foreground truncate font-mono">
                    {section.username}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{section.cars.length}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveUser(section.username);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Controls hint ────────────────────────────────── */}
      <div className="absolute bottom-[140px] right-4 z-30 text-[10px] text-muted-foreground/50 font-mono pointer-events-none hidden sm:block">
        <p>Scroll to zoom · Drag to orbit · Right-drag to pan</p>
      </div>

      {/* ─── MiniMap ──────────────────────────────────────── */}
      <MiniMap
        layout={layout}
        cameraX={camPos.x}
        cameraZ={camPos.z}
        visible={users.length > 0}
      />

      {/* ─── Activity Ticker (Supabase live feed when sections exist) ── */}
      {users.length > 0 && <ActivityTicker sections={layout.sections} />}
    </div>
  );
}
