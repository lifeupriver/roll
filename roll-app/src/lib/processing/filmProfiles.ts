export interface FilmProfileConfig {
  id: string;
  name: string;
  type: 'color' | 'bw';
  grainOpacity: number;
  vignetteIntensity: number;
  exposureBias: { brightness: number; saturation: number };
}

export const FILM_PROFILE_CONFIGS: Record<string, FilmProfileConfig> = {
  warmth: {
    id: 'warmth',
    name: 'Warmth',
    type: 'color',
    grainOpacity: 0.06,
    vignetteIntensity: 0.15,
    exposureBias: { brightness: 1.05, saturation: 1.1 },
  },
  golden: {
    id: 'golden',
    name: 'Golden',
    type: 'color',
    grainOpacity: 0.08,
    vignetteIntensity: 0.2,
    exposureBias: { brightness: 1.08, saturation: 1.15 },
  },
  vivid: {
    id: 'vivid',
    name: 'Vivid',
    type: 'color',
    grainOpacity: 0.04,
    vignetteIntensity: 0.1,
    exposureBias: { brightness: 1.02, saturation: 1.3 },
  },
  classic: {
    id: 'classic',
    name: 'Classic',
    type: 'bw',
    grainOpacity: 0.15,
    vignetteIntensity: 0.25,
    exposureBias: { brightness: 0.95, saturation: 0 },
  },
  gentle: {
    id: 'gentle',
    name: 'Gentle',
    type: 'bw',
    grainOpacity: 0.08,
    vignetteIntensity: 0.12,
    exposureBias: { brightness: 1.1, saturation: 0 },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    type: 'bw',
    grainOpacity: 0.03,
    vignetteIntensity: 0.08,
    exposureBias: { brightness: 1.0, saturation: 0 },
  },
};
