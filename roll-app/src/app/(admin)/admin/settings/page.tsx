import { requireAdmin } from '@/lib/admin/middleware';
import { redirect } from 'next/navigation';

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/feed');

  return (
    <div className="space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Settings</h1>

      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 space-y-4">
        <h2 className="text-sm font-medium">Admin Account</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase tracking-[0.06em]">Email</p>
            <p className="mt-0.5">{admin.email}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase tracking-[0.06em]">User ID</p>
            <p className="mt-0.5 font-mono text-xs">{admin.id}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase tracking-[0.06em]">Role</p>
            <p className="mt-0.5">{admin.role}</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 space-y-4">
        <h2 className="text-sm font-medium">AI Analysis Configuration</h2>
        <p className="text-xs text-[var(--color-ink-tertiary)]">
          Set the <code className="font-mono bg-[var(--color-surface-sunken)] px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code> environment variable to enable AI-powered insights.
          The system uses Claude Sonnet for cost-efficient daily and weekly analysis.
        </p>
        <div className="text-xs text-[var(--color-ink-tertiary)]">
          <p>Estimated costs:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Daily briefing: ~$0.05-0.10 per run</li>
            <li>Weekly deep dive: ~$0.15-0.25 per run</li>
            <li>On-demand section analysis: ~$0.03-0.08 per run</li>
          </ul>
        </div>
      </div>

      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 space-y-4">
        <h2 className="text-sm font-medium">Environment</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            ['SUPABASE_SERVICE_ROLE_KEY', '••••••••'],
            ['ANTHROPIC_API_KEY', process.env.ANTHROPIC_API_KEY ? '••• configured' : 'not set'],
            ['STRIPE_SECRET_KEY', '••••••••'],
            ['PRODIGI_API_KEY', '••••••••'],
            ['R2_BUCKET_NAME', process.env.R2_BUCKET_NAME ?? 'not set'],
          ].map(([key, status]) => (
            <div key={key}>
              <p className="text-[var(--color-ink-tertiary)] font-mono">{key}</p>
              <p className="text-[var(--color-ink-secondary)]">{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
