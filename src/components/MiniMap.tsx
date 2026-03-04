import { useRef, useEffect, useMemo, useCallback } from 'react';
import type { DistrictLayout } from '@/lib/districtLayout';

interface MiniMapProps {
    layout: DistrictLayout;
    cameraX: number;
    cameraZ: number;
    visible: boolean;
}

const RES = 64;
const DISPLAY = 128;
const PAD = 3;

// Language → color for section dots
const LANG_RGB: Record<string, [number, number, number]> = {
    JavaScript: [241, 224, 90],
    TypeScript: [49, 120, 198],
    Python: [53, 114, 165],
    Go: [0, 173, 216],
    Rust: [222, 165, 132],
    Java: [176, 114, 25],
    Ruby: [204, 52, 45],
    'C++': [243, 75, 125],
    C: [85, 85, 85],
    default: [120, 120, 140],
};

export default function MiniMap({ layout, cameraX, cameraZ, visible }: MiniMapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const wb = useMemo(() => {
        if (layout.sections.length === 0) return null;
        const { minX, maxX, minZ, maxZ } = layout.bounds;
        const m = 30;
        return { x0: minX - m, x1: maxX + m, z0: minZ - m, z1: maxZ + m };
    }, [layout]);

    // Pre-compute section pixels
    const sectionPixels = useMemo(() => {
        if (!wb || layout.sections.length === 0) return [];
        const ww = wb.x1 - wb.x0;
        const wh = wb.z1 - wb.z0;
        const ds = RES - PAD * 2;
        const s = Math.min(ds / ww, ds / wh);
        const ox = PAD + (ds - ww * s) / 2;
        const oy = PAD + (ds - wh * s) / 2;

        return layout.sections.map((sec) => {
            // Color based on the dominant language among the section's cars
            const langCounts: Record<string, number> = {};
            for (const car of sec.cars) {
                if (car.language) langCounts[car.language] = (langCounts[car.language] || 0) + 1;
            }
            let topLang = 'default';
            let topCount = 0;
            for (const [lang, count] of Object.entries(langCounts)) {
                if (count > topCount) { topLang = lang; topCount = count; }
            }
            const rgb = LANG_RGB[topLang] || LANG_RGB.default;

            // Section bounds → pixel rectangle
            const cx = Math.round(ox + (sec.center[0] - wb.x0) * s);
            const cz = Math.round(oy + (sec.center[2] - wb.z0) * s);
            const hw = Math.max(1, Math.round(sec.width * s * 0.4));
            const hd = Math.max(1, Math.round(sec.depth * s * 0.4));

            return { cx, cz, hw, hd, rgb };
        });
    }, [layout, wb]);

    // World → pixel
    const w2p = useCallback(
        (wx: number, wz: number): [number, number] => {
            if (!wb) return [RES / 2, RES / 2];
            const ww = wb.x1 - wb.x0;
            const wh = wb.z1 - wb.z0;
            const ds = RES - PAD * 2;
            const s = Math.min(ds / ww, ds / wh);
            const ox = PAD + (ds - ww * s) / 2;
            const oy = PAD + (ds - wh * s) / 2;
            return [Math.round(ox + (wx - wb.x0) * s), Math.round(oy + (wz - wb.z0) * s)];
        },
        [wb],
    );

    const draw = useCallback(
        (blink: boolean) => {
            const canvas = canvasRef.current;
            if (!canvas || sectionPixels.length === 0) return;
            const ctx = canvas.getContext('2d')!;
            ctx.imageSmoothingEnabled = false;

            const buf = new Uint8ClampedArray(RES * RES * 4);
            // Background
            for (let i = 0; i < buf.length; i += 4) {
                buf[i] = 5; buf[i + 1] = 5; buf[i + 2] = 8; buf[i + 3] = 200;
            }

            // Sections as colored rectangles
            for (const { cx, cz, hw, hd, rgb } of sectionPixels) {
                for (let dy = -hd; dy <= hd; dy++) {
                    for (let dx = -hw; dx <= hw; dx++) {
                        const px = cx + dx;
                        const py = cz + dy;
                        if (px < 0 || px >= RES || py < 0 || py >= RES) continue;
                        const idx = (py * RES + px) * 4;
                        buf[idx] = rgb[0]; buf[idx + 1] = rgb[1]; buf[idx + 2] = rgb[2]; buf[idx + 3] = 255;
                    }
                }
            }

            // Camera crosshair
            const [ppx, ppy] = w2p(cameraX, cameraZ);
            const set = (x: number, y: number) => {
                if (x >= 0 && x < RES && y >= 0 && y < RES) {
                    const i = (y * RES + x) * 4;
                    buf[i] = 255; buf[i + 1] = 215; buf[i + 2] = 0; buf[i + 3] = 255;
                }
            };
            set(ppx, ppy);
            if (blink) {
                set(ppx - 1, ppy); set(ppx + 1, ppy);
                set(ppx, ppy - 1); set(ppx, ppy + 1);
            }

            ctx.putImageData(new ImageData(buf, RES, RES), 0, 0);
        },
        [sectionPixels, cameraX, cameraZ, w2p],
    );

    useEffect(() => { if (visible) draw(true); }, [visible, draw]);

    // Blink crosshair
    useEffect(() => {
        if (!visible) return;
        let on = true;
        const id = setInterval(() => { on = !on; draw(on); }, 500);
        return () => clearInterval(id);
    }, [visible, draw]);

    if (!visible || layout.sections.length === 0) return null;

    return (
        <div className="pointer-events-none fixed bottom-3 right-3 z-30 sm:bottom-4 sm:right-4">
            <canvas
                ref={canvasRef}
                width={RES}
                height={RES}
                style={{
                    width: DISPLAY,
                    height: DISPLAY,
                    imageRendering: 'pixelated',
                    border: '2px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: 4,
                }}
            />
        </div>
    );
}
