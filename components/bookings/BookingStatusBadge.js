import { BOOKING_STATUS_LABELS, getLabel } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STYLES = {
  pending:   'bg-warning/15 text-warning',
  confirmed: 'bg-success/15 text-success',
  cancelled: 'bg-destructive/15 text-destructive',
  completed: 'bg-muted text-muted-foreground',
};

export default function BookingStatusBadge({ status }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      STYLES[status] || 'bg-muted text-muted-foreground'
    )}>
      {getLabel(BOOKING_STATUS_LABELS, status)}
    </span>
  );
}
