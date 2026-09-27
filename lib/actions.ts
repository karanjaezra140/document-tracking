'use server';
// ============================================================
// lib/actions.ts
// Server Actions: the "process the input" step for each form.
// Each one reads a FormData, validates/computes, then redirects.
// ============================================================
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from './supabase/server';
import { requireUser } from './auth';
import {
  registerDocument,
  updateDocumentStatus,
  uploadDocumentFile,
  getDocumentById,
} from './documents';

// ---------- Auth ----------

export async function loginAction(_prevState: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) return 'Please enter both email and password.';

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return 'Incorrect email or password.';

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// ---------- Register document ----------

export async function registerDocumentAction(
  _prevState: { error?: string; trackingCode?: string } | null,
  formData: FormData
): Promise<{ error?: string; trackingCode?: string }> {
  const user = await requireUser();

  const title = String(formData.get('title') || '').trim();
  const docType = String(formData.get('doc_type') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const mode = String(formData.get('mode') || '');
  const sendTo = String(formData.get('send_to') || '');
  const file = formData.get('document_file') as File | null;

  if (!title || !docType || !mode || !sendTo) {
    return { error: 'Please fill in the title, type, mode, and recipient.' };
  }
  if (mode !== 'physical' && mode !== 'digital') {
    return { error: 'Invalid document mode.' };
  }

  let filePath: string | null = null;
  if (mode === 'digital' && file && file.size > 0) {
    filePath = await uploadDocumentFile(file);
  }

  const trackingCode = await registerDocument({
    title,
    docType,
    description,
    mode,
    filePath,
    submittedBy: user.id,
    sendTo,
  });

  revalidatePath('/dashboard');
  return { trackingCode };
}

// ---------- Take action on a document (approve/reject/forward/return) ----------

const STATUS_FOR_ACTION: Record<string, string> = {
  approve: 'approved',
  reject: 'rejected',
  forward: 'in_transit',
  return: 'returned',
};

export async function documentActionAction(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireUser();

  const documentId = Number(formData.get('document_id'));
  const action = String(formData.get('action') || '');
  const forwardTo = String(formData.get('forward_to') || '');
  const remarks = String(formData.get('remarks') || '').trim();

  const document = await getDocumentById(documentId);
  if (!document) return { error: 'Document not found.' };

  const needsRecipient = action === 'forward' || action === 'return';
  const toUser = needsRecipient ? forwardTo : user.id;

  if (needsRecipient && !toUser) {
    return { error: 'Please choose who to send this document to.' };
  }

  const newStatus = STATUS_FOR_ACTION[action] ?? 'under_review';

  await updateDocumentStatus({
    documentId,
    fromUser: user.id,
    toUser,
    newStatus,
    action: action.charAt(0).toUpperCase() + action.slice(1),
    remarks,
  });

  revalidatePath(`/document/${documentId}`);
  revalidatePath('/dashboard');
  return {};
}
