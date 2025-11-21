import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 text-base font-medium transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-sans";
  
  const variants = {
    primary: "bg-charcoal text-white hover:bg-black hover:translate-y-[-2px] shadow-hard active:translate-y-[0px] active:shadow-none border-2 border-black",
    secondary: "bg-brand-blue text-white hover:bg-opacity-90 shadow-hard-sm border-2 border-transparent",
    outline: "bg-transparent text-charcoal border-2 border-charcoal hover:bg-charcoal hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Thinking...</span>
        </div>
      ) : children}
    </button>
  );
};