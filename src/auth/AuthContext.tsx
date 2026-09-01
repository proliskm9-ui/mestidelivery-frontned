import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthProfile, UserRole } from './types';
import { isValidInternationalPhone, normalizePhone } from './phone';
import {
  clearPendingGoogleUser,
  loadPendingGoogleUser,
  savePendingGoogleUser,
  type PendingGoogleIdentity,
  GOOGLE_PENDING_TOKEN_KEY,
} from './googlePending';
import { signInWithGoogleIdToken } from './googleSignIn';

export type GoogleSignInResult =
  | { status: 'ready'; token: string }
  | { status: 'needs_profile' }
  | { status: 'redirecting' };

interface AuthContextValue {
  pendingGoogleIdentity: PendingGoogleIdentity | null;
  profile: AuthProfile;
  role: UserRole | null;
  loading: boolean;
  needsProfileCompletion: boolean;
  errorKey: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<GoogleSignInResult>;
  completeCustomerProfile: (displayName: string, phone: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function apiBase(): string {
  return (import.meta as any).env.VITE_API_URL || '';
}

type GoogleExchange =
  | { status: 'ready'; token: string }
  | { status: 'needs_profile' };

async function exchangeGoogleIdToken(
  idToken: string,
  name: string,
  email: string,
): Promise<GoogleExchange> {
  const res = await fetch(`${apiBase()}/api/auth/customer/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken, full_name: name }),
  });
  const data = await res.json().catch(() => ({}));
  const detail = typeof data.detail === 'string'
    ? data.detail
    : typeof data.error === 'string'
      ? data.error
      : '';

  if (res.status === 400 && String(detail).includes('phone_required')) {
    ingestGoogleOAuthResult({
      pending: data.pending_token,
      email: data.email || email,
      name: data.name || name,
    });
    window.dispatchEvent(new CustomEvent('mestigo-google-pending'));
    return { status: 'needs_profile' };
  }
  if (!res.ok || !data.token) {
    throw new Error(detail || 'Google auth failed');
  }
  ingestGoogleOAuthResult({ token: data.token });
  window.dispatchEvent(new CustomEvent('mestigo-google-token', { detail: data.token }));
  return { status: 'ready', token: data.token as string };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingGoogleIdentity, setPendingGoogleIdentity] = useState<PendingGoogleIdentity | null>(
    () => loadPendingGoogleUser(),
  );
  const [profile, setProfile] = useState<AuthProfile>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(
    () => !!loadPendingGoogleUser() || !!sessionStorage.getItem(GOOGLE_PENDING_TOKEN_KEY),
  );
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const clearError = useCallback(() => setErrorKey(null), []);

  useEffect(() => {
    const stored = loadPendingGoogleUser();
    if (stored) {
      setPendingGoogleIdentity(stored);
      setNeedsProfileCompletion(true);
    }
    const onPending = () => {
      const identity = loadPendingGoogleUser();
      if (identity) {
        setPendingGoogleIdentity(identity);
        setNeedsProfileCompletion(true);
      }
    };
    window.addEventListener('mestigo-google-pending', onPending);
    return () => window.removeEventListener('mestigo-google-pending', onPending);
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<GoogleSignInResult> => {
    setErrorKey(null);
    let idToken: string;
    let email = '';
    let name = '';
    try {
      const got = await signInWithGoogleIdToken();
      idToken = got.idToken;
      email = got.email;
      name = got.name;
    } catch (err: any) {
      if (err?.message === 'redirecting') {
        return { status: 'redirecting' };
      }
      throw err;
    }

    return exchangeGoogleIdToken(idToken, name, email);
  }, []);

  const completeCustomerProfile = useCallback(async (displayName: string, phone: string) => {
    setErrorKey(null);
    const identity = pendingGoogleIdentity || loadPendingGoogleUser();
    const pendingToken = sessionStorage.getItem(GOOGLE_PENDING_TOKEN_KEY);
    if (!pendingToken) {
      setErrorKey('auth.errors.generic');
      throw new Error('No pending Google auth');
    }

    const name = displayName.trim() || identity?.displayName || 'User';
    if (!name.trim()) {
      setErrorKey('auth.errors.name_required');
      throw new Error('name');
    }
    if (!isValidInternationalPhone(phone)) {
      setErrorKey('auth.errors.phone_invalid');
      throw new Error('phone');
    }

    const res = await fetch(`${apiBase()}/api/auth/customer/google/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pending_token: pendingToken,
        full_name: name,
        phone: normalizePhone(phone),
      }),
    });
    const data = await res.json().catch(() => ({}));
    const detail = typeof data.detail === 'string'
      ? data.detail
      : typeof data.error === 'string'
        ? data.error
        : '';

    if (!res.ok) {
      setErrorKey('auth.errors.generic');
      throw new Error(detail || 'Google auth failed');
    }
    if (!data.token) {
      setErrorKey('auth.errors.generic');
      throw new Error('No token');
    }

    localStorage.setItem('user_name', name);
    localStorage.setItem('user_phone', normalizePhone(phone));
    sessionStorage.removeItem(GOOGLE_PENDING_TOKEN_KEY);
    clearPendingGoogleUser();
    setPendingGoogleIdentity(null);
    setNeedsProfileCompletion(false);
    setRole('customer');
    if (identity) {
      setProfile({
        uid: identity.uid || identity.email,
        email: identity.email,
        displayName: name,
        phone: normalizePhone(phone),
        photoURL: identity.photoURL || '',
        provider: 'google',
        role: 'customer',
      });
    }
    return data.token as string;
  }, [pendingGoogleIdentity]);

  const logout = useCallback(() => {
    setErrorKey(null);
    clearPendingGoogleUser();
    sessionStorage.removeItem(GOOGLE_PENDING_TOKEN_KEY);
    setPendingGoogleIdentity(null);
    setNeedsProfileCompletion(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_phone');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setProfile(null);
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    pendingGoogleIdentity,
    profile,
    role,
    loading,
    needsProfileCompletion,
    errorKey,
    clearError,
    signInWithGoogle,
    completeCustomerProfile,
    logout,
  }), [
    pendingGoogleIdentity,
    profile,
    role,
    loading,
    needsProfileCompletion,
    errorKey,
    clearError,
    signInWithGoogle,
    completeCustomerProfile,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Called from AuthGoogleDone after backend OAuth redirect. */
export function ingestGoogleOAuthResult(params: {
  token?: string | null;
  pending?: string | null;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
}): 'logged_in' | 'needs_profile' | 'none' {
  if (params.token) {
    sessionStorage.setItem('pending_google_token', params.token);
    return 'logged_in';
  }
  if (params.pending && params.email) {
    sessionStorage.setItem(GOOGLE_PENDING_TOKEN_KEY, params.pending);
    savePendingGoogleUser({
      uid: '',
      email: params.email,
      displayName: params.name || '',
      photoURL: params.picture || '',
    });
    return 'needs_profile';
  }
  return 'none';
}
