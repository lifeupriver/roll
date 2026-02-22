import { Empty } from '@/components/ui/Empty';
import { Image } from 'lucide-react';

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
        Library
      </h1>
      <Empty
        icon={Image}
        title="No rolls yet"
        description="Build your first roll by selecting photos from your feed."
      />
    </div>
  );
}
