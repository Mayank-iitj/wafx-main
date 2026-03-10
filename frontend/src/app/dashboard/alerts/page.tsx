'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { wsClient } from '@/lib/ws';
import {
  AlertTriangle, Filter, ChevronDown, Check, X, Eye,
  ArrowUpRight, MoreHorizontal
} from 'lucide-react';

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const STATUSES = ['new', 'in_progress', 'resolved', 'false_positive', 'closed'];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAlerts();
  }, [page, severity, status]);

  useEffect(() => {
    wsClient.on('new_alert', (data) => {
      setAlerts((prev) => [data, ...prev.slice(0, 49)]);
      setTotal((prev) => prev + 1);
    });
  }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const params: any = { page, page_size: 50 };
      if (severity) params.severity = severity;
      if (status) params.status = status;
      const data = await api.getAlerts(params);
      setAlerts(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  function selectAll() {
    if (selected.size === alerts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(alerts.map((a) => a.id)));
    }
  }

  async function bulkAction(action: string) {
    if (selected.size === 0) return;
    try {
      await api.bulkAlertAction(Array.from(selected), action);
      setSelected(new Set());
      loadAlerts();
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alert Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} alerts total</p>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            id="severity-filter"
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
            className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Severities</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <select
            id="status-filter"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
            ))}
          </select>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <button onClick={() => bulkAction('resolve')} className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30 transition">
              <Check className="w-3 h-3 inline mr-1" /> Resolve
            </button>
            <button onClick={() => bulkAction('close')} className="px-3 py-1 rounded bg-gray-500/20 text-gray-400 text-xs hover:bg-gray-500/30 transition">
              <X className="w-3 h-3 inline mr-1" /> Close
            </button>
            <button onClick={() => bulkAction('false_positive')} className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs hover:bg-yellow-500/30 transition">
              False +
            </button>
          </div>
        )}
      </div>

      {/* Alert Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
          </div>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === alerts.length && alerts.length > 0}
                    onChange={selectAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Severity</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Title</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">MITRE</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Source</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Time</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition group"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(alert.id)}
                      onChange={() => toggleSelect(alert.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="p-3">
                    <span className={`severity-${alert.severity} px-2 py-0.5 rounded text-xs font-medium capitalize`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <a
                      href={`/dashboard/alerts/${alert.id}`}
                      className="text-sm text-foreground hover:text-blue-400 transition"
                    >
                      {alert.title}
                    </a>
                  </td>
                  <td className="p-3">
                    <span className={`status-${alert.status} px-2 py-0.5 rounded text-xs capitalize`}>
                      {alert.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3">
                    {alert.mitre_technique && (
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        {alert.mitre_technique}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{alert.source || '—'}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(alert.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <a href={`/dashboard/alerts/${alert.id}`}>
                      <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground transition cursor-pointer" />
                    </a>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">
                    No alerts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded bg-muted text-sm text-muted-foreground disabled:opacity-30 hover:bg-muted/80 transition"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded bg-muted text-sm text-muted-foreground disabled:opacity-30 hover:bg-muted/80 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
