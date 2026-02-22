import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { circleInviteEmail } from '@/lib/email/templates';
import crypto from 'crypto';
import type { CircleInvite } from '@/types/circle';

// POST — generate invite link, optionally send email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is the creator of this circle
    const { data: membership, error: membershipError } = await supabase
      .from('circle_members')
      .select('role')
      .eq('circle_id', id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    if (membership.role !== 'creator') {
      return NextResponse.json({ error: 'Only the creator can generate invite links' }, { status: 403 });
    }

    // Generate a 32-char hex token
    const token = crypto.randomBytes(16).toString('hex');

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invite, error: inviteError } = await supabase
      .from('circle_invites')
      .insert({
        circle_id: id,
        token,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const typedInvite = invite as CircleInvite;

    // If an email was provided, send invite email
    let body: { email?: string } = {};
    try {
      body = await request.json();
    } catch {
      // No body — link-only invite
    }

    let emailSent = false;
    if (body.email) {
      // Get circle name and inviter name
      const { data: circle } = await supabase
        .from('circles')
        .select('name')
        .eq('id', id)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .single();

      if (circle && profile) {
        const inviterName = profile.display_name || profile.email;
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/circle/join/${token}`;
        const { subject, html } = circleInviteEmail(inviterName, circle.name, inviteUrl);
        emailSent = await sendEmail(body.email, subject, html);
      }
    }

    return NextResponse.json({
      data: {
        token: typedInvite.token,
        expiresAt: typedInvite.expires_at,
        emailSent,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — list invite history for this circle (creator only)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify creator
    const { data: membership } = await supabase
      .from('circle_members')
      .select('role')
      .eq('circle_id', id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'creator') {
      return NextResponse.json({ error: 'Only the creator can view invite history' }, { status: 403 });
    }

    const { data: invites, error: invitesError } = await supabase
      .from('circle_invites')
      .select('*')
      .eq('circle_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (invitesError) {
      return NextResponse.json({ error: invitesError.message }, { status: 500 });
    }

    return NextResponse.json({ data: invites ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
