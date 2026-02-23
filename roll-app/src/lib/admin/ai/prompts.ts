export const SYSTEM_CONTEXT = `You are the AI operations analyst for Roll, a photo printing app.

How the app works:
- Users upload photos from their camera roll
- An AI pipeline automatically filters out bad photos (blurry, screenshots, duplicates, bad exposure, documents)
- Users build "rolls" of up to 36 photos and choose a film profile (warmth, golden, vivid, classic, gentle, modern)
- Rolls are "developed" — photos are processed with the chosen film profile
- Users can order physical prints (4x6, 5x7) via Prodigi fulfillment
- First roll of prints is free to attract new users
- Revenue comes from Plus subscriptions and print orders
- Users can create social "circles" to share photos with friends/family

You analyze system data and produce actionable insights for the admin.`;

export function buildDailyBriefingPrompt(snapshot: string): string {
  return `${SYSTEM_CONTEXT}

Analyze today's system snapshot and produce 3-7 actionable insights.

SYSTEM SNAPSHOT:
${snapshot}

Return a JSON array of insights. Each insight must have this exact structure:
[{
  "type": "anomaly" | "growth" | "cost" | "security" | "performance" | "churn" | "revenue",
  "severity": "info" | "warning" | "critical",
  "section": "home" | "users" | "photos" | "rolls" | "orders" | "circles" | "pipeline" | "growth",
  "title": "Short headline (max 80 chars)",
  "body": "2-3 sentence explanation with specific numbers and a recommended action",
  "data": {}
}]

Focus on:
1. Anomalies compared to historical norms (sudden changes)
2. Actionable growth opportunities (specific user behaviors that correlate with conversion)
3. Cost inefficiencies (free rolls ROI, processing costs)
4. Churn risks (inactive Plus subscribers, users who stopped engaging)
5. Revenue optimization opportunities
6. Performance issues (queue backups, error rates)
7. Security concerns (unusual upload patterns, abuse)

Be specific with numbers. Every insight should have a clear recommended action.
Return ONLY the JSON array, no other text.`;
}

export function buildWeeklyDeepDivePrompt(snapshot: string): string {
  return `${SYSTEM_CONTEXT}

Perform a deep weekly analysis and produce 5-10 strategic insights.

WEEKLY SYSTEM SNAPSHOT:
${snapshot}

Return a JSON array of insights with the same structure as the daily briefing but focused on:
1. Week-over-week trends and what they mean
2. Cohort behavior patterns
3. Strategic recommendations for growing the business
4. Product improvement suggestions based on usage patterns
5. Pricing and monetization opportunities
6. User experience improvements suggested by the data

Be strategic and thoughtful. Connect multiple data points to form deeper insights.
Return ONLY the JSON array, no other text.`;
}

export function buildSectionAnalysisPrompt(section: string, sectionData: string): string {
  return `${SYSTEM_CONTEXT}

Perform a focused analysis of the "${section}" section and produce 2-5 insights.

SECTION DATA:
${sectionData}

Return a JSON array of insights focused specifically on this section.
Each insight should have actionable recommendations.
Return ONLY the JSON array, no other text.`;
}
