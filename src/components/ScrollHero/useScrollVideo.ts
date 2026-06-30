import { useCallback, useEffect, useRef, useState } from 'react';

export interface ScrollVideoState {
    loadedFraction: number;
    ready: boolean;
    currentFrame: number;
}

export interface UseScrollVideoOptions {
    containerRef: React.RefObject<HTMLDivElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    frameUrls: string[];
    enabled: boolean;
}

export function useScrollVideo({
    containerRef,
    canvasRef,
    frameUrls,
    enabled,
}: UseScrollVideoOptions): ScrollVideoState {
    const frameCount = frameUrls.length;

    const [loadedFraction, setLoadedFraction] = useState(0);
    const [ready, setReady] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);

    const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
    const loadedArrRef = useRef<Uint8Array>(new Uint8Array(0));
    const maxContigRef = useRef(0);
    const progressRef = useRef(0);
    const currentFrameRef = useRef(0);
    const rafRef = useRef(0);
    const lastDrawnRef = useRef(-1);

    // ---- drawing -----------------------------------------------------------
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Best available frame at or before the target
        let idx = Math.min(currentFrameRef.current, maxContigRef.current - 1);
        if (idx < 0) return;
        if (idx === lastDrawnRef.current) return; // nothing changed

        const im = imagesRef.current[idx];
        if (!im || !im.complete || im.naturalWidth === 0) return;

        lastDrawnRef.current = idx;

        const cw = canvas.width;
        const ch = canvas.height;
        const scale = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
        const dw = im.naturalWidth * scale;
        const dh = im.naturalHeight * scale;
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(im, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }, [canvasRef]);

    const tick = useCallback(() => {
        rafRef.current = 0;
        const el = containerRef.current;
        if (el) {
            el.style.setProperty('--sh-progress', progressRef.current.toFixed(5));
            el.style.setProperty('--center-pe', progressRef.current < 0.14 ? 'auto' : 'none');

            // Chapter visibility written as CSS vars — no React re-render
            const p = progressRef.current;
            el.style.setProperty('--ch-craft', vis(p, 0.12, 0.34, 0.07).toFixed(4));
            el.style.setProperty('--ch-fire',  vis(p, 0.36, 0.58, 0.07).toFixed(4));
            el.style.setProperty('--ch-taste', vis(p, 0.60, 0.80, 0.07).toFixed(4));
            el.style.setProperty('--ch-final', vis(p, 0.83, 1.00, 0.07).toFixed(4));

            // Center intro opacity (no @property needed — write directly to element)
            const centerVis = Math.max(0, Math.min(1, (0.14 - p) / 0.14));
            const centerEl = el.querySelector<HTMLElement>('.sh-center');
            if (centerEl) {
                centerEl.style.opacity = centerVis.toFixed(4);
                centerEl.style.transform = `translateY(${(1 - centerVis) * -70}px)`;
            }
        }
        draw();
        setCurrentFrame(currentFrameRef.current);
    }, [containerRef, draw]);

    const scheduleDraw = useCallback(() => {
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(tick);
    }, [tick]);

    // ---- preload -----------------------------------------------------------
    useEffect(() => {
        if (!enabled || frameCount === 0) return;
        let cancelled = false;

        const imgs: (HTMLImageElement | null)[] = new Array(frameCount).fill(null);
        const loadedArr = new Uint8Array(frameCount);
        imagesRef.current = imgs;
        loadedArrRef.current = loadedArr;
        maxContigRef.current = 0;
        lastDrawnRef.current = -1;
        setLoadedFraction(0);
        setReady(false);

        const mark = (i: number, ok: boolean) => {
            if (cancelled) return;
            if (ok) {
                loadedArr[i] = 1;
                while (maxContigRef.current < frameCount && loadedArr[maxContigRef.current]) {
                    maxContigRef.current++;
                }
                if (i === 0) setReady(true);
            }
            setLoadedFraction(maxContigRef.current / frameCount);
            scheduleDraw();
        };

        // Load first 12 frames immediately for instant first paint
        const PRIORITY_BATCH = 12;
        const CONCURRENCY = 8;

        const loadRange = async (start: number, end: number, concurrency: number) => {
            for (let s = start; s < end && !cancelled; s += concurrency) {
                const tasks: Promise<void>[] = [];
                for (let k = 0; k < concurrency && s + k < end; k++) {
                    const idx = s + k;
                    tasks.push(new Promise<void>((resolve) => {
                        const im = new Image();
                        im.decoding = 'async';
                        im.onload = () => { mark(idx, true); resolve(); };
                        im.onerror = () => { mark(idx, false); resolve(); };
                        im.src = frameUrls[idx];
                        imgs[idx] = im;
                    }));
                }
                await Promise.all(tasks);
            }
        };

        (async () => {
            await loadRange(0, Math.min(PRIORITY_BATCH, frameCount), PRIORITY_BATCH);
            await loadRange(PRIORITY_BATCH, frameCount, CONCURRENCY);
        })();

        return () => { cancelled = true; };
    }, [enabled, frameCount, frameUrls, scheduleDraw]);

    // ---- canvas size -------------------------------------------------------
    useEffect(() => {
        if (!enabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(window.innerWidth * dpr);
            canvas.height = Math.round(window.innerHeight * dpr);
            lastDrawnRef.current = -1;
            draw();
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });
        return () => window.removeEventListener('resize', resize);
    }, [enabled, canvasRef, draw]);

    // ---- scroll → frame ----------------------------------------------------
    useEffect(() => {
        if (!enabled) return;
        const container = containerRef.current;
        if (!container) return;

        const onScroll = () => {
            const rect = container.getBoundingClientRect();
            const track = rect.height - window.innerHeight;
            if (track <= 0) return;
            const scrolled = -rect.top;
            let p = scrolled / track;
            p = Math.max(0, Math.min(1, p));
            progressRef.current = p;
            currentFrameRef.current = Math.min(
                Math.round(p * (frameCount - 1)),
                maxContigRef.current - 1
            );
            scheduleDraw();
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [enabled, containerRef, frameCount, scheduleDraw]);

    // cleanup rAF on unmount
    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

    return { loadedFraction, ready, currentFrame };
}

/** Smooth bump: 0 outside [from-fade, to+fade], 1 inside [from, to]. */
function vis(p: number, from: number, to: number, fade: number): number {
    if (p < from - fade || p > to + fade) return 0;
    if (p >= from && p <= to) return 1;
    if (p < from) return Math.max(0, (p - (from - fade)) / fade);
    return Math.max(0, (to + fade - p) / fade);
}
