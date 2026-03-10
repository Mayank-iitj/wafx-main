/** API client — typed HTTP client for the WAFx backend. */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('wafx_access_token');
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.set(k, String(v));
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, { ...fetchOptions, headers });

    if (response.status === 401) {
      // Try refresh
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        const newHeaders = { ...headers, Authorization: `Bearer ${this.getToken()}` };
        const retryResp = await fetch(url, { ...fetchOptions, headers: newHeaders });
        if (!retryResp.ok) throw new APIError(retryResp.status, await retryResp.text());
        return retryResp.json();
      }
      // Clear tokens and redirect to login
      localStorage.removeItem('wafx_access_token');
      localStorage.removeItem('wafx_refresh_token');
      window.location.href = '/login';
      throw new APIError(401, 'Unauthorized');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new APIError(response.status, body);
    }

    return response.json();
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('wafx_refresh_token');
    if (!refreshToken) return false;

    try {
      const resp = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      localStorage.setItem('wafx_access_token', data.access_token);
      localStorage.setItem('wafx_refresh_token', data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  // ── Auth ────────────────────────────────────────────────────────────
  async login(email: string, password: string, mfa_code?: string) {
    const data = await this.request<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, mfa_code }),
    });
    localStorage.setItem('wafx_access_token', data.access_token);
    localStorage.setItem('wafx_refresh_token', data.refresh_token);
    return data;
  }

  async register(email: string, password: string, full_name: string, org_name: string) {
    const data = await this.request<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, org_name }),
    });
    localStorage.setItem('wafx_access_token', data.access_token);
    localStorage.setItem('wafx_refresh_token', data.refresh_token);
    return data;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // ── Dashboard ──────────────────────────────────────────────────────
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  // ── Alerts ─────────────────────────────────────────────────────────
  async getAlerts(params?: Record<string, any>) {
    return this.request<any>('/alerts/', { params });
  }

  async getAlert(id: string) {
    return this.request<any>(`/alerts/${id}`);
  }

  async updateAlert(id: string, data: any) {
    return this.request<any>(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async bulkAlertAction(alert_ids: string[], action: string, params?: any) {
    return this.request<any>('/alerts/bulk', {
      method: 'POST',
      body: JSON.stringify({ alert_ids, action, params: params || {} }),
    });
  }

  async getAlertStats() {
    return this.request<any>('/alerts/stats');
  }

  // ── Incidents ──────────────────────────────────────────────────────
  async getIncidents(params?: Record<string, any>) {
    return this.request<any>('/incidents/', { params });
  }

  async getIncident(id: string) {
    return this.request<any>(`/incidents/${id}`);
  }

  async createIncident(data: any) {
    return this.request<any>('/incidents/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIncident(id: string, data: any) {
    return this.request<any>(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addIncidentNote(id: string, content: string) {
    return this.request<any>(`/incidents/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // ── Rules ──────────────────────────────────────────────────────────
  async getRules(params?: Record<string, any>) {
    return this.request<any>('/rules/', { params });
  }

  async createRule(data: any) {
    return this.request<any>('/rules/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleRule(id: string) {
    return this.request<any>(`/rules/${id}/toggle`, { method: 'POST' });
  }

  // ── Events ─────────────────────────────────────────────────────────
  async searchEvents(query: any) {
    return this.request<any>('/events/search', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  async ingestEvents(data: any) {
    return this.request<any>('/events/ingest', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ── Intelligence ───────────────────────────────────────────────────
  async getIOCs(params?: Record<string, any>) {
    return this.request<any>('/intelligence/iocs', { params });
  }

  async enrichIP(ip: string) {
    return this.request<any>(`/intelligence/enrich/ip/${ip}`, { method: 'POST' });
  }

  async enrichDomain(domain: string) {
    return this.request<any>(`/intelligence/enrich/domain/${domain}`, { method: 'POST' });
  }

  // ── Playbooks ──────────────────────────────────────────────────────
  async getPlaybooks(params?: Record<string, any>) {
    return this.request<any>('/playbooks/', { params });
  }

  async executePlaybook(playbookId: string, alertId?: string) {
    return this.request<any>(`/playbooks/${playbookId}/execute`, {
      method: 'POST',
      ...(alertId ? { params: { alert_id: alertId } } : {}),
    });
  }

  // ── AI ─────────────────────────────────────────────────────────────
  async aiQuery(query: string, contextAlertId?: string, contextIncidentId?: string) {
    return this.request<any>('/ai/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        context_alert_id: contextAlertId,
        context_incident_id: contextIncidentId,
      }),
    });
  }

  async analyzeAlert(alertId: string) {
    return this.request<any>(`/ai/analyze-alert/${alertId}`, { method: 'POST' });
  }

  logout() {
    localStorage.removeItem('wafx_access_token');
    localStorage.removeItem('wafx_refresh_token');
    window.location.href = '/login';
  }
}

export class APIError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API Error ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

export const api = new APIClient(API_BASE);
