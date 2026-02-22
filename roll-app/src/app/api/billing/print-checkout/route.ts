import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStripe, getOrCreateCustomer } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { orderId, photoCount, printSize, isFreeFirstRoll } = await request.json();

    if (isFreeFirstRoll) {
      return NextResponse.json({ error: 'Free orders do not require payment' }, { status: 400 });
    }

    // Calculate price in cents
    const pricePerPrint = printSize === '5x7' ? 75 : 30; // $0.75 or $0.30
    const subtotal = photoCount * pricePerPrint;
    const shipping = 499; // $4.99
    const total = subtotal + shipping;

    const customerId = await getOrCreateCustomer(
      user.id,
      profile.email,
      profile.stripe_customer_id
    );

    if (!profile.stripe_customer_id) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Roll Prints - ${photoCount} photos (${printSize})`,
              description: `${photoCount} ${printSize} glossy prints`,
            },
            unit_amount: total,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/orders?payment=success&orderId=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/orders?payment=cancelled`,
      metadata: {
        userId: user.id,
        orderId,
        type: 'print_order',
      },
    });

    return NextResponse.json({ data: { url: session.url } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
