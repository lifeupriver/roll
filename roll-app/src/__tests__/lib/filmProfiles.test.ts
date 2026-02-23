import { describe, it, expect } from 'vitest';
import { FILM_PROFILE_CONFIGS, type FilmProfileConfig } from '@/lib/processing/filmProfiles';

const EXPECTED_PROFILES = ['warmth', 'golden', 'vivid', 'classic', 'gentle', 'modern'];

describe('FILM_PROFILE_CONFIGS', () => {
  it('contains all expected profiles', () => {
    for (const id of EXPECTED_PROFILES) {
      expect(FILM_PROFILE_CONFIGS[id]).toBeDefined();
    }
  });

  it('each profile has matching id field', () => {
    for (const [key, config] of Object.entries(FILM_PROFILE_CONFIGS)) {
      expect(config.id).toBe(key);
    }
  });

  it('each profile has a non-empty name', () => {
    for (const config of Object.values(FILM_PROFILE_CONFIGS)) {
      expect(config.name.length).toBeGreaterThan(0);
    }
  });

  it('each profile has valid type (color or bw)', () => {
    for (const config of Object.values(FILM_PROFILE_CONFIGS)) {
      expect(['color', 'bw']).toContain(config.type);
    }
  });

  it('grainOpacity is between 0 and 1 for all profiles', () => {
    for (const config of Object.values(FILM_PROFILE_CONFIGS)) {
      expect(config.grainOpacity).toBeGreaterThanOrEqual(0);
      expect(config.grainOpacity).toBeLessThanOrEqual(1);
    }
  });

  it('vignetteIntensity is between 0 and 1 for all profiles', () => {
    for (const config of Object.values(FILM_PROFILE_CONFIGS)) {
      expect(config.vignetteIntensity).toBeGreaterThanOrEqual(0);
      expect(config.vignetteIntensity).toBeLessThanOrEqual(1);
    }
  });

  it('bw profiles have zero saturation', () => {
    for (const config of Object.values(FILM_PROFILE_CONFIGS)) {
      if (config.type === 'bw') {
        expect(config.exposureBias.saturation).toBe(0);
      }
    }
  });

  it('color profiles have positive saturation', () => {
    for (const config of Object.values(FILM_PROFILE_CONFIGS)) {
      if (config.type === 'color') {
        expect(config.exposureBias.saturation).toBeGreaterThan(0);
      }
    }
  });

  it('brightness is a positive number for all profiles', () => {
    for (const config of Object.values(FILM_PROFILE_CONFIGS)) {
      expect(config.exposureBias.brightness).toBeGreaterThan(0);
    }
  });
});
