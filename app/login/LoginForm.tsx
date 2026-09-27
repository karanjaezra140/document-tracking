'use client';
// ============================================================
// app/login/LoginForm.tsx
// Client Component so we can show a pending/error state while the
// loginAction Server Action runs.
// ============================================================
import { useActionState } from 'react';
import { loginAction } from '@/lib/actions';

export default function LoginForm() {
  const [error, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form className="auth-box" action={formAction}>
      <h1>Document Tracking System</h1>
      {error && <p className="error">{error}</p>}
      <label>
        Email
        <input type="email" name="email" required autoFocus />
      </label>
      <label>
        Password
        <input type="password" name="password" required />
      </label>
      <button type="submit" className="btn primary" disabled={isPending}>
        {isPending ? 'Logging in...' : 'Log In'}
      </button>
      <p className="hint">Demo accounts: admin@example.com / staff@example.com, password: password123</p>
    </form>
  );
}
