/**
 * ReliefLink Mobile — API Client
 * Real fetch wrappers to the FastAPI backend.
 */

const API_URL =
  (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_URL) ||
  'http://localhost:8000/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content': 'application/json', 'Accept': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ─────────────────────────────────────────────────

export type UserRole = 'help' | 'volunteer' | 'admin';

export interface HelpRequest {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  city?: string;
  category: string;
  description?: string;
  urgency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface VolunteerTask {
  id: string;
  request_id?: string;
  title: string;
  category: string;
  city?: string;
  distance_km: number;
  skills_needed: string[];
  priority: string;
  status: string;
  assigned_volunteer_id?: string;
  progress_note?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface VolunteerStats {
  tasks_completed: number;
  hours_served: number;
  total_impact: number;
  active_tasks: number;
}

export interface AdminOverview {
  total_requests: number;
  active_volunteers: number;
  resolved: number;
  pending: number;
  deltas: Record<string, number>;
  recent_requests: Array<{ id: string; category: string; location?: string; status: string }>;
  map_markers: Array<{ id: string; label: string; severity: string; latitude?: number; longitude?: number }>;
}

// ─── API Methods ───────────────────────────────────────────

export async function submitHelpRequest(data: {
  category: string;
  full_name?: string;
  phone?: string;
  city?: string;
  description?: string;
  urgent?: boolean;
}): Promise<{ success: boolean; data: HelpRequest }> {
  return request('/help-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyRequests(userId?: string): Promise<{ success: boolean; data: HelpRequest[] }> {
  const q = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
  return request(`/help-requests${q}`);
}

export async function getAllHelpRequests(): Promise<{ success: boolean; data: HelpRequest[] }> {
  return request('/help-requests');
}

export async function getAvailableTasks(filters?: {
  category?: string;
  location?: string;
  search?: string;
}): Promise<{ success: boolean; data: VolunteerTask[] }> {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters?.location && filters.location !== 'all') params.set('location', filters.location);
  if (filters?.search) params.set('search', filters.search);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`/tasks${q}`);
}

export async function claimTask(taskId: string, volunteerId: string): Promise<{ success: boolean }> {
  return request(`/tasks/${taskId}/claim`, {
    method: 'POST',
    body: JSON.stringify({ volunteer_id: volunteerId }),
  });
}

export async function updateTaskProgress(
  taskId: string,
  status: string,
  progressNote?: string,
): Promise<{ success: boolean }> {
  return request(`/tasks/${taskId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ status, progress_note: progressNote }),
  });
}

export async function getMyAssignments(volunteerId: string): Promise<{ success: boolean; data: VolunteerTask[] }> {
  return request(`/tasks/my-assignments?volunteer_id=${encodeURIComponent(volunteerId)}`);
}

export async function getVolunteerStats(volunteerId?: string): Promise<{ success: boolean; data: VolunteerStats }> {
  const q = volunteerId ? `?volunteer_id=${encodeURIComponent(volunteerId)}` : '';
  return request(`/tasks/volunteer-stats${q}`);
}

export async function getAdminOverview(): Promise<{ success: boolean; data: AdminOverview }> {
  return request('/analytics/admin-overview');
}

export async function registerRole(data: {
  role: UserRole;
  full_name?: string;
  phone?: string;
  city?: string;
  email?: string;
  password?: string;
  category?: string;
  urgent?: boolean;
  skills?: string[];
  availability?: string;
}): Promise<{ success: boolean; data: { user: { id: string; full_name: string; role: string }; role: string } }> {
  return request('/auth/register-role', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminSignIn(email: string, password: string): Promise<{ success: boolean; data: { user: { id: string; full_name: string; role: string }; role: string } }> {
  return request('/auth/admin-signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getVolunteers(): Promise<{ success: boolean; data: Array<{ id: string; full_name: string; skills: string[]; availability: string; city?: string }> }> {
  return request('/volunteers');
}
