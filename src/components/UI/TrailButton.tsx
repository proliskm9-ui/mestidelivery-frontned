import React, { useRef } from 'react';


/* 
  We will implement a button with a "trail" effect on hover.
  Since we want a "trail in the theme of the application" (Green/Liquid),
  we can use a pseudo-element that follows the mouse or a simple glow effect.
*/

const TrailButton: React.FC<{ onClick?: () => void; children: React.ReactNode }> = ({ onClick, children }) => {
    const btnRef = useRef<HTMLButtonElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            btnRef.current.style.setProperty('--x', `${x}px`);
            btnRef.current.style.setProperty('--y', `${y}px`);
        }
    };

    return (
        <button
            ref={btnRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            className="trail-button"
            style={{
                position: 'relative',
                background: '#0a0a0a', // Almost black
                color: '#fff',
                border: 'none',
                borderRadius: '50px', // Slightly rounder for height
                padding: '25px 60px',
                fontSize: '1.1rem',
                fontWeight: '800', // Inter ExtraBold
                textTransform: 'uppercase',
                letterSpacing: '2px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                outline: 'none',
                fontFamily: '"Inter", sans-serif',
                zIndex: 1
            }}
        >
            <span style={{ position: 'relative', zIndex: 2 }}>{children}</span>
            {/* The trail glow effect */}
            <div
                className="trail-glow"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(33, 234, 124, 0.4) 0%, transparent 50%)',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    zIndex: 1,
                    pointerEvents: 'none',
                    mixBlendMode: 'screen'
                }}
            />
            <style>{`
                .trail-button:hover {
                    /* border-color removed */
                    box-shadow: 0 0 20px rgba(33, 234, 124, 0.2);
                    transform: scale(1.02);
                }
                .trail-button:hover .trail-glow {
                    opacity: 1 !important;
                }
                .trail-button:active {
                    transform: scale(0.98);
                }
            `}</style>
        </button>
    );
};

export default TrailButton;
