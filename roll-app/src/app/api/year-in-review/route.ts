import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface YearInReviewData {
  year: number;
  totalPhotosUploaded: number;
  totalRollsDeveloped: number;
  totalPrintsOrdered: number;
  favoriteFilmProfile: string | null;
  topMonth: { month: string; count: number } | null;
  circlesJoined: number;
  photosSharedToCircles: number;
  favoriteCount: number;
  firstPhotoDate: string | null;
  cameraBreakdown: { camera: string; count: number }[];
  sceneBreakdown: { scene: string; count: number }[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10);
    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year + 1}-01-01T00:00:00.000Z`;

    // Fetch photos uploaded this year
    const { data: photos, count: photoCount } = await supabase
      .from('photos')
      .select('date_taken, camera_make, camera_model, scene_classification, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    // Fetch rolls developed this year
    const { count: rollCount } = await supabase
      .from('rolls')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'developed')
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    // Favorite film profile
    const { data: filmProfileData } = await supabase
      .from('rolls')
      .select('film_profile')
      .eq('user_id', user.id)
      .eq('status', 'developed')
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    let favoriteFilmProfile: string | null = null;
    if (filmProfileData && filmProfileData.length > 0) {
      const profileCounts: Record<string, number> = {};
      for (const r of filmProfileData) {
        if (r.film_profile) {
          profileCounts[r.film_profile] = (profileCounts[r.film_profile] || 0) + 1;
        }
      }
      const sorted = Object.entries(profileCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) favoriteFilmProfile = sorted[0][0];
    }

    // Print orders this year
    const { count: printCount } = await supabase
      .from('print_orders')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    // Circles joined
    const { count: circleCount } = await supabase
      .from('circle_members')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('joined_at', startDate)
      .lt('joined_at', endDate);

    // Photos shared to circles
    const { count: sharedCount } = await supabase
      .from('circle_posts')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    // Favorites
    const { count: favCount } = await supabase
      .from('favorites')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    // Top month
    let topMonth: { month: string; count: number } | null = null;
    if (photos && photos.length > 0) {
      const monthCounts: Record<string, number> = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (const p of photos) {
        const d = new Date(p.date_taken || p.created_at);
        const key = monthNames[d.getMonth()];
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      }
      const sorted = Object.entries(monthCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) topMonth = { month: sorted[0][0], count: sorted[0][1] };
    }

    // First photo date
    let firstPhotoDate: string | null = null;
    if (photos && photos.length > 0) {
      const sorted = [...photos].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      firstPhotoDate = sorted[0].created_at;
    }

    // Camera breakdown
    const cameraCounts: Record<string, number> = {};
    for (const p of photos ?? []) {
      if (p.camera_make || p.camera_model) {
        const key = [p.camera_make, p.camera_model].filter(Boolean).join(' ');
        cameraCounts[key] = (cameraCounts[key] || 0) + 1;
      }
    }
    const cameraBreakdown = Object.entries(cameraCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([camera, count]) => ({ camera, count }));

    // Scene breakdown
    const sceneCounts: Record<string, number> = {};
    for (const p of photos ?? []) {
      if (p.scene_classification && Array.isArray(p.scene_classification)) {
        for (const scene of p.scene_classification) {
          sceneCounts[scene] = (sceneCounts[scene] || 0) + 1;
        }
      }
    }
    const sceneBreakdown = Object.entries(sceneCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([scene, count]) => ({ scene, count }));

    const result: YearInReviewData = {
      year,
      totalPhotosUploaded: photoCount ?? 0,
      totalRollsDeveloped: rollCount ?? 0,
      totalPrintsOrdered: printCount ?? 0,
      favoriteFilmProfile,
      topMonth,
      circlesJoined: circleCount ?? 0,
      photosSharedToCircles: sharedCount ?? 0,
      favoriteCount: favCount ?? 0,
      firstPhotoDate,
      cameraBreakdown,
      sceneBreakdown,
    };

    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
