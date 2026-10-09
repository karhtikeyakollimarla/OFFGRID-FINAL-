export type Urgency = 'Critical' | 'High' | 'Medium' | 'Low';
export type Category = 'Roads' | 'Sanitation' | 'Water Supply' | 'Drainage' | 'Streetlights & Electrical' | 'Other';
export type ComplaintStatus = 'New' | 'Assigned' | 'In Progress' | 'Resolved' | 'Reopened' | 'Closed' | 'Dismissed';

export interface StatusHistory {
  id: number;
  complaint_id: string;
  from_status: string | null;
  to_status: string;
  actor?: string | null;
  notes?: string | null;
  changed_at: string;
}

export interface EmailLog {
  id: number;
  complaint_id: string;
  email_type: 'lodged' | 'resolved' | 'admin_notification';
  to_email: string;
  status: 'sent' | 'failed' | 'skipped' | 'pending';
  error: string | null;
  provider_id: string | null;
  sent_at: string;
  attempt_count?: number;
  retryable?: boolean;
}

export interface Complaint {
  id: string;
  raw_text: string;
  citizen_name: string;
  citizen_email: string;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  category: Category;
  issue_type: string;
  department: string;
  urgency: Urgency;
  urgency_reason: string;
  duration: string | null;
  summary: string;
  suggested_action: string;
  confidence: number;
  needs_review: boolean;
  status: ComplaintStatus;
  assigned_to: string | null;
  assigned_team_id?: string | null;
  officer_notes: string | null;
  photo_path: string | null;
  ai_source: string;
  is_demo?: boolean;
  reopen_count?: number;
  reopened_at?: string | null;
  closed_at?: string | null;
  closure_reason?: string | null;
  tracking_token?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  status_history: StatusHistory[];
  email_logs: EmailLog[];
}

export interface ComplaintMapItem {
  id: string;
  latitude: number | null;
  longitude: number | null;
  urgency: Urgency;
  category: Category;
  status: ComplaintStatus;
  summary: string;
  issue_type: string;
  created_at: string;
}

export interface StatsData {
  total: number;
  critical_open: number;
  new_today: number;
  resolved: number;
  by_category: Record<string, number>;
  by_urgency: Record<string, number>;
  by_status: Record<string, number>;
  needs_review_count: number;
  unmapped_count: number;
}
