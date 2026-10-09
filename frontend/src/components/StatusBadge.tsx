import React from 'react';
import { ComplaintStatus } from '../types';
import { Clock, UserCheck, PlayCircle, CheckCircle2, RotateCcw, Archive } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true, className = '' }) => {
  const configs: Record<string, { bg: string; icon: any }> = {
    New: {
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: Clock,
    },
    Assigned: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: UserCheck,
    },
    'In Progress': {
      bg: 'bg-amber-50 text-amber-800 border-amber-300',
      icon: PlayCircle,
    },
    Resolved: {
      bg: 'bg-teal-50 text-teal-800 border-teal-300',
      icon: CheckCircle2,
    },
    Reopened: {
      bg: 'bg-rose-50 text-rose-800 border-rose-300',
      icon: RotateCcw,
    },
    Closed: {
      bg: 'bg-slate-200 text-slate-800 border-slate-400',
      icon: Archive,
    },
    Dismissed: {
      bg: 'bg-slate-200 text-slate-800 border-slate-400',
      icon: Archive,
    },
  };

  const config = configs[status] || configs.New;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${config.bg} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {status}
    </span>
  );
};
