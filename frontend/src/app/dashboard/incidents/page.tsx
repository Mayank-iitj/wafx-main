'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  FileWarning, Plus, Filter, X, AlertTriangle, Clock, User,
  ChevronDown, Eye
} from 'lucide-react';

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const STATUSES = ['open', 'investigating', 'contained', 'resolved', 'closed'];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [newTags, setNewTags] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, [page, statusFilter]);

  async function loadIncidents() {
    setLoading(true);
    try {
      const params: any = { page, page_size: 50 };
      if (statusFilter) params.status = statusFilter;
      const data = await api.getIncidents(params);
      setIncidents(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createIncident() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await api.createIncident({
        title: newTitle,
        description: newDescription,
        severity: newSeverity,
        tags: newTags ? newTags.split(',').map((t) => t.trim()) : [],
      });
      setShowCreate(false);
      setNewTitle('');
      setNewDescription('');
      setNewSeverity('medium');
      setNewTags('');
      loadIncidents();
    } catch (err) {
      console.error('Failed to create incident:', err);
    } finally {
      setCreating(false);
    }
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Incident Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} incidents total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Incident
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          id="incident-status-filter"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Incidents Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
          </div>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Severity</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Title</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider"># Alerts</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Assigned</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Created</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr
                  key={inc.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition group"
                >
                  <td className="p-3">
                    <span className={`severity-${inc.severity} px-2 py-0.5 rounded text-xs font-medium capitalize`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/dashboard/incidents/${inc.id}`}
                      className="text-sm text-foreground hover:text-blue-400 transition"
                    >
                      {inc.title}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className={`status-${inc.status} px-2 py-0.5 rounded text-xs capitalize`}>
                      {inc.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {inc.alert_ids?.length || inc.alert_count || 0}
                  </td>
                  <td className="p-3">
                    {inc.assigned_to ? (
                      <span className="flex items-center gap-1.5 text-sm text-foreground">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {inc.assigned_to}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(inc.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <Link href={`/dashboard/incidents/${inc.id}`}>
                      <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground transition cursor-pointer" />
                    </Link>
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                    No incidents found
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

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Create Incident</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-muted transition">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="inc-title" className="block text-sm text-muted-foreground mb-1">Title *</label>
                <input
                  id="inc-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Incident title..."
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label htmlFor="inc-desc" className="block text-sm text-muted-foreground mb-1">Description</label>
                <textarea
                  id="inc-desc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the incident..."
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <div>
                <label htmlFor="inc-severity" className="block text-sm text-muted-foreground mb-1">Severity</label>
                <select
                  id="inc-severity"
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="inc-tags" className="block text-sm text-muted-foreground mb-1">Tags (comma-separated)</label>
                <input
                  id="inc-tags"
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="ransomware, lateral-movement"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                onClick={createIncident}
                disabled={creating || !newTitle.trim()}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {creating ? 'Creating...' : 'Create Incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
