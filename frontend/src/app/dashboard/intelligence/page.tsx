'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Brain, Globe, Hash, ShieldAlert, Search, Plus, RefreshCw,
  ExternalLink, Fingerprint, AlertCircle, CheckCircle, Clock,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';

const IOC_TYPES = ['ip', 'domain', 'url', 'md5', 'sha1', 'sha256', 'email', 'cve'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  ip: <Globe className="w-3.5 h-3.5" />,
  domain: <Globe className="w-3.5 h-3.5" />,
  url: <ExternalLink className="w-3.5 h-3.5" />,
  md5: <Fingerprint className="w-3.5 h-3.5" />,
  sha1: <Fingerprint className="w-3.5 h-3.5" />,
  sha256: <Fingerprint className="w-3.5 h-3.5" />,
  email: <ShieldAlert className="w-3.5 h-3.5" />,
  cve: <AlertCircle className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<string, string> = {
  ip: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  domain: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  url: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  md5: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  sha1: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  sha256: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  email: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  cve: 'text-red-400 bg-red-500/10 border-red-500/20',
};

interface IOC {
  id: string;
  ioc_type: string;
  ioc_value: string;
  source: string;
  confidence: number;
  tags: string[];
  context: Record<string, any>;
  first_seen: string;
  last_seen: string;
}

export default function IntelligencePage() {
  const [iocs, setIocs] = useState<IOC[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [enrichTarget, setEnrichTarget] = useState('');
  const [enrichResult, setEnrichResult] = useState<any>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  const [newIOC, setNewIOC] = useState({
    ioc_type: 'ip',
    ioc_value: '',
    source: 'manual',
    confidence: 70,
    tags: '',
    context: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const PAGE_SIZE = 50;

  useEffect(() => {
    loadIOCs();
  }, [page, typeFilter]);

  async function loadIOCs() {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: PAGE_SIZE };
      if (typeFilter) params.ioc_type = typeFilter;
      const data = await api.getIOCs(params);
      setIocs(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load IOCs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function enrich() {
    if (!enrichTarget.trim()) return;
    setEnrichLoading(true);
    setEnrichResult(null);
    try {
      // Detect type: IP vs domain
      const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(enrichTarget.trim());
      const result = isIP
        ? await api.enrichIP(enrichTarget.trim())
        : await api.enrichDomain(enrichTarget.trim());
      setEnrichResult(result);
    } catch (err) {
      console.error('Enrichment failed:', err);
      setEnrichResult({ error: 'Enrichment failed — check API keys in backend settings' });
    } finally {
      setEnrichLoading(false);
    }
  }

  async function addIOC() {
    setAddError('');
    if (!newIOC.ioc_value.trim()) {
      setAddError('IOC value is required');
      return;
    }
    setAddLoading(true);
    try {
      let contextObj: Record<string, any> = {};
      if (newIOC.context.trim()) {
        try { contextObj = JSON.parse(newIOC.context); } catch { contextObj = { note: newIOC.context }; }
      }
      await api.getIOCs({}); // verify connectivity
      const payload = {
        ioc_type: newIOC.ioc_type,
        ioc_value: newIOC.ioc_value.trim(),
        source: newIOC.source || 'manual',
        confidence: Number(newIOC.confidence),
        tags: newIOC.tags.split(',').map(t => t.trim()).filter(Boolean),
        context: contextObj,
      };
      // POST directly since api.ts doesn't have createIOC — use internal fetch
      const token = typeof window !== 'undefined' ? localStorage.getItem('wafx_access_token') : null;
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/intelligence/iocs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );
      if (!resp.ok) throw new Error(await resp.text());
      setShowAddModal(false);
      setNewIOC({ ioc_type: 'ip', ioc_value: '', source: 'manual', confidence: 70, tags: '', context: '' });
      loadIOCs();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add IOC');
    } finally {
      setAddLoading(false);
    }
  }

  const filtered = search
    ? iocs.filter(i => i.ioc_value.toLowerCase().includes(search.toLowerCase()))
    : iocs;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            Threat Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            IOC database, enrichment, and feed management
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium border border-blue-500/20 hover:bg-blue-500/30 transition"
        >
          <Plus className="w-4 h-4" />
          Add IOC
        </button>
      </div>

      {/* Enrich Panel */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-400" />
          Live Enrichment
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={enrichTarget}
            onChange={e => setEnrichTarget(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enrich()}
            placeholder="Enter IP address or domain (e.g. 1.2.3.4 or evil.com)"
            className="flex-1 bg-muted/30 border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
          />
          <button
            onClick={enrich}
            disabled={enrichLoading || !enrichTarget.trim()}
            className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium border border-orange-500/20 hover:bg-orange-500/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            {enrichLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Globe className="w-4 h-4" />}
            Enrich
          </button>
        </div>
        {enrichResult && (
          <div className="mt-3 rounded-lg bg-muted/20 border border-border p-4 overflow-x-auto">
            {enrichResult.error ? (
              <p className="text-sm text-red-400">{enrichResult.error}</p>
            ) : (
              <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                {JSON.stringify(enrichResult, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by value..."
            className="pl-9 pr-4 py-2 w-full rounded-lg bg-muted/30 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm text-foreground focus:outline-none focus:border-blue-500/50"
        >
          <option value="">All types</option>
          {IOC_TYPES.map(t => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>
        <button onClick={() => loadIOCs()} className="p-2 rounded-lg hover:bg-muted transition">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {IOC_TYPES.slice(0, 4).map(t => {
          const count = iocs.filter(i => i.ioc_type === t).length;
          return (
            <button
              key={t}
              onClick={() => { setTypeFilter(typeFilter === t ? '' : t); setPage(1); }}
              className={`glass-card p-4 text-left hover:border-blue-500/30 transition cursor-pointer ${typeFilter === t ? 'border-blue-500/40' : ''}`}
            >
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${TYPE_COLORS[t] || 'text-foreground bg-muted border-border'}`}>
                {TYPE_ICONS[t]}
                {t.toUpperCase()}
              </div>
              <p className="text-lg font-bold text-foreground mt-2">{count}</p>
            </button>
          );
        })}
      </div>

      {/* IOC Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            IOC Database
            <span className="ml-2 text-muted-foreground font-normal">({total} total)</span>
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No IOCs found</p>
            <button onClick={() => setShowAddModal(true)} className="mt-3 text-xs text-blue-400 hover:underline">
              Add your first IOC →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Type', 'Value', 'Source', 'Confidence', 'Tags', 'Last Seen'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(ioc => (
                  <tr key={ioc.id} className="hover:bg-muted/20 transition group">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${TYPE_COLORS[ioc.ioc_type] || 'text-foreground bg-muted border-border'}`}>
                        {TYPE_ICONS[ioc.ioc_type]}
                        {ioc.ioc_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-foreground font-mono">{ioc.ioc_value}</code>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ioc.source}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ioc.confidence >= 80 ? 'bg-green-400' : ioc.confidence >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${ioc.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{ioc.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {ioc.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ioc.last_seen).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-muted transition disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-muted transition disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add IOC Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">Add IOC</h3>
              <button onClick={() => { setShowAddModal(false); setAddError(''); }} className="p-1 rounded hover:bg-muted transition">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Type *</label>
                  <select
                    value={newIOC.ioc_type}
                    onChange={e => setNewIOC(p => ({ ...p, ioc_type: e.target.value }))}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
                  >
                    {IOC_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Confidence (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newIOC.confidence}
                    onChange={e => setNewIOC(p => ({ ...p, confidence: Number(e.target.value) }))}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Value *</label>
                <input
                  type="text"
                  value={newIOC.ioc_value}
                  onChange={e => setNewIOC(p => ({ ...p, ioc_value: e.target.value }))}
                  placeholder="e.g. 192.168.1.1 or evil.example.com"
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Source</label>
                <input
                  type="text"
                  value={newIOC.source}
                  onChange={e => setNewIOC(p => ({ ...p, source: e.target.value }))}
                  placeholder="e.g. manual, otx, virustotal"
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newIOC.tags}
                  onChange={e => setNewIOC(p => ({ ...p, tags: e.target.value }))}
                  placeholder="e.g. malware, c2, phishing"
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Context (JSON or free text)</label>
                <textarea
                  value={newIOC.context}
                  onChange={e => setNewIOC(p => ({ ...p, context: e.target.value }))}
                  rows={2}
                  placeholder='{"campaign": "APT29"}'
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50 resize-none font-mono"
                />
              </div>
            </div>

            {addError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{addError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowAddModal(false); setAddError(''); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
                Cancel
              </button>
              <button
                onClick={addIOC}
                disabled={addLoading}
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium border border-blue-500/20 hover:bg-blue-500/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                {addLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Add IOC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
