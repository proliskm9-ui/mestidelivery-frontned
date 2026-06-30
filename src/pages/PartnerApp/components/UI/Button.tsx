import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = "font-bold rounded-full py-4 px-6 active:scale-[0.97] transition-all duration-200 ease-out select-none flex items-center justify-center gap-2 relative overflow-hidden";
  
  const variants = {
    primary: "bg-[#00C853] text-[#0F1210] shadow-lg shadow-emerald-950/20 active:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none",
    secondary: "bg-zinc-900 border border-zinc-800 text-zinc-300 active:bg-zinc-800 disabled:opacity-50",
    danger: "bg-rose-500 text-white shadow-lg shadow-rose-950/20 active:bg-rose-600 disabled:opacity-50"
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Загрузка...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
