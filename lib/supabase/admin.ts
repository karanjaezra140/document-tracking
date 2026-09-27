// ============================================================
// lib/supabase/admin.ts
// The service-role client. This is where ALL document/profile data
// access happens - it bypasses Row Level Security entirely.
//
// SUPABASE_SERVICE_ROLE_KEY must NEVER be exposed to the browser
// (no NEXT_PUBLIC_ prefix, never imported into a Client Component).
// Every file that imports this one must only ever run on the server:
// Server Components, Server Actions, or Route Handlers.
// ============================================================
import 'server-only';
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);
