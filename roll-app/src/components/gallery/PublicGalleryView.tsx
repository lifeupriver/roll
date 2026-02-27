'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { GalleryHeader } from './GalleryHeader';
import type { PublicGallery } from '@/types/gallery';

interface PublicGalleryViewProps {
  gallery: PublicGallery;
}

export function PublicGalleryView({ gallery }: PublicGalleryViewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <GalleryHeader
        businessName={gallery.business_name}
        logoUrl={gallery.business_logo_url}
        accentColor={gallery.settings.accent_color}
      />

      {/* Title */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#1a1a1a]">
          {gallery.title}
        </h1>
        {gallery.description && <p className="text-[#666] mt-2">{gallery.description}</p>}
        <p className="text-[#999] text-sm mt-1">{gallery.photo_count} photos</p>
      </div>

      {/* Photo grid */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-2">
          {gallery.photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="block w-full mb-2 break-inside-avoid overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
            >
              <Image
                src={photo.thumbnail_url}
                alt={photo.caption || ''}
                width={photo.width || 400}
                height={photo.height || 300}
                loading="lazy"
                className="w-full"
                style={{
                  aspectRatio:
                    photo.width && photo.height ? `${photo.width}/${photo.height}` : undefined,
                }}
                unoptimized
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          <img
            src={
              gallery.photos[lightboxIndex]?.developed_url ||
              gallery.photos[lightboxIndex]?.thumbnail_url
            }
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {gallery.photos[lightboxIndex]?.caption && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 text-sm max-w-lg text-center">
              {gallery.photos[lightboxIndex].caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
