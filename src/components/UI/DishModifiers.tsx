import React from 'react';
import './DishModifiers.css';
import { formatPrice } from '../../utils/formatPrice';

export interface DishModifierOption {
    id: string;
    name: string;
    price: number;
}

interface DishModifiersProps {
    title: string;
    options: DishModifierOption[];
    picked: string[];
    onToggle: (id: string) => void;
}

/** "Add to your dish": a plain list, price and a round check on the right. */
const DishModifiers: React.FC<DishModifiersProps> = ({ title, options, picked, onToggle }) => {
    if (!options.length) return null;
    return (
        <section className="dish-mods">
            <h3 className="dish-mods-label">{title}</h3>
            <div className="dish-mods-list">
                {options.map((o) => {
                    const on = picked.includes(o.id);
                    return (
                        <button
                            key={o.id}
                            type="button"
                            className={`dish-mods-row${on ? ' is-on' : ''}`}
                            aria-pressed={on}
                            onClick={() => onToggle(o.id)}
                        >
                            <span className="dish-mods-name">{o.name}</span>
                            <span className="dish-mods-price">+{formatPrice(o.price)}</span>
                            <span className="dish-mods-check" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default DishModifiers;
