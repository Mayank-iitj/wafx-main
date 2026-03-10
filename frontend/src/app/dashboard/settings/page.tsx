'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Settings, User, Key, Shield, RefreshCw, CheckCircle, Globe } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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

export default function SettingsPage() {
  const { user, fetchUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    if (user) setFullName(user.full_name || '');
  }, [user]);

  async function saveProfile() {
    setError('');
    setSaving(true);
    setSaved(false);
    try {
      const r = await authFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: fullName }),
      });
      if (!r.ok) throw new Error(await r.text());
      await fetchUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setPwMsg('');
    if (!pwForm.current || !pwForm.newPw) { setPwMsg('All fields are required'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg('Passwords do not match'); return; }
    if (pwForm.newPw.length < 8) { setPwMsg('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      const r = await authFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      if (!r.ok) throw new Error(await r.text());
      setPwForm({ current: '', newPw: '', confirm: '' });
      setPwMsg('✓ Password changed successfully');
    } catch (e: any) {
      setPwMsg(e.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" /> Profile
        </h2>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20 capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-border">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Email</label>
            <input
              type="text"
              value={user?.email || ''}
              disabled
              className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium border border-blue-500/20 hover:bg-blue-500/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
            Save Changes
          </button>
          {saved && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" /> Security
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Current Password</label>
            <input
              type="password"
              value={pwForm.current}
              onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">New Password</label>
              <input
                type="password"
                value={pwForm.newPw}
                onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Confirm Password</label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-green-500/50"
              />
            </div>
          </div>
        </div>

        {pwMsg && (
          <p className={`text-xs ${pwMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
            {pwMsg}
          </p>
        )}

        <button
          onClick={changePassword}
          disabled={pwLoading}
          className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/20 hover:bg-green-500/30 transition flex items-center gap-2 disabled:opacity-50"
        >
          {pwLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
          Change Password
        </button>
      </div>

      {/* Org Info */}
      <div className="glass-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" /> Platform
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">User ID</span>
            <code className="text-xs text-foreground font-mono">{user?.id}</code>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Org ID</span>
            <code className="text-xs text-foreground font-mono">{user?.org_id}</code>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">MFA</span>
            <span className={user?.mfa_enabled ? 'text-green-400 text-xs' : 'text-muted-foreground text-xs'}>
              {user?.mfa_enabled ? '✓ Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">API Base</span>
            <code className="text-xs text-foreground font-mono truncate max-w-[200px]">
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
