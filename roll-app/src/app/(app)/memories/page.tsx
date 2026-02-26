'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import type { Memory } from '@/app/api/memories/route';

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMemories() {
      try {
        const res = await fetch('/api/memories');
        if (res.ok) {
          const { data } = await res.json();
          setMemories(data ?? []);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchMemories();
  }, []);

  const today = new Date();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dateLabel = `${monthNames[today.getMonth()]} ${today.getDate()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
        On this day, {dateLabel}
      </p>

      {memories.length === 0 ? (
        <Empty
          icon={Clock}
          title="No memories today"
          description="Photos taken on this day in previous years will appear here. Keep shooting!"
        />
      ) : (
        <>
          {/* Group by years ago */}
          {Array.from(new Set(memories.map((m) => m.yearsAgo))).map((yearsAgo) => {
            const yearMemories = memories.filter((m) => m.yearsAgo === yearsAgo);
            const year = today.getFullYear() - yearsAgo;

            return (
              <section key={yearsAgo} className="flex flex-col gap-[var(--space-component)]">
                <div className="flex items-center gap-[var(--space-tight)]">
                  <Calendar size={18} className="text-[var(--color-action)]" />
                  <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                    {year}
                  </h2>
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-body)]">
                    {yearMemories[0].label}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[var(--space-micro)]">
                  {yearMemories.map((memory) => (
                    <div
                      key={memory.id}
                      className="relative rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)]"
                    >
                      <img
                        src={memory.thumbnailUrl}
                        alt={`Memory from ${memory.label}`}
                        loading="lazy"
                        className="w-full aspect-[3/4] object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
