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
                <p className="address-delivery-prompt__title">{title}</p>
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
