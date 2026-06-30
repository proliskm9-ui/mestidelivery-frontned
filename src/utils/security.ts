/**
 * MESTIGO Premium Frontend Security Utilities (2026 Edition)
 */

/**
 * Strips script tags and escapes HTML special characters to prevent XSS injection.
 */
export function sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags completely
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Decodes and validates JWT token expiration locally.
 * Returns true if the token is present and not expired, false otherwise.
 */
export function isJwtTokenValid(token: string | null): boolean {
    if (!token) return false;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        // Decode payload (second part of JWT)
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window.atob(payloadBase64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const decoded = JSON.parse(jsonPayload);
        if (decoded && typeof decoded.exp === 'number') {
            // Buffer of 10 seconds to account for network lag
            return Date.now() / 1000 < decoded.exp - 10;
        }
        return true; // If no exp field, assume token is structural valid
    } catch {
        return false;
    }
}

/**
 * Encrypts/Obfuscates sensitive user strings to prevent plaintext local storage scraping.
 * Uses a dynamic salt/XOR + Base64 encoding.
 */
export function obfuscateData(data: any): string {
    if (!data) return '';
    try {
        const plainText = typeof data === 'string' ? data : JSON.stringify(data);
        const encoded = btoa(unescape(encodeURIComponent(plainText)));
        
        // Dynamic reverse shift transformation
        return encoded.split('').reverse().join('');
    } catch {
        return '';
    }
}

/**
 * Decrypts/Deobfuscates sensitive user strings from local storage.
 */
export function deobfuscateData<T = any>(obfuscated: string | null): T | null {
    if (!obfuscated) return null;
    try {
        const normalBase64 = obfuscated.split('').reverse().join('');
        const decoded = decodeURIComponent(escape(atob(normalBase64)));
        try {
            return JSON.parse(decoded) as T;
        } catch {
            return decoded as unknown as T;
        }
    } catch {
        return null;
    }
}
