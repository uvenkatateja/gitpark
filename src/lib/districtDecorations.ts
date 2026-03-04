/**
 * districtDecorations.ts
 * 
 * Procedurally generates ALL world decorations from the DistrictLayout.
 * Grows automatically as users (sections) increase — same pattern as
 * Git City's generateCityLayout decorations pipeline.
 * 
 * Decoration types:
 *  - parkingStripe:  painted line marking each parking space
 *  - roadDash:       dashed center line on roads between sections
 *  - roadSurface:    dark road surface connecting sections
 *  - bollard:        concrete post around section perimeters
 *  - tireStop:       wheel stop at front of each parking space
 *  - trafficCone:    orange cones at section corners
 *  - directionArrow: painted arrow on road surface
 *  - overheadLamp:   tall parking lot light
 *  - curb:           raised curb at section edges
 *  - entrySign:      "REPO RIDEZ" sign at district center
 */

import type { DistrictLayout, UserSection } from './districtLayout';
import { SPACE_W, SPACE_D, SECTION_COLS } from './districtLayout';

// ─── Types ──────────────────────────────────────────────────

export interface ParkingDecoration {
    type:
    | 'parkingStripe'
    | 'roadDash'
    | 'roadSurface'
    | 'bollard'
    | 'tireStop'
    | 'trafficCone'
    | 'directionArrow'
    | 'overheadLamp'
    | 'curb'
    | 'entrySign';
    position: [number, number, number];
    rotation: number;
    scale: [number, number, number];
    color?: string;
}

// ─── Seeded random (deterministic) ──────────────────────────

function hashStr(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

function seededRandom(seed: number): number {
    const s = (seed * 16807) % 2147483647;
    return (s - 1) / 2147483646;
}

// ─── Constants ──────────────────────────────────────────────

const ROAD_WIDTH = 4;         // road between sections
const STRIPE_LENGTH = 1.6;    // parking line length
const STRIPE_WIDTH = 0.04;    // parking line thickness
const DASH_LENGTH = 0.6;      // road center dash length
const DASH_GAP = 0.5;         // gap between dashes
const BOLLARD_SPACING = 3;    // distance between bollards
const LAMP_SPACING = 12;      // distance between overhead lamps
const CURB_HEIGHT = 0.12;     // curb height

// ─── Main Generator ─────────────────────────────────────────

export function generateDecorations(layout: DistrictLayout): ParkingDecoration[] {
    const decorations: ParkingDecoration[] = [];

    if (layout.sections.length === 0) return decorations;

    // ── 1. Per-section decorations ──
    for (const section of layout.sections) {
        const seed = hashStr(section.username);
        const cols = Math.min(SECTION_COLS, Math.max(2, section.cars.length));
        const rows = Math.ceil(section.cars.length / cols);
        const [cx, , cz] = section.center;
        const halfW = section.width / 2;
        const halfD = section.depth / 2;

        // ── Parking stripes (white lines marking each space) ──
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col <= cols; col++) {
                const sx = cx - halfW + col * SPACE_W;
                const sz = cz - halfD + row * (SPACE_D + 0.5) + 0.3;

                // Vertical stripe (space divider)
                decorations.push({
                    type: 'parkingStripe',
                    position: [sx, 0.008, sz],
                    rotation: 0,
                    scale: [STRIPE_WIDTH, 1, STRIPE_LENGTH],
                    color: '#ffffff',
                });
            }

            // Horizontal back-line for each row
            decorations.push({
                type: 'parkingStripe',
                position: [cx, 0.008, cz - halfD + row * (SPACE_D + 0.5) - 0.5],
                rotation: Math.PI / 2,
                scale: [STRIPE_WIDTH, 1, section.width],
                color: '#555566',
            });
        }

        // ── Tire stops (concrete blocks at front of each space) ──
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (row * cols + col >= section.cars.length) break;
                const tx = cx - halfW + col * SPACE_W + SPACE_W / 2;
                const tz = cz - halfD + row * (SPACE_D + 0.5) + SPACE_D * 0.85;

                decorations.push({
                    type: 'tireStop',
                    position: [tx, 0.04, tz],
                    rotation: 0,
                    scale: [0.8, 0.08, 0.12],
                });
            }
        }

        // ── Curbs (raised edges around section perimeter) ──
        // Top curb
        decorations.push({
            type: 'curb',
            position: [cx, CURB_HEIGHT / 2, cz - halfD - 0.3],
            rotation: 0,
            scale: [section.width + 1, CURB_HEIGHT, 0.2],
        });
        // Bottom curb
        decorations.push({
            type: 'curb',
            position: [cx, CURB_HEIGHT / 2, cz + halfD + 0.3],
            rotation: 0,
            scale: [section.width + 1, CURB_HEIGHT, 0.2],
        });
        // Left curb
        decorations.push({
            type: 'curb',
            position: [cx - halfW - 0.3, CURB_HEIGHT / 2, cz],
            rotation: 0,
            scale: [0.2, CURB_HEIGHT, section.depth + 1],
        });
        // Right curb
        decorations.push({
            type: 'curb',
            position: [cx + halfW + 0.3, CURB_HEIGHT / 2, cz],
            rotation: 0,
            scale: [0.2, CURB_HEIGHT, section.depth + 1],
        });

        // ── Bollards (concrete posts at section corners + along edges) ──
        const corners: [number, number][] = [
            [cx - halfW - 0.6, cz - halfD - 0.6],
            [cx + halfW + 0.6, cz - halfD - 0.6],
            [cx - halfW - 0.6, cz + halfD + 0.6],
            [cx + halfW + 0.6, cz + halfD + 0.6],
        ];
        for (const [bx, bz] of corners) {
            decorations.push({
                type: 'bollard',
                position: [bx, 0, bz],
                rotation: 0,
                scale: [0.12, 0.5, 0.12],
            });
        }

        // Bollards along front edge (entry side)
        const bollardCount = Math.floor(section.width / BOLLARD_SPACING);
        for (let bi = 1; bi < bollardCount; bi++) {
            // skip middle opening for entry
            const bx = cx - halfW + bi * (section.width / bollardCount);
            if (Math.abs(bx - cx) < 2) continue; // entry gap
            decorations.push({
                type: 'bollard',
                position: [bx, 0, cz + halfD + 0.6],
                rotation: 0,
                scale: [0.1, 0.4, 0.1],
            });
        }

        // ── Traffic cones (at section entry points) ──
        decorations.push({
            type: 'trafficCone',
            position: [cx - 1.5, 0, cz + halfD + 1.2],
            rotation: seededRandom(seed + 10) * 0.3,
            scale: [0.15, 0.35, 0.15],
        });
        decorations.push({
            type: 'trafficCone',
            position: [cx + 1.5, 0, cz + halfD + 1.2],
            rotation: seededRandom(seed + 20) * -0.3,
            scale: [0.15, 0.35, 0.15],
        });

        // ── Overhead lamps (tall lights along section edges) ──
        const lampCount = Math.max(2, Math.floor(section.width / LAMP_SPACING));
        for (let li = 0; li < lampCount; li++) {
            const lx = cx - halfW + (li + 0.5) * (section.width / lampCount);
            // Lamps on both sides
            decorations.push({
                type: 'overheadLamp',
                position: [lx, 0, cz - halfD - 1.5],
                rotation: 0,
                scale: [1, 1, 1],
            });
            if (li % 2 === 0) {
                decorations.push({
                    type: 'overheadLamp',
                    position: [lx, 0, cz + halfD + 1.5],
                    rotation: Math.PI,
                    scale: [1, 1, 1],
                });
            }
        }

        // ── Direction arrow (painted on ground at section entry) ──
        decorations.push({
            type: 'directionArrow',
            position: [cx, 0.007, cz + halfD + 2.5],
            rotation: 0,
            scale: [0.6, 1, 0.8],
        });
    }

    // ── 2. Roads between sections ──
    if (layout.sections.length > 1) {
        generateRoads(layout, decorations);
    }

    // ── 3. Entry sign at district center ──
    const { bounds } = layout;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    decorations.push({
        type: 'entrySign',
        position: [centerX, 0, centerZ],
        rotation: 0,
        scale: [1, 1, 1],
    });

    return decorations;
}

