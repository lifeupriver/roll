'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

type JoinState =
  | { status: 'loading' }
  | { status: 'success'; circleId: string; circleName: string }
  | { status: 'error'; message: string };

export default function CircleJoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [state, setState] = useState<JoinState>({ status: 'loading' });
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    async function joinCircle() {
      try {
        const res = await fetch(`/api/circles/join/${token}`, {
          method: 'POST',
        });

        if (res.ok) {
          const { data } = await res.json();
          setState({
            status: 'success',
            circleId: data.circleId,
            circleName: data.circleName,
          });
        } else {
          const { error } = await res.json();
          setState({
            status: 'error',
            message: error || 'This invite link has expired or is invalid.',
          });
        }
      } catch {
        setState({
          status: 'error',
          message: 'Something went wrong. Please try again.',
        });
      }
    }

    joinCircle();
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-[var(--space-component)] text-center px-[var(--space-component)]">
      {/* Loading state */}
      {state.status === 'loading' && (
        <>
          <Spinner size="lg" />
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            Joining circle...
          </p>
        </>
      )}

      {/* Success state */}
      {state.status === 'success' && (
        <>
          <div className="w-16 h-16 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center">
            <Users size={32} className="text-[var(--color-action)]" />
          </div>
          <div className="flex flex-col gap-[var(--space-tight)]">
            <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
              You&apos;ve joined {state.circleName}!
            </h1>
            <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
              You can now see and share photos with this circle.
            </p>
          </div>
          <Button variant="primary" onClick={() => router.push(`/circle/${state.circleId}`)}>
            Go to Circle
          </Button>
        </>
      )}

      {/* Error state */}
      {state.status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
            <Users size={32} className="text-[var(--color-error)]" />
          </div>
          <div className="flex flex-col gap-[var(--space-tight)]">
            <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
              Unable to join
            </h1>
            <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] max-w-md">
              {state.message}
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/circle')}>
            <ArrowLeft size={16} className="mr-1" /> Go to Circles
          </Button>
        </>
      )}
    </div>
  );
}
