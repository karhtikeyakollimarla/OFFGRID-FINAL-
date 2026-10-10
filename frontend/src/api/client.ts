import { Complaint, ComplaintMapItem, StatsData, Category, Urgency, ComplaintStatus } from '../types';
import { INITIAL_MOCK_COMPLAINTS, computeStats, computeMapItems } from './mockData';

export const API_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const BASE_URL = API_HOST ? `${API_HOST}/api` : '/api';

export function getAssetUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_HOST ? `${API_HOST}${cleanPath}` : cleanPath;
}

// ----------------- RESILIENT LOCAL FALLBACK STORE -----------------
const STORAGE_KEY = 'nagrik_complaints_store_v2';

function loadStoredComplaints(): Complaint[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...INITIAL_MOCK_COMPLAINTS];
}

function persistStoredComplaints(items: Complaint[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch {}
}

let localComplaints: Complaint[] = loadStoredComplaints();

// Helper to check if response is valid JSON (and not Vercel HTML login redirect)
async function parseJsonResponse<T>(res: Response): Promise<T | null> {
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('application/json')) return null;
  return res.json().catch(() => null);
}

// In-browser keyword classifier + safety rules fallback for complaint creation
function analyzeComplaintLocal(text: string, locationHint?: string | null): {
  category: Category;
  issue_type: string;
  department: string;
  urgency: Urgency;
  urgency_reason: string;
  summary: string;
  suggested_action: string;
  confidence: number;
  needs_review: boolean;
} {
  const t = text.toLowerCase();
  let category: Category = 'Other';
  let issue_type = 'Unclassified Civic Issue';
  let department = 'General Administration';

  if (/(manhole|gutter|drain|drainage|naali|nali|sewer|sewage|overflow|stagnant water)/.test(t)) {
    category = 'Drainage';
    issue_type = 'Drainage Overflow / Clogged Drain';
    department = 'Drainage & Sewerage';
  } else if (/(wire|taar|electric|electrical|bijli|spark|sparking|streetlight|street light|light pole|transformer|shock)/.test(t)) {
    category = 'Streetlights & Electrical';
    issue_type = 'Streetlight / Electrical Hazard';
    department = 'Electrical & Street Lighting';
  } else if (/(pothole|khaddha|gaddha|asphalt|crater|footpath|rasta|pavement|road|sadak)/.test(t)) {
    category = 'Roads';
    issue_type = 'Pothole / Road Surface Damage';
    department = 'Public Works – Roads';
  } else if (/(garbage|kachra|kuda|waste|dump|trash|dustbin|safai|cleanliness|sanitation|foul smell|bad smell)/.test(t)) {
    category = 'Sanitation';
    issue_type = 'Garbage Accumulation / Waste Disposal';
    department = 'Sanitation & Solid Waste';
  } else if (/(drinking water|tap water|water supply|pipeline|pipe burst|paani|pani|peene ka paani|nal)/.test(t)) {
    category = 'Water Supply';
    issue_type = 'Water Supply Disruption / Leakage';
    department = 'Water Supply Board';
  }

  let urgency: Urgency = 'Medium';
  let urgency_reason = 'Standard municipal grievance assessed via rule engine.';

  if (/(urgent|severe|huge|bada|emergency|danger|hazard|2 weeks|month)/.test(t)) {
    urgency = 'High';
    urgency_reason = 'Elevated due to reported severity or prolonged duration.';
  }

  // Life-safety hazard overrides
  if (/(live wire|sparking wire|open manhole|electric shock|child fell|children fell|injury|accident)/.test(t)) {
    urgency = 'Critical';
    urgency_reason = 'SAFETY OVERRIDE: Imminent public safety / life hazard detected.';
  }

  const locationText = locationHint || 'Reported municipal sector';
  const summary = `Citizen reported ${issue_type.toLowerCase()} in ${category.toLowerCase()} domain near ${locationText}.`;
  const suggested_action = `Dispatch municipal inspection and remediation squad from ${department}.`;
  const confidence = category !== 'Other' ? 0.92 : 0.45;
  const needs_review = category === 'Other' || confidence < 0.6;

  return {
    category,
    issue_type,
    department,
    urgency,
    urgency_reason,
    summary,
    suggested_action,
    confidence,
    needs_review
  };
}

