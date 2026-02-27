import type { Metadata } from 'next';
import { getServiceClient } from '@/lib/admin/service';
import { BlogAuthorHeader } from '@/components/blog/BlogAuthorHeader';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { User, Rss } from 'lucide-react';

interface PageProps {
  params: Promise<{ authorSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function fetchAuthorData(authorSlug: string, page: number) {
  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, blog_slug, blog_name, blog_description, blog_enabled')
    .eq('blog_slug', authorSlug)
    .eq('blog_enabled', true)
    .single();

  if (!profile) return null;

  const limit = 12;
  const offset = (page - 1) * limit;

  const { count } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('status', 'published');

  const { data: posts } = await supabase
    .from('blog_posts')
    .select(
      `
      id, title, slug, excerpt, published_at, cover_photo_id, tags, view_count,
      photos:cover_photo_id(thumbnail_url, developed_url, width, height)
    `
    )
    .eq('user_id', profile.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Count total photos
  const { data: blogPostsWithRolls } = await supabase
    .from('blog_posts')
    .select('roll_id')
    .eq('user_id', profile.id)
    .eq('status', 'published');

  let totalPhotos = 0;
  const publishedRollIds = (blogPostsWithRolls || []).map(
    (bp: Record<string, unknown>) => bp.roll_id as string
  );
  if (publishedRollIds.length > 0) {
    const { count: photoCount } = await supabase
      .from('roll_photos')
      .select('id', { count: 'exact', head: true })
      .in('roll_id', publishedRollIds);
    totalPhotos = photoCount || 0;
  }

  return {
    author: {
      display_name: profile.display_name as string,
      avatar_url: profile.avatar_url as string | null,
      blog_slug: profile.blog_slug as string,
      blog_name: profile.blog_name as string | null,
      blog_description: profile.blog_description as string | null,
    },
    posts: (posts || []).map((post: Record<string, unknown>) => {
      const photo = post.photos as Record<string, unknown> | null;
      return {
        id: post.id as string,
        title: post.title as string,
        slug: post.slug as string,
        excerpt: post.excerpt as string | null,
        published_at: post.published_at as string,
        tags: (post.tags as string[]) || [],
        cover_photo: photo
          ? {
              thumbnail_url: photo.thumbnail_url as string,
              developed_url: photo.developed_url as string,
              width: photo.width as number,
              height: photo.height as number,
            }
          : null,
      };
    }),
    totalPosts: count || 0,
    totalPhotos,
    page,
    hasMore: offset + limit < (count || 0),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { authorSlug } = await params;
  const data = await fetchAuthorData(authorSlug, 1);

  if (!data) {
    return { title: 'Blog Not Found — Roll' };
  }

  const blogName = data.author.blog_name || `${data.author.display_name}'s Blog`;
  const description =
    data.author.blog_description || `Photo stories by ${data.author.display_name}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roll.photos';
  const canonicalUrl = `${baseUrl}/blog/${authorSlug}`;

  return {
    title: `${blogName} — Roll`,
    description,
    alternates: {
      canonical: canonicalUrl,
      types: {
        'application/rss+xml': `${baseUrl}/api/blog/${authorSlug}/rss`,
      },
    },
    openGraph: {
      title: blogName,
      description,
      url: canonicalUrl,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: blogName,
      description,
    },
  };
}

export default async function AuthorBlogPage({ params, searchParams }: PageProps) {
  const { authorSlug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || '1', 10));

  const data = await fetchAuthorData(authorSlug, page);

  if (!data) {
    return notFound();
  }

  const blogName = data.author.blog_name || `${data.author.display_name}'s Blog`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roll.photos';

  return (
    <>
      {/* JSON-LD ProfilePage + Person schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            mainEntity: {
              '@type': 'Person',
              name: data.author.display_name,
              url: `${baseUrl}/blog/${authorSlug}`,
              image: data.author.avatar_url || undefined,
            },
          }),
        }}
      />

      <div className="min-h-screen bg-[var(--color-surface)]">
        <BlogAuthorHeader
          displayName={data.author.display_name}
          avatarUrl={data.author.avatar_url}
          blogName={data.author.blog_name}
          blogSlug={data.author.blog_slug}
          showSubscribe={false}
        />

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-[var(--space-component)] py-[var(--space-section)]">
          <div className="flex items-start gap-[var(--space-component)]">
            {data.author.avatar_url ? (
              <Image
                src={data.author.avatar_url}
                alt={data.author.display_name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center shrink-0">
                <User size={24} className="text-[var(--color-ink-tertiary)]" />
              </div>
            )}
            <div>
              <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                {blogName}
              </h1>
              {data.author.blog_description && (
                <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] mt-[var(--space-micro)]">
                  {data.author.blog_description}
                </p>
              )}
              <div className="flex items-center gap-[var(--space-element)] mt-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                <span>{data.totalPosts} posts</span>
                <span>&middot;</span>
                <span>{data.totalPhotos} photos</span>
              </div>
              <div className="flex items-center gap-[var(--space-element)] mt-[var(--space-element)]">
                <a
                  href={`/blog/${authorSlug}#subscribe`}
                  className="text-[length:var(--text-caption)] text-[var(--color-action)] hover:underline min-h-[44px] flex items-center"
                >
                  Subscribe by Email
                </a>
                <a
                  href={`/api/blog/${authorSlug}/rss`}
                  className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors min-h-[44px] flex items-center gap-1"
                >
                  <Rss size={12} />
                  RSS
                </a>
              </div>
            </div>
          </div>

          {/* Posts grid */}
          <section className="mt-[var(--space-section)]">
            {data.posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--space-component)]">
                {data.posts.map(
                  (post: {
                    id: string;
                    title: string;
                    slug: string;
                    excerpt: string | null;
                    published_at: string;
                    tags: string[];
                    cover_photo: {
                      thumbnail_url: string;
                      developed_url: string;
                      width: number;
                      height: number;
                    } | null;
                  }) => (
                    <BlogPostCard
                      key={post.id}
                      title={post.title}
                      slug={post.slug}
                      excerpt={post.excerpt}
                      publishedAt={post.published_at}
                      tags={post.tags}
                      coverPhoto={post.cover_photo}
                      authorSlug={authorSlug}
                    />
                  )
                )}
              </div>
            ) : (
              <p className="text-center text-[length:var(--text-body)] text-[var(--color-ink-tertiary)] py-[var(--space-section)]">
                No posts yet.
              </p>
            )}

            {/* Pagination */}
            {(data.hasMore || page > 1) && (
              <div className="flex items-center justify-center gap-[var(--space-element)] mt-[var(--space-section)]">
                {page > 1 && (
                  <a
                    href={`/blog/${authorSlug}?page=${page - 1}`}
                    className="px-[var(--space-component)] py-[var(--space-element)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] rounded-[var(--radius-card)] text-[length:var(--text-caption)] hover:bg-[var(--color-border)] transition-colors min-h-[44px] flex items-center"
                  >
                    Previous
                  </a>
                )}
                {data.hasMore && (
                  <a
                    href={`/blog/${authorSlug}?page=${page + 1}`}
                    className="px-[var(--space-component)] py-[var(--space-element)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] rounded-[var(--radius-card)] text-[length:var(--text-caption)] hover:bg-[var(--color-border)] transition-colors min-h-[44px] flex items-center"
                  >
                    Load More
                  </a>
                )}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="border-t border-[var(--color-border)] mt-[var(--space-section)] pt-[var(--space-component)]">
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center">
              &copy; {new Date().getFullYear()} {data.author.display_name} &middot; Powered by{' '}
              <a href="https://roll.photos" className="hover:underline">
                Roll
              </a>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
