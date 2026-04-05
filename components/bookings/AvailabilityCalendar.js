import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { addDays, isBefore, startOfDay } from 'date-fns';
import 'react-day-picker/dist/style.css';

export default function AvailabilityCalendar({ listingId, onRangeSelect }) {
  const [bookedRanges, setBookedRanges] = useState([]);
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const today = startOfDay(new Date());

  useEffect(() => {
    if (!listingId) return;
    const now = new Date();
    const threeMonths = new Date(now.getFullYear(), now.getMonth() + 3, 1);
    fetch(`/api/listings/${listingId}/availability?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        const ranges = [
          ...(data.data.bookings || []).map((b) => ({
            from: new Date(b.checkIn),
            to: addDays(new Date(b.checkOut), -1),
          })),
          ...(data.data.blockedDates || []).map((b) => ({
            from: new Date(b.start),
            to: addDays(new Date(b.end), -1),
          })),
        ];
        setBookedRanges(ranges);
      });
  }, [listingId]);

  function isDisabled(date) {
    if (isBefore(date, today)) return true;
    return bookedRanges.some(
      (r) => date >= startOfDay(r.from) && date <= startOfDay(r.to)
    );
  }

  function handleSelect(selected) {
    setRange(selected || { from: undefined, to: undefined });
    if (selected?.from && selected?.to) {
      onRangeSelect?.(selected.from, selected.to);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border p-2">
      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
        locale={fr}
        numberOfMonths={2}
        disabled={isDisabled}
        modifiersClassNames={{
          selected: 'rdp-day_selected',
          range_start: 'rdp-day_range_start',
          range_end: 'rdp-day_range_end',
          range_middle: 'rdp-day_range_middle',
        }}
        styles={{
          caption: { color: 'hsl(var(--foreground))' },
          day: { borderRadius: 'var(--radius-sm)' },
        }}
      />
    </div>
  );
}
