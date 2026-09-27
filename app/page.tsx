// ============================================================
// app/page.tsx - just a traffic director, no UI of its own.
// ============================================================
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? '/dashboard' : '/login');
}
