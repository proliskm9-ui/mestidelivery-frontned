import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ingestGoogleOAuthResult } from '../auth/AuthContext';
import { loadPendingGoogleUser } from '../auth/googlePending';
import LoadingScreen from '../components/UI/LoadingScreen';

function apiBase(): string {
  return (import.meta as any).env.VITE_API_URL || '';
}

/**
 * Landing after Google OAuth. Accepts our JWT (`token`) or a Firebase ID token
 * (`id_token`) from the firebaseapp.com bridge, then routes to menu / profile.
 */
export default function AuthGoogleDonePage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const lang = params.get('lang') || 'ru';
      const returnTo = params.get('return_to');
      const error = params.get('error');

      const fail = () => {
        if (!cancelled) navigate(`/${lang}/login?error=google_auth_failed`, { replace: true });
      };

      if (error) {
        navigate(`/${lang}/login?error=${encodeURIComponent(error)}`, { replace: true });
        return;
      }

      let token = params.get('token');
      let pending = params.get('pending');
      let email = params.get('email');
      let name = params.get('name');
      const firebaseId = params.get('id_token');

      if (firebaseId && !token && !pending) {
        try {
          const res = await fetch(`${apiBase()}/api/auth/customer/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: firebaseId, full_name: name || '' }),
          });
          const data = await res.json().catch(() => ({}));
          const detail = data.detail || data.error || '';
          if (res.status === 400 && String(detail).includes('phone_required')) {
            pending = data.pending_token || '';
            email = data.email || email;
            name = data.name || name;
          } else if (res.ok && data.token) {
            token = data.token;
          } else {
            fail();
            return;
          }
        } catch {
          fail();
          return;
        }
      }

      if (cancelled) return;

      const outcome = ingestGoogleOAuthResult({
        token,
        pending,
        email,
        name,
        picture: params.get('picture'),
      });

      if (outcome === 'logged_in') {
        const jwt = sessionStorage.getItem('pending_google_token') || token;
        if (jwt) {
          localStorage.setItem('token', jwt);
          sessionStorage.removeItem('pending_google_token');
        }
        window.dispatchEvent(new CustomEvent('mestigo-google-token', { detail: jwt }));
        if (returnTo && returnTo.startsWith('/')) {
          navigate(returnTo, { replace: true });
        } else {
          navigate(`/${lang}/restaurants`, { replace: true });
        }
        return;
      }

      if (outcome === 'needs_profile' || loadPendingGoogleUser()) {
        window.dispatchEvent(new CustomEvent('mestigo-google-pending'));
        navigate(`/${lang}/login`, { replace: true });
        return;
      }

      fail();
    })().finally(() => {
      if (!cancelled) setBusy(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return busy ? <LoadingScreen /> : null;
}
