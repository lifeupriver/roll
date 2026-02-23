import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/middleware';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'Roll Admin',
  robots: { index: false, follow: false },
};

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect('/feed');
  }

  return <AdminLayout adminEmail={admin.email}>{children}</AdminLayout>;
}
