import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, updateCircleBodySchema } from '@/lib/validation';
import type { Circle, CircleMember } from '@/types/circle';

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

    // Fetch the circle
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select('*')
      .eq('id', id)
      .single();

    if (circleError || !circle) {
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

    return NextResponse.json({
      data: {
        circle: circle as Circle,
        members: (members ?? []) as CircleMember[],
      },
    });
  } catch (err) {
    captureError(err, { context: 'circle-detail' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
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
      return NextResponse.json({ error: 'Only the creator can update the circle' }, { status: 403 });
    }

    const parsed = await parseBody(request, updateCircleBodySchema);
    if (parsed.error) return parsed.error;
    const { name, coverPhotoUrl } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (coverPhotoUrl !== undefined) updateData.cover_photo_url = coverPhotoUrl;

    const { data: circle, error: updateError } = await supabase
      .from('circles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: circle as Circle });
  } catch (err) {
    captureError(err, { context: 'circle-detail' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
