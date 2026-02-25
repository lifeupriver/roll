'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Check, MapPin, BookOpen, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';
import { useUser } from '@/hooks/useUser';
import type { Roll } from '@/types/roll';
import type { PrintProduct, PrintSize, ShippingAddress } from '@/types/print';

// ---------------------------------------------------------------------------
// Pricing constants
// ---------------------------------------------------------------------------
const PRINT_PRICES: Record<string, number> = {
  '3x5': 25,
  '4x6': 30,
  '5x7': 60,
  '8x10': 120,
};

const MAGAZINE_PRICES: Record<string, number> = {
  '6x9': 1999,
  '8x10': 2499,
};

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

  // Step 1 – product type + size selection
  const [orderType, setOrderType] = useState<'prints' | 'magazine'>('prints');
  const [printSize, setPrintSize] = useState<PrintSize>('4x6');
  const [magazineSize, setMagazineSize] = useState<PrintSize>('8x10');

  // Quantity
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  // Step 3 – submitting
  const [submitting, setSubmitting] = useState(false);

  // ---- Derived state ------------------------------------------------------
  const isFirstRoll = true; // In a real app, derive from user's order history
  const isFreeOrder = orderType === 'prints' && isFirstRoll && quantity === 1;
  const selectedSize = orderType === 'prints' ? printSize : magazineSize;
  const selectedProduct: PrintProduct = orderType === 'prints' ? 'roll_prints' : 'magazine';
  const pricePerUnit = orderType === 'prints' ? (PRINT_PRICES[printSize] ?? 30) : 0;
  const unitSubtotal = orderType === 'prints' ? photoCount * pricePerUnit : (MAGAZINE_PRICES[magazineSize] ?? 2499);
  const subtotalCents = unitSubtotal * quantity;
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
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollId,
          product: selectedProduct,
          printSize: selectedSize,
          quantity,
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

  const printSizes: { size: PrintSize; label: string; price: number }[] = [
    { size: '3x5', label: '3 x 5', price: PRINT_PRICES['3x5'] },
    { size: '4x6', label: '4 x 6', price: PRINT_PRICES['4x6'] },
    { size: '5x7', label: '5 x 7', price: PRINT_PRICES['5x7'] },
    { size: '8x10', label: '8 x 10', price: PRINT_PRICES['8x10'] },
  ];

  const magazineSizes: { size: PrintSize; label: string; price: number }[] = [
    { size: '6x9', label: '6 x 9', price: MAGAZINE_PRICES['6x9'] },
    { size: '8x10', label: '8 x 10', price: MAGAZINE_PRICES['8x10'] },
  ];

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
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
          Order This Roll
        </h1>
      </div>

      {/* Roll info */}
      <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
        {roll.name || 'Untitled Roll'} &middot; {photoCount} photos
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
      {/* Step 1 – Choose: Prints or Book                                   */}
      {/* ================================================================= */}
      {step === 1 && (
        <div className="flex flex-col gap-[var(--space-component)]">
          {/* Order type toggle */}
          <div className="grid grid-cols-2 gap-[var(--space-element)]">
            <button
              type="button"
              onClick={() => setOrderType('prints')}
              className={[
                'flex flex-col items-center gap-[var(--space-element)] p-[var(--space-component)] rounded-[var(--radius-card)] border-2 transition-all duration-150 cursor-pointer',
                orderType === 'prints'
                  ? 'border-[var(--color-action)] bg-[var(--color-action-subtle)] shadow-[var(--shadow-floating)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)]',
              ].join(' ')}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${orderType === 'prints' ? 'bg-[var(--color-action)]/15' : 'bg-[var(--color-surface-sunken)]'}`}>
                <Printer size={24} className={orderType === 'prints' ? 'text-[var(--color-action)]' : 'text-[var(--color-ink-tertiary)]'} />
              </div>
              <span className={`font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] ${orderType === 'prints' ? 'text-[var(--color-action)]' : 'text-[var(--color-ink)]'}`}>
                Prints
              </span>
              <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] text-center">
                All {photoCount} photos printed
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('magazine')}
              className={[
                'flex flex-col items-center gap-[var(--space-element)] p-[var(--space-component)] rounded-[var(--radius-card)] border-2 transition-all duration-150 cursor-pointer',
                orderType === 'magazine'
                  ? 'border-[var(--color-action)] bg-[var(--color-action-subtle)] shadow-[var(--shadow-floating)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)]',
              ].join(' ')}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${orderType === 'magazine' ? 'bg-[var(--color-action)]/15' : 'bg-[var(--color-surface-sunken)]'}`}>
                <BookOpen size={24} className={orderType === 'magazine' ? 'text-[var(--color-action)]' : 'text-[var(--color-ink-tertiary)]'} />
              </div>
              <span className={`font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] ${orderType === 'magazine' ? 'text-[var(--color-action)]' : 'text-[var(--color-ink)]'}`}>
                Magazine
              </span>
              <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] text-center">
                Silk paper magazine
              </span>
            </button>
          </div>

          {/* Size selection */}
          <div className="flex flex-col gap-[var(--space-tight)]">
            <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em]">
              Choose size
            </span>

            {orderType === 'prints' ? (
              <div className="grid grid-cols-2 gap-[var(--space-element)]">
                {printSizes.map(({ size, label, price }) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPrintSize(size)}
                    className={[
                      'flex items-center justify-between p-[var(--space-element)] rounded-[var(--radius-card)] border-2 transition-all duration-150 cursor-pointer',
                      printSize === size
                        ? 'border-[var(--color-action)] bg-[var(--color-action-subtle)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)]',
                    ].join(' ')}
                  >
                    <span className={`font-[family-name:var(--font-mono)] text-[length:var(--text-body)] ${printSize === size ? 'text-[var(--color-action)]' : 'text-[var(--color-ink)]'}`}>
                      {label}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      {formatCents(price)}/ea
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-[var(--space-element)]">
                {magazineSizes.map(({ size, label, price }) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setMagazineSize(size)}
                    className={[
                      'flex flex-col items-center gap-[var(--space-tight)] p-[var(--space-element)] rounded-[var(--radius-card)] border-2 transition-all duration-150 cursor-pointer',
                      magazineSize === size
                        ? 'border-[var(--color-action)] bg-[var(--color-action-subtle)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)]',
                    ].join(' ')}
                  >
                    <span className={`font-[family-name:var(--font-mono)] text-[length:var(--text-body)] ${magazineSize === size ? 'text-[var(--color-action)]' : 'text-[var(--color-ink)]'}`}>
                      {label}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      {formatCents(price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
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
              {orderType === 'prints' ? (
                <div className="flex items-center justify-between text-[length:var(--text-body)]">
                  <span className="text-[var(--color-ink-secondary)]">{photoCount} photos x {formatCents(pricePerUnit)}{quantity > 1 ? ` x ${quantity}` : ''}</span>
                  <span className="font-[family-name:var(--font-mono)] text-[var(--color-ink)]">{formatCents(subtotalCents)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[length:var(--text-body)]">
                  <span className="text-[var(--color-ink-secondary)]">{magazineSize} Magazine{quantity > 1 ? ` x ${quantity}` : ''}</span>
                  <span className="font-[family-name:var(--font-mono)] text-[var(--color-ink)]">{formatCents(subtotalCents)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[length:var(--text-body)]">
                <span className="text-[var(--color-ink-secondary)]">Shipping</span>
                <span className="font-[family-name:var(--font-mono)] text-[var(--color-ink)]">{isFreeOrder ? 'Free' : formatCents(SHIPPING_CENTS)}</span>
              </div>
              <div className="h-px bg-[var(--color-border)]" />
              <div className="flex items-center justify-between">
                <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">Total</span>
                <span className={`font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] ${isFreeOrder ? 'text-[var(--color-developed)]' : 'text-[var(--color-ink)]'}`}>
                  {isFreeOrder ? 'Free' : formatCents(totalCents)}
                </span>
              </div>
            </div>
          </Card>

          {isFreeOrder && (
            <div className="px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-sharp)] bg-[var(--color-developed)]/10">
              <p className="text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-semibold text-[var(--color-developed)]">
                Your first roll prints are on us!
              </p>
            </div>
          )}

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
          <Card>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mb-[var(--space-element)]">
              Order Summary
            </h2>

            <div className="flex flex-col gap-[var(--space-element)]">
              {/* Product details */}
              <div className="grid grid-cols-2 gap-[var(--space-tight)] text-[length:var(--text-body)]">
                <span className="text-[var(--color-ink-secondary)]">Product</span>
                <span className="text-[var(--color-ink)] text-right">
                  {orderType === 'prints' ? 'Roll Prints' : 'Roll Magazine'}
                </span>

                <span className="text-[var(--color-ink-secondary)]">Size</span>
                <span className="text-[var(--color-ink)] font-[family-name:var(--font-mono)] text-right">
                  {selectedSize}
                </span>

                <span className="text-[var(--color-ink-secondary)]">Photos</span>
                <span className="text-[var(--color-ink)] font-[family-name:var(--font-mono)] text-right">
                  {photoCount}
                </span>

                <span className="text-[var(--color-ink-secondary)]">Quantity</span>
                <span className="text-[var(--color-ink)] font-[family-name:var(--font-mono)] text-right">
                  {quantity}
                </span>

                <span className="text-[var(--color-ink-secondary)]">Roll</span>
                <span className="text-[var(--color-ink)] text-right truncate">
                  {roll.name || 'Untitled Roll'}
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
                        {orderType === 'prints'
                          ? `${photoCount} photos x ${formatCents(pricePerUnit)}${quantity > 1 ? ` x ${quantity}` : ''}`
                          : `${selectedSize} Magazine${quantity > 1 ? ` x ${quantity}` : ''}`}
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
