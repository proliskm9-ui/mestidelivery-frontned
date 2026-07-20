/** Map Firebase Auth error codes to i18n keys under auth.errors.* */
export function firebaseAuthErrorKey(codeOrMessage: string): string {
  const code = codeOrMessage.replace(/^Firebase:\s*/i, '').replace(/\s*\(.*\)\s*$/, '').trim();
  const normalized = code.startsWith('auth/') ? code : `auth/${code}`;

  switch (normalized) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'auth.errors.popup_closed';
    case 'auth/account-exists-with-different-credential':
      return 'auth.errors.account_exists';
    case 'auth/network-request-failed':
      return 'auth.errors.network';
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
      return 'auth.errors.invalid_credentials';
    case 'auth/too-many-requests':
      return 'auth.errors.too_many_requests';
    case 'auth/user-disabled':
      return 'auth.errors.user_disabled';
    default:
      return 'auth.errors.generic';
  }
}

export function getFirebaseErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
    return (err as { code: string }).code;
  }
  if (err instanceof Error) return err.message;
  return 'auth/unknown';
}
