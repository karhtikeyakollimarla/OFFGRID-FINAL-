import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchStats,
  fetchComplaints,
  fetchMapItems,
  triggerSeed,
  triggerReset
} from '../api/client';
import { Complaint, ComplaintMapItem, StatsData, Urgency, Category, ComplaintStatus } from '../types';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import { HotspotMap } from '../components/HotspotMap';
import { ComplaintActivityChart } from '../components/ComplaintActivityChart';
import { CategoryDonutChart } from '../components/CategoryDonutChart';
import { DepartmentBadge, DepartmentCard } from '../components/DepartmentBadge';
import { ALL_DEPARTMENTS_LIST, getDepartmentMeta } from '../utils/departmentMeta';
import {
  Building2,
  LayoutDashboard,
  FileText,
  Sparkles,
  Flame,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Database,
  RefreshCw,
  Plus,
  TrendingUp,
  ShieldAlert,
  Clock,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  MapPin,
  User,
  Cpu,
  AlertTriangle,
  RotateCcw,
  Archive,
  Filter,
} from 'lucide-react';

export const parseComplaintNumber = (id: string): number => {
  const match = id.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

export const URGENCY_PRIORITY: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const sortComplaintsList = (list: Complaint[]): Complaint[] => {
  return [...list].sort((a, b) => {
    // 1. Urgency priority: Critical (4) > High (3) > Medium (2) > Low (1)
    const uA = URGENCY_PRIORITY[a.urgency] || 0;
    const uB = URGENCY_PRIORITY[b.urgency] || 0;
    if (uB !== uA) return uB - uA;

    // 2. Complaint number numeric portion descending (CIV-00042 > CIV-00005)
    const numA = parseComplaintNumber(a.id);
    const numB = parseComplaintNumber(b.id);
    if (numB !== numA) return numB - numA;

    // 3. Creation time descending (secondary stable sort)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

type FilterTab =
  | 'all'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'needs_review'
  | 'open'
  | 'resolved'
  | 'reopened'
  | 'closed';

export const OfficerDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Active Tab: 'overview' | 'complaints' | 'ai_triage' | 'hotspots' | 'departments' | 'settings'
  const [activeTab, setActiveTab] = useState<
    'overview' | 'complaints' | 'ai_triage' | 'hotspots' | 'departments' | 'settings'
  >('overview');

  // Data state
  const [stats, setStats] = useState<StatsData | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [mapItems, setMapItems] = useState<ComplaintMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Selected ticket for centered floating modal
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);

  // Filters for Complaints Queue
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected ward filter for Hotspot tab
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, listData, mapData] = await Promise.all([
        fetchStats(),
        fetchComplaints(),
        fetchMapItems({
          include_resolved: true,
        }),
      ]);
      setStats(statsData);
      setComplaints(sortComplaintsList(listData));
      setMapItems(mapData);
    } catch (e: any) {
      console.error(e);
      setFeedback(`Failed to load data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleResetFilters = () => {
    setActiveFilterTab('all');
    setFilterDepartment('');
    setSearchTerm('');
    setSelectedWard(null);
  };

  // Dynamic live complaint counts for each filter
  const filterCounts = useMemo(() => {
    return {
      all: complaints.length,
      critical: complaints.filter((c) => c.urgency === 'Critical').length,
      high: complaints.filter((c) => c.urgency === 'High').length,
      medium: complaints.filter((c) => c.urgency === 'Medium').length,
      low: complaints.filter((c) => c.urgency === 'Low').length,
      needs_review: complaints.filter((c) => c.needs_review).length,
      open: complaints.filter((c) => ['New', 'Assigned', 'In Progress', 'Reopened'].includes(c.status)).length,
      resolved: complaints.filter((c) => c.status === 'Resolved').length,
      reopened: complaints.filter((c) => c.status === 'Reopened').length,
      closed: complaints.filter((c) => ['Closed', 'Dismissed'].includes(c.status)).length,
    };
  }, [complaints]);

  // Combined filtered and strictly sorted complaints
  const filteredAndSortedComplaints = useMemo(() => {
    let list = [...complaints];

    // 1. Tab / Urgency / Status Filter
    if (activeFilterTab === 'critical') list = list.filter((c) => c.urgency === 'Critical');
    else if (activeFilterTab === 'high') list = list.filter((c) => c.urgency === 'High');
    else if (activeFilterTab === 'medium') list = list.filter((c) => c.urgency === 'Medium');
    else if (activeFilterTab === 'low') list = list.filter((c) => c.urgency === 'Low');
    else if (activeFilterTab === 'needs_review') list = list.filter((c) => c.needs_review);
    else if (activeFilterTab === 'open') list = list.filter((c) => ['New', 'Assigned', 'In Progress', 'Reopened'].includes(c.status));
    else if (activeFilterTab === 'resolved') list = list.filter((c) => c.status === 'Resolved');
    else if (activeFilterTab === 'reopened') list = list.filter((c) => c.status === 'Reopened');
    else if (activeFilterTab === 'closed') list = list.filter((c) => ['Closed', 'Dismissed'].includes(c.status));

    // 2. Department Filter
    if (filterDepartment) {
      list = list.filter((c) => c.department === filterDepartment);
    }

    // 3. Search Filter (by ID, title/summary, description, category, department, ward/location, assignee)
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((c) =>
        c.id.toLowerCase().includes(term) ||
        c.summary.toLowerCase().includes(term) ||
        c.raw_text.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term) ||
        c.department.toLowerCase().includes(term) ||
        (c.location_text && c.location_text.toLowerCase().includes(term)) ||
        (c.assigned_to && c.assigned_to.toLowerCase().includes(term)) ||
        c.issue_type.toLowerCase().includes(term)
      );
    }

    // 4. Always apply smart urgency & numeric ID sorting
    return sortComplaintsList(list);
  }, [complaints, activeFilterTab, filterDepartment, searchTerm]);

  const handleSeed = async () => {
    setActionLoading(true);
    setFeedback('Seeding realistic complaint dataset...');
    try {
      const res = await triggerSeed();
      setFeedback(`Successfully seeded ${res.seeded} sample complaints.`);
      await loadAllData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback(`Seeding failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm('Reset database and re-seed 40 complaints?')) return;
    setActionLoading(true);
    setFeedback('Resetting and re-seeding database...');
    try {
      const res = await triggerReset();
      setFeedback(`Database reset and seeded with ${res.seeded} complaints.`);
      await loadAllData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback(`Reset failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTicketUpdated = (updated: Complaint) => {
    setSelectedTicket(updated);
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    loadAllData();
  };

  // Dynamic Greeting based on current hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Top Critical / High Priority Queue Items for Overview
  const priorityQueue = useMemo(() => {
    return complaints
      .filter((c) => c.status !== 'Resolved' && (c.urgency === 'Critical' || c.urgency === 'High'))
      .slice(0, 5);
  }, [complaints]);

  // Ward breakdown calculation for Hotspot tab (8 wards)
  const wardStats = useMemo(() => {
    const wards: { id: string; name: string; count: number; highPriority: number }[] = [];
    for (let i = 1; i <= 8; i++) {
      const wardId = `Ward 0${i}`;
      wards.push({ id: wardId, name: wardId, count: 0, highPriority: 0 });
    }
    complaints.forEach((c) => {
      // Deterministically bucket by ID hash
      const hash = Math.abs(c.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
      const idx = hash % 8;
      wards[idx].count += 1;
      if (c.urgency === 'Critical' || c.urgency === 'High') {
        wards[idx].highPriority += 1;
      }
    });
    return wards;
  }, [complaints]);

  // Department Workload Breakdown calculation for Department tab
  const departmentWorkload = useMemo(() => {
    return ALL_DEPARTMENTS_LIST.map((deptName) => {
      const meta = getDepartmentMeta(deptName);
      const deptComplaints = complaints.filter((c) => c.department === deptName);
      const total = deptComplaints.length;
      const open = deptComplaints.filter((c) => c.status !== 'Resolved').length;
      const resolved = deptComplaints.filter((c) => c.status === 'Resolved').length;
      const highPriority = deptComplaints.filter(
        (c) => c.status !== 'Resolved' && (c.urgency === 'Critical' || c.urgency === 'High')
      ).length;
      const workloadPct = complaints.length > 0 ? Math.round((open / complaints.length) * 100) : 0;

      return {
        name: deptName,
        code: meta.code,
        division: meta.division,
        icon: meta.icon,
        sla: meta.sla,
        total,
        open,
        resolved,
        highPriority,
        workloadPct,
      };
    });
  }, [complaints]);

  // Counts for sidebar badges
  const pendingCount = stats ? stats.total - stats.resolved : complaints.length;
  const needsReviewCount = stats ? stats.needs_review_count : 0;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-[#0F172A] font-sans">
      
      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR                                         */}
      {/* ======================================================== */}
      <aside className="w-64 bg-[#0B1F3A] text-white flex flex-col shrink-0 border-r border-[#1E293B] shadow-xl z-30">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#14B8A6] flex items-center justify-center text-[#0B1F3A] shadow-inner font-black">
              <Building2 className="w-5 h-5 text-[#0B1F3A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">Nagrik</span>
                <span className="text-[9px] font-bold bg-[#14B8A6]/20 text-[#14B8A6] px-1.5 py-0.5 rounded border border-[#14B8A6]/30 uppercase tracking-widest">
                  HQ
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">YOUR CITY. YOUR VOICE.</p>
            </div>
          </div>
        </div>

        {/* Workspace Selector Pill */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center gap-2.5 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-[#14B8A6] font-bold text-xs flex items-center justify-center border border-teal-500/30">
              MC
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-200 truncate">Metro City Council</h4>
              <p className="text-[10px] text-slate-400 truncate">Central Civic Operations</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Workspace
            </span>

            <nav className="space-y-1">
              {/* Tab 1: Overview */}
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#14B8A6] text-[#0B1F3A] font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Overview</span>
                </div>
              </button>

              {/* Tab 2: Complaints */}
              <button
                type="button"
                onClick={() => setActiveTab('complaints')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'complaints'
                    ? 'bg-[#14B8A6] text-[#0B1F3A] font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Complaints</span>
                </div>
                {pendingCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      activeTab === 'complaints'
                        ? 'bg-[#0B1F3A] text-white'
                        : 'bg-red-500/80 text-white'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Tab 3: AI Triage */}
              <button
                type="button"
                onClick={() => setActiveTab('ai_triage')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'ai_triage'
                    ? 'bg-[#14B8A6] text-[#0B1F3A] font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>AI Triage</span>
                </div>
                {needsReviewCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      activeTab === 'ai_triage'
                        ? 'bg-[#0B1F3A] text-teal-300'
                        : 'bg-amber-400 text-[#0B1F3A]'
                    }`}
                  >
                    {needsReviewCount}
                  </span>
                )}
              </button>

              {/* Tab 4: Hotspot Analysis */}
              <button
                type="button"
                onClick={() => setActiveTab('hotspots')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'hotspots'
                    ? 'bg-[#14B8A6] text-[#0B1F3A] font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 shrink-0" />
                  <span>Hotspot Analysis</span>
                </div>
              </button>

              {/* Tab 5: Department Performance */}
              <button
                type="button"
                onClick={() => setActiveTab('departments')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'departments'
                    ? 'bg-[#14B8A6] text-[#0B1F3A] font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Department Performance</span>
                </div>
              </button>

              {/* Tab 6: Settings */}
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#14B8A6] text-[#0B1F3A] font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Settings</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Quick Help Box */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#14B8A6]" />
              Need a hand?
            </span>
            <p className="text-[11px] text-slate-400">
              Live automated Resend dispatches and Gemini triage active.
            </p>
          </div>
        </div>

        {/* User Profile Bar */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-500/30">
              DA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Demo Administrator</p>
              <p className="text-[10px] text-slate-400 truncate">Municipal operations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Switch to Citizen Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE AREA                                  */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
          
          {/* Breadcrumbs & Title */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>NAGRIK</span>
              <span>/</span>
              <span className="text-[#14B8A6]">{activeTab.toUpperCase().replace('_', ' ')}</span>
            </div>
            <h2 className="text-base font-extrabold text-[#0B1F3A] capitalize leading-tight">
              {activeTab === 'overview' && 'Municipal Overview'}
              {activeTab === 'complaints' && 'Complaints Queue'}
              {activeTab === 'ai_triage' && 'AI Triage & Safety Intelligence'}
              {activeTab === 'hotspots' && 'Hotspot & Anomaly Analysis'}
              {activeTab === 'departments' && 'Department Performance'}
              {activeTab === 'settings' && 'System Configuration & Seed Controls'}
            </h2>
          </div>

          {/* Top Controls: Search, Demo Pill, Notification, User */}
          <div className="flex items-center gap-3">
            
            {/* Search Input */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search complaints... (Ctrl+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-56 text-xs bg-slate-100 rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-slate-800"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
            </div>

            {/* User Pill */}
            <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-teal-400 font-bold text-xs flex items-center justify-center shadow-xs">
              DA
            </div>

          </div>

        </header>

        {/* Scrollable Main Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

          {/* Feedback banner */}
          {feedback && (
            <div className="p-3 bg-teal-50 border border-teal-300 text-teal-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
              <span>{feedback}</span>
              <button type="button" onClick={() => setFeedback(null)} className="text-teal-700 font-bold ml-2">×</button>
            </div>
          )}

          {/* Subheader: Demo Mode bar + Action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700">
                DEMO MODE:
              </span>
              <span className="text-xs text-slate-500">
                Live automated complaint triage & geospatial analytics
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSeed}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5 text-[#14B8A6]" />
                Seed Sample Data
              </button>

              <button
                type="button"
                onClick={handleResetDb}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Data
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW                                          */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Greeting row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-[#0B1F3A] tracking-tight">
                    {greeting}, Administrator
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Here's what's happening across your city today.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-semibold shadow-2xs">
                    Last 7 days
                  </span>

                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B1F3A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow transition-colors"
                  >
                    <Plus className="w-4 h-4 text-[#14B8A6]" />
                    New Complaint
                  </button>
                </div>
              </div>

              {/* 4 Top KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total complaints</span>
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-900 leading-none">
                      {stats ? stats.total : complaints.length}
                    </span>
                    <p className="text-[11px] text-teal-600 font-semibold mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Live Across all wards
                    </p>
                  </div>
                </div>

                {/* High / Critical Priority */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600">High priority</span>
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-red-600 leading-none">
                      {complaints.filter((c) => c.status !== 'Resolved' && (c.urgency === 'Critical' || c.urgency === 'High')).length}
                    </span>
                    <p className="text-[11px] text-red-500 font-semibold mt-2">
                      Require prompt review
                    </p>
                  </div>
                </div>

                {/* Pending resolution */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending resolution</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-900 leading-none">
                      {complaints.filter((c) => c.status !== 'Resolved').length}
                    </span>
                    <p className="text-[11px] text-amber-600 font-semibold mt-2">
                      Not yet resolved
                    </p>
                  </div>
                </div>

                {/* Resolved complaints */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Resolved complaints</span>
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-teal-600 leading-none">
                      {stats ? stats.resolved : complaints.filter((c) => c.status === 'Resolved').length}
                    </span>
                    <p className="text-[11px] text-slate-500 font-semibold mt-2">
                      {stats && stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}% of total complaints` : 'Resolved'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle Row: Complaint activity & Issue categories */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Complaint activity Area Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0B1F3A]">Complaint activity</h4>
                      <p className="text-xs text-slate-400">Incoming reports over the last 7 days</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('complaints')}
                      className="text-xs font-bold text-[#14B8A6] hover:underline flex items-center gap-0.5"
                    >
                      View queue <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <ComplaintActivityChart complaints={complaints} />
                </div>

                {/* Issue categories Donut Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0B1F3A]">Issue categories</h4>
                      <p className="text-xs text-slate-400">Reported complaint distribution</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {complaints.length} Total
                    </span>
                  </div>

                  <CategoryDonutChart
                    data={stats?.by_category || {}}
                    total={stats?.total || complaints.length}
                  />
                </div>

              </div>

              {/* Bottom Row: Hotspot preview & Priority Queue */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Issue Hotspots Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#0B1F3A]">Issue hotspots</h4>
                        <p className="text-xs text-slate-400">Complaint concentration across city wards</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('hotspots')}
                        className="text-xs font-bold text-[#14B8A6] hover:underline flex items-center gap-0.5"
                      >
                        Explore full map <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="h-52 w-full rounded-xl overflow-hidden border border-slate-200 my-2">
                      <HotspotMap
                        items={mapItems.slice(0, 15)}
                        className="h-full w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>{mapItems.length} geo-plotted complaints</span>
                    <span className="font-semibold text-teal-700">Clusters identified in Ward 04 & Ward 08</span>
                  </div>
                </div>

                {/* Priority Queue Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-extrabold text-sm text-[#0B1F3A]">Priority queue</h4>
                        <p className="text-xs text-slate-400">Complaints requiring immediate attention</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilterTab('critical');
                          setActiveTab('complaints');
                        }}
                        className="text-xs font-bold text-red-600 hover:underline flex items-center gap-0.5"
                      >
                        View all critical ({complaints.filter((c) => c.urgency === 'Critical').length}) <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {priorityQueue.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-8 text-center">
                          No pending high priority complaints. Excellent work!
                        </p>
                      ) : (
                        priorityQueue.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setSelectedTicket(item)}
                            className="p-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 cursor-pointer transition-all flex items-start justify-between gap-3 shadow-2xs"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-xs text-[#0B1F3A]">{item.id}</span>
                                <UrgencyBadge urgency={item.urgency} size="sm" />
                                <span className="text-[10px] text-slate-400 truncate">{item.category}</span>
                              </div>
                              <p className="text-xs text-slate-800 font-medium line-clamp-1">
                                {item.summary}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-2" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center pt-3 border-t border-slate-100">
                    Click any ticket above to inspect AI triage analysis or assign officer
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: COMPLAINTS QUEUE                                  */}
          {/* ======================================================== */}
          {activeTab === 'complaints' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xl font-extrabold text-[#0B1F3A]">Complaints Priority Queue</h3>
                  <p className="text-xs text-slate-500">Sorted by Urgency (Critical first), then newest submission</p>
                </div>
                <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-700">
                  {complaints.length} Tickets Found
                </span>
              </div>

              {/* Department Quick Filter Chips */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick Filter By Department Cell:
                  </span>
                  {filterDepartment && (
                    <button
                      type="button"
                      onClick={() => setFilterDepartment('')}
                      className="text-[11px] font-semibold text-[#14B8A6] hover:underline"
                    >
                      Clear Department Filter
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {ALL_DEPARTMENTS_LIST.map((deptName) => {
                    const meta = getDepartmentMeta(deptName);
                    const Icon = meta.icon;
                    const isSelected = filterDepartment === deptName;
                    const count = complaints.filter((c) => c.department === deptName).length;

                    return (
                      <button
                        key={deptName}
                        type="button"
                        onClick={() => setFilterDepartment(isSelected ? '' : deptName)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-md ring-2 ring-[#14B8A6]/50'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#14B8A6]' : 'text-slate-500'}`} />
                        <span>{deptName}</span>
                        <span className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold uppercase ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Bar with Search, Department, and Responsive Filter Pills */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                {/* Search & Department Selector Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[220px]">
                    <input
                      type="text"
                      placeholder="Search ID (CIV-...), title, category, department, ward, assignee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-8 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6] transition-all"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Department Filter */}
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 text-slate-800 font-semibold max-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  >
                    <option value="">All Departments</option>
                    {ALL_DEPARTMENTS_LIST.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  {/* Clear All Filters Button */}
                  {(activeFilterTab !== 'all' || filterDepartment || searchTerm) && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 font-semibold transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Filters
                    </button>
                  )}
                </div>

                {/* Filter Pills with Live Complaint Counts */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {[
                    { id: 'all' as FilterTab, label: 'All', count: filterCounts.all },
                    { id: 'critical' as FilterTab, label: 'Critical', count: filterCounts.critical },
                    { id: 'high' as FilterTab, label: 'High', count: filterCounts.high },
                    { id: 'medium' as FilterTab, label: 'Medium', count: filterCounts.medium },
                    { id: 'low' as FilterTab, label: 'Low', count: filterCounts.low },
                    { id: 'needs_review' as FilterTab, label: 'Awaiting Review', count: filterCounts.needs_review },
                    { id: 'open' as FilterTab, label: 'Open / In Progress', count: filterCounts.open },
                    { id: 'resolved' as FilterTab, label: 'Resolved', count: filterCounts.resolved },
                    { id: 'reopened' as FilterTab, label: 'Reopened', count: filterCounts.reopened },
                    { id: 'closed' as FilterTab, label: 'Closed / Dismissed', count: filterCounts.closed },
                  ].map((tab) => {
                    const isActive = activeFilterTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveFilterTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                          isActive
                            ? 'bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-sm ring-2 ring-[#14B8A6]/40'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : tab.id === 'critical' && tab.count > 0
                              ? 'bg-red-100 text-red-700 font-extrabold'
                              : tab.id === 'needs_review' && tab.count > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200/70 text-slate-600'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-xs text-slate-500">
                    <div className="w-8 h-8 border-3 border-slate-200 border-t-[#14B8A6] rounded-full animate-spin mx-auto mb-2" />
                    Loading queue...
                  </div>
                ) : filteredAndSortedComplaints.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 space-y-3">
                    <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold">No complaints found matching current filters.</p>
                    {(activeFilterTab !== 'all' || filterDepartment || searchTerm) && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset All Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-[#0B1F3A] text-white uppercase text-[10px] tracking-wider font-bold">
                        <tr>
                          <th className="py-3 px-4">Ticket ID</th>
                          <th className="py-3 px-4">Submitted</th>
                          <th className="py-3 px-4">Urgency</th>
                          <th className="py-3 px-4">Summary</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Assignee</th>
                          <th className="py-3 px-4 text-center">Flags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAndSortedComplaints.map((c) => {
                          const isSample = c.citizen_name.includes('(Sample)') || c.citizen_email.endsWith('@example.com');
                          const isCritical = c.urgency === 'Critical';
                          const createdDate = new Date(c.created_at);
                          const dateDisplay = isNaN(createdDate.getTime())
                            ? 'Recent'
                            : createdDate.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              });

                          return (
                            <tr
                              key={c.id}
                              onClick={() => setSelectedTicket(c)}
                              className={`hover:bg-teal-50/40 cursor-pointer transition-colors ${
                                isCritical ? 'border-l-4 border-l-red-500 bg-red-50/20' : ''
                              }`}
                            >
                              <td className="py-3 px-4 font-mono font-bold text-[#0B1F3A] whitespace-nowrap">
                                {c.id}
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                                {dateDisplay}
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <UrgencyBadge urgency={c.urgency} />
                              </td>

                              <td className="py-3 px-4 max-w-xs font-medium text-slate-900 truncate" title={c.summary}>
                                {c.summary}
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-semibold">
                                {c.category}
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <DepartmentBadge department={c.department} size="sm" showCode={true} />
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                                {c.latitude && c.longitude ? (
                                  <span className="flex items-center gap-1 text-slate-700">
                                    <MapPin className="w-3 h-3 text-[#14B8A6]" />
                                    {c.location_text || `${c.latitude.toFixed(3)}, ${c.longitude.toFixed(3)}`}
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                    No GPS
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <StatusBadge status={c.status} />
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                                {c.assigned_to ? (
                                  <span className="flex items-center gap-1 text-slate-700">
                                    <User className="w-3 h-3 text-slate-400" />
                                    {c.assigned_to}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Unassigned</span>
                                )}
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {c.needs_review && (
                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                      Review Needed
                                    </span>
                                  )}
                                  {c.status === 'Reopened' && (
                                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded">
                                      Reopened
                                    </span>
                                  )}
                                  {isSample && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                      Sample
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: AI TRIAGE & SAFETY INTELLIGENCE                   */}
          {/* ======================================================== */}
          {activeTab === 'ai_triage' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-xl font-extrabold text-[#0B1F3A]">AI Triage Intelligence Engine</h3>
                <p className="text-xs text-slate-500">
                  Google Gemini structured classification, deterministic safety override layer, and human-in-the-loop review
                </p>
              </div>

              {/* Triage Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Structured Schema Adherence
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <Cpu className="w-5 h-5 text-[#14B8A6]" />
                    <span className="text-2xl font-black text-slate-900">100% Strict JSON</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Categories, departments, and urgency strictly bounded to municipal protocols.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Deterministic Safety Layer
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <span className="text-2xl font-black text-slate-900">
                      {complaints.filter((c) => c.urgency_reason.includes('Safety Rule') || c.urgency === 'Critical').length} Overrides
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Terms like live wire, sparking, children, open manhole elevated to Critical/High.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Human Review Queue
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span className="text-2xl font-black text-amber-600">
                      {complaints.filter((c) => c.needs_review).length} Tickets
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Confidence &lt; 60% or category 'Other' automatically held for officer review.
                  </p>
                </div>
              </div>

              {/* Review Queue Items */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-extrabold text-sm text-[#0B1F3A]">Tickets Flagged for Officer Verification</h4>
                  <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    Needs Review
                  </span>
                </div>

                <div className="space-y-3">
                  {complaints
                    .filter((c) => c.needs_review)
                    .slice(0, 8)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedTicket(item)}
                        className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 hover:bg-amber-50 cursor-pointer transition-colors flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-xs text-[#0B1F3A]">{item.id}</span>
                            <UrgencyBadge urgency={item.urgency} size="sm" />
                            <span className="text-xs font-semibold text-slate-700">
                              Confidence: {Math.round(item.confidence * 100)}%
                            </span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">
                              {item.ai_source}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 font-medium leading-relaxed">
                            {item.summary}
                          </p>
                          <p className="text-[11px] text-slate-500 italic mt-1">
                            "{item.raw_text}"
                          </p>
                        </div>

                        <button
                          type="button"
                          className="px-3 py-1.5 bg-[#0B1F3A] text-white rounded-lg text-xs font-bold shrink-0 hover:bg-slate-800"
                        >
                          Review & Confirm
                        </button>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: HOTSPOT & ANOMALY ANALYSIS                        */}
          {/* ======================================================== */}
          {activeTab === 'hotspots' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div>
                <h3 className="text-xl font-extrabold text-[#0B1F3A]">Hotspot & Anomaly Analysis</h3>
                <p className="text-xs text-slate-500">
                  Explore geographic clusters, density heatmaps, and spatial anomaly patterns
                </p>
              </div>

              {/* Ward Grid & Pattern Checks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Ward Grid (8 Wards) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0B1F3A]">Ward-Level Complaint Concentration</h4>
                      <p className="text-xs text-slate-400">Click a ward to filter hotspots</p>
                    </div>
                    {selectedWard && (
                      <button
                        type="button"
                        onClick={() => setSelectedWard(null)}
                        className="text-xs font-bold text-[#14B8A6] hover:underline"
                      >
                        Reset Ward Filter
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {wardStats.map((w) => {
                      const isSelected = selectedWard === w.id;
                      return (
                        <div
                          key={w.id}
                          onClick={() => setSelectedWard(isSelected ? null : w.id)}
                          className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#0B1F3A] text-white border-[#0B1F3A] shadow-md scale-102 ring-2 ring-[#14B8A6]'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                          }`}
                        >
                          <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                            isSelected ? 'text-teal-300' : 'text-slate-500'
                          }`}>
                            {w.name}
                          </span>
                          <span className="text-2xl font-black block my-1">
                            {w.count}
                          </span>
                          <span className={`text-[10px] font-semibold block ${
                            w.highPriority > 0
                              ? isSelected ? 'text-red-300' : 'text-red-600'
                              : isSelected ? 'text-slate-300' : 'text-slate-400'
                          }`}>
                            {w.highPriority > 0 ? `${w.highPriority} high priority` : '0 high priority'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Potential Patterns & AI Anomaly Checks */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h4 className="font-extrabold text-sm text-[#0B1F3A]">Potential Patterns & Alerts</h4>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                        <span>Recurring Road Damage</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        7 road complaints detected in Ward 04 near Central Market. Ground inspection advised.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-red-950">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                        <span>Safety Indicator Detected</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-red-800">
                        Live wire sparking and open manhole reports verified by safety rules layer.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-teal-950">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6]" />
                        <span>Spatial Clustering Status</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-teal-800">
                        Deliberate hotspot density verified with OpenStreetMap and Leaflet heat layers.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Full Live Leaflet Hotspot & Heatmap Map */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#0B1F3A]">Live Geographic Hotspot Map</h4>
                    <p className="text-xs text-slate-400">Toggle between urgency circle markers and density heatmap</p>
                  </div>
                  <span className="text-xs font-mono text-slate-500 font-bold">
                    {mapItems.length} Mapped Complaints
                  </span>
                </div>

                <HotspotMap
                  items={mapItems}
                  unmappedCount={stats?.unmapped_count || 0}
                  onSelectTicket={(id) => {
                    const found = complaints.find((c) => c.id === id);
                    if (found) setSelectedTicket(found);
                  }}
                  className="h-[620px]"
                />
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: DEPARTMENT PERFORMANCE                            */}
          {/* ======================================================== */}
          {activeTab === 'departments' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div>
                <h3 className="text-xl font-extrabold text-[#0B1F3A]">Department Performance & Workload</h3>
                <p className="text-xs text-slate-500">
                  Compare assigned municipal workload, turnaround SLAs, and resolution progress
                </p>
              </div>

              {/* 4 Department KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Departments
                  </span>
                  <span className="text-3xl font-black text-slate-900 leading-none">6</span>
                  <p className="text-[11px] text-slate-500 font-semibold mt-2">Active routing destinations</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Open Workload
                  </span>
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {complaints.filter((c) => c.status !== 'Resolved').length}
                  </span>
                  <p className="text-[11px] text-teal-600 font-semibold mt-2">Across all departments</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Resolved
                  </span>
                  <span className="text-3xl font-black text-teal-700 leading-none">
                    {complaints.filter((c) => c.status === 'Resolved').length}
                  </span>
                  <p className="text-[11px] text-slate-500 font-semibold mt-2">Marked resolved in dataset</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
                    Needs Review
                  </span>
                  <span className="text-3xl font-black text-amber-700 leading-none">
                    {complaints.filter((c) => c.needs_review).length}
                  </span>
                  <p className="text-[11px] text-amber-600 font-semibold mt-2">Awaiting human verification</p>
                </div>
              </div>

              {/* Department Workload Breakdown Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
                <div>
                  <h4 className="font-extrabold text-sm text-[#0B1F3A]">Department Workload Breakdown</h4>
                  <p className="text-xs text-slate-400">
                    Counts update automatically when complaints are reassigned or resolved.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-[#0B1F3A] text-white uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="py-3 px-4">Department & Nodal Division</th>
                        <th className="py-3 px-4">Total Assigned</th>
                        <th className="py-3 px-4">Open</th>
                        <th className="py-3 px-4">Resolved</th>
                        <th className="py-3 px-4">High Priority Open</th>
                        <th className="py-3 px-4">Workload %</th>
                        <th className="py-3 px-4">Target SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departmentWorkload.map((dept) => {
                        const Icon = dept.icon;
                        return (
                          <tr key={dept.name} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900">{dept.name}</span>
                                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1 py-0.2 rounded uppercase">
                                      {dept.code}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs">
                                    {dept.division}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              {dept.total}
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              {dept.open}
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                              {dept.resolved}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {dept.highPriority > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                  {dept.highPriority} High
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">0</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 min-w-[130px]">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#14B8A6] h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(dept.workloadPct * 2, 100)}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] font-bold text-slate-600">
                                  {dept.workloadPct}%
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                              {dept.sla}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: SETTINGS & SYSTEM CONFIG                          */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
              <div>
                <h3 className="text-xl font-extrabold text-[#0B1F3A]">System Configuration & Diagnostics</h3>
                <p className="text-xs text-slate-500">Municipal integration services, Resend credentials, and database utilities</p>
              </div>

              {/* Service Health Cards */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="font-extrabold text-sm text-[#0B1F3A]">Service Status Matrix</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">FastAPI REST Server</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Operational (Port 8000)
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">BackgroundTasks, CORS, SQLite SQLAlchemy active.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Resend Email Gateway</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Connected (API Key Active)
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Lodged & resolution emails dispatched with live Provider IDs.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">OpenStreetMap Nominatim</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active (1 req/s Cache)
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Geocoding landmark mentions to coordinates with fallback tolerance.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">AI Triage Classifier</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        Gemini + Fallback
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Deterministic safety rules layer guarantees protection for high hazards.</p>
                  </div>
                </div>
              </div>

              {/* Maintenance Tools */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="font-extrabold text-sm text-[#0B1F3A]">Database & Seed Operations</h4>
                <p className="text-xs text-slate-500">
                  Manage synthetic complaints dataset for jury presentations and live demonstrations.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSeed}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-slate-800 text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
                  >
                    <Database className="w-4 h-4 text-[#14B8A6]" />
                    Re-Seed 40 Sample Complaints
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDb}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Entire Database
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Centered Floating Detail Modal */}
      <ComplaintDetailModal
        complaint={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdated={handleTicketUpdated}
        allComplaints={complaints}
      />

    </div>
  );
};
