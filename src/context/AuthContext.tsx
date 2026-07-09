import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  extractUserProfile,
  getCurrentSession,
  isAdminUser,
  signIn,
  signOut,
  subscribeToAuthChanges,
  updateAdminProfile,
  type AuthUserProfile,
} from '../services/auth.service';

interface AuthContextValue {
  session: Session | null;
  profile: AuthUserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (values: { email: string; login: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getCurrentSession()
      .then(async (currentSession) => {
        if (!active) {
          return;
        }

        if (currentSession && !isAdminUser(currentSession.user)) {
          await signOut();
          setSession(null);
          return;
        }

        setSession(currentSession);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    const subscription = subscribeToAuthChanges((nextSession) => {
      if (nextSession && !isAdminUser(nextSession.user)) {
        void signOut();
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const { session: nextSession } = await signIn(email, password);
    setSession(nextSession);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setSession(null);
  }, []);

  const handleUpdateProfile = useCallback(
    async (values: { email: string; login: string; password?: string }) => {
    const user = await updateAdminProfile(values);
    setSession((current) => (current ? { ...current, user } : current));
  }, []);

  const profile = useMemo(() => extractUserProfile(session?.user ?? null), [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      signIn: handleSignIn,
      signOut: handleSignOut,
      updateProfile: handleUpdateProfile,
    }),
    [session, profile, loading, handleSignIn, handleSignOut, handleUpdateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
