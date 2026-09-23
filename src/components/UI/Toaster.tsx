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
                '--normal-bg': 'var(--color-surface-2)',
                '--normal-border': 'var(--color-border)',
                '--normal-text': 'var(--color-text)',
                '--success-bg': 'var(--color-surface-2)',
                '--success-border': 'rgba(var(--color-accent-rgb), 0.28)',
                '--success-text': 'var(--color-text)',
                '--error-bg': 'var(--color-surface-2)',
                '--error-border': 'rgba(255, 69, 58, 0.32)',
                '--error-text': 'var(--color-text)',
                '--border-radius': 'var(--radius-lg)',
                fontFamily: 'var(--font-text)',
                zIndex: 'var(--z-toast)',
            } as React.CSSProperties
        }
    />
);

export default Toaster;
