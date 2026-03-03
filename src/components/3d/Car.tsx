import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { CarProps } from '@/types/car';
import { getCarDimensions } from '@/lib/repoToCar';

interface CarMeshProps {
  car: CarProps;
  position: [number, number, number];
  onClick?: () => void;
}

export function CarMesh({ car, position, onClick }: CarMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [w, h, d] = getCarDimensions(car.size);

  const bodyColor = useMemo(() => {
    const color = new THREE.Color(car.color);
    if (car.isDusty) {
      color.lerp(new THREE.Color('#665544'), 0.4);
    }
    return color;
  }, [car.color, car.isDusty]);

  const rotation: [number, number, number] = car.isCrooked
    ? [0, (Math.random() - 0.5) * 0.15, 0]
    : [0, 0, 0];

  if (car.isCovered) {
    return (
      <group ref={groupRef} position={position} rotation={rotation} onClick={onClick}>
        <mesh position={[0, h * 0.4, 0]} castShadow>
          <boxGeometry args={[w + 0.1, h * 0.8, d + 0.1]} />
          <meshStandardMaterial color="#555566" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation} onClick={onClick}>
      {/* Body */}
      <mesh position={[0, h * 0.3, 0]} castShadow>
        <boxGeometry args={[w, h * 0.6, d]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={car.isDusty ? 0.1 : 0.4}
          roughness={car.isDusty ? 0.9 : 0.3}
        />
      </mesh>

      {/* Roof / Cabin */}
      <mesh position={[0, h * 0.75, -d * 0.05]} castShadow>
        <boxGeometry args={[w * 0.8, h * 0.45, d * 0.55]} />
        <meshStandardMaterial
          color={bodyColor}
          metalness={car.isDusty ? 0.05 : 0.3}
          roughness={car.isDusty ? 0.95 : 0.4}
        />
      </mesh>

      {/* Windshield front */}
      <mesh position={[0, h * 0.65, d * 0.22]}>
        <planeGeometry args={[w * 0.7, h * 0.35]} />
        <meshStandardMaterial color="#aaddff" transparent opacity={0.5} metalness={0.8} />
      </mesh>

      {/* Wheels */}
      {[
        [-w * 0.45, 0.1, d * 0.3],
        [w * 0.45, 0.1, d * 0.3],
        [-w * 0.45, 0.1, -d * 0.3],
        [w * 0.45, 0.1, -d * 0.3],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 8]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      ))}

      {/* Headlights */}
      {!car.isDusty && (
        <>
          <mesh position={[-w * 0.3, h * 0.3, d * 0.51]}>
            <boxGeometry args={[0.15, 0.1, 0.02]} />
            <meshStandardMaterial color="#ffffaa" emissive="#ffffaa" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[w * 0.3, h * 0.3, d * 0.51]}>
            <boxGeometry args={[0.15, 0.1, 0.02]} />
            <meshStandardMaterial color="#ffffaa" emissive="#ffffaa" emissiveIntensity={0.3} />
          </mesh>
        </>
      )}

      {/* Star stickers on windshield */}
      {car.stars > 0 && (
        <mesh position={[0, h * 0.9, -d * 0.05]}>
          <boxGeometry args={[Math.min(car.stars * 0.08, w * 0.6), 0.05, 0.05]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}
