-- ============================================================================
-- Admin Foundation Migration
-- Adds role column to profiles + admin audit log + admin insights tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add role column to profiles
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role) WHERE role = 'admin';

-- ---------------------------------------------------------------------------
-- 2. Admin audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX idx_admin_audit_log_target ON admin_audit_log(target_type, target_id) WHERE target_id IS NOT NULL;
CREATE INDEX idx_admin_audit_log_created ON admin_audit_log(created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit log (enforced at app level via service role)
-- No RLS policies needed since we use service role client

-- ---------------------------------------------------------------------------
-- 3. Admin insights (AI-generated)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('anomaly', 'growth', 'cost', 'security', 'performance', 'churn', 'revenue')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  section TEXT NOT NULL CHECK (section IN ('home', 'users', 'photos', 'rolls', 'orders', 'circles', 'pipeline', 'growth')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_insights_unacked ON admin_insights(created_at DESC) WHERE acknowledged = false;
CREATE INDEX idx_admin_insights_section ON admin_insights(section, created_at DESC);
CREATE INDEX idx_admin_insights_severity ON admin_insights(severity, created_at DESC);

ALTER TABLE admin_insights ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. AI analysis runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('daily_briefing', 'weekly_deep_dive', 'on_demand', 'section_analysis')),
  section TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_summary JSONB,
  output JSONB,
  insights_generated INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  cost_cents INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_admin_analysis_runs_status ON admin_analysis_runs(status, created_at DESC);

ALTER TABLE admin_analysis_runs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. Admin notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'order', 'roll')),
  target_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_notes_target ON admin_notes(target_type, target_id, created_at DESC);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
