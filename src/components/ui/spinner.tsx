
import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'secondary' | 'destructive';
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  className,
  size = 'md',
  color = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-[3px]',
  };
  
  const colorClasses = {
    default: 'border-gray-300 border-t-gray-600',
    primary: 'border-blue-200 border-t-app-blue',
    secondary: 'border-gray-200 border-t-gray-800',
    destructive: 'border-red-200 border-t-red-600',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};
