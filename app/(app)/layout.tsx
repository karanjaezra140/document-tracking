// ============================================================
// app/(app)/layout.tsx
// Wraps every authenticated page: enforces login and renders the
// shared top navigation. The (app) folder is a route group, so it
// doesn't add a segment to the URL (still /dashboard, not /app/dashboard).
// ============================================================
import { requireUser } from '@/lib/auth';
import { logoutAction } from '@/lib/actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <>
      <header className="topbar">
        <a href="/dashboard" className="brand">Document Tracking System</a>
        <nav className="topnav">
          <a href="/dashboard">Dashboard</a>
          <a href="/register">Register Document</a>
          <a href="/track">Track</a>
          <span className="who">{user.name} ({user.role})</span>
          <form action={logoutAction}>
            <button type="submit" className="linklike">Log Out</button>
          </form>
        </nav>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
