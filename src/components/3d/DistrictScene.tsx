import { useMemo, useRef, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import InstancedCars, { PositionedCar } from './InstancedCars';
import InstancedLabels from './InstancedLabels';
import WorldEnvironment from './WorldEnvironment';
import { LotSign } from './LotSign';
import CarPanel from './CarPanel';
import SectionWall from './DistrictWall';
import ZoneGround from './ZoneGround';
import ZoneLabel from './ZoneLabel';
import type { UserSection } from '@/lib/districtLayout';
import type { DistrictLayoutWithRoads } from '@/lib/districtLayoutWithRoads';
import { generateDecorations } from '@/lib/districtDecorations';
import { useTheme } from '@/lib/useTheme';

// ─── Camera Controller ──────────────────────────────────────

const _lTarget = new THREE.Vector3();
const _lCam = new THREE.Vector3();

function CameraController({
    target,
    controlsRef,
}: {
    target: [number, number, number] | null;
    controlsRef: React.RefObject<any>;
}) {
    const { camera } = useThree();
    const speed = useRef(0);
    const active = useRef(false);

    useFrame(() => {
        const c = controlsRef.current;
        if (!c) return;
        if (!target) { active.current = false; speed.current = 0; return; }

        if (!active.current) { active.current = true; speed.current = 0; }
        speed.current = Math.min(speed.current + 0.002, 0.05);

        _lTarget.set(target[0], 0.3, target[2]);
        _lCam.set(target[0] + 5, 12, target[2] + 18);

        c.target.lerp(_lTarget, speed.current);
        camera.position.lerp(_lCam, speed.current);
        c.update();
    });

    return null;
}

// ─── Section Ground (asphalt pad per user) ──────────────────

function SectionGround({ 
    section, 
    theme, 
    onSectionClick 
}: { 
    section: UserSection; 
    theme: any;
    onSectionClick?: (section: UserSection) => void;
}) {
    const [cx, , cz] = section.center;
    const [hovered, setHovered] = useState(false);

    const handleClick = (e: any) => {
        e.stopPropagation();
        onSectionClick?.(section);
    };

    return (
        <group>
            {/* Main asphalt pad - tight fit to cars - CLICKABLE */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[cx, 0.006, cz]}
                receiveShadow
                onClick={handleClick}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }}
            >
                <planeGeometry args={[section.width, section.depth]} />
                <meshStandardMaterial
                    color={theme.section.asphaltColor}
                    emissive={hovered ? theme.section.borderEmissive : theme.section.asphaltEmissive}
                    emissiveIntensity={hovered ? 0.25 : 0.08}
                    roughness={0.95}
                />
            </mesh>

            {/* Subtle outer glow ring - minimal border */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[cx, 0.004, cz]}
            >
                <planeGeometry args={[section.width + 1, section.depth + 1]} />
                <meshStandardMaterial
                    color={theme.section.borderColor}
                    emissive={theme.section.borderEmissive}
                    emissiveIntensity={hovered ? 0.3 : 0.15}
                    roughness={0.9}
                />
            </mesh>
        </group>
    );
}

// ─── Camera Position Reporter ───────────────────────────────

function CameraReporter({ onMove }: { onMove: (x: number, z: number) => void }) {
    const { camera } = useThree();
    useFrame(() => { onMove(camera.position.x, camera.position.z); });
    return null;
}

// ─── Scene Content ──────────────────────────────────────────

