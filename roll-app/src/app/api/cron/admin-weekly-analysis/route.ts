import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/admin/ai/analyzer';
import { captureError } from '@/lib/sentry';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ message: 'ANTHROPIC_API_KEY not configured, skipping' });
  }

  try {
    const result = await runAnalysis('weekly_deep_dive');

    return NextResponse.json({
      success: true,
      runId: result.runId,
      insightsGenerated: result.insights.length,
      tokensUsed: result.tokensUsed,
    });
  } catch (err) {
    captureError(err, { context: 'cron-weekly-analysis' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
