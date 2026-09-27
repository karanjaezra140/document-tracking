// ============================================================
// lib/supabase/server.ts
// Creates a Supabase client bound to the current request's cookies,
// used ONLY to answer "who is logged in?" (supabase.auth.*).
// This client uses the public anon key - safe to exist here since
// RLS on every table denies it access to data anyway.
// ============================================================
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component sometimes, where
            // cookies can't be written. Safe to ignore - middleware.ts
            // refreshes the session on every request anyway.
          }
        },
      },
    }
  );
}
