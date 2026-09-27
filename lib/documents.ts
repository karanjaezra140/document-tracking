// ============================================================
// lib/documents.ts
// All document/log queries, grouped by purpose. Every function here
// uses supabaseAdmin, so it only ever runs on the server.
// ============================================================
import 'server-only';
import { supabaseAdmin } from './supabase/admin';

export type Document = {
  id: number;
  tracking_code: string;
  title: string;
  doc_type: string;
  description: string | null;
  mode: 'physical' | 'digital';
  file_path: string | null;
  submitted_by: string;
  current_holder: string;
  status: string;
  created_at: string;
};

export type DocumentWithNames = Document & {
  submitted_by_name: string;
  current_holder_name: string;
};

export type TimelineStep = {
  id: number;
  action: string;
  remarks: string | null;
  created_at: string;
  from_name: string | null;
  to_name: string | null;
};

// ---------- Registration ----------

// Inserts a new document and writes the first ("Submitted") log entry.
// fileePath should be null for physical documents.
export async function registerDocument(input: {
  title: string;
  docType: string;
  description: string;
  mode: 'physical' | 'digital';
  filePath: string | null;
  submittedBy: string;
  sendTo: string;
}): Promise<string> {
  // The Postgres function guarantees a unique code even under concurrent inserts.
  const { data: codeData, error: codeError } = await supabaseAdmin.rpc('generate_tracking_code');
  if (codeError || !codeData) throw new Error('Could not generate a tracking code.');
  const trackingCode: string = codeData;

  const { data: doc, error } = await supabaseAdmin
    .from('documents')
    .insert({
      tracking_code: trackingCode,
      title: input.title,
      doc_type: input.docType,
      description: input.description,
      mode: input.mode,
      file_path: input.filePath,
      submitted_by: input.submittedBy,
      current_holder: input.sendTo,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (error || !doc) throw new Error('Could not register the document.');

  await logDocumentAction(doc.id, input.submittedBy, input.sendTo, 'Submitted', 'Document registered in the system.');

  return trackingCode;
}

// ---------- Lookups ----------

async function attachNames(doc: Document): Promise<DocumentWithNames> {
  const { data: names } = await supabaseAdmin
    .from('profiles')
    .select('id, name')
    .in('id', [doc.submitted_by, doc.current_holder]);

  const nameFor = (id: string) => names?.find((n) => n.id === id)?.name ?? 'Unknown';

  return {
    ...doc,
    submitted_by_name: nameFor(doc.submitted_by),
    current_holder_name: nameFor(doc.current_holder),
  };
}

export async function getDocumentByCode(trackingCode: string): Promise<DocumentWithNames | null> {
  const { data } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('tracking_code', trackingCode)
    .single();

  return data ? attachNames(data) : null;
}

export async function getDocumentById(id: number): Promise<DocumentWithNames | null> {
  const { data } = await supabaseAdmin.from('documents').select('*').eq('id', id).single();
  return data ? attachNames(data) : null;
}

// Every document currently sitting with the given user, most recent first.
export async function getDocumentsForUser(userId: string): Promise<Document[]> {
  const { data } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('current_holder', userId)
    .order('created_at', { ascending: false });

  return data ?? [];
}

// Counts for the dashboard's summary cards.
export async function getDashboardCounts(userId: string) {
  const { data } = await supabaseAdmin.from('documents').select('status').eq('current_holder', userId);

  const rows = data ?? [];
  const pending = rows.filter((r) => ['submitted', 'in_transit'].includes(r.status)).length;
  const inReview = rows.filter((r) => r.status === 'under_review').length;
  const completed = rows.filter((r) => ['approved', 'rejected', 'archived'].includes(r.status)).length;

  return { pending, inReview, completed };
}

export async function getAllUsersExcept(userId: string) {
  const { data } = await supabaseAdmin.from('profiles').select('id, name').neq('id', userId).order('name');
  return data ?? [];
}

// ---------- Actions (approve / reject / forward / return) ----------

// Moves a document to a new holder/status and writes a log entry.
// One function backs all four buttons - only the arguments differ.
export async function updateDocumentStatus(input: {
  documentId: number;
  fromUser: string;
  toUser: string;
  newStatus: string;
  action: string;
  remarks: string;
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from('documents')
    .update({ current_holder: input.toUser, status: input.newStatus })
    .eq('id', input.documentId);

  if (error) throw new Error('Could not update the document.');

  await logDocumentAction(input.documentId, input.fromUser, input.toUser, input.action, input.remarks);
}

// ---------- Logging (the audit trail) ----------

// Appends one row to document_logs. Never update or delete existing rows.
export async function logDocumentAction(
  documentId: number,
  fromUser: string | null,
  toUser: string | null,
  action: string,
  remarks = ''
): Promise<void> {
  await supabaseAdmin.from('document_logs').insert({
    document_id: documentId,
    from_user: fromUser,
    to_user: toUser,
    action,
    remarks,
  });
}

// Full timeline for one document, oldest first, with names filled in.
export async function getDocumentTimeline(documentId: number): Promise<TimelineStep[]> {
  const { data: logs } = await supabaseAdmin
    .from('document_logs')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });

  if (!logs) return [];

  const userIds = [...new Set(logs.flatMap((l) => [l.from_user, l.to_user]).filter(Boolean))];
  const { data: names } = await supabaseAdmin.from('profiles').select('id, name').in('id', userIds);
  const nameFor = (id: string | null) => (id ? names?.find((n) => n.id === id)?.name ?? null : null);

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    remarks: l.remarks,
    created_at: l.created_at,
    from_name: nameFor(l.from_user),
    to_name: nameFor(l.to_user),
  }));
}

// ---------- File uploads (Supabase Storage) ----------

const BUCKET = 'documents-files';

export async function uploadDocumentFile(file: File): Promise<string> {
  const safeName = `${Date.now()}_${file.name}`;
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(safeName, file);
  if (error) throw new Error('File upload failed.');
  return safeName; // stored in documents.file_path
}

// The bucket is private, so viewing a file needs a short-lived signed URL.
export async function getSignedFileUrl(filePath: string): Promise<string | null> {
  const { data } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(filePath, 60 * 60);
  return data?.signedUrl ?? null;
}

// ---------- Small display helper ----------

export function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}
