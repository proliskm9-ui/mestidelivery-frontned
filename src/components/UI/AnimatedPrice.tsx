import React, { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../../utils/formatPrice';

interface AnimatedPriceProps {
    value: number;
    className?: string;
    /** Count duration in ms (keep short: totals change often). */
    duration?: number;
}

/**
 * A price that counts to its new value instead of jumping (e.g. totals when the
 * quantity or tip changes). Renders the final value immediately with reduced motion.
 */
const AnimatedPrice: React.FC<AnimatedPriceProps> = ({ value, className, duration = 250 }) => {
    const [shown, setShown] = useState(value);
    const fromRef = useRef(value);
    const frameRef = useRef<number>();

    useEffect(() => {
        const from = fromRef.current;
        fromRef.current = value;
        if (from === value) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
        const start = performance.now();
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
            setShown(from + (value - from) * eased);
            if (t < 1) frameRef.current = requestAnimationFrame(step);
        };
        cancelAnimationFrame(frameRef.current ?? 0);
        frameRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frameRef.current ?? 0);
    }, [value, duration]);

    return (
        <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }} aria-label={formatPrice(value)}>
            {formatPrice(shown)}
        </span>
    );
};

export default AnimatedPrice;
