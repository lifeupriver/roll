export type PrintProduct = 'roll_prints' | 'album_prints' | 'individual' | 'photo_book';
export type PrintSize = '3x5' | '4x6' | '5x7' | '8x10' | '6x6' | '8x8' | '10x10';
export type PrintOrderStatus = 'pending' | 'submitted' | 'in_production' | 'shipped' | 'delivered' | 'cancelled' | 'simulated';

export interface PrintOrder {
  id: string;
  user_id: string;
  roll_id: string | null;
  product: PrintProduct;
  print_size: PrintSize;
  photo_count: number;
  is_free_first_roll: boolean;

  // Shipping
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;

  // Prodigi integration
  prodigi_order_id: string | null;
  status: PrintOrderStatus;
  tracking_url: string | null;
  estimated_delivery: string | null;

  // Pricing
  subtotal_cents: number | null;
  shipping_cents: number | null;
  total_cents: number | null;

  created_at: string;
  updated_at: string;
}

export interface PrintOrderItem {
  id: string;
  order_id: string;
  photo_id: string;
  processed_storage_key: string;
  position: number;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
