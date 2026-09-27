// ============================================================
// lib/auth.ts
// "Who is logged in?" helpers, used at the top of every protected
// Server Component and Server Action.
// ============================================================
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';

export type CurrentUser = {
  id: string;
  name: string;
  role: 'admin' | 'staff' | 'submitter';
};

// Returns the logged-in user's id/name/role, or null if nobody is logged in.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Auth confirms *who* they are; the profile (via the admin client,
  // since RLS blocks the anon key) tells us their name and role.
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return { id: user.id, name: profile.name, role: profile.role };
}

// Call at the top of any page/action that requires a logged-in user.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}
