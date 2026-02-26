import { PublicGalleryView } from '@/components/gallery/PublicGalleryView';
import type { PublicGallery } from '@/types/gallery';
import Link from 'next/link';

interface GalleryData extends PublicGallery {
  blog_slug?: string | null;
}

async function fetchGallery(slug: string): Promise<GalleryData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/gallery/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await fetchGallery(slug);
  return {
    title: gallery
      ? `${gallery.title} — ${gallery.business_name || 'Roll Gallery'}`
      : 'Gallery Not Found',
    description: gallery?.description || 'A photo gallery on Roll',
  };
}

export default async function PublicGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await fetchGallery(slug);

  if (!gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Gallery Not Found</h1>
          <p className="text-[#666]">
            This gallery may have been removed or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {gallery.blog_slug && (
        <div className="bg-[#f5f0eb] border-b border-[#e5ddd4] px-4 py-3 text-center">
          <p className="text-sm text-[#6b5c4d]">
            This photographer now has a blog!{' '}
            <Link
              href={`/blog/${gallery.blog_slug}`}
              className="font-medium text-[#c45d3e] hover:underline"
            >
              Visit their blog &rarr;
            </Link>
          </p>
        </div>
      )}
      <PublicGalleryView gallery={gallery} />
    </>
  );
}
