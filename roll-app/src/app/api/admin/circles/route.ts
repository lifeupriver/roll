import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const db = getServiceClient();

    const [circlesRes, postsRes, reactionsRes, commentsRes] = await Promise.all([
      db.from('circles').select('id, name, member_count, created_at').order('member_count', { ascending: false }),
      db.from('circle_posts').select('id, circle_id, created_at'),
      db.from('circle_reactions').select('id', { count: 'exact', head: true }),
      db.from('circle_comments').select('id', { count: 'exact', head: true }),
    ]);

    const circles = circlesRes.data ?? [];
    const posts = postsRes.data ?? [];

    const avgMembers = circles.length > 0
      ? circles.reduce((sum, c) => sum + c.member_count, 0) / circles.length
      : 0;

    // Posts per circle
    const postsPerCircle: Record<string, number> = {};
    for (const p of posts) {
      postsPerCircle[p.circle_id] = (postsPerCircle[p.circle_id] || 0) + 1;
    }

    const topCircles = circles.slice(0, 20).map((c) => ({
      ...c,
      postCount: postsPerCircle[c.id] ?? 0,
    }));

    return NextResponse.json({
      total: circles.length,
      totalPosts: posts.length,
      totalReactions: reactionsRes.count ?? 0,
      totalComments: commentsRes.count ?? 0,
      avgMembers: avgMembers.toFixed(1),
      topCircles,
    });
  } catch (err) {
    captureError(err, { context: 'admin-circles' });
    return NextResponse.json({ error: 'Failed to load circle analytics' }, { status: 500 });
  }
}
