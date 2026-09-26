import { useEffect, useState } from 'react';
import { CRM, type Customer, type Referral, gel, loadList, referralFlags, riskScore } from './crm';
import './AdminCrm.css';

/** Dashboard strip: customers & referrals at a glance. Renders nothing until the CRM endpoints exist. */
export function AdminCrmStrip() {
    const [data, setData] = useState<{ customers: Customer[]; referrals: Referral[] } | null>(null);

    useEffect(() => {
        let alive = true;
        Promise.all([loadList<Customer>(CRM.customers), loadList<Referral>(CRM.referrals)])
            .then(([customers, referrals]) => { if (alive) setData({ customers, referrals }); })
            .catch(() => { /* endpoints not there yet: stay hidden */ });
        return () => { alive = false; };
    }, []);

    if (!data) return null;

    const weekAgo = Date.now() - 7 * 24 * 3600e3;
    const fresh = data.customers.filter((c) => c.created_at && new Date(c.created_at).getTime() > weekAgo).length;
    const bonus = data.customers.reduce((s, c) => s + (c.points || 0), 0);
    const pending = data.referrals.filter((r) => r.status === 'pending').length;
    const suspicious = data.referrals.filter((r) => r.status !== 'cancelled' && riskScore(referralFlags(r, data.referrals)) >= 2).length;
    const go = (page: string) => window.dispatchEvent(new CustomEvent('navigateAdmin', { detail: page }));

    return (
        <div className="crm-kpis crm-strip">
            <button type="button" className="crm-kpi" onClick={() => go('customers')}>
                <span className="crm-kpi-value">{fresh}</span>
                <span className="crm-kpi-label">новых клиентов за 7 дней</span>
            </button>
            <button type="button" className="crm-kpi is-accent" onClick={() => go('customers')}>
                <span className="crm-kpi-value">{gel(bonus)}</span>
                <span className="crm-kpi-label">бонусов на счетах клиентов</span>
            </button>
            <button type="button" className="crm-kpi" onClick={() => go('referrals')}>
                <span className="crm-kpi-value">{pending}</span>
                <span className="crm-kpi-label">приглашённых ждут первого заказа</span>
            </button>
            <button type="button" className={`crm-kpi${suspicious ? ' is-warn' : ''}`} onClick={() => go('referrals')}>
                <span className="crm-kpi-value">{suspicious}</span>
                <span className="crm-kpi-label">подозрительных приглашений</span>
            </button>
        </div>
    );
}
