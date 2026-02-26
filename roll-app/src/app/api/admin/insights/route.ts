import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';
import { isAdminPreviewMode, getMockInsightsResponse } from '@/lib/admin/mock-data';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (isAdminPreviewMode()) {
      const { searchParams } = new URL(request.url);
      return NextResponse.json(
        getMockInsightsResponse({
          section: searchParams.get('section') || '',
          severity: searchParams.get('severity') || '',
          acknowledged: searchParams.get('acknowledged') || undefined,
        })
      );
    }

    const db = getServiceClient();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || '';
    const severity = searchParams.get('severity') || '';
    const acknowledged = searchParams.get('acknowledged');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query = db
      .from('admin_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (section) query = query.eq('section', section);
    if (severity) query = query.eq('severity', severity);
    if (acknowledged === 'false') query = query.eq('acknowledged', false);
    if (acknowledged === 'true') query = query.eq('acknowledged', true);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Also get analysis run stats
    const { data: runs } = await db
      .from('admin_analysis_runs')
      .select(
        'id, type, status, insights_generated, tokens_used, cost_cents, created_at, completed_at'
      )
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      insights: data ?? [],
      recentRuns: runs ?? [],
    });
  } catch (err) {
    captureError(err, { context: 'admin-insights' });
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (isAdminPreviewMode()) {
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const { id, acknowledged } = body;

    if (!id) return NextResponse.json({ error: 'Missing insight id' }, { status: 400 });

    const db = getServiceClient();
    const { error } = await db
      .from('admin_insights')
      .update({
        acknowledged: acknowledged ?? true,
        acknowledged_by: admin.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    captureError(err, { context: 'admin-insights-update' });
    return NextResponse.json({ error: 'Failed to update insight' }, { status: 500 });
  }
}
