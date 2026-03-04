import type { CarProps } from '@/types/car';
import type { PositionedCar } from '@/components/3d/InstancedCars';

// ─── Spiral Coordinate ──────────────────────────────────────

export function spiralCoord(index: number): [number, number] {
    if (index === 0) return [0, 0];
    let x = 0, z = 0, dx = 1, dz = 0;
    let segLen = 1, segPassed = 0, turns = 0;
    for (let i = 0; i < index; i++) {
        x += dx; z += dz;
        segPassed++;
        if (segPassed === segLen) {
            segPassed = 0;
            [dx, dz] = [-dz, dx];
            turns++;
            if (turns % 2 === 0) segLen++;
        }
    }
    return [x, z];
}

// ─── Layout Constants ────────────────────────────────────────

export const SECTION_COLS = 6;
export const SPACE_W = 3.0;
export const SPACE_D = 5.0;
export const ROW_GAP = 2.2;
const SECTION_PADDING = 6;
const CELL_SIZE = 50; // each spiral cell is 50x50 world units

// ─── Deterministic fork rotation ─────────────────────────────

export function forkRotation(id: number): number {
    return ((id % 97) / 97 - 0.5) * 0.18;
}

// ─── Types ───────────────────────────────────────────────────

export interface UserData {
    username: string;
    avatarUrl: string;
    cars: CarProps[];
    fetchedAt: number;
}

export interface UserSection {
    username: string;
    avatarUrl: string;
    center: [number, number, number];
    width: number;
    depth: number;
    cars: PositionedCar[];
    sectionIndex: number;
}

export interface DistrictLayout {
    sections: UserSection[];
    allCars: PositionedCar[];
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

// ─── Main Layout Function ────────────────────────────────────

export function generateDistrictLayout(users: UserData[]): DistrictLayout {
    const sections: UserSection[] = [];
    let minX = 0, maxX = 0, minZ = 0, maxZ = 0;

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const [gx, gz] = spiralCoord(i);
        const cx = gx * CELL_SIZE;
        const cz = gz * CELL_SIZE;

        const cols = Math.min(SECTION_COLS, Math.max(2, user.cars.length));
        const rows = Math.ceil(user.cars.length / cols);
        const halfCols = (cols - 1) / 2;

        const sectionW = cols * SPACE_W + SECTION_PADDING * 2;
        const sectionD = rows * (SPACE_D + ROW_GAP) + SECTION_PADDING * 2;

        // Position cars within section
        const sortedCars = [
            ...user.cars.filter((c) => c.isPinned),
            ...user.cars.filter((c) => !c.isPinned),
        ];

        const positioned: PositionedCar[] = sortedCars.map((car, j) => ({
            ...car,
            slotX: cx + (j % cols - halfCols) * SPACE_W,
            slotZ: cz - Math.floor(j / cols) * (SPACE_D + ROW_GAP),
            yRot: car.isCrooked ? forkRotation(car.id) : 0,
        }));

        sections.push({
            username: user.username,
            avatarUrl: user.avatarUrl,
            center: [cx, 0, cz],
            width: sectionW,
            depth: sectionD,
            cars: positioned,
            sectionIndex: i,
        });

        minX = Math.min(minX, cx - sectionW / 2);
        maxX = Math.max(maxX, cx + sectionW / 2);
        minZ = Math.min(minZ, cz - sectionD / 2);
        maxZ = Math.max(maxZ, cz + sectionD / 2);
    }

    return {
        sections,
        allCars: sections.flatMap((s) => s.cars),
        bounds: { minX, maxX, minZ, maxZ },
    };
}

// ─── LocalStorage Cache ──────────────────────────────────────

const CACHE_KEY = 'reporidez_district';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function getCachedUsers(): UserData[] {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw) as UserData[];
        const now = Date.now();
        return data.filter((u) => now - u.fetchedAt < CACHE_TTL);
    } catch {
        return [];
    }
}

export function setCachedUsers(users: UserData[]): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(users));
    } catch { /* quota exceeded */ }
}
