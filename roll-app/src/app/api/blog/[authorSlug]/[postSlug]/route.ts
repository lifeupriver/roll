import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

// GET /api/blog/[authorSlug]/[postSlug] — public published post with photos and comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string; postSlug: string }> }
) {
  try {
    const { authorSlug, postSlug } = await params;
    const supabase = getServiceClient();

    // Find author by blog_slug
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, blog_slug, blog_name, blog_description, blog_enabled')
      .eq('blog_slug', authorSlug)
      .eq('blog_enabled', true)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Find the published post by slug
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('user_id', profile.id)
      .eq('slug', postSlug)
      .eq('status', 'published')
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Fetch roll photos with their photo data
    const { data: rollPhotos } = await supabase
      .from('roll_photos')
      .select(`
        photo_id, position, caption, caption_source,
        photos(id, thumbnail_url, developed_url, width, height)
      `)
      .eq('roll_id', post.roll_id)
      .order('position', { ascending: true });

    const photos = (rollPhotos || []).map((rp: Record<string, unknown>) => {
      const photo = rp.photos as Record<string, unknown> | null;
      return {
        id: photo?.id || rp.photo_id,
        thumbnail_url: photo?.thumbnail_url || '',
        developed_url: photo?.developed_url || '',
        width: (photo?.width as number) || 0,
        height: (photo?.height as number) || 0,
        caption: rp.caption || null,
      };
    });

    // Fetch cover photo
    let coverPhoto = null;
    if (post.cover_photo_id) {
      const { data: cover } = await supabase
        .from('photos')
        .select('id, thumbnail_url, developed_url, width, height')
        .eq('id', post.cover_photo_id)
        .single();
      coverPhoto = cover;
    }

    // Fetch roll metadata (theme_name)
    const { data: roll } = await supabase
      .from('rolls')
      .select('theme_name, created_at')
      .eq('id', post.roll_id)
      .single();

    // Fetch comments with author info
    const { data: comments } = await supabase
      .from('blog_comments')
      .select(`
        id, body, created_at, user_id,
        profiles:user_id(display_name, avatar_url)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    const formattedComments = (comments || []).map((c: Record<string, unknown>) => {
      const author = c.profiles as Record<string, unknown> | null;
      return {
        id: c.id,
        body: c.body,
        created_at: c.created_at,
        author_name: author?.display_name || 'Anonymous',
        author_avatar: author?.avatar_url || null,
      };
    });

    return NextResponse.json({
      data: {
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          story: post.story,
          published_at: post.published_at,
          tags: post.tags || [],
          view_count: post.view_count,
          allow_print_orders: post.allow_print_orders,
          allow_magazine_orders: post.allow_magazine_orders,
          allow_book_orders: post.allow_book_orders,
        },
        author: {
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          blog_slug: profile.blog_slug,
          blog_name: profile.blog_name,
          blog_description: profile.blog_description,
        },
        cover_photo: coverPhoto,
        photos,
        photo_count: photos.length,
        roll_theme: roll?.theme_name || null,
        comments: formattedComments,
        comment_count: formattedComments.length,
      },
    });
  } catch (err) {
    captureError(err, { context: 'public-blog-post' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
