'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Check, MapPin, Minus, Plus } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';
import type { Magazine } from '@/types/magazine';
import type { ShippingAddress } from '@/types/print';

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------
const SHIPPING_CENTS = 499;

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function MagazineReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // ---- Magazine data -------------------------------------------------------
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Multi-step state ----------------------------------------------------
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 – quantity
  const [quantity, setQuantity] = useState(1);

  // Step 2 – shipping address
  const [shipping, setShipping] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>(
    {}
  );

  // Step 3 – submitting
  const [submitting, setSubmitting] = useState(false);

  // ---- Derived state -------------------------------------------------------
  const unitPriceCents = magazine?.price_cents ?? 0;
  const subtotalCents = unitPriceCents * quantity;
  const totalCents = subtotalCents + SHIPPING_CENTS;

  // ---- Fetch magazine ------------------------------------------------------
  useEffect(() => {
    async function fetchMagazine() {
      try {
        const res = await fetch(`/api/magazines/${id}`);
        if (res.ok) {
          const json = await res.json();
          setMagazine(json.data);
        }
      } catch {
        toastRef.current('Failed to load magazine', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchMagazine();
  }, [id]);

  // ---- Handlers ------------------------------------------------------------
  const handleShippingChange = (field: keyof ShippingAddress, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateShipping = (): boolean => {
    const errors: Partial<Record<keyof ShippingAddress, string>> = {};
    if (!shipping.name.trim()) errors.name = 'Full name is required';
    if (!shipping.line1.trim()) errors.line1 = 'Address is required';
    if (!shipping.city.trim()) errors.city = 'City is required';
    if (!shipping.state.trim()) errors.state = 'State/Province is required';
    if (!shipping.postalCode.trim()) errors.postalCode = 'ZIP/Postal code is required';
    if (!shipping.country) errors.country = 'Country is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueToShipping = () => {
    setStep(2);
  };

  const handleContinueToConfirm = () => {
    if (validateShipping()) {
      setStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/magazines/${id}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: shipping,
          quantity,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Order failed');
      }

      toast("Magazine ordered! You'll receive tracking info soon.", 'success');
      router.push(`/projects/magazines/${id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Order failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.push(`/projects/magazines/${id}`);
    } else {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // ---- Loading state -------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!magazine) {
    return (
      <div className="text-center py-[var(--space-section)] text-[var(--color-ink-secondary)]">
        Magazine not found
      </div>
    );
  }

  // ---- Step indicator ------------------------------------------------------
  const stepLabels = ['Details', 'Shipping', 'Confirm'];

  // ========================================================================
  // Render
  // ========================================================================
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <BackButton onClick={handleBack} />
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
          Order Magazine
        </h1>
      </div>

      {/* Magazine info */}
      <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
        {magazine.title} &middot; {magazine.page_count} pages &middot; {magazine.format}
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-[var(--space-tight)]">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isCompleted = stepNum < step;
          return (
            <div key={label} className="flex items-center gap-[var(--space-tight)] flex-1">
              <div className="flex items-center gap-[var(--space-tight)] flex-1">
                <div
                  className={[
                    'flex items-center justify-center w-7 h-7 rounded-full shrink-0',
                    'font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] font-medium',
                    isCompleted
                      ? 'bg-[var(--color-developed)] text-[var(--color-surface)]'
                      : isActive
                        ? 'bg-[var(--color-action)] text-[var(--color-surface)]'
                        : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-tertiary)]',
                  ].join(' ')}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : stepNum}
                </div>
                <span
                  className={[
                    'text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium',
                    isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-tertiary)]',
                  ].join(' ')}
                >
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div
                    className={[
                      'flex-1 h-px',
                      isCompleted ? 'bg-[var(--color-developed)]' : 'bg-[var(--color-border)]',
                    ].join(' ')}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* Step 1 – Magazine Details + Quantity                              */}
      {/* ================================================================= */}
      {step === 1 && (
        <div className="flex flex-col gap-[var(--space-component)]">
          {/* Product card */}
          <div className="flex flex-col items-center gap-[var(--space-element)] p-[var(--space-component)] rounded-[var(--radius-card)] border-2 border-[var(--color-action)] bg-[var(--color-action-subtle)]">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-action)]/15">
              <BookOpen size={24} className="text-[var(--color-action)]" />
            </div>
            <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-action)]">
              {magazine.format} Magazine
            </span>
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] text-center">
              {magazine.page_count} pages · Silk 170gsm paper
            </span>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em]">
              Quantity
            </span>
            <div className="flex items-center gap-[var(--space-element)]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-30 transition-colors cursor-pointer"
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
                className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-raised)] disabled:opacity-30 transition-colors cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Price summary */}
          <Card>
            <div className="flex flex-col gap-[var(--space-tight)]">
              <div className="flex items-center justify-between text-[length:var(--text-body)]">
                <span className="text-[var(--color-ink-secondary)]">
                  {magazine.format} Magazine{quantity > 1 ? ` x ${quantity}` : ''}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[var(--color-ink)]">
                  {formatCents(subtotalCents)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[length:var(--text-body)]">
                <span className="text-[var(--color-ink-secondary)]">Shipping</span>
                <span className="font-[family-name:var(--font-mono)] text-[var(--color-ink)]">
                  {formatCents(SHIPPING_CENTS)}
                </span>
              </div>
              <div className="h-px bg-[var(--color-border)]" />
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                  Total
                </span>
                <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                  {formatCents(totalCents)}
                </span>
              </div>
            </div>
          </Card>

          <Button variant="primary" size="lg" onClick={handleContinueToShipping}>
            Continue
          </Button>
        </div>
      )}

      {/* ================================================================= */}
      {/* Step 2 – Shipping Address                                        */}
      {/* ================================================================= */}
      {step === 2 && (
        <div className="flex flex-col gap-[var(--space-component)]">
          <div className="flex items-center gap-[var(--space-tight)]">
            <MapPin size={20} className="text-[var(--color-ink-secondary)]" />
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
              Shipping Address
            </h2>
          </div>

          <Card>
            <div className="flex flex-col gap-[var(--space-element)]">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={shipping.name}
                onChange={(e) => handleShippingChange('name', e.target.value)}
                error={fieldErrors.name}
              />

              <Input
                label="Address Line 1"
                placeholder="123 Main Street"
                value={shipping.line1}
                onChange={(e) => handleShippingChange('line1', e.target.value)}
                error={fieldErrors.line1}
              />

              <Input
                label="Address Line 2 (optional)"
                placeholder="Apt, Suite, Unit, etc."
                value={shipping.line2 || ''}
                onChange={(e) => handleShippingChange('line2', e.target.value)}
              />

              <Input
                label="City"
                placeholder="San Francisco"
                value={shipping.city}
                onChange={(e) => handleShippingChange('city', e.target.value)}
                error={fieldErrors.city}
              />

              <div className="grid grid-cols-2 gap-[var(--space-element)]">
                <Input
                  label="State / Province"
                  placeholder="CA"
                  value={shipping.state}
                  onChange={(e) => handleShippingChange('state', e.target.value)}
                  error={fieldErrors.state}
                />

                <Input
                  label="ZIP / Postal Code"
                  placeholder="94102"
                  value={shipping.postalCode}
                  onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                  error={fieldErrors.postalCode}
                />
              </div>

              <div className="flex flex-col gap-[var(--space-tight)]">
                <label
                  htmlFor="country"
                  className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]"
                >
                  Country
                </label>
                <select
                  id="country"
                  value={shipping.country}
                  onChange={(e) => handleShippingChange('country', e.target.value)}
                  className={[
                    'w-full h-12 px-[var(--space-element)] bg-[var(--color-surface-sunken)] border rounded-[var(--radius-sharp)]',
                    'font-[family-name:var(--font-body)] text-[length:var(--text-body)] text-[var(--color-ink)]',
                    'transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2',
                    'appearance-none cursor-pointer',
                    fieldErrors.country
                      ? 'border-[var(--color-error)]'
                      : 'border-[var(--color-border)]',
                  ].join(' ')}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
                {fieldErrors.country && (
                  <p className="text-[length:var(--text-caption)] text-[var(--color-error)] animate-[slideDown_150ms_ease-out]">
                    {fieldErrors.country}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Button variant="primary" size="lg" onClick={handleContinueToConfirm}>
            Continue
          </Button>
        </div>
      )}

      {/* ================================================================= */}
      {/* Step 3 – Order Confirmation                                      */}
      {/* ================================================================= */}
      {step === 3 && (
        <div className="flex flex-col gap-[var(--space-component)]">
          <Card>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mb-[var(--space-element)]">
              Order Summary
            </h2>

            <div className="flex flex-col gap-[var(--space-element)]">
              {/* Product details */}
              <div className="grid grid-cols-2 gap-[var(--space-tight)] text-[length:var(--text-body)]">
                <span className="text-[var(--color-ink-secondary)]">Product</span>
                <span className="text-[var(--color-ink)] text-right">Magazine</span>

                <span className="text-[var(--color-ink-secondary)]">Title</span>
                <span className="text-[var(--color-ink)] text-right truncate">{magazine.title}</span>

                <span className="text-[var(--color-ink-secondary)]">Format</span>
                <span className="text-[var(--color-ink)] font-[family-name:var(--font-mono)] text-right">
                  {magazine.format}
                </span>

                <span className="text-[var(--color-ink-secondary)]">Pages</span>
                <span className="text-[var(--color-ink)] font-[family-name:var(--font-mono)] text-right">
                  {magazine.page_count}
                </span>

                <span className="text-[var(--color-ink-secondary)]">Quantity</span>
                <span className="text-[var(--color-ink)] font-[family-name:var(--font-mono)] text-right">
                  {quantity}
                </span>
              </div>

              <div className="h-px bg-[var(--color-border)]" />

              {/* Shipping address */}
              <div>
                <p className="text-[length:var(--text-label)] font-[family-name:var(--font-body)] font-medium tracking-[0.04em] uppercase text-[var(--color-ink-secondary)] mb-[var(--space-tight)]">
                  Shipping To
                </p>
                <div className="text-[length:var(--text-body)] text-[var(--color-ink)] leading-relaxed">
                  <p>{shipping.name}</p>
                  <p>{shipping.line1}</p>
                  {shipping.line2 && <p>{shipping.line2}</p>}
                  <p>
                    {shipping.city}, {shipping.state} {shipping.postalCode}
                  </p>
                  <p>
                    {shipping.country === 'US'
                      ? 'United States'
                      : shipping.country === 'CA'
                        ? 'Canada'
                        : shipping.country === 'UK'
                          ? 'United Kingdom'
                          : 'Australia'}
                  </p>
                </div>
              </div>

              <div className="h-px bg-[var(--color-border)]" />

              {/* Pricing */}
              <div className="flex flex-col gap-[var(--space-tight)]">
                <div className="flex items-center justify-between text-[length:var(--text-body)]">
                  <span className="text-[var(--color-ink-secondary)]">
                    {magazine.format} Magazine{quantity > 1 ? ` x ${quantity}` : ''}
                  </span>
                  <span className="text-[var(--color-ink)] font-[family-name:var(--font-mono)]">
                    {formatCents(subtotalCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[length:var(--text-body)]">
                  <span className="text-[var(--color-ink-secondary)]">Shipping</span>
                  <span className="text-[var(--color-ink)] font-[family-name:var(--font-mono)]">
                    {formatCents(SHIPPING_CENTS)}
                  </span>
                </div>
                <div className="h-px bg-[var(--color-border)]" />
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                    Total
                  </span>
                  <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                    {formatCents(totalCents)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Button
            variant="primary"
            size="lg"
            onClick={handlePlaceOrder}
            isLoading={submitting}
            disabled={submitting}
          >
            Place Order
          </Button>

          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center">
            Printed on silk 170gsm paper. Ships within 5–7 business days.
          </p>
        </div>
      )}
    </div>
  );
}
