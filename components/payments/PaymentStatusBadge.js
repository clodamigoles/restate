import { PAYMENT_STATUS_LABELS, getLabel } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STYLES = {
  unpaid:    'bg-muted text-muted-foreground',
  pending:   'bg-warning/15 text-warning',
  paid:      'bg-success/15 text-success',
  refunded:  'bg-destructive/15 text-destructive',
};

export default function PaymentStatusBadge({ status }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      STYLES[status] || 'bg-muted text-muted-foreground'
    )}>
      {getLabel(PAYMENT_STATUS_LABELS, status)}
    </span>
  );
}
