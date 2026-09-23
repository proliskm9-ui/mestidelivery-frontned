import React from 'react';
import { createPortal } from 'react-dom';
import './AddressDeliveryPrompt.css';

interface AddressDeliveryPromptProps {
    title: string;
    laterLabel: string;
    selectLabel: string;
    onLater: () => void;
    onSelect: () => void;
}

const AddressDeliveryPrompt: React.FC<AddressDeliveryPromptProps> = ({
    title,
    laterLabel,
    selectLabel,
    onLater,
    onSelect,
}) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="address-delivery-prompt-wrap">
            <div className="address-delivery-prompt" role="status" aria-live="polite" aria-label={title}>
                <div className="address-delivery-prompt__head">
                    <span className="address-delivery-prompt__icon" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                    </span>
                    <p className="address-delivery-prompt__title">{title}</p>
                </div>
                <div className="address-delivery-prompt__actions">
                    <button
                        type="button"
                        className="address-delivery-prompt__btn address-delivery-prompt__btn--later"
                        onClick={onLater}
                    >
                        {laterLabel}
                    </button>
                    <button
                        type="button"
                        className="address-delivery-prompt__btn address-delivery-prompt__btn--select"
                        onClick={onSelect}
                    >
                        {selectLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AddressDeliveryPrompt;
