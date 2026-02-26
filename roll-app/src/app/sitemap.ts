import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://roll.photos';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Fetch published blog posts via service-role client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return staticPages;

  try {
    const supabase = createClient(url, key);

    // Fetch active blog authors
    const { data: authors } = await supabase
      .from('profiles')
      .select('blog_slug')
      .eq('blog_enabled', true)
      .not('blog_slug', 'is', null);

    const authorPages: MetadataRoute.Sitemap = (authors || []).map(
      (a: Record<string, unknown>) => ({
        url: `${baseUrl}/blog/${a.blog_slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })
    );

    // Fetch published posts with their author slug
    const { data: posts } = await supabase
      .from('blog_posts')
      .select(`
        slug, published_at, updated_at,
        profiles:user_id(blog_slug)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1000);

    const postPages: MetadataRoute.Sitemap = (posts || [])
      .filter((p: Record<string, unknown>) => {
        const profile = p.profiles as Record<string, unknown> | null;
        return profile?.blog_slug;
      })
      .map((p: Record<string, unknown>) => {
        const profile = p.profiles as Record<string, unknown>;
        return {
          url: `${baseUrl}/blog/${profile.blog_slug}/${p.slug}`,
          lastModified: new Date((p.updated_at as string) || (p.published_at as string)),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      });

    return [...staticPages, ...authorPages, ...postPages];
  } catch {
    return staticPages;
  }
}
