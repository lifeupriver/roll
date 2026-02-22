import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { referralInviteEmail } from '@/lib/email/templates';
import crypto from 'crypto';
import type { ReferralStats } from '@/types/referral';

// GET /api/referrals — get referral stats and code for current user
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create referral code from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    let referralCode = profile?.referral_code;
    if (!referralCode) {
      referralCode = crypto.randomBytes(4).toString('hex');
      await supabase
        .from('profiles')
        .update({ referral_code: referralCode })
        .eq('id', user.id);
    }

    // Get referral stats
    const { data: referrals } = await supabase
      .from('referrals')
      .select('status')
      .eq('referrer_id', user.id);

    const stats: ReferralStats = {
      totalInvited: referrals?.length ?? 0,
      totalSignedUp: referrals?.filter((r) => r.status === 'signed_up' || r.status === 'converted').length ?? 0,
      totalConverted: referrals?.filter((r) => r.status === 'converted').length ?? 0,
      referralCode,
    };

    return NextResponse.json({ data: stats });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/referrals — send a referral invite email
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user's referral code and display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, display_name, email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let referralCode = profile.referral_code;
    if (!referralCode) {
      referralCode = crypto.randomBytes(4).toString('hex');
      await supabase
        .from('profiles')
        .update({ referral_code: referralCode })
        .eq('id', user.id);
    }

    // Check if already invited this email
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', user.id)
      .eq('referred_email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already invited this email' }, { status: 409 });
    }

    // Create referral record
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: user.id,
        referred_email: email.toLowerCase(),
        referral_code: referralCode,
        status: 'pending',
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Send referral email
    const inviterName = profile.display_name || profile.email;
    const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?ref=${referralCode}`;
    const { subject, html } = referralInviteEmail(inviterName, signupUrl);
    await sendEmail(email, subject, html);

    return NextResponse.json({ data: { sent: true } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
