import React, { useState, useEffect } from 'react';
import './CommentModal.css';
import { useLanguage } from '../../../translations/LanguageContext';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
  onSave: (val: string) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, currentValue, onSave }) => {
  const { t } = useLanguage();
  const [val, setVal] = useState<string>('');

  useEffect(() => {
    if (isOpen) setVal(currentValue || '');
  }, [isOpen, currentValue]);

  if (!isOpen) return null;

  return (
    <>
      <div className="cm-overlay active comment-modal-overlay" onClick={onClose}>
      <div className="cm-bottom-sheet active comment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cm-header">
          <div>
            <h2 className="cm-title">{t('checkout.comment_to_order')}</h2>
            <p className="cm-subtitle">{val ? t('checkout.has_comment') : t('checkout.no_comment')}</p>
          </div>
          <button className="cm-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className={`cm-input-wrapper ${val ? 'has-value' : ''}`}>
          <label className="cm-input-label">{t('checkout.comment_to_order')}</label>
          <input
            className="cm-input"
            placeholder={t('checkout.comment_placeholder_example')}
            value={val}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
          />
        </div>

        <button className="cm-confirm-btn" onClick={() => { onSave(val); onClose(); }}>
          {t('common.save')}
        </button>
      </div>
      </div>
    </>
  );
};

export default CommentModal;
