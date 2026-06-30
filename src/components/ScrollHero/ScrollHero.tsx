import React, { useEffect, useRef, useState } from 'react';
import './ScrollHero.css';
import { useLanguage } from '../../translations/LanguageContext';

const FRAME_COUNT = 240;
const PAD = 4;
const POSTER = '/hero-frames/poster.webp';

// Chapter definitions — title appears left or right as frames progress
const CHAPTERS = [
    { from: 0.12, to: 0.34, side: 'right' as const, num: '01', titleKey: 'home.craft_title', descKey: 'home.craft_desc', defaultTitle: 'РЕМЕСЛО', defaultDesc: 'Готовим вручную из лучших локальных продуктов Местии.' },
    { from: 0.36, to: 0.58, side: 'left'  as const, num: '02', titleKey: 'home.fire_title',  descKey: 'home.fire_desc',  defaultTitle: 'ОГОНЬ',   defaultDesc: 'Каждое блюдо — с характером, на живом огне.' },
    { from: 0.60, to: 0.80, side: 'right' as const, num: '03', titleKey: 'home.taste_title', descKey: 'home.taste_desc', defaultTitle: 'ВКУС',    defaultDesc: 'Горячее и ароматное — прямо к вашей двери.' },
    { from: 0.83, to: 1.00, side: 'left'  as const, num: '04', titleKey: 'home.final_title', descKey: 'home.final_desc', defaultTitle: 'ДОСТАВИМ ЗА МИНУТЫ', defaultDesc: 'Закажи любимое — и наслаждайся отдыхом в Местии.', isFinal: true },
] as const satisfies ReadonlyArray<{
    from: number; to: number; side: 'left' | 'right'; num: string;
    titleKey: string; descKey: string; defaultTitle: string; defaultDesc: string;
    isFinal?: true;
}>;

const FADE = 0.07;

function clamp01(v: number) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function chapterVis(p: number, from: number, to: number): number {
    if (p < from - FADE || p > to + FADE) return 0;
    if (p >= from && p <= to) return 1;
    if (p < from) return clamp01((p - (from - FADE)) / FADE);
    return clamp01((to + FADE - p) / FADE);
}

interface Props { onNavigate: (page: string) => void; }

