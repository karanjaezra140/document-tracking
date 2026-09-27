// ============================================================
// app/(app)/register/page.tsx
// Server Component: fetches the recipient list, passes it to the
// client form component.
// ============================================================
import { requireUser } from '@/lib/auth';
import { getAllUsersExcept } from '@/lib/documents';
import RegisterForm from './RegisterForm';

export default async function RegisterPage() {
  const user = await requireUser();
  const users = await getAllUsersExcept(user.id);

  return (
    <>
      <h1>Register New Document</h1>
      <RegisterForm users={users} />
    </>
  );
}
