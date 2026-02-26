import type { Metadata } from 'next';
import { getServiceClient } from '@/lib/admin/service';
import { BlogPostView } from '@/components/blog/BlogPostView';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ authorSlug: string; postSlug: string }>;
}

async function fetchPostData(authorSlug: string, postSlug: string) {
  const supabase = getServiceClient();

  // Find author
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, blog_slug, blog_name, blog_description, blog_enabled')
    .eq('blog_slug', authorSlug)
    .eq('blog_enabled', true)
    .single();

  if (!profile) return null;

  // Find published post
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', postSlug)
    .eq('status', 'published')
    .single();

  if (!post) return null;

  // Fetch roll photos
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
      id: (photo?.id as string) || (rp.photo_id as string),
      thumbnail_url: (photo?.thumbnail_url as string) || '',
      developed_url: (photo?.developed_url as string) || '',
      width: (photo?.width as number) || 0,
      height: (photo?.height as number) || 0,
      caption: (rp.caption as string) || null,
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

  // Fetch roll metadata
  const { data: roll } = await supabase
    .from('rolls')
    .select('theme_name')
    .eq('id', post.roll_id)
    .single();

  // Fetch comments
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
      id: c.id as string,
      body: c.body as string,
      created_at: c.created_at as string,
      author_name: (author?.display_name as string) || 'Anonymous',
      author_avatar: (author?.avatar_url as string) || null,
    };
  });

  return {
    post: {
      id: post.id as string,
      title: post.title as string,
      slug: post.slug as string,
      excerpt: post.excerpt as string | null,
      story: post.story as string | null,
      seo_title: post.seo_title as string | null,
      seo_description: post.seo_description as string | null,
      published_at: post.published_at as string,
      tags: (post.tags as string[]) || [],
      view_count: post.view_count as number,
      allow_print_orders: post.allow_print_orders as boolean,
      allow_magazine_orders: post.allow_magazine_orders as boolean,
      allow_book_orders: post.allow_book_orders as boolean,
    },
    author: {
      display_name: profile.display_name as string,
      avatar_url: profile.avatar_url as string | null,
      blog_slug: profile.blog_slug as string,
      blog_name: profile.blog_name as string | null,
      blog_description: profile.blog_description as string | null,
    },
    coverPhoto: coverPhoto as {
      id: string;
      thumbnail_url: string;
      developed_url: string;
      width: number;
      height: number;
    } | null,
    photos,
    rollTheme: (roll?.theme_name as string) || null,
    comments: formattedComments,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { authorSlug, postSlug } = await params;
  const data = await fetchPostData(authorSlug, postSlug);

  if (!data) {
    return { title: 'Post Not Found — Roll' };
  }

  const title = data.post.seo_title || data.post.title;
  const description =
    data.post.seo_description || data.post.excerpt || data.post.story?.slice(0, 160) || '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roll.photos';
  const canonicalUrl = `${baseUrl}/blog/${authorSlug}/${postSlug}`;

  return {
    title: `${title} — ${data.author.blog_name || data.author.display_name}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: data.post.published_at,
      authors: [data.author.display_name],
      tags: data.post.tags,
      images: data.coverPhoto?.developed_url
        ? [{ url: data.coverPhoto.developed_url, width: data.coverPhoto.width, height: data.coverPhoto.height }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: data.coverPhoto?.developed_url ? [data.coverPhoto.developed_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { authorSlug, postSlug } = await params;
  const data = await fetchPostData(authorSlug, postSlug);

  if (!data) {
    return notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roll.photos';

  return (
    <>
      {/* JSON-LD Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: data.post.title,
            description: data.post.excerpt || data.post.story?.slice(0, 160) || '',
            datePublished: data.post.published_at,
            author: {
              '@type': 'Person',
              name: data.author.display_name,
              url: `${baseUrl}/blog/${authorSlug}`,
            },
            publisher: {
              '@type': 'Organization',
              name: 'Roll',
              url: baseUrl,
            },
            image: data.photos.slice(0, 5).map((p: { developed_url: string }) => p.developed_url).filter(Boolean),
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${baseUrl}/blog/${authorSlug}/${postSlug}`,
            },
          }),
        }}
      />
      <BlogPostView
        post={data.post}
        author={data.author}
        coverPhoto={data.coverPhoto}
        photos={data.photos}
        photoCount={data.photos.length}
        rollTheme={data.rollTheme}
        comments={data.comments}
        commentCount={data.comments.length}
      />
    </>
  );
}
