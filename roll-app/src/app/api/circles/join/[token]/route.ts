import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up the invite by token
    const { data: invite, error: inviteError } = await supabase
      .from('circle_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
    }

    // Verify invite is not expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    }

    // Verify invite is not already consumed
    if (invite.consumed_at) {
      return NextResponse.json({ error: 'Invite has already been used' }, { status: 400 });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('circle_members')
      .select('id')
      .eq('circle_id', invite.circle_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this circle' },
        { status: 400 }
      );
    }

    // Add user to circle_members
    const { error: memberError } = await supabase.from('circle_members').insert({
      circle_id: invite.circle_id,
      user_id: user.id,
      role: 'member',
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Mark invite as consumed
    const { error: consumeError } = await supabase
      .from('circle_invites')
      .update({
        consumed_at: new Date().toISOString(),
        consumed_by: user.id,
      })
      .eq('id', invite.id);

    if (consumeError) {
      return NextResponse.json({ error: consumeError.message }, { status: 500 });
    }

    // Increment circle's member_count
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select('member_count, name')
      .eq('id', invite.circle_id)
      .single();

    if (circleError || !circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('circles')
      .update({ member_count: circle.member_count + 1 })
      .eq('id', invite.circle_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        circleId: invite.circle_id,
        circleName: circle.name,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
