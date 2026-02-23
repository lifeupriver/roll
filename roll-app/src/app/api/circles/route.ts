import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parseBody, createCircleSchema } from '@/lib/validation';
import type { Circle } from '@/types/circle';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get circle IDs where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', user.id);

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    const circleIds = (memberships ?? []).map((m) => m.circle_id);

    if (circleIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch circles
    const { data: circles, error: circlesError } = await supabase
      .from('circles')
      .select('*')
      .in('id', circleIds)
      .order('created_at', { ascending: false });

    if (circlesError) {
      return NextResponse.json({ error: circlesError.message }, { status: 500 });
    }

    return NextResponse.json({ data: circles as Circle[] });
  } catch (err) {
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

    // Check that user tier is 'plus'
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.tier !== 'plus') {
      return NextResponse.json(
        { error: 'Only Plus tier users can create circles' },
        { status: 400 }
      );
    }

    const parsed = await parseBody(request, createCircleSchema);
    if (parsed.error) return parsed.error;
    const { name, coverPhotoUrl } = parsed.data;

    // Create the circle
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .insert({
        creator_id: user.id,
        name,
        cover_photo_url: coverPhotoUrl ?? null,
        member_count: 1,
      })
      .select()
      .single();

    if (circleError) {
      return NextResponse.json({ error: circleError.message }, { status: 500 });
    }

    // Add creator as a member with role 'creator'
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circle.id,
        user_id: user.id,
        role: 'creator',
      });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ data: circle as Circle }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
