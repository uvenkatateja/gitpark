import { useRef, useMemo, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { UserSection } from '@/lib/districtLayout';

// ─── Billboard vertex shader ─────────────────────────────────

const billboardVert = /* glsl */ `
  attribute vec4 aLabelUv;
  attribute float aAlpha;

  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    vUv = mix(aLabelUv.xy, aLabelUv.zw, uv);
    vAlpha = aAlpha;

    // Billboard: face camera
    vec4 worldPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 camUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);

    float labelW = 14.0;
    float labelH = 3.0;
    vec3 vertexPos = worldPos.xyz
      + camRight * position.x * labelW
      + camUp * position.y * labelH;

    vec4 mvPos = viewMatrix * vec4(vertexPos, 1.0);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const billboardFrag = /* glsl */ `
  uniform sampler2D uAtlas;
  varying vec2 vUv;
  varying float vAlpha;

  void main() {
    vec4 texColor = texture2D(uAtlas, vUv);
    if (texColor.a < 0.01) discard;
    gl_FragColor = vec4(texColor.rgb, texColor.a * vAlpha);
  }
`;

// ─── Text atlas builder ──────────────────────────────────────

const ATLAS_W = 2048;
const ATLAS_ROW_H = 64;
const MAX_LABELS = 200;

function createSectionAtlas(sections: UserSection[]): THREE.CanvasTexture {
    const count = Math.min(sections.length, MAX_LABELS);
    const rows = count;
    const h = rows * ATLAS_ROW_H;
    const canvas = document.createElement('canvas');
    canvas.width = ATLAS_W;
    canvas.height = Math.max(h, 64);
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, ATLAS_W, canvas.height);
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < count; i++) {
        const s = sections[i];
        const y = i * ATLAS_ROW_H + ATLAS_ROW_H / 2;

        const rankText = s.rank ? `#${s.rank} ` : '';
        const userText = `@${s.username}`;
        const fullText = rankText + userText;

        ctx.font = 'bold 32px monospace';
        const tw = ctx.measureText(fullText).width;
        const pad = 28;

        // Colors base on rank/claimed
        const isFirst = s.rank === 1;
        const mainColor = isFirst ? '#facc15' : '#ffd700';
        const bgColor = s.isClaimed ? 'rgba(20, 15, 40, 0.9)' : 'rgba(10, 10, 20, 0.75)';

        // Background pill
        ctx.fillStyle = bgColor;
        roundRect(ctx, ATLAS_W / 2 - tw / 2 - pad, y - 24, tw + pad * 2, 48, 8);
        ctx.fill();

        // Border
        ctx.strokeStyle = s.isClaimed ? mainColor : 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = s.isClaimed ? 3 : 1.5;
        roundRect(ctx, ATLAS_W / 2 - tw / 2 - pad, y - 24, tw + pad * 2, 48, 8);
        ctx.stroke();

        // King Crown for #1 or Claimed
        if (s.isClaimed || isFirst) {
            ctx.fillStyle = mainColor;
            ctx.font = '28px serif';
            ctx.fillText('👑', ATLAS_W / 2 - tw / 2 - pad - 10, y + 2);
        }

        // Text
        ctx.font = 'bold 30px monospace';
        ctx.fillStyle = mainColor;
        ctx.fillText(fullText, ATLAS_W / 2, y + 2);

        // Small "CLAIMED" tag if applicable
        if (s.isClaimed) {
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = mainColor;
            ctx.fillText('RESIDENT', ATLAS_W / 2, y + 20);
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ─── Pre-allocated temp objects ──────────────────────────────

const _labelPos = new THREE.Vector3();
const _labelQuat = new THREE.Quaternion();
const _labelScale = new THREE.Vector3(1, 1, 1);
const _matrix = new THREE.Matrix4();

// ─── Component ───────────────────────────────────────────────

interface InstancedLabelsProps {
    sections: UserSection[];
}

export default memo(function InstancedLabels({ sections }: InstancedLabelsProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = Math.min(sections.length, MAX_LABELS);

    const atlas = useMemo(() => createSectionAtlas(sections), [sections]);

    const material = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: { uAtlas: { value: atlas } },
                vertexShader: billboardVert,
                fragmentShader: billboardFrag,
                transparent: true,
                depthTest: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            }),
        [atlas],
    );

    // Per-instance UV + alpha data
    const { uvData, alphaData } = useMemo(() => {
        const uv = new Float32Array(count * 4);
        const alpha = new Float32Array(count);
        const atlasH = Math.max(count * ATLAS_ROW_H, 64);

        for (let i = 0; i < count; i++) {
            const u0 = 0;
            const u1 = 1;
            const v0 = 1 - (i * ATLAS_ROW_H) / atlasH;
            const v1 = 1 - ((i + 1) * ATLAS_ROW_H) / atlasH;
            uv[i * 4 + 0] = u0;
            uv[i * 4 + 1] = v1;
            uv[i * 4 + 2] = u1;
            uv[i * 4 + 3] = v0;
            alpha[i] = 1.0;
        }

        return { uvData: uv, alphaData: alpha };
    }, [count]);

    // Setup instances
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh || count === 0) return;

        for (let i = 0; i < count; i++) {
            const section = sections[i];
            _labelPos.set(section.center[0], 6, section.center[2]);
            _matrix.compose(_labelPos, _labelQuat, _labelScale);
            mesh.setMatrixAt(i, _matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;

        // Attributes
        const geo = mesh.geometry;
        geo.setAttribute('aLabelUv', new THREE.InstancedBufferAttribute(uvData, 4));
        geo.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(alphaData, 1));
    }, [sections, count, uvData, alphaData]);

    // Distance-based alpha fade
    useFrame(({ camera }) => {
        const mesh = meshRef.current;
        if (!mesh || count === 0) return;

        const alphaAttr = mesh.geometry.getAttribute('aAlpha') as THREE.InstancedBufferAttribute;
        if (!alphaAttr) return;
        const arr = alphaAttr.array as Float32Array;

        for (let i = 0; i < count; i++) {
            const s = sections[i];
            const dx = camera.position.x - s.center[0];
            const dz = camera.position.z - s.center[2];
            const distSq = dx * dx + dz * dz;

            // Fade in at 80 units, fully visible at 20, invisible at 120+
            let targetAlpha = 1.0;
            if (distSq > 14400) targetAlpha = 0.0; // >120
            else if (distSq > 6400) targetAlpha = 1.0 - (Math.sqrt(distSq) - 80) / 40; // 80-120 fade

            arr[i] += (targetAlpha - arr[i]) * 0.08;
        }
        alphaAttr.needsUpdate = true;
    });

    if (count === 0) return null;

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, count]}
            material={material}
            frustumCulled={false}
        >
            <planeGeometry args={[1, 1]} />
        </instancedMesh>
    );
});
