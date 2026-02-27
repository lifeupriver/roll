import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { z } from 'zod';
import { parseBody } from '@/lib/validation';
import type { BlogPost } from '@/types/blog';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

const createBlogPostSchema = z.object({
  rollId: z.string().uuid(),
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

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: (data ?? []) as BlogPost[] });
  } catch (err) {
    captureError(err, { context: 'blog-posts-list' });
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

    const parsed = await parseBody(request, createBlogPostSchema);
    if (parsed.error) return parsed.error;
    const { rollId } = parsed.data;

    // Verify roll ownership
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('id, name, theme_name, story')
      .eq('id', rollId)
      .eq('user_id', user.id)
      .single();

    if (rollError || !roll) {
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    // Check for existing draft/published post for this roll — return it instead of creating a duplicate
    const { data: existingPost, error: dupeCheckError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('roll_id', rollId)
      .eq('user_id', user.id)
      .in('status', ['draft', 'published'])
      .maybeSingle();

    if (dupeCheckError) {
      captureError(dupeCheckError, { context: 'blog-posts-dupe-check' });
      return NextResponse.json({ error: 'Failed to check for existing post' }, { status: 500 });
    }

    if (existingPost) {
      return NextResponse.json({ data: existingPost as BlogPost });
    }

    // Get the highest-scoring photo as cover
    const { data: topPhoto } = await supabase
      .from('roll_photos')
      .select('photo_id, photos(aesthetic_score)')
      .eq('roll_id', rollId)
      .order('position', { ascending: true })
      .limit(1);

    const coverPhotoId = topPhoto?.[0]?.photo_id ?? null;

    // Auto-populate fields from roll data
    const title = roll.theme_name || roll.name || 'Untitled';
    const slug = slugify(title) + '-' + Date.now().toString(36);
    const story = roll.story ?? null;
    const excerpt = story ? story.split(/[.!?]/)[0]?.trim() || null : null;

    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        user_id: user.id,
        roll_id: rollId,
        title,
        slug,
        excerpt,
        story,
        cover_photo_id: coverPhotoId,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ data: post as BlogPost }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'blog-posts-create' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
