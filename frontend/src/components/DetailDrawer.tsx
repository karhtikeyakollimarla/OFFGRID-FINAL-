import React, { useState, useEffect } from 'react';
import { Complaint, Urgency, Category, ComplaintStatus } from '../types';
import { updateComplaint, resendComplaintEmail } from '../api/client';
import { UrgencyBadge } from './UrgencyBadge';
import { StatusBadge } from './StatusBadge';
import { LocationPickerMap } from './LocationPickerMap';
import { DepartmentCard, DepartmentSelect } from './DepartmentBadge';
import {
  X,
  User,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  SendHorizontal,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface DetailDrawerProps {
  complaint: Complaint | null;
  onClose: () => void;
  onUpdated: (updated: Complaint) => void;
  allComplaints?: Complaint[];
}

const CATEGORIES: Category[] = [
  'Roads',
  'Sanitation',
  'Water Supply',
  'Drainage',
  'Streetlights & Electrical',
  'Other',
];

const URGENCIES: Urgency[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: ComplaintStatus[] = ['New', 'Assigned', 'In Progress', 'Resolved'];

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  complaint,
  onClose,
  onUpdated,
  allComplaints = [],
}) => {
  if (!complaint) return null;

  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [assignedTo, setAssignedTo] = useState(complaint.assigned_to || '');
  const [officerNotes, setOfficerNotes] = useState(complaint.officer_notes || '');
  const [category, setCategory] = useState<Category>(complaint.category);
  const [department, setDepartment] = useState(complaint.department);
  const [urgency, setUrgency] = useState<Urgency>(complaint.urgency);
  const [lat, setLat] = useState<number | null>(complaint.latitude);
  const [lng, setLng] = useState<number | null>(complaint.longitude);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [resendingType, setResendingType] = useState<'lodged' | 'resolved' | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Sync state whenever selected complaint changes
  useEffect(() => {
    setStatus(complaint.status);
    setAssignedTo(complaint.assigned_to || '');
    setOfficerNotes(complaint.officer_notes || '');
    setCategory(complaint.category);
    setDepartment(complaint.department);
    setUrgency(complaint.urgency);
    setLat(complaint.latitude);
    setLng(complaint.longitude);
    setSaveSuccess(false);
    setErrorMsg(null);
    setResendStatus(null);
  }, [complaint]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);
    try {
      const updated = await updateComplaint(complaint.id, {
        status,
        assigned_to: assignedTo.trim() || undefined,
        officer_notes: officerNotes.trim() || undefined,
        category,
        department,
        urgency,
        latitude: lat,
        longitude: lng,
      });
      onUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleResendEmail = async (type: 'lodged' | 'resolved') => {
    setResendingType(type);
    setResendStatus(null);
    try {
      const updated = await resendComplaintEmail(complaint.id, type);
      onUpdated(updated);
      setResendStatus(`Successfully triggered ${type} email dispatch.`);
      setTimeout(() => setResendStatus(null), 4000);
    } catch (err: any) {
      setResendStatus(`Failed to resend: ${err.message}`);
    } finally {
      setResendingType(null);
    }
  };

  // Near duplicate check (within ~150 meters and same category)
  const possibleDuplicates = allComplaints.filter((other) => {
    if (other.id === complaint.id) return false;
    if (other.category !== complaint.category) return false;
    if (other.latitude && other.longitude && complaint.latitude && complaint.longitude) {
      const dLat = Math.abs(other.latitude - complaint.latitude);
      const dLng = Math.abs(other.longitude - complaint.longitude);
      // Rough approximation for 150m: 0.0015 deg
      return dLat < 0.0018 && dLng < 0.0018;
    }
    return false;
  });

  const isSample = complaint.citizen_name.includes('(Sample)') || complaint.citizen_email.endsWith('@example.com');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="bg-[#0B1F3A] text-white p-5 border-b-2 border-[#14B8A6] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-lg text-teal-400">{complaint.id}</span>
              <UrgencyBadge urgency={complaint.urgency} />
              <StatusBadge status={complaint.status} />
              {isSample && (
                <span className="text-[10px] bg-slate-700/80 text-slate-300 font-medium px-2 py-0.5 rounded border border-slate-600">
                  Sample Data
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-medium line-clamp-1">{complaint.summary}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">

          {/* Feedback alerts */}
          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-300 text-teal-800 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              Officer ticket updates saved successfully!
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Possible Duplicate Banner */}
          {possibleDuplicates.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <strong className="font-semibold">Possible Cluster / Duplicate Detected:</strong>
                <p className="mt-0.5">
                  Another ticket in <strong>{complaint.category}</strong> was filed within ~150 meters:
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {possibleDuplicates.map((dup) => (
                    <span key={dup.id} className="font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 font-bold">
                      {dup.id} ({dup.urgency})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Side-by-side: Original Citizen Complaint vs AI Triage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Original Complaint */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Original Complaint
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-800 text-xs leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200 shadow-2xs whitespace-pre-wrap">
                  "{complaint.raw_text}"
                </p>
              </div>

              {/* Citizen info */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs space-y-1.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{complaint.citizen_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-700">{complaint.citizen_email}</span>
                </div>
                {complaint.location_text && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{complaint.location_text}</span>
                  </div>
                )}
                {complaint.photo_path && (
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Attached Photo:</span>
                    <a
                      href={complaint.photo_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded border border-slate-300 overflow-hidden hover:opacity-85"
                    >
                      <img src={complaint.photo_path} alt="Complaint Attachment" className="h-20 w-auto object-cover" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* AI Triage Output */}
            <div className="bg-teal-50/40 border border-teal-200 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
                    AI Triage Analysis
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    complaint.ai_source === 'llm'
                      ? 'bg-teal-100 text-teal-800 border border-teal-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {complaint.ai_source.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block font-medium">One-Sentence Summary:</span>
                    <p className="text-slate-800 font-semibold">{complaint.summary}</p>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block font-medium">Urgency Rationale:</span>
                    <p className="text-slate-700">{complaint.urgency_reason}</p>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block font-medium">Suggested Municipal Action:</span>
                    <p className="text-slate-700 bg-white/80 p-2 rounded border border-teal-200/60 font-medium">
                      {complaint.suggested_action}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-teal-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block font-medium">AI Confidence:</span>
                  <span className="font-bold text-teal-900 font-mono">
                    {Math.round(complaint.confidence * 100)}%
                  </span>
                </div>
                {complaint.needs_review && (
                  <span className="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded">
                    Needs Review
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Officer Editable Controls Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <ShieldCheck className="w-4 h-4 text-[#0B1F3A]" />
              Officer Classification & Assignment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value as Category;
                    setCategory(cat);
                    const deptMap: Record<Category, string> = {
                      Roads: 'Public Works – Roads',
                      Sanitation: 'Sanitation & Solid Waste',
                      'Water Supply': 'Water Supply Board',
                      Drainage: 'Drainage & Sewerage',
                      'Streetlights & Electrical': 'Electrical & Street Lighting',
                      Other: 'General Administration',
                    };
                    setDepartment(deptMap[cat] || 'General Administration');
                  }}
                  className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border focus:ring-2 focus:ring-[#14B8A6]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as Urgency)}
                  className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border focus:ring-2 focus:ring-[#14B8A6]"
                >
                  {URGENCIES.map((urg) => (
                    <option key={urg} value={urg}>{urg}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                  className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border focus:ring-2 focus:ring-[#14B8A6] font-semibold"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Department Card Display & Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Municipal Division & Protocol
              </label>
              
              <DepartmentCard department={department} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Re-route Municipal Department
                  </label>
                  <DepartmentSelect
                    value={department}
                    onChange={(newDept) => setDepartment(newDept)}
                  />
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Officer / Squad</label>
                  <input
                    type="text"
                    placeholder="e.g. Officer A. Sharma (Zone 4)"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 bg-white p-2.5 focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent text-slate-800 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Officer Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Officer Inspection & Resolution Notes</label>
              <textarea
                rows={2}
                placeholder="Add inspection observations, team dispatch notes, or resolution confirmation..."
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 bg-white p-2 border focus:ring-2 focus:ring-[#14B8A6]"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#0B1F3A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow hover:shadow-md disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-[#14B8A6]" />
                {saving ? 'Saving Updates...' : 'Save Officer Updates'}
              </button>
            </div>
          </div>

          {/* Location Pin Setter */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#14B8A6]" />
                Map Location & Manual Pin Setter
              </h3>
              {(!lat || !lng) && (
                <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-300">
                  No GPS coordinates
                </span>
              )}
            </div>

            <LocationPickerMap
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
              height="220px"
            />
          </div>

          {/* Status Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <Clock className="w-4 h-4 text-slate-500" />
              Ticket Status History
            </h3>

            <div className="space-y-3">
              {complaint.status_history.map((hist, idx) => (
                <div key={hist.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#14B8A6] mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {hist.from_status ? `${hist.from_status} → ${hist.to_status}` : `Ticket Created (${hist.to_status})`}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(hist.changed_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Log & Resend Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-500" />
                Citizen Email Notification Log
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResendEmail('lodged')}
                  disabled={resendingType !== null}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  title="Resend Lodged Confirmation Email"
                >
                  <Send className="w-3 h-3 text-[#14B8A6]" />
                  Resend Lodged
                </button>
                <button
                  type="button"
                  onClick={() => handleResendEmail('resolved')}
                  disabled={resendingType !== null}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  title="Resend Resolution Email"
                >
                  <SendHorizontal className="w-3 h-3 text-[#14B8A6]" />
                  Resend Resolved
                </button>
              </div>
            </div>

            {resendStatus && (
              <div className="text-xs p-2 rounded bg-slate-100 border border-slate-300 text-slate-800">
                {resendStatus}
              </div>
            )}

            {complaint.email_logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No email delivery attempts logged yet.</p>
            ) : (
              <div className="space-y-2">
                {complaint.email_logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {log.email_type}
                        </span>
                        <span className="font-mono text-slate-600">{log.to_email}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'skipped'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      {log.error && (
                        <p className="text-[11px] text-red-600 mt-1 font-mono">{log.error}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                      {new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 font-mono">ID: {complaint.id}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
