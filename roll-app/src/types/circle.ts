export interface Circle {
  id: string;
  creator_id: string;
  name: string;
  cover_photo_url: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'creator' | 'member';
  joined_at: string;
  // Joined from profiles
  profiles?: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface CircleInvite {
  id: string;
  circle_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  consumed_at: string | null;
  consumed_by: string | null;
  created_at: string;
}

export interface CirclePost {
  id: string;
  circle_id: string;
  user_id: string;
  caption: string | null;
  created_at: string;
  // Joined data
  photos?: CirclePostPhoto[];
  profiles?: {
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  reactions?: CircleReaction[];
}

export interface CirclePostPhoto {
  id: string;
  post_id: string;
  storage_key: string;
  position: number;
}

export type ReactionType = 'heart' | 'smile' | 'wow';

export interface CircleReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}
