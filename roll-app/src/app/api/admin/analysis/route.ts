import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { runAnalysis } from '@/lib/admin/ai/analyzer';
import { logAdminAction } from '@/lib/admin/audit';
import { captureError } from '@/lib/sentry';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const type = body.type || 'on_demand';
    const section = body.section || undefined;

    const validTypes = ['daily_briefing', 'weekly_deep_dive', 'on_demand', 'section_analysis'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    await logAdminAction({
      adminId: admin.id,
      action: 'analysis.trigger',
      metadata: { type, section },
    });

    const result = await runAnalysis(type, section);

    return NextResponse.json({
      runId: result.runId,
      insightsGenerated: result.insights.length,
      tokensUsed: result.tokensUsed,
      insights: result.insights,
    });
  } catch (err) {
    captureError(err, { context: 'admin-analysis-trigger' });
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
