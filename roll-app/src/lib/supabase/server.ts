import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Photo } from '@/types/photo';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookie setting will be handled by middleware
          }
        },
      },
    }
  );
}

export async function getServerSession() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function insertPhotos(photos: Partial<Photo>[]) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('photos')
    .insert(photos)
    .select();
  if (error) throw error;
  return data;
}

export async function getVisiblePhotos(
  userId: string,
  contentMode: 'all' | 'people' | 'landscapes' = 'all',
  cursor?: string,
  limit: number = 20
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('photos')
    .select('*')
    .eq('user_id', userId)
    .eq('filter_status', 'visible')
    .order('date_taken', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (contentMode === 'people') {
    query = query.gt('face_count', 0);
  } else if (contentMode === 'landscapes') {
    query = query.eq('face_count', 0).contains('scene_classification', ['landscape']);
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Photo[];
}

export async function getPhotoById(photoId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('id', photoId)
    .single();
  if (error) throw error;
  return data as Photo;
}

export async function updatePhotoFilterStatus(
  photoId: string,
  filterStatus: string,
  filterReason: string | null = null
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('photos')
    .update({ filter_status: filterStatus, filter_reason: filterReason })
    .eq('id', photoId)
    .select()
    .single();
  if (error) throw error;
  return data as Photo;
}

export async function hidePhoto(photoId: string) {
  return updatePhotoFilterStatus(photoId, 'hidden_manual', null);
}
