import { useState, useEffect, useMemo, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { isBefore, isAfter, startOfDay, addDays, isSameDay } from 'date-fns';
import 'react-day-picker/src/style.css';

// DayButton personnalisé : reçoit `modifiers` de react-day-picker v9
function CalDayButton({ day, modifiers, className, children, ...buttonProps }) {
  return (
    <button
      {...buttonProps}
      className={[
        className,
        modifiers.past   ? 'cal-day-past'   : '',
        modifiers.booked ? 'cal-day-booked' : '',
      ].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  );
}

export default function AvailabilityCalendar({
  listingId,
  onRangeSelect,
  numberOfMonths = 1,
  extraDisabledRanges = [],
  range,
  onRangeChange,
}) {
  const [bookedRanges, setBookedRanges] = useState([]);
  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    if (!listingId) return;
    const now = new Date();
    fetch(`/api/listings/${listingId}/availability?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        const ranges = [
          ...(data.data.bookings || []).map((b) => ({
            from: startOfDay(new Date(b.checkIn)),
            to:   startOfDay(addDays(new Date(b.checkOut), -1)),
          })),
          ...(data.data.blockedDates || []).map((b) => ({
            from: startOfDay(new Date(b.start)),
            to:   startOfDay(addDays(new Date(b.end), -1)),
          })),
        ];
        setBookedRanges(ranges);
      });
  }, [listingId]);

  const allDisabled = useMemo(
    () => [...bookedRanges, ...extraDisabledRanges],
    [bookedRanges, extraDisabledRanges],
  );

  // Cutoff : première date réservée après l'arrivée choisie
  const checkoutCutoff = useMemo(() => {
    if (!range?.from || range?.to) return null;
    const from = startOfDay(range.from);
    let earliest = null;
    for (const r of allDisabled) {
      const blockStart = startOfDay(r.from);
      if (isAfter(blockStart, from) || isSameDay(blockStart, from)) {
        if (!earliest || isBefore(blockStart, earliest)) earliest = blockStart;
      }
    }
    return earliest;
  }, [range, allDisabled]);

  // Matcher pour bloquer l'interaction
  const disabledMatcher = useCallback((date) => {
    const d = startOfDay(date);
    if (isBefore(d, today)) return true;
    if (allDisabled.some((r) => d >= startOfDay(r.from) && d <= startOfDay(r.to))) return true;
    if (checkoutCutoff && (isAfter(d, checkoutCutoff) || isSameDay(d, checkoutCutoff))) return true;
    return false;
  }, [today, allDisabled, checkoutCutoff]);

  // Modifier visuel : dates passées (avant aujourd'hui)
  const pastMatcher = useMemo(() => ({ before: today }), [today]);

  // Modifier visuel : dates réservées/bloquées à venir
  const bookedMatcher = useCallback((date) => {
    const d = startOfDay(date);
    if (isBefore(d, today)) return false;
    return allDisabled.some((r) => d >= startOfDay(r.from) && d <= startOfDay(r.to));
  }, [today, allDisabled]);

  function handleSelect(selected) {
    const val = selected ?? { from: undefined, to: undefined };
    onRangeChange?.(val);
    if (val.from && val.to) onRangeSelect?.(val.from, val.to);
  }

  const pickingCheckout = range?.from && !range?.to;

  return (
    <div className="cal-availability overflow-hidden rounded-xl border bg-card shadow-lg">
      {/* Guidage contextuel */}
      <div className="border-b px-4 py-2.5 text-xs text-muted-foreground">
        {pickingCheckout ? (
          <span className="font-medium text-primary">
            Arrivée le {range.from.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — choisissez votre date de départ
          </span>
        ) : (
          <span>Sélectionnez votre date d&apos;arrivée</span>
        )}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-5 border-b px-4 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded" style={{
            background: 'repeating-linear-gradient(-45deg, hsl(0 90% 97%), hsl(0 90% 97%) 3px, hsl(0 90% 93%) 3px, hsl(0 90% 93%) 6px)',
          }}>
            <span className="text-[10px] font-medium leading-none text-rose-500" style={{ textDecoration: 'line-through' }}>
              8
            </span>
          </span>
          Réservé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-muted/60">
            <span className="text-[10px] font-medium leading-none opacity-30" style={{ textDecoration: 'line-through' }}>
              8
            </span>
          </span>
          Passé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
            <span className="text-[10px] font-medium leading-none text-primary">8</span>
          </span>
          Disponible
        </span>
      </div>

      <DayPicker
        mode="range"
        min={1}
        selected={range}
        onSelect={handleSelect}
        locale={fr}
        numberOfMonths={numberOfMonths}
        disabled={disabledMatcher}
        modifiers={{ past: pastMatcher, booked: bookedMatcher }}
        components={{ DayButton: CalDayButton }}
        excludeDisabled
        startMonth={today}
        className="p-3"
      />
    </div>
  );
}
