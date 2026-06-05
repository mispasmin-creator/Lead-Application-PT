import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  icon,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center font-semibold transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  
  const sizes = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2"
  };

  const variants = {
    primary: "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm focus-visible:ring-indigo-500",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm focus-visible:ring-slate-500",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm focus-visible:ring-red-500",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-500"
  };

  const isDisabled = disabled || isLoading;

  return (
    <button 
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