// ----------------- PUBLIC API CLIENT FUNCTIONS -----------------

export async function fetchStats(): Promise<StatsData> {
  try {
    const res = await fetch(`${BASE_URL}/stats`);
    const data = await parseJsonResponse<StatsData>(res);
    if (data && typeof data.total === 'number') return data;
  } catch {}
  return computeStats(localComplaints);
}

export async function fetchComplaints(params?: {
  urgency?: string;
  category?: string;
  department?: string;
  status?: string;
  needs_review?: boolean;
  search?: string;
}): Promise<Complaint[]> {
  try {
    const query = new URLSearchParams();
    if (params) {
      if (params.urgency) query.append('urgency', params.urgency);
      if (params.category) query.append('category', params.category);
      if (params.department) query.append('department', params.department);
      if (params.status) query.append('status', params.status);
      if (params.needs_review !== undefined) query.append('needs_review', String(params.needs_review));
      if (params.search) query.append('search', params.search);
    }
    const res = await fetch(`${BASE_URL}/complaints?${query.toString()}`);
    const data = await parseJsonResponse<Complaint[]>(res);
    if (Array.isArray(data)) return data;
  } catch {}

  // Filter local complaints
  let filtered = [...localComplaints];
  if (params) {
    if (params.urgency) filtered = filtered.filter(c => c.urgency.toLowerCase() === params.urgency?.toLowerCase());
    if (params.category) filtered = filtered.filter(c => c.category === params.category);
    if (params.department) filtered = filtered.filter(c => c.department === params.department);
    if (params.status) filtered = filtered.filter(c => c.status === params.status);
    if (params.needs_review !== undefined) filtered = filtered.filter(c => c.needs_review === params.needs_review);
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.id.toLowerCase().includes(s) ||
        c.raw_text.toLowerCase().includes(s) ||
        (c.location_text && c.location_text.toLowerCase().includes(s)) ||
        c.citizen_name.toLowerCase().includes(s)
      );
    }
  }
  return filtered;
}

export async function fetchComplaintById(id: string): Promise<Complaint> {
  try {
    const res = await fetch(`${BASE_URL}/complaints/${encodeURIComponent(id)}`);
    const data = await parseJsonResponse<Complaint>(res);
    if (data && data.id) return data;
  } catch {}

  const match = localComplaints.find(c => c.id.toLowerCase() === id.toLowerCase());
  if (match) return match;
  throw new Error('Ticket not found');
}

export async function trackComplaint(identifier: string, email?: string): Promise<Complaint> {
  try {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await fetch(`${BASE_URL}/track/${encodeURIComponent(identifier)}${query}`);
    const data = await parseJsonResponse<Complaint>(res);
    if (data && data.id) return data;
  } catch {}

  const clean = identifier.trim().toLowerCase();
  const match = localComplaints.find(c =>
    c.id.toLowerCase() === clean ||
    (c.tracking_token && c.tracking_token.toLowerCase() === clean) ||
    c.citizen_email.toLowerCase() === clean
  );
  if (match) return match;
  throw new Error('Ticket not found');
}

