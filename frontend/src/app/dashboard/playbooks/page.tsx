'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Cpu, Play, Plus, RefreshCw, CheckCircle, XCircle,
  Clock, ChevronDown, ChevronUp, X, ToggleLeft, ToggleRight
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const STATUS_STYLES: Record<string, string> = {
  completed: 'text-green-400 bg-green-500/10 border-green-500/20',
  failed: 'text-red-400 bg-red-500/10 border-red-500/20',
  running: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  idle: 'text-muted-foreground bg-muted/30 border-border',
};

function authFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('wafx_access_token') : null;
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });
}

const DEFAULT_YAML = `name: response-playbook
steps:
  - name: log
    action: log
    params:
      message: "Alert received: {{ alert.title }}"
  - name: notify
    action: slack_notify
    params:
      message: "🚨 {{ alert.severity }}: {{ alert.title }}"
`;

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [execModal, setExecModal] = useState<any>(null);
  const [alertIdInput, setAlertIdInput] = useState('');
  const [execLoading, setExecLoading] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', description: '', yaml_content: DEFAULT_YAML, is_active: true });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const pb = await api.getPlaybooks({ page_size: 100 });
      setPlaybooks(pb.items || []);
      const ex = await authFetch('/playbooks/executions?page_size=50');
      if (ex.ok) { const d = await ex.json(); setExecutions(d.items || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function execute() {
    if (!execModal) return;
    setExecLoading(execModal.id);
    try {
      await api.executePlaybook(execModal.id, alertIdInput.trim() || undefined);
      setExecModal(null);
      setTimeout(loadAll, 800);
    } catch (e) { console.error(e); }
    finally { setExecLoading(null); }
  }

  async function toggle(pb: any) {
    setToggleLoading(pb.id);
    try {
      await authFetch(`/playbooks/${pb.id}/toggle`, { method: 'POST' });
      setPlaybooks(prev => prev.map(p => p.id === pb.id ? { ...p, is_active: !p.is_active } : p));
    } catch (e) { console.error(e); }
    finally { setToggleLoading(null); }
  }

  async function create() {
    setAddError('');
    if (!addForm.name.trim()) { setAddError('Name is required'); return; }
    setAddLoading(true);
    try {
      const r = await authFetch('/playbooks/', { method: 'POST', body: JSON.stringify(addForm) });
      if (!r.ok) throw new Error(await r.text());
      setShowAdd(false);
      setAddForm({ name: '', description: '', yaml_content: DEFAULT_YAML, is_active: true });
      loadAll();
    } catch (e: any) { setAddError(e.message || 'Failed'); }
    finally { setAddLoading(false); }
  }

  const exFor = (id: string) => executions.filter(e => e.playbook_id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Cpu className="w-6 h-6 text-orange-400" /> SOAR Playbooks
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Automate incident response workflows</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="p-2 rounded-lg hover:bg-muted transition">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium border border-orange-500/20 hover:bg-orange-500/30 transition">
            <Plus className="w-4 h-4" /> New Playbook
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', val: playbooks.length, c: 'text-foreground' },
          { label: 'Active', val: playbooks.filter(p => p.is_active).length, c: 'text-green-400' },
          { label: 'Executions', val: executions.length, c: 'text-blue-400' },
          { label: 'Failed', val: executions.filter(e => e.status === 'failed').length, c: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.c}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-400" />
        </div>
      ) : playbooks.length === 0 ? (
        <div className="glass-card text-center py-16">
          <Cpu className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No playbooks yet</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-orange-400 hover:underline">
            Create your first playbook →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {playbooks.map(pb => {
            const execs = exFor(pb.id);
            const isEx = expanded === pb.id;
            return (
              <div key={pb.id} className="glass-card overflow-hidden">
                <div className="p-5 flex items-start gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${pb.is_active ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{pb.name}</h3>
                        {pb.description && <p className="text-xs text-muted-foreground mt-0.5">{pb.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {execs.length} execution{execs.length !== 1 ? 's' : ''} · Updated {new Date(pb.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggle(pb)} disabled={toggleLoading === pb.id}
                          className="p-1.5 rounded hover:bg-muted transition" title={pb.is_active ? 'Disable' : 'Enable'}>
                          {toggleLoading === pb.id
                            ? <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                            : pb.is_active
                              ? <ToggleRight className="w-5 h-5 text-green-400" />
                              : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                        </button>
                        <button onClick={() => setExpanded(isEx ? null : pb.id)}
                          className="p-1.5 rounded hover:bg-muted transition text-muted-foreground">
                          {isEx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setExecModal(pb); setAlertIdInput(''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-400 text-xs font-medium border border-orange-500/20 hover:bg-orange-500/25 transition">
                          <Play className="w-3 h-3" /> Execute
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {isEx && (
                  <div className="border-t border-border bg-muted/10 p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Executions</h4>
                      {execs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No executions yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {execs.slice(0, 5).map(ex => (
                            <div key={ex.id} className="flex items-center gap-3 text-xs">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${STATUS_STYLES[ex.status] || STATUS_STYLES.idle}`}>
                                {ex.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : ex.status === 'failed' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {ex.status}
                              </span>
                              <span className="text-muted-foreground">{new Date(ex.started_at).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">YAML</h4>
                      <pre className="text-xs font-mono text-foreground bg-muted/20 rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-40">{pb.yaml_content}</pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Execute Modal */}
      {execModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Execute Playbook</h3>
              <button onClick={() => setExecModal(null)} className="p-1 rounded hover:bg-muted transition"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <p className="text-sm text-muted-foreground font-medium text-foreground">{execModal.name}</p>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Alert ID <span className="opacity-60">(optional)</span></label>
              <input type="text" value={alertIdInput} onChange={e => setAlertIdInput(e.target.value)}
                placeholder="UUID of alert to use as context"
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500/50 font-mono" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setExecModal(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">Cancel</button>
              <button onClick={execute} disabled={execLoading === execModal.id}
                className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium border border-orange-500/20 hover:bg-orange-500/30 transition flex items-center gap-2 disabled:opacity-50">
                {execLoading === execModal.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">New Playbook</h3>
              <button onClick={() => { setShowAdd(false); setAddError(''); }} className="p-1 rounded hover:bg-muted transition"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Name *</label>
                <input type="text" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Block malicious IP on critical alert"
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Description</label>
                <input type="text" value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief summary"
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">YAML Definition *</label>
                <textarea value={addForm.yaml_content} onChange={e => setAddForm(p => ({ ...p, yaml_content: e.target.value }))}
                  rows={10} className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500/50 resize-none font-mono" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={addForm.is_active} onChange={e => setAddForm(p => ({ ...p, is_active: e.target.checked }))} />
                <span className="text-sm text-foreground">Active immediately</span>
              </label>
            </div>
            {addError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{addError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowAdd(false); setAddError(''); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">Cancel</button>
              <button onClick={create} disabled={addLoading}
                className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium border border-orange-500/20 hover:bg-orange-500/30 transition flex items-center gap-2 disabled:opacity-50">
                {addLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
