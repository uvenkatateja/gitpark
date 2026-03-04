import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, Users, X, MapPin, Car } from 'lucide-react';
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

// ─── Popular Users (suggested on empty state) ────────────────

const SUGGESTIONS = ['torvalds', 'sindresorhus', 'tj', 'gaearon', 'yyx990803'];

// ─── Main Page ──────────────────────────────────────────────

export default function DistrictPage() {
  const [users, setUsers] = useState<UserData[]>(() => getCachedUsers());
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<PositionedCar | null>(null);
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Layout: recompute when users change
  const layout = useMemo<DistrictLayout>(
    () => generateDistrictLayout(users),
    [users],
  );

  // Persist to localStorage
  useEffect(() => {
    setCachedUsers(users);
  }, [users]);

  // Search handler: fetch + add to district + fly camera
  const handleSearch = useCallback(
    async (username?: string) => {
      const trimmed = (username || searchInput).trim().toLowerCase();
      if (!trimmed) return;

      // Already in district? Just fly there
      const existingIdx = users.findIndex(
        (u) => u.username.toLowerCase() === trimmed,
      );
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
        const [user, repos] = await Promise.all([
          fetchGitHubUser(trimmed),
          fetchGitHubRepos(trimmed),
        ]);

        const cars = repos.map((r, i) => repoToCar(r, i < 6));

        const newUser: UserData = {
          username: user.login,
          avatarUrl: user.avatar_url,
          cars,
          fetchedAt: Date.now(),
        };

        setUsers((prev) => {
          const next = [...prev, newUser];
          // Fly to the new section
          const newLayout = generateDistrictLayout(next);
          const newSection = newLayout.sections[newLayout.sections.length - 1];
          setCameraTarget(newSection.center);
          return next;
        });

        setSearchInput('');
      } catch (e: any) {
        setError(e.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    },
    [searchInput, users],
  );

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
  const [camPos, setCamPos] = useState<{ x: number; z: number }>({ x: 0, z: 35 });
  const camPosRef = useRef(camPos);

  const handleCameraMove = useCallback((x: number, z: number) => {
    camPosRef.current = { x, z };
  }, []);

  // Throttle camera position updates to 4Hz for minimap (avoid re-renders every frame)
  useEffect(() => {
    const id = setInterval(() => {
      setCamPos({ ...camPosRef.current });
    }, 250);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 bg-background">
      {/* ─── 3D Canvas (full screen) ─────────────────────── */}
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

      {/* ─── HUD Overlay ─────────────────────────────────── */}

      {/* Top bar */}
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
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center gap-2 max-w-sm w-full mx-4"
          >
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Park it!'}
            </button>
          </form>

          {/* User count */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="font-pixel">{users.length}</span>
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

      {/* ─── Empty State ─────────────────────────────────── */}
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

      {/* ─── Sections List (bottom-left) ─────────────────── */}
      {users.length > 0 && (
        <div className="absolute bottom-4 left-4 z-30 max-h-48 overflow-y-auto pointer-events-auto">
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
                  <img
                    src={section.avatarUrl}
                    alt=""
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                  />
                  <span className="text-xs text-foreground truncate font-mono">
                    {section.username}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {section.cars.length}
                  </span>
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

      {/* ─── Controls hint (bottom-right, above minimap) ── */}
      <div className="absolute bottom-[140px] right-4 z-30 text-[10px] text-muted-foreground/50 font-mono pointer-events-none hidden sm:block">
        <p>Scroll to zoom · Drag to orbit · Right-drag to pan</p>
      </div>

      {/* ─── MiniMap ─────────────────────────────────────── */}
      <MiniMap
        layout={layout}
        cameraX={camPos.x}
        cameraZ={camPos.z}
        visible={users.length > 0}
      />

      {/* ─── Activity Ticker ─────────────────────────────── */}
      {users.length > 0 && <ActivityTicker sections={layout.sections} />}
    </div>
  );
}
