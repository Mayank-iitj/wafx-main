import { create } from 'zustand'

interface UIState {
  theme: 'dark' | 'light'
  sidebarCollapsed: boolean
  activeJob: string | null
  toggleTheme: () => void
  toggleSidebar: () => void
  setActiveJob: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  sidebarCollapsed: false,
  activeJob: null,

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      const root = document.documentElement
      if (newTheme === 'light') {
        root.classList.remove('dark')
        root.classList.add('light')
      } else {
        root.classList.remove('light')
        root.classList.add('dark')
      }
      return { theme: newTheme }
    }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setActiveJob: (id) => set({ activeJob: id }),
}))