function SceneContent({
    layout,
    decorations,
    selectedCar,
    onCarClick,
    onSectionClick,
    cameraTarget,
    controlsRef,
    onCameraMove,
    theme,
}: {
    layout: DistrictLayoutWithRoads;
    decorations: ReturnType<typeof generateDecorations>;
    selectedCar: PositionedCar | null;
    onCarClick: (car: PositionedCar) => void;
    onSectionClick?: (section: UserSection) => void;
    cameraTarget: [number, number, number] | null;
    controlsRef: React.RefObject<any>;
    onCameraMove?: (x: number, z: number) => void;
    theme: any;
}) {
    const { bounds } = layout;
    
    // Ground extends well beyond the sections so the world feels infinite
    const groundW = Math.max(200, (bounds.maxX - bounds.minX) * 2.5 + 80);
    const groundD = Math.max(200, (bounds.maxZ - bounds.minZ) * 2.5 + 80);
    const groundCX = (bounds.minX + bounds.maxX) / 2;
    const groundCZ = (bounds.minZ + bounds.maxZ) / 2;

    // Debug: Log layout data
    console.log('[DistrictScene] Rendering layout:', {
        sections: layout.sections.length,
        cars: layout.allCars.length,
        zones: layout.zones.length,
        bounds: layout.bounds,
        center: layout.center,
    });

    return (
        <>
            {/* DEBUG HELPERS - Remove after fixing */}
            <axesHelper args={[100]} />
            <gridHelper args={[500, 50, '#ff0000', '#00ff00']} position={[0, 0.1, 0]} />
            
            {/* ─── Lighting (theme-based) ────────────────────── */}
            <ambientLight 
                intensity={theme.lighting.ambient.intensity} 
                color={theme.lighting.ambient.color} 
            />
            <hemisphereLight 
                args={[
                    theme.lighting.hemisphere.skyColor, 
                    theme.lighting.hemisphere.groundColor, 
                    theme.lighting.hemisphere.intensity
                ]} 
            />
            <directionalLight 
                position={theme.lighting.directional.position} 
                intensity={theme.lighting.directional.intensity} 
                color={theme.lighting.directional.color} 
            />

            {/* ─── Fog (theme-based) ─────────────────────────── */}
            <fog attach="fog" args={[theme.fog.color, theme.fog.near, theme.fog.far]} />

            {/* ─── Global ground (infinite asphalt) ──────────── */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[groundCX, -0.03, groundCZ]}>
                <planeGeometry args={[groundW, groundD]} />
                <meshStandardMaterial
                    color={theme.ground.baseColor}
                    emissive={theme.ground.emissive}
                    emissiveIntensity={theme.ground.emissiveIntensity}
                    roughness={0.98}
                />
            </mesh>

            {/* ─── Grid overlay (subtle lane markings) ────────── */}
            <gridHelper
                args={[
                    Math.max(groundW, groundD),
                    Math.floor(Math.max(groundW, groundD) / 4),
                    theme.ground.gridColor1,
                    theme.ground.gridColor2,
                ]}
                position={[groundCX, -0.01, groundCZ]}
            />

            {/* ─── Parking Zones ─────────────────────────────── */}
            {layout.zones.map((zone) => (
                <group key={zone.id}>
                    <ZoneGround zone={zone} theme={theme} />
                    <ZoneLabel zone={zone} />
                </group>
            ))}

            {/* ─── Per-section elements ──────────────────────── */}
            {layout.sections.map((section, idx) => {
                console.log(`[DistrictScene] Section ${idx}:`, {
                    username: section.username,
                    center: section.center,
                    width: section.width,
                    depth: section.depth,
                    cars: section.cars.length,
                });
                
                return (
                    <group key={section.username}>
                        {/* DEBUG: Add a visible marker at section center */}
                        <mesh position={[section.center[0], 2, section.center[2]]}>
                            <boxGeometry args={[2, 4, 2]} />
                            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={1} />
                        </mesh>
                        
                        <SectionGround section={section} theme={theme} onSectionClick={onSectionClick} />
                        <SectionWall
                            centerX={section.center[0]}
                            centerZ={section.center[2]}
                            width={section.width}
                            depth={section.depth}
                            theme={theme}
                        />
                        <LotSign
                            username={section.username}
                            position={[section.center[0], 0, section.center[2] + section.depth / 2 + 3]}
                        />
                    </group>
                );
            })}

            {/* ─── World Decorations (instanced) ─────────────── */}
            <WorldEnvironment decorations={decorations} fogColor={theme.fog.color} />

            {/* ─── ALL cars instanced together ────────────────── */}
            {layout.allCars.length > 0 && (
                <InstancedCars
                    cars={layout.allCars}
                    focusedCarId={selectedCar?.id ?? null}
                    onCarClick={onCarClick}
                    fogColor={theme.fog.color}
                    fogNear={theme.fog.near}
                    fogFar={theme.fog.far}
                />
            )}

            {/* ─── Floating section labels ────────────────────── */}
            <InstancedLabels sections={layout.sections} />

            {/* ─── Star bars (gold bars above starred cars) ───── */}
            {layout.allCars
                .filter((c) => c.stars > 0 && !c.isCovered)
                .map((car) => (
                    <mesh key={`s-${car.id}`} position={[car.slotX, 1.0, car.slotZ]}>
                        <boxGeometry args={[Math.min(car.stars * 0.06, 0.8), 0.04, 0.04]} />
                        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.6} />
                    </mesh>
                ))}

            {/* ─── Camera ─────────────────────────────────────── */}
            <CameraController target={cameraTarget} controlsRef={controlsRef} />
            {onCameraMove && <CameraReporter onMove={onCameraMove} />}

            <OrbitControls
                ref={controlsRef}
                target={[layout.center.x, 0, layout.center.z]}
                minPolarAngle={Math.PI / 12}
                maxPolarAngle={Math.PI * 0.45}
                minDistance={5}
                maxDistance={160}
                enableDamping
                dampingFactor={0.06}
                zoomSpeed={1.2}
            />
        </>
    );
}

