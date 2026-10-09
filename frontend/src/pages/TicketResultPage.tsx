import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchComplaintById } from '../api/client';
import { Complaint } from '../types';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  CheckCircle2,
  Copy,
  Check,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Mail,
  MailCheck,
  AlertCircle,
  ShieldAlert,
  Search,
  FileText,
  Calendar,
  Compass,
  User,
  ExternalLink
} from 'lucide-react';

export const TicketResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lookupId, setLookupId] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    fetchComplaintById(id)
      .then((data) => {
        setComplaint(data);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Ticket not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleCopyId = () => {
    if (complaint) {
      navigator.clipboard.writeText(complaint.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupId.trim()) {
      let formatted = lookupId.trim().toUpperCase();
      if (!formatted.startsWith('CIV-') && /^\d+$/.test(formatted)) {
        formatted = `CIV-${formatted.padStart(5, '0')}`;
      }
      window.location.href = `/track?id=${formatted}`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6">
        <div className="bg-white rounded-lg border border-[#DCE4EC] p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#0D9488] rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-base font-semibold text-[#172B4D]">Retrieving ticket details</h2>
          <p className="text-xs text-[#64748B] mt-1">Please wait while the municipal record is loaded...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !complaint) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 sm:px-6">
        <div className="bg-white rounded-lg border border-[#DCE4EC] p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 border border-red-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#172B4D]">Ticket not found</h2>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
            {errorMsg || `No municipal grievance was found matching reference "${id}".`}
          </p>

          <form onSubmit={handleLookup} className="mt-6 flex gap-2">
            <input
              type="text"
              placeholder="Enter ticket ID (e.g. CIV-00001)..."
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              className="flex-1 text-xs border border-[#DCE4EC] rounded px-3 py-2 bg-white text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#0B1F3A] text-white rounded text-xs font-semibold hover:bg-[#142B48] transition-colors"
            >
              Search
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#DCE4EC] flex items-center justify-center gap-4 text-xs font-medium">
            <Link to="/" className="text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Submit a service request
            </Link>
            <span className="text-slate-300">|</span>
            <Link to="/track" className="text-slate-600 hover:text-slate-900">
              Track a request
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Determine actual email dispatch status from API email_logs
  const lodgedLog = complaint.email_logs && complaint.email_logs.length > 0
    ? complaint.email_logs.find((l) => l.email_type === 'lodged') || complaint.email_logs[complaint.email_logs.length - 1]
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      
      {/* Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <nav className="flex items-center gap-1.5 text-xs text-[#64748B]" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#172B4D] transition-colors">Portal Home</Link>
          <span>/</span>
          <span className="text-[#172B4D] font-medium">Confirmation</span>
          <span>/</span>
          <span className="font-mono text-[#0B1F3A]">{complaint.id}</span>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={`/track?id=${complaint.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] transition-colors"
          >
            Track request timeline
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Primary Confirmation Container */}
      <div className="bg-white rounded-lg border border-[#DCE4EC] shadow-xs overflow-hidden">
        
        {/* Top Confirmation Banner */}
        <div className="p-6 sm:p-7 border-b border-[#DCE4EC] bg-[#F4F7FA]/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0 text-emerald-700 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[#172B4D] tracking-tight">
                Your complaint has been recorded
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
                Thank you for notifying the municipal authorities. Your grievance has been registered and routed for departmental review.
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Reference Identification Box */}
        <div className="p-6 sm:p-7 border-b border-[#DCE4EC] bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-md border border-[#DCE4EC] bg-[#F4F7FA]">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                Official Reference ID
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[#0B1F3A] tracking-wider">
                  {complaint.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#DCE4EC] bg-white hover:bg-slate-50 text-[#172B4D] text-xs font-semibold transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  title="Copy reference identifier to clipboard"
                  aria-label="Copy reference ID"
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
              {complaint.tracking_token && (
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                  <span className="font-semibold text-slate-600 font-sans">Secure Token:</span>
                  <span className="bg-white border border-[#DCE4EC] px-1.5 py-0.5 rounded text-[#0B1F3A]">
                    {complaint.tracking_token}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:self-center">
              <Link
                to={`/track?id=${complaint.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                Track this request
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-[#DCE4EC] bg-white hover:bg-slate-50 text-[#172B4D] text-xs font-semibold transition-colors shadow-2xs"
              >
                Submit another
              </Link>
            </div>
          </div>
        </div>

        {/* Real Email Dispatch Status */}
        <div className="px-6 sm:px-7 py-4 border-b border-[#DCE4EC]">
          {lodgedLog?.status === 'sent' ? (
            <div className="flex items-start gap-3 p-3.5 rounded-md bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
              <MailCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Confirmation email dispatched</span>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  A verification receipt has been sent to <strong className="font-mono">{complaint.citizen_email}</strong>. You will receive further email updates when status changes occur.
                </p>
              </div>
            </div>
          ) : lodgedLog?.status === 'failed' ? (
            <div className="flex items-start gap-3 p-3.5 rounded-md bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Email notification delivery alert</span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  The automated email to <strong className="font-mono">{complaint.citizen_email}</strong> could not be delivered ({lodgedLog.error || 'Provider delivery restriction'}). Please keep note of your reference ID <strong className="font-mono">{complaint.id}</strong> to track your issue online.
                </p>
              </div>
            </div>
          ) : lodgedLog?.status === 'skipped' ? (
            <div className="flex items-start gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <Mail className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Email delivery skipped (Demo/Sandbox Mode)</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Notification service is operating in test mode for recipient <strong className="font-mono">{complaint.citizen_email}</strong>. Use your Reference ID online anytime to check progress.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Notification queued</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  An automated confirmation receipt is scheduled for delivery to <strong className="font-mono">{complaint.citizen_email}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Supervisor Review Indicator (if flagged by safety rules or low confidence) */}
        {complaint.needs_review && (
          <div className="px-6 sm:px-7 py-3 border-b border-[#DCE4EC] bg-amber-50/50">
            <div className="flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Flagged for municipal supervisor review</span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Due to the critical nature or unclassified parameters of this complaint, an officer will manually verify details before scheduling field teams.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Structured Complaint Details */}
        <div className="p-6 sm:p-7 space-y-6">

          {/* Section: Core Metadata Grid */}
          <div>
            <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">
              Intake Record Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Status and Urgency */}
              <div className="p-4 rounded-md border border-[#DCE4EC] bg-[#F4F7FA]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748B] font-medium">Current Status</span>
                  <StatusBadge status={complaint.status} />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#DCE4EC]">
                  <span className="text-xs text-[#64748B] font-medium">Assigned Urgency</span>
                  <UrgencyBadge urgency={complaint.urgency} />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#DCE4EC]">
                  <span className="text-xs text-[#64748B] font-medium">Submission Date</span>
                  <span className="text-xs font-semibold text-[#172B4D] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(complaint.created_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
              </div>

              {/* Department and Category */}
              <div className="p-4 rounded-md border border-[#DCE4EC] bg-[#F4F7FA]/40 space-y-3">
                <div>
                  <span className="text-[11px] text-[#64748B] font-medium block">Responsible Department</span>
                  <p className="text-xs font-bold text-[#0B1F3A] mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />
                    {complaint.department}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#DCE4EC]">
                  <span className="text-[11px] text-[#64748B] font-medium block">Category & Issue Type</span>
                  <p className="text-xs font-semibold text-[#172B4D] mt-0.5">
                    {complaint.category} • <span className="font-normal text-[#64748B]">{complaint.issue_type}</span>
                  </p>
                </div>
                <div className="pt-2 border-t border-[#DCE4EC]">
                  <span className="text-[11px] text-[#64748B] font-medium block">Location / Landmark</span>
                  <p className="text-xs font-semibold text-[#172B4D] mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                    {complaint.location_text || 'No landmark specified'}
                  </p>
                  {complaint.latitude && complaint.longitude && (
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5 ml-5">
                      Coordinates: {complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Section: One-Sentence Summary */}
          <div className="p-4 rounded-md border border-[#DCE4EC] bg-white">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              Issue Summary
            </span>
            <p className="text-sm font-semibold text-[#172B4D] leading-snug">
              {complaint.summary}
            </p>
          </div>

          {/* Section: Automated Triage Recommendations */}
          <div className="p-4.5 rounded-md border border-[#DCE4EC] bg-[#F4F7FA] space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE4EC] pb-2">
              <div>
                <span className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider block">
                  Triage Assessment & Recommendations
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Automated intake analysis generated to assist municipal staff
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-white border border-[#DCE4EC] text-[#64748B] px-2 py-0.5 rounded">
                Confidence: {Math.round(complaint.confidence * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="font-semibold text-[#172B4D] block text-[11px] mb-1">Priority Rationale</span>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {complaint.urgency_reason}
                </p>
              </div>
              <div>
                <span className="font-semibold text-[#172B4D] block text-[11px] mb-1">Recommended Municipal Protocol</span>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {complaint.suggested_action}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Original Citizen Submission */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
              Original Citizen Submission
            </span>
            <div className="p-3.5 rounded-md border border-[#DCE4EC] bg-slate-50 text-xs text-[#172B4D] leading-relaxed italic">
              "{complaint.raw_text}"
            </div>
            
            {/* Optional Photo Attachment */}
            {complaint.photo_path && (
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-[#64748B] block mb-1">
                  Attached Photographic Record:
                </span>
                <div className="inline-block border border-[#DCE4EC] rounded-md overflow-hidden bg-white shadow-2xs">
                  <img
                    src={`/api/uploads/${complaint.photo_path}`}
                    alt="Citizen submitted evidence"
                    className="max-h-48 max-w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 sm:p-7 border-t border-[#DCE4EC] bg-[#F4F7FA] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span>Need to report a different problem?</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/track?id=${complaint.id}`}
              className="px-4 py-2 rounded bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-colors shadow-2xs"
            >
              Track this request
            </Link>
            <Link
              to="/"
              className="px-4 py-2 rounded border border-[#DCE4EC] bg-white hover:bg-slate-50 text-[#172B4D] text-xs font-semibold transition-colors shadow-2xs"
            >
              Submit another complaint
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};
