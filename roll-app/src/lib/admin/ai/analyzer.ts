import { getServiceClient } from '../service';
import { buildSystemSnapshot } from './aggregator';
import { buildDailyBriefingPrompt, buildWeeklyDeepDivePrompt, buildSectionAnalysisPrompt } from './prompts';
import { captureError } from '@/lib/sentry';

interface InsightPayload {
  type: string;
  severity: string;
  section: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
}

interface AnalysisResult {
  insights: InsightPayload[];
  tokensUsed: number;
  runId: string;
}

async function callClaude(prompt: string): Promise<{ content: string; tokensUsed: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text ?? '';
  const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);

  return { content, tokensUsed };
}

function parseInsights(rawResponse: string): InsightPayload[] {
  try {
    // Try to extract JSON array from the response
    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    const validTypes = ['anomaly', 'growth', 'cost', 'security', 'performance', 'churn', 'revenue'];
    const validSeverities = ['info', 'warning', 'critical'];
    const validSections = ['home', 'users', 'photos', 'rolls', 'orders', 'circles', 'pipeline', 'growth'];

    return parsed
      .filter((item: unknown): item is InsightPayload => {
        if (!item || typeof item !== 'object') return false;
        const i = item as Record<string, unknown>;
        return (
          typeof i.type === 'string' &&
          typeof i.severity === 'string' &&
          typeof i.section === 'string' &&
          typeof i.title === 'string' &&
          typeof i.body === 'string'
        );
      })
      .map((item) => ({
        type: validTypes.includes(item.type) ? item.type : 'anomaly',
        severity: validSeverities.includes(item.severity) ? item.severity : 'info',
        section: validSections.includes(item.section) ? item.section : 'home',
        title: item.title.slice(0, 200),
        body: item.body.slice(0, 2000),
        data: item.data && typeof item.data === 'object' ? item.data : {},
      }));
  } catch {
    return [];
  }
}

export async function runAnalysis(
  type: 'daily_briefing' | 'weekly_deep_dive' | 'on_demand' | 'section_analysis',
  section?: string
): Promise<AnalysisResult> {
  const db = getServiceClient();

  // Create analysis run record
  const { data: run, error: runError } = await db
    .from('admin_analysis_runs')
    .insert({
      type,
      section: section ?? null,
      status: 'running',
    })
    .select()
    .single();

  if (runError || !run) {
    throw new Error('Failed to create analysis run');
  }

  try {
    // Build data snapshot
    const periodDays = type === 'weekly_deep_dive' ? 7 : 1;
    const snapshot = await buildSystemSnapshot(periodDays);
    const snapshotStr = JSON.stringify(snapshot, null, 2);

    // Build prompt
    let prompt: string;
    switch (type) {
      case 'weekly_deep_dive':
        prompt = buildWeeklyDeepDivePrompt(snapshotStr);
        break;
      case 'section_analysis':
        prompt = buildSectionAnalysisPrompt(section ?? 'home', snapshotStr);
        break;
      default:
        prompt = buildDailyBriefingPrompt(snapshotStr);
    }

    // Call Claude
    const { content, tokensUsed } = await callClaude(prompt);

    // Parse insights
    const insights = parseInsights(content);

    // Store insights in DB
    if (insights.length > 0) {
      await db.from('admin_insights').insert(
        insights.map((insight) => ({
          type: insight.type,
          severity: insight.severity,
          section: insight.section,
          title: insight.title,
          body: insight.body,
          data: insight.data,
        }))
      );
    }

    // Estimate cost (Claude Sonnet pricing: ~$3/M input, $15/M output)
    const costCents = Math.ceil(tokensUsed * 0.001);

    // Update analysis run
    await db
      .from('admin_analysis_runs')
      .update({
        status: 'completed',
        input_summary: snapshot,
        output: { raw: content, parsed: insights },
        insights_generated: insights.length,
        tokens_used: tokensUsed,
        cost_cents: costCents,
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.id);

    return { insights, tokensUsed, runId: run.id };
  } catch (err) {
    // Update run as failed
    await db
      .from('admin_analysis_runs')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.id);

    captureError(err, { context: 'admin-ai-analysis', type, section });
    throw err;
  }
}
