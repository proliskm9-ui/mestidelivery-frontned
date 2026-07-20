/**
 * International phone validation for Georgia / CIS / tourists.
 * Accepts optional +, digits, spaces, dashes, parentheses; 8–15 digits total.
 */
export function isValidInternationalPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (!/^\+?[\d\s\-()]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return `+${digits}`;
  return digits;
}
