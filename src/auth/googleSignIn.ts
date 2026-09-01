export type GoogleIdToken = { idToken: string; email: string; name: string };

function langFromPath(): string {
  const m = window.location.pathname.match(/^\/(ru|en|ka)(?:\/|$)/);
  return m ? m[1] : 'ru';
}

/** Direct standard backend Google OAuth (bulletproof across all browsers & devices). */
export function startDirectGoogleOAuth(returnTo?: string): never {
  const lang = langFromPath();
  const base = '/api/auth/google/start';
  const params = new URLSearchParams();
  params.set('lang', lang);
  if (returnTo) {
    params.set('return_to', returnTo);
  }
  window.location.assign(base + '?' + params.toString());
  throw new Error('redirecting');
}

export function preloadGoogleAuth(): Promise<void> {
  return Promise.resolve();
}

export async function signInWithGoogleIdToken(): Promise<GoogleIdToken> {
  startDirectGoogleOAuth();
}

export function consumeGoogleRedirect(): Promise<GoogleIdToken | null> {
  return Promise.resolve(null);
}

export function bootstrapGoogleRedirectConsume(): void {
}
