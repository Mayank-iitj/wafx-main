'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ArrowLeft, AlertTriangle, Shield, Clock, User, Globe, Server,
  Hash, Brain, Activity, Link2, RefreshCw, ChevronDown, Sparkles,
  ExternalLink, Target, Cpu, FileText
} from 'lucide-react';

const STATUSES = ['new', 'in_progress', 'resolved', 'false_positive', 'closed'];

export default function AlertDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAlert();
  }, [id]);

  async function loadAlert() {
    setLoading(true);
    try {
      const data = await api.getAlert(id as string);
      setAlert(data);
    } catch (err) {
      console.error('Failed to load alert:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      const updated = await api.updateAlert(id as string, { status: newStatus });
      setAlert(updated);
      setStatusDropdown(false);
    } catch (err) {
      console.error('Failed to update alert:', err);
    } finally {
      setUpdating(false);
    }
  }

  async function runAiAnalysis() {
    setAiLoading(true);
    try {
      const result = await api.analyzeAlert(id as string);
      setAiAnalysis(result);
    } catch (err) {
      console.error('AI analysis failed:', err);
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Alert not found</p>
        <Link href="/dashboard/alerts" className="text-blue-400 text-sm hover:underline mt-2 inline-block">
          ← Back to alerts
        </Link>
      </div>
    );
  }

  const entities = alert.entities || {};
  const enrichment = alert.enrichment || {};

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/alerts"
          className="p-2 rounded-lg hover:bg-muted transition"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/alerts" className="hover:text-foreground transition">Alerts</Link>
          <span>/</span>
          <span className="text-foreground">{alert.id?.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`severity-${alert.severity} px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider`}>
                {alert.severity}
              </span>
              <h1 className="text-xl font-bold text-foreground">{alert.title}</h1>
            </div>
            {alert.description && (
              <p className="text-sm text-muted-foreground max-w-3xl">{alert.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(alert.created_at).toLocaleString()}
              </span>
              {alert.source && (
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3" />
                  {alert.source}
                </span>
              )}
              {alert.rule_id && (
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Rule: {alert.rule_id.slice(0, 8)}
                </span>
              )}
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusDropdown(!statusDropdown)}
              className={`status-${alert.status} px-4 py-2 rounded-lg text-sm font-medium capitalize flex items-center gap-2 hover:opacity-80 transition`}
              disabled={updating}
            >
              {updating ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : null}
              {alert.status?.replace('_', ' ')}
              <ChevronDown className="w-3 h-3" />
            </button>
            {statusDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 py-1 min-w-[160px]">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`w-full px-4 py-2 text-left text-sm capitalize hover:bg-muted transition ${
                      s === alert.status ? 'text-blue-400 font-medium' : 'text-foreground'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* MITRE ATT&CK */}
          {alert.mitre_technique && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-cyan-400" />
                MITRE ATT&CK Mapping
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                  {alert.mitre_technique}
                </span>
                {alert.mitre_tactic && (
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                    Tactic: {alert.mitre_tactic}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Analysis
              </h3>
              <button
                onClick={runAiAnalysis}
                disabled={aiLoading}
                className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition flex items-center gap-2 border border-purple-500/20"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
            {aiAnalysis ? (
              <div className="space-y-3">
                {aiAnalysis.summary && (
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-4">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiAnalysis.summary}</p>
                  </div>
                )}
                {aiAnalysis.severity_assessment && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Severity Assessment: </span>
                    <span className="text-foreground">{aiAnalysis.severity_assessment}</span>
                  </div>
                )}
                {aiAnalysis.recommended_actions && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recommended Actions</p>
                    <ul className="space-y-1">
                      {(Array.isArray(aiAnalysis.recommended_actions)
                        ? aiAnalysis.recommended_actions
                        : [aiAnalysis.recommended_actions]
                      ).map((action: string, i: number) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {typeof aiAnalysis === 'string' && (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{aiAnalysis}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click &quot;Analyze with AI&quot; to get an AI-powered investigation summary, severity assessment, and recommended actions.
              </p>
            )}
          </div>

          {/* Source Events */}
          {alert.source_event_ids && alert.source_event_ids.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-green-400" />
                Source Events ({alert.source_event_ids.length})
              </h3>
              <div className="space-y-2">
                {alert.source_event_ids.map((eventId: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-2.5">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <code className="text-xs text-cyan-400 font-mono flex-1">{eventId}</code>
                    <Link
                      href="/dashboard/search"
                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enrichment Data */}
          {Object.keys(enrichment).length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-blue-400" />
                Threat Intelligence Enrichment
              </h3>
              <div className="bg-muted/20 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                  {JSON.stringify(enrichment, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Sidebar */}
        <div className="space-y-6">
          {/* Entities */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Entities</h3>
            {Object.keys(entities).length > 0 ? (
              <div className="space-y-3">
                {entities.ips && entities.ips.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">IP Addresses</p>
                    {entities.ips.map((ip: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <Globe className="w-3 h-3 text-blue-400" />
                        <code className="text-sm text-foreground font-mono">{ip}</code>
                      </div>
                    ))}
                  </div>
                )}
                {entities.users && entities.users.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Users</p>
                    {entities.users.map((user: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <User className="w-3 h-3 text-green-400" />
                        <span className="text-sm text-foreground">{user}</span>
                      </div>
                    ))}
                  </div>
                )}
                {entities.hosts && entities.hosts.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Hosts</p>
                    {entities.hosts.map((host: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <Server className="w-3 h-3 text-orange-400" />
                        <span className="text-sm text-foreground font-mono">{host}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Generic fallback for other entity types */}
                {Object.entries(entities)
                  .filter(([k]) => !['ips', 'users', 'hosts'].includes(k))
                  .map(([key, values]) => (
                    <div key={key}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">{key}</p>
                      {(Array.isArray(values) ? values : [values]).map((v: any, i: number) => (
                        <div key={i} className="text-sm text-foreground py-0.5">{String(v)}</div>
                      ))}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No entities extracted</p>
            )}
          </div>

          {/* Linked Incident */}
          {alert.incident_id && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-orange-400" />
                Linked Incident
              </h3>
              <Link
                href={`/dashboard/incidents/${alert.incident_id}`}
                className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-3 text-sm text-orange-400 hover:bg-orange-500/20 transition"
              >
                <Cpu className="w-4 h-4" />
                <span className="font-mono">{alert.incident_id.slice(0, 8)}...</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Link>
            </div>
          )}

          {/* Alert Metadata */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Details</h3>
            <div className="space-y-2.5 text-sm">
              <DetailRow label="Alert ID" value={alert.id} mono />
              <DetailRow label="Created" value={new Date(alert.created_at).toLocaleString()} />
              {alert.updated_at && (
                <DetailRow label="Updated" value={new Date(alert.updated_at).toLocaleString()} />
              )}
              <DetailRow label="Source" value={alert.source || '—'} />
              <DetailRow label="Severity" value={alert.severity} />
              <DetailRow label="Status" value={alert.status?.replace('_', ' ')} />
              {alert.assigned_to && (
                <DetailRow label="Assigned To" value={alert.assigned_to} />
              )}
              {alert.confidence_score !== undefined && (
                <DetailRow label="Confidence" value={`${(alert.confidence_score * 100).toFixed(0)}%`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className={`text-foreground text-right truncate max-w-[200px] ${mono ? 'font-mono text-xs' : ''} capitalize`}>
        {value}
      </span>
    </div>
  );
}
