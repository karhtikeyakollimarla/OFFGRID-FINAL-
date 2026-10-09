import React, { useState, useEffect } from 'react';
import { Complaint, Urgency, Category, ComplaintStatus } from '../types';
import { updateComplaint, reopenComplaint, dismissComplaint, resendComplaintEmail } from '../api/client';
import { UrgencyBadge } from './UrgencyBadge';
import { StatusBadge } from './StatusBadge';
import { DepartmentBadge } from './DepartmentBadge';
import {
  X,
  Copy,
  Check,
  Clock,
  User,
  Building2,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  FileText,
  ArrowRight,
  RotateCcw,
  Archive,
  CheckCircle2,
  PlayCircle,
  Send,
  Eye,
  Calendar,
  Lock,
  Sparkles
} from 'lucide-react';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onUpdated: (updated: Complaint) => void;
  allComplaints?: Complaint[];
}

const DEPARTMENTS = [
  'Road Infrastructure & Maintenance',
  'Solid Waste Management & Sanitation',
  'Water Supply & Sewerage Board',
  'Stormwater Drain Network',
  'Electrical Engineering & Streetlights',
  'Urban Public Health & Vector Control',
  'Parks & Horticulture',
  'Town Planning & Encroachment Cell',
  'Disaster Management & Emergency Relief',
  'General Municipal Grievances',
];

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  onUpdated,
  allComplaints = [],
}) => {
  if (!complaint) return null;

  // Local form & action state
  const [assignedTo, setAssignedTo] = useState(complaint.assigned_to || '');
  const [department, setDepartment] = useState(complaint.department);
  const [officerNotes, setOfficerNotes] = useState(complaint.officer_notes || '');

  // Sub-dialog confirmation states
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenActor, setReopenActor] = useState('Supervisor');

  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissActor, setDismissActor] = useState('Supervisor');
  const [dismissRole, setDismissRole] = useState('Supervisor');

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [newSquad, setNewSquad] = useState(complaint.assigned_to || '');

  const [showImagePreview, setShowImagePreview] = useState(false);

  // Status and feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [resendingType, setResendingType] = useState<'lodged' | 'resolved' | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Sync state whenever complaint prop changes
  useEffect(() => {
    setAssignedTo(complaint.assigned_to || '');
    setDepartment(complaint.department);
    setOfficerNotes(complaint.officer_notes || '');
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowResolveDialog(false);
    setShowReopenDialog(false);
    setShowDismissDialog(false);
    setShowAssignDialog(false);
  }, [complaint]);

  // Lock body scrolling when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard navigation: Escape key closes modal if no sub-dialogs open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showImagePreview) {
          setShowImagePreview(false);
        } else if (showResolveDialog || showReopenDialog || showDismissDialog || showAssignDialog) {
          setShowResolveDialog(false);
          setShowReopenDialog(false);
          setShowDismissDialog(false);
          setShowAssignDialog(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showImagePreview, showResolveDialog, showReopenDialog, showDismissDialog, showAssignDialog]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(complaint.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // 1. One-way Transition: Start Work (Assigned -> In Progress)
  const handleStartWork = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const updated = await updateComplaint(complaint.id, {
        status: 'In Progress',
        officer_notes: 'Field remediation inspection initiated',
        actor: assignedTo || 'Assigned Officer',
      });
      onUpdated(updated);
      setSuccessMessage('Ticket moved to In Progress.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. One-way Transition: Assign Squad (New -> Assigned)
  const handleConfirmAssign = async () => {
    if (!newSquad.trim()) {
      setErrorMessage('Please specify an assigned squad or officer name.');
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const updated = await updateComplaint(complaint.id, {
        status: 'Assigned',
        assigned_to: newSquad.trim(),
        department,
        actor: 'Municipal Dispatcher',
      });
      onUpdated(updated);
      setShowAssignDialog(false);
      setSuccessMessage(`Assigned to ${newSquad.trim()}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to assign ticket');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. One-way Transition: Resolve Complaint (In Progress -> Resolved)
  const handleConfirmResolve = async () => {
    if (!resolveNotes.trim()) {
      setErrorMessage('A resolution note describing the remediation is required.');
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const updated = await updateComplaint(complaint.id, {
        status: 'Resolved',
        officer_notes: resolveNotes.trim(),
        actor: assignedTo || 'Field Lead',
      });
      onUpdated(updated);
      setShowResolveDialog(false);
      setResolveNotes('');
      setSuccessMessage('Ticket marked as Resolved. Citizen confirmation triggered.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resolve complaint');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Reopen Case Action (Resolved -> Reopened)
  const handleConfirmReopen = async () => {
    if (!reopenReason.trim() || reopenReason.trim().length < 3) {
      setErrorMessage('Please enter a valid reason for reopening (at least 3 characters).');
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const updated = await reopenComplaint(complaint.id, {
        reason: reopenReason.trim(),
        actor: reopenActor.trim() || 'Supervisor',
      });
      onUpdated(updated);
      setShowReopenDialog(false);
      setReopenReason('');
      setSuccessMessage('Case successfully reopened and restored to active triage.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reopen case');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Close / Dismiss Case Action (Administrative Action)
  const handleConfirmDismiss = async () => {
    if (!dismissReason.trim() || dismissReason.trim().length < 3) {
      setErrorMessage('Please provide a mandatory administrative reason for closure/dismissal.');
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const updated = await dismissComplaint(complaint.id, {
        reason: dismissReason.trim(),
        actor: dismissActor.trim() || 'Supervisor',
        role: dismissRole,
      });
      onUpdated(updated);
      setShowDismissDialog(false);
      setDismissReason('');
      setSuccessMessage('Case administratively closed and archived.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dismiss case');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Resume Reopened Case (Reopened -> In Progress)
  const handleResumeWork = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const updated = await updateComplaint(complaint.id, {
        status: 'In Progress',
        officer_notes: 'Remediation re-opened and re-assigned for field work',
        actor: assignedTo || 'Field Supervisor',
      });
      onUpdated(updated);
      setSuccessMessage('Case resumed to In Progress.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resume work');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Resend notification email
  const handleResendEmail = async (type: 'lodged' | 'resolved') => {
    setResendingType(type);
    setResendStatus(null);
    try {
      const updated = await resendComplaintEmail(complaint.id, type);
      onUpdated(updated);
      setResendStatus(`Dispatched ${type} email via Resend.`);
      setTimeout(() => setResendStatus(null), 4000);
    } catch (err: any) {
      setResendStatus(`Failed: ${err.message}`);
    } finally {
      setResendingType(null);
    }
  };

  // Mask private citizen email for municipal privacy compliance
  const maskedEmail = complaint.citizen_email
    ? complaint.citizen_email.replace(/^(.)(.*)(@.*)$/, (_match, p1, p2, p3) => `${p1}***${p3}`)
    : 'Not provided';

  // Format date helper
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Not recorded';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Timeline events sorted chronologically (oldest to newest)
  const sortedHistory = [...(complaint.status_history || [])].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        // Close modal on backdrop click if no sub-dialog is active
        if (e.target === e.currentTarget && !showResolveDialog && !showReopenDialog && !showDismissDialog && !showAssignDialog && !showImagePreview) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complaint-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* =================================================================== */}
        {/* MODAL HEADER */}
        {/* =================================================================== */}
        <div className="bg-[#0B1F3A] text-white px-6 py-4.5 border-b-2 border-[#14B8A6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md border border-white/15">
              <span id="complaint-modal-title" className="font-mono font-bold text-sm sm:text-base text-teal-300">
                {complaint.id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy reference ID"
                className="text-slate-300 hover:text-white transition-colors"
                aria-label="Copy ticket ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <UrgencyBadge urgency={complaint.urgency} />
            <StatusBadge status={complaint.status} />

            <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(complaint.created_at)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
            aria-label="Close complaint dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="bg-red-50 border-b border-red-200 text-red-800 text-xs px-6 py-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              {errorMessage}
            </span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-red-600 font-bold ml-2">
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-6 py-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {successMessage}
            </span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-600 font-bold ml-2">
              Close
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL BODY (SCROLLABLE) */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {/* Main Title Banner */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
            <h3 className="font-extrabold text-base sm:text-lg text-[#0B1F3A] leading-snug">
              {complaint.summary}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
              <span className="font-semibold text-slate-700">
                Category: <span className="text-[#0B1F3A]">{complaint.category}</span> ({complaint.issue_type})
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
                {complaint.location_text || (complaint.latitude && complaint.longitude ? `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}` : 'Not specified')}
              </span>
            </div>
          </div>

          {/* Needs Review Alert Banner */}
          {complaint.needs_review && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Manual Review Required
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  {complaint.urgency_reason || 'AI triage flagged this grievance for human supervisor validation due to high-risk keywords or unusual categorization.'}
                </p>
              </div>
            </div>
          )}

          {/* Two-Column Grid: Grievance Details & AI Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left Card: Citizen Intake & Evidence */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#14B8A6]" />
                  Citizen Submission
                </span>
                <span className="text-[11px] text-slate-400">Intake Record</span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Citizen Narrative:
                </span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-800 leading-relaxed font-sans italic whitespace-pre-wrap">
                  "{complaint.raw_text}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Submitted By</span>
                  <span className="font-semibold text-slate-800">{complaint.citizen_name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Citizen Email (Protected)</span>
                  <span className="font-mono text-slate-600 text-[11px]">{maskedEmail}</span>
                </div>
              </div>

              {/* Photo Evidence Attachment */}
              {complaint.photo_path && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                    Attached Evidence Photo:
                  </span>
                  <div
                    onClick={() => setShowImagePreview(true)}
                    className="relative group cursor-pointer w-32 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:ring-2 hover:ring-[#14B8A6] transition-all"
                  >
                    <img
                      src={complaint.photo_path}
                      alt="Complaint evidence"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Card: Department Routing & AI Triage */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  Routing & Department
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {Math.round((complaint.confidence || 0.95) * 100)}% Confidence
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium mb-1">Assigned Department</span>
                <DepartmentBadge department={complaint.department} size="md" showCode={true} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Assigned Squad</span>
                  <span className="font-semibold text-slate-800">
                    {complaint.assigned_to || (
                      <span className="text-amber-600 italic">Not yet assigned</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Intake Engine</span>
                  <span className="font-semibold text-slate-700 capitalize">
                    {complaint.ai_source || 'AI Triaged'}
                  </span>
                </div>
              </div>

              <div className="bg-teal-50/60 border border-teal-200 rounded-lg p-3">
                <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block mb-0.5">
                  Suggested Action
                </span>
                <p className="text-xs text-teal-950 font-medium leading-relaxed">
                  {complaint.suggested_action}
                </p>
              </div>

              {complaint.officer_notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                    Officer / Resolution Notes
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans">
                    {complaint.officer_notes}
                  </p>
                </div>
              )}

              {complaint.closure_reason && (
                <div className="bg-slate-100 border border-slate-300 rounded-lg p-3">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-0.5">
                    Administrative Closure Reason
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans">
                    {complaint.closure_reason}
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* ================================================================= */}
          {/* PERSISTED STATUS TIMELINE */}
          {/* ================================================================= */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#14B8A6]" />
                Persisted Status Timeline
              </span>
              <span className="text-[11px] text-slate-400">
                {sortedHistory.length} Recorded Milestone{sortedHistory.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {sortedHistory.map((item, idx) => {
                const isLatest = idx === sortedHistory.length - 1;
                return (
                  <div key={item.id || idx} className="relative group">
                    {/* Timeline bullet dot */}
                    <div
                      className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white transition-all ${
                        isLatest
                          ? 'border-[#14B8A6] ring-4 ring-teal-100 bg-[#14B8A6]'
                          : 'border-slate-400'
                      }`}
                    />

                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {item.to_status === 'New' && 'Complaint Lodged'}
                          {item.to_status === 'Assigned' && 'Assigned to Squad'}
                          {item.to_status === 'In Progress' && 'Work Started'}
                          {item.to_status === 'Resolved' && 'Complaint Resolved'}
                          {item.to_status === 'Reopened' && 'Case Reopened'}
                          {item.to_status === 'Closed' && 'Administratively Closed'}
                          {!['New', 'Assigned', 'In Progress', 'Resolved', 'Reopened', 'Closed'].includes(item.to_status) && item.to_status}
                        </span>
                        <StatusBadge status={item.to_status as ComplaintStatus} showIcon={false} className="text-[10px] py-0 px-1.5" />
                      </div>

                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDate(item.changed_at)}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-slate-600 flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {item.actor || 'System'}
                      </span>
                      {item.notes && (
                        <>
                          <span className="text-slate-300">&bull;</span>
                          <span className="text-slate-700 italic font-sans text-xs">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Audit Log Strip */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-teal-600" />
                Email Dispatch Audit Log
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResendEmail('lodged')}
                  disabled={resendingType !== null}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 border border-teal-200 hover:bg-teal-50 px-2 py-0.5 rounded transition-all disabled:opacity-50"
                >
                  Resend Intake Alert
                </button>
                {complaint.status === 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => handleResendEmail('resolved')}
                    disabled={resendingType !== null}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 border border-emerald-200 hover:bg-emerald-50 px-2 py-0.5 rounded transition-all disabled:opacity-50"
                  >
                    Resend Resolution Alert
                  </button>
                )}
              </div>
            </div>

            {resendStatus && (
              <p className="text-xs text-teal-800 bg-teal-50 p-2 rounded border border-teal-200 font-medium">
                {resendStatus}
              </p>
            )}

            {complaint.email_logs && complaint.email_logs.length > 0 ? (
              <div className="space-y-1.5">
                {complaint.email_logs.map((log) => (
                  <div key={log.id} className="text-xs flex items-center justify-between py-1 px-2.5 bg-slate-50 rounded border border-slate-100">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      {log.email_type.toUpperCase()} &rarr; {log.to_email}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        log.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(log.sent_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No automated email events logged for this ticket yet.</p>
            )}
          </div>

        </div>

        {/* =================================================================== */}
        {/* MODAL FOOTER: STRICT ONE-WAY STATUS WORKFLOW CONTROLS */}
        {/* =================================================================== */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 shrink-0">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Current Status:
            </span>
            <StatusBadge status={complaint.status} />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* If New: Assign Squad */}
            {complaint.status === 'New' && (
              <button
                type="button"
                onClick={() => setShowAssignDialog(true)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0B1F3A] hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                <User className="w-3.5 h-3.5 text-[#14B8A6]" />
                Assign Squad &rarr;
              </button>
            )}

            {/* If Assigned: Start Work */}
            {complaint.status === 'Assigned' && (
              <button
                type="button"
                onClick={handleStartWork}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Start Remediation Work &rarr;
              </button>
            )}

            {/* If In Progress: Mark as Resolved */}
            {complaint.status === 'In Progress' && (
              <button
                type="button"
                onClick={() => setShowResolveDialog(true)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark as Resolved &rarr;
              </button>
            )}

            {/* If Resolved: Distinct Reopen Case and Dismiss Case options */}
            {complaint.status === 'Resolved' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReopenDialog(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg font-bold text-xs transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reopen Case
                </button>

                <button
                  type="button"
                  onClick={() => setShowDismissDialog(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-bold text-xs transition-colors disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-600" />
                  Close / Dismiss Case
                </button>
              </div>
            )}

            {/* If Reopened: Resume Work */}
            {complaint.status === 'Reopened' && (
              <button
                type="button"
                onClick={handleResumeWork}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Resume Work on Case &rarr;
              </button>
            )}

            {/* If Closed/Dismissed: Locked State */}
            {(complaint.status === 'Closed' || complaint.status === 'Dismissed') && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Case Permanently Archived
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold text-xs transition-colors"
            >
              Close
            </button>

          </div>
        </div>

        {/* =================================================================== */}
        {/* SUB-DIALOG: CONFIRM RESOLVE */}
        {/* =================================================================== */}
        {showResolveDialog && (
          <div className="absolute inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Certify Complaint Resolution
                </h4>
                <button type="button" onClick={() => setShowResolveDialog(false)}>
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Please document the field remediation action taken. This note will be recorded in the official audit history and dispatched to the citizen.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="e.g., Road crew completed cold-mix asphalt patching and road roller compaction. Cleaned site."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#14B8A6] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolve}
                  disabled={actionLoading || !resolveNotes.trim()}
                  className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  Confirm & Resolve Case
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-DIALOG: CONFIRM REOPEN */}
        {/* =================================================================== */}
        {showReopenDialog && (
          <div className="absolute inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  Reopen Complaint #{complaint.id}
                </h4>
                <button type="button" onClick={() => setShowReopenDialog(false)}>
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Reopening restores this ticket to the active municipal workflow. A valid reason must be documented for municipal accountability.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reopening Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g., Citizen reports water leakage reoccurred 24 hours after initial repair."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorizing Supervisor
                </label>
                <input
                  type="text"
                  value={reopenActor}
                  onChange={(e) => setReopenActor(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReopen}
                  disabled={actionLoading || !reopenReason.trim()}
                  className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  Reopen Case
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-DIALOG: CONFIRM DISMISS / CLOSE */}
        {/* =================================================================== */}
        {showDismissDialog && (
          <div className="absolute inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Archive className="w-4 h-4 text-slate-700" />
                  Administrative Case Closure / Dismissal
                </h4>
                <button type="button" onClick={() => setShowDismissDialog(false)}>
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> Closing or dismissing a complaint is an administrative action reserved for verified duplicates or out-of-jurisdiction reports. It cannot be undone through ordinary updates.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrative Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="e.g., Verified duplicate of CIV-00014, verified by ward inspector."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authorized Actor
                  </label>
                  <input
                    type="text"
                    value={dismissActor}
                    onChange={(e) => setDismissActor(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Authority
                  </label>
                  <select
                    value={dismissRole}
                    onChange={(e) => setDismissRole(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="Supervisor">Supervisor</option>
                    <option value="Admin">Admin</option>
                    <option value="Commissioner">Commissioner</option>
                    <option value="Municipal Lead">Municipal Lead</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDismissDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDismiss}
                  disabled={actionLoading || !dismissReason.trim()}
                  className="px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  Confirm Closure
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SUB-DIALOG: ASSIGN SQUAD */}
        {/* =================================================================== */}
        {showAssignDialog && (
          <div className="absolute inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-[#14B8A6]" />
                  Assign Municipal Squad
                </h4>
                <button type="button" onClick={() => setShowAssignDialog(false)}>
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Squad / Field Officer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSquad}
                  onChange={(e) => setNewSquad(e.target.value)}
                  placeholder="e.g., Road Squad 4 (A. Verma)"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#14B8A6] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  disabled={actionLoading || !newSquad.trim()}
                  className="px-4 py-1.5 text-xs bg-[#0B1F3A] hover:bg-slate-800 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  Assign & Transition
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* LIGHTBOX IMAGE PREVIEW */}
        {/* =================================================================== */}
        {showImagePreview && complaint.photo_path && (
          <div
            className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowImagePreview(false)}
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <img
                src={complaint.photo_path}
                alt="Complaint evidence expanded"
                className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/20"
              />
              <button
                type="button"
                onClick={() => setShowImagePreview(false)}
                className="absolute -top-3 -right-3 bg-white text-slate-900 rounded-full p-1.5 shadow-lg hover:bg-slate-100"
                aria-label="Close image preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
