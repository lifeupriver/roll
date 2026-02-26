import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

// GET /api/blog/[authorSlug]/rss — RSS 2.0 feed
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string }> }
) {
  try {
    const { authorSlug } = await params;
    const supabase = getServiceClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roll.photos';

    // Find author
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, blog_slug, blog_name, blog_description, blog_enabled')
      .eq('blog_slug', authorSlug)
      .eq('blog_enabled', true)
      .single();

    if (!profile) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Fetch latest 20 published posts
    const { data: posts } = await supabase
      .from('blog_posts')
      .select(`
        id, title, slug, excerpt, story, published_at, tags, cover_photo_id,
        photos:cover_photo_id(developed_url)
      `)
      .eq('user_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);

    const blogName = profile.blog_name || `${profile.display_name}'s Blog`;
    const blogDescription = profile.blog_description || `Photo stories by ${profile.display_name}`;
    const blogUrl = `${baseUrl}/blog/${profile.blog_slug}`;

    const escapeXml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const items = (posts || []).map((post: Record<string, unknown>) => {
      const photo = post.photos as Record<string, unknown> | null;
      const postUrl = `${baseUrl}/blog/${profile.blog_slug}/${post.slug}`;
      const description = (post.excerpt as string) || (post.story as string)?.slice(0, 300) || '';
      const pubDate = post.published_at ? new Date(post.published_at as string).toUTCString() : '';
      const tags = (post.tags as string[]) || [];

      return `    <item>
      <title>${escapeXml(post.title as string)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>${
        photo?.developed_url
          ? `\n      <enclosure url="${escapeXml(photo.developed_url as string)}" type="image/jpeg" />`
          : ''
      }${tags.map((tag: string) => `\n      <category>${escapeXml(tag)}</category>`).join('')}
    </item>`;
    });

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(blogName)}</title>
    <link>${blogUrl}</link>
    <description>${escapeXml(blogDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/blog/${profile.blog_slug}/rss" rel="self" type="application/rss+xml" />
    <generator>Roll (roll.photos)</generator>
${items.join('\n')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    captureError(err, { context: 'blog-rss' });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
