import React, { useRef } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { useBackToClose } from '../../hooks/useBackToClose';
import './Dialog.css';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: React.ReactNode;
    description?: React.ReactNode;
    /** Buttons, stacked full width (primary first). */
    actions?: React.ReactNode;
}

/**
 * Short centered notice/confirmation (alert style). Tap outside, Esc and the
 * system Back close it. Use Sheet for anything with content to scroll or pick.
 */
const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, title, description, actions }) => {
    useBackToClose(open, () => onOpenChange(false));
    // Focus the card itself on open (not the first button, which would show a focus ring on touch)
    const popupRef = useRef<HTMLDivElement>(null);
    return (
        <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
            <BaseDialog.Portal>
                <BaseDialog.Backdrop className="md-dialog-backdrop" />
                <BaseDialog.Popup ref={popupRef} initialFocus={popupRef} className="md-dialog">
                    <BaseDialog.Title className="md-dialog-title">{title}</BaseDialog.Title>
                    {description && <BaseDialog.Description className="md-dialog-description">{description}</BaseDialog.Description>}
                    {actions && <div className="md-dialog-actions">{actions}</div>}
                </BaseDialog.Popup>
            </BaseDialog.Portal>
        </BaseDialog.Root>
    );
};

export const DialogClose = BaseDialog.Close;

export default Dialog;
