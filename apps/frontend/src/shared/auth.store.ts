import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  role: 'USER' | 'PARTNER' | 'ADMIN';
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const stored = localStorage.getItem('authUser');

export const useAuthStore = create<AuthState>((set, get) => ({
  user: stored ? (JSON.parse(stored) as AuthUser) : null,
  accessToken: localStorage.getItem('accessToken'),

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken });
  },

  logout: () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null });
  },

  isAuthenticated: () => !!get().accessToken,
}));
