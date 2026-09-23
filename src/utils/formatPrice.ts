/** One price format across the client: "18.00 ₾" (dot decimals, lari sign after a space). */
export function formatPrice(value: number | string | null | undefined): string {
    const n = Number(value);
    return `${(Number.isFinite(n) ? n : 0).toFixed(2)} ₾`;
}
