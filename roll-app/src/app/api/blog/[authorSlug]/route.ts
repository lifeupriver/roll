import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

// GET /api/blog/[authorSlug] — public author profile + published posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string }> }
) {
  try {
    const { authorSlug } = await params;
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

    // Pagination
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = 12;
    const offset = (page - 1) * limit;

    // Count total published posts
    const { count } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('status', 'published');

    // Fetch published posts with cover photo
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select(`
        id, title, slug, excerpt, published_at, cover_photo_id, tags, view_count,
        photos:cover_photo_id(thumbnail_url, developed_url, width, height)
      `)
      .eq('user_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
    }

    // Count total photos across all published rolls
    const rollIds = posts?.map((p: Record<string, unknown>) => p.id) || [];
    let totalPhotos = 0;
    if (rollIds.length > 0) {
      const postIds = posts?.map((p: Record<string, unknown>) => p.id as string) || [];
      if (postIds.length > 0) {
        const { data: blogPostsWithRolls } = await supabase
          .from('blog_posts')
          .select('roll_id')
          .eq('user_id', profile.id)
          .eq('status', 'published');

        const publishedRollIds = (blogPostsWithRolls || []).map((bp: Record<string, unknown>) => bp.roll_id as string);
        if (publishedRollIds.length > 0) {
          const { count: photoCount } = await supabase
            .from('roll_photos')
            .select('id', { count: 'exact', head: true })
            .in('roll_id', publishedRollIds);
          totalPhotos = photoCount || 0;
        }
      }
    }

    return NextResponse.json({
      data: {
        author: {
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          blog_slug: profile.blog_slug,
          blog_name: profile.blog_name,
          blog_description: profile.blog_description,
        },
        posts: (posts || []).map((post: Record<string, unknown>) => {
          const photo = post.photos as Record<string, unknown> | null;
          return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            published_at: post.published_at,
            tags: post.tags,
            view_count: post.view_count,
            cover_photo: photo ? {
              thumbnail_url: photo.thumbnail_url,
              developed_url: photo.developed_url,
              width: photo.width,
              height: photo.height,
            } : null,
          };
        }),
        total_posts: count || 0,
        total_photos: totalPhotos,
        page,
        has_more: offset + limit < (count || 0),
      },
    });
  } catch (err) {
    captureError(err, { context: 'public-blog-author' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
