// ============================================================
// app/login/page.tsx
// Server Component: bounces already-logged-in users to the dashboard,
// otherwise renders the (client) login form.
// ============================================================
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="centered">
      <LoginForm />
    </div>
  );
}