// ─── Road Generation ────────────────────────────────────────

function generateRoads(layout: DistrictLayout, decorations: ParkingDecoration[]) {
    const sections = layout.sections;

    // Connect each section to its nearest neighbor with a road
    for (let i = 0; i < sections.length; i++) {
        const si = sections[i];

        // Find nearest other section
        let nearestDist = Infinity;
        let nearestIdx = -1;
        for (let j = 0; j < sections.length; j++) {
            if (j === i) continue;
            const sj = sections[j];
            const dx = si.center[0] - sj.center[0];
            const dz = si.center[2] - sj.center[2];
            const dist = dx * dx + dz * dz;
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestIdx = j;
            }
        }

        if (nearestIdx === -1) continue;
        const sj = sections[nearestIdx];

        // Road surface between the two sections
        const midX = (si.center[0] + sj.center[0]) / 2;
        const midZ = (si.center[2] + sj.center[2]) / 2;
        const dx = sj.center[0] - si.center[0];
        const dz = sj.center[2] - si.center[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);

        // Road surface
        decorations.push({
            type: 'roadSurface',
            position: [midX, 0.003, midZ],
            rotation: angle,
            scale: [ROAD_WIDTH, 1, dist],
        });

        // Dashed center line
        const dashStep = DASH_LENGTH + DASH_GAP;
        const dashCount = Math.floor(dist / dashStep);
        const dirX = dx / dist;
        const dirZ = dz / dist;

        for (let d = 0; d < dashCount; d++) {
            const t = (d + 0.5) / dashCount;
            const px = si.center[0] + dx * t;
            const pz = si.center[2] + dz * t;

            decorations.push({
                type: 'roadDash',
                position: [px, 0.009, pz],
                rotation: angle,
                scale: [0.06, 1, DASH_LENGTH],
                color: '#ffd700',
            });
        }

        // Road edge lines (solid white)
        for (const side of [-1, 1]) {
            const offsetX = -dirZ * side * (ROAD_WIDTH / 2 - 0.1);
            const offsetZ = dirX * side * (ROAD_WIDTH / 2 - 0.1);

            decorations.push({
                type: 'parkingStripe',
                position: [midX + offsetX, 0.009, midZ + offsetZ],
                rotation: angle,
                scale: [0.04, 1, dist],
                color: '#ffffff',
            });
        }
    }
}
