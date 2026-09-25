import React from 'react';
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
  /** Restaurant packaging (Sunset). Row appears only when > 0. */
  packagingFee?: number;
  tip: number;
  /** Extra discounts confirmed by the server (promo code, bonuses). Rows appear only when present. */
  discounts?: SummaryDiscount[];
  /** New client below the promo threshold: how much is left to free delivery. */
  freeDeliveryLeft?: number;
  total: number;
  /** The desktop sidebar shows its own large total under the breakdown. */
  showTotal?: boolean;
  /** The desktop cart already lists the dishes on the left. */
  showItems?: boolean;
}

/** Order breakdown shown in the "Your order" sheet (opened from the pay bar total). */
const SummaryBlock: React.FC<SummaryBlockProps> = ({
  items,
  subtotal,
  baseDeliveryFee,
  deliveryDiscount,
  serviceFee,
  packagingFee = 0,
  tip,
  discounts = [],
  freeDeliveryLeft = 0,
  total,
  showTotal = true,
  showItems = true,
}) => {
  const { t, language } = useLanguage();
  const deliveryFee = Math.max(0, baseDeliveryFee - deliveryDiscount);

  return (
    <div className="summary-body">
          {showItems && items.map(({ product, quantity }) => (
            <div key={product.id} className="summary-row">
              <span className="summary-item-name">
                {pickI18nText(product.name, language)} <span className="summary-qty">× {quantity}</span>
              </span>
              <span className="summary-row-value">{formatPrice(Number(product.price) * quantity)}</span>
            </div>
          ))}

          {showItems && <div className="summary-divider" />}

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
          {packagingFee > 0 && (
            <div className="summary-row">
              <span className="summary-row-title summary-muted">{t('checkout.packaging')}</span>
              <span className="summary-row-value">{formatPrice(packagingFee)}</span>
            </div>
          )}
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

          {showTotal && (
            <div className="summary-total">
              <span>{t('common.total')}</span>
              <span>{formatPrice(total)}</span>
            </div>
          )}
    </div>
  );
};

export default SummaryBlock;
