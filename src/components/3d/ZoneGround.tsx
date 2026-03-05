/**
 * Zone Ground Component
 * Renders colored ground planes for parking zones
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { ParkingZone } from '@/lib/parkingZones';

interface ZoneGroundProps {
  zone: ParkingZone;
  theme: any;
}

export default function ZoneGround({ zone, theme }: ZoneGroundProps) {
  const { bounds, groundColor, borderColor, emissiveColor } = zone;
  
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;

  // Create gradient texture
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create radial gradient
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, groundColor);
    gradient.addColorStop(1, borderColor);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }, [groundColor, borderColor]);

  return (
    <group>
      {/* Main zone ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.001, centerZ]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          map={texture}
          emissive={emissiveColor}
          emissiveIntensity={0.1}
          roughness={0.95}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Border glow */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.002, centerZ]}
      >
        <planeGeometry args={[width + 2, depth + 2]} />
        <meshStandardMaterial
          color={borderColor}
          emissive={emissiveColor}
          emissiveIntensity={0.2}
          roughness={0.9}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Corner markers */}
      {[
        [bounds.minX, bounds.minZ],
        [bounds.maxX, bounds.minZ],
        [bounds.minX, bounds.maxZ],
        [bounds.maxX, bounds.maxZ],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.5, z]}>
          <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
          <meshStandardMaterial
            color={zone.color}
            emissive={emissiveColor}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
