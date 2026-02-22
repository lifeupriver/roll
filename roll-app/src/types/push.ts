export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
  created_at: string;
  updated_at: string;
}

export type NotificationCategory =
  | 'roll_ready'       // Roll has been developed
  | 'print_shipped'    // Print order shipped
  | 'circle_invite'    // Invited to a circle
  | 'circle_activity'  // New photo in a circle
  | 'referral_signup'; // Referral converted

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: {
    url?: string;
    category?: NotificationCategory;
  };
}

export interface NotificationPreferences {
  roll_ready: boolean;
  print_shipped: boolean;
  circle_invite: boolean;
  circle_activity: boolean;
  referral_signup: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  roll_ready: true,
  print_shipped: true,
  circle_invite: true,
  circle_activity: true,
  referral_signup: true,
};
