import { getServiceClient } from './service';
import { captureError } from '@/lib/sentry';

interface AuditEntry {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Log an admin action to the audit trail.
 * Fire-and-forget — errors are captured but don't block the caller.
 */
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  metadata,
  ipAddress,
}: AuditEntry): Promise<void> {
  try {
    const service = getServiceClient();
    await service.from('admin_audit_log').insert({
      admin_id: adminId,
      action,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      metadata: metadata ?? {},
      ip_address: ipAddress ?? null,
    });
  } catch (err) {
    captureError(err, { context: 'admin-audit', action });
  }
}
