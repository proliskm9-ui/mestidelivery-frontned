import React from 'react';
import { useLanguage } from '../../translations/LanguageContext';

interface NetworkErrorStateProps {
    onRetry?: () => void;
}

const NetworkErrorState: React.FC<NetworkErrorStateProps> = ({ onRetry }) => {
    const { t } = useLanguage();
    return (
        <div style={{ 
            textAlign: 'center', 
            padding: '80px 20px', 
            color: '#888', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            minHeight: '40vh' 
        }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📡</div>
            <h3 style={{ color: 'white', marginBottom: '12px', fontSize: '20px', fontWeight: 'bold' }}>
                {t('common.network_error_title')}
            </h3>
            <p style={{ marginBottom: '32px', lineHeight: '1.5', maxWidth: '300px' }}>
                {t('common.network_error_desc')}
            </p>
            <button 
                onClick={() => {
                    if (onRetry) {
                        onRetry();
                    } else {
                        window.location.reload();
                    }
                }} 
                style={{ 
                    padding: '14px 28px', 
                    fontSize: '16px', 
                    background: '#21EA7C', 
                    color: 'black', 
                    border: 'none', 
                    borderRadius: '16px', 
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, filter 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {t('common.reload')}
            </button>
        </div>
    );
};

export default NetworkErrorState;
