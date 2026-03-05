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
export const SPACE_W = 2.2;  // Reduced from 3.0 - tighter horizontal spacing
export const SPACE_D = 3.8;  // Reduced from 5.0 - tighter vertical spacing
export const ROW_GAP = 0.8;  // Reduced from 2.2 - minimal gap between rows
const SECTION_PADDING = 3;   // Reduced from 6 - minimal padding
const CELL_SIZE = 80;        // Reduced from 100 - sections are now more compact

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
    isClaimed?: boolean;
    rank?: number | null;
}

export interface UserSection {
    username: string;
    avatarUrl: string;
    center: [number, number, number];
    width: number;
    depth: number;
    cars: PositionedCar[];
    sectionIndex: number;
    isClaimed: boolean;
    rank?: number | null;
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

    console.log('[Layout] ========== GENERATING LAYOUT ==========');
    console.log('[Layout] Total users:', users.length);
    console.log('[Layout] Usernames:', users.map(u => u.username).join(', '));

    // Debug: Check for duplicate usernames
    const usernames = users.map(u => u.username.toLowerCase());
    const uniqueUsernames = new Set(usernames);
    if (usernames.length !== uniqueUsernames.size) {
        console.error('[Layout] ❌ DUPLICATE USERS DETECTED!');
        console.error('[Layout] Total users:', usernames.length, 'Unique:', uniqueUsernames.size);
        const duplicates = usernames.filter((name, idx) => usernames.indexOf(name) !== idx);
        console.error('[Layout] Duplicates:', [...new Set(duplicates)]);
    }

    // Track used coordinates to detect collisions
    const usedCoords = new Map<string, string>();
    const coordsList: Array<{index: number, username: string, gx: number, gz: number, cx: number, cz: number}> = [];

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const [gx, gz] = spiralCoord(i);
        const cx = gx * CELL_SIZE;
        const cz = gz * CELL_SIZE;

        // Store for logging
        coordsList.push({ index: i, username: user.username, gx, gz, cx, cz });

        // Debug: Check for coordinate collisions
        const coordKey = `${cx},${cz}`;
        if (usedCoords.has(coordKey)) {
            console.error(`[Layout] ❌ COORDINATE COLLISION at (${cx}, ${cz})!`);
            console.error(`[Layout] User "${user.username}" (index ${i}) conflicts with ${usedCoords.get(coordKey)}`);
            console.error(`[Layout] Grid coords: (${gx}, ${gz})`);
        }
        usedCoords.set(coordKey, `"${user.username}" (index ${i})`);

        // Calculate optimal grid layout for cars
        const numCars = user.cars.length;
        const cols = Math.min(SECTION_COLS, Math.max(1, numCars));
        const rows = Math.ceil(numCars / cols);
        
        // Calculate actual section dimensions based on car count
        const actualCols = Math.min(cols, numCars);
        const sectionW = actualCols * SPACE_W + SECTION_PADDING * 2;
        const sectionD = rows * (SPACE_D + ROW_GAP) - ROW_GAP + SECTION_PADDING * 2;

        // Position cars within section - centered and compact
        const sortedCars = [
            ...user.cars.filter((c) => c.isPinned),
            ...user.cars.filter((c) => !c.isPinned),
        ];

        const positioned: PositionedCar[] = sortedCars.map((car, j) => {
            const row = Math.floor(j / cols);
            const col = j % cols;
            
            // Calculate actual columns in this row (last row might have fewer)
            const carsInRow = Math.min(cols, numCars - row * cols);
            const rowOffset = (cols - carsInRow) * SPACE_W / 2; // Center last row
            
            return {
                ...car,
                slotX: cx - sectionW / 2 + SECTION_PADDING + col * SPACE_W + SPACE_W / 2 + rowOffset,
                slotZ: cz - sectionD / 2 + SECTION_PADDING + row * (SPACE_D + ROW_GAP) + SPACE_D / 2,
                yRot: car.isCrooked ? forkRotation(car.id) : 0,
            };
        });

        sections.push({
            username: user.username,
            avatarUrl: user.avatarUrl,
            center: [cx, 0, cz],
            width: sectionW,
            depth: sectionD,
            cars: positioned,
            sectionIndex: i,
            isClaimed: !!user.isClaimed,
            rank: user.rank,
        });

        minX = Math.min(minX, cx - sectionW / 2);
        maxX = Math.max(maxX, cx + sectionW / 2);
        minZ = Math.min(minZ, cz - sectionD / 2);
        maxZ = Math.max(maxZ, cz + sectionD / 2);
    }

    // Log all coordinates
    console.log('[Layout] Coordinate assignments:');
    console.table(coordsList);

    console.log(`[Layout] ✅ Generated ${sections.length} sections for ${users.length} users`);
    console.log('[Layout] ========================================');

    return {
        sections,
        allCars: sections.flatMap((s) => s.cars),
        bounds: { minX, maxX, minZ, maxZ },
    };
}
