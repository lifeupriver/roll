import { describe, it, expect } from 'vitest';
import { hammingDistance, findDuplicates } from '@/lib/processing/duplicateDetection';

describe('hammingDistance', () => {
  it('returns 0 for identical hashes', () => {
    expect(hammingDistance('abcdef01', 'abcdef01')).toBe(0);
  });

  it('calculates correct distance for differing hashes', () => {
    // 'a' = 1010, 'b' = 1011 — 1 bit difference
    expect(hammingDistance('a', 'b')).toBe(1);
  });

  it('returns Infinity for different-length hashes', () => {
    expect(hammingDistance('abc', 'abcd')).toBe(Infinity);
  });

  it('returns max distance for completely different hashes', () => {
    // '0' = 0000, 'f' = 1111 — 4 bit difference
    expect(hammingDistance('0', 'f')).toBe(4);
  });

  it('handles empty strings', () => {
    expect(hammingDistance('', '')).toBe(0);
  });
});

describe('findDuplicates', () => {
  it('identifies duplicates with identical hashes', () => {
    const photos = [
      { id: 'a', phash: 'aaaa', aesthetic_score: 80 },
      { id: 'b', phash: 'aaaa', aesthetic_score: 60 },
    ];
    const duplicates = findDuplicates(photos);
    // 'b' has lower aesthetic score, should be the duplicate
    expect(duplicates.has('b')).toBe(true);
    expect(duplicates.has('a')).toBe(false);
  });

  it('keeps the photo with higher aesthetic score', () => {
    const photos = [
      { id: 'a', phash: 'aaaa', aesthetic_score: 50 },
      { id: 'b', phash: 'aaaa', aesthetic_score: 90 },
    ];
    const duplicates = findDuplicates(photos);
    // 'a' has lower score, should be marked as duplicate
    expect(duplicates.has('a')).toBe(true);
    expect(duplicates.has('b')).toBe(false);
  });

  it('returns empty set when no duplicates exist', () => {
    const photos = [
      { id: 'a', phash: '0000', aesthetic_score: 80 },
      { id: 'b', phash: 'ffff', aesthetic_score: 60 },
    ];
    const duplicates = findDuplicates(photos);
    expect(duplicates.size).toBe(0);
  });

  it('handles multiple groups of duplicates', () => {
    const photos = [
      { id: 'a1', phash: 'aaaa', aesthetic_score: 80 },
      { id: 'a2', phash: 'aaaa', aesthetic_score: 60 },
      { id: 'b1', phash: 'ffff', aesthetic_score: 70 },
      { id: 'b2', phash: 'ffff', aesthetic_score: 90 },
    ];
    const duplicates = findDuplicates(photos);
    expect(duplicates.has('a2')).toBe(true); // lower score in group A
    expect(duplicates.has('b1')).toBe(true); // lower score in group B
    expect(duplicates.has('a1')).toBe(false);
    expect(duplicates.has('b2')).toBe(false);
  });

  it('respects custom threshold', () => {
    const photos = [
      { id: 'a', phash: 'abcd', aesthetic_score: 80 },
      { id: 'b', phash: 'abce', aesthetic_score: 60 },
    ];
    // With strict threshold of 0, these should not be duplicates
    const strict = findDuplicates(photos, 0);
    expect(strict.size).toBe(0);

    // With loose threshold, they should be
    const loose = findDuplicates(photos, 20);
    expect(loose.size).toBe(1);
  });

  it('handles empty array', () => {
    const duplicates = findDuplicates([]);
    expect(duplicates.size).toBe(0);
  });

  it('handles single photo', () => {
    const duplicates = findDuplicates([{ id: 'a', phash: 'aaaa', aesthetic_score: 80 }]);
    expect(duplicates.size).toBe(0);
  });
});
