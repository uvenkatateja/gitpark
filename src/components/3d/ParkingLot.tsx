import { useState, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CarProps } from '@/types/car';
import { CarMesh } from './Car';
import { ParkingSpace } from './ParkingSpace';
import { LotSign } from './LotSign';
import { CarPopup } from './CarPopup';

interface ParkingLotProps {
  cars: CarProps[];
  username: string;
}

const COLS = 6;
const SPACE_W = 2.8;
const SPACE_D = 4.8;
const ROW_GAP = 2;

export function ParkingLot({ cars, username }: ParkingLotProps) {
  const [selectedCar, setSelectedCar] = useState<CarProps | null>(null);

  const sortedCars = useMemo(() => {
    const pinned = cars.filter((c) => c.isPinned);
    const rest = cars.filter((c) => !c.isPinned);
    return [...pinned, ...rest];
  }, [cars]);

  const lotWidth = COLS * SPACE_W;
  const rows = Math.ceil(sortedCars.length / COLS);
  const lotDepth = rows * (SPACE_D + ROW_GAP);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 25, 20], fov: 50 }}
        shadows
        style={{ background: '#0d0d1a' }}
        onPointerMissed={() => setSelectedCar(null)}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
          <pointLight position={[-10, 15, -10]} intensity={0.3} color="#4488ff" />

          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -lotDepth / 2 + 4]} receiveShadow>
            <planeGeometry args={[lotWidth + 12, lotDepth + 16]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.95} />
          </mesh>

          {/* Lot sign */}
          <LotSign username={username} position={[0, 0, 6]} />

          {/* Cars and spaces */}
          {sortedCars.map((car, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = (col - (COLS - 1) / 2) * SPACE_W;
            const z = -(row * (SPACE_D + ROW_GAP));

            return (
              <group key={car.id}>
                <ParkingSpace position={[x, 0, z]} isReserved={car.isPinned} />
                <CarMesh
                  car={car}
                  position={[x, 0, z]}
                  onClick={() => setSelectedCar(car)}
                />
              </group>
            );
          })}

          <OrbitControls
            minPolarAngle={Math.PI / 9}
            maxPolarAngle={Math.PI * 0.42}
            minDistance={8}
            maxDistance={60}
            enableDamping
            dampingFactor={0.05}
            target={[0, 0, -lotDepth / 4]}
          />
        </Suspense>
      </Canvas>

      {selectedCar && <CarPopup car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  );
}
