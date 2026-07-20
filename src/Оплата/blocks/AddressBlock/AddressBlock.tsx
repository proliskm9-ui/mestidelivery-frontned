import React from 'react';
import './AddressBlock.css';
import { useLanguage } from '../../../translations/LanguageContext';

// Импорт иконок
import commentIcon from '../../assets/speech-bubble 1.png';
import phoneIcon from '../../assets/phone-call 1.png';

// --- УМНАЯ МАСКА ТЕЛЕФОНА (ЛЮБАЯ СТРАНА) ---
const E164_MAX_DIGITS = 15;

const CALLING_CODES: string[] = [
  '1',
  '20', '211', '212', '213', '216', '218', '220', '221', '222', '223', '224', '225', '226', '227', '228', '229',
  '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244', '245',
  '246', '247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '260', '261', '262',
  '263', '264', '265', '266', '267', '268', '269',
  '30', '31', '32', '33', '34', '350', '351', '352', '353', '354', '355', '356', '357', '358', '359',
  '36', '370', '371', '372', '373', '374', '375', '376', '377', '378', '379', '380', '381', '382', '383', '385',
  '386', '387', '389',
  '40', '41', '420', '421', '423', '43', '44', '45', '46', '47', '48', '49',
  '500', '501', '502', '503', '504', '505', '506', '507', '508', '509',
  '51', '52', '53', '54', '55', '56', '57', '58',
  '590', '591', '592', '593', '594', '595', '596', '597', '598', '599',
  '60', '61', '62', '63', '64', '65', '66',
  '670', '672', '673', '674', '675', '676', '677', '678', '679', '680', '681', '682', '683', '685', '686', '687',
  '688', '689', '690', '691', '692',
  '7',
  '81', '82', '84', '850', '852', '853', '855', '856', '86', '870', '871', '872', '873', '874', '878',
  '880', '881', '882', '883', '886',
  '90', '91', '92', '93', '94', '95', '960', '961', '962', '963', '964', '965', '966', '967', '968', '970', '971',
  '972', '973', '974', '975', '976', '977', '98', '992', '993', '994', '995', '996', '998'
];

const CALLING_CODE_SET = new Set<string>(CALLING_CODES);

const detectCallingCode = (digits: string): string | null => {
  for (let len = 3; len >= 1; len--) {
    const c = digits.slice(0, len);
    if (CALLING_CODE_SET.has(c)) return c;
  }
  return null;
};

const formatInternational = (allDigits: string): string => {
  if (!allDigits) return '';

  const code = detectCallingCode(allDigits) || allDigits.slice(0, 1);
  const rest = allDigits.slice(code.length);

  if (!rest) return `+${code}`;

  const a = rest.slice(0, 3);
  const b = rest.slice(3, 6);
  let tail = rest.slice(6);

  const parts: string[] = [];
  if (a) parts.push(`(${a}`);
  if (a.length === 3) parts[0] = parts[0] + ')';

  if (b) parts.push(b);

  if (tail) {
    if (tail.length <= 4) {
      parts.push(tail);
    } else {
      parts.push(tail.slice(0, 4));
      tail = tail.slice(4);
      while (tail.length) {
        parts.push(tail.slice(0, 2));
        tail = tail.slice(2);
      }
    }
  }

  const areaRaw = a || '';
  const areaOpen = areaRaw.length > 0 && areaRaw.length < 3;
  const areaFormatted = areaOpen ? `(${areaRaw}` : `(${areaRaw})`;

  const afterArea = rest.slice(3);
  if (!afterArea) {
    return `+${code} ${areaFormatted}`.trim();
  }

  const groups: string[] = [];
  if (b) groups.push(b);

  const tailGroups = parts.slice(2);
  groups.push(...tailGroups);

  if (areaOpen) {
    return `+${code} ${areaFormatted}`.trim();
  }

  const right = groups.filter(Boolean).join('-');

  return `+${code} ${areaFormatted}${right ? ' ' + right : ''}`.trim();
};

export interface AddressData {
  type: 'home' | 'hotel' | 'map';
  street: string;
  house: string;
  apartment: string;
  floor: string;
  hotelName: string;
  room: string;
  deliveryNote: string;
  geo: string;
  landmark: string;
  comment: string;
  phone: string;
  deliveryZone?: string;
}

