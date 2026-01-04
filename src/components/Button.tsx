import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    isLoading?: boolean;
}

export const Button = ({
    children,
    variant = 'primary',
    isLoading,
    className = '',
    disabled,
    ...props
}: ButtonProps) => {
    const baseStyles = "relative px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden group";

    const variants = {
        primary: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/20 active:scale-[0.98]",
        secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 active:scale-[0.98]",
        danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 active:scale-[0.98]"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}

            {/* Glossy effect */}
            {variant === 'primary' && !disabled && (
                <div className="absolute inset-0 rounded-lg ring-1 ring-white/20 group-hover:ring-white/30" />
            )}
        </button>
    );
};
