import { create } from 'zustand';
import type { User, DashboardStats, Transfer } from '@/types';

interface AppState {
  user: User | null;
  isLoading: boolean;
  theme: 'light' | 'dark';
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isLoading: true,
  theme: 'dark',
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('theme', theme);
        document.body.setAttribute('data-theme', theme);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  },
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('theme', newTheme);
        document.body.setAttribute('data-theme', newTheme);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  },
}));

interface TransferState {
  transfers: Transfer[];
  setTransfers: (transfers: Transfer[]) => void;
  addTransfer: (transfer: Transfer) => void;
  removeTransfer: (id: string) => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  transfers: [],
  setTransfers: (transfers) => set({ transfers }),
  addTransfer: (transfer) =>
    set((state) => ({ transfers: [transfer, ...state.transfers] })),
  removeTransfer: (id) =>
    set((state) => ({
      transfers: state.transfers.filter((t) => t.id !== id),
    })),
}));

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
