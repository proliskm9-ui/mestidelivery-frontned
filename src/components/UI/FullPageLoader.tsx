import React from 'react';
import './FullPageLoader.css';

interface FullPageLoaderProps {
    text?: string;
}

const FullPageLoader: React.FC<FullPageLoaderProps> = ({ text = 'Загрузка...' }) => {
    return (
        <div className="global-loading-container">
            <div className="global-loading-spinner" />
            <span className="global-loading-text">{text}</span>
        </div>
    );
};

export default FullPageLoader;
