// QR code generation for prints
// Phase 4.1.3: Link printed photos to their digital story

/**
 * Generate a QR code data URL for a photo's story page.
 * Returns an SVG data URI that can be printed on the back of a photo.
 */
export function generateStoryQRUrl(photoId: string, appUrl?: string): string {
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://roll.photos';
  return `${baseUrl}/story/${photoId}`;
}

/**
 * Generate a simple QR code as SVG string.
 * Uses a minimal QR encoding — for production, use the 'qrcode' npm package.
 */
export function generateQRSvg(url: string, size: number = 100): string {
  // Placeholder: In production, use the qrcode library
  // For now, return a simple SVG with the URL encoded
  const encoded = encodeURIComponent(url);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#333">
      QR: ${encoded.slice(0, 20)}...
    </text>
  </svg>`;
}

/**
 * Build print-ready back content for a photo.
 * Includes QR code, caption, and Roll branding.
 */
export function buildPrintBackContent(params: {
  photoId: string;
  caption?: string;
  takenAt?: string;
  appUrl?: string;
}): { qrUrl: string; html: string } {
  const { photoId, caption, takenAt, appUrl } = params;
  const storyUrl = generateStoryQRUrl(photoId, appUrl);

  const html = `
    <div style="font-family: -apple-system, sans-serif; padding: 12px; text-align: center;">
      <div style="margin-bottom: 8px;">
        ${generateQRSvg(storyUrl, 80)}
      </div>
      ${caption ? `<p style="font-size: 10px; color: #333; margin: 4px 0;">${caption}</p>` : ''}
      ${takenAt ? `<p style="font-size: 8px; color: #999;">${new Date(takenAt).toLocaleDateString()}</p>` : ''}
      <p style="font-size: 7px; color: #ccc; margin-top: 8px;">Scan to see the full story on Roll</p>
    </div>
  `;

  return { qrUrl: storyUrl, html };
}
