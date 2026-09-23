import { useEffect, useId, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Makes the system Back button / swipe-back close an open overlay (sheet, modal)
 * instead of leaving the page — the way native apps behave.
 *
 * While `open`, the overlay owns a history entry (same URL; its id is pushed onto
 * `state.overlays`, so nested overlays close one at a time).
 * - Back pressed      → entry popped → `onClose()` is called.
 * - Closed by the UI  → set open=false as usual: the entry is removed so Back
 *                        isn't "eaten" later.
 */
export function useBackToClose(open: boolean, onClose: () => void, enabled = true): void {
    const key = useId();
    const location = useLocation();
    const navigate = useNavigate();
    const pushedRef = useRef(false);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!enabled) return;
        if (open && !pushedRef.current) {
            pushedRef.current = true;
            const prev = (location.state as { overlays?: string[] } | null) || {};
            navigate(location, { state: { ...prev, overlays: [...(prev.overlays || []), key] } });
        } else if (!open && pushedRef.current) {
            // Closed from the UI: drop our entry.
            pushedRef.current = false;
            navigate(-1);
        }
    }, [open, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!pushedRef.current) return;
        const overlays = (location.state as { overlays?: string[] } | null)?.overlays || [];
        if (!overlays.includes(key)) {
            // Our entry was popped by Back.
            pushedRef.current = false;
            onCloseRef.current();
        }
    }, [location]); // eslint-disable-line react-hooks/exhaustive-deps
}
