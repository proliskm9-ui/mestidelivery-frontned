import { useEffect, useMemo, useState } from 'react';
import {
  Bike,
  Car,
  LogOut,
  Phone,
  Store,
  Footprints,
  Check,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useLanguage } from '../../../translations/LanguageContext';
import { PartnerLangPicker } from './PartnerLangPicker';

const PREFS_KEY = 'partner_profile_prefs';

type Vehicle = 'bike' | 'moto' | 'car' | 'walk';

interface ProfilePrefs {
  displayName: string;
  phone: string;
  vehicle: Vehicle;
  note: string;
}

const loadPrefs = (fallbackName: string): ProfilePrefs => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        displayName: String(p.displayName || fallbackName),
        phone: String(p.phone || ''),
        vehicle: (['bike', 'moto', 'car', 'walk'].includes(p.vehicle) ? p.vehicle : 'bike') as Vehicle,
        note: String(p.note || ''),
      };
    }
  } catch { /* ignore */ }
  return { displayName: fallbackName, phone: '', vehicle: 'bike', note: '' };
};

export function PartnerProfile({ role }: { role: 'courier' | 'restaurant' }) {
  const {
    userName,
    isOnline,
    toggleOnline,
    courierDeliveriesCount,
    courierEarnings,
    restaurantRevenue,
    activeOrders,
    historicOrders,
    logout,
  } = useStore();
  const { t } = useLanguage();

  const [prefs, setPrefs] = useState<ProfilePrefs>(() => loadPrefs(userName));
  const [saved, setSaved] = useState(false);

  const vehicles = useMemo(
    () => [
      { id: 'bike' as Vehicle, label: t('partnerApp.profile.vehicle_bike'), Icon: Bike },
      { id: 'moto' as Vehicle, label: t('partnerApp.profile.vehicle_moto'), Icon: Bike },
      { id: 'car' as Vehicle, label: t('partnerApp.profile.vehicle_car'), Icon: Car },
      { id: 'walk' as Vehicle, label: t('partnerApp.profile.vehicle_walk'), Icon: Footprints },
    ],
    [t],
  );

  useEffect(() => {
    setPrefs((prev) => ({
      ...prev,
      displayName: prev.displayName || userName,
    }));
  }, [userName]);

  const deliveredCount = useMemo(
    () => historicOrders.filter((o) => o.status === 'delivered').length,
    [historicOrders],
  );
  const activeCount = useMemo(
    () => activeOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
    [activeOrders],
  );

  const save = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="partner-page">
      <div className="partner-page-head">
        <div>
          <p className="partner-page-kicker">{t('partnerApp.profile.kicker')}</p>
          <h1 className="partner-page-title">{t('partnerApp.profile.title')}</h1>
          <p className="partner-page-sub">
            {role === 'courier' ? t('partnerApp.profile.sub_courier') : t('partnerApp.profile.sub_restaurant')}
          </p>
        </div>
      </div>

      <div className="partner-metric-grid">
        {role === 'courier' ? (
          <>
            <div className="partner-metric-tile">
              <span className="partner-metric-tile__label">{t('partnerApp.profile.deliveries')}</span>
              <div className="partner-metric-tile__value">{courierDeliveriesCount || deliveredCount}</div>
              <div className="partner-metric-tile__sub">{t('partnerApp.profile.deliveries_sub')}</div>
            </div>
            <div className="partner-metric-tile">
              <span className="partner-metric-tile__label">{t('partnerApp.profile.tips')}</span>
              <div className="partner-metric-tile__value">
                {(courierEarnings || 0).toFixed(0)} <span style={{ fontSize: '1rem', color: '#21EA7C' }}>₾</span>
              </div>
              <div className="partner-metric-tile__sub">{t('partnerApp.profile.tips_sub')}</div>
            </div>
          </>
        ) : (
          <>
            <div className="partner-metric-tile">
              <span className="partner-metric-tile__label">{t('partnerApp.profile.revenue')}</span>
              <div className="partner-metric-tile__value">
                {restaurantRevenue.toLocaleString()} <span style={{ fontSize: '1rem', color: '#21EA7C' }}>₾</span>
              </div>
              <div className="partner-metric-tile__sub">{t('partnerApp.profile.revenue_sub')}</div>
            </div>
            <div className="partner-metric-tile">
              <span className="partner-metric-tile__label">{t('partnerApp.profile.now')}</span>
              <div className="partner-metric-tile__value">{activeCount}</div>
              <div className="partner-metric-tile__sub">{t('partnerApp.profile.now_sub')}</div>
            </div>
          </>
        )}
      </div>

      <section className="partner-card">
        <PartnerLangPicker />
      </section>

      {role === 'courier' && (
        <section className="partner-card">
          <div className="partner-card__head">
            <h3>{t('partnerApp.profile.line_title')}</h3>
            <p>{t('partnerApp.profile.line_desc')}</p>
          </div>
          <button
            type="button"
            className={`partner-online-toggle${isOnline ? ' is-on' : ''}`}
            style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
            onClick={() => toggleOnline()}
            aria-pressed={isOnline}
          >
            <span className="partner-online-dot" />
            {isOnline ? t('partnerApp.profile.line_on') : t('partnerApp.profile.line_off')}
          </button>
        </section>
      )}

      <section className="partner-card">
        <div className="partner-card__head">
          <h3>{t('partnerApp.profile.contacts_title')}</h3>
          <p>{t('partnerApp.profile.contacts_desc')}</p>
        </div>
        <label className="partner-field">
          <span>{t('partnerApp.profile.display_name')}</span>
          <input
            value={prefs.displayName}
            onChange={(e) => setPrefs({ ...prefs, displayName: e.target.value })}
            placeholder={userName}
          />
        </label>
        <label className="partner-field">
          <span>{t('partnerApp.profile.phone')}</span>
          <div className="partner-field__row">
            <Phone size={16} />
            <input
              value={prefs.phone}
              onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })}
              placeholder="+995 ..."
              inputMode="tel"
            />
          </div>
        </label>
        <label className="partner-field">
          <span>{t('partnerApp.profile.note')}</span>
          <input
            value={prefs.note}
            onChange={(e) => setPrefs({ ...prefs, note: e.target.value })}
            placeholder={role === 'courier' ? t('partnerApp.profile.note_ph_courier') : t('partnerApp.profile.note_ph_rest')}
          />
        </label>
      </section>

      {role === 'courier' && (
        <section className="partner-card">
          <div className="partner-card__head">
            <h3>{t('partnerApp.profile.vehicle_title')}</h3>
            <p>{t('partnerApp.profile.vehicle_desc')}</p>
          </div>
          <div className="partner-vehicle-grid">
            {vehicles.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`partner-vehicle${prefs.vehicle === id ? ' is-active' : ''}`}
                onClick={() => setPrefs({ ...prefs, vehicle: id })}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {role === 'restaurant' && (
        <section className="partner-card">
          <div className="partner-card__head">
            <h3>{t('partnerApp.profile.sub_restaurant')}</h3>
          </div>
          <div className="partner-info-row">
            <Store size={18} />
            <div>
              <strong>{userName || '—'}</strong>
              <span>{t('partnerApp.nav.orders')} · {t('partnerApp.nav.menu')}</span>
            </div>
          </div>
        </section>
      )}

      <button type="button" className="partner-btn-primary" onClick={save}>
        {saved ? (<><Check size={18} /> {t('partnerApp.profile.saved')}</>) : t('partnerApp.profile.save')}
      </button>

      <button type="button" className="partner-btn-danger" onClick={logout} style={{ marginTop: 10 }}>
        <LogOut size={16} /> {t('partnerApp.profile.logout')}
      </button>
    </div>
  );
}
