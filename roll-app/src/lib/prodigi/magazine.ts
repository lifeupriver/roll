// Prodigi magazine/booklet product creation
// Phase 3.1.5

import type { MagazineFormat } from '@/types/magazine';

interface ProdigiMagazineOrder {
  merchantReference: string;
  shippingMethod: 'Budget' | 'Express' | 'Overnight';
  recipient: {
    name: string;
    line1: string;
    line2?: string;
    postalOrZipCode: string;
    countryCode: string;
    townOrCity: string;
    stateOrCounty?: string;
  };
  items: ProdigiMagazineItem[];
}

interface ProdigiMagazineItem {
  merchantReference: string;
  sku: string;
  copies: number;
  sizing: 'fillPrintArea';
  assets: ProdigiAsset[];
}

interface ProdigiAsset {
  printArea: string;
  url: string;
}

// Prodigi booklet/magazine SKUs (verify with Prodigi catalog)
const FORMAT_SKU_MAP: Record<MagazineFormat, string> = {
  '6x9': 'GLOBAL-BKL-6x9-STA-COV-MG',
  '8x10': 'GLOBAL-BKL-8x10-STA-COV-MG',
};

/**
 * Build a Prodigi order payload for a magazine.
 * Each page is provided as a PDF or image URL.
 */
export function buildMagazineOrder(params: {
  magazineId: string;
  format: MagazineFormat;
  pageUrls: string[];
  coverUrl: string;
  recipient: ProdigiMagazineOrder['recipient'];
  shippingMethod?: 'Budget' | 'Express' | 'Overnight';
  copies?: number;
}): ProdigiMagazineOrder {
  const { magazineId, format, pageUrls, coverUrl, recipient, shippingMethod = 'Budget', copies = 1 } = params;

  const assets: ProdigiAsset[] = [
    { printArea: 'cover', url: coverUrl },
    ...pageUrls.map((url, i) => ({
      printArea: `page_${i + 1}`,
      url,
    })),
  ];

  return {
    merchantReference: `magazine-${magazineId}`,
    shippingMethod,
    recipient,
    items: [
      {
        merchantReference: `magazine-item-${magazineId}`,
        sku: FORMAT_SKU_MAP[format],
        copies,
        sizing: 'fillPrintArea',
        assets,
      },
    ],
  };
}

// Price lookup (cents) by format and approximate page count bracket
const PRICE_TABLE: Record<MagazineFormat, Record<string, number>> = {
  '6x9': {
    '24': 1299,
    '36': 1599,
    '48': 1999,
  },
  '8x10': {
    '24': 1599,
    '36': 1999,
    '48': 2499,
  },
};

/**
 * Calculate magazine price in cents based on format and page count.
 */
export function calculateMagazinePrice(format: MagazineFormat, pageCount: number): number {
  const table = PRICE_TABLE[format];
  if (pageCount <= 24) return table['24'];
  if (pageCount <= 36) return table['36'];
  return table['48'];
}
