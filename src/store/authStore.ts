import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  currentUser: User | null;
  session: Session | null;
  isLoading: boolean;
  hasInitialized: boolean;
  error: string | null;
  isUiLocked: boolean;
  setUiLocked: (locked: boolean) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackError: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(fallbackError)), ms))
  ]);
};

let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  session: null,
  isLoading: true,
  hasInitialized: false,
  error: null,
  isUiLocked: false,
  setUiLocked: (locked) => set({ isUiLocked: locked }),

  initialize: async () => {
    if (get().hasInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        if (navigator.onLine) {
          const { data: { session } } = await withTimeout(
             supabase.auth.getSession(), 
             3000, 
             "Session check timed out"
          );
          if (session && session.user) {
            const user = session.user;
            set({ 
              session,
              currentUser: {
                id: user.id,
                email: user.email || '',
                name: user.user_metadata?.name || user.email || 'Unknown User',
                role: user.user_metadata?.role || 'GUEST',
                initials: (user.user_metadata?.name || user.email || '??').substring(0, 2).toUpperCase(),
              },
              hasInitialized: true,
              isLoading: false 
            });
            return;
          }
        }
        set({ hasInitialized: true, isLoading: false });
      } catch (error: unknown) {
        console.warn('Auth init skipped/timed out:', error);
        set({ hasInitialized: true, isLoading: false });
      }
    })();
    return initPromise;
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      if (!navigator.onLine) {
        throw new Error("Network connection required for login.");
      }

      console.log("📡 [Auth] Attempting Live Supabase Login...");
      
      const authResponse = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }), 
        5000, 
        "Supabase connection timed out."
      );

      if (authResponse.error) {
        if (authResponse.error.message.toLowerCase().includes('credentials') || authResponse.error.message.toLowerCase().includes('invalid')) {
          throw new Error("Invalid email or password.");
        }
        throw new Error(authResponse.error.message);
      } 
      
      const session = authResponse.data.session;
      const user = authResponse.data.user;

      if (!session || !user) {
        throw new Error("Login failed to establish session.");
      }

      set({
        session,
        currentUser: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || 'Unknown User',
          role: user.user_metadata?.role || 'GUEST',
          initials: (user.user_metadata?.name || user.email || '??').substring(0, 2).toUpperCase(),
        },
        isLoading: false
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ [Auth] Final Rejection:", errorMessage);
      set({ error: errorMessage, isLoading: false });
      throw error; 
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      if (navigator.onLine) {
        await withTimeout(supabase.auth.signOut(), 2000, "Logout timeout").catch(e => console.warn(e));
      }
    } finally {
      set({ currentUser: null, session: null, isLoading: false, error: null });
    }
  }
}));
