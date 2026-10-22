import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]';

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  const variants = {
    primary:
      'bg-[#4F46E5] hover:bg-[#4338CA] dark:bg-[#4F46E5] dark:hover:bg-[#4338CA] text-white shadow-sm focus:ring-[#4F46E5] dark:focus:ring-offset-[#0B1120]',
    secondary:
      'bg-gray-100 hover:bg-gray-200 dark:bg-[#1F2937] dark:hover:bg-[#374151] text-[#172033] dark:text-[#F3F4F6] focus:ring-gray-300 dark:focus:ring-offset-[#0B1120]',
    outline:
      'border border-[#E4E7EC] dark:border-[#374151] bg-transparent hover:bg-gray-50 dark:hover:bg-[#1F2937] text-[#172033] dark:text-[#F3F4F6] focus:ring-indigo-500 dark:focus:ring-offset-[#0B1120]',
    danger:
      'bg-[#DC2626] hover:bg-[#B91C1C] dark:bg-[#DC2626] dark:hover:bg-[#B91C1C] text-white shadow-sm focus:ring-red-500 dark:focus:ring-offset-[#0B1120]',
    ghost:
      'bg-transparent hover:bg-gray-100 dark:hover:bg-[#1F2937] text-[#667085] dark:text-[#9CA3AF] hover:text-[#172033] dark:hover:text-[#F3F4F6] focus:ring-transparent'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
