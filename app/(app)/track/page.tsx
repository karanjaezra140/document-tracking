// ============================================================
// app/(app)/track/page.tsx
// Plain GET form + Server Component - no client JS needed at all,
// the tracking code just becomes a ?code= query param.
// ============================================================
import { requireUser } from '@/lib/auth';
import { getDocumentByCode, getDocumentTimeline, formatStatus } from '@/lib/documents';

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await requireUser();
  const { code = '' } = await searchParams;

  const document = code ? await getDocumentByCode(code) : null;
  const timeline = document ? await getDocumentTimeline(document.id) : [];

  return (
    <>
      <h1>Track a Document</h1>

      <form method="get" className="form-box inline">
        <label>
          Tracking code
          <input type="text" name="code" defaultValue={code} placeholder="e.g. DOC-2026-0001" required />
        </label>
        <button type="submit" className="btn primary">Search</button>
      </form>

      {code && !document && <p className="error">No document found with that tracking code.</p>}

      {document && (
        <>
          <div className="doc-summary">
            <b>{document.tracking_code}</b> - {document.title}
            <span className={`tag ${document.mode}`}>{document.mode[0].toUpperCase() + document.mode.slice(1)}</span>
            <span className="tag status">{formatStatus(document.status)}</span>
            <p className="hint">Currently with: {document.current_holder_name}</p>
          </div>

          <div className="timeline">
            {timeline.map((step) => (
              <div className="step" key={step.id}>
                <b>{step.action}</b>
                <div>
                  {step.from_name ?? 'System'}
                  {step.to_name && <> &rarr; {step.to_name}</>}
                  {' '}&middot;{' '}
                  {new Date(step.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </div>
                {step.remarks && <div className="remarks">{step.remarks}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
