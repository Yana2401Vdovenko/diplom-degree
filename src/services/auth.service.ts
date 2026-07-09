import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';

export interface AuthUserProfile {
  id: string;
  email: string;
  role: string;
  fullName: string;
  login: string;
}

const ADMIN_ROLE = 'admin';

export function extractUserProfile(user: User | null): AuthUserProfile | null {
  if (!user) {
    return null;
  }

  const role = String(user.app_metadata?.role ?? user.user_metadata?.role ?? '');

  return {
    id: user.id,
    email: user.email ?? '',
    role,
    fullName: String(user.user_metadata?.full_name ?? user.user_metadata?.login ?? user.email ?? 'Користувач'),
    login: String(user.user_metadata?.login ?? user.email?.split('@')[0] ?? ''),
  };
}

export function isAdminUser(user: User | null): boolean {
  const profile = extractUserProfile(user);
  return profile?.role === ADMIN_ROLE;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    throw new Error('Доступ дозволено лише користувачам з роллю admin.');
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

interface UpdateAdminProfileInput {
  email: string;
  login: string;
  password?: string;
}

export async function updateAdminProfile({ email, login, password }: UpdateAdminProfileInput) {
  const { data, error } = await supabase.auth.updateUser({
    email: email.trim(),
    password: password?.trim() || undefined,
    data: {
      login: login.trim(),
      full_name: login.trim(),
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export function subscribeToAuthChanges(
  callback: (session: Session | null) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return subscription;
}
