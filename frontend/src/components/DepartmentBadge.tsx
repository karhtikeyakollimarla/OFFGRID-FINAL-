import React from 'react';
import { getDepartmentMeta, ALL_DEPARTMENTS_LIST } from '../utils/departmentMeta';
import { Building2, Clock, ShieldCheck, ChevronDown } from 'lucide-react';

interface DepartmentBadgeProps {
  department: string;
  size?: 'sm' | 'md' | 'lg';
  showCode?: boolean;
  className?: string;
}

export const DepartmentBadge: React.FC<DepartmentBadgeProps> = ({
  department,
  size = 'md',
  showCode = false,
  className = '',
}) => {
  const meta = getDepartmentMeta(department);
  const Icon = meta.icon;

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${meta.color.pill} ${className}`}
        title={meta.name}
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span className="truncate max-w-[120px]">{showCode ? meta.code : meta.name}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-2xs ${meta.color.pill} ${className}`}
      title={`${meta.name} • ${meta.division}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{meta.name}</span>
      {showCode && (
        <span className="text-[10px] font-mono opacity-75 ml-0.5 font-bold uppercase">
          ({meta.code})
        </span>
      )}
    </span>
  );
};

interface DepartmentCardProps {
  department: string;
  showSla?: boolean;
  className?: string;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  showSla = true,
  className = '',
}) => {
  const meta = getDepartmentMeta(department);
  const Icon = meta.icon;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${meta.color.bg} ${meta.color.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-[#0B1F3A] leading-tight">
                {meta.name}
              </h4>
              <span className="font-mono text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white/90 border border-slate-300/80 text-slate-700">
                {meta.code}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium leading-snug">
              {meta.division}
            </p>
          </div>
        </div>

        <span className="text-[10px] uppercase tracking-wider font-extrabold bg-[#14B8A6]/20 text-[#0B1F3A] px-2 py-0.5 rounded border border-[#14B8A6]/30 shrink-0">
          Official Nodal Cell
        </span>
      </div>

      {showSla && (
        <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Target SLA: <strong className="text-slate-800">{meta.sla}</strong></span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-teal-800 font-semibold bg-white/80 px-2 py-0.5 rounded border border-teal-200">
            <ShieldCheck className="w-3 h-3 text-[#14B8A6]" />
            Direct Routing Active
          </div>
        </div>
      )}
    </div>
  );
};

interface DepartmentSelectProps {
  value: string;
  onChange: (dept: string) => void;
  className?: string;
}

export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white p-2.5 pr-8 focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent text-slate-800 appearance-none shadow-2xs transition-all"
      >
        {ALL_DEPARTMENTS_LIST.map((deptName) => {
          const meta = getDepartmentMeta(deptName);
          return (
            <option key={deptName} value={deptName}>
              {deptName} ({meta.code}) • {meta.sla}
            </option>
          );
        })}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
};
