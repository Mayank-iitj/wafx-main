'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { wsClient } from '@/lib/ws';
import {
  Shield, LayoutDashboard, AlertTriangle, FileWarning, Search,
  Brain, Settings, Crosshair, Cpu, LogOut, Bell, ChevronRight,
  Menu, X
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/alerts', label: 'Alerts', icon: AlertTriangle },
  { href: '/dashboard/incidents', label: 'Incidents', icon: FileWarning },
  { href: '/dashboard/rules', label: 'Detection Rules', icon: Crosshair },
  { href: '/dashboard/search', label: 'Log Search', icon: Search },
  { href: '/dashboard/intelligence', label: 'Threat Intel', icon: Brain },
  { href: '/dashboard/playbooks', label: 'Playbooks', icon: Cpu },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, fetchUser, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchUser().then(() => {
      const token = localStorage.getItem('wafx_access_token');
      if (!token) router.push('/login');
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      wsClient.connect();
      wsClient.on('new_alert', (data) => {
        setNotifications((prev) => [data, ...prev.slice(0, 19)]);
      });
      return () => wsClient.disconnect();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-card border-r border-border flex flex-col flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
          <div className="p-1.5 rounded-lg bg-blue-500/20">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              WAFx
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1 rounded hover:bg-muted transition"
          >
            {sidebarOpen ? <X className="w-4 h-4 text-muted-foreground" /> : <Menu className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group
                  ${isActive
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        {sidebarOpen && user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.role}</p>
              </div>
              <button onClick={logout} className="p-1.5 rounded hover:bg-muted transition" title="Logout">
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {navItems.find((n) => pathname?.startsWith(n.href))?.label || 'Dashboard'}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                  {Math.min(notifications.length, 99)}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
