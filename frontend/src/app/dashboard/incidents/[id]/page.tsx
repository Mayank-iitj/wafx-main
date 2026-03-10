'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ArrowLeft, FileWarning, Clock, User, AlertTriangle, Shield,
  MessageSquare, ChevronDown, RefreshCw, Plus, Tag, Paperclip,
  Activity, Send
} from 'lucide-react';

const STATUSES = ['open', 'investigating', 'contained', 'resolved', 'closed'];

export default function IncidentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'alerts' | 'notes' | 'evidence'>('timeline');

  useEffect(() => {
    loadIncident();
  }, [id]);

  async function loadIncident() {
    setLoading(true);
    try {
      const data = await api.getIncident(id as string);
      setIncident(data);
    } catch (err) {
      console.error('Failed to load incident:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      const updated = await api.updateIncident(id as string, { status: newStatus });
      setIncident(updated);
      setStatusDropdown(false);
    } catch (err) {
      console.error('Failed to update incident:', err);
    } finally {
      setUpdating(false);
    }
  }

  async function addNote() {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      await api.addIncidentNote(id as string, noteContent);
      setNoteContent('');
      loadIncident();
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-16">
        <FileWarning className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Incident not found</p>
        <Link href="/dashboard/incidents" className="text-blue-400 text-sm hover:underline mt-2 inline-block">
          ← Back to incidents
        </Link>
      </div>
    );
  }

  const timeline = incident.timeline || [];
  const alertIds = incident.alert_ids || [];
  const notes = incident.notes || [];
  const evidence = incident.evidence || [];
  const tags = incident.tags || [];

  const tabs = [
    { key: 'timeline', label: 'Timeline', count: timeline.length },
    { key: 'alerts', label: 'Linked Alerts', count: alertIds.length },
    { key: 'notes', label: 'Notes', count: notes.length },
    { key: 'evidence', label: 'Evidence', count: evidence.length },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/incidents" className="p-2 rounded-lg hover:bg-muted transition">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/incidents" className="hover:text-foreground transition">Incidents</Link>
          <span>/</span>
          <span className="text-foreground">{incident.id?.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`severity-${incident.severity} px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider`}>
                {incident.severity}
              </span>
              <h1 className="text-xl font-bold text-foreground">{incident.title}</h1>
            </div>
            {incident.description && (
              <p className="text-sm text-muted-foreground max-w-3xl">{incident.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(incident.created_at).toLocaleString()}
              </span>
              {incident.assigned_to && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {incident.assigned_to}
                </span>
              )}
              {incident.lead_analyst && (
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Lead: {incident.lead_analyst}
                </span>
              )}
            </div>
            {tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Tag className="w-3 h-3 text-muted-foreground" />
                {tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusDropdown(!statusDropdown)}
              className={`status-${incident.status} px-4 py-2 rounded-lg text-sm font-medium capitalize flex items-center gap-2 hover:opacity-80 transition`}
              disabled={updating}
            >
              {updating && <RefreshCw className="w-3 h-3 animate-spin" />}
              {incident.status?.replace('_', ' ')}
              <ChevronDown className="w-3 h-3" />
            </button>
            {statusDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 py-1 min-w-[160px]">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`w-full px-4 py-2 text-left text-sm capitalize hover:bg-muted transition ${
                      s === incident.status ? 'text-blue-400 font-medium' : 'text-foreground'
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

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-[1px] ${
              activeTab === tab.key
                ? 'text-blue-400 border-blue-400'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-card p-6">
        {/* Timeline */}
        {activeTab === 'timeline' && (
          <div>
            {timeline.length > 0 ? (
              <div className="space-y-4">
                {timeline.map((event: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-500/30 flex-shrink-0 mt-1" />
                      {i < timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-border min-h-[24px]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm text-foreground">{event.description || event.action || event.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                        {event.user && ` · ${event.user}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No timeline events yet</p>
            )}
          </div>
        )}

        {/* Linked Alerts */}
        {activeTab === 'alerts' && (
          <div>
            {alertIds.length > 0 ? (
              <div className="space-y-2">
                {alertIds.map((alertId: string, i: number) => (
                  <Link
                    key={i}
                    href={`/dashboard/alerts/${alertId}`}
                    className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3 hover:bg-muted/50 transition group"
                  >
                    <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <code className="text-sm text-foreground font-mono flex-1 group-hover:text-blue-400 transition">{alertId}</code>
                    <span className="text-xs text-muted-foreground">View →</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No linked alerts</p>
            )}
          </div>
        )}

        {/* Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {/* Add Note */}
            <div className="flex gap-3">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={2}
                placeholder="Add an investigation note..."
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <button
                onClick={addNote}
                disabled={addingNote || !noteContent.trim()}
                className="px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition self-end"
              >
                {addingNote ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {/* Note List */}
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note: any, i: number) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content || note}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      {note.author && <span className="flex items-center gap-1"><User className="w-3 h-3" />{note.author}</span>}
                      {note.created_at && <span>{new Date(note.created_at).toLocaleString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
            )}
          </div>
        )}

        {/* Evidence */}
        {activeTab === 'evidence' && (
          <div>
            {evidence.length > 0 ? (
              <div className="space-y-2">
                {evidence.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
                    <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.name || item.filename || item}</p>
                      {item.type && <p className="text-xs text-muted-foreground">{item.type}</p>}
                    </div>
                    {item.size && (
                      <span className="text-xs text-muted-foreground">{item.size}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No evidence attached</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
