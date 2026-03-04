import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, Users, X, Car, Github, LogOut, MapPin, User, ChevronRight } from 'lucide-react';
import { fetchGitHubUser, fetchGitHubRepos } from '@/lib/github';
import { repoToCar } from '@/lib/repoToCar';
import {
  generateDistrictLayout,
  type UserData,
  type DistrictLayout,
} from '@/lib/districtLayout';
import type { PositionedCar } from '@/components/3d/InstancedCars';
import DistrictScene from '@/components/3d/DistrictScene';
import MiniMap from '@/components/MiniMap';
import ActivityTicker from '@/components/ActivityTicker';
import { useAuth } from '@/lib/useAuth';
import { useLiveUsers } from '@/lib/useLiveUsers';
import { upsertParker, claimSection, fetchAllParkers, ParkerRecord } from '@/lib/parkerService';
import { insertFeedEvent } from '@/lib/useActivityFeed';

// ─── Popular Users ───────────────────────────────────────────

const SUGGESTIONS = ['torvalds', 'sindresorhus', 'tj', 'gaearon', 'yyx990803'];

// ─── Main Page ───────────────────────────────────────────────

export default function DistrictPage() {
  // ── State ──
  const [users, setUsers] = useState<UserData[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [claiming, setClaiming] = useState(false);
  const [myParkerRecord, setMyParkerRecord] = useState<ParkerRecord | null>(null);

  // ── Load All Parkers from DB ──
  const loadWorld = useCallback(async () => {
    try {
      const parkers = await fetchAllParkers();
      const userData: UserData[] = parkers.map((p) => ({
        username: p.github_login,
        avatarUrl: p.avatar_url ?? '',
        cars: (p.top_repos || []).map((r: any, i: number) => repoToCar(r, i < 6)),
        fetchedAt: Date.now(), // dummy
        isClaimed: p.claimed,
      }));
      setUsers(userData);

      // If logged in, find my record
      if (githubLogin) {
        const mine = parkers.find(p => p.github_login.toLowerCase() === githubLogin.toLowerCase());
        if (mine) setMyParkerRecord(mine);
      }
    } catch (e) {
      console.error('Failed to load world', e);
    } finally {
      setInitialLoading(false);
    }
  }, [githubLogin]);

  useEffect(() => {
    loadWorld();
  }, [loadWorld]);

  // ── Layout ──
  const layout = useMemo<DistrictLayout>(() => generateDistrictLayout(users), [users]);

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
    async (username?: string, isAuto = false) => {
      const trimmed = (username || searchInput).trim().toLowerCase();
      if (!trimmed) return;

      // Already in district? Just fly there
      const existingIdx = users.findIndex((u) => u.username.toLowerCase() === trimmed);
      if (existingIdx >= 0) {
        const section = generateDistrictLayout(users).sections[existingIdx];
        setCameraTarget(section.center);
        if (!isAuto) setSearchInput('');
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

        // ── Supabase: upsert parker record ──
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

        const parker = await upsertParker({
          github_login: ghUser.login,
          github_id: ghUser.id,
          display_name: ghUser.name ?? null,
          avatar_url: ghUser.avatar_url ?? null,
          bio: ghUser.bio ?? null,
          public_repos: ghUser.public_repos ?? repos.length,
          total_stars: totalStars,
          total_forks: totalForks,
          primary_language: primaryLang,
          top_repos: repos, // Cache repos for car rendering
        });

        if (parker) {
          insertFeedEvent('parked', parker.id, null, {
            login: parker.github_login,
            repo_count: repos.length,
            stars: totalStars,
          });

          if (githubLogin && parker.github_login.toLowerCase() === githubLogin.toLowerCase()) {
            setMyParkerRecord(parker);
          }
        }

        setUsers((prev) => {
          const next = [...prev, newUser];
          const newLayout = generateDistrictLayout(next);
          const newSection = newLayout.sections[newLayout.sections.length - 1];
          setCameraTarget(newSection.center);
          return next;
        });

        if (!isAuto) setSearchInput('');
      } catch (e: any) {
        setError(e.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    },
    [searchInput, users, githubLogin],
  );

  // Auto-park own user on login
  useEffect(() => {
    if (githubLogin && !initialLoading) {
      const isParked = users.some(u => u.username.toLowerCase() === githubLogin.toLowerCase());
      if (!isParked) {
        handleSearch(githubLogin, true);
      }
    }
  }, [githubLogin, initialLoading, users, handleSearch]);

  // ── Claim section ──
  const handleClaim = useCallback(async () => {
    if (!user || !githubLogin) return;
    setClaiming(true);
    try {
      const result = await claimSection(githubLogin, user.id);
      if (result.success) {
        // Refresh my record
        const record = await upsertParker({
          github_login: githubLogin,
          public_repos: 0, // values won't be updated if already exists and we don't pass repos
          total_stars: 0,
          total_forks: 0
        });
        if (record) setMyParkerRecord(record);
      } else {
        setError(result.error ?? 'Claim failed');
      }
    } finally {
      setClaiming(false);
    }
  }, [user, githubLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleCarClick = useCallback((car: PositionedCar) => {
    setSelectedCar((prev) => (prev?.id === car.id ? null : car));
  }, []);

  const handleCarClose = useCallback(() => setSelectedCar(null), []);

  const handleFlyTo = useCallback(
    (idx: number) => {
      const section = layout.sections[idx];
      if (section) setCameraTarget(section.center);
    },
    [layout],
  );

  const goMySpot = useCallback(() => {
    if (githubLogin) {
      handleSearch(githubLogin, true);
    }
  }, [githubLogin, handleSearch]);

  const isEmpty = users.length === 0 && !initialLoading;

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
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
        <div className="flex items-center justify-between px-4 py-3 pointer-events-auto bg-gradient-to-b from-background/80 to-transparent">

          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setCameraTarget([0, 0, 0])}
          >
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30 group-hover:border-primary/60 transition-colors">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <span className="font-pixel text-sm text-primary text-glow-yellow hidden sm:inline tracking-widest">
              REPO RIDEZ
            </span>
          </div>

          {/* Search */}
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2 max-w-sm w-full mx-4 group">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                ref={searchRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={user ? "Search user sections..." : "Type your GitHub username..."}
                className="w-full bg-card/60 backdrop-blur-xl border border-white/10 text-foreground placeholder:text-muted-foreground font-mono text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all shadow-2xl"
                disabled={loading}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              )}
            </div>
          </form>

          {/* Right side: live users + auth */}
          <div className="flex items-center gap-4">
            {/* Live user count */}
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
              <span
                className={`w-2 h-2 rounded-full ${liveStatus === 'connected' ? 'bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]' :
                  liveStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400 shadow-[0_0_8px_#facc15]'
                  }`}
              />
              <span className="font-pixel text-[10px] text-foreground tracking-tighter">{liveCount} LIVE</span>
            </div>

            {/* Auth button organization */}
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 py-1 rounded-full backdrop-blur-md group">
                  {/* Claim Button */}
                  {githubLogin && !myParkerRecord?.claimed && (
                    <button
                      onClick={handleClaim}
                      disabled={claiming}
                      className="bg-primary/20 border border-primary/40 text-primary font-pixel text-[9px] px-2.5 py-1.5 rounded-full hover:bg-primary/40 transition-all hover:scale-105"
                    >
                      {claiming ? <Loader2 className="w-3 h-3 animate-spin" /> : '🅿 CLAIM OWNERSHIP'}
                    </button>
                  )}

                  {/* My Spot Button */}
                  <button
                    onClick={goMySpot}
                    className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-full transition-colors"
                  >
                    <img
                      src={user.user_metadata?.avatar_url}
                      alt={githubLogin ?? ''}
                      className="w-7 h-7 rounded-full border border-primary/30"
                    />
                    <div className="flex flex-col items-start leading-none pr-1">
                      <span className="text-[10px] font-mono text-foreground font-bold tracking-tight">@{githubLogin}</span>
                      <span className="text-[8px] text-muted-foreground uppercase pt-0.5 tracking-widest">My District</span>
                    </div>
                  </button>

                  <div className="w-px h-4 bg-white/10 mx-1" />

                  <button
                    onClick={signOut}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signIn}
                  className="flex items-center gap-2.5 bg-primary text-primary-foreground font-pixel text-[11px] px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(242,193,78,0.3)]"
                >
                  <Github className="w-4 h-4" />
                  <span>SIGN IN TO PARK</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Error toast */}
        {error && (
          <div className="flex justify-center mt-2 pointer-events-auto">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono px-5 py-2.5 rounded-lg mx-4 flex items-center gap-3 backdrop-blur-xl shadow-2xl">
              <span className="w-2 h-2 bg-destructive rounded-full" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="hover:scale-110 transition-transform"
              >
                <X className="w-4 h-4 opacity-70" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Empty State (Shared Experience) ──────────────── */}
      {isEmpty && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
          <div className="pointer-events-auto text-center px-4 max-w-xl animate-in fade-in zoom-in duration-700">
            <h1 className="font-pixel text-4xl sm:text-5xl text-foreground mb-4 leading-[1.1] tracking-tighter">
              A shared district for
              <br />
              <span className="text-primary text-glow-yellow">GitHub Repos.</span>
            </h1>
            <p className="text-muted-foreground text-base font-mono mb-8 opacity-80 leading-relaxed">
              Every parked user is permanent. Search a developer to see their repos as low-poly rides.
              Claim your spot to own your space in the lot.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="bg-white/5 backdrop-blur-md text-foreground font-mono text-xs px-4 py-2 rounded-full hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2 group"
                >
                  <span className="text-primary opacity-50 font-bold">@</span>
                  {s}
                  <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Sections List (bottom-left) ──────────────────── */}
      {users.length > 0 && (
        <div className="absolute bottom-10 left-6 z-30 max-h-64 overflow-y-auto pointer-events-auto custom-scrollbar">
          <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-xl w-60 overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/5">
              <span className="font-pixel text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                District Hub
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-primary/80 font-mono">
                <span className="w-1 h-1 bg-primary rounded-full animate-ping" />
                {users.length} PARKERS
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {layout.sections.map((section, idx) => (
                <button
                  key={section.username}
                  onClick={() => handleFlyTo(idx)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-all group group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img src={section.avatarUrl} alt="" className="w-6 h-6 rounded-lg flex-shrink-0 border border-white/10" />
                      {section.username.toLowerCase() === githubLogin?.toLowerCase() && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-foreground truncate font-mono font-bold group-hover:text-primary transition-colors">
                        {section.username}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest pt-0.5">
                        {section.cars.length} Cars {section.isClaimed && <span className="text-primary ml-1">★</span>}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Initial Loading Screen ── */}
      {initialLoading && (
        <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center">
          <div className="relative w-24 h-24 mb-6">
            <Car className="w-12 h-12 text-primary animate-bounce absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="font-pixel text-primary text-xs tracking-widest animate-pulse">INITIATING DISTRICT LOAD...</p>
        </div>
      )}

      {/* ─── Controls hint ────────────────────────────────── */}
      {!initialLoading && (
        <div className="absolute bottom-[160px] right-6 z-30 text-[10px] text-muted-foreground/40 font-mono pointer-events-none hidden sm:block bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
          <p>SCROLL TO ZOOM · DRAG TO ROTATE · RIGHT-DRAG TO PAN</p>
        </div>
      )}

      {/* ─── MiniMap ──────────────────────────────────────── */}
      <MiniMap
        layout={layout}
        cameraX={camPos.x}
        cameraZ={camPos.z}
        visible={users.length > 0 && !initialLoading}
      />

      {/* ─── Activity Ticker ── */}
      {users.length > 0 && !initialLoading && <ActivityTicker sections={layout.sections} />}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(242, 193, 78, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(242, 193, 78, 0.4);
        }
      `}</style>
    </div>
  );
}
