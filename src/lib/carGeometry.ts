import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CarSize } from '@/types/car';

// ─── Per-vertex attribute helper ─────────────────────────────
function prep(
    geo: THREE.BufferGeometry,
    tint: number,
    r: number, g: number, b: number,
): THREE.BufferGeometry {
    const n = geo.getAttribute('position').count;
    const col = new Float32Array(n * 3);
    const mask = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        col[i * 3] = r;
        col[i * 3 + 1] = g;
        col[i * 3 + 2] = b;
        mask[i] = tint;
    }
    geo.setAttribute('aVertColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aTintMask', new THREE.BufferAttribute(mask, 1));
    return geo;
}

// ─── Car Specs per Size ──────────────────────────────────────
export interface CarSpec {
    bodyW: number; bodyH: number; bodyD: number;
    cabinW: number; cabinH: number; cabinD: number;
    cabinOffsetZ: number;
    ground: number;
    wheelR: number; wheelT: number;
    wfZ: number; wrZ: number; // wheel front/rear Z offset
    hasBed?: boolean; bedD?: number;
}

export const CAR_SPECS: Record<CarSize, CarSpec> = {
    compact: {
        bodyW: 1.2, bodyH: 0.30, bodyD: 1.8,
        cabinW: 1.0, cabinH: 0.30, cabinD: 1.05,
        cabinOffsetZ: 0.08, ground: 0.12,
        wheelR: 0.13, wheelT: 0.1, wfZ: 0.55, wrZ: -0.55,
    },
    sedan: {
        bodyW: 1.4, bodyH: 0.34, bodyD: 2.4,
        cabinW: 1.15, cabinH: 0.33, cabinD: 1.2,
        cabinOffsetZ: 0.1, ground: 0.12,
        wheelR: 0.14, wheelT: 0.12, wfZ: 0.75, wrZ: -0.70,
    },
    suv: {
        bodyW: 1.55, bodyH: 0.42, bodyD: 2.6,
        cabinW: 1.35, cabinH: 0.46, cabinD: 1.7,
        cabinOffsetZ: 0.05, ground: 0.20,
        wheelR: 0.17, wheelT: 0.14, wfZ: 0.85, wrZ: -0.75,
    },
    truck: {
        bodyW: 1.6, bodyH: 0.40, bodyD: 3.0,
        cabinW: 1.35, cabinH: 0.42, cabinD: 1.1,
        cabinOffsetZ: 0.75, ground: 0.20,
        wheelR: 0.17, wheelT: 0.14, wfZ: 1.0, wrZ: -0.90,
        hasBed: true, bedD: 1.4,
    },
};

