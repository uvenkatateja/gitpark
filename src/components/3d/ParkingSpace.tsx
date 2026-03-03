import * as THREE from 'three';

interface ParkingSpaceProps {
  position: [number, number, number];
  isReserved?: boolean;
}

export function ParkingSpace({ position, isReserved }: ParkingSpaceProps) {
  const w = 2.4;
  const d = 4;

  return (
    <group position={position}>
      {/* Left line */}
      <mesh position={[-w / 2, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, d]} />
        <meshStandardMaterial color={isReserved ? '#ffd700' : '#dddddd'} />
      </mesh>
      {/* Right line */}
      <mesh position={[w / 2, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, d]} />
        <meshStandardMaterial color={isReserved ? '#ffd700' : '#dddddd'} />
      </mesh>
      {/* Bottom line */}
      <mesh position={[0, 0.01, -d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, 0.08]} />
        <meshStandardMaterial color={isReserved ? '#ffd700' : '#dddddd'} />
      </mesh>
    </group>
  );
}
