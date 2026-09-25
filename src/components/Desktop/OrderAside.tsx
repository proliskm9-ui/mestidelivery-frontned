import React from 'react';
import { Clock } from 'lucide-react';
import SummaryBlock from '../../Оплата/blocks/SummaryBlock/SummaryBlock';
import { formatPrice } from '../../utils/formatPrice';
import { useLanguage } from '../../translations/LanguageContext';
import './OrderAside.css';

interface OrderAsideProps {
    restaurantName?: string | null;
    eta?: string | null;
    items: { product: any; quantity: number }[];
    subtotal: number;
    baseDeliveryFee: number;
    deliveryDiscount?: number;
    serviceFee: number;
    packagingFee?: number;
    tip?: number;
    total: number;
    freeDeliveryLeft?: number;
    ctaLabel?: string;
    onCta?: () => void;
    ctaDisabled?: boolean;
    /** Extra content under the button (notes, links). */
    footer?: React.ReactNode;
    showItems?: boolean;
}

/** The sticky "Your order" card shared by cart, checkout and payment on desktop. */
const OrderAside: React.FC<OrderAsideProps> = ({
    restaurantName,
    eta,
    items,
    subtotal,
    baseDeliveryFee,
    deliveryDiscount = 0,
    serviceFee,
    packagingFee = 0,
    tip = 0,
    total,
    freeDeliveryLeft = 0,
    ctaLabel,
    onCta,
    ctaDisabled,
    footer,
    showItems = true,
}) => {
    const { t } = useLanguage();
    return (
        <aside className="dfs-aside">
            <div className="oa-card">
                <div className="oa-head">
                    <h2 className="oa-title">{t('checkout.summary_title')}</h2>
                    {(restaurantName || eta) && (
                        <p className="oa-meta">
                            {restaurantName && <span className="oa-rest">{restaurantName}</span>}
                            {eta && (
                                <span className="oa-eta"><Clock size={14} strokeWidth={2.2} aria-hidden="true" />{eta}</span>
                            )}
                        </p>
                    )}
                </div>

                <SummaryBlock
                    items={items}
                    subtotal={subtotal}
                    baseDeliveryFee={baseDeliveryFee}
                    deliveryDiscount={deliveryDiscount}
                    serviceFee={serviceFee}
                    packagingFee={packagingFee}
                    tip={tip}
                    total={total}
                    freeDeliveryLeft={freeDeliveryLeft}
                    showTotal={false}
                    showItems={showItems}
                />

                <div className="oa-total">
                    <span>{t('common.total')}</span>
                    <strong>{formatPrice(total)}</strong>
                </div>

                {ctaLabel && onCta && (
                    <button type="button" className="oa-cta" onClick={onCta} disabled={ctaDisabled}>
                        {ctaLabel}
                    </button>
                )}
                {footer}
            </div>
        </aside>
    );
};

export default OrderAside;
