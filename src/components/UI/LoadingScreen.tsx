import React, { useEffect, useRef, useState } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
    onComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [gone, setGone] = useState(false);

    useEffect(() => {
        // Automatically start the hide animation after the sequence completes
        // Total sequence is roughly 1500ms (max delay 540ms + max duration 980ms)
        // Hold for 1200ms total before fading out
        const t = setTimeout(() => {
            if (ref.current) {
                ref.current.classList.add("loading-hide");
            }
        }, 1200);

        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onEnd = (e: AnimationEvent) => {
            // Match the keyframe animation name in LoadingScreen.css
            if (e.animationName === "loadingOut") {
                setGone(true);
                if (onComplete) onComplete();
            }
        };
        el.addEventListener("animationend", onEnd as EventListener);
        return () => el.removeEventListener("animationend", onEnd as EventListener);
    }, [onComplete]);

    if (gone) return null;

    return (
        <div ref={ref} className="loading-screen" aria-hidden="true">
            <div className="loading-phone">
                {/* LOGO */}
                <img className="loading-logo" src="/Assets/Loading/logo.png" alt="logo" />

                {/* ANIMATED MOUNTAIN SCENE */}
                <div className="scene">
                    <img className="loading-layer layer-mountains-bg" src="/Assets/Loading/mountains-background.png" alt="" />
                    <img className="loading-layer layer-mountains-fg" src="/Assets/Loading/mountains-foreground.png" alt="" />
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
