import { describe, it, expect } from 'vitest';
import {
  createRollSchema,
  updateRollSchema,
  createCircleSchema,
  createCirclePostSchema,
  createOrderSchema,
  presignUploadSchema,
  printCheckoutSchema,
  circleInviteSchema,
} from '@/lib/validation';

describe('createRollSchema', () => {
  it('accepts empty object (name is optional)', () => {
    expect(createRollSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a valid name', () => {
    const result = createRollSchema.safeParse({ name: 'My Roll' });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from name', () => {
    const result = createRollSchema.safeParse({ name: '  My Roll  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('My Roll');
  });

  it('rejects names exceeding 100 characters', () => {
    const result = createRollSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('updateRollSchema', () => {
  it('accepts valid status values', () => {
    expect(updateRollSchema.safeParse({ status: 'building' }).success).toBe(true);
    expect(updateRollSchema.safeParse({ status: 'ready' }).success).toBe(true);
    expect(updateRollSchema.safeParse({ status: 'developed' }).success).toBe(true);
  });

  it('rejects invalid status values', () => {
    expect(updateRollSchema.safeParse({ status: 'invalid' }).success).toBe(false);
  });

  it('accepts valid film_profile values', () => {
    expect(updateRollSchema.safeParse({ film_profile: 'warmth' }).success).toBe(true);
    expect(updateRollSchema.safeParse({ film_profile: 'golden' }).success).toBe(true);
  });

  it('rejects invalid film_profile values', () => {
    expect(updateRollSchema.safeParse({ film_profile: 'sepia' }).success).toBe(false);
  });

  it('rejects empty object (at least one field required)', () => {
    expect(updateRollSchema.safeParse({}).success).toBe(false);
  });
});

describe('createCircleSchema', () => {
  it('accepts valid input', () => {
    const result = createCircleSchema.safeParse({ name: 'Family' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(createCircleSchema.safeParse({ name: '' }).success).toBe(false);
    expect(createCircleSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('rejects names over 100 chars', () => {
    expect(createCircleSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
  });

  it('accepts optional coverPhotoUrl', () => {
    const result = createCircleSchema.safeParse({
      name: 'Test',
      coverPhotoUrl: 'https://example.com/img.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid coverPhotoUrl', () => {
    expect(createCircleSchema.safeParse({
      name: 'Test',
      coverPhotoUrl: 'not-a-url',
    }).success).toBe(false);
  });
});

describe('createCirclePostSchema', () => {
  it('accepts valid post', () => {
    const result = createCirclePostSchema.safeParse({
      photoStorageKeys: ['key1', 'key2'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty photoStorageKeys', () => {
    expect(createCirclePostSchema.safeParse({ photoStorageKeys: [] }).success).toBe(false);
  });

  it('limits caption to 500 chars', () => {
    expect(createCirclePostSchema.safeParse({
      caption: 'a'.repeat(501),
      photoStorageKeys: ['key1'],
    }).success).toBe(false);
  });
});

describe('createOrderSchema', () => {
  const validOrder = {
    rollId: '550e8400-e29b-41d4-a716-446655440000',
    product: 'roll_prints',
    printSize: '4x6',
    shipping: {
      name: 'John Doe',
      line1: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'US',
    },
  };

  it('accepts valid order', () => {
    expect(createOrderSchema.safeParse(validOrder).success).toBe(true);
  });

  it('rejects invalid printSize', () => {
    expect(createOrderSchema.safeParse({
      ...validOrder,
      printSize: '2x3',
    }).success).toBe(false);
  });

  it('rejects invalid product', () => {
    expect(createOrderSchema.safeParse({
      ...validOrder,
      product: 'poster',
    }).success).toBe(false);
  });

  it('rejects non-UUID rollId', () => {
    expect(createOrderSchema.safeParse({
      ...validOrder,
      rollId: 'not-a-uuid',
    }).success).toBe(false);
  });

  it('requires country to be exactly 2 characters', () => {
    expect(createOrderSchema.safeParse({
      ...validOrder,
      shipping: { ...validOrder.shipping, country: 'USA' },
    }).success).toBe(false);
  });
});

describe('presignUploadSchema', () => {
  it('accepts valid files', () => {
    const result = presignUploadSchema.safeParse({
      files: [{ filename: 'photo.jpg', contentType: 'image/jpeg', sizeBytes: 1024 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects unsupported content types', () => {
    expect(presignUploadSchema.safeParse({
      files: [{ filename: 'doc.pdf', contentType: 'application/pdf', sizeBytes: 1024 }],
    }).success).toBe(false);
  });

  it('rejects files exceeding 50MB', () => {
    expect(presignUploadSchema.safeParse({
      files: [{ filename: 'big.jpg', contentType: 'image/jpeg', sizeBytes: 51 * 1024 * 1024 }],
    }).success).toBe(false);
  });

  it('rejects empty files array', () => {
    expect(presignUploadSchema.safeParse({ files: [] }).success).toBe(false);
  });
});

describe('printCheckoutSchema', () => {
  it('accepts valid UUID orderId', () => {
    expect(printCheckoutSchema.safeParse({
      orderId: '550e8400-e29b-41d4-a716-446655440000',
    }).success).toBe(true);
  });

  it('rejects non-UUID orderId', () => {
    expect(printCheckoutSchema.safeParse({ orderId: 'abc' }).success).toBe(false);
  });
});

describe('circleInviteSchema', () => {
  it('accepts valid email', () => {
    expect(circleInviteSchema.safeParse({ email: 'test@example.com' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(circleInviteSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('accepts empty object (email is optional)', () => {
    expect(circleInviteSchema.safeParse({}).success).toBe(true);
  });
});