interface AddressBlockProps {
  address: Partial<AddressData>;
  updateAddress: (field: string, value: string) => void;
  onOpenPlaceModal: () => void;
  onOpenMapModal?: () => void;
  onEditComment?: () => void;
  onEditPhone?: () => void;
}

const AddressBlock: React.FC<AddressBlockProps> = ({
  address,
  updateAddress,
  onOpenPlaceModal,
  onOpenMapModal
}) => {
  const { t } = useLanguage();
  const [isCommentFocused, setIsCommentFocused] = React.useState<boolean>(false);
  const safeAddress = address || {};
  const currentType = safeAddress.type || 'home';

  const getCellClass = (val: string | undefined, extra: string = ''): string => {
    return `input-cell ${extra} ${val ? 'has-value' : ''}`;
  };

  const handleCellClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const input = e.currentTarget.querySelector('input');
    if (input) input.focus();
  };

  // --- ОБРАБОТЧИК ВВОДА ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let val = e.target.value || '';

    const nativeEvent = e.nativeEvent as InputEvent;
    const inputType = nativeEvent.inputType || '';
    const isDeleting = inputType.startsWith('delete');

    val = val.trim().replace(/^00/, '+');

    let digits = val.replace(/\D/g, '');

    if (!digits) {
      updateAddress('phone', '');
      return;
    }

    if (digits[0] === '8' && digits.length >= 11) {
      digits = '7' + digits.slice(1);
    }

    if (digits.length > E164_MAX_DIGITS) {
      digits = digits.slice(0, E164_MAX_DIGITS);
    }

    const prevPhone = safeAddress.phone || '';
    const prevDigits = prevPhone.replace(/\D/g, '');

    if (isDeleting && digits.length === prevDigits.length) {
      digits = digits.slice(0, -1);
    }

    const formatted = formatInternational(digits);

    updateAddress('phone', formatted);
  };

  return (
    <section className="delivery-card">
      <h2 className="delivery-title">{t('checkout.where_to_deliver')}</h2>

      <div className="delivery-content">

        {/* --- 1. ТИП ПОМЕЩЕНИЯ --- */}
        <div className="place-type-row" onClick={onOpenPlaceModal}>
          <div className="icon-fixed">
            {currentType === 'home' && (
              <img src="/Assets/home.png" alt={t('checkout.place_home')} />
            )}
            {currentType === 'hotel' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
              </svg>
            )}
            {currentType === 'map' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            )}
          </div>
          <div className="place-text-col">
            <p className="place-title">
              {currentType === 'home' && t('checkout.place_home')}
              {currentType === 'hotel' && t('checkout.address_hotel_guest')}
              {currentType === 'map' && t('checkout.address_point_map')}
            </p>
            <p className="place-subtitle">{t('checkout.select_premise')}</p>
          </div>
        </div>

        <div className="divider-line full-width"></div>

        {/* --- 2. ПОЛЯ ВВОДА --- */}
        <div className="fields-grid">
          {/* === ДОМ / КВАРТИРА === */}
          {currentType === 'home' && (
            <>
              <div className="grid-row">
                <div className={getCellClass(safeAddress.street)} onClick={handleCellClick}>
                  <input
                    className="input-transparent"
                    value={safeAddress.street || ''}
                    onChange={(e) => updateAddress('street', e.target.value)}
                  />
                  <label className="floating-label">{t('checkout.street')}</label>
                  <div className="bottom-border"></div>
                </div>

                <div className={getCellClass(safeAddress.house)} onClick={handleCellClick}>
                  <input
                    className="input-transparent"
                    value={safeAddress.house || ''}
                    onChange={(e) => updateAddress('house', e.target.value)}
                  />
                  <label className="floating-label">{t('checkout.house')}</label>
                  <div className="bottom-border"></div>
                </div>
              </div>

              <div className="grid-row">
                <div className={getCellClass(safeAddress.apartment)} onClick={handleCellClick}>
                  <input
                    className="input-transparent"
                    value={safeAddress.apartment || ''}
                    onChange={(e) => updateAddress('apartment', e.target.value)}
                  />
                  <label className="floating-label">{t('profile.apartment')}</label>
                  <div className="bottom-border"></div>
                </div>

                <div className={getCellClass(safeAddress.floor)} onClick={handleCellClick}>
                  <input
                    className="input-transparent"
                    value={safeAddress.floor || ''}
                    onChange={(e) => updateAddress('floor', e.target.value)}
                  />
                  <label className="floating-label">{t('map.floor')}</label>
                  <div className="bottom-border"></div>
                </div>
              </div>
            </>
          )}

          {/* === ОТЕЛЬ === */}
          {currentType === 'hotel' && (
            <>
              <div className="grid-row">
                <div className={getCellClass(safeAddress.hotelName, 'full-width')} onClick={handleCellClick}>
                  <input
                    className="input-transparent"
                    value={safeAddress.hotelName || ''}
                    onChange={(e) => updateAddress('hotelName', e.target.value)}
                  />
                  <label className="floating-label">{t('checkout.hotel_name')}</label>
                  <div className="bottom-border"></div>
                </div>
              </div>
              <div className="grid-row">
                <div className={getCellClass(safeAddress.room)} onClick={handleCellClick}>
                  <input
                    className="input-transparent"
                    value={safeAddress.room || ''}
                    onChange={(e) => updateAddress('room', e.target.value)}
                  />
                  <label className="floating-label">{t('checkout.room_number')}</label>
                  <div className="bottom-border"></div>
                </div>
                <div className={getCellClass(safeAddress.deliveryNote)} onClick={handleCellClick}>
                  <input
                    className="input-transparent"
                    value={safeAddress.deliveryNote || ''}
                    onChange={(e) => updateAddress('deliveryNote', e.target.value)}
                  />
                  <label className="floating-label">{t('checkout.how_to_deliver')}</label>
                  <div className="bottom-border"></div>
                </div>
              </div>
            </>
          )}

          {/* === КАРТА === */}
          {currentType === 'map' && (
            <>
              <div className="grid-row">
                <div className={getCellClass(safeAddress.geo, 'full-width')} onClick={onOpenMapModal || handleCellClick}>
                  <input
                    className="input-transparent"
                    value={safeAddress.geo || ''}
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="floating-label">{t('checkout.determine_location')}</label>
                  <div className="bottom-border"></div>
                </div>
              </div>
              <div className="grid-row">
                <div className={getCellClass(safeAddress.landmark)} onClick={handleCellClick}>
                  <input
                    className="input-transparent"
                    value={safeAddress.landmark || ''}
                    onChange={(e) => updateAddress('landmark', e.target.value)}
                  />
                  <label className="floating-label">{t('checkout.landmark')}</label>
                  <div className="bottom-border"></div>
                </div>
                <div className={getCellClass(safeAddress.deliveryNote)} onClick={handleCellClick}>
                  <input
                    className="input-transparent"
                    value={safeAddress.deliveryNote || ''}
                    onChange={(e) => updateAddress('deliveryNote', e.target.value)}
                  />
                  <label className="floating-label">{t('checkout.how_to_deliver')}</label>
                  <div className="bottom-border"></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* --- КОММЕНТАРИЙ --- */}
        <div className="icon-input-row" onClick={handleCellClick}>
          <div className="icon-fixed">
            <img src={commentIcon} alt="" />
          </div>

          <div className={getCellClass(safeAddress.comment)}>
            <input
              className="input-transparent"
              value={safeAddress.comment || ''}
              onChange={(e) => updateAddress('comment', e.target.value)}
              onFocus={() => setIsCommentFocused(true)}
              onBlur={() => setIsCommentFocused(false)}
            />
            <label className="floating-label">
              {(isCommentFocused || safeAddress.comment) ? t('checkout.comment_to_order') : t('checkout.add_comment')}
            </label>
          </div>

          <div className="arrow-right">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1L5 5L1 9" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>

        <div className="divider-line indented"></div>

        {/* --- ТЕЛЕФОН (Умная маска) --- */}
        <div className="icon-input-row phone-row" onClick={handleCellClick}>
          <div className="icon-fixed">
            <img src={phoneIcon} alt="" />
          </div>

          <div className={getCellClass(safeAddress.phone)}>
            <input
              className="input-transparent"
              value={safeAddress.phone || ''}
              onChange={handlePhoneChange}
              type="tel"
              inputMode="tel"
            />
            <label className="floating-label">{t('checkout.phone_recipient')}</label>
          </div>

          <div className="arrow-right">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1L5 5L1 9" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>

        <div className="phone-line"></div>

      </div>
    </section>
  );
};

export default AddressBlock;