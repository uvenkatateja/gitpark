/**
 * Section Wall Component
 * Creates a 3D brick wall around each user's parking section
 */

import { useMemo } from 'react';
import * as THREE from 'three';

interface SectionWallProps {
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  theme: any;
}

export default function SectionWall({ centerX, centerZ, width, depth, theme }: SectionWallProps) {
  const wallData = useMemo(() => {
    const wallHeight = 2.5;
    const brickWidth = 1.5;
    const brickHeight = 0.6;
    const brickDepth = 0.4;

    // Calculate wall boundaries
    const minX = centerX - width / 2;
    const maxX = centerX + width / 2;
    const minZ = centerZ - depth / 2;
    const maxZ = centerZ + depth / 2;

    const bricks: Array<{ position: [number, number, number]; size: [number, number, number] }> = [];

    // Helper to add bricks along a wall segment
    const addWallBricks = (
      startX: number,
      startZ: number,
      endX: number,
      endZ: number,
      isHorizontal: boolean
    ) => {
      const length = isHorizontal ? Math.abs(endX - startX) : Math.abs(endZ - startZ);
      const numBricksPerRow = Math.ceil(length / brickWidth);
      const numRows = Math.ceil(wallHeight / brickHeight);

      for (let row = 0; row < numRows; row++) {
        const y = row * brickHeight + brickHeight / 2;
        const offset = (row % 2) * (brickWidth / 2); // Stagger bricks

        for (let i = 0; i < numBricksPerRow; i++) {
          const progress = (i * brickWidth + offset) / length;
          
          if (isHorizontal) {
            const x = startX + (endX - startX) * progress;
            bricks.push({
              position: [x, y, startZ],
              size: [brickWidth * 0.95, brickHeight * 0.95, brickDepth],
            });
          } else {
            const z = startZ + (endZ - startZ) * progress;
            bricks.push({
              position: [startX, y, z],
              size: [brickDepth, brickHeight * 0.95, brickWidth * 0.95],
            });
          }
        }
      }
    };

    // Build four walls
    addWallBricks(minX, minZ, maxX, minZ, true);  // Front wall
    addWallBricks(minX, maxZ, maxX, maxZ, true);  // Back wall
    addWallBricks(minX, minZ, minX, maxZ, false); // Left wall
    addWallBricks(maxX, minZ, maxX, maxZ, false); // Right wall

    return { bricks, minX, maxX, minZ, maxZ };
  }, [centerX, centerZ, width, depth]);

  // Create brick colors with variation
  const brickColors = useMemo(() => {
    const baseColor = new THREE.Color(theme.wall?.brickColor || '#8B4513');
    return wallData.bricks.map(() => {
      const variation = 0.85 + Math.random() * 0.3;
      return baseColor.clone().multiplyScalar(variation);
    });
  }, [wallData.bricks.length, theme.wall?.brickColor]);

  return (
    <group>
      {/* Individual bricks */}
      {wallData.bricks.map((brick, i) => (
        <mesh
          key={i}
          position={brick.position}
          castShadow
          receiveShadow
        >
          <boxGeometry args={brick.size} />
          <meshStandardMaterial
            color={brickColors[i]}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Ground foundation under walls */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.02, centerZ]}
        receiveShadow
      >
        <planeGeometry args={[width + 1.5, depth + 1.5]} />
        <meshStandardMaterial
          color={theme.wall?.foundationColor || '#3a3a3a'}
          roughness={0.95}
          opacity={0.6}
          transparent
        />
      </mesh>
    </group>
  );
}
