import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { trackComplaint } from '../api/client';
import { Complaint, StatusHistory } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import {
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  PlayCircle,
  AlertCircle,
  Building2,
  MapPin,
  Calendar,
  Copy,
  Check,
  ArrowRight,
  PlusCircle,
  FileText,
  Mail,
  ShieldCheck,
  Compass,
  KeyRound
} from 'lucide-react';

export const TrackTicketPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || searchParams.get('token') || '';

  const [inputTicketId, setInputTicketId] = useState(initialId);
  const [searchedId, setSearchedId] = useState(initialId);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-search if ID is present in URL
  useEffect(() => {
    if (initialId.trim()) {
      executeLookup(initialId.trim());
    }
  }, [initialId]);

  const formatIdentifier = (raw: string): string => {
    let clean = raw.trim();
    if (clean.toLowerCase().startsWith('tr_')) {
      return clean;
    }
    clean = clean.toUpperCase();
    if (!clean.startsWith('CIV-') && /^\d+$/.test(clean)) {
      clean = `CIV-${clean.padStart(5, '0')}`;
    }
    return clean;
  };

  const executeLookup = async (idToSearch: string) => {
    const formatted = formatIdentifier(idToSearch);
    if (!formatted) {
      setValidationError('Please enter a ticket reference number or tracking token.');
      return;
    }

    setValidationError(null);
    setNotFound(false);
    setApiError(null);
    setLoading(true);
    setSearchedId(formatted);

    try {
      const data = await trackComplaint(formatted);
      setComplaint(data);
      // Synchronize URL query parameter without full page reload
      setSearchParams({ id: formatted });
    } catch (err: any) {
      setComplaint(null);
      if (err.message && err.message.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        setApiError(err.message || 'An error occurred while retrieving ticket details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTicketId.trim()) {
      setValidationError('Please enter a ticket reference number.');
      return;
    }
    executeLookup(inputTicketId);
  };

  const handleCopyId = () => {
    if (complaint) {
      navigator.clipboard.writeText(complaint.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Next steps description strictly based on real ticket status
  const getNextStepInfo = (status: Complaint['status'], dept: string, assignee: string | null) => {
    switch (status) {
      case 'New':
        return {
          title: 'Initial Intake & Verification',
          description: `This request is pending review by the ${dept}. A municipal coordinator will review the report and dispatch a field team.`,
          icon: Clock,
          color: 'text-slate-700 bg-slate-100 border-slate-200'
        };
      case 'Assigned':
        return {
          title: 'Field Team Dispatched',
          description: assignee
            ? `Assigned to ${assignee}. On-site assessment and material scheduling are being arranged.`
            : `Assigned to the nodal response squad in ${dept}. A crew is scheduled to inspect the location.`,
          icon: UserCheck,
          color: 'text-indigo-700 bg-indigo-50 border-indigo-200'
        };
      case 'In Progress':
        return {
          title: 'Remediation Underway',
          description: 'Departmental crews are actively working on-site to resolve this grievance. You will receive an update once the remediation is certified.',
          icon: PlayCircle,
          color: 'text-cyan-700 bg-cyan-50 border-cyan-200'
        };
      case 'Resolved':
        return {
          title: 'Resolution Certified & Closed',
          description: complaint?.resolved_at
            ? `This civic issue was marked resolved on ${new Date(complaint.resolved_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}. If issues persist, please submit a follow-up request.`
            : 'Remediation has been completed and verified by the municipal authority. If problems persist, you may submit a follow-up grievance.',
          icon: CheckCircle2,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
        };
      default:
        return {
          title: 'Processing',
          description: 'The municipal system is actively monitoring this request.',
          icon: Clock,
          color: 'text-slate-700 bg-slate-100 border-slate-200'
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-[#172B4D] transition-colors">Portal Home</Link>
        <span>/</span>
        <span className="text-[#172B4D] font-medium">Track a Request</span>
        {complaint && (
          <>
            <span>/</span>
            <span className="font-mono text-[#0B1F3A]">{complaint.id}</span>
          </>
        )}
      </nav>

      {/* Page Title & Search Bar Card */}
      <div className="bg-white rounded-lg border border-[#DCE4EC] p-6 sm:p-7 shadow-xs mb-6">
        <div className="max-w-xl">
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B4D] tracking-tight">
            Track a service request
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
            Enter the municipal reference number (e.g. <span className="font-mono font-semibold text-slate-700">CIV-00001</span>) or your secure tracking token provided upon registration.
          </p>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="mt-5">
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputTicketId}
                onChange={(e) => {
                  setInputTicketId(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Enter ticket reference (e.g. CIV-00045 or tr_...)..."
                className={`w-full text-sm rounded border px-3.5 py-2.5 bg-white text-[#172B4D] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-colors ${
                  validationError ? 'border-red-500' : 'border-[#DCE4EC]'
                }`}
                aria-label="Ticket reference ID"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find complaint</span>
                </>
              )}
            </button>
          </div>

          {validationError && (
            <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {validationError}
            </p>
          )}
        </form>
      </div>

      {/* STATE 1: Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-[#DCE4EC] p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#0D9488] rounded-full animate-spin mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-[#172B4D]">Retrieving complaint record</h2>
          <p className="text-xs text-[#64748B] mt-1">Connecting to municipal database for {searchedId}...</p>
        </div>
      )}

      {/* STATE 2: Not Found State */}
      {!loading && notFound && (
        <div className="bg-white rounded-lg border border-[#DCE4EC] p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#172B4D]">No record found for "{searchedId}"</h2>
          <p className="text-xs text-[#64748B] mt-1.5 max-w-md mx-auto leading-relaxed">
            Please check that the identifier was entered correctly, including the prefix (e.g. CIV-00001). If you have not submitted a request yet, you may file one below.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Submit a service request
            </Link>
          </div>
        </div>
      )}

      {/* STATE 3: API Error State */}
      {!loading && apiError && (
        <div className="bg-white rounded-lg border border-red-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#172B4D]">Service communication error</h2>
          <p className="text-xs text-red-700 mt-1.5 max-w-md mx-auto leading-relaxed">
            {apiError}
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => executeLookup(searchedId)}
              className="px-4 py-2 rounded bg-[#0B1F3A] hover:bg-[#142B48] text-white text-xs font-semibold transition-colors"
            >
              Retry search
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: Idle State (No search performed yet) */}
      {!loading && !complaint && !notFound && !apiError && (
        <div className="bg-white rounded-lg border border-[#DCE4EC] p-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1.5">
              <span className="font-bold text-[#172B4D] block">Where is my ticket ID?</span>
              <p className="text-[#64748B] leading-relaxed">
                Your ticket identifier was displayed upon completing your submission and sent to your registered email address.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-[#172B4D] block">Real-time status tracking</span>
              <p className="text-[#64748B] leading-relaxed">
                As field officers update inspection and remediation milestones, the status timeline updates automatically.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="font-bold text-[#172B4D] block">Need to file a new issue?</span>
              <p className="text-[#64748B] leading-relaxed">
                Report road damage, sanitation hazards, water leaks, or streetlight outages using the public form.
              </p>
              <Link to="/" className="text-[#0D9488] font-semibold hover:underline inline-block pt-1">
                Go to submission form &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* STATE 5: Success State (Complaint record loaded) */}
      {!loading && complaint && (
        <div className="space-y-6">
          
          {/* Main Ticket Summary Card */}
          <div className="bg-white rounded-lg border border-[#DCE4EC] shadow-xs overflow-hidden">
            
            {/* Header: ID, Badges, Copy */}
            <div className="p-6 sm:p-7 border-b border-[#DCE4EC] bg-[#F4F7FA]/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                    Municipal Grievance Record
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[#0B1F3A] tracking-wider">
                      {complaint.id}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#DCE4EC] bg-white hover:bg-slate-50 text-[#172B4D] text-xs font-semibold transition-colors shadow-2xs"
                      title="Copy ID to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={complaint.status} />
                  <UrgencyBadge urgency={complaint.urgency} />
                </div>
              </div>
            </div>

            {/* Compact Information Grid */}
            <div className="p-6 sm:p-7 space-y-6">
              
              {/* Issue Summary */}
              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Issue Summary
                </span>
                <p className="text-base font-semibold text-[#172B4D] leading-snug">
                  {complaint.summary}
                </p>
              </div>

              {/* Department, Category, Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-md border border-[#DCE4EC] bg-[#F4F7FA]/30 text-xs">
                <div>
                  <span className="text-[#64748B] block font-medium mb-1">Responsible Department</span>
                  <p className="font-bold text-[#0B1F3A] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />
                    {complaint.department}
                  </p>
                </div>

                <div>
                  <span className="text-[#64748B] block font-medium mb-1">Category & Type</span>
                  <p className="font-semibold text-[#172B4D]">
                    {complaint.category} • <span className="text-[#64748B] font-normal">{complaint.issue_type}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[#64748B] block font-medium mb-1">Reported Location</span>
                  <p className="font-semibold text-[#172B4D] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                    {complaint.location_text || 'No landmark specified'}
                  </p>
                </div>
              </div>

              {/* Next Steps (Truthful, based strictly on real status) */}
              {(() => {
                const nextStep = getNextStepInfo(complaint.status, complaint.department, complaint.assigned_to);
                const StepIcon = nextStep.icon;
                return (
                  <div className={`p-4 rounded-md border text-xs ${nextStep.color}`}>
                    <div className="flex items-start gap-3">
                      <StepIcon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-xs">{nextStep.title}</span>
                        <p className="text-[11px] mt-0.5 leading-relaxed">
                          {nextStep.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>

          {/* Status Timeline Card (Using Real status_history) */}
          <div className="bg-white rounded-lg border border-[#DCE4EC] p-6 sm:p-7 shadow-xs">
            <h2 className="text-sm font-bold text-[#172B4D] uppercase tracking-wider mb-4 pb-2 border-b border-[#DCE4EC]">
              Status Progression Timeline
            </h2>

            {/* Timeline sequence */}
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DCE4EC]">
              
              {/* Event 1: Initial Recording */}
              <div className="relative pl-8">
                <div className="absolute left-1.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-emerald-200" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-xs font-bold text-[#172B4D]">Grievance Registered & Logged</span>
                  <span className="text-[11px] text-[#64748B]">
                    {new Date(complaint.created_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Complaint successfully captured in the municipal intake system and mapped to {complaint.department}.
                </p>
              </div>

              {/* Subsequent history events from complaint.status_history */}
              {complaint.status_history && complaint.status_history.length > 0 ? (
                complaint.status_history.map((hist: StatusHistory, idx: number) => {
                  const isLatest = idx === complaint.status_history.length - 1;
                  return (
                    <div key={hist.id || idx} className="relative pl-8">
                      <div
                        className={`absolute left-1.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                          isLatest
                            ? 'bg-[#0D9488] ring-teal-200'
                            : 'bg-slate-400 ring-slate-200'
                        }`}
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-xs font-bold text-[#172B4D]">
                          Status updated to: <span className="font-semibold">{hist.to_status}</span>
                        </span>
                        <span className="text-[11px] text-[#64748B]">
                          {new Date(hist.changed_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {hist.from_status
                          ? `Transitioned from ${hist.from_status} to ${hist.to_status} by municipal operations.`
                          : `Status established as ${hist.to_status}.`}
                      </p>
                    </div>
                  );
                })
              ) : (
                /* Single milestone if no transitions recorded yet */
                complaint.status !== 'New' && (
                  <div className="relative pl-8">
                    <div className="absolute left-1.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#0D9488] border-2 border-white ring-2 ring-teal-200" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-xs font-bold text-[#172B4D]">
                        Active Status: {complaint.status}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {new Date(complaint.updated_at || complaint.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Current operational status under {complaint.department}.
                    </p>
                  </div>
                )
              )}

              {/* Resolved milestone if status is Resolved */}
              {complaint.status === 'Resolved' && complaint.resolved_at && (
                <div className="relative pl-8">
                  <div className="absolute left-1.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-emerald-200" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-xs font-bold text-emerald-800">Remediation Completed & Certified</span>
                    <span className="text-[11px] text-emerald-700">
                      {new Date(complaint.resolved_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Field crews completed necessary operations and the ticket is officially closed.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Email Notification Audit (If available from API) */}
          {complaint.email_logs && complaint.email_logs.length > 0 && (
            <div className="bg-white rounded-lg border border-[#DCE4EC] p-6 sm:p-7 shadow-xs">
              <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">
                Citizen Notification Log
              </h2>
              <div className="space-y-2">
                {complaint.email_logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded border border-[#DCE4EC] bg-[#F4F7FA]/40 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#0D9488]" />
                      <span className="font-semibold text-[#172B4D] capitalize">
                        {log.email_type} notification
                      </span>
                      <span className="text-[#64748B] text-[11px]">
                        to <span className="font-mono">{log.to_email}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          log.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {new Date(log.sent_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Submit another complaint
            </Link>

            <Link
              to={`/ticket/${complaint.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-[#DCE4EC] bg-white hover:bg-slate-50 text-[#172B4D] text-xs font-semibold shadow-2xs transition-colors"
            >
              View original confirmation
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      )}

    </div>
  );
};
