import React from 'react';

const BottomNav: React.FC<{ activePage: string; onNavigate: (page: string) => void }> = ({ activePage, onNavigate }) => {
    return (
        <>
            <style>{`
            .bottom-nav { display: flex; }
            @media (min-width: 769px) {
                .bottom-nav { display: none !important; }
            }
        `}</style>
            <div className="bottom-nav" style={{
                position: 'fixed',
                bottom: '20px', // Start floating
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90%', // Mobile width
                maxWidth: '500px', // Desktop max width
                height: '70px',
                background: 'rgba(20, 20, 20, 0.6)', // Semi-transparent dark
                backdropFilter: 'blur(16px) saturate(180%)', // iOS/Glass effect
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                borderRadius: '25px', // Pill shape
                border: '1px solid rgba(255, 255, 255, 0.1)', // Subtle border
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)', // Glass shadow
                justifyContent: 'space-around',
                alignItems: 'center',
                zIndex: 100,
                padding: '0 10px'
            }}>
                {/* Home Item */}
                <div
                    onClick={() => onNavigate('home')}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                        color: activePage === 'home' ? '#21EA7C' : 'rgba(255,255,255,0.4)',
                        transition: 'color 0.3s'
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                </div>

                {/* Menu Item */}
                <div
                    onClick={() => onNavigate('menu')}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                        color: activePage === 'menu' ? '#21EA7C' : 'rgba(255,255,255,0.4)',
                        transform: activePage === 'menu' ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.3s'
                    }}
                >
                    {/* Center standout button effect */}
                    <div style={{
                        background: activePage === 'menu' ? 'rgba(33, 234, 124, 0.2)' : 'transparent',
                        borderRadius: '50%',
                        padding: '10px',
                        boxShadow: activePage === 'menu' ? '0 0 15px rgba(33, 234, 124, 0.3)' : 'none',
                        transition: 'all 0.3s'
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
                    </div>
                </div>

                {/* Cart Item */}
                <div
                    onClick={() => onNavigate('cart')}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                        color: activePage === 'cart' ? '#21EA7C' : 'rgba(255,255,255,0.4)',
                        transition: 'color 0.3s'
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
                </div>
                <div
                    onClick={() => onNavigate('profile')}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                        color: activePage === 'profile' ? '#21EA7C' : 'rgba(255,255,255,0.4)',
                        transition: 'color 0.3s'
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
            </div>
        </>
    );
};

export default BottomNav;
