/**
 * WorldEnvironment.tsx
 *
 * Renders ALL parking world decorations using instanced meshes.
 * Same architecture as Git City's InstancedDecorations — single
 * draw call per decoration type for maximum performance.
 *
 * Renders: parking stripes, road surfaces, road dashes, bollards,
 * tire stops, traffic cones, direction arrows, overhead lamps, curbs
 */

import { useRef, useMemo, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ParkingDecoration } from '@/lib/districtDecorations';

// ─── Pre-allocated temp objects ─────────────────────────────

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3(1, 1, 1);
const _e = new THREE.Euler();

// ─── Shared geometries ─────────────────────────────────────

function createGeometries() {
    return {
        stripe: new THREE.BoxGeometry(1, 0.01, 1),        // parking lines
        roadSurface: new THREE.PlaneGeometry(1, 1),        // road planes
        roadDash: new THREE.BoxGeometry(1, 0.01, 1),       // center dashes
        bollard: new THREE.CylinderGeometry(0.5, 0.6, 1, 6), // concrete posts
        tireStop: new THREE.BoxGeometry(1, 1, 1),          // wheel stops
        trafficCone: new THREE.ConeGeometry(0.5, 1, 6),    // cones
        directionArrow: new THREE.BufferGeometry(),         // arrow shape
        overheadLampPole: new THREE.CylinderGeometry(0.04, 0.06, 6, 6),
        overheadLampHead: new THREE.BoxGeometry(0.8, 0.06, 0.3),
        curb: new THREE.BoxGeometry(1, 1, 1),              // raised curbs
    };
}

// Arrow geometry (flat triangle pointing forward)
function createArrowGeometry(): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array([
        0, 0.01, -0.5,    // tip
        -0.3, 0.01, 0.3,  // left base
        0.3, 0.01, 0.3,   // right base
        // shaft
        -0.1, 0.01, 0.3,
        0.1, 0.01, 0.3,
        -0.1, 0.01, 0.6,
        0.1, 0.01, 0.6,
    ]);
    const indices = [0, 1, 2, 3, 5, 4, 4, 5, 6];
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

// ─── Shared materials ───────────────────────────────────────

function createMaterials() {
    return {
        whiteStripe: new THREE.MeshStandardMaterial({
            color: '#cccccc', emissive: '#cccccc', emissiveIntensity: 0.15, roughness: 0.7,
        }),
        greyStripe: new THREE.MeshStandardMaterial({
            color: '#444455', emissive: '#444455', emissiveIntensity: 0.1, roughness: 0.8,
        }),
        yellowDash: new THREE.MeshStandardMaterial({
            color: '#ffd700', emissive: '#ffd700', emissiveIntensity: 0.4, roughness: 0.6,
        }),
        roadSurface: new THREE.MeshStandardMaterial({
            color: '#0a0a15', emissive: '#0a0a15', emissiveIntensity: 0.05, roughness: 0.95, side: THREE.DoubleSide,
        }),
        bollard: new THREE.MeshStandardMaterial({
            color: '#888890', emissive: '#888890', emissiveIntensity: 0.15, roughness: 0.6, metalness: 0.2,
        }),
        tireStop: new THREE.MeshStandardMaterial({
            color: '#555560', emissive: '#555560', emissiveIntensity: 0.1, roughness: 0.9,
        }),
        trafficCone: new THREE.MeshStandardMaterial({
            color: '#ff6600', emissive: '#ff4400', emissiveIntensity: 0.5, roughness: 0.5,
        }),
        directionArrow: new THREE.MeshStandardMaterial({
            color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.3, roughness: 0.6,
        }),
        lampPole: new THREE.MeshStandardMaterial({
            color: '#333340', metalness: 0.7, roughness: 0.4,
        }),
        lampHead: new THREE.MeshStandardMaterial({
            color: '#ffeecc', emissive: '#ffddaa', emissiveIntensity: 2.5, toneMapped: false,
        }),
        curb: new THREE.MeshStandardMaterial({
            color: '#2a2a38', emissive: '#2a2a38', emissiveIntensity: 0.1, roughness: 0.85,
        }),
    };
}

// ─── Helper: set up instanced mesh ──────────────────────────

