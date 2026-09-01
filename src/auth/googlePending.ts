/** Survives full page reload — Google identity after OAuth redirect */
export const GOOGLE_USER_KEY = 'mestigo_google_user';
export const GOOGLE_TOKEN_KEY = 'pending_google_token';
export const GOOGLE_PENDING_TOKEN_KEY = 'google_pending_token';

export interface PendingGoogleIdentity {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export function savePendingGoogleUser(user: PendingGoogleIdentity) {
  sessionStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
}

export function loadPendingGoogleUser(): PendingGoogleIdentity | null {
  try {
    const raw = sessionStorage.getItem(GOOGLE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingGoogleIdentity;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingGoogleUser() {
  sessionStorage.removeItem(GOOGLE_USER_KEY);
}