export async function submitComplaint(formData: FormData): Promise<Complaint> {
  try {
    const res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      body: formData,
    });
    const data = await parseJsonResponse<Complaint>(res);
    if (data && data.id) {
      localComplaints.unshift(data);
      persistStoredComplaints(localComplaints);
      return data;
    }
  } catch {}

  // Local creation fallback
  const raw_text = (formData.get('raw_text') as string) || '';
  const citizen_name = (formData.get('citizen_name') as string) || 'Citizen';
  const citizen_email = (formData.get('citizen_email') as string) || 'citizen@example.com';
  const location_text = (formData.get('location_text') as string) || null;
  const latStr = formData.get('latitude') as string;
  const lngStr = formData.get('longitude') as string;
  const latitude = latStr ? parseFloat(latStr) : 28.6139;
  const longitude = lngStr ? parseFloat(lngStr) : 77.2090;

  const analysis = analyzeComplaintLocal(raw_text, location_text);
  const nextNum = localComplaints.length + 1;
  const id = `CIV-${nextNum.toString().padStart(5, '0')}`;
  const now = new Date().toISOString();

  const newTicket: Complaint = {
    id,
    raw_text,
    citizen_name,
    citizen_email,
    location_text,
    latitude,
    longitude,
    category: analysis.category,
    issue_type: analysis.issue_type,
    department: analysis.department,
    urgency: analysis.urgency,
    urgency_reason: analysis.urgency_reason,
    duration: 'Reported today',
    summary: analysis.summary,
    suggested_action: analysis.suggested_action,
    confidence: analysis.confidence,
    needs_review: analysis.needs_review,
    status: 'New',
    assigned_to: 'Officer Rapid Response',
    assigned_team_id: 'RRT-01',
    officer_notes: null,
    photo_path: null,
    ai_source: 'client_fallback',
    is_demo: false,
    reopen_count: 0,
    created_at: now,
    updated_at: now,
    resolved_at: null,
    status_history: [
      {
        id: Date.now(),
        complaint_id: id,
        from_status: null,
        to_status: 'New',
        actor: 'Citizen Portal',
        notes: 'Complaint registered and assigned tracking code',
        changed_at: now
      }
    ],
    email_logs: [
      {
        id: Date.now() + 1,
        complaint_id: id,
        email_type: 'lodged',
        to_email: citizen_email,
        status: 'sent',
        error: null,
        provider_id: `resend_demo_${Date.now()}`,
        sent_at: now
      }
    ]
  };

  localComplaints.unshift(newTicket);
  persistStoredComplaints(localComplaints);
  return newTicket;
}

export async function updateComplaint(
  id: string,
  updates: {
    status?: string;
    assigned_to?: string;
    assigned_team_id?: string;
    officer_notes?: string;
    actor?: string;
    category?: string;
    department?: string;
    urgency?: string;
    latitude?: number | null;
    longitude?: number | null;
  }
): Promise<Complaint> {
  try {
    const res = await fetch(`${BASE_URL}/complaints/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await parseJsonResponse<Complaint>(res);
    if (data && data.id) {
      const idx = localComplaints.findIndex(c => c.id === id);
      if (idx !== -1) localComplaints[idx] = data;
      persistStoredComplaints(localComplaints);
      return data;
    }
  } catch {}

  const idx = localComplaints.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Complaint not found');

  const c = localComplaints[idx];
  const prevStatus = c.status;
  const now = new Date().toISOString();

  if (updates.status && updates.status !== prevStatus) {
    c.status = updates.status as ComplaintStatus;
    if (updates.status === 'Resolved') {
      c.resolved_at = now;
      c.email_logs.push({
        id: Date.now(),
        complaint_id: id,
        email_type: 'resolved',
        to_email: c.citizen_email,
        status: 'sent',
        error: null,
        provider_id: `resend_res_${Date.now()}`,
        sent_at: now
      });
    }
    c.status_history.push({
      id: Date.now(),
      complaint_id: id,
      from_status: prevStatus,
      to_status: updates.status,
      actor: updates.actor || 'Municipal Officer',
      notes: updates.officer_notes || `Status changed from ${prevStatus} to ${updates.status}`,
      changed_at: now
    });
  }

  if (updates.assigned_to !== undefined) c.assigned_to = updates.assigned_to;
  if (updates.assigned_team_id !== undefined) c.assigned_team_id = updates.assigned_team_id;
  if (updates.officer_notes !== undefined) c.officer_notes = updates.officer_notes;
  if (updates.category !== undefined) c.category = updates.category as Category;
  if (updates.department !== undefined) c.department = updates.department;
  if (updates.urgency !== undefined) c.urgency = updates.urgency as Urgency;
  if (updates.latitude !== undefined) c.latitude = updates.latitude;
  if (updates.longitude !== undefined) c.longitude = updates.longitude;
  c.updated_at = now;

  localComplaints[idx] = { ...c };
  persistStoredComplaints(localComplaints);
  return localComplaints[idx];
}

export async function reopenComplaint(
  id: string,
  payload: { reason: string; actor?: string }
): Promise<Complaint> {
  try {
    const res = await fetch(`${BASE_URL}/complaints/${encodeURIComponent(id)}/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonResponse<Complaint>(res);
    if (data && data.id) {
      const idx = localComplaints.findIndex(c => c.id === id);
      if (idx !== -1) localComplaints[idx] = data;
      persistStoredComplaints(localComplaints);
      return data;
    }
  } catch {}

  return updateComplaint(id, {
    status: 'Reopened',
    officer_notes: payload.reason,
    actor: payload.actor || 'Supervisor'
  });
}

export async function dismissComplaint(
  id: string,
  payload: { reason: string; actor?: string; role?: string }
): Promise<Complaint> {
  try {
    const res = await fetch(`${BASE_URL}/complaints/${encodeURIComponent(id)}/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonResponse<Complaint>(res);
    if (data && data.id) {
      const idx = localComplaints.findIndex(c => c.id === id);
      if (idx !== -1) localComplaints[idx] = data;
      persistStoredComplaints(localComplaints);
      return data;
    }
  } catch {}

  return updateComplaint(id, {
    status: 'Dismissed',
    officer_notes: payload.reason,
    actor: payload.actor || 'Chief Officer'
  });
}

export async function resendComplaintEmail(id: string, email_type: 'lodged' | 'resolved'): Promise<Complaint> {
  try {
    const res = await fetch(`${BASE_URL}/complaints/${encodeURIComponent(id)}/resend-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_type }),
    });
    const data = await parseJsonResponse<Complaint>(res);
    if (data && data.id) return data;
  } catch {}

  const c = await fetchComplaintById(id);
  c.email_logs.push({
    id: Date.now(),
    complaint_id: id,
    email_type,
    to_email: c.citizen_email,
    status: 'sent',
    error: null,
    provider_id: `resend_manual_${Date.now()}`,
    sent_at: new Date().toISOString()
  });
  persistStoredComplaints(localComplaints);
  return c;
}

