import React, { useEffect, useState } from 'react';
import { PageSkeleton } from './Skeleton';
import './LoadingScreen.css';

interface LoadingScreenProps {
    onComplete?: () => void;
}

const DESKTOP_MQ = '(min-width: 1025px)';

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
    const [gone, setGone] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia(DESKTOP_MQ).matches
    );

    useEffect(() => {
        const mq = window.matchMedia(DESKTOP_MQ);
        const onChange = () => setIsDesktop(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        const delay = isDesktop ? 1100 : 1600;
        const t = setTimeout(() => {
            setGone(true);
            onComplete?.();
        }, delay);

        return () => clearTimeout(t);
        // Intentionally omit onComplete — parent often passes an inline fn
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDesktop]);

    if (gone) return null;

    if (isDesktop) {
        return (
            <div className="loading-screen loading-screen--skeleton" role="status" aria-label="Loading">
                <PageSkeleton variant="menu" />
            </div>
        );
    }

    return (
        <div className="loading-screen" aria-hidden="true">
            <div className="loading-phone">
                <img className="loading-logo" src="/Assets/Loading/logo.png" alt="logo" />

                <div className="scene">
                    <img className="loading-layer layer-mountains-bg" src="/Assets/Loading/mountains-background.png" alt="" />
                    <img className="loading-layer layer-mountains-fg" src="/Assets/Loading/mountains-foreground.png" alt="" />
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
