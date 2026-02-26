'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { TemplateSelector } from '@/components/magazine/TemplateSelector';
import { useToast } from '@/stores/toastStore';
import type { MagazineTemplate, MagazineFormat } from '@/types/magazine';

type CreateStep = 'template' | 'details' | 'generating';

export default function CreateMagazinePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<CreateStep>('template');
  const [template, setTemplate] = useState<MagazineTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<MagazineFormat>('6x9');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [_creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!template) {
      toast('Please select a template', 'error');
      return;
    }

    setStep('generating');
    setCreating(true);

    try {
      const res = await fetch('/api/magazines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || `${template.charAt(0).toUpperCase() + template.slice(1)} Magazine`,
          template,
          format,
          dateRangeStart: dateStart || undefined,
          dateRangeEnd: dateEnd || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to create magazine');
      }

      const json = await res.json();
      toast('Magazine created!', 'success');
      router.push(`/projects/magazines/${json.data.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
      setStep('details');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-[var(--space-section)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <BackButton />
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-heading)] text-[var(--color-ink)]">
          New Magazine
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['template', 'details', 'generating'] as const).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s === step ? 'bg-[var(--color-action)]' :
              (['template', 'details', 'generating'].indexOf(step) > i) ? 'bg-[var(--color-action)]/40' :
              'bg-[var(--color-border)]'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Template */}
      {step === 'template' && (
        <div className="flex flex-col gap-[var(--space-component)]">
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            Choose a template for your magazine. We'll auto-design it from your favorites.
          </p>
          <TemplateSelector selected={template} onSelect={setTemplate} />
          <div className="flex justify-end pt-[var(--space-element)]">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep('details')}
              disabled={!template}
            >
              Next
              <ChevronRight size={16} className="ml-0.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <div className="flex flex-col gap-[var(--space-component)]">
          <Input
            label="Magazine Title"
            placeholder="February 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="flex flex-col gap-[var(--space-tight)]">
            <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]">
              Format
            </label>
            <div className="flex gap-2">
              {(['6x9', '8x10'] as MagazineFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-[var(--radius-sharp)] border-2 font-[family-name:var(--font-mono)] text-[length:var(--text-body)] transition-colors ${
                    format === f
                      ? 'border-[var(--color-action)] bg-[var(--color-action)]/5 text-[var(--color-ink)]'
                      : 'border-[var(--color-border)] text-[var(--color-ink-secondary)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-element)]">
            <Input
              label="Start Date"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>

          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            Leave dates empty to use the template default. We'll pull your favorites from this period.
          </p>

          <div className="flex items-center justify-between pt-[var(--space-element)]">
            <Button variant="ghost" size="sm" onClick={() => setStep('template')}>
              Back
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Create Magazine
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === 'generating' && (
        <div className="flex flex-col items-center justify-center py-[var(--space-section)] gap-[var(--space-component)]">
          <Spinner size="lg" />
          <p className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] text-[var(--color-ink)]">
            Designing your magazine...
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            We're selecting photos and laying out pages automatically.
          </p>
        </div>
      )}
    </div>
  );
}
