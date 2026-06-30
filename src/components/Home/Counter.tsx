import React, { useEffect, useRef, useState } from 'react';

interface CounterProps {
    value: number;
    decimals?: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

/**
 * Counts up from 0 to `value` once when scrolled into view (easeOutCubic).
 * Used for the bento stat tiles so numbers feel alive rather than static.
 */
const Counter: React.FC<CounterProps> = ({ value, decimals = 0, duration = 1500, prefix = '', suffix = '', className }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [display, setDisplay] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !started.current) {
                        started.current = true;
                        const start = performance.now();
                        const step = (now: number) => {
                            const t = Math.min(1, (now - start) / duration);
                            const eased = 1 - Math.pow(1 - t, 3);
                            setDisplay(value * eased);
                            if (t < 1) requestAnimationFrame(step);
                            else setDisplay(value);
                        };
                        requestAnimationFrame(step);
                    }
                });
            },
            { threshold: 0.4 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [value, duration]);

    return (
        <span ref={ref} className={className}>
            {prefix}
            {display.toFixed(decimals)}
            {suffix}
        </span>
    );
};

export default Counter;
