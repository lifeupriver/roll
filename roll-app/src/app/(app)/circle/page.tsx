import { Empty } from '@/components/ui/Empty';
import { Users } from 'lucide-react';

export default function CirclePage() {
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
        Circle
      </h1>
      <Empty
        icon={Users}
        title="No circles yet"
        description="Create a Circle to share your best photos with family and friends."
      />
    </div>
  );
}
