import React from 'react';
import { ChevronDown } from 'lucide-react';

export const SelectField = ({
  label,
  options = [],
  error,
  helperText,
  className = '',
  id,
  required,
  ...props
}) => {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={`w-full py-2.5 pl-3.5 pr-10 rounded-xl text-xs sm:text-sm bg-white/90 dark:bg-slate-900/80 border backdrop-blur-xs appearance-none transition-all text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200/90 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500/20 shadow-xs'
          }`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {error ? (
        <p className="text-[11px] font-semibold text-rose-500 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
