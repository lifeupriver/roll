import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis } from '@/lib/admin/ai/analyzer';
import { captureError } from '@/lib/sentry';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Skip if no API key configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ message: 'ANTHROPIC_API_KEY not configured, skipping' });
  }

  try {
    const result = await runAnalysis('daily_briefing');

    return NextResponse.json({
      success: true,
      runId: result.runId,
      insightsGenerated: result.insights.length,
      tokensUsed: result.tokensUsed,
    });
  } catch (err) {
    captureError(err, { context: 'cron-daily-briefing' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
