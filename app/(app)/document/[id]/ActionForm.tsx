'use client';
// ============================================================
// app/(app)/document/[id]/ActionForm.tsx
// One form, four submit buttons - each sets a different `action`
// value, all handled by the same documentActionAction on the server.
// ============================================================
import { useActionState } from 'react';
import { documentActionAction } from '@/lib/actions';

type User = { id: string; name: string };

export default function ActionForm({ documentId, users }: { documentId: number; users: User[] }) {
  const [result, formAction, isPending] = useActionState(documentActionAction, null);

  return (
    <>
      {result?.error && <p className="error">{result.error}</p>}
      <form action={formAction} className="form-box">
        <input type="hidden" name="document_id" value={documentId} />

        <label>
          Remarks (optional)
          <textarea name="remarks" rows={2} />
        </label>

        <label>
          Forward / return to
          <select name="forward_to" defaultValue="">
            <option value="">-- Select user --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>

        <div className="actions-row">
          <button type="submit" name="action" value="approve" className="btn primary" disabled={isPending}>Approve</button>
          <button type="submit" name="action" value="reject" className="btn" disabled={isPending}>Reject</button>
          <button type="submit" name="action" value="forward" className="btn" disabled={isPending}>Forward</button>
          <button type="submit" name="action" value="return" className="btn" disabled={isPending}>Return to Sender</button>
        </div>
      </form>
    </>
  );
}
