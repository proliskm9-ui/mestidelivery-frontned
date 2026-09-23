import React, { useState, useEffect, useMemo } from 'react';
import './CheckoutPage.css';
import { useLanguage } from '../translations/LanguageContext';
import { api } from '../services/api';
import { useDeliveryLocationOptional } from '../delivery/DeliveryLocationContext';
import {
  closedBadgeText,
  generateRestaurantSlots,
  isRestaurantOpenNow,
} from '../utils/workingHours';

// === БЛОКИ ===
import HeaderBlock from './blocks/HeaderBlock/HeaderBlock';
import { addressText, detectZoneFromText, deviceHasOrdered, accountHasOrders, markDeviceOrdered } from '../utils/deliveryPromo';
import AddressBlock, { AddressData } from './blocks/AddressBlock/AddressBlock';
import SummaryBlock from './blocks/SummaryBlock/SummaryBlock';
import TipsBlock from './blocks/TipsBlock/TipsBlock';
import FooterBlock from './blocks/FooterBlock/FooterBlock';

// === МОДАЛКИ ===
import TimeModal from './modals/TimeModal/TimeModal';
import PlaceTypeModal from './modals/PlaceTypeModal/PlaceTypeModal';
import PromoCodeModal from './modals/PromoCodeModal/PromoCodeModal';
import CustomTipModal from './modals/CustomTipModal/CustomTipModal';
import CommentModal from './modals/CommentModal/CommentModal';
import PhoneModal from './modals/PhoneModal/PhoneModal';
import MapModal from './modals/MapModal/MapModal';
import './modals/sheets.css';
import { toast } from 'sonner';
import { useBackToClose } from '../hooks/useBackToClose';

// === ТИПЫ ===
type DeliveryType = 'standard' | 'scheduled';
type PaymentMethod = 'cash' | 'card' | 'card-eu';

interface OrderData {
  deliveryType: DeliveryType;
  scheduledTime: string | null;
  address: AddressData;
  payment: PaymentMethod;
  promoCode: string;
  tip: number;
}

interface ModalState {
  time: boolean;
  place: boolean;
  promo: boolean;
  customTip: boolean;
  comment: boolean;
  phone: boolean;
  map: boolean;
}

export interface CheckoutOrderData {
  deliveryType: DeliveryType;
  scheduledTime: string | null;
  address: AddressData;
  payment: PaymentMethod;
  promoCode: string;
  tip: number;
  total: number;
  restaurantComment?: string;
  cutleryCount?: number;
  /** Зональная цена доставки — должна уйти в createOrder. */
  deliveryFee?: number;
  /** Скидка на доставку за первый заказ и итоговая цена доставки для клиента. */
  discount?: number;
  clientDeliveryFee?: number;
  serviceFee?: number;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
}

