import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { z } from 'zod';
import { parseBody } from '@/lib/validation';
import type { BlogSettings } from '@/types/blog';

const updateBlogSettingsSchema = z
  .object({
    blog_slug: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only').optional(),
    blog_name: z.string().trim().min(1).max(100).optional(),
    blog_description: z.string().max(300).optional(),
    blog_enabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('blog_slug, blog_name, blog_description, blog_enabled')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data: profile as BlogSettings });
  } catch (err) {
    captureError(err, { context: 'blog-settings-get' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, updateBlogSettingsSchema);
    if (parsed.error) return parsed.error;

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) updateData[key] = value;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select('blog_slug, blog_name, blog_description, blog_enabled')
      .single();

    if (error) {
      if (error.code === '23505' && error.message.includes('blog_slug')) {
        return NextResponse.json({ error: 'This blog URL is already taken' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: profile as BlogSettings });
  } catch (err) {
    captureError(err, { context: 'blog-settings-update' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
