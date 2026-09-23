import { flushSync } from 'react-dom';

/** Shared-element transitions (View Transitions API). Falls back to a plain update. */
export const canMorph = (): boolean =>
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Resolve once `selector` exists (or after `timeout` ms). Polls with setTimeout:
 *  rendering (and so requestAnimationFrame) is paused during a view-transition update. */
function waitForElement(selector: string, timeout: number): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
        const start = performance.now();
        const tick = () => {
            const el = document.querySelector<HTMLElement>(selector);
            if (el || performance.now() - start > timeout) return resolve(el);
            setTimeout(tick, 16);
        };
        tick();
    });
}

/**
 * Navigate while `from` (e.g. a catalog photo) grows into the element matching
 * `targetSelector` on the next screen (e.g. the restaurant cover).
 */
export function morphNavigate(from: HTMLElement | null | undefined, name: string, update: () => void, targetSelector: string): void {
    if (!from || !canMorph()) { update(); return; }
    from.style.viewTransitionName = name;
    const root = document.documentElement;
    root.classList.add('vt-nav');
    let target: HTMLElement | null = null;
    const vt = (document as any).startViewTransition(async () => {
        from.style.viewTransitionName = '';
        flushSync(update);
        target = await waitForElement(targetSelector, 800);
        if (target) target.style.viewTransitionName = name;
    });
    vt.finished.finally(() => {
        if (target) target.style.viewTransitionName = '';
        root.classList.remove('vt-nav');
    });
}
