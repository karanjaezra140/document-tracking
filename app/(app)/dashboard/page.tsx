// ============================================================
// app/(app)/dashboard/page.tsx
// A Server Component: gathers data server-side, no client JS needed.
// ============================================================
import { requireUser } from '@/lib/auth';
import { getDashboardCounts, getDocumentsForUser, formatStatus } from '@/lib/documents';

export default async function DashboardPage() {
  const user = await requireUser();
  const [counts, documents] = await Promise.all([
    getDashboardCounts(user.id),
    getDocumentsForUser(user.id),
  ]);

  return (
    <>
      <h1>Dashboard</h1>

      <div className="stat-row">
        <div className="stat-card"><b>{counts.pending}</b><span>Pending</span></div>
        <div className="stat-card"><b>{counts.inReview}</b><span>In Review</span></div>
        <div className="stat-card"><b>{counts.completed}</b><span>Completed</span></div>
      </div>

      <div className="actions-row">
        <a className="btn primary" href="/register">+ Register Document</a>
        <a className="btn" href="/track">Track a Document</a>
      </div>

      <h2>Documents currently with you</h2>
      {documents.length === 0 ? (
        <p className="hint">Nothing is currently assigned to you.</p>
      ) : (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Tracking Code</th>
              <th>Title</th>
              <th>Mode</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.tracking_code}</td>
                <td>{doc.title}</td>
                <td><span className={`tag ${doc.mode}`}>{doc.mode[0].toUpperCase() + doc.mode.slice(1)}</span></td>
                <td>{formatStatus(doc.status)}</td>
                <td><a href={`/document/${doc.id}`}>View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
