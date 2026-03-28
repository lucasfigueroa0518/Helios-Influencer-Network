import { create } from 'zustand';
import type { Tables } from '@/lib/supabase/types';

interface AuthState {
  session: { user: { id: string; email: string } } | null;
  profile: Tables<'profiles'> | null;
  isLoading: boolean;
  setSession: (session: AuthState['session']) => void;
  setProfile: (profile: Tables<'profiles'> | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ session: null, profile: null, isLoading: false }),
}));
