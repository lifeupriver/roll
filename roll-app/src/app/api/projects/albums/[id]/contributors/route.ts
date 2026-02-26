import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

// GET /api/projects/albums/[id]/contributors — list contributors
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

    // Verify user is a contributor or owner
    const { data: membership } = await supabase
      .from('collection_contributors')
      .select('role')
      .eq('collection_id', id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      // Check if user owns the collection directly
      const { data: collection } = await supabase
        .from('collections')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!collection || collection.user_id !== user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    const { data: contributors, error } = await supabase
      .from('collection_contributors')
      .select('id, user_id, role, added_at, profiles(display_name, email, avatar_url)')
      .eq('collection_id', id)
      .order('added_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: contributors ?? [] });
  } catch (err) {
    captureError(err, { context: 'collection-contributors-list' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects/albums/[id]/contributors — add a contributor
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Verify user is the owner of this collection
    const { data: collection } = await supabase
      .from('collections')
      .select('user_id, is_collaborative')
      .eq('id', id)
      .single();

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the book owner can add contributors' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role = 'contributor' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Mark collection as collaborative if not already
    if (!collection.is_collaborative) {
      await supabase.from('collections').update({ is_collaborative: true }).eq('id', id);
    }

    // Ensure the owner is in the contributors table
    await supabase.from('collection_contributors').upsert(
      {
        collection_id: id,
        user_id: user.id,
        role: 'owner',
      },
      { onConflict: 'collection_id,user_id' }
    );

    // Add the new contributor
    const { data: contributor, error: insertError } = await supabase
      .from('collection_contributors')
      .upsert(
        {
          collection_id: id,
          user_id: userId,
          role: role === 'owner' ? 'owner' : 'contributor',
        },
        { onConflict: 'collection_id,user_id' }
      )
      .select('id, user_id, role, added_at, profiles(display_name, email, avatar_url)')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ data: contributor }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'collection-contributors-add' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/albums/[id]/contributors — remove a contributor
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

    // Verify user is the owner
    const { data: collection } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!collection || collection.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the book owner can remove contributors' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const removeUserId = searchParams.get('userId');

    if (!removeUserId) {
      return NextResponse.json({ error: 'userId query param is required' }, { status: 400 });
    }

    // Can't remove the owner
    if (removeUserId === user.id) {
      return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('collection_contributors')
      .delete()
      .eq('collection_id', id)
      .eq('user_id', removeUserId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    captureError(err, { context: 'collection-contributors-remove' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
