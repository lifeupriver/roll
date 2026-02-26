import { PublicGalleryView } from '@/components/gallery/PublicGalleryView';
import type { PublicGallery } from '@/types/gallery';

async function fetchGallery(slug: string): Promise<PublicGallery | null> {
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

  return <PublicGalleryView gallery={gallery} />;
}
