/**
 * Road Component
 * Renders a 3D road with markings
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { Road as RoadType, RoadMarking } from '@/lib/roadNetwork';
import { getRoadMaterial } from '@/lib/roadNetwork';

interface RoadProps {
  road: RoadType;
}

export default function Road({ road }: RoadProps) {
  const { start, end, width, type } = road;
  
  // Safety check: ensure valid coordinates
  if (!isFinite(start.x) || !isFinite(start.z) || !isFinite(end.x) || !isFinite(end.z) || !isFinite(width)) {
    console.warn('Road has invalid coordinates:', road);
    return null;
  }
  
  // Calculate road geometry
  const geometry = useMemo(() => {
    const length = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
    );
    
    // Safety check for length
    if (!isFinite(length) || length <= 0) {
      return new THREE.PlaneGeometry(1, 1); // Fallback
    }
    
    return new THREE.PlaneGeometry(width, length);
  }, [start, end, width]);
  
  // Calculate road position and rotation
  const { position, rotation } = useMemo(() => {
    const centerX = (start.x + end.x) / 2;
    const centerZ = (start.z + end.z) / 2;
    
    const angle = Math.atan2(end.z - start.z, end.x - start.x);
    
    return {
      position: [centerX, 0.01, centerZ] as [number, number, number],
      rotation: [-Math.PI / 2, 0, angle - Math.PI / 2] as [number, number, number],
    };
  }, [start, end]);
  
  const material = getRoadMaterial(type);
  
  return (
    <group>
      {/* Road surface */}
      <mesh
        geometry={geometry}
        position={position}
        rotation={rotation}
        receiveShadow
      >
        <meshStandardMaterial
          color={material.color}
          roughness={material.roughness}
          metalness={material.metalness}
        />
      </mesh>
      
      {/* Road markings */}
      {road.markings.map((marking, index) => (
        <RoadMarking
          key={index}
          marking={marking}
          road={road}
          position={position}
          rotation={rotation}
        />
      ))}
    </group>
  );
}

interface RoadMarkingProps {
  marking: RoadMarking;
  road: RoadType;
  position: [number, number, number];
  rotation: [number, number, number];
}

function RoadMarking({ marking, road, position, rotation }: RoadMarkingProps) {
  const { start, end } = road;
  
  const length = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
  );
  
  if (marking.dashed) {
    // Dashed line
    const dashLength = 2;
    const gapLength = 2;
    const dashCount = Math.floor(length / (dashLength + gapLength));
    
    return (
      <>
        {Array.from({ length: dashCount }).map((_, i) => {
          const offset = i * (dashLength + gapLength) - length / 2 + dashLength / 2;
          
          return (
            <mesh
              key={i}
              position={[
                position[0],
                position[1] + 0.01,
                position[2] + offset,
              ]}
              rotation={rotation}
            >
              <planeGeometry args={[0.2, dashLength]} />
              <meshBasicMaterial color={marking.color} />
            </mesh>
          );
        })}
      </>
    );
  } else {
    // Solid line
    return (
      <mesh
        position={[
          position[0] + marking.offset * Math.cos(rotation[2]),
          position[1] + 0.01,
          position[2] + marking.offset * Math.sin(rotation[2]),
        ]}
        rotation={rotation}
      >
        <planeGeometry args={[0.15, length]} />
        <meshBasicMaterial color={marking.color} />
      </mesh>
    );
  }
}
