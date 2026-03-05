/**
 * Lot Entrance Component
 * Renders entrance gate/archway for parking lots
 */

import { Text } from '@react-three/drei';

interface LotEntranceProps {
  position: { x: number; z: number };
  username: string;
  lotWidth: number;
}

export default function LotEntrance({ position, username, lotWidth }: LotEntranceProps) {
  // Safety check: ensure valid coordinates
  if (!isFinite(position.x) || !isFinite(position.z) || !isFinite(lotWidth) || lotWidth <= 0) {
    console.warn('LotEntrance has invalid coordinates:', { position, lotWidth });
    return null;
  }
  
  return (
    <group position={[position.x, 0, position.z]}>
      {/* Left pillar */}
      <mesh position={[-lotWidth / 2 + 2, 2, 0]} castShadow>
        <boxGeometry args={[1, 4, 1]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.7} metalness={0.3} />
      </mesh>
      
      {/* Right pillar */}
      <mesh position={[lotWidth / 2 - 2, 2, 0]} castShadow>
        <boxGeometry args={[1, 4, 1]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.7} metalness={0.3} />
      </mesh>
      
      {/* Top beam */}
      <mesh position={[0, 4, 0]} castShadow>
        <boxGeometry args={[lotWidth - 4, 0.5, 1]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} metalness={0.3} />
      </mesh>
      
      {/* Username sign */}
      <Text
        position={[0, 4.5, 0.6]}
        fontSize={1.5}
        color="#FFD700"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        {username}
      </Text>
      
      {/* Entrance lights */}
      <pointLight
        position={[-lotWidth / 2 + 2, 4, 0]}
        intensity={0.5}
        distance={10}
        color="#FFD700"
      />
      <pointLight
        position={[lotWidth / 2 - 2, 4, 0]}
        intensity={0.5}
        distance={10}
        color="#FFD700"
      />
    </group>
  );
}
