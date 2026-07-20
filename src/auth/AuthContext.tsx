import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { AuthProfile, UserRole } from './types';
import { firebaseAuthErrorKey, getFirebaseErrorCode } from './authErrors';
import { isValidInternationalPhone, normalizePhone } from './phone';
import {
  clearPendingGoogleUser,
  identityFromFirebaseUser,
  loadPendingGoogleUser,
  savePendingGoogleUser,
  type PendingGoogleIdentity,
  GOOGLE_TOKEN_KEY,
} from './googlePending';

export type GoogleSignInResult =
  | { status: 'ready'; token: string }
  | { status: 'needs_profile' };

interface AuthContextValue {
  user: User | null;
  /** Google identity waiting for phone (sessionStorage-backed) */
  pendingGoogleIdentity: PendingGoogleIdentity | null;
  profile: AuthProfile;
  role: UserRole | null;
  loading: boolean;
  needsProfileCompletion: boolean;
  errorKey: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<GoogleSignInResult>;
  completeCustomerProfile: (displayName: string, phone: string) => Promise<string>;
  signInAdmin: (email: string, password: string) => Promise<void>;
  signInPartner: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearFirebaseSession: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function exchangeGoogleForApiToken(params: {
  email: string;
  full_name: string;
  phone?: string;
  firebase_uid?: string;
}): Promise<{ token: string } | { needsPhone: true }> {
  const API_URL = (import.meta as any).env.VITE_API_URL || '';
  const res = await fetch(`${API_URL}/api/auth/customer/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  const detail = typeof data.detail === 'string'
    ? data.detail
    : typeof data.error === 'string'
      ? data.error
      : Array.isArray(data.detail)
        ? data.detail.map((d: any) => d.msg || d).join(', ')
        : '';

  if (res.status === 400 && (detail === 'phone_required' || detail.includes('phone_required'))) {
    return { needsPhone: true };
  }
  if (!res.ok) {
    throw new Error(detail || `Google auth failed (${res.status})`);
  }
  if (!data.token) throw new Error('No token');
  return { token: data.token as string };
}

/**
 * Google = popup only → dump identity to sessionStorage → sign out Firebase.
 * Phone modal + API JWT never depend on a live Firebase session.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingGoogleIdentity, setPendingGoogleIdentity] = useState<PendingGoogleIdentity | null>(
    () => loadPendingGoogleUser(),
  );
  const [profile, setProfile] = useState<AuthProfile>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(
    () => !!loadPendingGoogleUser(),
  );
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const clearError = useCallback(() => setErrorKey(null), []);

  const beginProfileStep = useCallback((identity: PendingGoogleIdentity) => {
    savePendingGoogleUser(identity);
    setPendingGoogleIdentity(identity);
    setNeedsProfileCompletion(true);
    setUser(null);
  }, []);

  const finishWithBackend = useCallback(async (
    identity: PendingGoogleIdentity,
    fullName: string,
    phone?: string,
  ): Promise<{ token: string } | { needsPhone: true }> => {
    const result = await exchangeGoogleForApiToken({
      email: identity.email,
      full_name: fullName,
      phone: phone || undefined,
      firebase_uid: identity.uid,
    });
    if ('needsPhone' in result) {
      return { needsPhone: true };
    }
    const token = result.token;
    localStorage.setItem('user_name', fullName);
    if (phone) localStorage.setItem('user_phone', phone);
    clearPendingGoogleUser();
    setPendingGoogleIdentity(null);
    setNeedsProfileCompletion(false);
    setRole('customer');
    setProfile({
      uid: identity.uid,
      email: identity.email,
      displayName: fullName,
      phone: phone || '',
      photoURL: identity.photoURL || '',
      provider: 'google',
      role: 'customer',
    });
    try {
      await signOut(auth);
    } catch {
      /* ignore */
    }
    setUser(null);
    return { token };
  }, []);

  const ingestGoogleUser = useCallback(async (firebaseUser: User): Promise<GoogleSignInResult> => {
    const identity = identityFromFirebaseUser(firebaseUser);
    if (!identity) throw new Error('Google account has no email');

    savePendingGoogleUser(identity);
    try {
      await signOut(auth);
    } catch {
      /* ignore */
    }

    const savedPhone = localStorage.getItem('user_phone') || '';
    const savedName = localStorage.getItem('user_name') || identity.displayName || '';

    const result = await finishWithBackend(
      identity,
      savedName || identity.displayName || 'User',
      savedPhone && isValidInternationalPhone(savedPhone) ? normalizePhone(savedPhone) : undefined,
    );

    if ('needsPhone' in result) {
      beginProfileStep(identity);
      return { status: 'needs_profile' };
    }
    return { status: 'ready', token: result.token };
  }, [beginProfileStep, finishWithBackend]);

  const completeCustomerProfile = useCallback(async (displayName: string, phone: string) => {
    setErrorKey(null);
    const identity = pendingGoogleIdentity || loadPendingGoogleUser();
    if (!identity?.email) {
      setErrorKey('auth.errors.generic');
      throw new Error('No user');
    }

    const name = displayName.trim() || identity.displayName || 'User';
    if (!name.trim()) {
      setErrorKey('auth.errors.name_required');
      throw new Error('name');
    }
    if (!isValidInternationalPhone(phone)) {
      setErrorKey('auth.errors.phone_invalid');
      throw new Error('phone');
    }

    try {
      const result = await finishWithBackend(identity, name, normalizePhone(phone));
      if ('needsPhone' in result) {
        throw new Error('phone_required');
      }
      return result.token;
    } catch (err) {
      setErrorKey('auth.errors.generic');
      throw err;
    }
  }, [pendingGoogleIdentity, finishWithBackend]);

  // Boot: restore modal from sessionStorage; consume one-shot redirect if any
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const stored = loadPendingGoogleUser();
      if (stored) {
        setPendingGoogleIdentity(stored);
        setNeedsProfileCompletion(true);
      }

      try {
        const redirect = await getRedirectResult(auth);
        if (!cancelled && redirect?.user) {
          const result = await ingestGoogleUser(redirect.user);
          if (result.status === 'ready') {
            sessionStorage.setItem(GOOGLE_TOKEN_KEY, result.token);
            window.dispatchEvent(new CustomEvent('mestigo-google-token', { detail: result.token }));
          }
        }
      } catch (err) {
        console.warn('Google redirect result failed', err);
      }

      // Drop any leftover Firebase session that isn't part of admin/partner flow
      if (!cancelled && auth.currentUser) {
        try {
          await signOut(auth);
        } catch {
          /* ignore */
        }
      }

      if (!cancelled) setLoading(false);
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [ingestGoogleUser]);

  useEffect(() => {
    const pending = sessionStorage.getItem(GOOGLE_TOKEN_KEY);
    if (!pending) return;
    sessionStorage.removeItem(GOOGLE_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('mestigo-google-token', { detail: pending }));
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<GoogleSignInResult> => {
    setErrorKey(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    provider.addScope('email');
    provider.addScope('profile');

    try {
      // POPUP ONLY — redirect was dumping users on home with a wiped session
      const result = await signInWithPopup(auth, provider);
      return await ingestGoogleUser(result.user);
    } catch (err) {
      // COOP / window.closed noise: popup often still signed the user in
      if (auth.currentUser?.email) {
        try {
          return await ingestGoogleUser(auth.currentUser);
        } catch {
          /* fall through to real error */
        }
      }
      const code = getFirebaseErrorCode(err);
      setErrorKey(firebaseAuthErrorKey(code));
      throw err;
    }
  }, [ingestGoogleUser]);

  const signInAdmin = useCallback(async (email: string, password: string) => {
    setErrorKey(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const adminSnap = await getDoc(doc(db, 'admins', result.user.uid));
      if (!adminSnap.exists()) {
        await signOut(auth);
        setErrorKey('auth.errors.insufficient_rights');
        throw new Error('insufficient_rights');
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'insufficient_rights') {
        setErrorKey('auth.errors.insufficient_rights');
      } else {
        setErrorKey(firebaseAuthErrorKey(getFirebaseErrorCode(err)));
      }
      throw err;
    }
  }, []);

  const signInPartner = useCallback(async (email: string, password: string) => {
    setErrorKey(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const partnerSnap = await getDoc(doc(db, 'partners', result.user.uid));
      if (!partnerSnap.exists()) {
        await signOut(auth);
        setErrorKey('auth.errors.insufficient_rights');
        throw new Error('insufficient_rights');
      }
      const data = partnerSnap.data();
      if (!data.partnerId) {
        await signOut(auth);
        setErrorKey('auth.errors.insufficient_rights');
        throw new Error('insufficient_rights');
      }
    } catch (err) {
      const code = getFirebaseErrorCode(err);
      if (err instanceof Error && err.message === 'insufficient_rights') {
        setErrorKey('auth.errors.insufficient_rights');
      } else {
        setErrorKey(firebaseAuthErrorKey(code));
      }
      throw err;
    }
  }, []);

  const clearFirebaseSession = useCallback(async () => {
    setErrorKey(null);
    try {
      await signOut(auth);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    setErrorKey(null);
    clearPendingGoogleUser();
    setPendingGoogleIdentity(null);
    setNeedsProfileCompletion(false);
    try {
      await signOut(auth);
    } catch {
      /* ignore */
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_phone');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    setProfile(null);
    setRole(null);
  }, []);

  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    pendingGoogleIdentity,
    profile,
    role,
    loading,
    needsProfileCompletion,
    errorKey,
    clearError,
    signInWithGoogle,
    completeCustomerProfile,
    signInAdmin,
    signInPartner,
    logout,
    clearFirebaseSession,
    getIdToken,
  }), [
    user,
    pendingGoogleIdentity,
    profile,
    role,
    loading,
    needsProfileCompletion,
    errorKey,
    clearError,
    signInWithGoogle,
    completeCustomerProfile,
    signInAdmin,
    signInPartner,
    logout,
    clearFirebaseSession,
    getIdToken,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
