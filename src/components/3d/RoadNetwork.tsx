/**
 * Road Network 3D Component
 * Renders roads, markings, and intersections
 */

import { useMemo } from 'react';
import { useTheme } from '@/lib/useTheme';
import type { RoadNetwork as RoadNetworkType, RoadSegment, RoadMarking } from '@/lib/roadNetwork';
import { getRoadColor, getMarkingColor } from '@/lib/roadNetwork';

interface RoadNetworkProps {
  network: RoadNetworkType;
}

// Road segment component
function Road({ segment, theme }: { segment: RoadSegment; theme: 'light' | 'dark' }) {
  const roadColor = getRoadColor(segment.type, theme);
  
  const length = Math.sqrt(
    Math.pow(segment.end.x - segment.start.x, 2) +
    Math.pow(segment.end.z - segment.start.z, 2)
  );
  
  const angle = Math.atan2(
    segment.end.z - segment.start.z,
    segment.end.x - segment.start.x
  );
  
  const centerX = (segment.start.x + segment.end.x) / 2;
  const centerZ = (segment.start.z + segment.end.z) / 2;
  
  return (
    <group position={[centerX, 0.01, centerZ]} rotation={[0, angle, 0]}>
      {/* Road surface */}
      <mesh receiveShadow>
        <planeGeometry args={[length, segment.width]} />
        <meshStandardMaterial
          color={roadColor}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Road markings */}
      {segment.markings.map((marking, index) => (
        <RoadMarkingLine
          key={index}
          marking={marking}
          length={length}
        />
      ))}
    </group>
  );
}

// Road marking line component
function RoadMarkingLine({ marking, length }: { marking: RoadMarking; length: number }) {
  const color = getMarkingColor(marking.type);
  
  if (marking.dashed) {
    // Dashed line
    const dashLength = 3;
    const gapLength = 3;
    const dashCount = Math.floor(length / (dashLength + gapLength));
    
    return (
      <group position={[0, 0.02, marking.offset]}>
        {Array.from({ length: dashCount }).map((_, i) => {
          const x = -length / 2 + i * (dashLength + gapLength) + dashLength / 2;
          return (
            <mesh key={i} position={[x, 0, 0]}>
              <planeGeometry args={[dashLength, 0.2]} />
              <meshBasicMaterial color={color} />
            </mesh>
          );
        })}
      </group>
    );
  } else {
    // Solid line
    return (
      <mesh position={[0, 0.02, marking.offset]}>
        <planeGeometry args={[length, 0.2]} />
        <meshBasicMaterial color={color} />
      </mesh>
    );
  }
}

// Intersection component
function Intersection({ position, size }: { position: { x: number; z: number }; size: number }) {
  return (
    <mesh position={[position.x, 0.01, position.z]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color="#2a2a2a"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

// Entrance marker component
function EntranceMarker({ position }: { position: { x: number; z: number } }) {
  return (
    <group position={[position.x, 0.5, position.z]}>
      {/* Entrance post */}
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1, 8]} />
        <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Light on top */}
      <pointLight
        position={[0, 0.6, 0]}
        color="#FFD700"
        intensity={0.5}
        distance={5}
      />
    </group>
  );
}

export default function RoadNetwork({ network }: RoadNetworkProps) {
  const { themeId } = useTheme();
  const theme = themeId.includes('dark') || themeId === 'midnight' ? 'dark' : 'light';
  
  return (
    <group>
      {/* Render all roads */}
      {network.roads.map((road) => (
        <Road key={road.id} segment={road} theme={theme} />
      ))}
      
      {/* Render intersections */}
      {network.intersections.map((intersection) => (
        <Intersection
          key={intersection.id}
          position={intersection.position}
          size={intersection.size}
        />
      ))}
      
      {/* Render entrance markers */}
      {network.lotPositions.map((pos) => (
        <EntranceMarker
          key={`entrance-${pos.index}`}
          position={pos.entrance}
        />
      ))}
    </group>
  );
}
