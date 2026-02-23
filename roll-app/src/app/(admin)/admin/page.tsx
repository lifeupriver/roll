import { requireAdmin } from '@/lib/admin/middleware';
import { redirect } from 'next/navigation';
import { AdminHomeDashboard } from './AdminHomeDashboard';

export default async function AdminHomePage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/feed');

  return <AdminHomeDashboard />;
}
