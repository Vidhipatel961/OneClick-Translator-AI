import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, label, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-text-muted">{label}</label>}
        <input
          ref={ref}
          className={`flex h-11 w-full rounded-lg border bg-surface/50 px-3 py-2 text-sm text-text-main file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-disabled focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
            error 
              ? 'border-red-500 focus-visible:ring-red-500' 
              : 'border-border focus-visible:ring-primary focus-visible:border-primary'
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
