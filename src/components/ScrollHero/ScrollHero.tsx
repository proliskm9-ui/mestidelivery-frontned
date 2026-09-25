import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './ScrollHero.css';
import { useLanguage } from '../../translations/LanguageContext';

const FRAME_COUNT = 240;
const PAD = 4;
const POSTER = '/hero-frames/poster.webp?v=wm7';
const FRAME_VERSION = 'wm7';

// Chapter definitions — title appears left or right as frames progress
const CHAPTERS = [
    { from: 0.12, to: 0.34, side: 'right' as const, num: '01', titleKey: 'home.craft_title', descKey: 'home.craft_desc', defaultTitle: 'РЕМЕСЛО', defaultDesc: 'Готовим вручную из лучших локальных продуктов Местии.' },
    { from: 0.36, to: 0.58, side: 'left'  as const, num: '02', titleKey: 'home.fire_title',  descKey: 'home.fire_desc',  defaultTitle: 'ОГОНЬ',   defaultDesc: 'Каждое блюдо — с характером, на живом огне.' },
    { from: 0.60, to: 0.80, side: 'right' as const, num: '03', titleKey: 'home.taste_title', descKey: 'home.taste_desc', defaultTitle: 'ВКУС',    defaultDesc: 'Горячее и ароматное — прямо к вашей двери.' },
    { from: 0.83, to: 1.00, side: 'left'  as const, num: '04', titleKey: 'home.final_title', descKey: 'home.final_desc', defaultTitle: 'Доставим\nза\u00A0минуты', defaultDesc: 'Закажи любимое — и наслаждайся отдыхом в Местии.', isFinal: true },
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
    const { t, language } = useLanguage();

    const wrapRef    = useRef<HTMLDivElement>(null);
    const stickyRef  = useRef<HTMLDivElement>(null);
    const canvasRef  = useRef<HTMLCanvasElement>(null);
    const posterRef  = useRef<HTMLImageElement>(null);
    const chapterRefs = useRef<(HTMLElement | null)[]>([null, null, null, null]);
    const centerRef   = useRef<HTMLDivElement>(null);
    const hintRef     = useRef<HTMLDivElement>(null);
    const loaderRef   = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width:1024px)').matches);
    const [loaded, setLoaded] = useState(0);
    const [showLoader, setShowLoader] = useState(true);

    const frames = useRef<(HTMLImageElement | null)[]>([]);
    const maxReady = useRef(0);
    const lastDrawn = useRef(-1);
    const rafId = useRef(0);
    const progressRef = useRef(0);
    const wmTmp = useRef<HTMLCanvasElement | null>(null);
    const wmMask = useRef<HTMLCanvasElement | null>(null);

    const stampOutWatermark = (ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
        const sw = Math.max(56, Math.round(cw * 0.055));
        const sh = Math.max(64, Math.round(ch * 0.085));
        const destX = cw - sw;
        const destY = ch - sh;
        const srcX = Math.max(0, destX - sw - Math.round(cw * 0.02));
        const srcY = destY;

        if (!wmTmp.current) wmTmp.current = document.createElement('canvas');
        if (!wmMask.current) wmMask.current = document.createElement('canvas');
        const tmp = wmTmp.current;
        const mask = wmMask.current;
        if (tmp.width !== sw || tmp.height !== sh) {
            tmp.width = sw;
            tmp.height = sh;
            mask.width = sw;
            mask.height = sh;
        }
        const tctx = tmp.getContext('2d');
        const mctx = mask.getContext('2d');
        if (!tctx || !mctx) return;

        tctx.clearRect(0, 0, sw, sh);
        tctx.filter = 'blur(3px)';
        tctx.drawImage(ctx.canvas, srcX, srcY, sw, sh, 0, 0, sw, sh);
        tctx.filter = 'none';

        mctx.clearRect(0, 0, sw, sh);
        const g = mctx.createRadialGradient(
            sw * 0.72, sh * 0.72, sw * 0.08,
            sw * 0.72, sh * 0.72, Math.max(sw, sh) * 0.55
        );
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(0.55, 'rgba(0,0,0,0.85)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        mctx.fillStyle = g;
        mctx.fillRect(0, 0, sw, sh);

        tctx.globalCompositeOperation = 'destination-in';
        tctx.drawImage(mask, 0, 0);
        tctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tmp, destX, destY);
    };

    const drawFrame = (idx: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let realIdx = idx;
        while (realIdx >= 0 && !frames.current[realIdx]) realIdx--;
        if (realIdx < 0 || realIdx === lastDrawn.current) return;

        const img = frames.current[realIdx]!;
        lastDrawn.current = realIdx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        stampOutWatermark(ctx, canvas.width, canvas.height);
        if (posterRef.current && realIdx >= 0) posterRef.current.style.opacity = '0';
    };

    const applyProgress = (p: number) => {
        const frameIdx = Math.round(p * (FRAME_COUNT - 1));
        drawFrame(frameIdx);

        if (centerRef.current) {
            const cv = clamp01((0.14 - p) / 0.14);
            centerRef.current.style.opacity = String(cv);
            centerRef.current.style.transform = `translateY(${(1 - cv) * -60}px)`;
            (centerRef.current as any).style.pointerEvents = cv > 0.1 ? 'auto' : 'none';
        }

        // Hint fades as soon as user starts scrolling (same as PC)
        if (hintRef.current) {
            hintRef.current.style.opacity = String(clamp01((0.12 - p) / 0.12));
        }

        CHAPTERS.forEach((ch, i) => {
            const el = chapterRefs.current[i];
            if (!el) return;
            const v = chapterVis(p, ch.from, ch.to);
            el.style.opacity = String(v);
            const dx = v === 0 ? (ch.side === 'right' ? 80 : -80) : (1 - v) * (ch.side === 'right' ? 80 : -80);
            el.style.transform = `translateY(-50%) translateX(${dx}px)`;
            (el as any).style.pointerEvents = v > 0.05 ? 'auto' : 'none';

            const inner = el.querySelector<HTMLElement>('.sh-mask-inner');
            if (inner) inner.style.transform = `translateY(${(1 - v) * 110}%)`;

            const kicker = el.querySelector<HTMLElement>('.sh-ch-kicker');
            if (kicker) kicker.style.opacity = String(v);

            const desc = el.querySelector<HTMLElement>('.sh-ch-desc');
            if (desc) desc.style.opacity = String(clamp01((v - 0.15) / 0.85));
        });

        const fill = document.getElementById('sh-rail-fill');
        const dot  = document.getElementById('sh-rail-dot');
        if (fill) fill.style.height = `${(p * 100).toFixed(1)}%`;
        if (dot)  dot.style.top    = `${(p * 100).toFixed(1)}%`;
    };

    const onScroll = () => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const vh = window.visualViewport?.height ?? window.innerHeight;
        const track = rect.height - vh;
        const p = track <= 0 ? 0 : clamp01(-rect.top / track);
        progressRef.current = p;
        if (rafId.current) return;
        rafId.current = requestAnimationFrame(() => {
            rafId.current = 0;
            applyProgress(progressRef.current);
        });
    };

    useEffect(() => {
        const dir = isMobile ? 'mobile' : 'desktop';
        const arr: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
        const ready = new Uint8Array(FRAME_COUNT);
        frames.current = arr;
        maxReady.current = 0;
        lastDrawn.current = -1;
        setLoaded(0);
        setShowLoader(true);

        let cancelled = false;
        const onLoaded = (i: number) => {
            if (cancelled) return;
            ready[i] = 1;
            while (maxReady.current < FRAME_COUNT && ready[maxReady.current]) maxReady.current++;
            setLoaded(maxReady.current / FRAME_COUNT);
            if (i <= Math.round(progressRef.current * (FRAME_COUNT - 1))) {
                lastDrawn.current = -1;
                applyProgress(progressRef.current);
            }
        };

        const loadBatch = async (start: number, end: number, conc: number) => {
            for (let s = start; s < end && !cancelled; s += conc) {
                await Promise.all(
                    Array.from({ length: Math.min(conc, end - s) }, (_, k) => {
                        const idx = s + k;
                        return new Promise<void>(res => {
                            const img = new Image();
                            img.onload = () => { onLoaded(idx); res(); };
                            img.onerror = () => res();
                            img.src = `/hero-frames/${dir}/frame_${String(idx + 1).padStart(PAD, '0')}.webp?v=${FRAME_VERSION}`;
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

    useEffect(() => {
        const resize = () => {
            const sticky = stickyRef.current;
            const canvas = canvasRef.current;
            const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
            const w = Math.round(window.visualViewport?.width ?? window.innerWidth);

            // Keep sticky panel = live viewport (closes mobile URL-bar gap)
            if (sticky) sticky.style.height = `${h}px`;

            if (canvas) {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                canvas.width  = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
                lastDrawn.current = -1;
                applyProgress(progressRef.current);
            }
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });
        window.visualViewport?.addEventListener('resize', resize);
        window.visualViewport?.addEventListener('scroll', resize);
        return () => {
            window.removeEventListener('resize', resize);
            window.visualViewport?.removeEventListener('resize', resize);
            window.visualViewport?.removeEventListener('scroll', resize);
        };
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const mq = window.matchMedia('(max-width:1024px)');
        const fn = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', fn);
        return () => mq.removeEventListener('change', fn);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        applyProgress(0);
    }, []);

    // At 100% — dissolve immediately (no artificial hold)
    useEffect(() => {
        if (loaded < 1) {
            setShowLoader(true);
            return;
        }
        const el = loaderRef.current;
        if (el) el.classList.add('sh-loader--out');
        const id = window.setTimeout(() => setShowLoader(false), 320);
        return () => window.clearTimeout(id);
    }, [loaded]);

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
    const title2Raw = t('home.hero_title_2') || 'В КАЖДОМ\nЗАКАЗЕ';
    // Desktop: two lines. Phones: break into short lines so the title can be set large.
    // RU keeps "ВКУС МЕСТИИ" whole; EN/KA split the first line at its last space too.
    const title1 = t('home.hero_title_1') || 'ВКУС МЕСТИИ';
    const solidLines = isMobile && language !== 'ru' && title1.includes(' ')
        ? [title1.slice(0, title1.lastIndexOf(' ')), title1.slice(title1.lastIndexOf(' ') + 1)]
        : [title1];
    const outlineLines = isMobile
        ? title2Raw.split('\n')
        : [title2Raw.replace(/\n/g, ' ')];
    const loadPct = Math.round(loaded * 100);

    // Phones & tablets: size the title so its widest line exactly fills the column,
    // whatever the language or screen width (desktop keeps its CSS size).
    const titleRef = useRef<HTMLHeadingElement>(null);
    useLayoutEffect(() => {
        const el = titleRef.current;
        const box = el?.parentElement;
        if (!el || !box) return;
        const fit = () => {
            if (!window.matchMedia('(max-width:1024px)').matches) { el.style.fontSize = ''; return; }
            el.style.fontSize = '100px';
            const widths = Array.from(el.querySelectorAll('.sh-title-solid, .sh-title-outline-line')).map((line) => {
                const range = document.createRange();
                range.selectNodeContents(line);
                return range.getBoundingClientRect().width;
            });
            const widest = Math.max(0, ...widths);
            if (!widest) return;
            // Cap at the Russian lockup's scale so short EN/KA lines don't blow up
            const size = Math.min((100 * box.clientWidth * 0.96) / widest, 96, window.innerWidth * 0.125);
            el.style.fontSize = `${size.toFixed(2)}px`;
        };
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(box);
        document.fonts?.ready.then(fit).catch(() => {});
        return () => ro.disconnect();
    }, [language, title2Raw, isMobile]);

    return (
        <div ref={wrapRef} className="sh-track">
            <div ref={stickyRef} className="sh-sticky">

                <div className="sh-fx" aria-hidden="true">
                    <img
                        ref={posterRef}
                        src={POSTER}
                        alt=""
                        className="sh-bg sh-poster"
                        style={{ transition: 'opacity 0.6s ease' }}
                    />
                    <canvas ref={canvasRef} className="sh-bg sh-canvas" />
                    <div className="sh-scrim" />
                    <div className="sh-vignette" />
                    <div className="sh-glow" />
                    <div className="sh-grain" />
                </div>

                <div ref={centerRef} className="sh-center">
                    <div className="sh-center-body">
                        <span className="sh-eyebrow">MestiDelivery · Mestia</span>
                        <h1 ref={titleRef} className={`sh-title sh-title--${language || 'ru'}`}>
                            {solidLines.map((line, i) => (
                                <span key={i} className="sh-title-solid">{line}</span>
                            ))}
                            <span className="sh-title-outline">
                                {outlineLines.map((line, i) => (
                                    <span key={i} className="sh-title-outline-line">{line}</span>
                                ))}
                            </span>
                        </h1>
                        <p className="sh-subtitle">{t('home.hero_subtitle') || 'Доставим любимые блюда быстро и с заботой о качестве.'}</p>
                        <button className="sh-cta" onClick={() => onNavigate('menu')}>
                            <span>{cta}</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Same PC chrome on mobile + desktop */}
                <div ref={hintRef} className="sh-hint">
                    <span>{t('home.scroll_hint') || 'Листай вниз'}</span>
                    <span className="sh-hint-line" />
                </div>
                {showLoader && (
                    <div ref={loaderRef} className="sh-loader">
                        <div className="sh-loader-track">
                            <div className="sh-loader-fill" style={{ width: `${Math.max(loadPct, 1)}%` }} />
                        </div>
                        <span className="sh-loader-label">{loadPct}%</span>
                    </div>
                )}

                {CHAPTERS.map((ch, i) => (
                    <aside
                        key={ch.num}
                        ref={el => { chapterRefs.current[i] = el; }}
                        className={`sh-chapter sh-chapter--${ch.side}${(ch as any).isFinal ? ' sh-chapter--final' : ''}`}
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
                                    {(ch as any).isFinal
                                        ? (t(ch.titleKey) || ch.defaultTitle).split('\n').map((line: string, li: number) => (
                                            <span key={li} className="sh-final-line">{line}</span>
                                        ))
                                        : (t(ch.titleKey) || ch.defaultTitle)}
                                </span>
                            </span>
                        </h2>
                        <p className="sh-ch-desc" style={{ opacity: 0 }}>{t(ch.descKey) || ch.defaultDesc}</p>
                        {(ch as any).isFinal && (
                            <button type="button" className="sh-cta sh-cta--final" onClick={() => onNavigate('menu')}>
                                <span>{cta}</span>
                            </button>
                        )}
                    </aside>
                ))}

                <div className="sh-rail" aria-hidden="true">
                    <div className="sh-rail-track">
                        <div className="sh-rail-fill" id="sh-rail-fill" />
                        <div className="sh-rail-dot" id="sh-rail-dot" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScrollHero;
