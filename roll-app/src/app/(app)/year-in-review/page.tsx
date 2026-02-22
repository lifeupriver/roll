'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Camera, Film, Printer, Heart, Users, Image, Calendar, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import type { YearInReviewData } from '@/app/api/year-in-review/route';

function StatCard({ icon: Icon, label, value, accent }: {
  icon: typeof Camera;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-tight)] p-[var(--space-component)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)]">
      <Icon
        size={24}
        className={accent ? 'text-[var(--color-action)]' : 'text-[var(--color-ink-tertiary)]'}
      />
      <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-heading)] text-[var(--color-ink)] font-bold">
        {value}
      </span>
      <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center">
        {label}
      </span>
    </div>
  );
}

export default function YearInReviewPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<YearInReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/year-in-review?year=${year}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data ?? null);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year]);

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <button
          onClick={() => router.push('/account')}
          className="p-[var(--space-tight)] -ml-[var(--space-tight)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
          Year in Review
        </h1>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-[var(--space-element)]">
        {[currentYear, currentYear - 1].map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-[var(--space-component)] py-[var(--space-tight)] rounded-[var(--radius-pill)] text-[length:var(--text-label)] font-medium transition-colors ${
              year === y
                ? 'bg-[var(--color-action)] text-white'
                : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-raised)]'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-[var(--space-hero)]">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Hero stat */}
          <Card className="text-center">
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] uppercase tracking-wider font-medium">
              Your {data.year}
            </p>
            <p className="font-[family-name:var(--font-display)] text-[length:var(--text-display)] font-bold text-[var(--color-ink)] mt-[var(--space-tight)]">
              {data.totalPhotosUploaded}
            </p>
            <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
              photos uploaded
            </p>
          </Card>

          {/* Key stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--space-element)]">
            <StatCard icon={Film} label="Rolls developed" value={data.totalRollsDeveloped} accent />
            <StatCard icon={Printer} label="Prints ordered" value={data.totalPrintsOrdered} />
            <StatCard icon={Heart} label="Favorites" value={data.favoriteCount} accent />
            <StatCard icon={Users} label="Circles joined" value={data.circlesJoined} />
          </div>

          {/* Favorite film profile */}
          {data.favoriteFilmProfile && (
            <Card>
              <div className="flex items-center gap-[var(--space-element)]">
                <Star size={20} className="text-[var(--color-action)]" />
                <div>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    Favorite film profile
                  </p>
                  <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] capitalize">
                    {data.favoriteFilmProfile}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Top month */}
          {data.topMonth && (
            <Card>
              <div className="flex items-center gap-[var(--space-element)]">
                <Calendar size={20} className="text-[var(--color-action)]" />
                <div>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    Busiest month
                  </p>
                  <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                    {data.topMonth.month} — {data.topMonth.count} photos
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Camera breakdown */}
          {data.cameraBreakdown.length > 0 && (
            <Card>
              <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-element)]">
                <Camera size={18} className="text-[var(--color-ink-tertiary)]" />
                <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
                  Your cameras
                </h3>
              </div>
              <div className="flex flex-col gap-[var(--space-tight)]">
                {data.cameraBreakdown.map((entry) => {
                  const pct = data.totalPhotosUploaded > 0
                    ? Math.round((entry.count / data.totalPhotosUploaded) * 100)
                    : 0;
                  return (
                    <div key={entry.camera} className="flex items-center gap-[var(--space-element)]">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[length:var(--text-caption)] text-[var(--color-ink)]">{entry.camera}</span>
                          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">{entry.count}</span>
                        </div>
                        <div className="h-1.5 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-action)] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Scene breakdown */}
          {data.sceneBreakdown.length > 0 && (
            <Card>
              <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-element)]">
                <Image size={18} className="text-[var(--color-ink-tertiary)]" />
                <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
                  What you shot
                </h3>
              </div>
              <div className="flex flex-wrap gap-[var(--space-tight)]">
                {data.sceneBreakdown.map((entry) => (
                  <span
                    key={entry.scene}
                    className="px-[var(--space-element)] py-[var(--space-tight)] bg-[var(--color-surface-sunken)] rounded-[var(--radius-pill)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] capitalize"
                  >
                    {entry.scene} ({entry.count})
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Social */}
          {data.photosSharedToCircles > 0 && (
            <Card>
              <p className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                You shared <strong>{data.photosSharedToCircles}</strong> post{data.photosSharedToCircles !== 1 ? 's' : ''} to your circles this year.
              </p>
            </Card>
          )}

          {/* Empty state */}
          {data.totalPhotosUploaded === 0 && (
            <Card className="text-center">
              <p className="text-[length:var(--text-body)] text-[var(--color-ink-tertiary)]">
                No photos uploaded in {data.year} yet. Start building memories!
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
