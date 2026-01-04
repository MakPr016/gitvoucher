import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

type BadgeIntent = 'success' | 'error' | 'loading' | 'neutral';

interface BadgeProps {
    intent?: BadgeIntent;
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export const Badge = ({ intent = 'neutral', children, className = '', icon }: BadgeProps) => {
    const baseStyles = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border animate-in fade-in slide-in-from-bottom-2 duration-300";

    const variants = {
        success: "bg-green-500/10 text-green-400 border-green-500/20",
        error: "bg-red-500/10 text-red-400 border-red-500/20",
        loading: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        neutral: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };

    const Icon = icon ? null : (
        intent === 'success' ? CheckCircle2 :
            intent === 'error' ? AlertCircle :
                intent === 'loading' ? Loader2 :
                    Info
    );

    return (
        <div className={`${baseStyles} ${variants[intent]} ${className}`}>
            {icon ? icon : (Icon && <Icon className={`w-4 h-4 ${intent === 'loading' ? 'animate-spin' : ''}`} />)}
            <span>{children}</span>
        </div>
    );
};
