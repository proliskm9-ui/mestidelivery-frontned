export type UserRole = 'customer' | 'admin' | 'partner';

export interface CustomerProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  photoURL: string;
  provider: 'google';
  role: 'customer';
  createdAt?: unknown;
}

export interface AdminProfile {
  uid: string;
  email: string;
  role: 'admin';
  displayName?: string;
}

export interface PartnerProfile {
  uid: string;
  email: string;
  role: 'partner';
  partnerId: string;
  displayName?: string;
}

export type AuthProfile = CustomerProfile | AdminProfile | PartnerProfile | null;
