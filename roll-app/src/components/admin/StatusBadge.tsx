const STATUS_STYLES: Record<string, string> = {
  // Roll statuses
  building: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ready: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  processing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  developed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',

  // Order statuses
  pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_production: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  simulated: 'bg-gray-500/10 text-gray-400 border-gray-500/20',

  // Processing job statuses
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',

  // Tiers
  free: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  plus: 'bg-amber-500/10 text-amber-400 border-amber-500/20',

  // Insight severity
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',

  // Filter statuses
  visible: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  filtered_auto: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  hidden_manual: 'bg-gray-500/10 text-gray-400 border-gray-500/20',

  // Referral statuses
  signed_up: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  converted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  const displayText = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-[0.04em] border ${style} ${className}`}
    >
      {displayText}
    </span>
  );
}
