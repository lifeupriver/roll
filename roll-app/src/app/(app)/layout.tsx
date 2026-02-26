import { AppLayout } from '@/components/layout/AppLayout';
import { PinGate } from '@/components/auth/PinGate';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <PinGate>
      <AppLayout>{children}</AppLayout>
    </PinGate>
  );
}
