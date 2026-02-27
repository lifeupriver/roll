'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Grid3X3 } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { PhotoLightbox } from '@/components/photo/PhotoLightbox';
import Image from 'next/image';

interface MemberProfile {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface SharedPhoto {
  id: string;
  storage_key: string;
  thumbnail_url: string;
  date_taken: string | null;
  camera_make: string | null;
  camera_model: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const _router = useRouter();
  const memberId = params.id;

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [photos, setPhotos] = useState<SharedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      // Fetch member profile
      const profileRes = await fetch(`/api/circles/member/${memberId}`);
      if (profileRes.ok) {
        const { data } = await profileRes.json();
        setProfile(data.profile);
        setPhotos(data.photos ?? []);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.email || 'Member';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <BackButton />
        <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)]">
          Profile
        </span>
      </div>

      {/* Profile header */}
      <div className="flex items-center gap-[var(--space-component)]">
        <div className="w-20 h-20 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={80}
              height={80}
              className="w-full h-full rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-[length:var(--text-title)] font-medium text-[var(--color-action)]">
              {initial}
            </span>
          )}
        </div>
        <div>
          <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
            {displayName}
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
            {photos.length} shared photo{photos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <Empty
          icon={Grid3X3}
          title="No shared photos"
          description="This member hasn't shared any photos to your circles yet."
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-0.5">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="relative aspect-square bg-[var(--color-surface-sunken)] overflow-hidden"
              >
                <Image
                  src={photo.thumbnail_url}
                  alt=""
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  unoptimized
                />
              </button>
            ))}
          </div>

          {lightboxIndex !== null && (
            <PhotoLightbox
              photos={photos}
              initialIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              mode="circle"
            />
          )}
        </>
      )}
    </div>
  );
}
