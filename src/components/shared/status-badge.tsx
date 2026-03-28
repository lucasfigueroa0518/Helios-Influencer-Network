import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  positive: { label: 'Positive', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  neutral: { label: 'Neutral', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  negative: { label: 'Negative', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
  spam: { label: 'Spam', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  unread: { label: 'Unread', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
  ai_drafted: { label: 'AI draft', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  sent: { label: 'Sent', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  ignored: { label: 'Ignored', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: 'Approved', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  publishing: { label: 'Publishing', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  published: { label: 'Published', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  healthy: { label: 'Healthy', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  degraded: { label: 'Degraded', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  error: { label: 'Error', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  unknown: { label: 'Unknown', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  revoked: { label: 'Revoked', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <Badge variant="secondary" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
