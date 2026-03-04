import { useRef, useMemo, useEffect, memo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { CarProps, CarSize } from '@/types/car';
import { createCarGeometry, createCoverGeometry } from '@/lib/carGeometry';

// ─── Shader ──────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  attribute vec3 aVertColor;
  attribute float aTintMask;
  attribute vec3 aInstanceColor;
  attribute float aRise;

  varying vec3 vVertColor;
  varying float vTintMask;
  varying vec3 vInstanceColor;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying float vInstanceId;

  void main() {
    vVertColor = aVertColor;
    vTintMask = aTintMask;
    vInstanceColor = aInstanceColor;
    vInstanceId = float(gl_InstanceID);

    vec3 pos = position;
    pos.y *= aRise;

    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vec4 mvPos = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
    vViewPos = mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFocusedId;
  uniform float uDimOpacity;
  uniform float uHasFocus;

  varying vec3 vVertColor;
  varying float vTintMask;
  varying vec3 vInstanceColor;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying float vInstanceId;

  void main() {
    float fogDepth = length(vViewPos);
    if (fogDepth > uFogFar) discard;

    vec3 base = mix(vVertColor, vVertColor * vInstanceColor, vTintMask);

    // Directional light
    vec3 lightDir = normalize(vec3(0.2, 1.0, 0.4));
    float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.3 + 0.7;
    vec3 color = base * diffuse;

    // Emissive glow for headlights/taillights
    float lum = dot(vVertColor, vec3(0.299, 0.587, 0.114));
    if (vTintMask < 0.05 && lum > 0.7) {
      color += vVertColor * 0.4;
    }

    // Focus / dim — uFocusedId is LOCAL to this InstancedMesh
    float isFocused = step(abs(vInstanceId - uFocusedId), 0.5);
    float dimFactor = mix(1.0, mix(uDimOpacity, 1.0, isFocused), uHasFocus);
    color *= dimFactor;

    // Focused car slight emissive boost
    color += isFocused * uHasFocus * base * 0.15;

    // Fog
    float fog = smoothstep(uFogNear, uFogFar, fogDepth);
    color = mix(color, uFogColor, fog);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Types ───────────────────────────────────────────────────

export interface PositionedCar extends CarProps {
    slotX: number;
    slotZ: number;
    yRot: number;
}

interface SizeGroup {
    size: CarSize;
    cars: PositionedCar[];
}

interface InstancedCarsProps {
    cars: PositionedCar[];
    focusedCarId: number | null;
    onCarClick: (car: PositionedCar) => void;
    fogColor?: string;
    fogNear?: number;
    fogFar?: number;
}

// ─── Rise Animation ──────────────────────────────────────────

const RISE_DURATION = 0.7;
const RISE_STAGGER = 0.025;
let hasPlayedRise = false;

function easeOutBack(t: number): number {
    const c = 1.4;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

// ─── Pre-alloc ───────────────────────────────────────────────

const _mat = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _axis = new THREE.Vector3(0, 1, 0);

// ─── Create material (each group gets its own clone) ─────────

function createMaterial(fogColor: string, fogNear: number, fogFar: number): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uFogColor: { value: new THREE.Color(fogColor) },
            uFogNear: { value: fogNear },
            uFogFar: { value: fogFar },
            uFocusedId: { value: -1 },
            uDimOpacity: { value: 0.35 },
            uHasFocus: { value: 0 },
        },
        side: THREE.DoubleSide,
    });
}

// ─── SizeGroup Renderer ─────────────────────────────────────

