import { useMemo } from 'react';
import * as THREE from 'three';

interface LotSignProps {
  username: string;
  position?: [number, number, number];
}

export function LotSign({ username, position = [0, 0, 0] }: LotSignProps) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 512, 128);

    // Border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 120);

    // Text
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${username}'s Parking Lot`, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [username]);

  return (
    <group position={position}>
      {/* Post left */}
      <mesh position={[-3, 1.5, 0]}>
        <boxGeometry args={[0.15, 3, 0.15]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      {/* Post right */}
      <mesh position={[3, 1.5, 0]}>
        <boxGeometry args={[0.15, 3, 0.15]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      {/* Sign board */}
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[6.5, 1.6, 0.2]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Sign face */}
      <mesh position={[0, 3.2, 0.11]}>
        <planeGeometry args={[6.2, 1.4]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
}
