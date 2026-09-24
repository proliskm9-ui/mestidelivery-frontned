import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

/**
 * App-wide toast host. Mount once; call `toast()` / `toast.error()` from 'sonner' anywhere.
 * Replaces blocking window.alert() for errors and confirmations.
 */
const Toaster: React.FC = () => (
    <SonnerToaster
        theme="dark"
        position="top-center"
        visibleToasts={3}
        offset={{ top: 'calc(var(--safe-top) + 12px)' }}
        mobileOffset={{ top: 'calc(var(--safe-top) + 8px)', left: 'var(--gutter)', right: 'var(--gutter)' }}
        style={
            {
                '--normal-bg': '#1a1a1d',
                '--normal-border': 'var(--color-stroke)',
                '--normal-text': 'var(--color-text)',
                '--success-bg': '#1a1a1d',
                '--success-border': 'rgba(var(--color-accent-rgb), 0.28)',
                '--success-text': 'var(--color-text)',
                '--error-bg': '#1a1a1d',
                '--error-border': 'rgba(255, 69, 58, 0.32)',
                '--error-text': 'var(--color-text)',
                '--border-radius': 'var(--radius-md)',
                fontFamily: 'var(--font-text)',
                zIndex: 'var(--z-toast)',
            } as React.CSSProperties
        }
    />
);

export default Toaster;
