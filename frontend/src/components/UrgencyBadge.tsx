import React from 'react';
import { Urgency } from '../types';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

interface UrgencyBadgeProps {
  urgency: Urgency;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({
  urgency,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const configs = {
    Critical: {
      bg: 'bg-red-50 text-red-700 border-red-200 ring-red-500/20',
      dot: 'bg-red-500',
      icon: ShieldAlert,
    },
    High: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
    },
    Medium: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
      dot: 'bg-blue-500',
      icon: Info,
    },
    Low: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
      dot: 'bg-emerald-500',
      icon: AlertCircle,
    },
  };

  const config = configs[urgency] || configs.Medium;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {urgency}
    </span>
  );
};
