import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStripe, STRIPE_CONFIG, getOrCreateCustomer } from '@/lib/stripe';
import { captureError } from '@/lib/sentry';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, tier, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { successUrl, cancelUrl, tier: requestedTier } = await request.json();
    const targetTier = requestedTier === 'pro' ? 'pro' : 'plus';

    if (profile.tier === targetTier) {
      return NextResponse.json(
        { error: `Already subscribed to Roll ${targetTier === 'pro' ? 'Pro' : '+'}` },
        { status: 400 }
      );
    }

    // Can't downgrade via checkout — use billing portal
    if (profile.tier === 'pro' && targetTier === 'plus') {
      return NextResponse.json(
        { error: 'Use billing portal to change your plan' },
        { status: 400 }
      );
    }

    const customerId = await getOrCreateCustomer(
      user.id,
      profile.email,
      profile.stripe_customer_id
    );

    // Save customer ID if it's new
    if (!profile.stripe_customer_id) {
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const priceId = targetTier === 'pro' ? STRIPE_CONFIG.priceIdPro : STRIPE_CONFIG.priceIdPlus;

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/account?subscription=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/account?subscription=cancelled`,
      metadata: {
        userId: user.id,
        tier: targetTier,
      },
    });

    return NextResponse.json({ data: { url: session.url } });
  } catch (err) {
    captureError(err, { context: 'subscription-checkout' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
