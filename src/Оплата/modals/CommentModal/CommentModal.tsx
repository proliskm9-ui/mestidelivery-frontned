import React, { useState, useEffect } from 'react';
import './CommentModal.css';
import { useLanguage } from '../../../translations/LanguageContext';
import Sheet from '../../../components/UI/Sheet';

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

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={t('checkout.comment_to_order')}
      description={val ? t('checkout.has_comment') : t('checkout.no_comment')}
      className="checkout-sheet"
      footer={<button type="button" className="md-sheet-cta" onClick={() => { onSave(val); onClose(); }}>{t('common.save')}</button>}
    >

        <div className={`cm-input-wrapper ${val ? 'has-value' : ''}`}>
          <label className="cm-input-label">{t('checkout.comment_to_order')}</label>
          <input
            className="cm-input"
            placeholder={t('checkout.comment_placeholder_example')}
            value={val}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
          />
        </div>

    </Sheet>
  );
};

export default CommentModal;
