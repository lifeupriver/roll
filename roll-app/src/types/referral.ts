export interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string;
  referred_user_id: string | null;
  referral_code: string;
  status: 'pending' | 'signed_up' | 'converted';
  reward_granted: boolean;
  created_at: string;
  converted_at: string | null;
}

export interface ReferralStats {
  totalInvited: number;
  totalSignedUp: number;
  totalConverted: number;
  referralCode: string;
}
