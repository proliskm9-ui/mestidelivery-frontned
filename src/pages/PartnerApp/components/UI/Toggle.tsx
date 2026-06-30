import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  activeLabel?: string;
  inactiveLabel?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  activeLabel,
  inactiveLabel
}) => {
  return (
    <div className="flex items-center justify-between gap-4 select-none">
      {label && (
        <span className="text-sm font-medium text-zinc-300">
          {label}
          {activeLabel && inactiveLabel && (
            <span className={`ml-1 text-xs font-semibold ${checked ? 'text-[#00C853]' : 'text-zinc-500'}`}>
              ({checked ? activeLabel : inactiveLabel})
            </span>
          )}
        </span>
      )}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${
          checked ? 'bg-[#00C853] pulsing-emerald' : 'bg-zinc-800'
        }`}
      >
        <div
          className={`bg-[#0F1210] w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ease-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
