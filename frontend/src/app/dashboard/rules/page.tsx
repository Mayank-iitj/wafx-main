'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Crosshair, Plus, Filter, X, Shield, ToggleLeft, ToggleRight,
  Target, Eye, Code, RefreshCw
} from 'lucide-react';

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [newYaml, setNewYaml] = useState(`title: New Detection Rule
description: Describe what this rule detects
severity: medium
detection:
  condition: selection
  selection:
    field: value
`);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRules();
  }, [page]);

  async function loadRules() {
    setLoading(true);
    try {
      const params: any = { page, page_size: 50 };
      const data = await api.getRules(params);
      setRules(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRule(ruleId: string) {
    setToggling(ruleId);
    try {
      await api.toggleRule(ruleId);
      loadRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    } finally {
      setToggling(null);
    }
  }

  async function createRule() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.createRule({
        name: newName,
        severity: newSeverity,
        yaml_content: newYaml,
      });
      setShowCreate(false);
      setNewName('');
      setNewYaml('');
      loadRules();
    } catch (err) {
      console.error('Failed to create rule:', err);
    } finally {
      setCreating(false);
    }
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detection Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} rules configured</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {/* Rules Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
          </div>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Name</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Severity</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">MITRE</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Rule ID</th>
                <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Created</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition group"
                >
                  <td className="p-3">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      disabled={toggling === rule.id}
                      className="transition hover:opacity-80"
                      title={rule.active ? 'Active — click to disable' : 'Inactive — click to enable'}
                    >
                      {toggling === rule.id ? (
                        <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
                      ) : rule.active !== false ? (
                        <ToggleRight className="w-6 h-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-foreground">{rule.name}</span>
                    {rule.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">{rule.description}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`severity-${rule.severity} px-2 py-0.5 rounded text-xs font-medium capitalize`}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    {rule.mitre_technique ? (
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        {rule.mitre_technique}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <code className="text-xs text-muted-foreground font-mono">{rule.rule_id || rule.id?.slice(0, 8)}</code>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(rule.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => {
                        // Show YAML in a simple alert for now
                        if (rule.yaml_content) {
                          alert(rule.yaml_content);
                        }
                      }}
                      className="p-1 rounded hover:bg-muted transition"
                      title="View YAML"
                    >
                      <Code className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                    No detection rules found
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
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Create Detection Rule</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-muted transition">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="rule-name" className="block text-sm text-muted-foreground mb-1">Rule Name *</label>
                <input
                  id="rule-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Brute Force Login Detection"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label htmlFor="rule-severity" className="block text-sm text-muted-foreground mb-1">Severity</label>
                <select
                  id="rule-severity"
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
                <label htmlFor="rule-yaml" className="block text-sm text-muted-foreground mb-1">YAML Content</label>
                <textarea
                  id="rule-yaml"
                  value={newYaml}
                  onChange={(e) => setNewYaml(e.target.value)}
                  rows={10}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <button
                onClick={createRule}
                disabled={creating || !newName.trim()}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {creating ? 'Creating...' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
