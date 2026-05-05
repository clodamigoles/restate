import { useState, useEffect, useMemo, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { isBefore, isAfter, startOfDay, addDays, isSameDay, format } from 'date-fns';
import 'react-day-picker/src/style.css';

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
  minNights = 1,
  maxNights,
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

  const disabledMatcher = useCallback((date) => {
    const d = startOfDay(date);
    if (isBefore(d, today)) return true;
    if (allDisabled.some((r) => d >= startOfDay(r.from) && d <= startOfDay(r.to))) return true;
    if (checkoutCutoff && (isAfter(d, checkoutCutoff) || isSameDay(d, checkoutCutoff))) return true;
    return false;
  }, [today, allDisabled, checkoutCutoff]);

  const pastMatcher  = useMemo(() => ({ before: today }), [today]);
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

  const hasArrival   = !!range?.from;
  const hasDeparture = !!range?.to;
  const step         = hasArrival && !hasDeparture ? 2 : 1;

  const arrivalLabel = hasArrival
    ? format(range.from, "d MMM yyyy", { locale: fr })
    : null;

  const departureLabel = hasDeparture
    ? format(range.to, "d MMM yyyy", { locale: fr })
    : null;

  const minDepartureLabel = hasArrival && minNights > 1
    ? format(addDays(range.from, minNights), "d MMM", { locale: fr })
    : null;

  const maxDepartureLabel = hasArrival && maxNights
    ? format(addDays(range.from, maxNights), "d MMM", { locale: fr })
    : null;

  return (
    <div className="cal-availability overflow-hidden rounded-xl border bg-card shadow-sm">

      {/* ── Indicateur d'étapes ── */}
      <div className="divide-y border-b">

        {/* Étape 1 — Arrivée */}
        <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${
          step === 1 && !hasArrival ? 'bg-primary/5' : ''
        }`}>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
            hasArrival
              ? 'bg-emerald-500 text-white'
              : 'bg-primary text-primary-foreground ring-2 ring-primary/30'
          }`}>
            {hasArrival ? '✓' : '1'}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${
              hasArrival ? 'text-emerald-600' : 'text-primary'
            }`}>
              Arrivée
            </p>
            <p className={`text-sm font-semibold ${
              hasArrival ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {arrivalLabel ?? 'Cliquez sur votre date d\'arrivée'}
            </p>
          </div>
        </div>

        {/* Étape 2 — Départ */}
        <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${
          step === 2 ? 'bg-primary/5' : ''
        }`}>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
            hasDeparture
              ? 'bg-emerald-500 text-white'
              : step === 2
              ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
              : 'border-2 border-muted-foreground/25 text-muted-foreground/50'
          }`}>
            {hasDeparture ? '✓' : '2'}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${
              hasDeparture ? 'text-emerald-600' : step === 2 ? 'text-primary' : 'text-muted-foreground/60'
            }`}>
              Départ
            </p>
            <p className={`text-sm font-semibold ${
              hasDeparture
                ? 'text-foreground'
                : step === 2
                ? 'text-muted-foreground'
                : 'text-muted-foreground/50'
            }`}>
              {departureLabel ?? (
                step === 2
                  ? minDepartureLabel
                    ? `Au plus tôt le ${minDepartureLabel}${maxDepartureLabel ? `, au plus tard le ${maxDepartureLabel}` : ''}`
                    : 'Cliquez sur votre date de départ'
                  : 'Après avoir choisi votre arrivée'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Légende ── */}
      <div className="flex items-center gap-5 border-b bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
            style={{
              background: 'repeating-linear-gradient(-45deg, hsl(0 90% 97%), hsl(0 90% 97%) 3px, hsl(0 90% 93%) 3px, hsl(0 90% 93%) 6px)',
            }}
          >
            <span className="text-[9px] font-semibold text-rose-400 line-through">5</span>
          </span>
          Réservé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-muted/70">
            <span className="text-[9px] font-semibold opacity-30 line-through">5</span>
          </span>
          Passé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary/50" />
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
