/** Global auth store — Zustand */

import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  org_id: string;
  mfa_enabled: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, orgName: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    await api.login(email, password);
    const user = await api.getMe();
    set({ user, isAuthenticated: true, isLoading: false });
  },

  register: async (email: string, password: string, fullName: string, orgName: string) => {
    await api.register(email, password, fullName, orgName);
    const user = await api.getMe();
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    api.logout();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchUser: async () => {
    try {
      const token = localStorage.getItem('wafx_access_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
