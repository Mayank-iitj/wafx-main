'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  AlertTriangle, Shield, Activity, FileWarning,
  TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#6b7280',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
      </div>
    );
  }

  const severityData = Object.entries(stats?.alerts_by_severity || {}).map(([name, value]) => ({
    name,
    value: value as number,
    fill: SEVERITY_COLORS[name] || '#6b7280',
  }));

  const mitreData = (stats?.top_mitre_techniques || []).map((t: any) => ({
    name: t.technique,
    count: t.count,
  }));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Security Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time security posture overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Alerts"
          value={stats?.total_alerts || 0}
          icon={AlertTriangle}
          iconColor="text-orange-400"
          bgColor="bg-orange-500/10"
          borderColor="border-orange-500/20"
        />
        <StatCard
          title="Critical Alerts"
          value={stats?.critical_alerts || 0}
          icon={Shield}
          iconColor="text-red-400"
          bgColor="bg-red-500/10"
          borderColor="border-red-500/20"
          pulse={stats?.critical_alerts > 0}
        />
        <StatCard
          title="Open Incidents"
          value={stats?.open_incidents || 0}
          icon={FileWarning}
          iconColor="text-blue-400"
          bgColor="bg-blue-500/10"
          borderColor="border-blue-500/20"
        />
        <StatCard
          title="Events (24h)"
          value={stats?.events_24h || 0}
          icon={Activity}
          iconColor="text-green-400"
          bgColor="bg-green-500/10"
          borderColor="border-green-500/20"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts by Severity */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Alerts by Severity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 8%)',
                    border: '1px solid hsl(217, 33%, 17%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 96%)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {severityData.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                <span className="text-muted-foreground capitalize">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MITRE ATT&CK Techniques */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top MITRE ATT&CK Techniques</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mitreData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 8%)',
                    border: '1px solid hsl(217, 33%, 17%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 96%)',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Alerts</h3>
          <a href="/dashboard/alerts" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="space-y-2">
          {(stats?.recent_alerts || []).slice(0, 8).map((alert: any) => (
            <a
              key={alert.id}
              href={`/dashboard/alerts/${alert.id}`}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition group"
            >
              <span className={`severity-${alert.severity} px-2 py-0.5 rounded text-xs font-medium capitalize`}>
                {alert.severity}
              </span>
              <span className="text-sm text-foreground flex-1 truncate group-hover:text-blue-400 transition">
                {alert.title}
              </span>
              {alert.mitre_technique && (
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                  {alert.mitre_technique}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(alert.created_at).toLocaleTimeString()}
              </span>
            </a>
          ))}
          {(!stats?.recent_alerts || stats.recent_alerts.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">No alerts yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon: Icon, iconColor, bgColor, borderColor, pulse
}: {
  title: string;
  value: number;
  icon: any;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  pulse?: boolean;
}) {
  return (
    <div className={`glass-card p-5 ${pulse ? 'animate-pulse-glow' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgColor} border ${borderColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
