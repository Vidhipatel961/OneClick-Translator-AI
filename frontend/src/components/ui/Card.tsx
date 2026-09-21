import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', glass = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl border border-border p-6 ${
          glass ? 'glass-panel' : 'bg-surface'
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