interface CheckoutPageProps {
  totalAmount?: number;
  cartItems?: any[];
  onBack?: () => void;
  onProceedToPayment?: (orderData: CheckoutOrderData) => void;
  comment?: string;
  cutleryCount?: number;
  initialAddress?: any;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBack,
  onProceedToPayment,
  comment: restaurantComment,
  cutleryCount,
  initialAddress,
  cartItems
}) => {
  const { t, language } = useLanguage();
  const deliveryLoc = useDeliveryLocationOptional();
  const [workingHours, setWorkingHours] = useState('');
  // Load saved address from prop or localStorage
  const savedAddressRaw = localStorage.getItem('user_address');
  const savedAddress = initialAddress || (savedAddressRaw ? (() => { try { return JSON.parse(savedAddressRaw); } catch { return null; } })() : null);
  const savedPhone = localStorage.getItem('user_phone') || '';
  // 1. ЕДИНОЕ СОСТОЯНИЕ ЗАКАЗА
  const [orderData, setOrderData] = useState<OrderData>({
    deliveryType: 'standard',
    scheduledTime: null,

    address: {
      type: 'home',
      street: savedAddress?.street || '',
      house: savedAddress?.house || '',
      apartment: savedAddress?.apartment || '',
      floor: savedAddress?.floor || '',
      hotelName: '',
      room: '',
      deliveryNote: '',
      geo: savedAddress?.geo || '',
      landmark: '',
      comment: savedAddress?.comment || '',
      phone: savedAddress?.phone || savedPhone || '',
      // Zone from address text first (prod), then saved zone unless it was 'outside'
      deliveryZone: detectZoneFromText(addressText(savedAddress, false))
        || (savedAddress?.deliveryZone && savedAddress.deliveryZone !== 'outside' ? savedAddress.deliveryZone : 'center')
    },

    payment: 'cash',
    promoCode: '',
    tip: 0
  });

  const rid = cartItems?.[0]?.product?.restaurant_id || null;
  useEffect(() => {
    if (!rid) return;
    let cancelled = false;
    api.getRestaurant(String(rid)).then((r) => {
      if (cancelled || !r) return;
      const hours = r.working_hours || '';
      setWorkingHours(hours);
      if (!isRestaurantOpenNow(hours)) {
        const slots = generateRestaurantSlots(hours);
        setOrderData((prev) => ({
          ...prev,
          deliveryType: 'scheduled',
          scheduledTime: slots[0]?.value || prev.scheduledTime,
        }));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [rid]);

  const restaurantOpen = useMemo(() => isRestaurantOpenNow(workingHours), [workingHours]);
  const closedHint = useMemo(() => closedBadgeText(workingHours, language), [workingHours, language]);
  const scheduledDisplay = useMemo(() => {
    if (!orderData.scheduledTime) return null;
    const slots = generateRestaurantSlots(workingHours);
    return slots.find((s) => s.value === orderData.scheduledTime)?.label || orderData.scheduledTime;
  }, [orderData.scheduledTime, workingHours]);

  // 2. СОСТОЯНИЕ МОДАЛОК
  const [modals, setModals] = useState<ModalState>({
    time: false,
    place: false,
    promo: false,
    customTip: false,
    comment: false,
    phone: false,
    map: false,
  });
  // System Back closes whichever checkout sheet is open instead of leaving checkout
  // Sheets handle Back themselves; the map (custom full-height modal) and phone editor need it here
  useBackToClose(modals.map || modals.phone, () =>
    setModals((prev) => ({ ...prev, map: false, phone: false }))
  );

  // Хелпер для открытия/закрытия
  const toggleModal = (name: keyof ModalState, isOpen: boolean): void => {
    setModals(prev => ({ ...prev, [name]: isOpen }));
  };

  // 3. ОБНОВЛЕНИЕ ДАННЫХ
  const updateOrder = <K extends keyof OrderData>(field: K, value: OrderData[K]): void => {
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field: string, value: string): void => {
    setOrderData(prev => {
      const address = { ...prev.address, [field]: value };
      const zone = detectZoneFromText(addressText(address));
      if (zone) address.deliveryZone = zone;
      return { ...prev, address };
    });
  };

  // Логика выбора времени (сброс на Стандарт)
  const handleTimeSelect = (timeSlot: string | null): void => {
    if (timeSlot === null) {
      if (!restaurantOpen) {
        toggleModal('time', false);
        return;
      }
      setOrderData(prev => ({
        ...prev,
        scheduledTime: null,
        deliveryType: 'standard'
      }));
    } else {
      setOrderData(prev => ({
        ...prev,
        scheduledTime: timeSlot,
        deliveryType: 'scheduled'
      }));
    }
    toggleModal('time', false);
  };

  // Логика выбора типа жилья
  const handlePlaceTypeSelect = (typeId: 'home' | 'hotel' | 'map'): void => {
    updateAddress('type', typeId);
    toggleModal('place', false);
  };

  const subtotal = cartItems?.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0) || 0;
  // Prod pricing: fixed fee by zone (center 8 / airport 12 / other 20); first-order promo for orders >= 100 ₾
  const isFirstOrder = !deviceHasOrdered() && (!localStorage.getItem('token') || !accountHasOrders());
  const detectedZone = detectZoneFromText(addressText(orderData.address), true);
  const pricedZone = detectedZone
    || (orderData.address.deliveryZone && orderData.address.deliveryZone !== 'outside'
      ? orderData.address.deliveryZone
      : (deliveryLoc?.zoneId && deliveryLoc.zoneId !== 'outside' ? deliveryLoc.zoneId : 'center'));
  const baseDeliveryFee = pricedZone === 'center' ? 8 : pricedZone === 'airport' ? 12 : 20;
  const deliveryDiscount = isFirstOrder && subtotal >= 100 ? (baseDeliveryFee <= 12 ? baseDeliveryFee : 10) : 0;
  const deliveryFee = Math.max(0, baseDeliveryFee - deliveryDiscount);
  const serviceFee = subtotal > 0 ? Math.max(0.99, Math.min(2.00, subtotal * 0.06)) : 0;
  
  const finalTotal = subtotal + deliveryFee + serviceFee;
  const totalAmount = finalTotal + orderData.tip;

  // Навигация назад
  const handleBack = (): void => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Обработка оплаты
  const handlePay = (): void => {
    const addr = orderData.address;
    const hasLocation =
      addr.type === 'map'
        ? !!addr.geo?.trim()
        : addr.type === 'hotel'
          ? !!(addr.hotelName?.trim() && addr.room?.trim())
          : !!addr.street?.trim();

    if (!hasLocation || !addr.phone?.trim()) {
      toast.error(t('checkout.fill_alert'));
      return;
    }

    if (!restaurantOpen && orderData.deliveryType !== 'scheduled') {
      toast.error(closedHint || t('checkout.closed_pick_time'));
      return;
    }
    if (orderData.deliveryType === 'scheduled' && !orderData.scheduledTime) {
      toast.error(t('checkout.pick_time_alert'));
      return;
    }

    if (onProceedToPayment) {
      const geoParts = String(addr.geo || '')
        .split(',')
        .map((p: string) => Number(p.trim()))
        .filter((n: number) => Number.isFinite(n));
      const fromGeoLat = geoParts.length >= 2 ? geoParts[0] : null;
      const fromGeoLng = geoParts.length >= 2 ? geoParts[1] : null;
      markDeviceOrdered();
      onProceedToPayment({
        ...orderData,
        total: totalAmount,
        restaurantComment,
        cutleryCount,
        deliveryFee: baseDeliveryFee,
        discount: deliveryDiscount,
        clientDeliveryFee: deliveryFee,
        serviceFee,
        deliveryLat: deliveryLoc?.lat ?? fromGeoLat,
        deliveryLng: deliveryLoc?.lng ?? fromGeoLng,
      });
    } else {
      console.log('Данные заказа:', orderData);
      toast(`${t('checkout.mobile_pay')}: ${totalAmount.toFixed(2)} ₾`);
    }
  };

  return (
    <div className="mobile-checkout-wrapper">
      <div className="page">

        {/* --- 1. ШАПКА --- */}
        <HeaderBlock
          deliveryType={orderData.deliveryType}
          onBack={handleBack}
          setDeliveryType={(type: DeliveryType) => {
            if (type === 'standard' && !restaurantOpen) return;
            setOrderData(prev => ({
              ...prev,
              deliveryType: type,
              scheduledTime: type === 'standard' ? null : prev.scheduledTime
            }));
          }}
          scheduledTime={orderData.scheduledTime}
          scheduledDisplay={scheduledDisplay}
          setScheduledTime={(val: string) => updateOrder('scheduledTime', val || null)}
          onOpenTimeModal={() => toggleModal('time', true)}
          asapDisabled={!restaurantOpen}
          closedHint={closedHint}
        />

        <div className="checkout-content">

          {/* --- 2. АДРЕС --- */}
          <AddressBlock
            address={orderData.address}
            updateAddress={updateAddress}
            onOpenPlaceModal={() => toggleModal('place', true)}
            onOpenMapModal={() => toggleModal('map', true)}
            onEditComment={() => toggleModal('comment', true)}
            onEditPhone={() => toggleModal('phone', true)}
          />

          {(pricedZone === 'outside' || (orderData.address.deliveryZone === 'outside' && !detectedZone)) && (
            <div style={{
              margin: '0 16px 12px',
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.9)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>{t('delivery.outside_zone')}</span>
              <a href="https://t.me/MestigoSupport_Bot" target="_blank" rel="noopener noreferrer" style={{ color: '#21EA7C', fontWeight: 700 }}>
                {t('delivery.clarify_telegram')}
              </a>
            </div>
          )}

          {/* --- 4. ЧАЕВЫЕ --- */}
          <TipsBlock
            tipAmount={orderData.tip}
            setTipAmount={(amount: number) => updateOrder('tip', amount)}
            onOpenCustomTip={() => toggleModal('customTip', true)}
          />

          {/* --- 5. СТОИМОСТЬ --- */}
          <SummaryBlock
            items={cartItems || []}
            subtotal={subtotal}
            baseDeliveryFee={baseDeliveryFee}
            deliveryDiscount={deliveryDiscount}
            serviceFee={serviceFee}
            tip={orderData.tip}
            total={totalAmount}
            freeDeliveryLeft={isFirstOrder && baseDeliveryFee <= 12 && subtotal < 100 ? 100 - subtotal : 0}
          />

          {/* --- 6. ФУТЕР --- */}
          <FooterBlock
            totalAmount={totalAmount}
            onPay={handlePay}
          />

        </div>

        {/* ================= ВСЕ МОДАЛКИ ================= */}

        {/* 1. Время */}
                  <TimeModal
            isOpen={modals.time}
            onClose={() => toggleModal('time', false)}
            currentTime={orderData.scheduledTime}
            onSelect={handleTimeSelect}
            workingHours={workingHours}
          />

        {/* 2. Тип жилья */}
                  <PlaceTypeModal
            isOpen={modals.place}
            onClose={() => toggleModal('place', false)}
            selectedType={orderData.address.type}
            onSelectType={handlePlaceTypeSelect}
          />

        {/* 3. Промокод */}
                  <PromoCodeModal
            isOpen={modals.promo}
            onClose={() => toggleModal('promo', false)}
            currentCode={orderData.promoCode}
            onApply={(code: string) => updateOrder('promoCode', code)}
          />

        {/* 4. Чаевые (Другая сумма) */}
                  <CustomTipModal
            isOpen={modals.customTip}
            onClose={() => toggleModal('customTip', false)}
            currentTip={orderData.tip}
            onApply={(amount: number) => updateOrder('tip', amount)}
          />

        {/* 5. Комментарий */}
                  <CommentModal
            isOpen={modals.comment}
            onClose={() => toggleModal('comment', false)}
            currentValue={orderData.address.comment}
            onSave={(val: string) => updateAddress('comment', val)}
          />

        {/* 6. Телефон */}
        {modals.phone && (
          <PhoneModal
            isOpen={modals.phone}
            onClose={() => toggleModal('phone', false)}
            currentValue={orderData.address.phone}
            onSave={(val: string) => updateAddress('phone', val)}
          />
        )}

        {modals.map && (
          <MapModal
            isOpen={modals.map}
            onClose={() => toggleModal('map', false)}
            onConfirm={(geo, coords, zoneId) => {
              setOrderData(prev => ({
                ...prev,
                address: {
                  ...prev.address,
                  type: 'map',
                  geo,
                  landmark: geo,
                  deliveryZone: zoneId,
                },
              }));
              if (coords) deliveryLoc?.setManualLocation(coords[0], coords[1]);
              toggleModal('map', false);
            }}
            initialGeo={orderData.address.geo}
          />
        )}

      </div>
    </div>
  );
};

export default CheckoutPage;