function SizeGroupMesh({
    group,
    focusedCarId,
    globalIndexOffset,
    onCarClick,
    fogColor,
    fogNear,
    fogFar,
}: {
    group: SizeGroup;
    focusedCarId: number | null;
    globalIndexOffset: number;
    onCarClick: (car: PositionedCar) => void;
    fogColor: string;
    fogNear: number;
    fogFar: number;
}) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const coverMeshRef = useRef<THREE.InstancedMesh>(null);
    const { cars, size } = group;

    const uncovered = useMemo(() => cars.filter((c) => !c.isCovered), [cars]);
    const covered = useMemo(() => cars.filter((c) => c.isCovered), [cars]);

    const carGeo = useMemo(() => createCarGeometry(size), [size]);
    const coverGeo = useMemo(() => createCoverGeometry(size), [size]);

    // Each group has its OWN material — focus uniform is LOCAL instance index
    const material = useMemo(() => createMaterial(fogColor, fogNear, fogFar), []);
    const coverMat = useMemo(() => createMaterial(fogColor, fogNear, fogFar), []);

    // Update focus per-group: find local index within uncovered/covered lists
    useEffect(() => {
        // Reset both
        material.uniforms.uFocusedId.value = -1;
        material.uniforms.uHasFocus.value = focusedCarId != null ? 1 : 0;
        coverMat.uniforms.uFocusedId.value = -1;
        coverMat.uniforms.uHasFocus.value = focusedCarId != null ? 1 : 0;

        if (focusedCarId == null) return;

        const uIdx = uncovered.findIndex((c) => c.id === focusedCarId);
        if (uIdx >= 0) {
            material.uniforms.uFocusedId.value = uIdx;
            return;
        }
        const cIdx = covered.findIndex((c) => c.id === focusedCarId);
        if (cIdx >= 0) {
            coverMat.uniforms.uFocusedId.value = cIdx;
        }
    }, [focusedCarId, uncovered, covered, material, coverMat]);

    // Update fog uniforms
    useEffect(() => {
        for (const m of [material, coverMat]) {
            m.uniforms.uFogColor.value.set(fogColor);
            m.uniforms.uFogNear.value = fogNear;
            m.uniforms.uFogFar.value = fogFar;
        }
    }, [fogColor, fogNear, fogFar, material, coverMat]);

    // Rise state
    const riseRef = useRef({ startTime: -1, played: false });

    const { colorBuf, riseBuf } = useMemo(() => {
        const col = new Float32Array(uncovered.length * 3);
        const rise = new Float32Array(uncovered.length);
        const _c = new THREE.Color();
        uncovered.forEach((car, i) => {
            _c.set(car.color);
            if (car.isDusty) _c.lerp(new THREE.Color('#665544'), 0.4);
            col[i * 3] = _c.r;
            col[i * 3 + 1] = _c.g;
            col[i * 3 + 2] = _c.b;
            rise[i] = hasPlayedRise ? 1 : 0;
        });
        return { colorBuf: col, riseBuf: rise };
    }, [uncovered]);

    const coverBufs = useMemo(() => {
        const col = new Float32Array(covered.length * 3);
        const rise = new Float32Array(covered.length);
        const _c = new THREE.Color();
        covered.forEach((car, i) => {
            _c.set(car.color);
            _c.lerp(new THREE.Color('#555566'), 0.8);
            col[i * 3] = _c.r;
            col[i * 3 + 1] = _c.g;
            col[i * 3 + 2] = _c.b;
            rise[i] = hasPlayedRise ? 1 : 0;
        });
        return { colorBuf: col, riseBuf: rise };
    }, [covered]);

    // Set instance matrices
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;
        uncovered.forEach((car, i) => {
            _quat.setFromAxisAngle(_axis, car.yRot);
            _pos.set(car.slotX, 0, car.slotZ);
            _scale.set(1, 1, 1);
            _mat.compose(_pos, _quat, _scale);
            mesh.setMatrixAt(i, _mat);
        });
        mesh.instanceMatrix.needsUpdate = true;
    }, [uncovered]);

    useEffect(() => {
        const mesh = coverMeshRef.current;
        if (!mesh) return;
        covered.forEach((car, i) => {
            _quat.setFromAxisAngle(_axis, car.yRot);
            _pos.set(car.slotX, 0, car.slotZ);
            _scale.set(1, 1, 1);
            _mat.compose(_pos, _quat, _scale);
            mesh.setMatrixAt(i, _mat);
        });
        mesh.instanceMatrix.needsUpdate = true;
    }, [covered]);

    // Rise animation
    useFrame(({ clock }) => {
        if (hasPlayedRise && riseRef.current.played) return;
        if (riseRef.current.startTime < 0) riseRef.current.startTime = clock.elapsedTime;

        const elapsed = clock.elapsedTime - riseRef.current.startTime;
        let allDone = true;

        const updateRise = (buf: Float32Array, offset: number) => {
            for (let i = 0; i < buf.length; i++) {
                const delay = (globalIndexOffset + offset + i) * RISE_STAGGER;
                const t = Math.max(0, Math.min(1, (elapsed - delay) / RISE_DURATION));
                buf[i] = easeOutBack(t);
                if (t < 1) allDone = false;
            }
        };

        updateRise(riseBuf, 0);
        updateRise(coverBufs.riseBuf, uncovered.length);

        const m1 = meshRef.current;
        if (m1) {
            const attr = m1.geometry.getAttribute('aRise') as THREE.InstancedBufferAttribute;
            if (attr) { attr.array = riseBuf; attr.needsUpdate = true; }
        }
        const m2 = coverMeshRef.current;
        if (m2) {
            const attr = m2.geometry.getAttribute('aRise') as THREE.InstancedBufferAttribute;
            if (attr) { attr.array = coverBufs.riseBuf; attr.needsUpdate = true; }
        }

        if (allDone) {
            riseRef.current.played = true;
            hasPlayedRise = true;
        }
    });

    // Instanced attributes on geometry
    const uncoveredGeo = useMemo(() => {
        const g = carGeo.clone();
        g.setAttribute('aInstanceColor', new THREE.InstancedBufferAttribute(colorBuf, 3));
        g.setAttribute('aRise', new THREE.InstancedBufferAttribute(riseBuf, 1));
        return g;
    }, [carGeo, colorBuf, riseBuf]);

    const coveredGeo = useMemo(() => {
        const g = coverGeo.clone();
        g.setAttribute('aInstanceColor', new THREE.InstancedBufferAttribute(coverBufs.colorBuf, 3));
        g.setAttribute('aRise', new THREE.InstancedBufferAttribute(coverBufs.riseBuf, 1));
        return g;
    }, [coverGeo, coverBufs]);

    const handleClick = (e: ThreeEvent<MouseEvent>, list: PositionedCar[]) => {
        e.stopPropagation();
        if (e.instanceId !== undefined && list[e.instanceId]) {
            onCarClick(list[e.instanceId]);
        }
    };

    return (
        <>
            {uncovered.length > 0 && (
                <instancedMesh
                    ref={meshRef}
                    args={[uncoveredGeo, material, uncovered.length]}
                    frustumCulled={false}
                    onClick={(e) => handleClick(e, uncovered)}
                />
            )}
            {covered.length > 0 && (
                <instancedMesh
                    ref={coverMeshRef}
                    args={[coveredGeo, coverMat, covered.length]}
                    frustumCulled={false}
                    onClick={(e) => handleClick(e, covered)}
                />
            )}
        </>
    );
}

// ─── Main Component ──────────────────────────────────────────

export default memo(function InstancedCars({
    cars,
    focusedCarId,
    onCarClick,
    fogColor = '#0a0a14',
    fogNear = 30,
    fogFar = 80,
}: InstancedCarsProps) {
    const groups = useMemo(() => {
        const map = new Map<CarSize, PositionedCar[]>();
        for (const car of cars) {
            const list = map.get(car.size) || [];
            list.push(car);
            map.set(car.size, list);
        }
        return Array.from(map.entries()).map(([size, cars]) => ({ size, cars }));
    }, [cars]);

    let offset = 0;

    return (
        <group>
            {groups.map((group) => {
                const thisOffset = offset;
                offset += group.cars.length;
                return (
                    <SizeGroupMesh
                        key={group.size}
                        group={group}
                        focusedCarId={focusedCarId}
                        globalIndexOffset={thisOffset}
                        onCarClick={onCarClick}
                        fogColor={fogColor}
                        fogNear={fogNear}
                        fogFar={fogFar}
                    />
                );
            })}
        </group>
    );
});
