/**
 * Streak Flame Component
 * 3D flame effect that appears above cars with active streaks
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StreakFlameProps {
  position: [number, number, number];
  streak: number;
}

export default function StreakFlame({ position, streak }: StreakFlameProps) {
  const flameRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Determine flame properties based on streak length
  const getFlameProps = (streak: number) => {
    if (streak >= 100) {
      return { 
        color: '#FF00FF', 
        emissive: '#FF00FF', 
        intensity: 1.5, 
        scale: 0.4,
        speed: 0.08 
      };
    } else if (streak >= 30) {
      return { 
        color: '#FF4500', 
        emissive: '#FF4500', 
        intensity: 1.2, 
        scale: 0.35,
        speed: 0.06 
      };
    } else if (streak >= 7) {
      return { 
        color: '#FFA500', 
        emissive: '#FFA500', 
        intensity: 1.0, 
        scale: 0.3,
        speed: 0.05 
      };
    } else {
      return { 
        color: '#FFD700', 
        emissive: '#FFD700', 
        intensity: 0.8, 
        scale: 0.25,
        speed: 0.04 
      };
    }
  };

  const flameProps = getFlameProps(streak);

  // Animate flame
  useFrame((state) => {
    if (flameRef.current) {
      const time = state.clock.elapsedTime;
      // Flicker effect
      flameRef.current.scale.y = 1 + Math.sin(time * 10 * flameProps.speed) * 0.2;
      flameRef.current.scale.x = 1 + Math.sin(time * 8 * flameProps.speed) * 0.15;
      flameRef.current.scale.z = 1 + Math.sin(time * 8 * flameProps.speed) * 0.15;
      
      // Slight rotation
      flameRef.current.rotation.y = Math.sin(time * 2 * flameProps.speed) * 0.1;
    }

    if (glowRef.current) {
      const time = state.clock.elapsedTime;
      // Pulsing glow
      const pulse = 0.5 + Math.sin(time * 3 * flameProps.speed) * 0.3;
      glowRef.current.scale.setScalar(1 + pulse * 0.3);
    }
  });

  return (
    <group position={position}>
      {/* Main flame */}
      <mesh ref={flameRef} position={[0, 0.8, 0]}>
        <coneGeometry args={[flameProps.scale, flameProps.scale * 2, 8]} />
        <meshStandardMaterial
          color={flameProps.color}
          emissive={flameProps.emissive}
          emissiveIntensity={flameProps.intensity}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Glow sphere */}
      <mesh ref={glowRef} position={[0, 0.6, 0]}>
        <sphereGeometry args={[flameProps.scale * 0.8, 16, 16]} />
        <meshStandardMaterial
          color={flameProps.color}
          emissive={flameProps.emissive}
          emissiveIntensity={flameProps.intensity * 1.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Point light for illumination */}
      <pointLight
        position={[0, 0.8, 0]}
        color={flameProps.color}
        intensity={flameProps.intensity * 2}
        distance={3}
        decay={2}
      />
    </group>
  );
}
