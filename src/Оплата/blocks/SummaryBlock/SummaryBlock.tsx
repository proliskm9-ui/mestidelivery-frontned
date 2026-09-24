import React, { useState } from 'react';
import './SummaryBlock.css';
import { useLanguage } from '../../../translations/LanguageContext';
import { formatPrice } from '../../../utils/formatPrice';
import { pickI18nText } from '../../../utils/i18nContent';

export interface SummaryDiscount {
  /** Shown as a row, e.g. "Промокод SUMMER" or "Бонусы". */
  label: string;
  /** Positive number; rendered as "−5.00 ₾". */
  amount: number;
}

interface SummaryBlockProps {
  items: { product: any; quantity: number }[];
  subtotal: number;
  /** Zone fee before any promo. */
  baseDeliveryFee: number;
  /** First-order promo discount on delivery. */
  deliveryDiscount: number;
  serviceFee: number;
  tip: number;
  /** Extra discounts confirmed by the server (promo code, bonuses). Rows appear only when present. */
  discounts?: SummaryDiscount[];
  /** New client below the promo threshold: how much is left to free delivery. */
  freeDeliveryLeft?: number;
}

/**
 * "Your order": what's in it at a glance; tap to see the price breakdown.
 * The total lives in the pay bar below, so it isn't repeated here.
 */
const SummaryBlock: React.FC<SummaryBlockProps> = ({
  items,
  subtotal,
  baseDeliveryFee,
  deliveryDiscount,
  serviceFee,
  tip,
  discounts = [],
  freeDeliveryLeft = 0,
}) => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const deliveryFee = Math.max(0, baseDeliveryFee - deliveryDiscount);
  const preview = items.map(({ product, quantity }) => `${pickI18nText(product.name, language)} × ${quantity}`).join(', ');

  return (
    <section className={open ? 'summary-card is-open' : 'summary-card'}>
      <button type="button" className="summary-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="summary-head-text">
          <span className="summary-title">{t('checkout.summary_title')}</span>
          {!open && <span className="summary-preview">{preview}</span>}
        </span>
        <svg className="summary-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="summary-body">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="summary-row">
              <span className="summary-item-name">
                {pickI18nText(product.name, language)} <span className="summary-qty">× {quantity}</span>
              </span>
              <span className="summary-row-value">{formatPrice(Number(product.price) * quantity)}</span>
            </div>
          ))}

          <div className="summary-divider" />

          <div className="summary-row">
            <span className="summary-row-title summary-muted">{t('cart.items')}</span>
            <span className="summary-row-value">{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-row-title summary-muted">
              {t('cart.delivery')}
              {deliveryDiscount > 0 && <span className="summary-note">{t('checkout.first_order_promo')}</span>}
              {deliveryDiscount === 0 && freeDeliveryLeft > 0 && (
                <span className="summary-note">{t('checkout.free_delivery_left').replace('{sum}', formatPrice(freeDeliveryLeft))}</span>
              )}
            </span>
            <span className="summary-row-value">
              {deliveryDiscount > 0 && <s className="summary-old">{formatPrice(baseDeliveryFee)}</s>}
              {formatPrice(deliveryFee)}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-row-title summary-muted">{t('cart.service')}</span>
            <span className="summary-row-value">{formatPrice(serviceFee)}</span>
          </div>
          {tip > 0 && (
            <div className="summary-row">
              <span className="summary-row-title summary-muted">{t('checkout.tips_title')}</span>
              <span className="summary-row-value">{formatPrice(tip)}</span>
            </div>
          )}
          {discounts.map((d) => (
            <div className="summary-row" key={d.label}>
              <span className="summary-row-title summary-muted">{d.label}</span>
              <span className="summary-row-value summary-accent">−{formatPrice(d.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SummaryBlock;
