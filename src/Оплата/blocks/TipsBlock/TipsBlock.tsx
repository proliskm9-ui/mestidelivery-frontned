import React, { useState } from 'react';
import './TipsBlock.css';

interface TipsBlockProps {
  tipAmount: number;
  setTipAmount: (amount: number) => void;
  onOpenCustomTip: () => void;
}

const TipsBlock: React.FC<TipsBlockProps> = ({ tipAmount, setTipAmount, onOpenCustomTip }) => {
  // Локальное состояние для галочки "Сохранить выбор"
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Список фиксированных чаевых
  const presets: number[] = [0, 0.70, 1.20, 1.70];

  // Проверяем, является ли текущее значение одним из пресетов
  const isCustom: boolean = !presets.includes(tipAmount);

  const handlePresetClick = (amount: number): void => {
    setTipAmount(amount);
  };

  return (
    <section className="tips-card">
      <div className="tips-header">
        <h2 className="tips-title">Чаевые курьеру</h2>
        <div className="tips-chev-ph"></div>
      </div>

      {/* Кнопки выбора */}
      <div className="tip-buttons">

        {/* Кнопка "Без чаевых" (0) */}
        <button
          type="button"
          className={`tip-btn tip-btn--text ${tipAmount === 0 ? 'active' : ''}`}
          onClick={() => handlePresetClick(0)}
        >
          Без<br />чаевых
        </button>

        {/* Кнопки с суммами */}
        {presets.slice(1).map((amount) => (
          <button
            key={amount}
            type="button"
            className={`tip-btn tip-btn--number ${tipAmount === amount ? 'active' : ''}`}
            onClick={() => handlePresetClick(amount)}
          >
            {amount.toFixed(2)} ₾
          </button>
        ))}

        {/* Кнопка "Другая сумма" */}
        <button
          id="customTipBtn"
          type="button"
          className={`tip-btn ${isCustom ? 'active tip-btn--number' : 'tip-btn--text'}`}
          onClick={onOpenCustomTip}
        >
          {isCustom ? (
            `${tipAmount.toFixed(2)} ₾`
          ) : (
            <>Другая<br />сумма</>
          )}
        </button>
      </div>

      {/* Чекбокс "Сохранить выбор" */}
      <div
        className={`save-choice-row ${isSaved ? 'active' : ''}`}
        onClick={() => setIsSaved(!isSaved)}
      >
        <div className="save-choice-checkbox">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className="save-choice-text">Сохранить выбор</span>
      </div>
    </section>
  );
};

export default TipsBlock;