'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Printer, Check, Package, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';
import { useUser } from '@/hooks/useUser';
import type { Roll } from '@/types/roll';
import type { PrintProduct, PrintSize, ShippingAddress } from '@/types/print';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Pricing constants
// ---------------------------------------------------------------------------
const PRICE_PER_PHOTO_4x6 = 30; // cents
const PRICE_PER_PHOTO_5x7 = 60; // cents
const SHIPPING_CENTS = 499;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function OrderPrintsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  const rollId = params.id;

  // ---- Roll data ----------------------------------------------------------
  const [roll, setRoll] = useState<Roll | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ---- Multi-step state ---------------------------------------------------
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 – product selection
  const [selectedProduct, setSelectedProduct] = useState<PrintProduct>('roll_prints');
  const [selectedSize, setSelectedSize] = useState<PrintSize>('4x6');

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  // Step 3 – submitting
  const [submitting, setSubmitting] = useState(false);

  // ---- Derived state ------------------------------------------------------
  const isFirstRoll = true; // In a real app, derive from user's order history
  const isFreeOrder = selectedProduct === 'roll_prints' && isFirstRoll;
  const pricePerPhoto = selectedSize === '4x6' ? PRICE_PER_PHOTO_4x6 : PRICE_PER_PHOTO_5x7;
  const subtotalCents = photoCount * pricePerPhoto;
  const totalCents = isFreeOrder ? 0 : subtotalCents + SHIPPING_CENTS;

  // ---- Fetch roll ---------------------------------------------------------
  const fetchRoll = useCallback(async () => {
    try {
      const res = await fetch(`/api/rolls/${rollId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load roll');
      }
      const { data } = await res.json();
      setRoll(data.roll);
      setPhotoCount(data.photos?.length ?? data.roll.photo_count ?? 0);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load roll', 'error');
      router.push(`/roll/${rollId}`);
    } finally {
      setLoading(false);
    }
  }, [rollId, router, toast]);

  useEffect(() => {
    fetchRoll();
  }, [fetchRoll]);

  // ---- Handlers -----------------------------------------------------------

  const handleProductSelect = (product: PrintProduct, size: PrintSize) => {
    // Block individual 5x7 for free-tier users
    if (product === 'individual' && user?.tier !== 'plus') return;
    setSelectedProduct(product);
    setSelectedSize(size);
  };

  const handleShippingChange = (field: keyof ShippingAddress, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
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
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollId,
          product: selectedProduct,
          printSize: selectedSize,
          shipping,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to place order');
      }
      toast('Order placed successfully!', 'success');
      router.push(`/roll/${rollId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.push(`/roll/${rollId}`);
    } else {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // ---- Loading state ------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!roll) return null;

  // ---- Step indicator -----------------------------------------------------
  const stepLabels = ['Product', 'Shipping', 'Confirm'];

  // ========================================================================
  // Render
  // ========================================================================
  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150 cursor-pointer bg-transparent border-none text-[var(--color-ink)]"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)]">
          Order Prints
        </h1>
      </div>

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
      {/* Step 1 – Product Selection                                        */}
      {/* ================================================================= */}
      {step === 1 && (
        <div className="flex flex-col gap-[var(--space-component)]">
          {/* Roll Prints card */}
          <button
            type="button"
            onClick={() => handleProductSelect('roll_prints', '4x6')}
            className={[
              'w-full text-left cursor-pointer bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] border-2 transition-all duration-150',
              selectedProduct === 'roll_prints'
                ? 'border-[var(--color-action)] shadow-[var(--shadow-floating)]'
                : 'border-transparent shadow-[var(--shadow-raised)] hover:border-[var(--color-border)]',
            ].join(' ')}
          >
            <div className="flex items-start gap-[var(--space-element)]">
              <div className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sharp)] bg-[var(--color-action)]/10 shrink-0">
                <Printer size={20} className="text-[var(--color-action)]" />
              </div>
              <div className="flex-1 flex flex-col gap-[var(--space-tight)]">
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                    Roll Prints
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                    4x6
                  </span>
                </div>
                <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
                  Print all {photoCount} photos from this roll as 4x6 prints.
                </p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  {formatCents(PRICE_PER_PHOTO_4x6)}/photo + {formatCents(SHIPPING_CENTS)} shipping
                </p>
              </div>
            </div>
            {isFirstRoll && (
              <div className="mt-[var(--space-element)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-sharp)] bg-[var(--color-developed)]/10">
                <p className="text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-semibold text-[var(--color-developed)]">
                  Free for your first roll!
                </p>
              </div>
            )}
          </button>

          {/* Individual 5x7 card */}
          <button
            type="button"
            onClick={() => handleProductSelect('individual', '5x7')}
            className={[
              'w-full text-left bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] border-2 transition-all duration-150',
              user?.tier === 'plus' ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
              selectedProduct === 'individual'
                ? 'border-[var(--color-action)] shadow-[var(--shadow-floating)]'
                : 'border-transparent shadow-[var(--shadow-raised)] hover:border-[var(--color-border)]',
            ].join(' ')}
          >
            <div className="flex items-start gap-[var(--space-element)]">
              <div className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sharp)] bg-[var(--color-action)]/10 shrink-0 relative">
                <Package size={20} className="text-[var(--color-action)]" />
                {user?.tier !== 'plus' && (
                  <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-surface-raised)] shadow-[var(--shadow-raised)]">
                    <Lock size={10} className="text-[var(--color-ink-tertiary)]" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-[var(--space-tight)]">
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                    Individual 5x7
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                    5x7
                  </span>
                </div>
                <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
                  Select individual photos for larger 5x7 prints.
                </p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  {formatCents(PRICE_PER_PHOTO_5x7)}/photo + {formatCents(SHIPPING_CENTS)} shipping
                </p>
                {user?.tier !== 'plus' && (
                  <p className="text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium text-[var(--color-ink-tertiary)]">
                    Roll+ only
                  </p>
                )}
              </div>
            </div>
          </button>

          <Button variant="primary" size="lg" onClick={handleContinueToShipping}>
            Continue
          </Button>
        </div>
      )}

      {/* ================================================================= */}
      {/* Step 2 – Shipping Address                                         */}
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
                    fieldErrors.country ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]',
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
      {/* Step 3 – Order Confirmation                                       */}
      {/* ================================================================= */}
      {step === 3 && (
        <div className="flex flex-col gap-[var(--space-component)]">
          {/* Order summary */}
          <Card>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mb-[var(--space-element)]">
              Order Summary
            </h2>

            <div className="flex flex-col gap-[var(--space-element)]">
              {/* Product details */}
              <div className="grid grid-cols-2 gap-[var(--space-tight)] text-[length:var(--text-body)]">
                <span className="text-[var(--color-ink-secondary)]">Product</span>
                <span className="text-[var(--color-ink)] text-right">
                  {selectedProduct === 'roll_prints' ? 'Roll Prints' : 'Individual 5x7'}
                </span>

                <span className="text-[var(--color-ink-secondary)]">Print Size</span>
                <span className="text-[var(--color-ink)] font-[family-name:var(--font-mono)] text-right">
                  {selectedSize}
                </span>

                <span className="text-[var(--color-ink-secondary)]">Photos</span>
                <span className="text-[var(--color-ink)] font-[family-name:var(--font-mono)] text-right">
                  {photoCount}
                </span>

                <span className="text-[var(--color-ink-secondary)]">Roll</span>
                <span className="text-[var(--color-ink)] text-right truncate">
                  {roll.name || 'Untitled Roll'}
                </span>
              </div>

              {/* Divider */}
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

              {/* Divider */}
              <div className="h-px bg-[var(--color-border)]" />

              {/* Pricing */}
              <div className="flex flex-col gap-[var(--space-tight)]">
                {isFreeOrder ? (
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                      Total
                    </span>
                    <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-developed)]">
                      Free
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[length:var(--text-body)]">
                      <span className="text-[var(--color-ink-secondary)]">
                        {photoCount} photos x {formatCents(pricePerPhoto)}
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
                  </>
                )}
              </div>

              {isFreeOrder && (
                <div className="px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-sharp)] bg-[var(--color-developed)]/10">
                  <p className="text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-semibold text-[var(--color-developed)]">
                    Your first roll prints are on us -- enjoy!
                  </p>
                </div>
              )}
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
        </div>
      )}
    </div>
  );
}
