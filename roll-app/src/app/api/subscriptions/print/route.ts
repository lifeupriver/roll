import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, createPrintSubscriptionSchema, updatePrintSubscriptionSchema } from '@/lib/validation';

export interface PrintSubscription {
  id: string;
  user_id: string;
  print_size: '4x6' | '5x7';
  frequency: 'monthly' | 'quarterly';
  max_photos: number;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  is_active: boolean;
  next_print_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/subscriptions/print — list user's print subscriptions
 * POST /api/subscriptions/print — create a new print subscription
 * PATCH /api/subscriptions/print — update (pause/resume/update address)
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('print_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    captureError(err, { context: 'print-subscriptions' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, createPrintSubscriptionSchema);
    if (parsed.error) return parsed.error;
    const { printSize, frequency, maxPhotos, shipping } = parsed.data;

    // Calculate next print date
    const now = new Date();
    const nextDate = new Date(now);
    if (frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 3);
    }

    const { data, error } = await supabase
      .from('print_subscriptions')
      .insert({
        user_id: user.id,
        print_size: printSize,
        frequency,
        max_photos: Math.min(maxPhotos, 36),
        shipping_name: shipping.name,
        shipping_line1: shipping.line1,
        shipping_line2: shipping.line2 || null,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_postal_code: shipping.postalCode,
        shipping_country: shipping.country || 'US',
        is_active: true,
        next_print_date: nextDate.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'print-subscriptions' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, updatePrintSubscriptionSchema);
    if (parsed.error) return parsed.error;
    const { subscriptionId, isActive, shipping } = parsed.data;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof isActive === 'boolean') {
      updates.is_active = isActive;
    }

    if (shipping) {
      if (shipping.name) updates.shipping_name = shipping.name;
      if (shipping.line1) updates.shipping_line1 = shipping.line1;
      if (shipping.line2 !== undefined) updates.shipping_line2 = shipping.line2 || null;
      if (shipping.city) updates.shipping_city = shipping.city;
      if (shipping.state) updates.shipping_state = shipping.state;
      if (shipping.postalCode) updates.shipping_postal_code = shipping.postalCode;
      if (shipping.country) updates.shipping_country = shipping.country;
    }

    const { data, error } = await supabase
      .from('print_subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    captureError(err, { context: 'print-subscriptions' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
