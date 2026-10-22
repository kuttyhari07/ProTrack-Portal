import React from 'react';

const Select = ({
  label,
  id,
  value,
  onChange,
  options = [],
  error,
  helperText,
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
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full rounded-lg border bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] px-3.5 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-[#E4E7EC] dark:border-[#374151] focus:border-[#4F46E5]'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-[#667085] dark:text-[#9CA3AF]">{helperText}</p>
      )}
    </div>
  );
};

export default Select;