function setupInstances(
    ref: React.RefObject<THREE.InstancedMesh>,
    items: ParkingDecoration[],
) {
    const mesh = ref.current;
    if (!mesh || items.length === 0) return;

    for (let i = 0; i < items.length; i++) {
        const d = items[i];
        _e.set(
            d.type === 'roadSurface' ? -Math.PI / 2 : 0,
            d.rotation,
            0,
        );
        _q.setFromEuler(_e);
        _p.set(d.position[0], d.position[1], d.position[2]);
        _s.set(d.scale[0], d.scale[1], d.scale[2]);
        _m.compose(_p, _q, _s);
        mesh.setMatrixAt(i, _m);
    }

    mesh.instanceMatrix.needsUpdate = true;
}

// ─── Component ──────────────────────────────────────────────

interface WorldEnvironmentProps {
    decorations: ParkingDecoration[];
    fogColor: string;
}

export default memo(function WorldEnvironment({ decorations, fogColor }: WorldEnvironmentProps) {
    // Group decorations by type
    const groups = useMemo(() => {
        const whiteStripes: ParkingDecoration[] = [];
        const greyStripes: ParkingDecoration[] = [];
        const roadDashes: ParkingDecoration[] = [];
        const roadSurfaces: ParkingDecoration[] = [];
        const bollards: ParkingDecoration[] = [];
        const tireStops: ParkingDecoration[] = [];
        const trafficCones: ParkingDecoration[] = [];
        const directionArrows: ParkingDecoration[] = [];
        const overheadLamps: ParkingDecoration[] = [];
        const curbs: ParkingDecoration[] = [];

        for (const d of decorations) {
            switch (d.type) {
                case 'parkingStripe':
                    if (d.color === '#555566') greyStripes.push(d);
                    else whiteStripes.push(d);
                    break;
                case 'roadDash': roadDashes.push(d); break;
                case 'roadSurface': roadSurfaces.push(d); break;
                case 'bollard': bollards.push(d); break;
                case 'tireStop': tireStops.push(d); break;
                case 'trafficCone': trafficCones.push(d); break;
                case 'directionArrow': directionArrows.push(d); break;
                case 'overheadLamp': overheadLamps.push(d); break;
                case 'curb': curbs.push(d); break;
            }
        }

        return {
            whiteStripes, greyStripes, roadDashes, roadSurfaces,
            bollards, tireStops, trafficCones, directionArrows,
            overheadLamps, curbs,
        };
    }, [decorations]);

    // Geometries & materials (created once)
    const geos = useMemo(() => createGeometries(), []);
    const arrowGeo = useMemo(() => createArrowGeometry(), []);
    const mats = useMemo(() => createMaterials(), []);

    // Refs
    const whiteStripeRef = useRef<THREE.InstancedMesh>(null);
    const greyStripeRef = useRef<THREE.InstancedMesh>(null);
    const roadDashRef = useRef<THREE.InstancedMesh>(null);
    const roadSurfaceRef = useRef<THREE.InstancedMesh>(null);
    const bollardRef = useRef<THREE.InstancedMesh>(null);
    const tireStopRef = useRef<THREE.InstancedMesh>(null);
    const trafficConeRef = useRef<THREE.InstancedMesh>(null);
    const arrowRef = useRef<THREE.InstancedMesh>(null);
    const lampPoleRef = useRef<THREE.InstancedMesh>(null);
    const lampHeadRef = useRef<THREE.InstancedMesh>(null);
    const curbRef = useRef<THREE.InstancedMesh>(null);

    // Set up instances
    useEffect(() => {
        setupInstances(whiteStripeRef, groups.whiteStripes);
        setupInstances(greyStripeRef, groups.greyStripes);
        setupInstances(roadDashRef, groups.roadDashes);
        setupInstances(bollardRef, groups.bollards);
        setupInstances(tireStopRef, groups.tireStops);
        setupInstances(trafficConeRef, groups.trafficCones);
        setupInstances(arrowRef, groups.directionArrows);
        setupInstances(curbRef, groups.curbs);

        // Road surfaces (rotated flat)
        if (roadSurfaceRef.current && groups.roadSurfaces.length > 0) {
            for (let i = 0; i < groups.roadSurfaces.length; i++) {
                const d = groups.roadSurfaces[i];
                _e.set(-Math.PI / 2, d.rotation, 0);
                _q.setFromEuler(_e);
                _p.set(d.position[0], d.position[1], d.position[2]);
                _s.set(d.scale[0], 1, d.scale[2]);
                _m.compose(_p, _q, _s);
                roadSurfaceRef.current.setMatrixAt(i, _m);
            }
            roadSurfaceRef.current.instanceMatrix.needsUpdate = true;
        }

        // Lamp poles & heads
        if (lampPoleRef.current && lampHeadRef.current && groups.overheadLamps.length > 0) {
            for (let i = 0; i < groups.overheadLamps.length; i++) {
                const d = groups.overheadLamps[i];
                _q.identity();
                _s.set(1, 1, 1);

                // Pole
                _p.set(d.position[0], 3, d.position[2]);
                _m.compose(_p, _q, _s);
                lampPoleRef.current.setMatrixAt(i, _m);

                // Head
                _p.set(d.position[0], 5.95, d.position[2]);
                _m.compose(_p, _q, _s);
                lampHeadRef.current.setMatrixAt(i, _m);
            }
            lampPoleRef.current.instanceMatrix.needsUpdate = true;
            lampHeadRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [groups]);

    // Animate traffic cone reflective bands
    const coneRef = useRef<THREE.InstancedMesh>(null);

    // Dispose on unmount
    useEffect(() => {
        return () => {
            Object.values(geos).forEach((g) => g.dispose());
            arrowGeo.dispose();
            Object.values(mats).forEach((m) => m.dispose());
        };
    }, [geos, arrowGeo, mats]);

    return (
        <>
            {/* White parking stripes */}
            {groups.whiteStripes.length > 0 && (
                <instancedMesh
                    ref={whiteStripeRef}
                    args={[geos.stripe, mats.whiteStripe, groups.whiteStripes.length]}
                    frustumCulled={false}
                />
            )}

            {/* Grey row lines */}
            {groups.greyStripes.length > 0 && (
                <instancedMesh
                    ref={greyStripeRef}
                    args={[geos.stripe, mats.greyStripe, groups.greyStripes.length]}
                    frustumCulled={false}
                />
            )}

            {/* Road surfaces */}
            {groups.roadSurfaces.length > 0 && (
                <instancedMesh
                    ref={roadSurfaceRef}
                    args={[geos.roadSurface, mats.roadSurface, groups.roadSurfaces.length]}
                    frustumCulled={false}
                />
            )}

            {/* Road center dashes (yellow) */}
            {groups.roadDashes.length > 0 && (
                <instancedMesh
                    ref={roadDashRef}
                    args={[geos.roadDash, mats.yellowDash, groups.roadDashes.length]}
                    frustumCulled={false}
                />
            )}

            {/* Bollards */}
            {groups.bollards.length > 0 && (
                <instancedMesh
                    ref={bollardRef}
                    args={[geos.bollard, mats.bollard, groups.bollards.length]}
                />
            )}

            {/* Tire stops */}
            {groups.tireStops.length > 0 && (
                <instancedMesh
                    ref={tireStopRef}
                    args={[geos.tireStop, mats.tireStop, groups.tireStops.length]}
                />
            )}

            {/* Traffic cones */}
            {groups.trafficCones.length > 0 && (
                <instancedMesh
                    ref={trafficConeRef}
                    args={[geos.trafficCone, mats.trafficCone, groups.trafficCones.length]}
                />
            )}

            {/* Direction arrows */}
            {groups.directionArrows.length > 0 && (
                <instancedMesh
                    ref={arrowRef}
                    args={[arrowGeo, mats.directionArrow, groups.directionArrows.length]}
                    frustumCulled={false}
                />
            )}

            {/* Overhead lamp poles */}
            {groups.overheadLamps.length > 0 && (
                <>
                    <instancedMesh
                        ref={lampPoleRef}
                        args={[geos.overheadLampPole, mats.lampPole, groups.overheadLamps.length]}
                    />
                    <instancedMesh
                        ref={lampHeadRef}
                        args={[geos.overheadLampHead, mats.lampHead, groups.overheadLamps.length]}
                    />
                </>
            )}

            {/* Curbs */}
            {groups.curbs.length > 0 && (
                <instancedMesh
                    ref={curbRef}
                    args={[geos.curb, mats.curb, groups.curbs.length]}
                />
            )}
        </>
    );
});
