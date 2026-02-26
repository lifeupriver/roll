'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Minus, Plus } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';
import type { Magazine } from '@/types/magazine';

export default function MagazineReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Shipping form
  const [name, setName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');

  useEffect(() => {
    async function fetchMagazine() {
      try {
        const res = await fetch(`/api/magazines/${id}`);
        if (res.ok) {
          const json = await res.json();
          setMagazine(json.data);
        }
      } catch {
        toast('Failed to load magazine', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchMagazine();
  }, [id, toast]);

  const handleOrder = async () => {
    if (!name || !line1 || !city || !postalCode || !country) {
      toast('Please complete all required shipping fields', 'error');
      return;
    }

    setOrdering(true);
    try {
      const res = await fetch(`/api/magazines/${id}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: { name, line1, line2, city, state, postalCode, country },
          quantity,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Order failed');
      }

      toast('Magazine ordered! You\'ll receive tracking info soon.', 'success');
      router.push(`/projects/magazines/${id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Order failed', 'error');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-section)]">
        <Spinner size="md" />
      </div>
    );
  }

  if (!magazine) {
    return <div className="text-center py-[var(--space-section)] text-[var(--color-ink-secondary)]">Magazine not found</div>;
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <BackButton />
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-heading)] text-[var(--color-ink)]">
          Order Print
        </h1>
      </div>

      {/* Summary */}
      <div className="p-[var(--space-component)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] flex items-center gap-[var(--space-component)]">
        <Package size={24} className="text-[var(--color-action)] flex-shrink-0" />
        <div className="flex-1">
          <p className="font-[family-name:var(--font-display)] font-medium text-[var(--color-ink)]">
            {magazine.title}
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            {magazine.page_count} pages · {magazine.format} · Silk paper
          </p>
        </div>
        <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-lead)] text-[var(--color-ink)]">
          ${magazine.price_cents ? ((magazine.price_cents * quantity) / 100).toFixed(2) : '—'}
        </span>
      </div>

      {/* Quantity selector */}
      <div className="flex items-center justify-between p-[var(--space-component)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)]">
        <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em]">
          Quantity
        </span>
        <div className="flex items-center gap-[var(--space-element)]">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] disabled:opacity-30 transition-colors cursor-pointer"
          >
            <Minus size={14} />
          </button>
          <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-body)] text-[var(--color-ink)] w-8 text-center tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            disabled={quantity >= 10}
            className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)] disabled:opacity-30 transition-colors cursor-pointer"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Shipping form */}
      <div className="flex flex-col gap-[var(--space-component)]">
        <h2 className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-wider">
          Shipping Address
        </h2>
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Address Line 1" value={line1} onChange={(e) => setLine1(e.target.value)} required />
        <Input label="Address Line 2" value={line2} onChange={(e) => setLine2(e.target.value)} />
        <div className="grid grid-cols-2 gap-[var(--space-element)]">
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} required />
          <Input label="State" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-[var(--space-element)]">
          <Input label="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
        </div>
      </div>

      {/* Order button */}
      <Button
        variant="primary"
        size="lg"
        onClick={handleOrder}
        isLoading={ordering}
        className="w-full"
      >
        Place Order{quantity > 1 ? ` (${quantity} copies)` : ''} — ${magazine.price_cents ? ((magazine.price_cents * quantity) / 100).toFixed(2) : '—'} + shipping
      </Button>

      <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center">
        Printed on silk 170gsm paper. Ships within 5–7 business days.
      </p>
    </div>
  );
}
