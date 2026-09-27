// ============================================================
// scripts/seed.mjs
// Creates two demo accounts (admin + staff) directly in Supabase Auth,
// then adds their matching row in `profiles`.
//
// Run once, after applying supabase/schema.sql:
//   node scripts/seed.mjs
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment
// (the same values as in .env.local).
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local manually so this script works with a plain `node` run.
function loadEnvLocal() {
  try {
    const content = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) process.env[match[1]] = match[2].trim();
    }
  } catch {
    // .env.local not found - assume vars are already set in the shell
  }
}
loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// One department must already exist (schema.sql seeds three) for this to work.
async function getDepartmentId(name) {
  const { data } = await supabase.from('departments').select('id').eq('name', name).single();
  return data?.id ?? null;
}

async function createDemoUser(email, password, name, role, departmentName) {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification for a local demo account
  });

  if (error) {
    console.error(`Could not create ${email}:`, error.message);
    return;
  }

  const department_id = await getDepartmentId(departmentName);

  const { error: profileError } = await supabase.from('profiles').insert({
    id: created.user.id,
    name,
    role,
    department_id,
  });

  if (profileError) {
    console.error(`Could not create profile for ${email}:`, profileError.message);
    return;
  }

  console.log(`Created ${role} account: ${email} / ${password}`);
}

await createDemoUser('admin@example.com', 'password123', 'Admin User', 'admin', 'Registrar');
await createDemoUser('staff@example.com', 'password123', 'Ezra Staff', 'staff', 'Finance');

console.log('Done.');
