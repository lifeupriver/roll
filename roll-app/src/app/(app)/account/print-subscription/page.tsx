'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, Package, Pause, Play } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';

export default function PrintSubscriptionPage() {
  const _router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // Shipping form
  const [name, setName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [printSize, setPrintSize] = useState('4x6');

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch('/api/subscriptions/print');
        if (res.ok) {
          const json = await res.json();
          const sub = json.data;
          if (sub) {
            setEnabled(sub.status === 'active');
            setName(sub.shipping_name || '');
            setLine1(sub.shipping_line1 || '');
            setLine2(sub.shipping_line2 || '');
            setCity(sub.shipping_city || '');
            setState(sub.shipping_state || '');
            setPostalCode(sub.shipping_postal_code || '');
            setCountry(sub.shipping_country || 'US');
            setPrintSize(sub.print_size || '4x6');
          }
        }
      } catch {
        // No subscription yet
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  const handleSave = async () => {
    if (enabled && (!name || !line1 || !city || !postalCode)) {
      toast('Please complete the shipping address', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/subscriptions/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          shipping: { name, line1, line2, city, state, postalCode, country },
          printSize,
        }),
      });

      if (res.ok) {
        toast(enabled ? 'Print subscription activated!' : 'Print subscription paused', 'success');
      } else {
        toast('Failed to save', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-section)]">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <BackButton href="/account" />
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-heading)] text-[var(--color-ink)]">
          Monthly Print Subscription
        </h1>
      </div>

      {/* Description */}
      <Card className="p-[var(--space-component)] bg-[var(--color-surface-raised)]">
        <div className="flex items-start gap-3">
          <Package size={24} className="text-[var(--color-action)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[var(--color-ink)]">$4.99/month — 36 prints delivered</p>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mt-1">
              Every month, we auto-select 36 of your most recent favorites and ship them as beautiful prints. No effort required.
            </p>
          </div>
        </div>
      </Card>

      {/* Toggle */}
      <div className="flex items-center justify-between p-[var(--space-component)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)]">
        <div className="flex items-center gap-3">
          {enabled ? (
            <Play size={20} className="text-green-500" />
          ) : (
            <Pause size={20} className="text-[var(--color-ink-tertiary)]" />
          )}
          <span className="font-medium text-[var(--color-ink)]">
            {enabled ? 'Subscription Active' : 'Subscription Paused'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            enabled ? 'bg-[var(--color-action)]' : 'bg-[var(--color-border)]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Print size */}
      <div className="flex flex-col gap-[var(--space-tight)]">
        <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]">
          Print Size
        </label>
        <div className="flex gap-2">
          {['4x6', '5x7'].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setPrintSize(size)}
              className={`flex-1 py-2 rounded-[var(--radius-sharp)] border-2 font-[family-name:var(--font-mono)] transition-colors ${
                printSize === size
                  ? 'border-[var(--color-action)] bg-[var(--color-action)]/5'
                  : 'border-[var(--color-border)]'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Shipping form */}
      <div className="flex flex-col gap-[var(--space-component)]">
        <h2 className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-wider">
          Shipping Address
        </h2>
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Address Line 1" value={line1} onChange={(e) => setLine1(e.target.value)} />
        <Input label="Address Line 2" value={line2} onChange={(e) => setLine2(e.target.value)} />
        <div className="grid grid-cols-2 gap-[var(--space-element)]">
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="State" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-[var(--space-element)]">
          <Input label="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </div>

      <Button variant="primary" size="lg" onClick={handleSave} isLoading={saving} className="w-full">
        <Printer size={16} className="mr-1.5" />
        Save Subscription
      </Button>
    </div>
  );
}
