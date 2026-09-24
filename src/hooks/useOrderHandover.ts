import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * After an order exists server-side, hand the user over to the order status exactly once.
 *
 * - Leaving the payment page (system back etc.) finishes the hand-over instead of dropping
 *   the user into checkout with a full cart (which would allow a duplicate order).
 * - Online payment: Keepz opens in another window. When the user comes back, `replayKey`
 *   bumps (replay the "order placed" animation) and the status opens 2.6 s later.
 * - If the app never noticed the switch (e.g. Keepz opened as an overlay), the status
 *   opens by itself after 6 s.
 */
export function useOrderHandover(
    onPaymentComplete: (method: string, orderId: number) => void,
    waitingForPayment: boolean,
    orderId: number | null,
) {
    const completedRef = useRef(false);
    const createdOrderRef = useRef<{ id: number; method: string } | null>(null);
    const onCompleteRef = useRef(onPaymentComplete);
    onCompleteRef.current = onPaymentComplete;
    const leftAppRef = useRef(false);
    const [replayKey, setReplayKey] = useState(0);
    const [returned, setReturned] = useState(false);

    const complete = useCallback((method: string, id: number) => {
        if (completedRef.current) return;
        completedRef.current = true;
        try {
            onCompleteRef.current(method, id);
        } catch (navError) {
            console.error('Order created but post-success navigation failed', navError);
        }
    }, []);

    const rememberOrder = useCallback((id: number, method: string) => {
        createdOrderRef.current = { id, method };
    }, []);

    useEffect(() => () => {
        const created = createdOrderRef.current;
        if (created && !completedRef.current) complete(created.method, created.id);
    }, [complete]);

    useEffect(() => {
        if (!waitingForPayment) return;
        let left = document.visibilityState === 'hidden';
        if (left) leftAppRef.current = true;
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') { left = true; leftAppRef.current = true; return; }
            if (!left) return;
            left = false;
            setReplayKey((k) => k + 1);
            setReturned(true);
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [waitingForPayment]);

    useEffect(() => {
        if (!returned || !orderId || !waitingForPayment) return;
        const timer = setTimeout(() => complete('card', orderId), 2600);
        return () => clearTimeout(timer);
    }, [returned, orderId, waitingForPayment, complete]);

    useEffect(() => {
        if (!orderId || !waitingForPayment) return;
        const timer = setTimeout(() => { if (!leftAppRef.current) complete('card', orderId); }, 6000);
        return () => clearTimeout(timer);
    }, [orderId, waitingForPayment, complete]);

    return { complete, rememberOrder, replayKey };
}
