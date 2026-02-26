import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/photos/batch?ids=id1,id2,id3 — fetch multiple photos by ID
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idsParam = request.nextUrl.searchParams.get('ids');
  if (!idsParam) {
    return NextResponse.json({ error: 'ids parameter required' }, { status: 400 });
  }

  const ids = idsParam.split(',').filter(Boolean).slice(0, 200);
  if (ids.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, storage_key, thumbnail_url, width, height')
    .eq('user_id', user.id)
    .in('id', ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: photos ?? [] });
}
