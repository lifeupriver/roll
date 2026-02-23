import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createProdigiOrder } from '@/lib/prodigi';
import { parseBody, createOrderSchema } from '@/lib/validation';
import { orderLimiter } from '@/lib/rate-limit';
import { captureError } from '@/lib/sentry';
import type { PrintOrder, PrintOrderItem } from '@/types/print';

// ---------------------------------------------------------------------------
// GET /api/orders — list the current user's print orders
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orders, error } = await supabase
      .from('print_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: orders as PrintOrder[] });
  } catch (err) {
    captureError(err, { context: 'orders-list' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/orders — create a new print order
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimited = orderLimiter.check(user.id);
    if (rateLimited) return rateLimited;

    const parsed = await parseBody(request, createOrderSchema);
    if (parsed.error) return parsed.error;
    const { rollId, product, printSize, shipping } = parsed.data;

    // (a) Verify roll exists, belongs to user, and is developed
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('*')
      .eq('id', rollId)
      .eq('user_id', user.id)
      .single();

    if (rollError || !roll) {
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    if (roll.status !== 'developed') {
      return NextResponse.json(
        { error: 'Only developed rolls can be ordered for printing' },
        { status: 400 },
      );
    }

    // (b) Determine if this is the user's first order (free first roll)
    const { count: existingOrderCount, error: countError } = await supabase
      .from('print_orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    const isFreeFirstRoll = (existingOrderCount ?? 0) === 0;

    // (c) Fetch roll photos with processed storage keys
    const { data: rollPhotos, error: photosError } = await supabase
      .from('roll_photos')
      .select('photo_id, processed_storage_key, position')
      .eq('roll_id', rollId)
      .order('position', { ascending: true });

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    if (!rollPhotos || rollPhotos.length === 0) {
      return NextResponse.json(
        { error: 'No photos found for this roll' },
        { status: 400 },
      );
    }

    // (d) Insert the print order
    const { data: order, error: insertError } = await supabase
      .from('print_orders')
      .insert({
        user_id: user.id,
        roll_id: rollId,
        product,
        print_size: printSize,
        photo_count: rollPhotos.length,
        is_free_first_roll: isFreeFirstRoll,
        shipping_name: shipping.name,
        shipping_line1: shipping.line1,
        shipping_line2: shipping.line2 || null,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_postal_code: shipping.postalCode,
        shipping_country: shipping.country,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Insert print order items
    const orderItems = rollPhotos.map((rp) => ({
      order_id: order.id,
      photo_id: rp.photo_id,
      processed_storage_key: rp.processed_storage_key,
      position: rp.position,
    }));

    const { error: itemsError } = await supabase
      .from('print_order_items')
      .insert(orderItems);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // (e) Submit to Prodigi (or simulate)
    const prodigiResponse = await createProdigiOrder(
      order as PrintOrder,
      orderItems as PrintOrderItem[],
    );

    // (f) Update order with Prodigi details
    const newStatus = prodigiResponse.status === 'simulated' ? 'simulated' : 'submitted';

    const { data: updatedOrder, error: updateError } = await supabase
      .from('print_orders')
      .update({
        prodigi_order_id: prodigiResponse.id,
        status: newStatus,
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // (g) Return the created order
    return NextResponse.json(
      { data: updatedOrder as PrintOrder },
      { status: 201 },
    );
  } catch (err) {
    captureError(err, { context: 'orders-create' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
