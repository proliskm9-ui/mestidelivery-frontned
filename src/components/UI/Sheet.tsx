import React, { useEffect, useId, useRef } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { useLocation, useNavigate } from 'react-router-dom';
import './Sheet.css';

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    /** Sticky area under the scrollable content (primary actions). */
    footer?: React.ReactNode;
    /** Close the sheet with the system Back button / swipe-back instead of leaving the page. */
    closeOnBack?: boolean;
    /** Removes default body padding (e.g. for full-bleed dish photos). */
    flush?: boolean;
    /** Green circular close button in the top-right corner. */
    showClose?: boolean;
    className?: string;
    children?: React.ReactNode;
}

/**
 * Bottom sheet used by every modal surface in the client app.
 * Swipe down to dismiss (velocity-aware), backdrop tap, Esc and Back all close it;
 * focus is trapped and page scroll is locked while open.
 */
const Sheet: React.FC<SheetProps> = ({
    open,
    onOpenChange,
    title,
    description,
    footer,
    closeOnBack = true,
    flush = false,
    showClose = true,
    className,
    children,
}) => {
    const sheetKey = useId();
    const location = useLocation();
    const navigate = useNavigate();
    const pushedRef = useRef(false);

    // Give the open sheet its own history entry, so Back closes it instead of the page.
    useEffect(() => {
        if (!closeOnBack) return;
        if (open && !pushedRef.current) {
            pushedRef.current = true;
            navigate(location, { state: { ...(location.state as object), sheet: sheetKey } });
        } else if (!open && pushedRef.current) {
            // Closed programmatically by the parent: drop our entry so Back isn't "eaten".
            pushedRef.current = false;
            navigate(-1);
        }
    }, [open, closeOnBack]); // eslint-disable-line react-hooks/exhaustive-deps

    // Back pressed: our entry was popped → close.
    useEffect(() => {
        if (!pushedRef.current) return;
        const state = location.state as { sheet?: string } | null;
        if (state?.sheet !== sheetKey) {
            pushedRef.current = false;
            if (open) onOpenChange(false);
        }
    }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleOpenChange = (next: boolean) => {
        if (!next && pushedRef.current) {
            // Closed from the UI: drop our history entry; the location effect then settles state.
            pushedRef.current = false;
            navigate(-1);
        }
        onOpenChange(next);
    };

    return (
        <Drawer.Root open={open} onOpenChange={handleOpenChange}>
            <Drawer.Portal>
                <Drawer.Backdrop className="md-sheet-backdrop" />
                <Drawer.Viewport className="md-sheet-viewport">
                    <Drawer.Popup className={['md-sheet', className].filter(Boolean).join(' ')}>
                        <div className="md-sheet-handle" aria-hidden="true" />
                        {showClose && (
                            <Drawer.Close className="md-sheet-close" aria-label="Close">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </Drawer.Close>
                        )}
                        <Drawer.Content className={flush ? 'md-sheet-body md-sheet-body--flush' : 'md-sheet-body'}>
                            {(title || description) && (
                                <header className={showClose ? 'md-sheet-header md-sheet-header--with-close' : 'md-sheet-header'}>
                                    {title && <Drawer.Title className="md-sheet-title">{title}</Drawer.Title>}
                                    {description && (
                                        <Drawer.Description className="md-sheet-description">{description}</Drawer.Description>
                                    )}
                                </header>
                            )}
                            {children}
                        </Drawer.Content>
                        {footer && <div className="md-sheet-footer">{footer}</div>}
                    </Drawer.Popup>
                </Drawer.Viewport>
            </Drawer.Portal>
        </Drawer.Root>
    );
};

export const SheetClose = Drawer.Close;

export default Sheet;
