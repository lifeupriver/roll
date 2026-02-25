import type { Photo } from '@/types/photo';

/**
 * Generates a draft caption from photo metadata.
 * Template-based — no LLM required.
 * Assembles from: scene classification, date taken, face count.
 */
export function generateDraftCaption(photo: Photo): string {
  const parts: string[] = [];

  // Scene classification
  if (photo.scene_classification && photo.scene_classification.length > 0) {
    parts.push(formatScene(photo.scene_classification[0]));
  }

  // Date taken
  if (photo.date_taken) {
    parts.push(formatDate(photo.date_taken));
  }

  // Face count
  if (photo.face_count > 0) {
    parts.push(`${photo.face_count} ${photo.face_count === 1 ? 'person' : 'people'}`);
  }

  return parts.join(' · ');
}

function formatScene(scene: string): string {
  const sceneMap: Record<string, string> = {
    landscape: 'Outdoors',
    portrait: 'Portrait',
    selfie: 'Selfie',
    group: 'Group photo',
    family: 'Family',
    beach: 'Beach day',
    mountain: 'Mountains',
    park: 'Park',
    nature: 'Nature',
    sunset: 'Sunset',
    sunrise: 'Sunrise',
    night: 'Night',
    concert: 'Concert',
    urban: 'City',
    street: 'Street',
    food: 'Food',
    flower: 'Flowers',
    wedding: 'Wedding',
    baby: 'Baby',
    child: 'Kids',
    pet: 'Pet',
    garden: 'Garden',
    restaurant: 'Restaurant',
    travel: 'Travel',
  };

  return sceneMap[scene.toLowerCase()] || scene.charAt(0).toUpperCase() + scene.slice(1);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
