'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { MagazineCover } from '@/components/magazine/MagazineCover';
import { useToast } from '@/stores/toastStore';
import type { Magazine } from '@/types/magazine';

export default function MagazinesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMagazines() {
      try {
        const res = await fetch('/api/magazines');
        if (res.ok) {
          const json = await res.json();
          setMagazines(json.data ?? []);
        } else {
          toast('Failed to load magazines', 'error');
        }
      } catch {
        toast('Failed to load magazines', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchMagazines();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-section)]">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-title)] text-[var(--color-ink)]">
          Magazines
        </h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/projects/magazines/create')}
        >
          <Plus size={16} className="mr-1" />
          New Magazine
        </Button>
      </div>

      {magazines.length === 0 ? (
        <Empty
          icon={BookOpen}
          title="No magazines yet"
          description="Create your first photo magazine — auto-designed from your favorites."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/projects/magazines/create')}
            >
              Create Magazine
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[var(--space-component)]">
          {magazines.map((mag) => (
            <MagazineCover
              key={mag.id}
              magazine={mag}
              onClick={() => router.push(`/projects/magazines/${mag.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
