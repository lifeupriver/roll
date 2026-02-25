import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role config');
  return createClient(url, key);
}

interface StoryData {
  photo: {
    id: string;
    developed_url: string;
    thumbnail_url: string;
    width: number;
    height: number;
    taken_at?: string;
    camera_make?: string;
    camera_model?: string;
    film_profile?: string;
  };
  caption?: string;
  reelUrl?: string;
}

async function fetchStory(photoId: string): Promise<StoryData | null> {
  const supabase = getServiceSupabase();

  const { data: photo } = await supabase
    .from('photos')
    .select('id, developed_url, thumbnail_url, width, height, taken_at, camera_make, camera_model, film_profile')
    .eq('id', photoId)
    .single();

  if (!photo) return null;

  // Get caption from roll_photos
  const { data: rollPhoto } = await supabase
    .from('roll_photos')
    .select('caption')
    .eq('photo_id', photoId)
    .limit(1)
    .single();

  // Check if there's a linked reel containing this photo
  const { data: reelClip } = await supabase
    .from('reel_clips')
    .select('reel_id, reels(assembled_storage_key, status)')
    .eq('photo_id', photoId)
    .limit(1)
    .single();

  let reelUrl: string | undefined;
  if (reelClip) {
    const reel = reelClip.reels as unknown as Record<string, unknown> | null;
    if (reel?.status === 'developed' && reel?.assembled_storage_key) {
      reelUrl = reel.assembled_storage_key as string;
    }
  }

  return {
    photo: photo as StoryData['photo'],
    caption: rollPhoto?.caption || undefined,
    reelUrl,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await fetchStory(id);
  return {
    title: story?.caption ? `${story.caption.slice(0, 50)} — Roll` : 'Photo Story — Roll',
    description: story?.caption || 'A photo story on Roll',
    openGraph: {
      images: story?.photo.developed_url ? [{ url: story.photo.developed_url }] : [],
    },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await fetchStory(id);

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Photo Not Found</h1>
          <p className="text-[#666]">This photo may have been removed or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roll.photos';

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#eee] px-4 py-3 flex items-center justify-between">
        <a href={appUrl} className="font-semibold text-sm text-[#1a1a1a]">
          Roll
        </a>
        <span className="text-xs text-[#999]">Photo Story</span>
      </header>

      {/* Photo */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-xl overflow-hidden shadow-lg bg-white">
          <img
            src={story.photo.developed_url || story.photo.thumbnail_url}
            alt={story.caption || 'Photo'}
            className="w-full"
            style={{
              aspectRatio: story.photo.width && story.photo.height
                ? `${story.photo.width}/${story.photo.height}`
                : undefined,
            }}
          />
        </div>

        {/* Caption & metadata */}
        <div className="mt-6 space-y-3">
          {story.caption && (
            <p className="text-lg text-[#1a1a1a] leading-relaxed">{story.caption}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-[#999]">
            {story.photo.taken_at && (
              <span>{new Date(story.photo.taken_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}</span>
            )}
            {story.photo.camera_make && (
              <span>{story.photo.camera_make} {story.photo.camera_model || ''}</span>
            )}
            {story.photo.film_profile && (
              <span className="capitalize">{story.photo.film_profile} film</span>
            )}
          </div>
        </div>

        {/* Linked video */}
        {story.reelUrl && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-[#666] uppercase tracking-wider mb-3">
              Video
            </h2>
            <video
              src={story.reelUrl}
              controls
              playsInline
              className="w-full rounded-xl shadow-lg"
              poster={story.photo.thumbnail_url}
            />
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#999] mb-3">Develop your own photos with film-like color</p>
          <a
            href={appUrl}
            className="inline-block px-6 py-2.5 bg-[#1a1a1a] text-white text-sm font-medium rounded-full hover:bg-[#333] transition-colors"
          >
            Try Roll Free
          </a>
        </div>
      </div>
    </div>
  );
}
