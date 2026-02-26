import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, removeMemberSchema } from '@/lib/validation';
import type { CircleMember } from '@/types/circle';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member of this circle
    const { data: membership, error: membershipError } = await supabase
      .from('circle_members')
      .select('id')
      .eq('circle_id', id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Fetch members with profile info
    const { data: members, error: membersError } = await supabase
      .from('circle_members')
      .select('*, profiles(display_name, email, avatar_url)')
      .eq('circle_id', id)
      .order('joined_at', { ascending: true });

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    return NextResponse.json({ data: (members ?? []) as CircleMember[] });
  } catch (err) {
    captureError(err, { context: 'circle-members' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, removeMemberSchema);
    if (parsed.error) return parsed.error;
    const { userId } = parsed.data;

    // Check the requesting user's role
    const { data: myMembership, error: myMembershipError } = await supabase
      .from('circle_members')
      .select('role')
      .eq('circle_id', id)
      .eq('user_id', user.id)
      .single();

    if (myMembershipError || !myMembership) {
      return NextResponse.json({ error: 'You are not a member of this circle' }, { status: 404 });
    }

    // Creators can remove other members; regular members can only remove themselves
    if (userId !== user.id && myMembership.role !== 'creator') {
      return NextResponse.json({ error: 'Only the creator can remove members' }, { status: 403 });
    }

    // Creators cannot be removed
    if (userId === user.id && myMembership.role === 'creator') {
      return NextResponse.json({ error: 'The creator cannot leave the circle' }, { status: 400 });
    }

    // If removing another user, verify they're not the creator
    if (userId !== user.id) {
      const { data: targetMembership } = await supabase
        .from('circle_members')
        .select('role')
        .eq('circle_id', id)
        .eq('user_id', userId)
        .single();

      if (!targetMembership) {
        return NextResponse.json({ error: 'User is not a member of this circle' }, { status: 404 });
      }
    }

    // Remove from circle_members
    const { error: deleteError } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', id)
      .eq('user_id', userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Decrement member_count
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select('member_count')
      .eq('id', id)
      .single();

    if (circleError || !circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('circles')
      .update({ member_count: Math.max(0, circle.member_count - 1) })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    captureError(err, { context: 'circle-members' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
