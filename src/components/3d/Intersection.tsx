/**
 * Intersection Component
 * Renders road intersections
 */

import type { Intersection as IntersectionType } from '@/lib/roadNetwork';

interface IntersectionProps {
  intersection: IntersectionType;
}

export default function Intersection({ intersection }: IntersectionProps) {
  const { position, size } = intersection;
  
  // Safety check: ensure valid coordinates
  if (!isFinite(position.x) || !isFinite(position.z) || !isFinite(size) || size <= 0) {
    console.warn('Intersection has invalid coordinates:', intersection);
    return null;
  }
  
  return (
    <group position={[position.x, 0, position.z]}>
      {/* Intersection surface */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Crosswalk lines (optional) */}
      {/* Top crosswalk */}
      <mesh position={[0, 0.02, -size / 2 + 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 0.6, 0.3]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Bottom crosswalk */}
      <mesh position={[0, 0.02, size / 2 - 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 0.6, 0.3]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Left crosswalk */}
      <mesh position={[-size / 2 + 1, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[size * 0.6, 0.3]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Right crosswalk */}
      <mesh position={[size / 2 - 1, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[size * 0.6, 0.3]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
}
