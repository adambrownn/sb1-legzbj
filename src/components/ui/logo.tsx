import React from 'react';
import { cn } from '@/lib/utils';
import { Home } from 'lucide-react';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'small';
}

export function Logo({ variant = 'default', className, ...props }: LogoProps) {
  const baseStyles = "flex items-center gap-2 font-semibold text-primary hover:opacity-90 transition-opacity";
  const sizeStyles = variant === 'small' ? "text-lg" : "text-2xl";

  return (
    <div className={cn(baseStyles, sizeStyles, className)} {...props}>
      <Home className={cn("text-primary", variant === 'small' ? "h-5 w-5" : "h-6 w-6")} />
      <span>Rovers</span>
    </div>
  );
}
