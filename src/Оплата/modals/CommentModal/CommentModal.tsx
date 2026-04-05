import React, { useState, useEffect } from 'react';
import './CommentModal.css';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
  onSave: (val: string) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, currentValue, onSave }) => {
  const [val, setVal] = useState<string>('');

  useEffect(() => {
    if (isOpen) setVal(currentValue || '');
  }, [isOpen, currentValue]);

  if (!isOpen) return null;

  return (
    <>
      <div className="cm-overlay active" onClick={onClose}></div>
      <div className="cm-bottom-sheet active">
        <div className="cm-header">
          <div>
            <h2 className="cm-title">Комментарий</h2>
            <p className="cm-subtitle">{val ? 'Есть комментарий' : 'Нет комментария'}</p>
          </div>
          <button className="cm-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className={`cm-input-wrapper ${val ? 'has-value' : ''}`}>
          <label className="cm-input-label">Комментарий к заказу</label>
          <input
            className="cm-input"
            placeholder="Например: Позвоните за час..."
            value={val}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
          />
        </div>

        <button className="cm-confirm-btn" onClick={() => { onSave(val); onClose(); }}>
          Сохранить
        </button>
      </div>
    </>
  );
};

export default CommentModal;