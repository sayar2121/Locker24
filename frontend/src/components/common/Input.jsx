import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = ({ 
  label, 
  error, 
  className, 
  icon: Icon, 
  ...props 
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-sm font-semibold text-muted-foreground ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary-600 transition-colors">
            <Icon size={20} />
          </div>
        )}
        <input
          className={twMerge(
            clsx(
              "w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 transition-all duration-200 outline-none focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm",
              Icon && "pl-12",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
              className
            )
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 ml-1 mt-1 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
