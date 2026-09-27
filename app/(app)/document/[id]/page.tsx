// ============================================================
// app/(app)/document/[id]/page.tsx
// Server Component: fetches the document + timeline + signed file URL,
// passes them to the client action form.
// ============================================================
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getDocumentById, getDocumentTimeline, getAllUsersExcept, getSignedFileUrl, formatStatus } from '@/lib/documents';
import ActionForm from './ActionForm';

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const documentId = Number(id);

  const document = await getDocumentById(documentId);
  if (!document) notFound();

  const [timeline, users, fileUrl] = await Promise.all([
    getDocumentTimeline(documentId),
    getAllUsersExcept(user.id),
    document.mode === 'digital' && document.file_path ? getSignedFileUrl(document.file_path) : null,
  ]);

  const canAct = document.current_holder === user.id;

  return (
    <>
      <h1>{document.title}</h1>
      <p>
        <b>{document.tracking_code}</b>
        <span className={`tag ${document.mode}`}>{document.mode[0].toUpperCase() + document.mode.slice(1)}</span>
        <span className="tag status">{formatStatus(document.status)}</span>
      </p>
      {document.description && <p className="hint">{document.description}</p>}

      {fileUrl && (
        <p><a href={fileUrl} target="_blank" rel="noreferrer">View / Download attached file</a></p>
      )}

      {canAct ? (
        <ActionForm documentId={document.id} users={users} />
      ) : (
        <p className="hint">This document is currently with {document.current_holder_name}, so you cannot act on it.</p>
      )}

      <h2>History</h2>
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
  );
}