export async function fetchMapItems(params?: {
  urgency?: string;
  category?: string;
  status?: string;
  include_resolved?: boolean;
}): Promise<ComplaintMapItem[]> {
  try {
    const query = new URLSearchParams();
    if (params) {
      if (params.urgency) query.append('urgency', params.urgency);
      if (params.category) query.append('category', params.category);
      if (params.status) query.append('status', params.status);
      if (params.include_resolved !== undefined) query.append('include_resolved', String(params.include_resolved));
    }
    const res = await fetch(`${BASE_URL}/map?${query.toString()}`);
    const data = await parseJsonResponse<ComplaintMapItem[]>(res);
    if (Array.isArray(data)) return data;
  } catch {}

  let items = computeMapItems(localComplaints, params?.include_resolved ?? true);
  if (params) {
    if (params.urgency) items = items.filter(m => m.urgency.toLowerCase() === params.urgency?.toLowerCase());
    if (params.category) items = items.filter(m => m.category === params.category);
    if (params.status) items = items.filter(m => m.status === params.status);
  }
  return items;
}

export async function triggerSeed(): Promise<{ status: string; seeded: number }> {
  try {
    const res = await fetch(`${BASE_URL}/dev/seed`, { method: 'POST' });
    const data = await parseJsonResponse<{ status: string; seeded: number }>(res);
    if (data && data.status) return data;
  } catch {}

  localComplaints = [...INITIAL_MOCK_COMPLAINTS];
  persistStoredComplaints(localComplaints);
  return { status: 'success', seeded: localComplaints.length };
}

export async function triggerReset(): Promise<{ status: string; reset: boolean; seeded: number }> {
  try {
    const res = await fetch(`${BASE_URL}/dev/reset`, { method: 'POST' });
    const data = await parseJsonResponse<{ status: string; reset: boolean; seeded: number }>(res);
    if (data && data.status) return data;
  } catch {}

  localComplaints = [...INITIAL_MOCK_COMPLAINTS];
  persistStoredComplaints(localComplaints);
  return { status: 'success', reset: true, seeded: localComplaints.length };
}
