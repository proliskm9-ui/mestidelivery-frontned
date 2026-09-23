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
  total: number;
  /** Extra discounts confirmed by the server (promo code, bonuses). Rows appear only when present. */
  discounts?: SummaryDiscount[];
  /** New client below the promo threshold: how much is left to free delivery. */
  freeDeliveryLeft?: number;
}

/** "Ваш заказ": order contents and the full price breakdown above the pay button. */
const SummaryBlock: React.FC<SummaryBlockProps> = ({
  items,
  subtotal,
  baseDeliveryFee,
  deliveryDiscount,
  serviceFee,
  tip,
  total,
  discounts = [],
  freeDeliveryLeft = 0,
}) => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const deliveryFee = Math.max(0, baseDeliveryFee - deliveryDiscount);

  return (
    <section className="summary-card">
      <h2 className="summary-title">{t('checkout.summary_title')}</h2>

      <button
        type="button"
        className="summary-row summary-row--toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="summary-row-main">
          <span className="summary-row-title">{t('cart.items')} ({count})</span>
          <span className="summary-row-sub">{open ? t('checkout.hide_items') : t('checkout.show_items')}</span>
        </span>
        <span className="summary-row-value">{formatPrice(subtotal)}</span>
        <svg className={open ? 'summary-chevron is-open' : 'summary-chevron'} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="summary-items">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="summary-item">
              <span className="summary-item-name">{pickI18nText(product.name, language)}</span>
              <span className="summary-item-qty">× {quantity}</span>
              <span className="summary-item-price">{formatPrice(Number(product.price) * quantity)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="summary-row">
        <span className="summary-row-main">
          <span className="summary-row-title">{t('cart.delivery')}</span>
          {deliveryDiscount > 0 && <span className="summary-row-sub summary-row-sub--accent">{t('checkout.first_order_promo')}</span>}
        </span>
        {deliveryDiscount > 0 && <s className="summary-old">{formatPrice(baseDeliveryFee)}</s>}
        <span className={deliveryDiscount > 0 ? 'summary-row-value summary-row-value--accent' : 'summary-row-value'}>
          {formatPrice(deliveryFee)}
        </span>
      </div>

      <div className="summary-row">
        <span className="summary-row-main">
          <span className="summary-row-title">{t('cart.service')}</span>
          <span className="summary-row-sub">{t('delivery.service_fee_hint')}</span>
        </span>
        <span className="summary-row-value">{formatPrice(serviceFee)}</span>
      </div>

      {tip > 0 && (
        <div className="summary-row">
          <span className="summary-row-main">
            <span className="summary-row-title">{t('checkout.tips_title')}</span>
          </span>
          <span className="summary-row-value">{formatPrice(tip)}</span>
        </div>
      )}

      {discounts.map((d) => (
        <div className="summary-row" key={d.label}>
          <span className="summary-row-main">
            <span className="summary-row-title">{d.label}</span>
          </span>
          <span className="summary-row-value summary-row-value--accent">−{formatPrice(d.amount)}</span>
        </div>
      ))}

      {freeDeliveryLeft > 0 && (
        <p className="summary-hint">
          {t('checkout.free_delivery_left').replace('{sum}', formatPrice(freeDeliveryLeft))}
        </p>
      )}

      <div className="summary-total">
        <span>{t('common.total')}</span>
        <span className="summary-total-value">{formatPrice(total)}</span>
      </div>
    </section>
  );
};

export default SummaryBlock;
