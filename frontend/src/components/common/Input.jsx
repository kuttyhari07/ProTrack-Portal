import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  required = false,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="h-4 w-4 text-[#667085] dark:text-[#9CA3AF]" />
          </div>
        )}
        <input
          id={id}
          type={type}
          disabled={disabled}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-lg border bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${
            Icon ? 'pl-9' : 'pl-3.5'
          } pr-3.5 py-2.5 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-[#E4E7EC] dark:border-[#374151] focus:border-[#4F46E5]'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-[#667085] dark:text-[#9CA3AF]">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