const ScrollHero: React.FC<Props> = ({ onNavigate }) => {
    const { t } = useLanguage();

    // ---- refs ----
    const wrapRef    = useRef<HTMLDivElement>(null);   // outer 400vh scroll track
    const stickyRef  = useRef<HTMLDivElement>(null);   // 100vh sticky panel
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const posterRef  = useRef<HTMLImageElement>(null);

    // Chapter element refs for direct DOM updates
    const chapterRefs = useRef<(HTMLElement | null)[]>([null, null, null, null]);
    const centerRef   = useRef<HTMLDivElement>(null);
    const hintRef     = useRef<HTMLDivElement>(null);

    // ---- state ----
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width:1024px)').matches);
    const [loaded, setLoaded] = useState(0); // 0..1

    // ---- frame store ----
    const frames = useRef<(HTMLImageElement | null)[]>([]);
    const maxReady = useRef(0); // how many frames are loaded contiguously from 0
    const lastDrawn = useRef(-1);
    const rafId = useRef(0);
    const progressRef = useRef(0);

    // ---- canvas draw ----
    const drawFrame = (idx: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const realIdx = Math.min(idx, maxReady.current - 1);
        if (realIdx < 0 || realIdx === lastDrawn.current) return;
        const img = frames.current[realIdx];
        if (!img || !img.complete || !img.naturalWidth) return;
        lastDrawn.current = realIdx;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
        const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
        // Hide poster once first real frame is drawn
        if (posterRef.current && realIdx >= 0) posterRef.current.style.opacity = '0';
    };

    // ---- per-frame DOM update (called from rAF) ----
    const applyProgress = (p: number) => {
        const frameIdx = Math.round(p * (FRAME_COUNT - 1));
        drawFrame(frameIdx);

        // Center intro: fully visible at p=0, fades out by p=0.14
        if (centerRef.current) {
            const cv = clamp01((0.14 - p) / 0.14);
            centerRef.current.style.opacity = String(cv);
            centerRef.current.style.transform = `translateY(${(1 - cv) * -60}px)`;
            (centerRef.current as any).style.pointerEvents = cv > 0.1 ? 'auto' : 'none';
        }

        // Scroll hint: visible only near start
        if (hintRef.current) {
            hintRef.current.style.opacity = String(clamp01((0.12 - p) / 0.12));
        }

        // Chapters
        CHAPTERS.forEach((ch, i) => {
            const el = chapterRefs.current[i];
            if (!el) return;
            const v = chapterVis(p, ch.from, ch.to);
            el.style.opacity = String(v);
            const dx = v === 0 ? (ch.side === 'right' ? 80 : -80) : (1 - v) * (ch.side === 'right' ? 80 : -80);
            el.style.transform = `translateY(-50%) translateX(${dx}px)`;
            (el as any).style.pointerEvents = v > 0.05 ? 'auto' : 'none';

            // Inner mask wipe
            const inner = el.querySelector<HTMLElement>('.sh-mask-inner');
            if (inner) inner.style.transform = `translateY(${(1 - v) * 110}%)`;

            const kicker = el.querySelector<HTMLElement>('.sh-ch-kicker');
            if (kicker) kicker.style.opacity = String(v);

            const desc = el.querySelector<HTMLElement>('.sh-ch-desc');
            if (desc) desc.style.opacity = String(clamp01((v - 0.15) / 0.85));
        });
        // Progress rail
        const fill = document.getElementById('sh-rail-fill');
        const dot  = document.getElementById('sh-rail-dot');
        if (fill) fill.style.height = `${(p * 100).toFixed(1)}%`;
        if (dot)  dot.style.top    = `${(p * 100).toFixed(1)}%`;
    };

    // ---- scroll handler ----
    const onScroll = () => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const track = rect.height - window.innerHeight;
        if (track <= 0) return;
        const p = clamp01(-rect.top / track);
        progressRef.current = p;
        if (rafId.current) return;
        rafId.current = requestAnimationFrame(() => {
            rafId.current = 0;
            applyProgress(progressRef.current);
        });
    };

    // ---- preload frames ----
    useEffect(() => {
        const dir = isMobile ? 'mobile' : 'desktop';
        const arr: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
        const ready = new Uint8Array(FRAME_COUNT);
        frames.current = arr;
        maxReady.current = 0;
        lastDrawn.current = -1;
        setLoaded(0);

        let cancelled = false;
        const onLoaded = (i: number) => {
            if (cancelled) return;
            ready[i] = 1;
            while (maxReady.current < FRAME_COUNT && ready[maxReady.current]) maxReady.current++;
            setLoaded(maxReady.current / FRAME_COUNT);
            // Redraw if this affects current display
            if (i <= Math.round(progressRef.current * (FRAME_COUNT - 1))) {
                lastDrawn.current = -1;
                applyProgress(progressRef.current);
            }
        };

        // Load in batches: first 16 immediately, rest 8 at a time
        const loadBatch = async (start: number, end: number, conc: number) => {
            for (let s = start; s < end && !cancelled; s += conc) {
                await Promise.all(
                    Array.from({ length: Math.min(conc, end - s) }, (_, k) => {
                        const idx = s + k;
                        return new Promise<void>(res => {
                            const img = new Image();
                            img.onload = () => { onLoaded(idx); res(); };
                            img.onerror = () => res();
                            img.src = `/hero-frames/${dir}/frame_${String(idx + 1).padStart(PAD, '0')}.webp`;
                            arr[idx] = img;
                        });
                    })
                );
            }
        };

        (async () => {
            await loadBatch(0, Math.min(16, FRAME_COUNT), 16);
            await loadBatch(16, FRAME_COUNT, 8);
        })();

        return () => { cancelled = true; };
    }, [isMobile]);

    // ---- canvas resize ----
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width  = Math.round(window.innerWidth * dpr);
            canvas.height = Math.round(window.innerHeight * dpr);
            lastDrawn.current = -1;
            applyProgress(progressRef.current);
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });
        return () => window.removeEventListener('resize', resize);
    }, []);

    // ---- scroll listener ----
    useEffect(() => {
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // apply initial state
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ---- mobile detect ----
    useEffect(() => {
        const mq = window.matchMedia('(max-width:1024px)');
        const fn = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', fn);
        return () => mq.removeEventListener('change', fn);
    }, []);

    // ---- mouse glow ----
    useEffect(() => {
        const sticky = stickyRef.current;
        if (!sticky) return;
        let raf = 0;
        let mx = 50, my = 50;
        const apply = () => { raf = 0; sticky.style.setProperty('--mx', mx + '%'); sticky.style.setProperty('--my', my + '%'); };
        const onMove = (e: PointerEvent) => {
            mx = (e.clientX / window.innerWidth) * 100;
            my = (e.clientY / window.innerHeight) * 100;
            if (!raf) raf = requestAnimationFrame(apply);
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        return () => { window.removeEventListener('pointermove', onMove); if (raf) cancelAnimationFrame(raf); };
    }, []);

    const cta = t('home.order_now') || 'Заказать сейчас';
    const loadPct = Math.round(loaded * 100);

    return (
        /* Outer wrapper — 400vh tall, creates the scroll track */
        <div ref={wrapRef} className="sh-track">

            {/* Sticky panel — stays fixed in viewport while scrolling through sh-track */}
            <div ref={stickyRef} className="sh-sticky">

                {/* Poster — shown until canvas first frame is ready */}
                <img
                    ref={posterRef}
                    src={POSTER}
                    alt=""
                    aria-hidden="true"
                    className="sh-bg sh-poster"
                    style={{ transition: 'opacity 0.6s ease' }}
                />

                {/* Canvas — scroll-driven frame animation */}
                <canvas ref={canvasRef} className="sh-bg sh-canvas" />

                {/* Cinematic overlays */}
                <div className="sh-scrim" />
                <div className="sh-vignette" />
                <div className="sh-glow" />
                <div className="sh-grain" />

                {/* ── Center intro ── */}
                <div ref={centerRef} className="sh-center">
                    <span className="sh-eyebrow">MestiDelivery · Mestia</span>
                    <h1 className="sh-title">
                        <span className="sh-title-solid">{t('home.hero_title_1') || 'ВКУС МЕСТИИ'}</span>
                        <span className="sh-title-outline">{t('home.hero_title_2') || 'В КАЖДОМ ЗАКАЗЕ'}</span>
                    </h1>
                    <p className="sh-subtitle">{t('home.hero_subtitle') || 'Доставим любимые блюда быстро и с заботой о качестве.'}</p>
                    <button className="sh-cta" onClick={() => onNavigate('menu')}>
                        {cta}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* ── Chapters ── */}
                {CHAPTERS.map((ch, i) => (
                    <aside
                        key={ch.num}
                        ref={el => { chapterRefs.current[i] = el; }}
                        className={`sh-chapter sh-chapter--${ch.side}`}
                        style={{ opacity: 0 }}
                    >
                        <div className="sh-ch-kicker" style={{ opacity: 0 }}>
                            <span className="sh-ch-kick-line" />
                            <span className="sh-ch-kick-num">{ch.num}</span>
                            <span className="sh-ch-kick-sep">/ 04</span>
                        </div>
                        <h2 className="sh-ch-title">
                            <span className="sh-mask">
                                <span className="sh-mask-inner" style={{ transform: 'translateY(110%)' }}>
                                    {t(ch.titleKey) || ch.defaultTitle}
                                </span>
                            </span>
                        </h2>
                        <p className="sh-ch-desc" style={{ opacity: 0 }}>{t(ch.descKey) || ch.defaultDesc}</p>
                        {(ch as any).isFinal && (
                            <button className="sh-cta sh-cta--ghost" onClick={() => onNavigate('menu')}>
                                {cta}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        )}
                    </aside>
                ))}

                {/* ── Scroll hint ── */}
                <div ref={hintRef} className="sh-hint">
                    <span>{t('home.scroll_hint') || 'Листай вниз'}</span>
                    <span className="sh-hint-line" />
                </div>

                {/* ── Right progress rail ── */}
                <div className="sh-rail" aria-hidden="true">
                    <div className="sh-rail-track">
                        <div className="sh-rail-fill" id="sh-rail-fill" />
                        <div className="sh-rail-dot" id="sh-rail-dot" />
                    </div>
                </div>

                {/* ── Loading bar ── */}
                {loaded < 1 && (
                    <div className="sh-loader">
                        <div className="sh-loader-track">
                            <div className="sh-loader-fill" style={{ width: `${loadPct}%` }} />
                        </div>
                        <span className="sh-loader-label">{loadPct}%</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScrollHero;
