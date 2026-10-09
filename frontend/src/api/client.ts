import { Complaint, ComplaintMapItem, StatsData } from '../types';

const BASE_URL = '/api';

export async function fetchStats(): Promise<StatsData> {
  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}

export async function fetchComplaints(params?: {
  urgency?: string;
  category?: string;
  department?: string;
  status?: string;
  needs_review?: boolean;
  search?: string;
}): Promise<Complaint[]> {
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
  if (!res.ok) throw new Error('Failed to fetch complaints list');
  return res.json();
}

export async function fetchComplaintById(id: string): Promise<Complaint> {
  const res = await fetch(`${BASE_URL}/complaints/${encodeURIComponent(id)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Ticket not found');
    throw new Error('Failed to retrieve ticket details');
  }
  return res.json();
}

export async function trackComplaint(identifier: string, email?: string): Promise<Complaint> {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  const res = await fetch(`${BASE_URL}/track/${encodeURIComponent(identifier)}${query}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Ticket not found');
    throw new Error('Failed to retrieve tracking details');
  }
  return res.json();
}

export async function submitComplaint(formData: FormData): Promise<Complaint> {
  const res = await fetch(`${BASE_URL}/complaints`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to submit complaint');
  }
  return res.json();
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
  const res = await fetch(`${BASE_URL}/complaints/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to update complaint');
  }
  return res.json();
}

export async function reopenComplaint(
  id: string,
  payload: { reason: string; actor?: string }
): Promise<Complaint> {
  const res = await fetch(`${BASE_URL}/complaints/${encodeURIComponent(id)}/reopen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to reopen complaint');
  }
  return res.json();
}

export async function dismissComplaint(
  id: string,
  payload: { reason: string; actor?: string; role?: string }
): Promise<Complaint> {
  const res = await fetch(`${BASE_URL}/complaints/${encodeURIComponent(id)}/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to close/dismiss complaint');
  }
  return res.json();
}

export async function resendComplaintEmail(id: string, email_type: 'lodged' | 'resolved'): Promise<Complaint> {
  const res = await fetch(`${BASE_URL}/complaints/${encodeURIComponent(id)}/resend-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_type }),
  });
  if (!res.ok) throw new Error('Failed to resend email');
  return res.json();
}

export async function fetchMapItems(params?: {
  urgency?: string;
  category?: string;
  status?: string;
  include_resolved?: boolean;
}): Promise<ComplaintMapItem[]> {
  const query = new URLSearchParams();
  if (params) {
    if (params.urgency) query.append('urgency', params.urgency);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.include_resolved !== undefined) query.append('include_resolved', String(params.include_resolved));
  }
  const res = await fetch(`${BASE_URL}/map?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load map items');
  return res.json();
}

export async function triggerSeed(): Promise<{ status: string; seeded: number }> {
  const res = await fetch(`${BASE_URL}/dev/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed sample data');
  return res.json();
}

export async function triggerReset(): Promise<{ status: string; reset: boolean; seeded: number }> {
  const res = await fetch(`${BASE_URL}/dev/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
}
