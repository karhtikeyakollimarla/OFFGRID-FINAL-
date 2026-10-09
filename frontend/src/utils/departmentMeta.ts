import { HardHat, Trash2, Droplets, Waves, Zap, Building2 } from 'lucide-react';
import React from 'react';

export interface DepartmentInfo {
  name: string;
  code: string;
  division: string;
  category: string;
  sla: string;
  color: {
    bg: string;
    border: string;
    text: string;
    pill: string;
    lightBg: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const DEPARTMENTS_DATA: Record<string, DepartmentInfo> = {
  'Public Works – Roads': {
    name: 'Public Works – Roads',
    code: 'PWD-RDS',
    division: 'Executive Engineer (Road Infrastructure & Pavements)',
    category: 'Roads',
    sla: '48 Hours (Emergency: 4 Hours)',
    color: {
      bg: 'bg-sky-50',
      border: 'border-sky-300',
      text: 'text-sky-900',
      pill: 'bg-sky-100 text-sky-800 border-sky-300',
      lightBg: '#F0F9FF',
    },
    icon: HardHat,
    description: 'Road surfacing, potholes, flyovers, pedestrian walkways, and asphalt repairs.',
  },
  'Sanitation & Solid Waste': {
    name: 'Sanitation & Solid Waste',
    code: 'MC-SWM',
    division: 'Chief Sanitary Inspector (Waste Management Cell)',
    category: 'Sanitation',
    sla: '24 Hours (Litter: 12 Hours)',
    color: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-900',
      pill: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      lightBg: '#ECFDF5',
    },
    icon: Trash2,
    description: 'Municipal garbage clearance, community bins, street sweeping, and sanitary landfill disposal.',
  },
  'Water Supply Board': {
    name: 'Water Supply Board',
    code: 'WTC-DJB',
    division: 'Assistant Executive Engineer (Potable Water Distribution)',
    category: 'Water Supply',
    sla: '24-48 Hours (Pipeline Burst: 3 Hours)',
    color: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-300',
      text: 'text-cyan-900',
      pill: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      lightBg: '#ECFEFF',
    },
    icon: Droplets,
    description: 'Potable water pipelines, booster pump stations, supply pressure, and contamination control.',
  },
  'Drainage & Sewerage': {
    name: 'Drainage & Sewerage',
    code: 'PWD-DRN',
    division: 'Superintending Engineer (Stormwater & Sewer Line Division)',
    category: 'Drainage',
    sla: '24 Hours (Overflow / Hazard: 4 Hours)',
    color: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-900',
      pill: 'bg-blue-100 text-blue-800 border-blue-300',
      lightBg: '#EFF6FF',
    },
    icon: Waves,
    description: 'Sewer backflows, open manholes, roadside drains, stormwater desilting, and waterlogging.',
  },
  'Electrical & Street Lighting': {
    name: 'Electrical & Street Lighting',
    code: 'ELEC-SL',
    division: 'Assistant Electrical Inspector (Street Lighting & High Mast)',
    category: 'Streetlights & Electrical',
    sla: '24 Hours (Sparking / Live Wire: Immediate 1 Hour)',
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-900',
      pill: 'bg-amber-100 text-amber-800 border-amber-300',
      lightBg: '#FFFBEB',
    },
    icon: Zap,
    description: 'Streetlight lamps, transformers, electric poles, wiring hazards, and junction boxes.',
  },
  'General Administration': {
    name: 'General Administration',
    code: 'GEN-ADM',
    division: 'Zonal Assistant Commissioner (Grievance Redressal)',
    category: 'Other',
    sla: '72 Hours',
    color: {
      bg: 'bg-slate-50',
      border: 'border-slate-300',
      text: 'text-slate-800',
      pill: 'bg-slate-100 text-slate-800 border-slate-300',
      lightBg: '#F8FAFC',
    },
    icon: Building2,
    description: 'Encroachments, public nuisances, civic permits, and miscellaneous municipal complaints.',
  },
};

export const ALL_DEPARTMENTS_LIST = Object.keys(DEPARTMENTS_DATA);

export function getDepartmentMeta(name: string): DepartmentInfo {
  // Try exact match
  if (DEPARTMENTS_DATA[name]) {
    return DEPARTMENTS_DATA[name];
  }
  // Try partial match
  const normalized = name.toLowerCase().replace(/[-–—]/g, ' ');
  for (const [key, val] of Object.entries(DEPARTMENTS_DATA)) {
    const keyNorm = key.toLowerCase().replace(/[-–—]/g, ' ');
    if (normalized.includes(keyNorm) || keyNorm.includes(normalized)) {
      return val;
    }
  }
  return DEPARTMENTS_DATA['General Administration'];
}
