import { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import InstancedCars, { PositionedCar } from './InstancedCars';
import InstancedLabels from './InstancedLabels';
import WorldEnvironment from './WorldEnvironment';
import { LotSign } from './LotSign';
import CarPanel from './CarPanel';
import type { DistrictLayout, UserSection } from '@/lib/districtLayout';
import { generateDecorations } from '@/lib/districtDecorations';
import { SPACE_D, ROW_GAP, SECTION_COLS } from '@/lib/districtLayout';

const FOG_COLOR = '#060610';
const GRID_COLOR_1 = '#0e0e20';
const GRID_COLOR_2 = '#0a0a18';

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

function SectionGround({ section }: { section: UserSection }) {
    const [cx, , cz] = section.center;
    return (
        <group>
            {/* Main asphalt pad - tight fit to cars */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[cx, 0.006, cz]}
                receiveShadow
            >
                <planeGeometry args={[section.width, section.depth]} />
                <meshStandardMaterial
                    color="#0c0c18"
                    emissive="#0c0c18"
                    emissiveIntensity={0.08}
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
                    color="#12122a"
                    emissive="#1a1a40"
                    emissiveIntensity={0.15}
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
    cameraTarget,
    controlsRef,
    onCameraMove,
}: {
    layout: DistrictLayout;
    decorations: ReturnType<typeof generateDecorations>;
    selectedCar: PositionedCar | null;
    onCarClick: (car: PositionedCar) => void;
    cameraTarget: [number, number, number] | null;
    controlsRef: React.RefObject<any>;
    onCameraMove?: (x: number, z: number) => void;
}) {
    const { bounds } = layout;
    // Ground extends well beyond the sections so the world feels infinite
    const groundW = Math.max(200, (bounds.maxX - bounds.minX) * 2.5 + 80);
    const groundD = Math.max(200, (bounds.maxZ - bounds.minZ) * 2.5 + 80);
    const groundCX = (bounds.minX + bounds.maxX) / 2;
    const groundCZ = (bounds.minZ + bounds.maxZ) / 2;

    return (
        <>
            {/* ─── Lighting ──────────────────────────────────── */}
            <ambientLight intensity={0.15} color="#8888aa" />
            <hemisphereLight args={['#1a1a3e', '#050510', 0.25]} />
            <directionalLight position={[20, 40, 15]} intensity={0.3} color="#8899cc" />
            {/* Accent light from below (parking lot glow) */}
            <directionalLight position={[-10, -5, 20]} intensity={0.05} color="#ffd700" />

            {/* ─── Fog ───────────────────────────────────────── */}
            <fog attach="fog" args={[FOG_COLOR, 35, 150]} />

            {/* ─── Global ground (infinite asphalt) ──────────── */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[groundCX, -0.03, groundCZ]}>
                <planeGeometry args={[groundW, groundD]} />
                <meshStandardMaterial
                    color="#050508"
                    emissive="#050508"
                    emissiveIntensity={0.1}
                    roughness={0.98}
                />
            </mesh>

            {/* ─── Grid overlay (subtle lane markings) ────────── */}
            <gridHelper
                args={[
                    Math.max(groundW, groundD),
                    Math.floor(Math.max(groundW, groundD) / 4),
                    GRID_COLOR_1,
                    GRID_COLOR_2,
                ]}
                position={[groundCX, -0.01, groundCZ]}
            />

            {/* ─── Per-section elements ──────────────────────── */}
            {layout.sections.map((section) => (
                <group key={section.username}>
                    <SectionGround section={section} />
                    <LotSign
                        username={section.username}
                        position={[section.center[0], 0, section.center[2] + section.depth / 2 + 3]}
                    />
                </group>
            ))}

            {/* ─── World Decorations (instanced) ─────────────── */}
            <WorldEnvironment decorations={decorations} fogColor={FOG_COLOR} />

            {/* ─── ALL cars instanced together ────────────────── */}
            {layout.allCars.length > 0 && (
                <InstancedCars
                    cars={layout.allCars}
                    focusedCarId={selectedCar?.id ?? null}
                    onCarClick={onCarClick}
                    fogColor={FOG_COLOR}
                    fogNear={35}
                    fogFar={150}
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
    layout: DistrictLayout;
    selectedCar: PositionedCar | null;
    onCarClick: (car: PositionedCar) => void;
    onCarClose: () => void;
    cameraTarget: [number, number, number] | null;
    onBackgroundClick: () => void;
    onCameraMove?: (x: number, z: number) => void;
}

export default function DistrictScene({
    layout,
    selectedCar,
    onCarClick,
    onCarClose,
    cameraTarget,
    onBackgroundClick,
    onCameraMove,
}: DistrictSceneProps) {
    const controlsRef = useRef<any>(null);

    // Generate decorations from layout (memoized — only recalculates when layout changes)
    const decorations = useMemo(() => generateDecorations(layout), [layout]);

    return (
        <div className="relative w-full h-full">
            <Canvas
                camera={{ position: [0, 30, 35], fov: 50 }}
                shadows
                style={{ background: FOG_COLOR }}
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
                        cameraTarget={cameraTarget}
                        controlsRef={controlsRef}
                        onCameraMove={onCameraMove}
                    />
                </Suspense>
            </Canvas>

            <CarPanel car={selectedCar} onClose={onCarClose} />
        </div>
    );
}
