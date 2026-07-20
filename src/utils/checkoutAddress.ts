/** Format checkout address for API / display (home, hotel, map). */
export function formatCheckoutAddress(addr: any): string {
  if (!addr) return '';

  if (addr.type === 'hotel') {
    return [
      addr.hotelName ? `Отель: ${addr.hotelName}` : '',
      addr.room ? `комн. ${addr.room}` : '',
      addr.deliveryNote || '',
    ].filter(Boolean).join(', ');
  }

  if (addr.type === 'map') {
    return [addr.geo, addr.landmark, addr.deliveryNote].filter(Boolean).join(', ');
  }

  return [addr.street, addr.house, addr.apartment && `кв. ${addr.apartment}`, addr.floor && `эт. ${addr.floor}`]
    .filter(Boolean)
    .join(', ');
}

/** Courier note: comment + delivery instructions. */
export function formatCourierComment(addr: any): string {
  if (!addr) return '';
  return [addr.comment, addr.deliveryNote].filter(Boolean).join('. ');
}
