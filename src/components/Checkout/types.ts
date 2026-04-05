export interface AddressData {
    type: 'home' | 'hotel' | 'map';
    street?: string;
    house?: string;
    apartment?: string;
    floor?: string;
    hotelName?: string;
    room?: string;
    deliveryNote?: string;
    geo?: string;
    landmark?: string;
    comment?: string;
    phone?: string;
}

export interface OrderData {
    deliveryType: 'standard' | 'scheduled';
    scheduledTime: string | null;
    address: AddressData;
    payment: 'cash' | 'card';
    promoCode: string;
    tip: number;
}
