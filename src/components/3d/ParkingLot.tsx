import { useState, useMemo, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CarProps } from '@/types/car';
import InstancedCars, { PositionedCar } from './InstancedCars';
import LotEnvironment from './LotEnvironment';
import { LotSign } from './LotSign';
import CarPanel from './CarPanel';

// ─── Layout Constants ────────────────────────────────────────

const COLS = 6;
const SPACE_W = 3.0;
const SPACE_D = 5.0;
const ROW_GAP = 2.2;
const FOG_COLOR = '#0a0a14';

// ─── Deterministic fork rotation (seeded from repo.id) ──────

function forkRotation(id: number): number {
  return ((id % 97) / 97 - 0.5) * 0.18;
}

// ─── Camera Fly-To ──────────────────────────────────────────

const _lerpTarget = new THREE.Vector3();
const _lerpCam = new THREE.Vector3();
const _defaultTarget = new THREE.Vector3();

function CameraController({
  focusTarget,
  lotCenter,
  controlsRef,
}: {
  focusTarget: [number, number, number] | null;
  lotCenter: [number, number, number];
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const phase = useRef<'idle' | 'focusing' | 'returning'>('idle');
  const lerpSpeed = useRef(0);

  _defaultTarget.set(lotCenter[0], lotCenter[1], lotCenter[2]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (focusTarget) {
      if (phase.current !== 'focusing') {
        phase.current = 'focusing';
        lerpSpeed.current = 0;
      }

      // Smooth acceleration
      lerpSpeed.current = Math.min(lerpSpeed.current + 0.003, 0.06);

      // Target = car position slightly raised
      _lerpTarget.set(focusTarget[0], 0.4, focusTarget[2]);
      // Camera = positioned above-right of car
      _lerpCam.set(focusTarget[0] + 3, 5, focusTarget[2] + 7);

      controls.target.lerp(_lerpTarget, lerpSpeed.current);
      camera.position.lerp(_lerpCam, lerpSpeed.current);
      controls.update();
    } else if (phase.current === 'focusing') {
      // Return to overview
      phase.current = 'returning';
      lerpSpeed.current = 0;
    }

    if (phase.current === 'returning') {
      lerpSpeed.current = Math.min(lerpSpeed.current + 0.002, 0.04);
      controls.target.lerp(_defaultTarget, lerpSpeed.current);
      _lerpCam.set(0, 22, 20);
      camera.position.lerp(_lerpCam, lerpSpeed.current);
      controls.update();

      // Done returning when close
      if (controls.target.distanceTo(_defaultTarget) < 0.3) {
        phase.current = 'idle';
      }
    }
  });

  return null;
}

// ─── Scene Content ──────────────────────────────────────────

function SceneContent({
  positionedCars,
  username,
  rows,
  selectedCar,
  onCarClick,
  controlsRef,
  focusTarget,
}: {
  positionedCars: PositionedCar[];
  username: string;
  rows: number;
  selectedCar: CarProps | null;
  onCarClick: (car: PositionedCar) => void;
  controlsRef: React.RefObject<any>;
  focusTarget: [number, number, number] | null;
}) {
  const lotDepth = rows * (SPACE_D + ROW_GAP);
  const lotCenter: [number, number, number] = [0, 0, -lotDepth / 4];

  return (
    <>
      {/* Atmospheric Lighting */}
      <ambientLight intensity={0.15} color="#8888aa" />
      <hemisphereLight args={['#1a1a3e', '#0a0a14', 0.25]} />
      <directionalLight position={[8, 15, 6]} intensity={0.3} color="#8899bb" castShadow />

      {/* Fog */}
      <fog attach="fog" args={[FOG_COLOR, 25, 80]} />

      {/* Lot sign */}
      <LotSign username={username} position={[0, 0, 8]} />

      {/* Environment */}
      <LotEnvironment rows={rows} cols={COLS} spaceW={SPACE_W} spaceD={SPACE_D} rowGap={ROW_GAP} />

      {/* Instanced cars */}
      <InstancedCars
        cars={positionedCars}
        focusedCarId={selectedCar?.id ?? null}
        onCarClick={onCarClick}
        fogColor={FOG_COLOR}
        fogNear={25}
        fogFar={80}
      />

      {/* Star bars */}
      {positionedCars
        .filter((c) => c.stars > 0 && !c.isCovered)
        .map((car) => (
          <mesh key={`star-${car.id}`} position={[car.slotX, 1.0, car.slotZ]}>
            <boxGeometry args={[Math.min(car.stars * 0.06, 0.8), 0.04, 0.04]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.6} />
          </mesh>
        ))}

      {/* Camera controller */}
      <CameraController
        focusTarget={focusTarget}
        lotCenter={lotCenter}
        controlsRef={controlsRef}
      />

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        minPolarAngle={Math.PI / 9}
        maxPolarAngle={Math.PI * 0.42}
        minDistance={6}
        maxDistance={65}
        enableDamping
        dampingFactor={0.06}
        target={lotCenter}
      />
    </>
  );
}

// ─── Main ParkingLot ─────────────────────────────────────────

interface ParkingLotProps {
  cars: CarProps[];
  username: string;
}

export function ParkingLot({ cars, username }: ParkingLotProps) {
  const [selectedCar, setSelectedCar] = useState<PositionedCar | null>(null);
  const controlsRef = useRef<any>(null);

  const sortedCars = useMemo(() => {
    const pinned = cars.filter((c) => c.isPinned);
    const rest = cars.filter((c) => !c.isPinned);
    return [...pinned, ...rest];
  }, [cars]);

  const positionedCars: PositionedCar[] = useMemo(() => {
    const halfCols = (COLS - 1) / 2;
    return sortedCars.map((car, i) => ({
      ...car,
      slotX: (i % COLS - halfCols) * SPACE_W,
      slotZ: -(Math.floor(i / COLS) * (SPACE_D + ROW_GAP)),
      yRot: car.isCrooked ? forkRotation(car.id) : 0,
    }));
  }, [sortedCars]);

  const rows = Math.ceil(sortedCars.length / COLS);

  const focusTarget = useMemo<[number, number, number] | null>(
    () => (selectedCar ? [selectedCar.slotX, 0.5, selectedCar.slotZ] : null),
    [selectedCar],
  );

  const handleCarClick = useCallback((car: PositionedCar) => {
    setSelectedCar((prev) => (prev?.id === car.id ? null : car));
  }, []);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 22, 20], fov: 48 }}
        shadows
        style={{ background: FOG_COLOR }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        onPointerMissed={() => setSelectedCar(null)}
      >
        <Suspense fallback={null}>
          <SceneContent
            positionedCars={positionedCars}
            username={username}
            rows={rows}
            selectedCar={selectedCar}
            onCarClick={handleCarClick}
            controlsRef={controlsRef}
            focusTarget={focusTarget}
          />
        </Suspense>
      </Canvas>

      {/* Slide-in panel */}
      <CarPanel car={selectedCar} onClose={() => setSelectedCar(null)} />
    </div>
  );
}
