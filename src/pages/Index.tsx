import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, X, Car, Github, LogOut, ChevronRight, Trophy, Activity, Globe, Star } from 'lucide-react';
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
import {
  upsertParker,
  claimSection,
  fetchAllParkers,
  getParker,
  fetchDistrictStats,
  type ParkerRecord,
} from '@/lib/parkerService';

// ─── Popular Users ───────────────────────────────────────────

const SUGGESTIONS = ['torvalds', 'sindresorhus', 'tj', 'gaearon', 'yyx990803'];

// ─── Helper: Deduplicate users array ─────────────────────────

function deduplicateUsers(users: UserData[]): UserData[] {
  const seen = new Map<string, UserData>();
  for (const user of users) {
    const key = user.username.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, user);
    }
  }
  return Array.from(seen.values());
}

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
  const [districtStats, setDistrictStats] = useState<{ total_parkers: number; total_stars: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Supabase: Auth + Live Users ──
  const { user, githubLogin, signIn, signOut, loading: authLoading } = useAuth();
  const { count: liveCount, status: liveStatus } = useLiveUsers();

  // Claim state
  const [claiming, setClaiming] = useState(false);
  const [myParkerRecord, setMyParkerRecord] = useState<ParkerRecord | null>(null);

  // ── Load All Parkers from DB ──
  const loadWorld = useCallback(async () => {
    try {
      const [parkers, stats] = await Promise.all([
        fetchAllParkers(),
        fetchDistrictStats()
      ]);
      setDistrictStats(stats);

      // Deduplicate parkers by github_login (case-insensitive)
      const uniqueParkers = new Map<string, typeof parkers[0]>();
      for (const p of parkers) {
        const key = p.github_login.toLowerCase();
        if (!uniqueParkers.has(key)) {
          uniqueParkers.set(key, p);
        }
      }

      const userData: UserData[] = Array.from(uniqueParkers.values()).map((p) => ({
        username: p.github_login,
        avatarUrl: p.avatar_url ?? '',
        cars: (p.top_repos || []).map((r: any, i: number) => repoToCar(r, i < 6)),
        fetchedAt: Date.now(),
        isClaimed: p.claimed,
        rank: p.rank,
      }));
      
      console.log('[LoadWorld] Loaded users:', userData.map(u => u.username));
      console.log('[LoadWorld] Unique count:', userData.length, 'Original count:', parkers.length);
      
      setUsers(userData);

      if (githubLogin) {
        const mine = Array.from(uniqueParkers.values()).find(
          (p) => p.github_login.toLowerCase() === githubLogin.toLowerCase(),
        );
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
  const layout = useMemo<DistrictLayout>(() => {
    // Final deduplication check before layout generation
    const dedupedUsers = deduplicateUsers(users);
    
    if (dedupedUsers.length !== users.length) {
      console.warn('[Layout] Found duplicates! Original:', users.length, 'Deduped:', dedupedUsers.length);
      console.warn('[Layout] Original usernames:', users.map(u => u.username));
      console.warn('[Layout] Deduped usernames:', dedupedUsers.map(u => u.username));
    } else {
      console.log('[Layout] No duplicates found. Users:', dedupedUsers.length);
      console.log('[Layout] Usernames:', dedupedUsers.map(u => u.username));
    }
    
    return generateDistrictLayout(dedupedUsers);
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
    async (username?: string, isAuto = false) => {
      const trimmed = (username || searchInput).trim().toLowerCase();
      if (!trimmed) return;

      // 1. Check local state (fastest)
      const existingIdx = users.findIndex((u) => u.username.toLowerCase() === trimmed);

      // 2. Load from DB
      const cachedParker = await getParker(trimmed);

      // Smart Refresh Logic:
      // If cached data exists but:
      // - It has 0 repos (bug from earlier versions?)
      // - It's older than 1 hour (stale)
      // AND we are logged in, we perform a fresh fetch to fix the state.
      const isStale = cachedParker && (
        (cachedParker.public_repos === 0 && !cachedParker.github_login.includes('hi')) || // hi? no HI is a user
        new Date(cachedParker.created_at).getTime() < (Date.now() - 60 * 60 * 1000)
      );

      if (cachedParker && !isStale) {
        // User exists in database - check if already in local state
        if (existingIdx === -1) {
          // Not in local state yet - add them
          const cars = (cachedParker.top_repos || []).map((r: any, i: number) =>
            repoToCar(r, i < 6),
          );
          const userData: UserData = {
            username: cachedParker.github_login,
            avatarUrl: cachedParker.avatar_url ?? '',
            cars,
            fetchedAt: Date.now(),
            isClaimed: cachedParker.claimed,
            rank: cachedParker.rank,
          };

          setUsers((prev) => {
            const next = deduplicateUsers([...prev, userData]);
            const newLayout = generateDistrictLayout(next);
            const newSection = newLayout.sections[newLayout.sections.length - 1];
            setCameraTarget(newSection.center);
            return next;
          });
        } else {
          // Already in local state - just fly camera to their section
          const section = generateDistrictLayout(users).sections[existingIdx];
          setCameraTarget(section.center);
        }

        if (!isAuto) setSearchInput('');
        setError(null);
        return;
      }

      // ─── ONLY PROCEED TO GITHUB FETCH IF IT'S THE LOGGED-IN USER ───
      // If we aren't found in DB yet, check if we are the current logged-in user
      const isMe = githubLogin?.toLowerCase() === trimmed;
      if (!isMe && !isAuto) {
        setError('Citizen not found. Only users who sign in are parked in this district.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [ghUser, repos] = await Promise.all([
          fetchGitHubUser(trimmed),
          fetchGitHubRepos(trimmed),
        ]);

        if ((ghUser as any).type === 'Organization') {
          setError('Organizations are not supported. Search for a user profile instead.');
          setLoading(false);
          return;
        }

        const cars = repos.map((r, i) => repoToCar(r, i < 6));
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

        const parker = await upsertParker(
          {
            github_login: ghUser.login,
            github_id: ghUser.id,
            display_name: ghUser.name ?? null,
            avatar_url: ghUser.avatar_url ?? null,
            bio: ghUser.bio ?? null,
            public_repos: ghUser.public_repos ?? repos.length,
            total_stars: totalStars,
            total_forks: totalForks,
            primary_language: primaryLang,
            top_repos: repos,
          },
          user.id,
        );

        const newUser: UserData = {
          username: ghUser.login,
          avatarUrl: ghUser.avatar_url,
          cars,
          fetchedAt: Date.now(),
          rank: parker?.rank,
        };

        if (parker && githubLogin && parker.github_login.toLowerCase() === githubLogin.toLowerCase()) {
          setMyParkerRecord(parker);
        }

        // Check again if user was added while we were fetching
        const finalCheck = users.findIndex((u) => u.username.toLowerCase() === ghUser.login.toLowerCase());
        
        if (finalCheck === -1) {
          // User not in state - add them
          setUsers((prev) => {
            const next = deduplicateUsers([...prev, newUser]);
            const newLayout = generateDistrictLayout(next);
            const newSection = newLayout.sections[newLayout.sections.length - 1];
            setCameraTarget(newSection.center);
            return next;
          });
        } else {
          // User already exists - just update their data and fly to them
          setUsers((prev) => {
            const next = [...prev];
            next[finalCheck] = newUser;
            const deduped = deduplicateUsers(next);
            const newLayout = generateDistrictLayout(deduped);
            const section = newLayout.sections[finalCheck];
            setCameraTarget(section.center);
            return deduped;
          });
        }

        if (!isAuto) setSearchInput('');
      } catch (e: any) {
        setError(e.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    },
    [searchInput, users, user, githubLogin],
  );

  useEffect(() => {
    if (githubLogin && !initialLoading && user) {
      const isParked = users.some(
        (u) => u.username.toLowerCase() === githubLogin.toLowerCase(),
      );
      if (!isParked) {
        handleSearch(githubLogin, true);
      }
    }
  }, [githubLogin, initialLoading, users, handleSearch, user]);

  const handleClaim = useCallback(async () => {
    if (!user || !githubLogin) return;
    setClaiming(true);
    try {
      const result = await claimSection(githubLogin, user.id);
      if (result.success) {
        await loadWorld();
      } else {
        setError(result.error ?? 'Claim failed');
      }
    } finally {
      setClaiming(false);
    }
  }, [user, githubLogin, loadWorld]);

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
      const idx = users.findIndex(
        (u) => u.username.toLowerCase() === githubLogin.toLowerCase(),
      );
      if (idx >= 0) {
        const section = layout.sections[idx];
        if (section) setCameraTarget(section.center);
      } else {
        handleSearch(githubLogin, true);
      }
    }
  }, [githubLogin, users, layout, handleSearch]);

  const isEmpty = users.length === 0 && !initialLoading;

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
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
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => setCameraTarget([0, 0, 0])}
            >
              <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30 group-hover:border-primary/60 transition-colors">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <span className="font-pixel text-sm text-primary text-glow-yellow hidden sm:inline tracking-widest uppercase">
                GITPARK
              </span>
            </div>

            <Link
              to="/leaderboard"
              className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md hover:bg-primary/10 transition-all hover:scale-105 group"
            >
              <Trophy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-pixel text-[10px] text-muted-foreground group-hover:text-primary transition-colors pt-0.5 tracking-tighter">CITY HALL</span>
            </Link>

            {districtStats && (
              <div className="hidden lg:flex items-center gap-4 bg-black/20 border border-white/5 px-4 py-1.5 rounded-full backdrop-blur-md">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-muted-foreground opacity-50" />
                  <span className="font-pixel text-[9px] text-muted-foreground pt-0.5 tracking-tighter">{districtStats.total_parkers} CITIZENS</span>
                </div>
                <div className="w-px h-2.5 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-primary/50" />
                  <span className="font-pixel text-[9px] text-primary/70 pt-0.5 tracking-tighter">{districtStats.total_stars.toLocaleString()} STARS</span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative flex items-center gap-2 max-w-sm w-full mx-4 group"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                ref={searchRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search Citizens..."
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

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
              <span
                className={`w-2 h-2 rounded-full ${liveStatus === 'connected'
                  ? 'bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]'
                  : liveStatus === 'error'
                    ? 'bg-red-400'
                    : 'bg-yellow-400 shadow-[0_0_8px_#facc15]'
                  }`}
              />
              <span className="font-pixel text-[10px] text-foreground tracking-tighter uppercase">
                {liveCount} LIVE
              </span>
            </div>

            {/* Removed search limit indicator */}

            {!authLoading &&
              (user ? (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 py-1 rounded-full backdrop-blur-md">
                  {githubLogin && myParkerRecord && !myParkerRecord.claimed && (
                    <button
                      onClick={handleClaim}
                      disabled={claiming}
                      className="bg-primary/20 border border-primary/40 text-primary font-pixel text-[9px] px-2.5 py-1.5 rounded-full hover:bg-primary/40 transition-all hover:scale-105"
                    >
                      {claiming ? (<Loader2 className="w-3 h-3 animate-spin" />) : ('🅿 CLAIM')}
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={goMySpot}
                      className="hover:bg-white/5 px-2 py-1 rounded-full transition-colors font-pixel text-[8px] text-muted-foreground uppercase tracking-widest pt-0.5"
                    >
                      FLY TO SPOT
                    </button>
                    <Link
                      to={`/profile/${githubLogin}`}
                      className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-full transition-colors border-l border-white/10"
                    >
                      <img
                        src={user.user_metadata?.avatar_url}
                        alt={githubLogin ?? ''}
                        className="w-7 h-7 rounded-full border border-primary/30 group-hover:border-primary transition-all"
                      />
                      <div className="flex flex-col items-start leading-none pr-1">
                        <span className="text-[10px] font-mono text-foreground font-bold tracking-tight">
                          @{githubLogin}
                        </span>
                        <span className="text-[8px] text-primary uppercase font-pixel tracking-tighter pt-0.5">
                          PROFILE
                        </span>
                      </div>
                    </Link>
                  </div>

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
                  <span className="uppercase">SIGN IN TO PARK</span>
                </button>
              ))}
          </div>
        </div>

        {error && (
          <div className="flex justify-center mt-2 pointer-events-auto">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono px-5 py-2.5 rounded-lg mx-4 flex items-center gap-3 backdrop-blur-xl shadow-2xl max-w-lg">
              <span className="w-2 h-2 bg-destructive rounded-full flex-shrink-0" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="hover:scale-110 transition-transform flex-shrink-0"
              >
                <X className="w-4 h-4 opacity-70" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isEmpty && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
          <div className="pointer-events-auto text-center px-4 max-w-xl animate-in fade-in zoom-in duration-700">
            <h1 className="font-pixel text-4xl sm:text-5xl text-foreground mb-4 leading-[1.1] tracking-tighter uppercase">
              A shared district for
              <br />
              <span className="text-primary text-glow-yellow">GitHub Repos.</span>
            </h1>
            <p className="text-muted-foreground text-base font-mono mb-8 opacity-80 leading-relaxed uppercase">
              Every parked user is permanent. Sign in with GitHub, search a developer,
              and see their repos as low-poly rides. Claim your spot to own your space.
            </p>

            {!user && (
              <button
                onClick={signIn}
                className="flex items-center gap-2.5 bg-primary text-primary-foreground font-pixel text-sm px-8 py-3.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(242,193,78,0.3)] mx-auto mb-8 uppercase"
              >
                <Github className="w-5 h-5" />
                <span>SIGN IN WITH GITHUB</span>
              </button>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="bg-white/5 backdrop-blur-md text-foreground font-mono text-xs px-4 py-2 rounded-full hover:bg-white/10 transition-all border border-white/10 flex items-center gap-2 group uppercase tracking-widest"
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

      {users.length > 0 && (
        <div className="absolute bottom-12 left-6 z-30 max-h-64 overflow-y-auto pointer-events-auto custom-scrollbar">
          <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-xl w-60 overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/5">
              <span className="font-pixel text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                District Hub
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-primary/80 font-pixel">
                <Activity className="w-3 h-3 animate-pulse" />
                {users.length} Citizens
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {layout.sections.map((section, idx) => (
                <button
                  key={section.username}
                  onClick={() => handleFlyTo(idx)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={section.avatarUrl}
                        alt=""
                        className="w-6 h-6 rounded-lg flex-shrink-0 border border-white/10"
                      />
                      {section.username.toLowerCase() ===
                        githubLogin?.toLowerCase() && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                        )}
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-xs text-foreground truncate font-mono font-bold group-hover:text-primary transition-colors">
                        {section.username}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest pt-0.5 font-pixel opacity-70">
                        {section.rank ? `#${section.rank}` : 'UNRANKED'}
                        {section.isClaimed && (
                          <span className="text-primary ml-1.5">★</span>
                        )}
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

      {initialLoading && (
        <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center">
          <div className="relative w-24 h-24 mb-6">
            <Car className="w-12 h-12 text-primary animate-bounce absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="font-pixel text-primary text-[10px] tracking-widest animate-pulse uppercase">
            Initiating District Data...
          </p>
        </div>
      )}

      {!initialLoading && (
        <div className="absolute bottom-[160px] right-6 z-30 text-[9px] text-muted-foreground/40 font-pixel pointer-events-none hidden sm:block bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5 tracking-widest">
          <p>SCROLL TO ZOOM • DRAG TO ROTATE • RIGHT-DRAG TO PAN</p>
        </div>
      )}

      <MiniMap
        layout={layout}
        cameraX={camPos.x}
        cameraZ={camPos.z}
        visible={users.length > 0 && !initialLoading}
      />

      {users.length > 0 && !initialLoading && (
        <ActivityTicker sections={layout.sections} />
      )}

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
