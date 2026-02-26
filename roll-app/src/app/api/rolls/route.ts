import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, createRollSchema } from '@/lib/validation';
import type { Roll } from '@/types/roll';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('rolls')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data as Roll[] });
  } catch (err) {
    captureError(err, { context: 'rolls' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const parsed = await parseBody(request, createRollSchema);
    if (parsed.error) return parsed.error;
    const { name } = parsed.data;

    // Auto-generate name from current date if not provided
    // Format: "Month Day–Day" (e.g., "February 12–18")
    let rollName = name;
    if (!rollName) {
      const now = new Date();
      const month = now.toLocaleString('en-US', { month: 'long' });
      const startDay = now.getDate();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 6);
      const endDay = endDate.getDate();

      if (endDate.getMonth() === now.getMonth()) {
        rollName = `${month} ${startDay}\u2013${endDay}`;
      } else {
        const endMonth = endDate.toLocaleString('en-US', { month: 'long' });
        rollName = `${month} ${startDay}\u2013${endMonth} ${endDay}`;
      }
    }

    const { data, error } = await supabase
      .from('rolls')
      .insert({
        user_id: user.id,
        name: rollName,
        status: 'building',
        max_photos: 36,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data as Roll }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'rolls' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
