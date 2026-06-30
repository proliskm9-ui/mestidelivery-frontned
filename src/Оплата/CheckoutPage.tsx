import React, { useState } from 'react';
import './CheckoutPage.css';
import { useLanguage } from '../translations/LanguageContext';

// === БЛОКИ ===
import HeaderBlock from './blocks/HeaderBlock/HeaderBlock';
import AddressBlock, { AddressData } from './blocks/AddressBlock/AddressBlock';
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
  totalAmount: externalTotal,
  onBack,
  onProceedToPayment,
  comment: restaurantComment,
  cutleryCount,
  initialAddress
}) => {
  const { t } = useLanguage();
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
      geo: '',
      landmark: '',
      comment: savedAddress?.comment || '',
      phone: savedAddress?.phone || savedPhone || ''
    },

    payment: 'cash',
    promoCode: '',
    tip: 0
  });

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

  // Хелпер для открытия/закрытия
  const toggleModal = (name: keyof ModalState, isOpen: boolean): void => {
    setModals(prev => ({ ...prev, [name]: isOpen }));
  };

  // 3. ОБНОВЛЕНИЕ ДАННЫХ
  const updateOrder = <K extends keyof OrderData>(field: K, value: OrderData[K]): void => {
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field: string, value: string): void => {
    setOrderData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  // Логика выбора времени (сброс на Стандарт)
  const handleTimeSelect = (timeSlot: string | null): void => {
    if (timeSlot === null) {
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

  // ИТОГОВАЯ СУММА
  const BASE_PRICE = externalTotal ?? 0;
  const totalAmount = BASE_PRICE + orderData.tip;

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
    const hasLocation = orderData.address.type === 'map' ? !!orderData.address.geo : !!orderData.address.street;
    if (!hasLocation || !orderData.address.phone) {
      alert(t('checkout.fill_alert'));
      return;
    }

    if (onProceedToPayment) {
      onProceedToPayment({
        ...orderData,
        total: totalAmount,
        restaurantComment,
        cutleryCount
      });
    } else {
      console.log('Данные заказа:', orderData);
      alert(`${t('checkout.mobile_pay')}: ${totalAmount.toFixed(2)} ₾`);
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
            setOrderData(prev => ({
              ...prev,
              deliveryType: type,
              scheduledTime: type === 'standard' ? null : prev.scheduledTime
            }));
          }}
          scheduledTime={orderData.scheduledTime}
          setScheduledTime={(val: string) => updateOrder('scheduledTime', val || null)}
          onOpenTimeModal={() => toggleModal('time', true)}
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

          {/* --- 4. ЧАЕВЫЕ --- */}
          <TipsBlock
            tipAmount={orderData.tip}
            setTipAmount={(amount: number) => updateOrder('tip', amount)}
            onOpenCustomTip={() => toggleModal('customTip', true)}
          />

          {/* --- 5. ФУТЕР --- */}
          <FooterBlock
            totalAmount={totalAmount}
            onPay={handlePay}
          />

        </div>

        {/* ================= ВСЕ МОДАЛКИ ================= */}

        {/* 1. Время */}
        {modals.time && (
          <TimeModal
            isOpen={modals.time}
            onClose={() => toggleModal('time', false)}
            currentTime={orderData.scheduledTime}
            onSelect={handleTimeSelect}
          />
        )}

        {/* 2. Тип жилья */}
        {modals.place && (
          <PlaceTypeModal
            isOpen={modals.place}
            onClose={() => toggleModal('place', false)}
            selectedType={orderData.address.type}
            onSelectType={handlePlaceTypeSelect}
          />
        )}

        {/* 3. Промокод */}
        {modals.promo && (
          <PromoCodeModal
            isOpen={modals.promo}
            onClose={() => toggleModal('promo', false)}
            currentCode={orderData.promoCode}
            onApply={(code: string) => updateOrder('promoCode', code)}
          />
        )}

        {/* 4. Чаевые (Другая сумма) */}
        {modals.customTip && (
          <CustomTipModal
            isOpen={modals.customTip}
            onClose={() => toggleModal('customTip', false)}
            currentTip={orderData.tip}
            onApply={(amount: number) => updateOrder('tip', amount)}
          />
        )}

        {/* 5. Комментарий */}
        {modals.comment && (
          <CommentModal
            isOpen={modals.comment}
            onClose={() => toggleModal('comment', false)}
            currentValue={orderData.address.comment}
            onSave={(val: string) => updateAddress('comment', val)}
          />
        )}

        {/* 6. Телефон */}
        {modals.phone && (
          <PhoneModal
            isOpen={modals.phone}
            onClose={() => toggleModal('phone', false)}
            currentValue={orderData.address.phone}
            onSave={(val: string) => updateAddress('phone', val)}
          />
        )}

        {/* 7. Карта */}
        {modals.map && (
          <MapModal
            isOpen={modals.map}
            onClose={() => toggleModal('map', false)}
            onConfirm={(loc) => {
              updateAddress('geo', loc);
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