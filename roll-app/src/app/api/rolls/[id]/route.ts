import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, updateRollSchema } from '@/lib/validation';
import type { Roll, RollStatus, RollPhoto } from '@/types/roll';

const VALID_STATUS_TRANSITIONS: Record<RollStatus, RollStatus[]> = {
  building: ['ready'],
  ready: ['processing', 'building'],
  processing: ['developed', 'error'],
  developed: ['archived'],
  error: ['processing'],
  archived: [],
};

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

    // Fetch roll and verify ownership
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (rollError || !roll) {
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    // Fetch roll photos with joined photo data, ordered by position
    const { data: photos, error: photosError } = await supabase
      .from('roll_photos')
      .select('*, photos(*)')
      .eq('roll_id', id)
      .order('position', { ascending: true });

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        roll: roll as Roll,
        photos: (photos ?? []) as RollPhoto[],
      },
    });
  } catch (err) {
    captureError(err, { context: 'roll-detail' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Fetch current roll to validate ownership and status transitions
    const { data: existingRoll, error: fetchError } = await supabase
      .from('rolls')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingRoll) {
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    const parsed = await parseBody(request, updateRollSchema);
    if (parsed.error) return parsed.error;
    const { name, status, film_profile } = parsed.data;

    // Validate status transition if status is being changed
    if (status) {
      const currentStatus = existingRoll.status as RollStatus;
      const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from '${currentStatus}' to '${status}'`,
            message: `Allowed transitions from '${currentStatus}': ${allowedTransitions.join(', ') || 'none'}`,
          },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (film_profile !== undefined) updateData.film_profile = film_profile;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('rolls')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data as Roll });
  } catch (err) {
    captureError(err, { context: 'roll-detail' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
