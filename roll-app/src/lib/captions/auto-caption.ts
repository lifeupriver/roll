/**
 * Template-based auto-caption generation from photo metadata.
 * No LLM — fast, free, and private.
 */

interface PhotoMetadata {
  scene_classification?: string[];
  date_taken?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  camera_make?: string | null;
  camera_model?: string | null;
  face_count?: number;
}

function formatCaptionDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function generateDraftCaption(photo: PhotoMetadata): string {
  const parts: string[] = [];

  if (photo.scene_classification && photo.scene_classification.length > 0) {
    // Use the first scene classification, capitalize it
    const scene = photo.scene_classification[0];
    parts.push(scene.charAt(0).toUpperCase() + scene.slice(1));
  }

  if (photo.date_taken) {
    const formatted = formatCaptionDate(photo.date_taken);
    if (formatted) parts.push(formatted);
  }

  if ((photo.face_count ?? 0) > 0) {
    const count = photo.face_count!;
    parts.push(`${count} ${count === 1 ? 'person' : 'people'}`);
  }

  return parts.join(' · ');
}
