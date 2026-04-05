import { CSSProperties } from 'react';
type IconProps = { size?: number; className?: string; style?: CSSProperties };

// Order Status Icons
export function ClockIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function CheckIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ChefIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M6 18v-3a6 6 0 0112 0v3" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
            <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function PackageIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M3 9l9-5 9 5-9 5-9-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M3 9v8l9 5 9-5V9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 14v8" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

export function DeliveryIcon({ size = 24, className = '', style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
            <rect x="1" y="8" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="2" />
            <path d="M15 11h3.5a1 1 0 01.8.4l2.5 3.33a1 1 0 01.2.6V16a1 1 0 01-1 1h-6" stroke="currentColor" strokeWidth="2" />
            <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

export function StarIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M12 2l3 6 6.5 1-4.7 4.6 1.1 6.5L12 17l-5.9 3.1 1.1-6.5L2.5 9l6.5-1 3-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

export function CancelIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function RefreshIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 21v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function MapPinIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M12 21s-8-6.35-8-11a8 8 0 1116 0c0 4.65-8 11-8 11z" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

export function ShoppingBagIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M6 6h12l1.5 12H4.5L6 6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 9V5a3 3 0 016 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

// Admin Dashboard Icons
export function OrdersIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M7 8h10M7 12h6M7 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function DollarIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6v12M8 9.5c0-1 1-2 2-2h4c1 0 2 1 2 2s-1 2-2 2h-4c-1 0-2 1-2 2s1 2 2 2h4c1 0 2-1 2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function ProductIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 4h8M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function RestaurantIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M3 21h18M5 21V7l7-4 7 4v14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <rect x="9" y="13" width="6" height="8" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

export function HomeIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M3 10l9-7 9 7v11a1 1 0 01-1 1H4a1 1 0 01-1-1V10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

export function UsersIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" />
            <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21v-2a3 3 0 00-3-3h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function CategoriesIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

export function StoreIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M4 7l1.5-4h13L20 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M4 7v12a1 1 0 001 1h14a1 1 0 001-1V7" stroke="currentColor" strokeWidth="2" />
            <path d="M4 7h16" stroke="currentColor" strokeWidth="2" />
            <rect x="9" y="13" width="6" height="7" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

export function LogoutIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function EditIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M17 3l4 4L7 21H3v-4L17 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

export function TrashIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

export function PlusIcon({ size = 24, className = '', style }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function BellIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" />
            <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