// ─── Geometry Builder ────────────────────────────────────────
export function createCarGeometry(size: CarSize): THREE.BufferGeometry {
    const s = CAR_SPECS[size];
    const parts: THREE.BufferGeometry[] = [];
    const bodyY = s.ground + s.bodyH / 2;
    const cabinY = s.ground + s.bodyH + s.cabinH / 2;

    // Body
    const body = new THREE.BoxGeometry(s.bodyW, s.bodyH, s.bodyD);
    body.translate(0, bodyY, 0);
    parts.push(prep(body, 1.0, 1, 1, 1));

    // Cabin
    const cabin = new THREE.BoxGeometry(s.cabinW, s.cabinH, s.cabinD);
    cabin.translate(0, cabinY, s.cabinOffsetZ);
    parts.push(prep(cabin, 1.0, 0.90, 0.90, 0.90));

    // Front bumper
    const fb = new THREE.BoxGeometry(s.bodyW * 0.88, s.bodyH * 0.5, 0.08);
    fb.translate(0, s.ground + s.bodyH * 0.25, s.bodyD / 2 + 0.04);
    parts.push(prep(fb, 0.6, 0.22, 0.22, 0.25));

    // Rear bumper
    const rb = new THREE.BoxGeometry(s.bodyW * 0.88, s.bodyH * 0.5, 0.08);
    rb.translate(0, s.ground + s.bodyH * 0.25, -s.bodyD / 2 - 0.04);
    parts.push(prep(rb, 0.6, 0.22, 0.22, 0.25));

    // Wheels (4x)
    const wGeo = new THREE.CylinderGeometry(s.wheelR, s.wheelR, s.wheelT, 8);
    wGeo.rotateZ(Math.PI / 2);
    const wx = s.bodyW / 2 + 0.01;
    for (const [px, pz] of [[-wx, s.wfZ], [wx, s.wfZ], [-wx, s.wrZ], [wx, s.wrZ]]) {
        const w = wGeo.clone();
        w.translate(px, s.wheelR, pz);
        parts.push(prep(w, 0.0, 0.11, 0.11, 0.13));
    }

    // Headlights (front, emissive yellow)
    for (const side of [-1, 1]) {
        const hl = new THREE.BoxGeometry(0.10, 0.07, 0.03);
        hl.translate(side * s.bodyW * 0.32, bodyY, s.bodyD / 2 + 0.015);
        parts.push(prep(hl, 0.0, 1.0, 1.0, 0.78));
    }

    // Taillights (rear, red)
    for (const side of [-1, 1]) {
        const tl = new THREE.BoxGeometry(0.12, 0.06, 0.03);
        tl.translate(side * s.bodyW * 0.33, bodyY, -s.bodyD / 2 - 0.015);
        parts.push(prep(tl, 0.0, 0.88, 0.08, 0.08));
    }

    // Windshield (front)
    const ws = new THREE.BoxGeometry(s.cabinW * 0.84, s.cabinH * 0.68, 0.03);
    ws.translate(0, cabinY + 0.02, s.cabinOffsetZ + s.cabinD / 2 + 0.015);
    parts.push(prep(ws, 0.12, 0.50, 0.68, 0.85));

    // Rear window
    const rw = new THREE.BoxGeometry(s.cabinW * 0.84, s.cabinH * 0.55, 0.03);
    rw.translate(0, cabinY + 0.02, s.cabinOffsetZ - s.cabinD / 2 - 0.015);
    parts.push(prep(rw, 0.12, 0.40, 0.52, 0.62));

    // Side windows (left + right)
    for (const side of [-1, 1]) {
        const sw = new THREE.BoxGeometry(0.03, s.cabinH * 0.55, s.cabinD * 0.75);
        sw.translate(side * (s.cabinW / 2 + 0.015), cabinY + 0.02, s.cabinOffsetZ);
        parts.push(prep(sw, 0.12, 0.45, 0.60, 0.72));
    }

    // Truck bed walls
    if (s.hasBed && s.bedD) {
        const bedZ = s.cabinOffsetZ - s.cabinD / 2 - s.bedD / 2 - 0.1;
        const bwH = s.bodyH * 0.65;
        const bwY = s.ground + s.bodyH + bwH / 2;
        // Left & right
        for (const side of [-1, 1]) {
            const wall = new THREE.BoxGeometry(0.06, bwH, s.bedD);
            wall.translate(side * (s.bodyW / 2 - 0.03), bwY, bedZ);
            parts.push(prep(wall, 1.0, 0.82, 0.82, 0.82));
        }
        // Back
        const back = new THREE.BoxGeometry(s.bodyW - 0.06, bwH, 0.06);
        back.translate(0, bwY, bedZ - s.bedD / 2);
        parts.push(prep(back, 1.0, 0.82, 0.82, 0.82));
    }

    const merged = mergeGeometries(parts, false);
    if (!merged) throw new Error(`Failed to merge ${size} car geometry`);
    return merged;
}

// Covered (archived) car — simple tarp box
export function createCoverGeometry(size: CarSize): THREE.BufferGeometry {
    const s = CAR_SPECS[size];
    const h = s.ground + s.bodyH + s.cabinH;
    const geo = new THREE.BoxGeometry(s.bodyW + 0.12, h * 0.82, s.bodyD + 0.08);
    geo.translate(0, h * 0.82 / 2 + 0.02, 0);
    return prep(geo, 0.12, 0.32, 0.32, 0.35);
}
