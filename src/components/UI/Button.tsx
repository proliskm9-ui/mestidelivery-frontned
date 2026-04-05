import React from 'react';
// Actually, generic CSS is requested. I will use plain CSS with a module for the button.

/* Button.module.css generation */
const styles = {
    btn: {
        background: 'linear-gradient(180deg, #21EA7C 0%, #21EA7C 20%, #21EA7C 100%)', // User spec
        boxShadow: '0px 4px 5px 0px rgba(59, 180, 74, 0.2), inset 0px 4px 10px 0px rgba(59, 180, 74, 0.2)', // Inner + Drop
        // "color: #3BB44A , opacity: 20%" -> This part is tricky. Maybe text color is #3BB44A?
        // But #3BB44A on #21EA7C is low contrast.
        // If opacity 20% applies to the button background?
        // But gradient was specified.
        // I will assume text is Dark or White. 
        // Given the minimalist dark theme, maybe black text on green button?
        color: '#000',
        border: 'none',
        padding: '12px 32px',
        borderRadius: '30px',
        fontSize: '1rem',
        fontWeight: '700',
        fontFamily: '"Inter", sans-serif',
        cursor: 'pointer',
        textTransform: 'uppercase' as const,
        transition: 'all 0.3s ease',
        position: 'relative' as const,
        overflow: 'hidden',
    }
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, style, ...props }) => {
    return (
        <button
            style={{ ...styles.btn, ...style }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0px 6px 15px 0px rgba(59, 180, 74, 0.4), inset 0px 4px 10px 0px rgba(59, 180, 74, 0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = styles.btn.boxShadow!;
            }}
            {...props}
        >
            {children}
        </button>
    );
};
