'use client';
// ============================================================
// app/(app)/register/RegisterForm.tsx
// Client Component: needs local state for the mode toggle
// (show/hide the file field) and for showing the result after submit.
// ============================================================
import { useActionState, useState } from 'react';
import { registerDocumentAction } from '@/lib/actions';

type User = { id: string; name: string };

export default function RegisterForm({ users }: { users: User[] }) {
  const [result, formAction, isPending] = useActionState(registerDocumentAction, null);
  const [mode, setMode] = useState<'physical' | 'digital'>('physical');

  return (
    <>
      {result?.trackingCode && (
        <p className="success">
          Document registered. Tracking code: <b>{result.trackingCode}</b>
        </p>
      )}
      {result?.error && <p className="error">{result.error}</p>}

      <form action={formAction} className="form-box" encType="multipart/form-data">
        <label>
          Mode
          <select name="mode" value={mode} onChange={(e) => setMode(e.target.value as 'physical' | 'digital')}>
            <option value="physical">Physical</option>
            <option value="digital">Digital</option>
          </select>
        </label>

        <label>
          Document title
          <input type="text" name="title" required />
        </label>

        <label>
          Document type
          <input type="text" name="doc_type" placeholder="e.g. Memo, Contract, Leave Request" required />
        </label>

        <label>
          Description / remarks
          <textarea name="description" rows={3} />
        </label>

        {mode === 'digital' && (
          <label>
            Upload file
            <input type="file" name="document_file" />
          </label>
        )}

        <label>
          Send to
          <select name="send_to" required defaultValue="">
            <option value="" disabled>-- Select recipient --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>

        <button type="submit" className="btn primary" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Generate Tracking Code & Submit'}
        </button>
      </form>
    </>
  );
}