// ─── Main Exported Component ─────────────────────────────────

interface DistrictSceneProps {
    layout: DistrictLayoutWithRoads;
    selectedCar: PositionedCar | null;
    onCarClick: (car: PositionedCar) => void;
    onSectionClick?: (section: UserSection) => void;
    onCarClose: () => void;
    onCarCustomize?: (car: PositionedCar) => void;
    cameraTarget: [number, number, number] | null;
    onBackgroundClick: () => void;
    onCameraMove?: (x: number, z: number) => void;
}

export default function DistrictScene({
    layout,
    selectedCar,
    onCarClick,
    onSectionClick,
    onCarClose,
    onCarCustomize,
    cameraTarget,
    onBackgroundClick,
    onCameraMove,
}: DistrictSceneProps) {
    const controlsRef = useRef<any>(null);
    const { currentTheme } = useTheme();

    // Generate decorations from layout (memoized — only recalculates when layout changes)
    const decorations = useMemo(() => generateDecorations(layout), [layout]);

    // Calculate initial camera position based on layout center and bounds
    const initialCameraPos = useMemo(() => {
        const { center, bounds } = layout;
        const width = bounds.maxX - bounds.minX;
        const depth = bounds.maxZ - bounds.minZ;
        const size = Math.max(width, depth, 50); // Minimum size of 50
        
        // Position camera to see the whole district
        const distance = size * 0.8;
        const height = size * 0.6;
        
        return [
            center.x + distance * 0.5,
            height,
            center.z + distance * 0.7
        ] as [number, number, number];
    }, [layout.center.x, layout.center.z, layout.bounds.minX, layout.bounds.maxX, layout.bounds.minZ, layout.bounds.maxZ]);

    return (
        <div className="relative w-full h-full">
            <Canvas
                camera={{ position: initialCameraPos, fov: 50 }}
                shadows
                style={{ background: currentTheme.fog.color }}
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.4,
                }}
                onPointerMissed={onBackgroundClick}
            >
                <Suspense fallback={null}>
                    <SceneContent
                        layout={layout}
                        decorations={decorations}
                        selectedCar={selectedCar}
                        onCarClick={onCarClick}
                        onSectionClick={onSectionClick}
                        cameraTarget={cameraTarget}
                        controlsRef={controlsRef}
                        onCameraMove={onCameraMove}
                        theme={currentTheme}
                    />
                </Suspense>
            </Canvas>

            <CarPanel car={selectedCar} onClose={onCarClose} onCustomize={onCarCustomize} />
        </div>
    );
}
