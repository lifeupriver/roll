import { create } from 'zustand';
import type { Circle, CirclePost, CircleMember, CircleReaction, ReactionType } from '@/types/circle';

interface CircleState {
  circles: Circle[];
  currentCircle: Circle | null;
  members: CircleMember[];
  posts: CirclePost[];
  loading: boolean;

  setCircles: (circles: Circle[]) => void;
  setCurrentCircle: (circle: Circle | null) => void;
  setMembers: (members: CircleMember[]) => void;
  setPosts: (posts: CirclePost[]) => void;
  addPost: (post: CirclePost) => void;
  addReaction: (postId: string, reaction: CircleReaction) => void;
  removeReaction: (postId: string, userId: string, reactionType: ReactionType) => void;
  reset: () => void;
}

export const useCircleStore = create<CircleState>((set, _get) => ({
  circles: [],
  currentCircle: null,
  members: [],
  posts: [],
  loading: false,

  setCircles: (circles) => set({ circles }),

  setCurrentCircle: (circle) => set({ currentCircle: circle }),

  setMembers: (members) => set({ members }),

  setPosts: (posts) => set({ posts }),

  addPost: (post) =>
    set((state) => ({
      posts: [post, ...state.posts],
    })),

  addReaction: (postId, reaction) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, reactions: [...(post.reactions ?? []), reaction] }
          : post
      ),
    })),

  removeReaction: (postId, userId, reactionType) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              reactions: (post.reactions ?? []).filter(
                (r) => !(r.user_id === userId && r.reaction_type === reactionType)
              ),
            }
          : post
      ),
    })),

  reset: () =>
    set({ circles: [], currentCircle: null, members: [], posts: [], loading: false }),
}));
