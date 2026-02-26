import sharp from 'sharp';

export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).jpeg({ quality: 85, progressive: true }).toBuffer();
}

export async function createThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(400, undefined, { withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
}

export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

export async function getImageMetadata(buffer: Buffer) {
  return sharp(buffer).metadata();
}

export async function getImageStats(buffer: Buffer) {
  return sharp(buffer).stats();
}

export async function resizeImage(buffer: Buffer, maxDimension: number): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width <= maxDimension && height <= maxDimension) {
    return buffer;
  }

  return sharp(buffer)
    .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
    .toBuffer();
}

export async function generateLqip(buffer: Buffer): Promise<string> {
  const tiny = await sharp(buffer)
    .resize(20, undefined, { withoutEnlargement: true })
    .webp({ quality: 20 })
    .toBuffer();
  return `data:image/webp;base64,${tiny.toString('base64')}`;
}

export async function convertToGrayscale(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).grayscale().toBuffer();
}

export async function getLaplacianVariance(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer)
    .grayscale()
    .resize(512, 512, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian =
        -data[idx - width] - data[idx - 1] + 4 * data[idx] - data[idx + 1] - data[idx + width];
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return variance;
}
