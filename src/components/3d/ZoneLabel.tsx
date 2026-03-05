/**
 * Zone Label Component
 * Floating 3D text labels for parking zones
 */

import { Text } from '@react-three/drei';
import type { ParkingZone } from '@/lib/parkingZones';

interface ZoneLabelProps {
  zone: ParkingZone;
}

export default function ZoneLabel({ zone }: ZoneLabelProps) {
  const [centerX, , centerZ] = zone.center;
  const labelY = 8; // Height above ground

  return (
    <group position={[centerX, labelY, centerZ]}>
      {/* Zone name */}
      <Text
        fontSize={2}
        color={zone.color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.1}
        outlineColor="#000000"
        font="/fonts/Silkscreen-Regular.ttf"
      >
        {zone.name.toUpperCase()}
      </Text>

      {/* Repo count */}
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
        font="/fonts/Silkscreen-Regular.ttf"
      >
        {zone.repos.length} REPOS
      </Text>

      {/* Vertical beam */}
      <mesh position={[0, -labelY / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, labelY, 8]} />
        <meshStandardMaterial
          color={zone.color}
          emissive={zone.emissiveColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={zone.color}
          emissive={zone.emissiveColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Point light */}
      <pointLight
        position={[0, 0, 0]}
        color={zone.color}
        intensity={2}
        distance={15}
        decay={2}
      />
    </group>
  );
}
