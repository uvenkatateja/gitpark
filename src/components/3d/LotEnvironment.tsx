import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface LotEnvironmentProps {
    rows: number;
    cols: number;
    spaceW: number;
    spaceD: number;
    rowGap: number;
}

// ─── Parking Lines (instanced thin planes) ──────────────────

function ParkingLines({ rows, cols, spaceW, spaceD, rowGap }: LotEnvironmentProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const count = useMemo(() => {
        // Each space has 3 lines (left, right, bottom) → but shared edges
        // We'll draw: (cols+1) vertical lines per row + 1 horizontal line per row
        return rows * (cols + 1) + rows;
    }, [rows, cols]);

    const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
    const mat = useMemo(
        () => new THREE.MeshBasicMaterial({ color: '#cccccc', transparent: true, opacity: 0.35 }),
        [],
    );

    const _m = useMemo(() => new THREE.Matrix4(), []);

    // Set matrices
    useMemo(() => {
        if (!meshRef.current) return;
        const mesh = meshRef.current;
        let idx = 0;
        const halfCols = (cols - 1) / 2;

        for (let r = 0; r < rows; r++) {
            const z = -(r * (spaceD + rowGap));

            // Vertical lines (cols + 1)
            for (let c = 0; c <= cols; c++) {
                const x = (c - halfCols - 0.5) * spaceW;
                _m.makeRotationX(-Math.PI / 2);
                _m.scale(new THREE.Vector3(0.06, spaceD, 1));
                _m.setPosition(x, 0.015, z);
                mesh.setMatrixAt(idx++, _m);
            }

            // Horizontal bottom line
            _m.makeRotationX(-Math.PI / 2);
            _m.scale(new THREE.Vector3(cols * spaceW, 0.06, 1));
            _m.setPosition(0, 0.015, z - spaceD / 2);
            mesh.setMatrixAt(idx++, _m);
        }

        mesh.instanceMatrix.needsUpdate = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, cols, spaceW, spaceD, rowGap, meshRef.current]);

    return <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false} />;
}

// ─── Lamp Post ──────────────────────────────────────────────

function LampPost({ position }: { position: [number, number, number] }) {
    const flickerRef = useRef<THREE.PointLight>(null);

    useFrame(({ clock }) => {
        if (flickerRef.current) {
            // Subtle flicker
            flickerRef.current.intensity = 0.8 + Math.sin(clock.elapsedTime * 8 + position[0]) * 0.05;
        }
    });

    return (
        <group position={position}>
            {/* Pole */}
            <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 5, 6]} />
                <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* Arm */}
            <mesh position={[0.4, 4.9, 0]} rotation={[0, 0, Math.PI / 6]}>
                <cylinderGeometry args={[0.03, 0.03, 1, 4]} />
                <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* Light housing */}
            <mesh position={[0.7, 4.8, 0]}>
                <boxGeometry args={[0.5, 0.12, 0.25]} />
                <meshStandardMaterial color="#444450" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Light surface (emissive) */}
            <mesh position={[0.7, 4.73, 0]}>
                <boxGeometry args={[0.45, 0.03, 0.2]} />
                <meshStandardMaterial
                    color="#ffeecc"
                    emissive="#ffddaa"
                    emissiveIntensity={2}
                />
            </mesh>
            {/* Point light */}
            <pointLight
                ref={flickerRef}
                position={[0.7, 4.5, 0]}
                color="#ffeedd"
                intensity={0.8}
                distance={18}
                decay={2}
            />
        </group>
    );
}

// ─── Perimeter Bollards ─────────────────────────────────────

function Bollards({
    lotWidth,
    lotDepth,
    centerZ,
}: {
    lotWidth: number;
    lotDepth: number;
    centerZ: number;
}) {
    const spacing = 3;
    const positions = useMemo(() => {
        const pts: [number, number, number][] = [];
        const hw = lotWidth / 2 + 2;
        const startZ = centerZ + 6;
        const endZ = centerZ - lotDepth - 4;

        // Left and right sides
        for (let z = startZ; z > endZ; z -= spacing) {
            pts.push([-hw, 0, z]);
            pts.push([hw, 0, z]);
        }
        // Back
        for (let x = -hw; x <= hw; x += spacing) {
            pts.push([x, 0, endZ]);
        }
        return pts;
    }, [lotWidth, lotDepth, centerZ]);

    return (
        <group>
            {positions.map((pos, i) => (
                <mesh key={i} position={[pos[0], 0.3, pos[2]]}>
                    <cylinderGeometry args={[0.08, 0.1, 0.6, 6]} />
                    <meshStandardMaterial color="#555566" metalness={0.5} roughness={0.5} />
                </mesh>
            ))}
        </group>
    );
}

// ─── Main LotEnvironment ────────────────────────────────────

export default function LotEnvironment({
    rows,
    cols,
    spaceW,
    spaceD,
    rowGap,
}: LotEnvironmentProps) {
    const lotWidth = cols * spaceW;
    const lotDepth = rows * (spaceD + rowGap);
    const centerZ = -lotDepth / 2 + 4;

    // Lamp positions (around the lot perimeter)
    const lampPositions = useMemo((): [number, number, number][] => {
        const hw = lotWidth / 2 + 3;
        const pts: [number, number, number][] = [];
        const step = Math.max(10, lotDepth / 3);
        for (let z = 4; z > -lotDepth - 2; z -= step) {
            pts.push([-hw, 0, z]);
            pts.push([hw, 0, z]);
        }
        return pts;
    }, [lotWidth, lotDepth]);

    return (
        <group>
            {/* Asphalt ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, centerZ]} receiveShadow>
                <planeGeometry args={[lotWidth + 16, lotDepth + 20]} />
                <meshStandardMaterial color="#111120" roughness={0.95} metalness={0.05} />
            </mesh>

            {/* Subtle road markings (center lane) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, centerZ]}>
                <planeGeometry args={[0.12, lotDepth + 8]} />
                <meshBasicMaterial color="#333344" />
            </mesh>

            {/* Parking lines */}
            <ParkingLines rows={rows} cols={cols} spaceW={spaceW} spaceD={spaceD} rowGap={rowGap} />

            {/* Lamp posts */}
            {lampPositions.map((pos, i) => (
                <LampPost key={i} position={pos} />
            ))}

            {/* Perimeter bollards */}
            <Bollards lotWidth={lotWidth} lotDepth={lotDepth} centerZ={centerZ} />
        </group>
    );
}
